import { describe, expect, it, vi } from 'vitest'
import {
  createWowPatchNotesClient,
  parseWowPatchNotesPage,
  WowPatchNotesUnavailableError,
} from '../../server/utils/wowPatchNotes'

const article = (title: string, url: string, published = '2026-10-07T00:50:00.000Z') => ({
  title,
  url,
  published,
})
const page = (pageNumber: number, total: number, blogs: unknown[]) =>
  `<script id="model">model = ${JSON.stringify({ page: { page: pageNumber, total }, blogs })}</script>`

describe('archive des mises à jour WoW', () => {
  it('extrait les articles de l’archive et refuse les liens et dates invalides', () => {
    const result = parseWowPatchNotesPage(
      page(1, 1, [
        article('Correctifs', '/news/24296142/correctifs-6-octobre-2026'),
        article('Domaine externe', 'https://evil.example/news/123/x'),
        article('Identifiants', 'https://user@worldofwarcraft.blizzard.com/news/123/x'),
        article('Lien externe', '//evil.example/news/123/x'),
        article('Autre chemin', '/fr-fr/shop/123/x'),
        article('Paramètre', '/news/123/x?a=1'),
        article('Date invalide', '/news/123/x', 'invalid'),
        article('  ', '/news/123/x'),
      ]),
      1,
    )
    expect(result.articles).toEqual([
      {
        title: 'Correctifs',
        description: null,
        imageUrl: null,
        publishedAt: '2026-10-07T00:50:00.000Z',
        url: 'https://worldofwarcraft.blizzard.com/fr-fr/news/24296142/correctifs-6-octobre-2026',
      },
    ])
  })

  it('conserve la vignette et le résumé Blizzard sans faire confiance à un domaine externe', () => {
    const result = parseWowPatchNotesPage(
      page(1, 1, [
        {
          ...article('Correctifs', '/news/1/correctifs'),
          description: 'Ajustements <b>de classes</b>.',
          image: { url: '//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/image.png' },
        },
        {
          ...article('Ancien', '/news/2/ancien'),
          description: '',
          image: { url: 'https://evil.example/image.png' },
        },
      ]),
      1,
    )
    expect(result.articles[0]).toMatchObject({
      description: 'Ajustements de classes.',
      imageUrl: 'https://bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/image.png',
    })
    expect(result.articles[1]).toMatchObject({ description: null, imageUrl: null })
  })

  it('rejette les données absentes, malformées ou une pagination incohérente', () => {
    for (const html of [
      '<html></html>',
      '<script id="model">model = {</script>',
      page(2, 2, []),
      page(1, 21, []),
      page(1, 1, []),
    ]) {
      expect(() => parseWowPatchNotesPage(html, 1)).toThrow(WowPatchNotesUnavailableError)
    }
  })

  it('récupère les pages dans leur ordre, déduplique et partage le cache une heure', async () => {
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const number = Number(new URL(String(input)).searchParams.get('page') || 1)
      return new Response(
        number === 1
          ? page(1, 2, [article('Récent', '/news/1/recent')])
          : page(2, 2, [
              article('Doublon', '/news/1/recent/'),
              article('Ancien', '/news/2/ancien'),
            ]),
      )
    })
    const client = createWowPatchNotesClient(fetcher, () => clock)
    const [result] = await Promise.all([client.getPatchNotes(), client.getPatchNotes()])
    expect(result.articles.map((item) => item.title)).toEqual(['Récent', 'Ancien'])
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(2)
    clock += 3600001
    await client.getPatchNotes()
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  it('ne met pas les erreurs en cache et refuse un historique partiel', async () => {
    let available = false
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const number = Number(new URL(String(input)).searchParams.get('page') || 1)
      if (number === 2 && !available) return new Response('', { status: 503 })
      return new Response(page(number, 2, [article(`Page ${number}`, `/news/${number}/article`)]))
    })
    const client = createWowPatchNotesClient(fetcher)
    await expect(client.getPatchNotes()).rejects.toBeInstanceOf(WowPatchNotesUnavailableError)
    available = true
    expect((await client.getPatchNotes()).articles).toHaveLength(2)
    expect(fetcher).toHaveBeenCalledTimes(4)
  })
})
