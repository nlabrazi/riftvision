export const DDRAGON_VERSION = '14.18.1'
export const DDRAGON_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`

const CHAMPION_NAME_MAP: Record<string, string> = {
  Wukong: 'MonkeyKing',
  Renata: 'Renata',
  'Renata Glasc': 'Renata',
  Nunu: 'Nunu',
  'Nunu & Willump': 'Nunu',
  "Cho'Gath": 'Chogath',
  "Kai'Sa": 'Kaisa',
  "Kha'Zix": 'Khazix',
  LeBlanc: 'Leblanc',
  "Vel'Koz": 'Velkoz',
  "Bel'Veth": 'Belveth',
  "K'Sante": 'KSante',
  FiddleSticks: 'Fiddlesticks',
}

/**
 * Standardize champion name to match Riot Data Dragon naming conventions
 */
export function formatChampionNameForDDragon(rawName: string): string {
  if (!rawName) return 'Unknown'
  const trimmed = rawName.trim()
  if (CHAMPION_NAME_MAP[trimmed]) {
    return CHAMPION_NAME_MAP[trimmed]
  }
  // Remove spaces, apostrophes and dots
  return trimmed.replace(/['\s.]/g, '')
}

/**
 * Get champion square avatar URL from Data Dragon CDN
 */
export function getChampionIconUrl(championName: string): string {
  const formatted = formatChampionNameForDDragon(championName)
  return `${DDRAGON_BASE_URL}/img/champion/${formatted}.png`
}

/**
 * Get item icon URL from Data Dragon CDN
 */
export function getItemIconUrl(itemId: number): string {
  if (!itemId || itemId <= 0) {
    return ''
  }
  return `${DDRAGON_BASE_URL}/img/item/${itemId}.png`
}

/**
 * Format game seconds into mm:ss
 */
export function formatSecondsToTime(seconds: number): string {
  if (typeof seconds !== 'number' || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
