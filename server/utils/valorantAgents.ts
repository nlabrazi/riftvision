import type { ValorantAbility, ValorantAgent, ValorantAgentsResponse } from '#shared/types/valorant'

export class ValorantAgentsUnavailableError extends Error {}

const ENDPOINT = 'https://valorant-api.com/v1/agents?language=fr-FR&isPlayableCharacter=true'
const TTL = 60 * 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function imageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      url.hostname === 'media.valorant-api.com' &&
      !url.port &&
      !url.username &&
      !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

function plainText(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim()
}

export function createValorantAgentsClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let cache: { value: ValorantAgentsResponse; expiresAt: number } | null = null
  let pending: Promise<ValorantAgentsResponse> | null = null

  async function getAgents(): Promise<ValorantAgentsResponse> {
    if (cache && cache.expiresAt > now()) return cache.value
    if (pending) return pending
    pending = (async () => {
      let body: unknown
      try {
        const response = await fetcher(ENDPOINT, { signal: AbortSignal.timeout(5000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        body = await response.json()
      } catch {
        throw new ValorantAgentsUnavailableError('Catalogue Valorant indisponible.')
      }
      if (!isRecord(body) || body.status !== 200 || !Array.isArray(body.data))
        throw new ValorantAgentsUnavailableError('Catalogue Valorant invalide.')
      const data: ValorantAgent[] = []
      const ids = new Set<string>()
      for (const agent of body.data) {
        if (!isRecord(agent) || typeof agent.isPlayableCharacter !== 'boolean')
          throw new ValorantAgentsUnavailableError('Catalogue Valorant invalide.')
        if (!agent.isPlayableCharacter) continue
        const icon = imageUrl(agent.displayIcon)
        if (
          typeof agent.uuid !== 'string' ||
          !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(agent.uuid) ||
          ids.has(agent.uuid.toLowerCase()) ||
          typeof agent.displayName !== 'string' ||
          !agent.displayName.trim() ||
          typeof agent.description !== 'string' ||
          !icon ||
          !Array.isArray(agent.abilities)
        )
          throw new ValorantAgentsUnavailableError('Catalogue Valorant invalide.')
        ids.add(agent.uuid.toLowerCase())
        const abilities: ValorantAbility[] = agent.abilities.flatMap((ability: unknown) => {
          if (
            !isRecord(ability) ||
            typeof ability.slot !== 'string' ||
            typeof ability.displayName !== 'string' ||
            !ability.displayName.trim() ||
            typeof ability.description !== 'string'
          )
            return []
          return [
            {
              slot: ability.slot,
              name: ability.displayName.trim(),
              description: plainText(ability.description),
              icon: imageUrl(ability.displayIcon),
            },
          ]
        })
        const role =
          isRecord(agent.role) &&
          typeof agent.role.displayName === 'string' &&
          agent.role.displayName.trim()
            ? agent.role.displayName.trim()
            : null
        data.push({
          id: agent.uuid.toLowerCase(),
          name: agent.displayName.trim(),
          description: plainText(agent.description),
          role,
          icon,
          portrait: imageUrl(agent.fullPortrait),
          abilities,
        })
      }
      if (!data.length) throw new ValorantAgentsUnavailableError('Catalogue Valorant vide.')
      const value: ValorantAgentsResponse = { locale: 'fr-FR', data }
      cache = { value, expiresAt: now() + TTL }
      return value
    })()
    try {
      return await pending
    } finally {
      pending = null
    }
  }
  return { getAgents }
}

export const valorantAgents = createValorantAgentsClient()
