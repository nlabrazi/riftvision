import { describe, expect, it, vi } from 'vitest'
import {
  createDataDragonClient,
  DataDragonChampionNotFoundError,
  DataDragonUnavailableError,
} from '../../server/utils/dataDragon'

const ahri = {
  id: 'Ahri',
  key: '103',
  name: 'Ahri',
  title: 'Renarde à neuf queues',
  image: { full: 'Ahri.png' },
  tags: ['Mage', 'Assassin'],
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Data Dragon', () => {
  it('charge les données françaises avec la même version et partage les requêtes simultanées', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith('/api/versions.json')) return response(['16.21.1'])
      if (url.endsWith('/champion.json'))
        return response({ version: '16.21.1', data: { Ahri: ahri } })
      if (url.endsWith('/champion/Ahri.json')) {
        return response({ version: '16.21.1', data: { Ahri: { ...ahri, spells: [{ id: 'Q' }] } } })
      }
      throw new Error(`URL inattendue : ${url}`)
    })
    const client = createDataDragonClient(fetcher)

    const [first, second] = await Promise.all([
      client.getChampion('Ahri'),
      client.getChampion('Ahri'),
    ])
    expect(first).toEqual(second)
    expect(first).toMatchObject({ version: '16.21.1', locale: 'fr_FR', data: { name: 'Ahri' } })
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(
      'https://ddragon.leagueoflegends.com/cdn/16.21.1/data/fr_FR/champion/Ahri.json',
    )
    await client.getChampions()
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('actualise la version après expiration et utilise le catalogue correspondant', async () => {
    let clock = 0
    let version = '16.21.1'
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith('/versions.json')) return response([version])
      return response({ version, data: { Ahri: ahri } })
    })
    const client = createDataDragonClient(fetcher, () => clock)
    expect((await client.getChampions()).version).toBe('16.21.1')
    version = '16.22.1'
    clock += 60 * 60 * 1000 + 1
    expect((await client.getChampions()).version).toBe('16.22.1')
    expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(
      'https://ddragon.leagueoflegends.com/cdn/16.22.1/data/fr_FR/champion.json',
    )
  })

  it('refuse les identifiants invalides ou absents du catalogue sans les transmettre à Riot', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) =>
      String(input).endsWith('/versions.json')
        ? response(['16.21.1'])
        : response({ version: '16.21.1', data: { Ahri: ahri } }),
    )
    const client = createDataDragonClient(fetcher)
    await expect(client.getChampion('../Ahri')).rejects.toBeInstanceOf(
      DataDragonChampionNotFoundError,
    )
    expect(fetcher).not.toHaveBeenCalled()
    await expect(client.getChampion('Unknown')).rejects.toBeInstanceOf(
      DataDragonChampionNotFoundError,
    )
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('ne met pas les erreurs ou les données invalides en cache', async () => {
    let attempts = 0
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith('/versions.json')) return response(['16.21.1'])
      attempts++
      if (attempts === 1) return response({}, 503)
      if (attempts === 2) return response({ version: '16.21.1', data: { Ahri: {} } })
      return response({ version: '16.21.1', data: { Ahri: ahri } })
    })
    const client = createDataDragonClient(fetcher)
    await expect(client.getChampions()).rejects.toBeInstanceOf(DataDragonUnavailableError)
    await expect(client.getChampions()).rejects.toBeInstanceOf(DataDragonUnavailableError)
    expect((await client.getChampions()).data.Ahri.name).toBe('Ahri')
    expect(attempts).toBe(3)
  })

  it('refuse une version inattendue plutôt que construire une URL arbitraire', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response(['../invalid']))
    const client = createDataDragonClient(fetcher)
    await expect(client.getChampions()).rejects.toBeInstanceOf(DataDragonUnavailableError)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
