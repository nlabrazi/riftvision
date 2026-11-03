import { createDefaultSourceAdapters } from './sources'
import { DEFAULT_SNAPSHOTS_FILE, getStoredSnapshots, saveSnapshots } from './storage'
import type {
  ScanReport,
  ScanSnapshots,
  ScanStatus,
  SourceAdapter,
  SourceDiff,
  SourceInspection,
  SourceReport,
  SourceSnapshot,
} from './types'

export interface ScanEngineOptions {
  adapters?: SourceAdapter[]
  storagePath?: string
  timeoutMs?: number
  retryAttempts?: number
  retryDelayMs?: number
  now?: () => number
  persist?: boolean
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage = 'Délai d’attente dépassé',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms)
    promise
      .then((val) => {
        clearTimeout(timer)
        resolve(val)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

async function withRetry<T>(fn: () => Promise<T>, attempts: number, delayMs: number): Promise<T> {
  let lastError: unknown
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < attempts && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  throw lastError
}

function computeDiffs(prev: SourceSnapshot | undefined, current: SourceInspection): SourceDiff[] {
  if (!prev) {
    return []
  }

  const diffs: SourceDiff[] = []

  if (prev.version !== current.version) {
    diffs.push({
      field: 'version',
      previous: prev.version ?? null,
      current: current.version ?? null,
    })
  }

  if (prev.fingerprint !== current.fingerprint) {
    diffs.push({
      field: 'fingerprint',
      previous: prev.fingerprint,
      current: current.fingerprint,
    })
  }

  const prevMeta = prev.metadata ?? {}
  const currMeta = current.metadata ?? {}
  const allKeys = Array.from(new Set([...Object.keys(prevMeta), ...Object.keys(currMeta)]))

  for (const key of allKeys) {
    if (prevMeta[key] !== currMeta[key]) {
      diffs.push({
        field: `metadata.${key}`,
        previous: prevMeta[key] ?? null,
        current: currMeta[key] ?? null,
      })
    }
  }

  return diffs
}

export async function runDailyScan(options: ScanEngineOptions = {}): Promise<ScanReport> {
  const {
    adapters = createDefaultSourceAdapters(),
    storagePath = DEFAULT_SNAPSHOTS_FILE,
    timeoutMs = 6000,
    retryAttempts = 1,
    retryDelayMs = 50,
    now = Date.now,
    persist = true,
  } = options

  const startTime = now()
  const startedAt = new Date(startTime).toISOString()
  const previousSnapshots = getStoredSnapshots(storagePath)
  const updatedSources: Record<string, SourceSnapshot> = { ...previousSnapshots.sources }

  const inspectPromises = adapters.map(async (adapter): Promise<SourceReport> => {
    const sourceStart = now()
    try {
      const inspection = await withRetry(
        () => withTimeout(adapter.inspect(), timeoutMs, `Timeout dépassé pour ${adapter.name}`),
        retryAttempts,
        retryDelayMs,
      )

      const prevSnapshot = previousSnapshots.sources[adapter.id]
      const isInitial = !prevSnapshot
      const hasChanged = !isInitial && prevSnapshot.fingerprint !== inspection.fingerprint
      const diffs = hasChanged ? computeDiffs(prevSnapshot, inspection) : []

      const currentSnapshot: SourceSnapshot = {
        version: inspection.version,
        fingerprint: inspection.fingerprint,
        metadata: inspection.metadata,
        lastSuccessfulScan: startedAt,
      }

      // Mise à jour de la persistance sélective pour cette source
      updatedSources[adapter.id] = currentSnapshot

      let message = 'Aucun changement détecté'
      if (isInitial) {
        message = 'Initialisation du snapshot pour cette source'
      } else if (hasChanged) {
        message =
          adapter.syncMode === 'manual_action_required'
            ? `Nouveautés détectées — action manuelle requise (${adapter.name})`
            : `Mise à jour détectée (${adapter.name})`
      }

      return {
        id: adapter.id,
        name: adapter.name,
        game: adapter.game,
        syncMode: adapter.syncMode,
        status: hasChanged ? 'UPDATED' : 'OK',
        message,
        diffs,
        durationMs: now() - sourceStart,
        currentSnapshot,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      return {
        id: adapter.id,
        name: adapter.name,
        game: adapter.game,
        syncMode: adapter.syncMode,
        status: 'ERROR',
        error: errorMessage,
        message: `Erreur lors du scan : ${errorMessage}`,
        durationMs: now() - sourceStart,
        currentSnapshot: previousSnapshots.sources[adapter.id],
      }
    }
  })

  const sourceReports = await Promise.all(inspectPromises)

  const summary = {
    total: sourceReports.length,
    ok: sourceReports.filter((s) => s.status === 'OK').length,
    updated: sourceReports.filter((s) => s.status === 'UPDATED').length,
    error: sourceReports.filter((s) => s.status === 'ERROR').length,
  }

  let status: ScanStatus = 'OK'
  if (summary.error === summary.total && summary.total > 0) {
    status = 'ERROR'
  } else if (summary.error > 0) {
    status = 'DEGRADED'
  } else if (summary.updated > 0) {
    status = 'UPDATED'
  }

  if (persist) {
    const finalSnapshots: ScanSnapshots = {
      version: 1,
      lastScan: startedAt,
      sources: updatedSources,
    }
    saveSnapshots(finalSnapshots, storagePath)
  }

  return {
    timestamp: startedAt,
    status,
    durationMs: now() - startTime,
    summary,
    sources: sourceReports,
  }
}
