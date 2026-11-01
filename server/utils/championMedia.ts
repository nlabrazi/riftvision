import type {
  ChampionAbilityMedia,
  ChampionAbilityMediaResponse,
  ChampionAbilitySlot,
} from '#shared/types/championMedia'

const SOURCE = 'https://raw.communitydragon.org'
const MEDIA = 'https://lol.dyn.riotcdn.net/x/videos/'
const TTL = 24 * 60 * 60 * 1000
const MAX_ENTRIES = 200

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mediaPath(value: unknown, championKey: string, extension: 'webm' | 'jpg'): string | null {
  if (typeof value !== 'string') return null
  const match =
    /^champion-abilities\/(\d{4,7})\/ability_(\d{4,7})_([A-Za-z0-9]+)\.(webm|jpg)$/.exec(value)
  if (
    !match ||
    match[1] !== match[2] ||
    Number(match[1]) !== Number(championKey) ||
    match[4] !== extension
  )
    return null
  return value
}

export function createChampionMediaClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  const cache = new Map<string, { value: ChampionAbilityMediaResponse; expiresAt: number }>()
  const pending = new Map<string, Promise<ChampionAbilityMediaResponse>>()
  async function getMedia(
    championKey: string,
    version: string,
  ): Promise<ChampionAbilityMediaResponse> {
    if (!/^[1-9]\d{0,6}$/.test(championKey) || !/^\d+\.\d+\.\d+$/.test(version))
      throw new Error('Paramètres invalides')
    const patch = version.split('.').slice(0, 2).join('.')
    const key = `${patch}:${championKey}`
    const cached = cache.get(key)
    if (cached && cached.expiresAt > now()) return cached.value
    const inFlight = pending.get(key)
    if (inFlight) return inFlight
    const task = (async () => {
      const response = await fetcher(
        `${SOURCE}/${patch}/plugins/rcp-be-lol-game-data/global/default/v1/champions/${championKey}.json`,
        { signal: AbortSignal.timeout(5000) },
      )
      if (!response.ok) throw new Error('Médias indisponibles')
      const data: unknown = await response.json()
      if (!record(data) || data.id !== Number(championKey) || !Array.isArray(data.spells))
        throw new Error('Médias invalides')
      const abilities: ChampionAbilityMediaResponse['abilities'] = {}
      function add(slot: ChampionAbilitySlot, raw: unknown) {
        if (!record(raw)) return
        const video = mediaPath(raw.abilityVideoPath, championKey, 'webm')
        if (!video) return
        const poster = mediaPath(raw.abilityVideoImagePath, championKey, 'jpg')
        const media: ChampionAbilityMedia = {
          videoWebm: MEDIA + video,
          videoMp4: MEDIA + video.replace(/\.webm$/, '.mp4'),
          poster: poster ? MEDIA + poster : null,
        }
        abilities[slot] = media
      }
      add('P', data.passive)
      for (const spell of data.spells) {
        if (!record(spell) || typeof spell.spellKey !== 'string') continue
        const slot = spell.spellKey.toUpperCase()
        if (slot === 'Q' || slot === 'W' || slot === 'E' || slot === 'R') add(slot, spell)
      }
      const value = { abilities }
      cache.delete(key)
      cache.set(key, { value, expiresAt: now() + TTL })
      if (cache.size > MAX_ENTRIES) {
        const oldest = cache.keys().next().value
        if (oldest !== undefined) cache.delete(oldest)
      }
      return value
    })()
    pending.set(key, task)
    try {
      return await task
    } finally {
      pending.delete(key)
    }
  }
  return { getMedia }
}

export const championMedia = createChampionMediaClient()
