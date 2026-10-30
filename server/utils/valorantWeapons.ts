import type {
  ValorantDamageRange,
  ValorantWeapon,
  ValorantWeaponsResponse,
} from '#shared/types/valorant'

export class ValorantWeaponsUnavailableError extends Error {}
const ENDPOINT = 'https://valorant-api.com/v1/weapons?language=fr-FR'
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
function nonnegative(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}
function damageRange(value: unknown): ValorantDamageRange | null {
  if (!isRecord(value)) return null
  const start = nonnegative(value.rangeStartMeters)
  const end = nonnegative(value.rangeEndMeters)
  const head = nonnegative(value.headDamage)
  const body = nonnegative(value.bodyDamage)
  const leg = nonnegative(value.legDamage)
  if (
    start === null ||
    end === null ||
    end < start ||
    head === null ||
    body === null ||
    leg === null
  )
    return null
  return { start, end, head, body, leg }
}

export function createValorantWeaponsClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let cache: { value: ValorantWeaponsResponse; expiresAt: number } | null = null
  let pending: Promise<ValorantWeaponsResponse> | null = null
  async function getWeapons(): Promise<ValorantWeaponsResponse> {
    if (cache && cache.expiresAt > now()) return cache.value
    if (pending) return pending
    pending = (async () => {
      let body: unknown
      try {
        const response = await fetcher(ENDPOINT, { signal: AbortSignal.timeout(5000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        body = await response.json()
      } catch {
        throw new ValorantWeaponsUnavailableError('Catalogue des armes Valorant indisponible.')
      }
      if (!isRecord(body) || body.status !== 200 || !Array.isArray(body.data))
        throw new ValorantWeaponsUnavailableError('Catalogue des armes Valorant invalide.')
      const data: ValorantWeapon[] = []
      const ids = new Set<string>()
      for (const weapon of body.data) {
        if (!isRecord(weapon))
          throw new ValorantWeaponsUnavailableError('Catalogue des armes Valorant invalide.')
        const icon = safeImage(weapon.displayIcon)
        if (
          typeof weapon.uuid !== 'string' ||
          !UUID.test(weapon.uuid) ||
          ids.has(weapon.uuid.toLowerCase()) ||
          typeof weapon.displayName !== 'string' ||
          !weapon.displayName.trim() ||
          typeof weapon.category !== 'string' ||
          !/^EEquippableCategory::[A-Za-z]+$/.test(weapon.category) ||
          !icon
        )
          throw new ValorantWeaponsUnavailableError('Catalogue des armes Valorant invalide.')
        ids.add(weapon.uuid.toLowerCase())
        const stats = isRecord(weapon.weaponStats) ? weapon.weaponStats : {}
        const shop = isRecord(weapon.shopData) ? weapon.shopData : {}
        const damageRanges = Array.isArray(stats.damageRanges)
          ? stats.damageRanges.flatMap((value: unknown) => {
              const range = damageRange(value)
              return range ? [range] : []
            })
          : []
        data.push({
          id: weapon.uuid.toLowerCase(),
          name: weapon.displayName.trim(),
          category: weapon.category.split('::')[1] ?? '',
          icon,
          cost: nonnegative(shop.cost),
          magazine: nonnegative(stats.magazineSize),
          fireRate: nonnegative(stats.fireRate),
          reloadSeconds: nonnegative(stats.reloadTimeSeconds),
          pelletCount: nonnegative(stats.shotgunPelletCount),
          damageRanges,
        })
      }
      if (!data.length)
        throw new ValorantWeaponsUnavailableError('Catalogue des armes Valorant vide.')
      const value: ValorantWeaponsResponse = { locale: 'fr-FR', data }
      cache = { value, expiresAt: now() + TTL }
      return value
    })()
    try {
      return await pending
    } finally {
      pending = null
    }
  }
  return { getWeapons }
}
export const valorantWeapons = createValorantWeaponsClient()
