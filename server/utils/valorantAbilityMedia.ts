import type {
  ValorantAbilityMedia,
  ValorantAbilityMediaResponse,
  ValorantAgent,
} from '#shared/types/valorant'
import { valorantAgents } from './valorantAgents'

const ORIGIN = 'https://playvalorant.com'
const TTL = 60 * 60 * 1000
const MAX_BYTES = 2 * 1024 * 1024
const MAX_ENTRIES = 100

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function normalize(value: string): string {
  return value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
}
function riotMedia(value: unknown, kind: 'video' | 'image'): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    const path =
      kind === 'video'
        ? /^\/sanity\/files\/dsfx7636\/[a-z0-9_-]+\/[a-z0-9_-]+\.(?:mp4|webm)$/i
        : /^\/sanity\/images\/dsfx7636\/[a-z0-9_-]+\/[a-z0-9_-]+\.(?:png|jpe?g|webp)$/i
    return url.protocol === 'https:' &&
      url.hostname === 'cmsassets.rgpub.io' &&
      !url.username &&
      !url.password &&
      !url.port &&
      path.test(url.pathname)
      ? url.href
      : null
  } catch {
    return null
  }
}
function pageData(html: string): Record<string, unknown> {
  const match = /<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script\s*>/i.exec(html)
  if (!match) throw new Error('Page Riot invalide')
  const data: unknown = JSON.parse(match[1])
  if (
    !record(data) ||
    !record(data.props) ||
    !record(data.props.pageProps) ||
    !record(data.props.pageProps.page)
  )
    throw new Error('Page Riot invalide')
  return data.props.pageProps.page
}
function agentPath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = /^\/(fr-fr|en-us)\/agents\/([a-z0-9-]+)\/?$/.exec(value)
  return match ? `/${match[1]}/agents/${match[2]}/` : null
}
function agentIndex(page: Record<string, unknown>): Map<string, string> {
  if (!Array.isArray(page.blades)) throw new Error('Index Riot invalide')
  const paths = new Map<string, string>()
  const ambiguous = new Set<string>()
  for (const blade of page.blades) {
    if (!record(blade) || !Array.isArray(blade.items)) continue
    for (const item of blade.items) {
      if (
        !record(item) ||
        typeof item.title !== 'string' ||
        !record(item.action) ||
        !record(item.action.payload)
      )
        continue
      const path = agentPath(item.action.payload.url)
      const name = normalize(item.title)
      if (!path || !name) continue
      if (paths.has(name) && paths.get(name) !== path) ambiguous.add(name)
      else paths.set(name, path)
    }
  }
  if (!paths.size) throw new Error('Index Riot vide')
  for (const name of ambiguous) paths.delete(name)
  return paths
}

// Quelques noms diffèrent entre le site Riot et le catalogue communautaire.
const aliases: Record<string, Record<string, string[]>> = {
  'efba5359-4016-a1e5-7626-b1ae76895940': { Grenade: ['Ronce barbelée'] },
  'bb2a4828-46eb-8cd1-e765-15848195d751': { Ultimate: ['Surrégime'] },
}
function normalizeSiteTitle(value: string): string[] {
  return value
    .replace(/^\s*[aceqx]\s*[-–—:]\s+/i, '')
    .split(/\s+\/\s+/)
    .map(normalize)
    .filter(Boolean)
}
export function matchAbilityMedia(
  page: Record<string, unknown>,
  agent: Pick<ValorantAgent, 'id' | 'abilities'>,
  alternateNames: Record<string, string> = {},
): ValorantAbilityMediaResponse {
  if (!Array.isArray(page.blades)) throw new Error('Page agent invalide')
  const entries: { names: string[]; media: ValorantAbilityMedia }[] = []
  for (const blade of page.blades) {
    if (!record(blade) || blade.type !== 'iconTab' || !Array.isArray(blade.groups)) continue
    for (const group of blade.groups) {
      if (
        !record(group) ||
        !record(group.content) ||
        typeof group.content.title !== 'string' ||
        !record(group.content.media) ||
        !Array.isArray(group.content.media.sources)
      )
        continue
      let videoMp4: string | null = null
      let videoWebm: string | null = null
      for (const source of group.content.media.sources) {
        if (!record(source)) continue
        const url = riotMedia(source.src, 'video')
        if (url && source.type === 'video/mp4') videoMp4 = url
        if (url && source.type === 'video/webm') videoWebm = url
      }
      if (!videoMp4 && !videoWebm) continue
      entries.push({
        names: normalizeSiteTitle(group.content.title),
        media: {
          videoMp4,
          videoWebm,
          poster: record(group.thumbnail) ? riotMedia(group.thumbnail.url, 'image') : null,
        },
      })
    }
  }
  const abilities: Record<string, ValorantAbilityMedia> = {}
  for (const ability of agent.abilities) {
    const names = [
      ability.name,
      ...(aliases[agent.id]?.[ability.slot] ?? []),
      ...(alternateNames[ability.slot] ? [alternateNames[ability.slot]] : []),
    ].map(normalize)
    const matches = entries.filter((entry) => entry.names.some((name) => names.includes(name)))
    if (matches.length === 1 && /^[A-Za-z0-9]+$/.test(ability.slot))
      abilities[ability.slot] = matches[0].media
  }
  return { abilities }
}

