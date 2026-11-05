import fs from 'node:fs'
import path from 'node:path'
import type { H3Event } from 'h3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assertMutationAuthorized, extractAuthToken } from '../../server/utils/auth'
import { assertScanAuthorized, extractScanToken } from '../../server/utils/scanner/auth'

function createMockEvent(headers: Record<string, string> = {}): H3Event {
  return {
    node: {
      req: {
        headers,
      },
    },
  } as unknown as H3Event
}

describe('API Authentication and Security Utilities', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.NUXT_ADMIN_SECRET
    delete process.env.ADMIN_SECRET
    delete process.env.NUXT_SCAN_SECRET
    delete process.env.SCAN_SECRET
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('extractAuthToken', () => {
    it('extracts token from Authorization: Bearer header', () => {
      const event = createMockEvent({ authorization: 'Bearer secret-key-xyz' })
      expect(extractAuthToken(event)).toBe('secret-key-xyz')
      expect(extractScanToken(event)).toBe('secret-key-xyz')
    })

    it('extracts token from x-admin-secret header', () => {
      const event = createMockEvent({ 'x-admin-secret': 'admin-secret-xyz' })
      expect(extractAuthToken(event)).toBe('admin-secret-xyz')
    })

    it('extracts token from x-scan-secret header', () => {
      const event = createMockEvent({ 'x-scan-secret': 'scan-secret-xyz' })
      expect(extractAuthToken(event)).toBe('scan-secret-xyz')
    })

    it('returns null when no authentication header is supplied', () => {
      const event = createMockEvent()
      expect(extractAuthToken(event)).toBeNull()
    })
  })

  describe('assertScanAuthorized', () => {
    it('throws 403 when no scan secret is configured on the server', () => {
      const event = createMockEvent({ authorization: 'Bearer some-token' })
      expect(() => assertScanAuthorized(event, '')).toThrowError(/secret de scan non configuré/)
    })

    it('throws 401 when token is missing', () => {
      const event = createMockEvent()
      expect(() => assertScanAuthorized(event, 'valid-secret')).toThrowError(/Non autorisé/)
    })

    it('throws 401 when token is invalid', () => {
      const event = createMockEvent({ authorization: 'Bearer wrong-secret' })
      expect(() => assertScanAuthorized(event, 'valid-secret')).toThrowError(/Non autorisé/)
    })

    it('succeeds when token matches configured secret', () => {
      const event = createMockEvent({ authorization: 'Bearer valid-secret' })
      expect(() => assertScanAuthorized(event, 'valid-secret')).not.toThrow()
    })
  })

  describe('assertMutationAuthorized', () => {
    it('allows mutation requests in development mode without token or secret', () => {
      const event = createMockEvent()
      expect(() => assertMutationAuthorized(event, { forceProduction: false })).not.toThrow()
    })

    it('throws 403 in production when no secret is configured on the server', () => {
      const event = createMockEvent({ authorization: 'Bearer any-token' })
      expect(() =>
        assertMutationAuthorized(event, { forceProduction: true, configuredSecret: '' }),
      ).toThrowError(/aucun secret d’administration configuré/)
    })

    it('throws 403 in production when request has no authentication token', () => {
      const event = createMockEvent()
      expect(() =>
        assertMutationAuthorized(event, {
          forceProduction: true,
          configuredSecret: 'prod-secret-999',
        }),
      ).toThrowError(/authentification requise/)
    })

    it('throws 401 in production when token is incorrect', () => {
      const event = createMockEvent({ authorization: 'Bearer fake-token' })
      expect(() =>
        assertMutationAuthorized(event, {
          forceProduction: true,
          configuredSecret: 'prod-secret-999',
        }),
      ).toThrowError(/token d’administration invalide/)
    })

    it('authorizes in production with Bearer token matching configuredSecret', () => {
      const event = createMockEvent({ authorization: 'Bearer prod-secret-999' })
      expect(() =>
        assertMutationAuthorized(event, {
          forceProduction: true,
          configuredSecret: 'prod-secret-999',
        }),
      ).not.toThrow()
    })

    it('authorizes in production with x-admin-secret header matching NUXT_ADMIN_SECRET', () => {
      process.env.NUXT_ADMIN_SECRET = 'admin-pass-123'
      const event = createMockEvent({ 'x-admin-secret': 'admin-pass-123' })
      expect(() => assertMutationAuthorized(event, { forceProduction: true })).not.toThrow()
    })

    it('authorizes in production with x-scan-secret header matching NUXT_SCAN_SECRET', () => {
      process.env.NUXT_SCAN_SECRET = 'scan-pass-456'
      const event = createMockEvent({ 'x-scan-secret': 'scan-pass-456' })
      expect(() => assertMutationAuthorized(event, { forceProduction: true })).not.toThrow()
    })
  })

  describe('.dockerignore validation', () => {
    it('excludes .env files and preserves .env.example', () => {
      const dockerignorePath = path.resolve(process.cwd(), '.dockerignore')
      expect(fs.existsSync(dockerignorePath)).toBe(true)

      const lines = fs
        .readFileSync(dockerignorePath, 'utf-8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('#'))

      // Doit inclure l'exclusion de .env et l'exception pour .env.example
      const hasEnvRule = lines.includes('.env') || lines.includes('.env*')
      const hasExampleException = lines.includes('!.env.example')

      expect(hasEnvRule).toBe(true)
      expect(hasExampleException).toBe(true)
    })
  })
})
