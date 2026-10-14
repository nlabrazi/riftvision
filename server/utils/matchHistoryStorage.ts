import fs from 'node:fs'
import path from 'node:path'
import type { SavedMatch } from '../../shared/types/history'

const DATA_DIR = path.join(process.cwd(), 'server', 'data')
const HISTORY_FILE = path.join(DATA_DIR, 'match-history.json')

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

/**
 * Lit et retourne l'historique des matchs sauvegardés
 */
export function getStoredMatches(): SavedMatch[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return []
    }
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedMatch[]) : []
  } catch (err) {
    console.error('[RiftVision History] Erreur de lecture de l’historique :', err)
    return []
  }
}

/**
 * Sauvegarde un match dans le fichier JSON local (max 50 matchs, les plus récents en premier)
 */
export function saveMatch(match: SavedMatch): SavedMatch[] {
  try {
    ensureDirectoryExists()
    const matches = getStoredMatches()

    // Déduplication par ID ou par timestamp similaire (+/- 5s)
    const filtered = matches.filter(
      (m) => m.id !== match.id && Math.abs(m.timestamp - match.timestamp) > 5000,
    )

    const updated = [match, ...filtered].slice(0, 50)
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2), 'utf-8')
    console.log(
      `[RiftVision History] Match sauvegardé : ${match.championName} (${match.result}) · Total: ${updated.length}`,
    )
    return updated
  } catch (err) {
    console.error('[RiftVision History] Erreur d’écriture de l’historique :', err)
    return getStoredMatches()
  }
}

/**
 * Supprime un match spécifique par son ID
 */
export function deleteStoredMatch(matchId: string): boolean {
  try {
    const matches = getStoredMatches()
    const updated = matches.filter((m) => m.id !== matchId)
    if (updated.length === matches.length) return false

    ensureDirectoryExists()
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('[RiftVision History] Erreur de suppression de match :', err)
    return false
  }
}

/**
 * Réinitialise complètement l'historique local
 */
export function clearAllStoredMatches(): void {
  try {
    ensureDirectoryExists()
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8')
  } catch (err) {
    console.error('[RiftVision History] Erreur de réinitialisation de l’historique :', err)
  }
}
