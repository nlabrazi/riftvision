import fs from 'node:fs'
import path from 'node:path'
import type { ScanSnapshots } from './types'

export const DEFAULT_DATA_DIR = path.join(process.cwd(), 'server', 'data')
export const DEFAULT_SNAPSHOTS_FILE = path.join(DEFAULT_DATA_DIR, 'scan-snapshots.json')

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
export function getStoredSnapshots(filePath: string = DEFAULT_SNAPSHOTS_FILE): ScanSnapshots {
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
  filePath: string = DEFAULT_SNAPSHOTS_FILE,
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
export function clearStoredSnapshots(filePath: string = DEFAULT_SNAPSHOTS_FILE): void {
  try {
    ensureDirectoryExists(filePath)
    const empty = createEmptySnapshots()
    fs.writeFileSync(filePath, JSON.stringify(empty, null, 2), 'utf-8')
  } catch (err) {
    console.error('[RiftVision Scanner] Erreur de réinitialisation des snapshots :', err)
  }
}

