export type ScanStatus = 'OK' | 'UPDATED' | 'DEGRADED' | 'ERROR'

export type SourceStatus = 'OK' | 'UPDATED' | 'ERROR'

export type SyncMode = 'automatic' | 'manual_action_required'

export type GameId = 'lol' | 'tft' | 'valorant' | 'wow' | 'hots'

export interface SourceDiff {
  field: string
  previous: unknown
  current: unknown
}

export interface SourceSnapshot {
  version?: string
  fingerprint: string
  metadata?: Record<string, unknown>
  lastSuccessfulScan: string
}

export interface ScanSnapshots {
  version: 1
  lastScan: string
  sources: Record<string, SourceSnapshot>
}

export interface SourceReport {
  id: string
  name: string
  game: GameId
  syncMode: SyncMode
  status: SourceStatus
  message?: string
  diffs?: SourceDiff[]
  durationMs: number
  currentSnapshot?: SourceSnapshot
  error?: string
}

export interface ScanReport {
  timestamp: string
  status: ScanStatus
  durationMs: number
  summary: {
    total: number
    ok: number
    updated: number
    error: number
  }
  sources: SourceReport[]
}

export interface SentinelCronJobEntry {
  name: string
  command: string
  schedule: string
  last_execution_at: string
  last_status: 'success' | 'failed'
  last_duration: number
  last_log: string
}

export interface SentinelCronStatusPayload {
  cron_jobs: SentinelCronJobEntry[]
}

export interface SourceInspection {
  id: string
  name: string
  game: GameId
  syncMode: SyncMode
  version?: string
  fingerprint: string
  metadata?: Record<string, unknown>
}

export interface SourceAdapter {
  id: string
  name: string
  game: GameId
  syncMode: SyncMode
  inspect: () => Promise<SourceInspection>
}
