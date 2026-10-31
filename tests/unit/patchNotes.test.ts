import { describe, expect, it, vi } from 'vitest'
import {
  createPatchNotesClient,
  createTftPatchNotesClient,
  createValorantPatchNotesClient,
  parsePatchNotes,
  parseTftPatchNotes,
  parseValorantPatchNotes,
  PatchNotesUnavailableError,
} from '../../server/utils/patchNotes'

function article(title: string, url: string, date: string) {
  return {
    title,
    publishedAt: date,
    product: { machineName: 'league_of_legends' },
    action: { payload: { url } },
  }
}

function page(items: unknown[]) {
  return `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { page: { blades: [{ items }] } } } })}</script></html>`
}

describe('notes de patch Riot', () => {
  it('extrait les liens officiels, supprime les doublons et classe par date', () => {
    const old = article(
      'Notes 26.20',
      '/fr-fr/news/game-updates/patch-26-20-notes',
      '2026-10-06T18:00:00.000Z',
    )
    const latest = article(
      'Notes 26.21',
      '/fr-fr/news/game-updates/patch-26-21-notes',
      '2026-10-20T18:00:00.000Z',
    )
    const result = parsePatchNotes(
      page([
        old,
        latest,
        latest,
        article(
          'Externe',
          'https://evil.example/fr-fr/news/game-updates/patch-notes',
          '2026-10-22T18:00:00.000Z',
        ),
      ]),
    )
    expect(result.articles.map((item) => item.title)).toEqual(['Notes 26.21', 'Notes 26.20'])
    expect(result.articles[0].url).toBe(
      'https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-26-21-notes',
    )
  })

  it('rejette une structure absente ou invalide', () => {
    expect(() => parsePatchNotes('<html></html>')).toThrow(PatchNotesUnavailableError)
    expect(() => parsePatchNotes('<script id="__NEXT_DATA__">{</script>')).toThrow(
      PatchNotesUnavailableError,
    )
    expect(() => parsePatchNotes(page([]))).toThrow(PatchNotesUnavailableError)
  })

  it('partage les requêtes en cours et renouvelle le cache après une heure', async () => {
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(
          page([
            article(
              'Notes 26.21',
              '/fr-fr/news/game-updates/patch-26-21-notes',
              '2026-10-20T18:00:00Z',
            ),
          ]),
        ),
    )
    const client = createPatchNotesClient(fetcher, () => clock)
    await Promise.all([client.getPatchNotes(), client.getPatchNotes()])
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(1)
    clock += 60 * 60 * 1000 + 1
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('ne met pas une erreur en cache et réessaie', async () => {
    let attempt = 0
    const fetcher = vi.fn<typeof fetch>(async () => {
      attempt++
      return attempt === 1
        ? new Response('', { status: 503 })
        : new Response(
            page([
              article('Notes', '/fr-fr/news/game-updates/patch-notes', '2026-10-20T18:00:00Z'),
            ]),
          )
    })
    const client = createPatchNotesClient(fetcher)
    await expect(client.getPatchNotes()).rejects.toBeInstanceOf(PatchNotesUnavailableError)
    expect((await client.getPatchNotes()).articles).toHaveLength(1)
  })
})

describe('notes de patch TFT', () => {
  const item = (title: string, url: string, date: string, product = 'teamfight_tactics') => ({
    title,
    publishedAt: date,
    product: { machineName: product },
    action: { payload: { url } },
  })
  it('conserve les articles TFT officiels récents et anciens et écarte les liens invalides', () => {
    const result = parseTftPatchNotes(
      page([
        item('Patch 14.14', '/fr-fr/news/game-updates/tft-patch-14-14', '2024-07-16T18:00:00Z'),
        item(
          'Patch 18.5',
          '/fr-fr/news/game-updates/teamfight-tactics-patch-18-5',
          '2026-10-20T18:00:00Z',
        ),
        item(
          'Doublon',
          '/fr-fr/news/game-updates/teamfight-tactics-patch-18-5/',
          '2026-10-20T18:00:00Z',
        ),
        item(
          'Patch 9.24B',
          '/fr-fr/news/game-updates/notes-de-patch-9-24b-de-teamfight-tactics/',
          '2019-12-10T18:00:00Z',
        ),
        item(
          'Autre jeu',
          '/fr-fr/news/game-updates/patch-18-6-notes',
          '2026-10-22T18:00:00Z',
          'league_of_legends',
        ),
        item(
          'Domaine externe',
          'https://evil.example/fr-fr/news/game-updates/tft-patch-18-6',
          '2026-10-22T18:00:00Z',
        ),
        item(
          'Identifiants dans URL',
          'https://user@teamfighttactics.leagueoflegends.com/fr-fr/news/game-updates/tft-patch-18-6',
          '2026-10-22T18:00:00Z',
        ),
        item('Requête', '/fr-fr/news/game-updates/tft-patch-18-6?x=1', '2026-10-22T18:00:00Z'),
        item('Sans patch', '/fr-fr/news/game-updates/something-else', '2026-10-22T18:00:00Z'),
        item('Date invalide', '/fr-fr/news/game-updates/tft-patch-18-6', 'not-a-date'),
        item('   ', '/fr-fr/news/game-updates/tft-patch-18-6', '2026-10-22T18:00:00Z'),
      ]),
    )
    expect(result.sourceUrl).toBe(
      'https://teamfighttactics.leagueoflegends.com/fr-fr/news/tags/patch-notes/',
    )
    expect(result.articles.map((entry) => entry.title)).toEqual([
      'Patch 18.5',
      'Patch 14.14',
      'Patch 9.24B',
    ])
    expect(result.articles[0]?.url).toBe(
      'https://teamfighttactics.leagueoflegends.com/fr-fr/news/game-updates/teamfight-tactics-patch-18-5',
    )
  })

  it('partage les requêtes, renouvelle le cache et ne conserve pas les erreurs', async () => {
    let clock = 0
    let available = false
    const fetcher = vi.fn<typeof fetch>(async () =>
      available
        ? new Response(
            page([
              item(
                'Patch 18.5',
                '/fr-fr/news/game-updates/teamfight-tactics-patch-18-5',
                '2026-10-20T18:00:00Z',
              ),
            ]),
          )
        : new Response('', { status: 503 }),
    )
    const client = createTftPatchNotesClient(fetcher, () => clock)
    await expect(client.getPatchNotes()).rejects.toBeInstanceOf(PatchNotesUnavailableError)
    available = true
    await Promise.all([client.getPatchNotes(), client.getPatchNotes()])
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(String(fetcher.mock.calls[1]?.[0])).toBe(
      'https://teamfighttactics.leagueoflegends.com/fr-fr/news/tags/patch-notes/',
    )
    clock += 60 * 60 * 1000 + 1
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})

describe('notes de patch Valorant', () => {
  const item = (title: string, url: string, date: string, product = 'valorant') => ({
    title,
    publishedAt: date,
    product: { machineName: product },
    action: { payload: { url } },
  })
  it('conserve les articles officiels Valorant, classe par date et rejette les autres liens', () => {
    const result = parseValorantPatchNotes(
      page([
        item(
          'Patch 1.0',
          '/fr-fr/news/game-updates/notes-de-patch-1-0-de-valorant/',
          '2020-06-02T18:00:00Z',
        ),
        item(
          'Patch 13.09',
          '/fr-fr/news/game-updates/valorant-patch-notes-1309',
          '2026-10-27T13:00:00Z',
        ),
        item('Patch 10.07', '/fr-fr/news/valorant-patch-notes-10-07', '2025-04-15T13:00:00Z'),
        item(
          'Doublon',
          '/fr-fr/news/game-updates/valorant-patch-notes-1309/',
          '2026-10-27T13:00:00Z',
        ),
        item(
          'Autre jeu',
          '/fr-fr/news/game-updates/patch-18-6-notes',
          '2026-10-28T18:00:00Z',
          'teamfight_tactics',
        ),
        item(
          'Domaine externe',
          'https://evil.example/fr-fr/news/game-updates/valorant-patch-notes-1310',
          '2026-10-28T18:00:00Z',
        ),
        item(
          'Identifiants dans URL',
          'https://user@playvalorant.com/fr-fr/news/game-updates/valorant-patch-notes-1310',
          '2026-10-28T18:00:00Z',
        ),
        item(
          'Requête',
          '/fr-fr/news/game-updates/valorant-patch-notes-1310?x=1',
          '2026-10-28T18:00:00Z',
        ),
        item(
          'Mauvais chemin',
          '/fr-fr/news/esports/valorant-patch-notes-1310',
          '2026-10-28T18:00:00Z',
        ),
        item(
          'Sans notes',
          '/fr-fr/news/game-updates/valorant-patch-update',
          '2026-10-28T18:00:00Z',
        ),
        item('Date invalide', '/fr-fr/news/game-updates/valorant-patch-notes-1310', 'invalid'),
      ]),
    )
    expect(result.sourceUrl).toBe('https://playvalorant.com/fr-fr/news/tags/patch-notes/')
    expect(result.articles.map((entry) => entry.title)).toEqual([
      'Patch 13.09',
      'Patch 10.07',
      'Patch 1.0',
    ])
    expect(result.articles[0]?.url).toBe(
      'https://playvalorant.com/fr-fr/news/game-updates/valorant-patch-notes-1309',
    )
  })
  it('partage les requêtes, renouvelle le cache et ne conserve pas les erreurs', async () => {
    let clock = 0
    let available = false
    const fetcher = vi.fn<typeof fetch>(async () =>
      available
        ? new Response(
            page([
              item(
                'Patch 13.09',
                '/fr-fr/news/game-updates/valorant-patch-notes-1309',
                '2026-10-27T13:00:00Z',
              ),
            ]),
          )
        : new Response('', { status: 503 }),
    )
    const client = createValorantPatchNotesClient(fetcher, () => clock)
    await expect(client.getPatchNotes()).rejects.toBeInstanceOf(PatchNotesUnavailableError)
    available = true
    await Promise.all([client.getPatchNotes(), client.getPatchNotes()])
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(String(fetcher.mock.calls[1]?.[0])).toBe(
      'https://playvalorant.com/fr-fr/news/tags/patch-notes/',
    )
    clock += 60 * 60 * 1000 + 1
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
