import type {
  WowClassDetails,
  WowClassResponse,
  WowClassesResponse,
  WowRace,
  WowRacesResponse,
  WowSpecialization,
} from '#shared/types/wow'

const API_ORIGIN = 'https://eu.api.blizzard.com'
const TOKEN_URL = 'https://oauth.battle.net/token'
const TTL = 60 * 60 * 1000

export class WowUnavailableError extends Error {}
export class WowClassNotFoundError extends Error {}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function validId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 100000
}
function imageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      /^render(?:-[a-z0-9-]+)?\.worldofwarcraft\.com$/.test(url.hostname) &&
      !url.port &&
      !url.username &&
      !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

export function createWowClassesClient(
  credentials: { clientId: string; clientSecret: string },
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let token: { value: string; expiresAt: number } | null = null
  let pendingToken: Promise<string> | null = null
  const cache = new Map<string, { value: unknown; expiresAt: number }>()
  const pending = new Map<string, Promise<unknown>>()

  async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const entry = cache.get(key)
    if (entry && entry.expiresAt > now()) return entry.value as T
    const existing = pending.get(key)
    if (existing) return existing as Promise<T>
    const request = (async () => {
      const value = await load()
      cache.set(key, { value, expiresAt: now() + TTL })
      return value
    })()
    pending.set(key, request)
    try {
      return await request
    } finally {
      pending.delete(key)
    }
  }

  async function getToken(): Promise<string> {
    if (!credentials.clientId || !credentials.clientSecret)
      throw new WowUnavailableError('Configuration Blizzard absente.')
    if (token && token.expiresAt > now()) return token.value
    if (pendingToken) return pendingToken
    pendingToken = (async () => {
      try {
        const response = await fetcher(TOKEN_URL, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) throw new Error('Authentification indisponible')
        const data: unknown = await response.json()
        if (
          !isRecord(data) ||
          typeof data.access_token !== 'string' ||
          !data.access_token ||
          typeof data.expires_in !== 'number' ||
          !Number.isFinite(data.expires_in) ||
          data.expires_in <= 0
        )
          throw new Error('Jeton invalide')
        token = {
          value: data.access_token,
          expiresAt: now() + Math.max(0, data.expires_in - 60) * 1000,
        }
        return data.access_token
      } catch {
        throw new WowUnavailableError('Authentification Blizzard indisponible.')
      }
    })()
    try {
      return await pendingToken
    } finally {
      pendingToken = null
    }
  }

  async function request(path: string): Promise<unknown> {
    try {
      let bearer = await getToken()
      const url = `${API_ORIGIN}${path}?namespace=static-eu&locale=fr_FR`
      let response = await fetcher(url, {
        headers: { Authorization: `Bearer ${bearer}` },
        signal: AbortSignal.timeout(5000),
      })
      if (response.status === 401) {
        if (token?.value === bearer) token = null
        bearer = await getToken()
        response = await fetcher(url, {
          headers: { Authorization: `Bearer ${bearer}` },
          signal: AbortSignal.timeout(5000),
        })
      }
      if (response.status === 404) throw new WowClassNotFoundError('Classe introuvable.')
      if (!response.ok) throw new Error('Données indisponibles')
      return await response.json()
    } catch (error) {
      if (error instanceof WowClassNotFoundError) throw error
      throw new WowUnavailableError('Données Blizzard indisponibles.')
    }
  }

  async function getMedia(id: number): Promise<string | null> {
    try {
      const body = await request(`/data/wow/media/playable-class/${id}`)
      if (!isRecord(body) || !Array.isArray(body.assets)) return null
      const icon = body.assets.find((item: unknown) => isRecord(item) && item.key === 'icon')
      return isRecord(icon) ? imageUrl(icon.value) : null
    } catch {
      return null
    }
  }

  async function getClasses(): Promise<WowClassesResponse> {
    return cached('classes', async () => {
      const body = await request('/data/wow/playable-class/index')
      if (
        !isRecord(body) ||
        !Array.isArray(body.classes) ||
        !body.classes.length ||
        body.classes.length > 100
      )
        throw new WowUnavailableError('Catalogue des classes invalide.')
      const ids = new Set<number>()
      const classes = body.classes.map((entry: unknown) => {
        if (
          !isRecord(entry) ||
          !validId(entry.id) ||
          ids.has(entry.id) ||
          typeof entry.name !== 'string' ||
          !entry.name.trim()
        )
          throw new WowUnavailableError('Catalogue des classes invalide.')
        ids.add(entry.id)
        return { id: entry.id, name: entry.name.trim() }
      })
      const data = await Promise.all(
        classes.map(async (item) => ({ ...item, icon: await getMedia(item.id) })),
      )
      return { locale: 'fr_FR', edition: 'retail', data }
    })
  }

  async function getClass(id: number): Promise<WowClassResponse> {
    if (!validId(id)) throw new WowClassNotFoundError('Classe introuvable.')
    return cached(`class:${id}`, async () => {
      const catalog = await getClasses()
      const summary = catalog.data.find((item) => item.id === id)
      if (!summary) throw new WowClassNotFoundError('Classe introuvable.')
      const body = await request(`/data/wow/playable-class/${id}`)
      if (
        !isRecord(body) ||
        body.id !== id ||
        typeof body.name !== 'string' ||
        !body.name.trim() ||
        !Array.isArray(body.specializations)
      )
        throw new WowUnavailableError('Classe invalide.')
      const specializations: WowSpecialization[] = body.specializations.map((spec: unknown) => {
        if (
          !isRecord(spec) ||
          !validId(spec.id) ||
          typeof spec.name !== 'string' ||
          !spec.name.trim()
        )
          throw new WowUnavailableError('Spécialisations invalides.')
        return { id: spec.id, name: spec.name.trim() }
      })
      const powerType =
        isRecord(body.power_type) &&
        typeof body.power_type.name === 'string' &&
        body.power_type.name.trim()
          ? body.power_type.name.trim()
          : null
      const data: WowClassDetails = {
        id,
        name: body.name.trim(),
        icon: summary.icon,
        powerType,
        specializations,
      }
      return { locale: 'fr_FR', edition: 'retail', data }
    })
  }
  async function getRaces(): Promise<WowRacesResponse> {
    return cached('races', async () => {
      const index = await request('/data/wow/playable-race/index')
      if (
        !isRecord(index) ||
        !Array.isArray(index.races) ||
        !index.races.length ||
        index.races.length > 100
      )
        throw new WowUnavailableError('Catalogue des races invalide.')
      const ids = new Set<number>()
      const entries = index.races.map((entry: unknown) => {
        if (
          !isRecord(entry) ||
          !validId(entry.id) ||
          ids.has(entry.id) ||
          typeof entry.name !== 'string' ||
          !entry.name.trim()
        )
          throw new WowUnavailableError('Catalogue des races invalide.')
        ids.add(entry.id)
        return { id: entry.id, name: entry.name.trim() }
      })
      const data: WowRace[] = new Array(entries.length)
      let next = 0
      const worker = async () => {
        while (next < entries.length) {
          const position = next++
          const entry = entries[position]
          let body: unknown
          try {
            body = await request(`/data/wow/playable-race/${entry.id}`)
          } catch {
            throw new WowUnavailableError('Catalogue des races indisponible.')
          }
          if (
            !isRecord(body) ||
            body.id !== entry.id ||
            typeof body.name !== 'string' ||
            !body.name.trim() ||
            !Array.isArray(body.playable_classes)
          )
            throw new WowUnavailableError('Race invalide.')
          const faction =
            isRecord(body.faction) &&
            typeof body.faction.type === 'string' &&
            typeof body.faction.name === 'string' &&
            body.faction.name.trim()
              ? { type: body.faction.type, name: body.faction.name.trim() }
              : null
          const classes = body.playable_classes.map((item: unknown) => {
            if (
              !isRecord(item) ||
              !validId(item.id) ||
              typeof item.name !== 'string' ||
              !item.name.trim()
            )
              throw new WowUnavailableError('Classes de race invalides.')
            return { id: item.id, name: item.name.trim() }
          })
          data[position] = {
            id: entry.id,
            name: body.name.trim(),
            faction,
            allied: typeof body.is_allied_race === 'boolean' ? body.is_allied_race : null,
            classes,
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(entries.length, 6) }, () => worker()))
      return { locale: 'fr_FR', edition: 'retail', data }
    })
  }

  return { getClasses, getClass, getRaces }
}

let shared: {
  clientId: string
  clientSecret: string
  client: ReturnType<typeof createWowClassesClient>
} | null = null
export function getWowClassesClient(clientId: string, clientSecret: string) {
  if (!shared || shared.clientId !== clientId || shared.clientSecret !== clientSecret) {
    shared = { clientId, clientSecret, client: createWowClassesClient({ clientId, clientSecret }) }
  }
  return shared.client
}
