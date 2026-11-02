import type { H3Event } from 'h3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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

describe('Scanner API Authentication', () => {
  const originalEnvSecret = process.env.NUXT_SCAN_SECRET

  beforeEach(() => {
    delete process.env.NUXT_SCAN_SECRET
    delete process.env.SCAN_SECRET
  })

  afterEach(() => {
    if (originalEnvSecret !== undefined) {
      process.env.NUXT_SCAN_SECRET = originalEnvSecret
    } else {
      delete process.env.NUXT_SCAN_SECRET
    }
  })

  it('extracts token from Authorization: Bearer header', () => {
    const event = createMockEvent({ authorization: 'Bearer super-secret-123' })
    expect(extractScanToken(event)).toBe('super-secret-123')
  })

  it('extracts token from x-scan-secret header', () => {
    const event = createMockEvent({ 'x-scan-secret': 'custom-header-secret' })
    expect(extractScanToken(event)).toBe('custom-header-secret')
  })

  it('returns null when no authorization header is present', () => {
    const event = createMockEvent()
    expect(extractScanToken(event)).toBeNull()
  })

  it('throws 403 when no secret is configured on the server', () => {
    const event = createMockEvent({ authorization: 'Bearer any-token' })
    expect(() => assertScanAuthorized(event, '')).toThrowError(/secret de scan non configuré/)
  })

  it('throws 401 when token is missing', () => {
    const event = createMockEvent()
    expect(() => assertScanAuthorized(event, 'expected-secret')).toThrowError(/Non autorisé/)
  })

  it('throws 401 when token is invalid', () => {
    const event = createMockEvent({ authorization: 'Bearer wrong-token' })
    expect(() => assertScanAuthorized(event, 'expected-secret')).toThrowError(/Non autorisé/)
  })

  it('authorizes successfully when token matches configured secret', () => {
    const event = createMockEvent({ authorization: 'Bearer valid-secret' })
    expect(() => assertScanAuthorized(event, 'valid-secret')).not.toThrow()
  })

  it('authorizes successfully when secret is provided via environment variable', () => {
    process.env.NUXT_SCAN_SECRET = 'env-secret-456'
    const event = createMockEvent({ 'x-scan-secret': 'env-secret-456' })
    expect(() => assertScanAuthorized(event)).not.toThrow()
  })
})
