import type {
  DataDragonChampion,
  DataDragonChampionDetails,
  DataDragonChampions,
} from '#shared/types/dataDragon'

const ORIGIN = 'https://ddragon.leagueoflegends.com'
const LOCALE = 'fr_FR' as const
const VERSION_TTL = 60 * 60 * 1000
const DATA_TTL = 24 * 60 * 60 * 1000
const MAX_DOCUMENTS = 256

export class DataDragonUnavailableError extends Error {}
export class DataDragonChampionNotFoundError extends Error {}

type Fetcher = typeof fetch
type CacheEntry = { value: unknown; expiresAt: number }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isChampion(value: unknown, id: string): value is DataDragonChampion {
  return (
    isRecord(value) &&
    value.id === id &&
    typeof value.key === 'string' &&
    typeof value.name === 'string' &&
    typeof value.title === 'string' &&
    isRecord(value.image) &&
    typeof value.image.full === 'string' &&
    Array.isArray(value.tags) &&
    value.tags.every((tag: unknown) => typeof tag === 'string')
  )
}

/** Le cache vit dans le processus Nuxt : il est vidé au redémarrage. */
export function createDataDragonClient(fetcher: Fetcher = fetch, now: () => number = Date.now) {
  const cache = new Map<string, CacheEntry>()
  const pending = new Map<string, Promise<unknown>>()

  async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
    const existing = cache.get(key)
    if (existing && existing.expiresAt > now()) return existing.value as T

    const inFlight = pending.get(key)
    if (inFlight) return inFlight as Promise<T>

    const request = (async () => {
      const value = await load()
      cache.delete(key)
      cache.set(key, { value, expiresAt: now() + ttl })
      if (cache.size > MAX_DOCUMENTS) {
        const oldest = cache.keys().next().value
        if (oldest !== undefined) cache.delete(oldest)
      }
      return value
    })()
    pending.set(key, request)
    try {
      return await request
    } finally {
      pending.delete(key)
    }
  }

  async function fetchJson(path: string): Promise<unknown> {
    try {
      const response = await fetcher(`${ORIGIN}${path}`, { signal: AbortSignal.timeout(5000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch {
      throw new DataDragonUnavailableError('Data Dragon est temporairement indisponible.')
    }
  }

  async function getVersion(): Promise<string> {
    return cached('version', VERSION_TTL, async () => {
      const versions = await fetchJson('/api/versions.json')
      const latest = Array.isArray(versions) ? versions[0] : undefined
      if (typeof latest !== 'string' || !/^\d+\.\d+\.\d+$/.test(latest)) {
        throw new DataDragonUnavailableError('La version Data Dragon reçue est invalide.')
      }
      return latest
    })
  }

  async function getChampions(): Promise<DataDragonChampions> {
    const version = await getVersion()
    return cached(`champions:${version}`, DATA_TTL, async () => {
      const body = await fetchJson(`/cdn/${version}/data/${LOCALE}/champion.json`)
      if (!isRecord(body) || body.version !== version || !isRecord(body.data)) {
        throw new DataDragonUnavailableError('Le catalogue Data Dragon reçu est invalide.')
      }
      const entries = Object.entries(body.data)
      if (
        entries.length === 0 ||
        !entries.every(([id, champion]) => /^[A-Za-z0-9]+$/.test(id) && isChampion(champion, id))
      ) {
        throw new DataDragonUnavailableError('Le catalogue Data Dragon reçu est invalide.')
      }
      return { version, locale: LOCALE, data: body.data as Record<string, DataDragonChampion> }
    })
  }

  async function getChampion(id: string): Promise<DataDragonChampionDetails> {
    if (!/^[A-Za-z0-9]+$/.test(id)) throw new DataDragonChampionNotFoundError()
    const champions = await getChampions()
    if (!Object.hasOwn(champions.data, id)) throw new DataDragonChampionNotFoundError()

    const { version } = champions
    return cached(`champion:${version}:${id}`, DATA_TTL, async () => {
      const body = await fetchJson(`/cdn/${version}/data/${LOCALE}/champion/${id}.json`)
      if (!isRecord(body) || body.version !== version || !isRecord(body.data)) {
        throw new DataDragonUnavailableError('La fiche Data Dragon reçue est invalide.')
      }
      const champion = body.data[id]
      if (!isChampion(champion, id)) {
        throw new DataDragonUnavailableError('La fiche Data Dragon reçue est invalide.')
      }
      return { version, locale: LOCALE, data: champion }
    })
  }

  return { getVersion, getChampions, getChampion }
}

export const dataDragon = createDataDragonClient()
