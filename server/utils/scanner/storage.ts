import fs from 'node:fs'
import path from 'node:path'
import type { ScanSnapshots } from './types'

export function getScannerDataDir(): string {
  return process.env.SCAN_DATA_DIR || path.join(process.cwd(), 'server', 'data')
}

export function getSnapshotsFilePath(): string {
  return (
    process.env.SCAN_STORAGE_PATH ||
    process.env.SCAN_SNAPSHOTS_FILE ||
    path.join(getScannerDataDir(), 'scan-snapshots.json')
  )
}

export function getReportFilePath(): string {
  return (
    process.env.SCAN_REPORT_PATH ||
    process.env.SCAN_REPORT_FILE ||
    path.join(getScannerDataDir(), 'scan-report.json')
  )
}

export const DEFAULT_DATA_DIR = getScannerDataDir()
export const DEFAULT_SNAPSHOTS_FILE = getSnapshotsFilePath()

export function createEmptySnapshots(): ScanSnapshots {
  return {
    version: 1,
    lastScan: '',
    sources: {},
  }
}

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Lit et retourne les snapshots enregistrés.
 * Si le fichier n'existe pas ou est corrompu, retourne une structure vierge.
 */
export function getStoredSnapshots(filePath: string = getSnapshotsFilePath()): ScanSnapshots {
  try {
    if (!fs.existsSync(filePath)) {
      return createEmptySnapshots()
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.version === 1 &&
      typeof parsed.sources === 'object' &&
      parsed.sources !== null
    ) {
      return parsed as ScanSnapshots
    }
    return createEmptySnapshots()
  } catch {
    return createEmptySnapshots()
  }
}

/**
 * Sauvegarde les snapshots de façon sécurisée (écriture atomique temporaire puis renommage).
 */
export function saveSnapshots(
  snapshots: ScanSnapshots,
  filePath: string = getSnapshotsFilePath(),
): void {
  ensureDirectoryExists(filePath)
  const tempFile = `${filePath}.tmp.${Date.now()}`
  const serialized = JSON.stringify(snapshots, null, 2)
  fs.writeFileSync(tempFile, serialized, 'utf-8')
  fs.renameSync(tempFile, filePath)
}

/**
 * Réinitialise complètement le fichier de snapshots.
 */
export function clearStoredSnapshots(filePath: string = getSnapshotsFilePath()): void {
  try {
    ensureDirectoryExists(filePath)
    const empty = createEmptySnapshots()
    fs.writeFileSync(filePath, JSON.stringify(empty, null, 2), 'utf-8')
  } catch (err) {
    console.error('[RiftVision Scanner] Erreur de réinitialisation des snapshots :', err)
  }
}
