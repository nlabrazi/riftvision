export const DDRAGON_VERSION = '16.20.1'
export const DDRAGON_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`

const CHAMPION_NAME_MAP: Record<string, string> = {
  wukong: 'MonkeyKing',
  monkeyking: 'MonkeyKing',
  renata: 'Renata',
  'renata glasc': 'Renata',
  renataglasc: 'Renata',
  nunu: 'Nunu',
  'nunu & willump': 'Nunu',
  'nunu and willump': 'Nunu',
  nunuwillump: 'Nunu',
  "cho'gath": 'Chogath',
  chogath: 'Chogath',
  "kai'sa": 'Kaisa',
  kaisa: 'Kaisa',
  "kha'zix": 'Khazix',
  khazix: 'Khazix',
  leblanc: 'Leblanc',
  "vel'koz": 'Velkoz',
  velkoz: 'Velkoz',
  "bel'veth": 'Belveth',
  belveth: 'Belveth',
  "k'sante": 'KSante',
  ksante: 'KSante',
  fiddlesticks: 'Fiddlesticks',
  drmundo: 'DrMundo',
  'dr. mundo': 'DrMundo',
  'dr mundo': 'DrMundo',
  jarvaniv: 'JarvanIV',
  'jarvan iv': 'JarvanIV',
  kogmaw: 'KogMaw',
  "kog'maw": 'KogMaw',
  leesin: 'LeeSin',
  'lee sin': 'LeeSin',
  masteryi: 'MasterYi',
  'master yi': 'MasterYi',
  missfortune: 'MissFortune',
  'miss fortune': 'MissFortune',
  reksai: 'RekSai',
  "rek'sai": 'RekSai',
  tahmkench: 'TahmKench',
  'tahm kench': 'TahmKench',
  twistedfate: 'TwistedFate',
  'twisted fate': 'TwistedFate',
  xinzhao: 'XinZhao',
  'xin zhao': 'XinZhao',
  aurelionsol: 'AurelionSol',
  'aurelion sol': 'AurelionSol',
}

/**
 * Clean raw champion name by removing game_character_displayname_ prefix
 */
export function cleanChampionName(rawName?: string): string {
  if (!rawName) return ''
  return rawName.trim().replace(/^game_character_displayname_/i, '')
}

/**
 * Standardize champion name to match Riot Data Dragon naming conventions
 */
export function formatChampionNameForDDragon(rawName: string): string {
  if (!rawName) return 'Unknown'
  const clean = rawName.trim().replace(/^game_character_displayname_/i, '')
  const lower = clean.toLowerCase()
  if (CHAMPION_NAME_MAP[lower]) {
    return CHAMPION_NAME_MAP[lower]
  }
  const noSpecial = lower.replace(/['\s.&]/g, '')
  if (CHAMPION_NAME_MAP[noSpecial]) {
    return CHAMPION_NAME_MAP[noSpecial]
  }
  // Remove spaces, apostrophes, ampersands and dots
  return clean.replace(/['\s.&]/g, '')
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

/**
 * Get official role / lane icon from local assets
 */
export function getRoleIconUrl(role: string): string {
  const normalized = (role || '').toUpperCase()
  switch (normalized) {
    case 'TOP':
      return '/assets/icons/roles/top.png'
    case 'JUNGLE':
      return '/assets/icons/roles/jungle.png'
    case 'MIDDLE':
    case 'MID':
      return '/assets/icons/roles/middle.png'
    case 'BOTTOM':
    case 'BOT':
      return '/assets/icons/roles/bottom.png'
    case 'UTILITY':
    case 'SUPPORT':
      return '/assets/icons/roles/utility.png'
    default:
      return ''
  }
}

/**
 * Get champion full splash art URL from Data Dragon CDN
 */
export function getChampionSplashUrl(championName: string): string {
  const formatted = formatChampionNameForDDragon(championName)
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${formatted}_0.jpg`
}

/**
 * Get champion vertical loading screen art URL from Data Dragon CDN
 */
export function getChampionLoadingUrl(championName: string): string {
  const formatted = formatChampionNameForDDragon(championName)
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${formatted}_0.jpg`
}

/**
 * Get objective icon from local assets
 */
export function getObjectiveIconUrl(
  type: 'tower' | 'dragon' | 'baron' | 'herald',
  team: 'ORDER' | 'CHAOS',
): string {
  const suffix = team === 'ORDER' ? 'blue' : 'red'
  return `/assets/icons/objectives/${type}-${suffix}.png`
}

/**
 * Local stat icons
 */
export const STAT_ICONS = {
  gold: '/assets/icons/stats/gold.png',
  kills: '/assets/icons/stats/kills.png',
  minions: '/assets/icons/stats/minions.png',
} as const
