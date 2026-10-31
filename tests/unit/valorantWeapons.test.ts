import { describe, expect, it, vi } from 'vitest'
import {
  createValorantWeaponsClient,
  ValorantWeaponsUnavailableError,
} from '../../server/utils/valorantWeapons'

const weapon = {
  uuid: '9c82e19d-4575-0200-1a81-3eacf00cf872',
  displayName: 'Vandal',
  category: 'EEquippableCategory::Rifle',
  displayIcon: 'https://media.valorant-api.com/weapons/vandal.png',
  shopData: { cost: 2900 },
  weaponStats: {
    fireRate: 9.75,
    magazineSize: 25,
    reloadTimeSeconds: 2.5,
    shotgunPelletCount: 1,
    damageRanges: [
      { rangeStartMeters: 0, rangeEndMeters: 50, headDamage: 160, bodyDamage: 40, legDamage: 34 },
    ],
  },
}
const melee = {
  uuid: '2f59173c-4bed-b6c3-2191-dea9b58be9c7',
  displayName: 'Mêlée',
  category: 'EEquippableCategory::Melee',
  displayIcon: 'https://media.valorant-api.com/weapons/melee.png',
  shopData: null,
  weaponStats: null,
}
const source = { status: 200, data: [weapon, melee] }

describe('catalogue des armes Valorant', () => {
  it('normalise les données disponibles et conserve les valeurs nulles pour la mêlée', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createValorantWeaponsClient(fetcher)
    expect(await client.getWeapons()).toEqual({
      locale: 'fr-FR',
      data: [
        {
          id: weapon.uuid,
          name: 'Vandal',
          category: 'Rifle',
          icon: weapon.displayIcon,
          cost: 2900,
          magazine: 25,
          fireRate: 9.75,
          reloadSeconds: 2.5,
          pelletCount: 1,
          damageRanges: [{ start: 0, end: 50, head: 160, body: 40, leg: 34 }],
        },
        {
          id: melee.uuid,
          name: 'Mêlée',
          category: 'Melee',
          icon: melee.displayIcon,
          cost: null,
          magazine: null,
          fireRate: null,
          reloadSeconds: null,
          pelletCount: null,
          damageRanges: [],
        },
      ],
    })
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://valorant-api.com/v1/weapons?language=fr-FR',
    )
  })

  it('partage les requêtes et renouvelle le cache à expiration', async () => {
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createValorantWeaponsClient(fetcher, () => clock)
    await Promise.all([client.getWeapons(), client.getWeapons()])
    await client.getWeapons()
    expect(fetcher).toHaveBeenCalledTimes(1)
    clock += 60 * 60 * 1000 + 1
    await client.getWeapons()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('refuse une image externe et réessaie sans mettre l’erreur en cache', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 200,
            data: [
              { ...weapon, displayIcon: 'https://media.valorant-api.com.evil.test/image.png' },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(source)))
    const client = createValorantWeaponsClient(fetcher)
    await expect(client.getWeapons()).rejects.toBeInstanceOf(ValorantWeaponsUnavailableError)
    expect((await client.getWeapons()).data).toHaveLength(2)
  })

  it('écarte les statistiques et tranches de dégâts invalides', async () => {
    const client = createValorantWeaponsClient(
      async () =>
        new Response(
          JSON.stringify({
            status: 200,
            data: [
              {
                ...weapon,
                weaponStats: {
                  ...weapon.weaponStats,
                  magazineSize: -1,
                  damageRanges: [
                    {
                      rangeStartMeters: 30,
                      rangeEndMeters: 10,
                      headDamage: 1,
                      bodyDamage: 1,
                      legDamage: 1,
                    },
                  ],
                },
              },
            ],
          }),
        ),
    )
    const [result] = (await client.getWeapons()).data
    expect(result?.magazine).toBeNull()
    expect(result?.damageRanges).toEqual([])
  })
})
