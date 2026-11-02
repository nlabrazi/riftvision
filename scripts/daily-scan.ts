#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { runDailyScan } from '../server/utils/scanner/scanEngine'
import {
  DEFAULT_SENTINEL_FILE,
  formatSentinelPayload,
  writeSentinelStatus,
} from '../server/utils/scanner/sentinel'

const args = process.argv.slice(2)
const isJson = args.includes('--json')
const isSilent = args.includes('--silent')
const isDryRun = args.includes('--dry-run')
const withSentinel = args.includes('--sentinel')
const allowDegraded = args.includes('--allow-degraded')
const withReport = args.includes('--report')

const sentinelFileIndex = args.indexOf('--sentinel-file')
const sentinelFile =
  sentinelFileIndex !== -1 && args[sentinelFileIndex + 1]
    ? args[sentinelFileIndex + 1]
    : DEFAULT_SENTINEL_FILE

const reportFileIndex = args.indexOf('--report-file')
const reportFile =
  reportFileIndex !== -1 && args[reportFileIndex + 1]
    ? args[reportFileIndex + 1]
    : path.join(process.cwd(), 'server', 'data', 'scan-report.json')

async function main() {
  const startTime = Date.now()

  try {
    const report = await runDailyScan({
      persist: !isDryRun,
    })

    if (withSentinel) {
      const sentinelPayload = formatSentinelPayload(report)
      writeSentinelStatus(sentinelPayload, sentinelFile)
    }

    if (withReport) {
      const reportDir = path.dirname(reportFile)
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true })
      }
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8')
    }

    if (isJson) {
      console.log(JSON.stringify(report, null, 2))
    } else if (!isSilent) {
      printHumanReport(report)
    }

    // Détermination du code de retour
    if (report.status === 'ERROR') {
      process.exit(1)
    }
    if (report.status === 'DEGRADED' && !allowDegraded) {
      process.exit(1)
    }

    process.exit(0)
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err)
    if (!isSilent) {
      console.error('[RiftVision Scan CLI] Erreur fatale non interceptée :', message)
    }
    if (withSentinel) {
      try {
        const errorPayload = formatSentinelPayload(
          {
            timestamp: new Date().toISOString(),
            status: 'ERROR',
            durationMs: Date.now() - startTime,
            summary: { total: 0, ok: 0, updated: 0, error: 1 },
            sources: [],
          },
          { last_status: 'failed', last_log: `Crash fatal : ${message}` },
        )
        writeSentinelStatus(errorPayload, sentinelFile)
      } catch {
        // Ignorer l'erreur d'écriture d'urgence
      }
    }
    process.exit(1)
  }
}

function printHumanReport(
  report: ReturnType<typeof runDailyScan> extends Promise<infer R> ? R : never,
) {
  const statusColors: Record<string, string> = {
    OK: '\x1b[32mOK\x1b[0m',
    UPDATED: '\x1b[33mUPDATED\x1b[0m',
    DEGRADED: '\x1b[35mDEGRADED\x1b[0m',
    ERROR: '\x1b[31mERROR\x1b[0m',
  }

  console.log('\n============================================================')
  console.log('       🔍 RiftVision — Daily Data Scan Report')
  console.log('============================================================')
  console.log(`Horodatage : ${report.timestamp}`)
  console.log(`Durée      : ${report.durationMs}ms`)
  console.log(`Statut     : ${statusColors[report.status] ?? report.status}`)
  console.log(
    `Bilan      : ${report.summary.total} sources | ${report.summary.ok} OK | ${report.summary.updated} UPDATED | ${report.summary.error} ERROR\n`,
  )

  for (const s of report.sources) {
    const symbol = s.status === 'OK' ? '✓' : s.status === 'UPDATED' ? '✦' : '✗'
    const color = s.status === 'OK' ? '\x1b[32m' : s.status === 'UPDATED' ? '\x1b[33m' : '\x1b[31m'
    const reset = '\x1b[0m'

    let label = `${color}${symbol} [${s.status}] ${s.name}${reset}`
    if (s.syncMode === 'manual_action_required') {
      label += ' \x1b[43m\x1b[30m[ACTION REQUISE]\x1b[0m'
    }
    console.log(`${label} (${s.durationMs}ms)`)

    if (s.message) {
      console.log(`   Message : ${s.message}`)
    }
    if (s.diffs && s.diffs.length > 0) {
      for (const d of s.diffs) {
        console.log(
          `   Diff    : ${d.field} -> ${JSON.stringify(d.current)} (précédent: ${JSON.stringify(d.previous)})`,
        )
      }
    }
    if (s.error) {
      console.log(`   Erreur  : \x1b[31m${s.error}\x1b[0m`)
    }
    console.log('')
  }
  console.log('============================================================\n')
}

main()
