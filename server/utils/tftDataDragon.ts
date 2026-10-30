import type {
  TftChampion,
  TftChampionsResponse,
  TftTrait,
  TftTraitsResponse,
} from '#shared/types/tft'
import { dataDragon, DataDragonUnavailableError } from './dataDragon'

const ORIGIN = 'https://ddragon.leagueoflegends.com'
const TTL = 24 * 60 * 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createTftDataDragonClient(
  fetcher: typeof fetch = fetch,
  getVersion: () => Promise<string> = dataDragon.getVersion,
  now: () => number = Date.now,
) {
  let cache: { value: TftChampionsResponse; expiresAt: number } | null = null
  const pending = new Map<string, Promise<TftChampionsResponse>>()
  let traitsCache: { value: TftTraitsResponse; expiresAt: number } | null = null
  const pendingTraits = new Map<string, Promise<TftTraitsResponse>>()

  async function getChampions(): Promise<TftChampionsResponse> {
    const version = await getVersion()
    if (!/^\d+\.\d+\.\d+$/.test(version))
      throw new DataDragonUnavailableError('Version TFT invalide.')
    if (cache?.value.version === version && cache.expiresAt > now()) return cache.value
    const inFlight = pending.get(version)
    if (inFlight) return inFlight

    const request = (async () => {
      let body: unknown
      try {
        const response = await fetcher(`${ORIGIN}/cdn/${version}/data/fr_FR/tft-champion.json`, {
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        body = await response.json()
      } catch {
        throw new DataDragonUnavailableError('Le catalogue TFT est temporairement indisponible.')
      }
      if (!isRecord(body) || !isRecord(body.data))
        throw new DataDragonUnavailableError('Le catalogue TFT reçu est invalide.')
      const data: TftChampion[] = []
      const ids = new Set<string>()
      for (const [sourceKey, champion] of Object.entries(body.data)) {
        if (
          !isRecord(champion) ||
          typeof champion.id !== 'string' ||
          !/^[A-Za-z0-9_]+$/.test(champion.id) ||
          ids.has(champion.id) ||
          typeof champion.name !== 'string' ||
          !champion.name.trim() ||
          !Number.isInteger(champion.tier) ||
          !Number.isInteger(champion.cost) ||
          !isRecord(champion.image) ||
          typeof champion.image.full !== 'string' ||
          !/^[A-Za-z0-9_.-]+\.png$/.test(champion.image.full)
        ) {
          throw new DataDragonUnavailableError('Le catalogue TFT reçu est invalide.')
        }
        ids.add(champion.id)
        const setMatch = sourceKey.match(/\/Sets\/TFTSet(\d+)\//)
        data.push({
          id: champion.id,
          name: champion.name,
          tier: champion.tier as number,
          cost: champion.cost as number,
          icon: champion.image.full,
          setNumber: setMatch ? Number(setMatch[1]) : null,
        })
      }
      if (!data.length) throw new DataDragonUnavailableError('Le catalogue TFT reçu est vide.')
      const value: TftChampionsResponse = { version, locale: 'fr_FR', data }
      cache = { value, expiresAt: now() + TTL }
      return value
    })()
    pending.set(version, request)
    try {
      return await request
    } finally {
      pending.delete(version)
    }
  }

  async function getTraits(): Promise<TftTraitsResponse> {
    const version = await getVersion()
    if (!/^\d+\.\d+\.\d+$/.test(version))
      throw new DataDragonUnavailableError('Version TFT invalide.')
    if (traitsCache?.value.version === version && traitsCache.expiresAt > now())
      return traitsCache.value
    const inFlight = pendingTraits.get(version)
    if (inFlight) return inFlight

    const request = (async () => {
      let body: unknown
      try {
        const response = await fetcher(`${ORIGIN}/cdn/${version}/data/fr_FR/tft-trait.json`, {
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        body = await response.json()
      } catch {
        throw new DataDragonUnavailableError(
          'Le catalogue des traits TFT est temporairement indisponible.',
        )
      }
      if (!isRecord(body) || !isRecord(body.data))
        throw new DataDragonUnavailableError('Le catalogue des traits TFT reçu est invalide.')
      const data: TftTrait[] = []
      const ids = new Set<string>()
      for (const trait of Object.values(body.data)) {
        if (
          !isRecord(trait) ||
          typeof trait.id !== 'string' ||
          !/^[A-Za-z0-9_]+$/.test(trait.id) ||
          ids.has(trait.id) ||
          typeof trait.name !== 'string' ||
          !trait.name.trim() ||
          !isRecord(trait.image) ||
          typeof trait.image.full !== 'string' ||
          !/^[A-Za-z0-9_.-]+\.png$/.test(trait.image.full)
        )
          throw new DataDragonUnavailableError('Le catalogue des traits TFT reçu est invalide.')
        ids.add(trait.id)
        data.push({ id: trait.id, name: trait.name, icon: trait.image.full })
      }
      if (!data.length)
        throw new DataDragonUnavailableError('Le catalogue des traits TFT reçu est vide.')
      const value: TftTraitsResponse = { version, locale: 'fr_FR', data }
      traitsCache = { value, expiresAt: now() + TTL }
      return value
    })()
    pendingTraits.set(version, request)
    try {
      return await request
    } finally {
      pendingTraits.delete(version)
    }
  }

  return { getChampions, getTraits }
}

export const tftDataDragon = createTftDataDragonClient()