export function createValorantAbilityMediaClient(
  fetcher: typeof fetch = fetch,
  getAgents = valorantAgents.getAgents,
  now: () => number = Date.now,
) {
  const cache = new Map<string, { value: ValorantAbilityMediaResponse; expiresAt: number }>()
  const pending = new Map<string, Promise<ValorantAbilityMediaResponse>>()
  let index: { value: Map<string, string>; expiresAt: number } | null = null
  let pendingIndex: Promise<Map<string, string>> | null = null

  async function bodyText(response: Response): Promise<string> {
    if (!response.ok || !response.body) throw new Error('Source Riot indisponible')
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let length = 0
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      length += chunk.value.byteLength
      if (length > MAX_BYTES) {
        await reader.cancel()
        throw new Error('Page Riot trop volumineuse')
      }
      chunks.push(chunk.value)
    }
    const bytes = new Uint8Array(length)
    let position = 0
    for (const chunk of chunks) {
      bytes.set(chunk, position)
      position += chunk.byteLength
    }
    return new TextDecoder().decode(bytes)
  }
  async function getPage(path: string): Promise<Record<string, unknown>> {
    const response = await fetcher(`${ORIGIN}${path}`, {
      signal: AbortSignal.timeout(7000),
      redirect: 'error',
    })
    return pageData(await bodyText(response))
  }
  async function getEnglishNames(id: string): Promise<Record<string, string>> {
    try {
      const response = await fetcher(`https://valorant-api.com/v1/agents/${id}?language=en-US`, {
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      })
      const value: unknown = JSON.parse(await bodyText(response))
      if (
        !record(value) ||
        value.status !== 200 ||
        !record(value.data) ||
        typeof value.data.uuid !== 'string' ||
        value.data.uuid.toLowerCase() !== id ||
        !Array.isArray(value.data.abilities)
      )
        return {}
      const names: Record<string, string> = {}
      const ambiguous = new Set<string>()
      for (const item of value.data.abilities) {
        if (
          !record(item) ||
          typeof item.slot !== 'string' ||
          !/^[A-Za-z0-9]+$/.test(item.slot) ||
          typeof item.displayName !== 'string' ||
          !item.displayName.trim()
        )
          continue
        if (names[item.slot]) ambiguous.add(item.slot)
        else names[item.slot] = item.displayName.trim()
      }
      for (const slot of ambiguous) delete names[slot]
      return names
    } catch {
      return {}
    }
  }
  async function getIndex(): Promise<Map<string, string>> {
    if (index && index.expiresAt > now()) return index.value
    if (pendingIndex) return pendingIndex
    pendingIndex = (async () => {
      const value = agentIndex(await getPage('/fr-fr/agents/'))
      index = { value, expiresAt: now() + TTL }
      return value
    })()
    try {
      return await pendingIndex
    } finally {
      pendingIndex = null
    }
  }
  async function getMedia(id: string): Promise<ValorantAbilityMediaResponse> {
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))
      throw new Error('Agent invalide')
    const key = id.toLowerCase()
    const previous = cache.get(key)
    if (previous && previous.expiresAt > now()) return previous.value
    const inFlight = pending.get(key)
    if (inFlight) return inFlight
    const task = (async () => {
      const agent = (await getAgents()).data.find((entry) => entry.id === key)
      if (!agent) throw new Error('Agent introuvable')
      const path = (await getIndex()).get(normalize(agent.name))
      const value = path
        ? matchAbilityMedia(
            await getPage(path),
            agent,
            path.startsWith('/en-us/') ? await getEnglishNames(key) : {},
          )
        : { abilities: {} }
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
export const valorantAbilityMedia = createValorantAbilityMediaClient()
