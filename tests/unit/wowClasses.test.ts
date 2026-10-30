import { describe, expect, it, vi } from 'vitest'
import {
  createWowClassesClient,
  WowClassNotFoundError,
  WowUnavailableError,
} from '../../server/utils/wowClasses'

const credentials = { clientId: 'client-id', clientSecret: 'secret' }
const index = {
  classes: [
    { id: 8, name: 'Mage' },
    { id: 11, name: 'Druide' },
  ],
}
const detail = {
  id: 8,
  name: 'Mage',
  power_type: { name: 'Mana' },
  specializations: [
    { id: 62, name: 'Arcanes' },
    { id: 63, name: 'Feu' },
  ],
}
function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status })
}
function makeFetcher() {
  return vi.fn<typeof fetch>(async (url) => {
    const path = String(url)
    if (path === 'https://oauth.battle.net/token')
      return response({ access_token: 'private-token', expires_in: 3600 })
    if (path.includes('/playable-class/index')) return response(index)
    if (path.includes('/media/playable-class/8'))
      return response({
        assets: [
          {
            key: 'icon',
            value: 'https://render-eu.worldofwarcraft.com/icons/56/classicon_mage.jpg',
          },
        ],
      })
    if (path.includes('/media/playable-class/11')) return response({ assets: [] })
    if (path.includes('/playable-class/8')) return response(detail)
    return response({}, 404)
  })
}

describe('classes WoW Retail', () => {
  it('utilise OAuth côté serveur puis normalise les classes et leurs spécialisations', async () => {
    const fetcher = makeFetcher()
    const client = createWowClassesClient(credentials, fetcher)
    const catalog = await client.getClasses()
    expect(catalog).toEqual({
      locale: 'fr_FR',
      edition: 'retail',
      data: [
        {
          id: 8,
          name: 'Mage',
          icon: 'https://render-eu.worldofwarcraft.com/icons/56/classicon_mage.jpg',
        },
        { id: 11, name: 'Druide', icon: null },
      ],
    })
    expect((await client.getClass(8)).data).toEqual({
      ...catalog.data[0],
      powerType: 'Mana',
      specializations: [
        { id: 62, name: 'Arcanes' },
        { id: 63, name: 'Feu' },
      ],
    })
    expect(String(fetcher.mock.calls[1]?.[0])).toBe(
      'https://eu.api.blizzard.com/data/wow/playable-class/index?namespace=static-eu&locale=fr_FR',
    )
    expect(fetcher.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(JSON.stringify(catalog)).not.toContain('private-token')
  })

  it('partage les requêtes concurrentes et recharge après expiration', async () => {
    let clock = 0
    const fetcher = makeFetcher()
    const client = createWowClassesClient(credentials, fetcher, () => clock)
    await Promise.all([client.getClasses(), client.getClasses()])
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).includes('playable-class/index')),
    ).toHaveLength(1)
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).includes('oauth.battle.net')),
    ).toHaveLength(1)
    clock += 60 * 60 * 1000 + 1
    await client.getClasses()
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).includes('playable-class/index')),
    ).toHaveLength(2)
  })

  it('ne demande rien si la configuration est absente et distingue une classe inconnue', async () => {
    const fetcher = makeFetcher()
    const client = createWowClassesClient({ clientId: '', clientSecret: '' }, fetcher)
    await expect(client.getClasses()).rejects.toBeInstanceOf(WowUnavailableError)
    expect(fetcher).not.toHaveBeenCalled()
    const configured = createWowClassesClient(credentials, fetcher)
    await expect(configured.getClass(999)).rejects.toBeInstanceOf(WowClassNotFoundError)
    await expect(configured.getClass(-1)).rejects.toBeInstanceOf(WowClassNotFoundError)
  })

  it('renouvelle une authentification refusée et ne met pas les erreurs en cache', async () => {
    let attempts = 0
    let tokens = 0
    const fallback = makeFetcher()
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      if (String(url) === 'https://oauth.battle.net/token')
        return response({ access_token: `token-${++tokens}`, expires_in: 3600 })
      if (String(url).includes('/playable-class/index') && attempts++ === 0)
        return response({}, 401)
      return fallback(url, init)
    })
    const client = createWowClassesClient(credentials, fetcher)
    expect((await client.getClasses()).data).toHaveLength(2)
    expect(tokens).toBe(2)
  })

  it('écarte une icône externe sans empêcher le catalogue de fonctionner', async () => {
    const fallback = makeFetcher()
    const fetcher = vi.fn<typeof fetch>(async (url, init) =>
      String(url).includes('/media/playable-class/8')
        ? response({
            assets: [
              { key: 'icon', value: 'https://render-eu.worldofwarcraft.com.evil.test/icon.jpg' },
            ],
          })
        : fallback(url, init),
    )
    const client = createWowClassesClient(credentials, fetcher)
    expect((await client.getClasses()).data[0]?.icon).toBeNull()
  })
})

