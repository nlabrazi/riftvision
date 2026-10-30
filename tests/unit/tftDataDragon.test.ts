import { describe, expect, it, vi } from 'vitest'
import { DataDragonUnavailableError } from '../../server/utils/dataDragon'
import { createTftDataDragonClient } from '../../server/utils/tftDataDragon'

const unit = { id: 'DA_Ahri', name: 'Ahri', tier: 3, cost: 3, image: { full: 'DA_Ahri.png' } }
const tutorial = {
  id: 'TFTTutorial_Zed',
  name: 'Zed',
  tier: 2,
  cost: 0,
  image: { full: 'TFTTutorial_Zed.png' },
}
const source = {
  data: {
    'Maps/Shipping/Map22/Sets/TFTSet18/Shop/DA_Ahri': unit,
    'Maps/Shipping/Map22/Sets/TFTSetTutorial/Shop/TFTTutorial_Zed': tutorial,
  },
}

describe('Data Dragon TFT', () => {
  it('charge les unités françaises et déduit uniquement les sets numériques identifiables', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createTftDataDragonClient(fetcher, async () => '16.21.1')
    const result = await client.getChampions()
    expect(result).toEqual({
      version: '16.21.1',
      locale: 'fr_FR',
      data: [
        { id: 'DA_Ahri', name: 'Ahri', tier: 3, cost: 3, icon: 'DA_Ahri.png', setNumber: 18 },
        {
          id: 'TFTTutorial_Zed',
          name: 'Zed',
          tier: 2,
          cost: 0,
          icon: 'TFTTutorial_Zed.png',
          setNumber: null,
        },
      ],
    })
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://ddragon.leagueoflegends.com/cdn/16.21.1/data/fr_FR/tft-champion.json',
    )
  })

  it('partage les requêtes et recharge en cas de nouvelle version', async () => {
    let version = '16.21.1'
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createTftDataDragonClient(fetcher, async () => version)
    await Promise.all([client.getChampions(), client.getChampions()])
    await client.getChampions()
    expect(fetcher).toHaveBeenCalledTimes(1)
    version = '16.22.1'
    expect((await client.getChampions()).version).toBe('16.22.1')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('renouvelle le catalogue après expiration du cache', async () => {
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createTftDataDragonClient(
      fetcher,
      async () => '16.21.1',
      () => clock,
    )
    await client.getChampions()
    clock += 24 * 60 * 60 * 1000 + 1
    await client.getChampions()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('refuse les données mal formées et réessaie sans mettre les erreurs en cache', async () => {
    let attempt = 0
    const fetcher = vi.fn<typeof fetch>(async () => {
      attempt++
      return new Response(
        JSON.stringify(
          attempt === 1
            ? { data: { invalid: { ...unit, image: { full: '../image.png' } } } }
            : source,
        ),
      )
    })
    const client = createTftDataDragonClient(fetcher, async () => '16.21.1')
    await expect(client.getChampions()).rejects.toBeInstanceOf(DataDragonUnavailableError)
    expect((await client.getChampions()).data).toHaveLength(2)
  })

  it('refuse les versions invalides avant toute requête', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const client = createTftDataDragonClient(fetcher, async () => '../invalid')
    await expect(client.getChampions()).rejects.toBeInstanceOf(DataDragonUnavailableError)
    expect(fetcher).not.toHaveBeenCalled()
  })
})

describe('traits Data Dragon TFT', () => {
  const traitsSource = {
    data: {
      trait: { id: 'DA_18_Solar', name: 'Solaire', image: { full: 'Trait_Icon_18_Solar.png' } },
      tutorial: { id: 'TFTTutorial_Assassin', name: 'Assassin', image: { full: 'Assassin.png' } },
    },
  }

  it('normalise les traits, partage les requêtes et renouvelle le cache par version et expiration', async () => {
    let version = '16.21.1'
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(traitsSource)))
    const client = createTftDataDragonClient(
      fetcher,
      async () => version,
      () => clock,
    )
    const [result] = await Promise.all([client.getTraits(), client.getTraits()])
    expect(result).toEqual({
      version,
      locale: 'fr_FR',
      data: [
        { id: 'DA_18_Solar', name: 'Solaire', icon: 'Trait_Icon_18_Solar.png' },
        { id: 'TFTTutorial_Assassin', name: 'Assassin', icon: 'Assassin.png' },
      ],
    })
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://ddragon.leagueoflegends.com/cdn/16.21.1/data/fr_FR/tft-trait.json',
    )
    expect(fetcher).toHaveBeenCalledTimes(1)
    clock += 24 * 60 * 60 * 1000 + 1
    await client.getTraits()
    version = '16.22.1'
    expect((await client.getTraits()).version).toBe(version)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('refuse les données mal formées et permet une nouvelle tentative', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { bad: { id: 'bad', name: 'Bad', image: { full: '../bad.png' } } },
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(traitsSource)))
    const client = createTftDataDragonClient(fetcher, async () => '16.21.1')
    await expect(client.getTraits()).rejects.toBeInstanceOf(DataDragonUnavailableError)
    expect((await client.getTraits()).data).toHaveLength(2)
  })

  it('refuse une version invalide avant toute requête', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const client = createTftDataDragonClient(fetcher, async () => '../invalid')
    await expect(client.getTraits()).rejects.toBeInstanceOf(DataDragonUnavailableError)
    expect(fetcher).not.toHaveBeenCalled()
  })
})
