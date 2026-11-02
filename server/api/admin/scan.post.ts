import type { H3Event } from 'h3'
import { defineEventHandler, readBody } from 'h3'
import { assertScanAuthorized } from '../../utils/scanner/auth'
import { runDailyScan } from '../../utils/scanner/scanEngine'
import { formatSentinelPayload, writeSentinelStatus } from '../../utils/scanner/sentinel'

export interface ScanPostPayload {
  persist?: boolean
  withSentinel?: boolean
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  assertScanAuthorized(event, config.scanSecret as string | undefined)

  let body: ScanPostPayload = {}
  try {
    body = (await readBody<ScanPostPayload>(event)) ?? {}
  } catch {
    body = {}
  }

  const persist = body.persist !== false
  const withSentinel = Boolean(body.withSentinel)

  const report = await runDailyScan({
    persist,
  })

  if (withSentinel) {
    try {
      const sentinelPayload = formatSentinelPayload(report)
      writeSentinelStatus(sentinelPayload)
    } catch (err) {
      console.warn('[RiftVision Admin Scan] Impossible d’écrire sentinel/cron-status.json :', err)
    }
  }

  return report
})