describe('races WoW Retail', () => {
  const raceIndex = {
    races: [
      { id: 1, name: 'Humain' },
      { id: 25, name: 'Pandaren' },
      { id: 26, name: 'Pandaren' },
    ],
  }
  const races: Record<number, unknown> = {
    1: {
      id: 1,
      name: 'Humain',
      faction: { type: 'ALLIANCE', name: 'Alliance' },
      is_allied_race: false,
      playable_classes: [{ id: 8, name: 'Mage' }],
    },
    25: {
      id: 25,
      name: 'Pandaren',
      faction: { type: 'ALLIANCE', name: 'Alliance' },
      is_allied_race: false,
      playable_classes: [{ id: 8, name: 'Mage' }],
    },
    26: {
      id: 26,
      name: 'Pandaren',
      faction: { type: 'HORDE', name: 'Horde' },
      is_allied_race: false,
      playable_classes: [{ id: 8, name: 'Mage' }],
    },
  }
  function raceFetcher() {
    return vi.fn<typeof fetch>(async (url) => {
      const path = String(url)
      if (path.includes('oauth.battle.net'))
        return response({ access_token: 'private-token', expires_in: 3600 })
      if (path.includes('/playable-race/index')) return response(raceIndex)
      const id = Number(path.match(/\/playable-race\/(\d+)/)?.[1])
      if (id in races) return response(races[id])
      return response({}, 404)
    })
  }
  it('présente séparément les variantes de faction et les classes disponibles', async () => {
    const fetcher = raceFetcher()
    const client = createWowClassesClient(credentials, fetcher)
    expect(await client.getRaces()).toEqual({
      locale: 'fr_FR',
      edition: 'retail',
      data: [
        {
          id: 1,
          name: 'Humain',
          faction: { type: 'ALLIANCE', name: 'Alliance' },
          allied: false,
          classes: [{ id: 8, name: 'Mage' }],
        },
        {
          id: 25,
          name: 'Pandaren',
          faction: { type: 'ALLIANCE', name: 'Alliance' },
          allied: false,
          classes: [{ id: 8, name: 'Mage' }],
        },
        {
          id: 26,
          name: 'Pandaren',
          faction: { type: 'HORDE', name: 'Horde' },
          allied: false,
          classes: [{ id: 8, name: 'Mage' }],
        },
      ],
    })
  })
  it('partage les requêtes, limite la concurrence et renouvelle le cache', async () => {
    let clock = 0
    let current = 0
    let max = 0
    const fallback = raceFetcher()
    const manyIndex = {
      races: Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `Race ${i + 1}` })),
    }
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      const path = String(url)
      if (path.includes('/playable-race/index')) return response(manyIndex)
      const id = Number(path.match(/\/playable-race\/(\d+)/)?.[1])
      if (id) {
        current++
        max = Math.max(max, current)
        await Promise.resolve()
        current--
        return response({
          id,
          name: `Race ${id}`,
          faction: null,
          is_allied_race: null,
          playable_classes: [],
        })
      }
      return fallback(url, init)
    })
    const client = createWowClassesClient(credentials, fetcher, () => clock)
    await Promise.all([client.getRaces(), client.getRaces()])
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).includes('/playable-race/index')),
    ).toHaveLength(1)
    expect(max).toBeLessThanOrEqual(6)
    expect(max).toBeGreaterThan(1)
    clock += 60 * 60 * 1000 + 1
    await client.getRaces()
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).includes('/playable-race/index')),
    ).toHaveLength(2)
  })
  it('ne met pas en cache un catalogue partiel en cas d’échec', async () => {
    let fails = true
    const fallback = raceFetcher()
    const fetcher = vi.fn<typeof fetch>(async (url, init) =>
      String(url).includes('/playable-race/26?') && fails ? response({}, 503) : fallback(url, init),
    )
    const client = createWowClassesClient(credentials, fetcher)
    await expect(client.getRaces()).rejects.toBeInstanceOf(WowUnavailableError)
    fails = false
    expect((await client.getRaces()).data).toHaveLength(3)
  })
})
