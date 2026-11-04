import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  formatSentinelLog,
  formatSentinelPayload,
  getSentinelStatusFilePath,
  writeSentinelStatus,
} from '../../server/utils/scanner/sentinel'
import type { ScanReport, SentinelCronStatusPayload } from '../../server/utils/scanner/types'

const TEST_DIR = path.join(process.cwd(), 'sentinel')
const TEST_SENTINEL_FILE = path.join(TEST_DIR, 'test-cron-status.json')

describe('Scanner Sentinel Integration', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_SENTINEL_FILE)) {
      fs.unlinkSync(TEST_SENTINEL_FILE)
    }
  })

  afterEach(() => {
    if (fs.existsSync(TEST_SENTINEL_FILE)) {
      fs.unlinkSync(TEST_SENTINEL_FILE)
    }
  })

  it('formats concise log for an OK report', () => {
    const report: ScanReport = {
      timestamp: '2026-11-02T22:00:00Z',
      status: 'OK',
      durationMs: 1200,
      summary: { total: 2, ok: 2, updated: 0, error: 0 },
      sources: [
        {
          id: 'lol',
          name: 'League of Legends',
          game: 'lol',
          syncMode: 'automatic',
          status: 'OK',
          durationMs: 500,
        },
        {
          id: 'valorant',
          name: 'Valorant',
          game: 'valorant',
          syncMode: 'automatic',
          status: 'OK',
          durationMs: 700,
        },
      ],
    }

    const log = formatSentinelLog(report)
    expect(log).toContain('Statut: OK')
    expect(log).toContain('League of Legends: OK')
    expect(log).toContain('Valorant: OK')
  })

  it('formats log with details and manual action flag on update', () => {
    const report: ScanReport = {
      timestamp: '2026-11-02T22:00:00Z',
      status: 'UPDATED',
      durationMs: 2500,
      summary: { total: 2, ok: 1, updated: 1, error: 0 },
      sources: [
        {
          id: 'lol',
          name: 'League of Legends',
          game: 'lol',
          syncMode: 'automatic',
          status: 'OK',
          durationMs: 500,
        },
        {
          id: 'hots',
          name: 'Heroes of the Storm',
          game: 'hots',
          syncMode: 'manual_action_required',
          status: 'UPDATED',
          durationMs: 600,
          currentSnapshot: {
            version: '2.57.1',
            fingerprint: 'fp-hots',
            lastSuccessfulScan: '2026-11-02T22:00:00Z',
          },
          diffs: [{ field: 'version', previous: '2.57.0', current: '2.57.1' }],
        },
      ],
    }

    const log = formatSentinelLog(report)
    expect(log).toContain('Statut: UPDATED')
    expect(log).toContain('⚠️ ACTION REQUISE')
    expect(log).toContain('version: "2.57.0" -> "2.57.1"')
  })

  it('formats payload with last_status=success on OK or UPDATED', () => {
    const report: ScanReport = {
      timestamp: '2026-11-02T22:00:00Z',
      status: 'UPDATED',
      durationMs: 3400,
      summary: { total: 1, ok: 0, updated: 1, error: 0 },
      sources: [],
    }

    const payload = formatSentinelPayload(report)
    expect(payload.jobs).toHaveLength(1)
    expect(payload.cron_jobs).toHaveLength(1)
    expect(payload.jobs).toEqual(payload.cron_jobs)
    expect(payload.jobs[0].name).toBe('daily-data-scan')
    expect(payload.jobs[0].last_status).toBe('success')
    expect(payload.jobs[0].last_duration).toBe(3)
    expect(payload.jobs[0].command).toBe('npm run scan:data')
  })

  it('formats payload with last_status=failed on DEGRADED or ERROR', () => {
    const degradedReport: ScanReport = {
      timestamp: '2026-11-02T22:00:00Z',
      status: 'DEGRADED',
      durationMs: 4000,
      summary: { total: 2, ok: 1, updated: 0, error: 1 },
      sources: [
        {
          id: 'valorant',
          name: 'Valorant',
          game: 'valorant',
          syncMode: 'automatic',
          status: 'ERROR',
          error: 'Gateway Timeout',
          durationMs: 3000,
        },
      ],
    }

    const payload = formatSentinelPayload(degradedReport)
    expect(payload.jobs[0].last_status).toBe('failed')
    expect(payload.cron_jobs[0].last_status).toBe('failed')
    expect(payload.jobs[0].last_log).toContain('Gateway Timeout')
  })

  it('writes Sentinel status payload atomically to disk with jobs and cron_jobs', () => {
    const jobEntry = {
      name: 'daily-data-scan',
      command: 'npm run scan:data',
      schedule: '0 3 * * *',
      last_execution_at: '2026-11-02T22:00:00Z',
      last_status: 'success' as const,
      last_duration: 2,
      last_log: 'Tout est OK',
    }
    const mockPayload: SentinelCronStatusPayload = {
      jobs: [jobEntry],
      cron_jobs: [jobEntry],
    }

    writeSentinelStatus(mockPayload, TEST_SENTINEL_FILE)

    expect(fs.existsSync(TEST_SENTINEL_FILE)).toBe(true)
    const raw = fs.readFileSync(TEST_SENTINEL_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    expect(parsed.jobs[0].last_log).toBe('Tout est OK')
    expect(parsed.cron_jobs[0].last_log).toBe('Tout est OK')
  })

  it('respects SENTINEL_STATUS_FILE environment variable', () => {
    const orig = process.env.SENTINEL_STATUS_FILE
    try {
      process.env.SENTINEL_STATUS_FILE = '/custom/sentinel/cron-status.json'
      expect(getSentinelStatusFilePath()).toBe('/custom/sentinel/cron-status.json')
    } finally {
      if (orig !== undefined) process.env.SENTINEL_STATUS_FILE = orig
      else delete process.env.SENTINEL_STATUS_FILE
    }
  })
})
