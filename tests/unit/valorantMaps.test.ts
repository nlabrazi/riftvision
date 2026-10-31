import { describe, expect, it, vi } from 'vitest'
import {
  createValorantMapsClient,
  ValorantMapsUnavailableError,
} from '../../server/utils/valorantMaps'

const ascent = {
  uuid: '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319',
  displayName: 'Ascent',
  splash: 'https://media.valorant-api.com/maps/ascent/splash.png',
  displayIcon: 'https://media.valorant-api.com/maps/ascent/plan.png',
  tacticalDescription: 'Sites A/B',
  narrativeDescription: null,
  callouts: [
    { regionName: 'Tree', superRegionName: 'A' },
    { regionName: 'Tree', superRegionName: 'A' },
    { regionName: 'Main', superRegionName: 'B' },
    { regionName: '', superRegionName: 'B' },
  ],
}
const training = {
  uuid: 'ee613ee9-28b7-4beb-9666-08db13bb2244',
  displayName: 'Entraînement',
  splash: null,
  displayIcon: null,
  callouts: null,
}
const source = { status: 200, data: [ascent, training] }

describe('catalogue des cartes Valorant', () => {
  it('normalise les plans et les noms de zones, et accepte les données absentes', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createValorantMapsClient(fetcher)
    expect(await client.getMaps()).toEqual({
      locale: 'fr-FR',
      data: [
        {
          id: ascent.uuid,
          name: 'Ascent',
          splash: ascent.splash,
          minimap: ascent.displayIcon,
          tacticalDescription: 'Sites A/B',
          narrativeDescription: null,
          callouts: [
            { area: 'A', region: 'Tree' },
            { area: 'B', region: 'Main' },
          ],
        },
        {
          id: training.uuid,
          name: 'Entraînement',
          splash: null,
          minimap: null,
          tacticalDescription: null,
          narrativeDescription: null,
          callouts: [],
        },
      ],
    })
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://valorant-api.com/v1/maps?language=fr-FR',
    )
  })

  it('partage les requêtes et renouvelle le cache à expiration', async () => {
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createValorantMapsClient(fetcher, () => clock)
    await Promise.all([client.getMaps(), client.getMaps()])
    await client.getMaps()
    expect(fetcher).toHaveBeenCalledTimes(1)
    clock += 60 * 60 * 1000 + 1
    await client.getMaps()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('refuse les catalogues invalides et réessaie sans mettre les erreurs en cache', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 200, data: [ascent, ascent] })))
      .mockResolvedValueOnce(new Response(JSON.stringify(source)))
    const client = createValorantMapsClient(fetcher)
    await expect(client.getMaps()).rejects.toBeInstanceOf(ValorantMapsUnavailableError)
    expect((await client.getMaps()).data).toHaveLength(2)
  })

  it('écarte les images externes et nettoie les champs textuels', async () => {
    const client = createValorantMapsClient(
      async () =>
        new Response(
          JSON.stringify({
            status: 200,
            data: [
              {
                ...ascent,
                splash: 'https://media.valorant-api.com.evil.test/splash.png',
                displayIcon: 'http://media.valorant-api.com/map.png',
                tacticalDescription: '<b>Sites A/B</b>',
                callouts: [{ regionName: '<b>Tree</b>', superRegionName: 'A' }],
              },
            ],
          }),
        ),
    )
    const [map] = (await client.getMaps()).data
    expect(map?.splash).toBeNull()
    expect(map?.minimap).toBeNull()
    expect(map?.tacticalDescription).toBe('Sites A/B')
    expect(map?.callouts).toEqual([{ region: 'Tree', area: 'A' }])
  })
})
