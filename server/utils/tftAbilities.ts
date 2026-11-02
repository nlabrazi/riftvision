import type { TftAbility } from '#shared/types/tft'
import { DataDragonUnavailableError } from './dataDragon'

const ORIGIN = 'https://raw.communitydragon.org'
const TTL = 24 * 60 * 60 * 1000
const MAX_BYTES = 40 * 1024 * 1024

type AbilityEntry = { setNumber: number; ability: TftAbility }
type AbilityIndex = Map<string, AbilityEntry[]>
type SetMembership = { units: string[]; traits: string[]; items: string[] }
type Snapshot = { abilities: AbilityIndex; sets: Map<number, SetMembership | null> }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function abilityIcon(value: unknown, patch: string): string | null {
  if (typeof value !== 'string') return null
  const path = value.toLowerCase()
  if (!/^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.tex$/.test(path)) return null
  return `${ORIGIN}/${patch}/game/${path.slice(0, -4)}.png`
}

function plainDescription(value: string): string {
  return value
    .replace(/\r\\n|\r\n|\\n|\r/g, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/%i:[^%]*%/gi, '')
    .replace(/@[^@\n]+@/g, 'valeur variable')
    .trim()
}

export function createTftAbilitiesClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let cache: { version: string; snapshot: Snapshot; expiresAt: number } | null = null
  const pending = new Map<string, Promise<Snapshot>>()

  async function getSnapshot(version: string): Promise<Snapshot> {
    if (!/^\d+\.\d+\.\d+$/.test(version))
      throw new DataDragonUnavailableError('Version TFT invalide.')
    const patch = version.split('.').slice(0, 2).join('.')
    if (cache?.version === patch && cache.expiresAt > now()) return cache.snapshot
    const inFlight = pending.get(patch)
    if (inFlight) return inFlight
    const request = (async () => {
      let body: unknown
      try {
        const response = await fetcher(`${ORIGIN}/${patch}/cdragon/tft/fr_fr.json`, {
          signal: AbortSignal.timeout(15000),
        })
        if (!response.ok || !response.body) throw new Error('Source indisponible')
        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        let size = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > MAX_BYTES) {
            await reader.cancel()
            throw new Error('Source trop volumineuse')
          }
          chunks.push(value)
        }
        const bytes = new Uint8Array(size)
        let offset = 0
        for (const chunk of chunks) {
          bytes.set(chunk, offset)
          offset += chunk.byteLength
        }
        body = JSON.parse(new TextDecoder().decode(bytes))
      } catch {
        throw new DataDragonUnavailableError(
          'Les compétences TFT sont temporairement indisponibles.',
        )
      }
      if (!isRecord(body) || !Array.isArray(body.setData))
        throw new DataDragonUnavailableError('Les compétences TFT reçues sont invalides.')
      const index: AbilityIndex = new Map()
      const sets = new Map<number, SetMembership | null>()
      for (const set of body.setData) {
        if (!isRecord(set) || !Number.isInteger(set.number) || !Array.isArray(set.champions))
          continue
        const number = set.number as number
        if (
          set.mutator === `TFTSet${number}` &&
          Array.isArray(set.traits) &&
          Array.isArray(set.items)
        ) {
          const ids = (values: unknown[], field?: string) => [
            ...new Set(
              values.flatMap((value) => {
                const candidate = field && isRecord(value) ? value[field] : value
                return typeof candidate === 'string' && /^[A-Za-z0-9_]+$/.test(candidate)
                  ? [candidate]
                  : []
              }),
            ),
          ]
          const membership = {
            units: ids(set.champions, 'apiName'),
            traits: ids(set.traits, 'apiName'),
            items: ids(set.items),
          }
          if (membership.units.length && membership.traits.length && membership.items.length)
            sets.set(number, sets.has(number) ? null : membership)
        }
        for (const champion of set.champions) {
          if (
            !isRecord(champion) ||
            typeof champion.apiName !== 'string' ||
            !/^[A-Za-z0-9_]+$/.test(champion.apiName) ||
            !isRecord(champion.ability) ||
            typeof champion.ability.name !== 'string' ||
            !champion.ability.name.trim() ||
            typeof champion.ability.desc !== 'string' ||
            !champion.ability.desc.trim()
          )
            continue
          const description = plainDescription(champion.ability.desc)
          if (!description) continue
          const entries = index.get(champion.apiName) ?? []
          entries.push({
            setNumber: set.number as number,
            ability: {
              name: champion.ability.name.trim(),
              description,
              icon: abilityIcon(champion.ability.icon, patch),
            },
          })
          index.set(champion.apiName, entries)
        }
      }
      if (!index.size)
        throw new DataDragonUnavailableError('Les compétences TFT reçues sont vides.')
      const snapshot = { abilities: index, sets }
      cache = { version: patch, snapshot, expiresAt: now() + TTL }
      return snapshot
    })()
    pending.set(patch, request)
    try {
      return await request
    } finally {
      pending.delete(patch)
    }
  }

  async function getAbility(
    id: string,
    setNumber: number | null,
    version: string,
  ): Promise<TftAbility | null> {
    const snapshot = await getSnapshot(version)
    const entries = (snapshot.abilities.get(id) ?? []).filter(
      (entry) => setNumber === null || entry.setNumber === setNumber,
    )
    const ability = entries[0]?.ability
    if (!ability) return null
    const sameAbility = entries.every(
      (entry) =>
        entry.ability.name === ability.name && entry.ability.description === ability.description,
    )
    if (!sameAbility) return null
    const icons = new Set(
      entries.map((entry) => entry.ability.icon).filter((icon) => icon !== null),
    )
    return { ...ability, icon: icons.size === 1 ? ([...icons][0] ?? null) : null }
  }

  async function getSet(number: number, version: string): Promise<SetMembership | null> {
    if (!Number.isSafeInteger(number) || number <= 0) return null
    return (await getSnapshot(version)).sets.get(number) ?? null
  }

  return { getAbility, getSet }
}

export const tftAbilities = createTftAbilitiesClient()
