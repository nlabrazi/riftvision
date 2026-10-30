import type { ValorantCallout, ValorantMap, ValorantMapsResponse } from '#shared/types/valorant'

export class ValorantMapsUnavailableError extends Error {}
const ENDPOINT = 'https://valorant-api.com/v1/maps?language=fr-FR'
const TTL = 60 * 60 * 1000
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function safeImage(value: unknown): string | null {
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
function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim()
  return text || null
}
function callouts(value: unknown): ValorantCallout[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  return value.flatMap((entry: unknown) => {
    if (!isRecord(entry)) return []
    const region = textOrNull(entry.regionName)
    const area = textOrNull(entry.superRegionName)
    if (!region || !area) return []
    const key = JSON.stringify([area, region])
    if (unique.has(key)) return []
    unique.add(key)
    return [{ region, area }]
  })
}

export function createValorantMapsClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let cache: { value: ValorantMapsResponse; expiresAt: number } | null = null
  let pending: Promise<ValorantMapsResponse> | null = null
  async function getMaps(): Promise<ValorantMapsResponse> {
    if (cache && cache.expiresAt > now()) return cache.value
    if (pending) return pending
    pending = (async () => {
      let body: unknown
      try {
        const response = await fetcher(ENDPOINT, { signal: AbortSignal.timeout(5000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        body = await response.json()
      } catch {
        throw new ValorantMapsUnavailableError('Catalogue des cartes Valorant indisponible.')
      }
      if (!isRecord(body) || body.status !== 200 || !Array.isArray(body.data))
        throw new ValorantMapsUnavailableError('Catalogue des cartes Valorant invalide.')
      const data: ValorantMap[] = []
      const ids = new Set<string>()
      for (const map of body.data) {
        if (
          !isRecord(map) ||
          typeof map.uuid !== 'string' ||
          !UUID.test(map.uuid) ||
          ids.has(map.uuid.toLowerCase()) ||
          typeof map.displayName !== 'string' ||
          !map.displayName.trim()
        )
          throw new ValorantMapsUnavailableError('Catalogue des cartes Valorant invalide.')
        ids.add(map.uuid.toLowerCase())
        data.push({
          id: map.uuid.toLowerCase(),
          name: map.displayName.trim(),
          splash: safeImage(map.splash),
          minimap: safeImage(map.displayIcon),
          tacticalDescription: textOrNull(map.tacticalDescription),
          narrativeDescription: textOrNull(map.narrativeDescription),
          callouts: callouts(map.callouts),
        })
      }
      if (!data.length)
        throw new ValorantMapsUnavailableError('Catalogue des cartes Valorant vide.')
      const value: ValorantMapsResponse = { locale: 'fr-FR', data }
      cache = { value, expiresAt: now() + TTL }
      return value
    })()
    try {
      return await pending
    } finally {
      pending = null
    }
  }
  return { getMaps }
}
export const valorantMaps = createValorantMapsClient()
