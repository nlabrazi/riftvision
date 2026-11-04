import fs from 'node:fs'
import path from 'node:path'
import type { ScanReport, SentinelCronJobEntry, SentinelCronStatusPayload } from './types'

export function getSentinelStatusFilePath(): string {
  return (
    process.env.SENTINEL_STATUS_FILE ||
    process.env.SENTINEL_FILE ||
    path.join(process.cwd(), 'sentinel', 'cron-status.json')
  )
}

export const DEFAULT_SENTINEL_FILE = getSentinelStatusFilePath()

/**
 * Produit un résumé textuel clair et concis (taille maximale de 4000 octets pour Sentinel).
 */
export function formatSentinelLog(report: ScanReport): string {
  const parts: string[] = []

  // Entête du statut global
  let header = `Statut: ${report.status}`
  if (report.status === 'ERROR') {
    header += ` (${report.summary.error}/${report.summary.total} échecs)`
  } else if (report.status === 'DEGRADED') {
    header += ` (${report.summary.error} erreur(s), ${report.summary.ok + report.summary.updated} succès)`
  } else if (report.status === 'UPDATED') {
    header += ` (${report.summary.updated} source(s) modifiée(s))`
  }
  parts.push(header)

  // Détail ligne par ligne pour chaque jeu
  const sourcesSummary = report.sources
    .map((s) => {
      let detail = `${s.name}: ${s.status}`
      if (s.status === 'ERROR') {
        detail += ` (${s.error ?? 'Erreur inconnue'})`
      } else if (s.status === 'UPDATED') {
        const versionStr = s.currentSnapshot?.version ? ` [${s.currentSnapshot.version}]` : ''
        const manualFlag = s.syncMode === 'manual_action_required' ? ' ⚠️ ACTION REQUISE' : ''
        detail += `${versionStr}${manualFlag}`
      }
      return detail
    })
    .join(' | ')

  parts.push(sourcesSummary)

  // Diffs notables éventuels
  const notableDiffs = report.sources
    .filter((s) => s.status === 'UPDATED' && s.diffs && s.diffs.length > 0)
    .map((s) => {
      const diffList = s.diffs
        ?.map((d) => `${d.field}: ${JSON.stringify(d.previous)} -> ${JSON.stringify(d.current)}`)
        .join(', ')
      return `• ${s.name}: ${diffList}`
    })

  if (notableDiffs.length > 0) {
    parts.push(`Détails:\n${notableDiffs.join('\n')}`)
  }

  const fullText = parts.join('\n\n')
  return fullText.slice(0, 4000)
}

/**
 * Formate le payload attendu par Sentinel dans cron-status.json.
 */
export function formatSentinelPayload(
  report: ScanReport,
  overrides: Partial<SentinelCronJobEntry> = {},
): SentinelCronStatusPayload {
  const last_status: 'success' | 'failed' =
    report.status === 'OK' || report.status === 'UPDATED' ? 'success' : 'failed'

  const jobEntry: SentinelCronJobEntry = {
    name: overrides.name ?? 'daily-data-scan',
    command: overrides.command ?? 'npm run scan:data',
    schedule: overrides.schedule ?? '0 3 * * *',
    last_execution_at: report.timestamp,
    last_status: overrides.last_status ?? last_status,
    last_duration: overrides.last_duration ?? Math.max(1, Math.round(report.durationMs / 1000)),
    last_log: overrides.last_log ?? formatSentinelLog(report),
  }

  return {
    jobs: [jobEntry],
    cron_jobs: [jobEntry],
  }
}

/**
 * Écrit de manière atomique le payload dans le fichier cron-status.json de Sentinel.
 */
export function writeSentinelStatus(
  payload: SentinelCronStatusPayload,
  filePath: string = getSentinelStatusFilePath(),
): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const tempFile = `${filePath}.tmp.${Date.now()}`
  fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8')
  fs.renameSync(tempFile, filePath)
}
