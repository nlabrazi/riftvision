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
