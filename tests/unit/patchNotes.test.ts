import { describe, expect, it, vi } from 'vitest'
import {
  createPatchNotesClient,
  parsePatchNotes,
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
