import type { H3Event } from 'h3'
import { defineEventHandler } from 'h3'
import { assertScanAuthorized } from '../../utils/scanner/auth'
import { getStoredSnapshots } from '../../utils/scanner/storage'

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  assertScanAuthorized(event, config.scanSecret as string | undefined)

  const snapshots = getStoredSnapshots()

  return {
    lastScan: snapshots.lastScan,
    version: snapshots.version,
    sourcesCount: Object.keys(snapshots.sources).length,
    sources: snapshots.sources,
  }
})
