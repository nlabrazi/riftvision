import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runDailyScan } from '../../server/utils/scanner/scanEngine'
import { getStoredSnapshots, saveSnapshots } from '../../server/utils/scanner/storage'
import type { SourceAdapter } from '../../server/utils/scanner/types'

const TEST_DIR = path.join(process.cwd(), 'server', 'data')
const TEST_STORAGE = path.join(TEST_DIR, 'test-engine-snapshots.json')

function createMockAdapter(
  id: string,
  name: string,
  syncMode: 'automatic' | 'manual_action_required' = 'automatic',
  data: { version?: string; fingerprint: string; metadata?: Record<string, unknown> } = {
    version: '1.0.0',
    fingerprint: 'fp-default',
  },
): SourceAdapter {
  return {
    id,
    name,
    game: 'lol',
    syncMode,
    inspect: async () => ({
      id,
      name,
      game: 'lol',
      syncMode,
      version: data.version,
      fingerprint: data.fingerprint,
      metadata: data.metadata,
    }),
  }
}

describe('Scanner Engine', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_STORAGE)) {
      fs.unlinkSync(TEST_STORAGE)
    }
  })

  afterEach(() => {
    if (fs.existsSync(TEST_STORAGE)) {
      fs.unlinkSync(TEST_STORAGE)
    }
  })

  it('performs initial scan, detects initialization as UPDATED, and persists snapshots', async () => {
    const adapter1 = createMockAdapter('src1', 'Source 1', 'automatic', {
      version: '1.0.0',
      fingerprint: 'fp-1',
    })
    const adapter2 = createMockAdapter('src2', 'Source 2', 'automatic', {
      version: '2.0.0',
      fingerprint: 'fp-2',
    })

    const report = await runDailyScan({
      adapters: [adapter1, adapter2],
      storagePath: TEST_STORAGE,
      persist: true,
    })

    expect(report.status).toBe('UPDATED')
    expect(report.summary.total).toBe(2)
    expect(report.summary.updated).toBe(2)
    expect(report.summary.ok).toBe(0)
    expect(report.summary.error).toBe(0)

    const saved = getStoredSnapshots(TEST_STORAGE)
    expect(saved.sources.src1.fingerprint).toBe('fp-1')
    expect(saved.sources.src2.fingerprint).toBe('fp-2')
  })

  it('returns OK status when no changes are detected on subsequent scan', async () => {
    const adapter = createMockAdapter('src1', 'Source 1', 'automatic', {
      version: '1.0.0',
      fingerprint: 'fp-1',
    })

    // Premier scan pour initialiser
    await runDailyScan({
      adapters: [adapter],
      storagePath: TEST_STORAGE,
      persist: true,
    })

    // Second scan avec les mêmes données
    const secondReport = await runDailyScan({
      adapters: [adapter],
      storagePath: TEST_STORAGE,
      persist: true,
    })

    expect(secondReport.status).toBe('OK')
    expect(secondReport.summary.ok).toBe(1)
    expect(secondReport.summary.updated).toBe(0)
    expect(secondReport.sources[0].status).toBe('OK')
    expect(secondReport.sources[0].diffs).toEqual([])
  })

  it('detects changes and computes field-level diffs', async () => {
    saveSnapshots(
      {
        version: 1,
        lastScan: '2026-11-01T00:00:00.000Z',
        sources: {
          lol: {
            version: '14.21.1',
            fingerprint: 'fp-old',
            metadata: { latestPatchTitle: 'Patch 14.21' },
            lastSuccessfulScan: '2026-11-01T00:00:00.000Z',
          },
        },
      },
      TEST_STORAGE,
    )

    const updatedAdapter = createMockAdapter('lol', 'League of Legends', 'automatic', {
      version: '14.22.1',
      fingerprint: 'fp-new',
      metadata: { latestPatchTitle: 'Patch 14.22' },
    })

    const report = await runDailyScan({
      adapters: [updatedAdapter],
      storagePath: TEST_STORAGE,
      persist: true,
    })

    expect(report.status).toBe('UPDATED')
    expect(report.sources[0].status).toBe('UPDATED')
    expect(report.sources[0].diffs).toEqual(
      expect.arrayContaining([
        { field: 'version', previous: '14.21.1', current: '14.22.1' },
        { field: 'fingerprint', previous: 'fp-old', current: 'fp-new' },
        { field: 'metadata.latestPatchTitle', previous: 'Patch 14.21', current: 'Patch 14.22' },
      ]),
    )
  })

  it('formats warning message for manual_action_required sources on update', async () => {
    saveSnapshots(
      {
        version: 1,
        lastScan: '2026-11-01T00:00:00.000Z',
        sources: {
          hots: {
            version: '2.57.0',
            fingerprint: 'fp-hots-old',
            lastSuccessfulScan: '2026-11-01T00:00:00.000Z',
          },
        },
      },
      TEST_STORAGE,
    )

    const hotsAdapter = createMockAdapter('hots', 'Heroes of the Storm', 'manual_action_required', {
      version: '2.57.0',
      fingerprint: 'fp-hots-new',
    })

    const report = await runDailyScan({
      adapters: [hotsAdapter],
      storagePath: TEST_STORAGE,
    })

    expect(report.status).toBe('UPDATED')
    expect(report.sources[0].message).toContain('action manuelle requise')
  })

  it('resolves to DEGRADED state on partial source failure and preserves previous snapshot', async () => {
    saveSnapshots(
      {
        version: 1,
        lastScan: '2026-11-01T00:00:00.000Z',
        sources: {
          src_fail: {
            version: '1.0.0',
            fingerprint: 'fp-fail-old',
            lastSuccessfulScan: '2026-11-01T00:00:00.000Z',
          },
        },
      },
      TEST_STORAGE,
    )

    const okAdapter = createMockAdapter('src_ok', 'Source OK', 'automatic', {
      version: '1.0.0',
      fingerprint: 'fp-ok',
    })
    const failingAdapter: SourceAdapter = {
      id: 'src_fail',
      name: 'Source Failing',
      game: 'valorant',
      syncMode: 'automatic',
      inspect: async () => {
        throw new Error('API 503 Service Unavailable')
      },
    }

    const report = await runDailyScan({
      adapters: [okAdapter, failingAdapter],
      storagePath: TEST_STORAGE,
      retryAttempts: 0,
      persist: true,
    })

    expect(report.status).toBe('DEGRADED')
    expect(report.summary.ok).toBe(0)
    expect(report.summary.updated).toBe(1) // src_ok is first-time updated
    expect(report.summary.error).toBe(1)

    // Vérifie que le snapshot de la source en échec n'a pas été écrasé
    const saved = getStoredSnapshots(TEST_STORAGE)
    expect(saved.sources.src_fail.fingerprint).toBe('fp-fail-old')
    expect(saved.sources.src_ok.fingerprint).toBe('fp-ok')
  })

  it('resolves to ERROR state when all sources fail', async () => {
    const failing1: SourceAdapter = {
      id: 'src1',
      name: 'Source 1',
      game: 'wow',
      syncMode: 'automatic',
      inspect: async () => {
        throw new Error('Network error')
      },
    }
    const failing2: SourceAdapter = {
      id: 'src2',
      name: 'Source 2',
      game: 'hots',
      syncMode: 'automatic',
      inspect: async () => {
        throw new Error('Timeout')
      },
    }

    const report = await runDailyScan({
      adapters: [failing1, failing2],
      storagePath: TEST_STORAGE,
      retryAttempts: 0,
    })

    expect(report.status).toBe('ERROR')
    expect(report.summary.error).toBe(2)
  })

  it('recovers with retry when source initially fails', async () => {
    let callCount = 0
    const flakyAdapter: SourceAdapter = {
      id: 'flaky',
      name: 'Flaky Source',
      game: 'lol',
      syncMode: 'automatic',
      inspect: async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('Temporary glitch')
        }
        return {
          id: 'flaky',
          name: 'Flaky Source',
          game: 'lol',
          syncMode: 'automatic',
          fingerprint: 'fp-flaky',
        }
      },
    }

    const report = await runDailyScan({
      adapters: [flakyAdapter],
      storagePath: TEST_STORAGE,
      retryAttempts: 1,
      retryDelayMs: 10,
    })

    expect(report.status).toBe('UPDATED')
    expect(report.summary.error).toBe(0)
    expect(callCount).toBe(2)
  })

  it('times out and reports ERROR when source inspection hangs', async () => {
    const hangingAdapter: SourceAdapter = {
      id: 'hanging',
      name: 'Hanging Source',
      game: 'valorant',
      syncMode: 'automatic',
      inspect: () => new Promise((resolve) => setTimeout(resolve, 500)),
    }

    const report = await runDailyScan({
      adapters: [hangingAdapter],
      storagePath: TEST_STORAGE,
      timeoutMs: 50,
      retryAttempts: 0,
    })

    expect(report.status).toBe('ERROR')
    expect(report.sources[0].status).toBe('ERROR')
    expect(report.sources[0].error).toContain('Timeout')
  })

  it('respects persist=false flag and leaves storage untouched', async () => {
    const adapter = createMockAdapter('src1', 'Source 1', 'automatic')

    await runDailyScan({
      adapters: [adapter],
      storagePath: TEST_STORAGE,
      persist: false,
    })

    expect(fs.existsSync(TEST_STORAGE)).toBe(false)
  })
})
