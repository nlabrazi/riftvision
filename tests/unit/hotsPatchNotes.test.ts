import { describe, expect, it, vi } from 'vitest'
import {
  createHotsPatchNotesClient,
  HotsPatchNotesUnavailableError,
  parseHotsFeedPage,
} from '../../server/utils/hotsPatchNotes'

function item(
  title = 'Notes de mise à jour de Heroes of the Storm (20 juillet 2026)',
  url = 'https://news.blizzard.com/fr-fr/article/24291432/notes-de-mise-a-jour-de-heroes-of-the-storm-20-juillet-2026',
) {
  return {
    properties: {
      title,
      newsUrl: url,
      lastUpdated: '2026-07-20T17:35:15Z',
      summary: 'Des ajustements <b>de héros</b>.',
      cxpProduct: { segment: 'heroes-of-the-storm' },
      staticAsset: { imageUrl: '//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/image.png' },
    },
  }
}
function feed(offset: number, contentItems: unknown[], hasNextPage = false) {
  return { contentItems, pagination: { offset, limit: 15, hasNextPage } }
}

describe('notes de mise à jour Heroes of the Storm', () => {
  it('extrait les notes françaises officielles, leurs images et leur date de modification', () => {
    const result = parseHotsFeedPage(
      feed(0, [
        item(),
        item('Autre actualité Heroes of the Storm'),
        item(
          'Notes de mise à jour de Heroes of the Storm',
          'https://evil.example/fr-fr/article/1/notes',
        ),
        item(
          'Notes de mise à jour de Heroes of the Storm',
          'https://user@news.blizzard.com/fr-fr/article/1/notes',
        ),
        item(
          'Notes de mise à jour de Heroes of the Storm',
          'https://news.blizzard.com/fr-fr/article/1/notes?x=1',
        ),
        { ...item(), properties: { ...item().properties, cxpProduct: { segment: 'wow' } } },
      ]),
      0,
    )
    expect(result.articles).toEqual([
      {
        title: 'Notes de mise à jour de Heroes of the Storm (20 juillet 2026)',
        url: 'https://news.blizzard.com/fr-fr/article/24291432/notes-de-mise-a-jour-de-heroes-of-the-storm-20-juillet-2026',
        updatedAt: '2026-07-20T17:35:15Z',
        description: 'Des ajustements de héros.',
        imageUrl: 'https://bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/image.png',
      },
    ])
  })

  it('n’utilise pas les images externes et rejette les pages malformées', () => {
    const badImage = item()
    badImage.properties.staticAsset.imageUrl = 'https://evil.example/image.png'
    expect(parseHotsFeedPage(feed(0, [badImage]), 0).articles[0]?.imageUrl).toBeNull()
    expect(() => parseHotsFeedPage({}, 0)).toThrow(HotsPatchNotesUnavailableError)
    expect(() => parseHotsFeedPage(feed(15, []), 0)).toThrow(HotsPatchNotesUnavailableError)
    expect(() => parseHotsFeedPage(feed(0, [], true), 0)).toThrow(HotsPatchNotesUnavailableError)
  })

  it('déduplique les notes et ignore les erreurs des pages après la fin du fil', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const offset = Number(new URL(String(input)).searchParams.get('offset'))
      if (offset === 0) return Response.json(feed(0, [item()], true))
      if (offset === 15)
        return Response.json(
          feed(15, [
            item(),
            item(
              'Notes de mise à jour de Heroes of the Storm – ancienne',
              'https://news.blizzard.com/fr-fr/article/2/ancienne',
            ),
          ]),
        )
      return new Response('', { status: 404 })
    })
    const client = createHotsPatchNotesClient(fetcher)
    const result = await client.getPatchNotes()
    expect(result.articles).toHaveLength(2)
    expect(result.truncated).toBe(false)
  })

  it('partage les appels, indique la limite et renouvelle le cache', async () => {
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const offset = Number(new URL(String(input)).searchParams.get('offset'))
      return Response.json(feed(offset, [item()], true))
    })
    const client = createHotsPatchNotesClient(fetcher, () => clock)
    const [result] = await Promise.all([client.getPatchNotes(), client.getPatchNotes()])
    expect(result.truncated).toBe(true)
    expect(result.articles).toHaveLength(1)
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(8)
    clock += 3600001
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(16)
  })

  it('ne garde pas une erreur en cache et refuse un historique incomplet', async () => {
    let available = false
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const offset = Number(new URL(String(input)).searchParams.get('offset'))
      if (offset === 15 && !available) return new Response('', { status: 503 })
      return Response.json(feed(offset, [item()], offset === 0))
    })
    const client = createHotsPatchNotesClient(fetcher)
    await expect(client.getPatchNotes()).rejects.toBeInstanceOf(HotsPatchNotesUnavailableError)
    available = true
    expect((await client.getPatchNotes()).articles).toHaveLength(1)
  })
})
