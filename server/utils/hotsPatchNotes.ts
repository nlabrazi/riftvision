import type { HotsPatchNote, HotsPatchNotesResponse } from '#shared/types/hots'
import { patchNoteDescription, patchNoteImage } from './patchNoteMedia'

export const HOTS_PATCH_NOTES_SOURCE = 'https://news.blizzard.com/fr-fr/feed/heroes-of-the-storm'
const FEED_URL = 'https://news.blizzard.com/fr-fr/api/feed/heroes-of-the-storm'
const TTL = 60 * 60 * 1000
const MAX_PAGES = 8
const PAGE_SIZE = 15

export class HotsPatchNotesUnavailableError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Le fil contient également des actualités d'autres jeux : seules les notes HotS sont retenues. */
export function parseHotsFeedPage(body: unknown, expectedOffset: number) {
  if (
    !isRecord(body) ||
    !Array.isArray(body.contentItems) ||
    !isRecord(body.pagination) ||
    body.pagination.offset !== expectedOffset ||
    body.pagination.limit !== PAGE_SIZE ||
    typeof body.pagination.hasNextPage !== 'boolean' ||
    body.contentItems.length > PAGE_SIZE ||
    (body.pagination.hasNextPage && body.contentItems.length === 0)
  )
    throw new HotsPatchNotesUnavailableError('Fil Blizzard invalide.')

  const articles: HotsPatchNote[] = []
  for (const entry of body.contentItems) {
    if (!isRecord(entry) || !isRecord(entry.properties)) continue
    const item = entry.properties
    if (
      !isRecord(item.cxpProduct) ||
      item.cxpProduct.segment !== 'heroes-of-the-storm' ||
      typeof item.title !== 'string' ||
      typeof item.lastUpdated !== 'string' ||
      !Number.isFinite(Date.parse(item.lastUpdated)) ||
      typeof item.newsUrl !== 'string'
    )
      continue
    const normalizedTitle = item.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr-FR')
      .replace(/\s+/g, ' ')
    if (
      !normalizedTitle.includes('notes de mise a jour') ||
      !normalizedTitle.includes('heroes of the storm')
    )
      continue
    let url: URL
    try {
      url = new URL(item.newsUrl)
    } catch {
      continue
    }
    if (
      url.origin !== 'https://news.blizzard.com' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^\/fr-fr\/article\/\d+\/[a-z0-9-]+\/?$/.test(url.pathname)
    )
      continue
    articles.push({
      title: item.title.trim(),
      updatedAt: item.lastUpdated,
      url: url.href,
      description: patchNoteDescription(item.summary),
      imageUrl: patchNoteImage(
        isRecord(item.staticAsset) ? item.staticAsset.imageUrl : null,
        'bnetcmsus-a.akamaihd.net',
      ),
    })
  }
  return { articles, hasNextPage: body.pagination.hasNextPage }
}

export function createHotsPatchNotesClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let cached: { value: HotsPatchNotesResponse; expiresAt: number } | null = null
  let pending: Promise<HotsPatchNotesResponse> | null = null
  async function getPatchNotes(): Promise<HotsPatchNotesResponse> {
    if (cached && cached.expiresAt > now()) return cached.value
    if (pending) return pending
    pending = (async () => {
      try {
        const loadPage = async (offset: number) => {
          const url = new URL(FEED_URL)
          url.searchParams.set('offset', String(offset))
          const response = await fetcher(url.href, { signal: AbortSignal.timeout(5000) })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return parseHotsFeedPage(await response.json(), offset)
        }
        const first = await loadPage(0)
        const rest = first.hasNextPage
          ? await Promise.allSettled(
              Array.from({ length: MAX_PAGES - 1 }, (_, i) => loadPage((i + 1) * PAGE_SIZE)),
            )
          : []
        const seen = new Set<string>()
        const articles: HotsPatchNote[] = []
        let current = first
        let pageIndex = 0
        while (true) {
          for (const article of current.articles) {
            const key = new URL(article.url).pathname.replace(/\/+$/, '')
            if (!seen.has(key)) {
              seen.add(key)
              articles.push(article)
            }
          }
          if (!current.hasNextPage) break
          if (pageIndex === MAX_PAGES - 1) break
          const next = rest[pageIndex]
          if (!next || next.status === 'rejected') throw new Error('Page Blizzard indisponible')
          current = next.value
          pageIndex++
        }
        const truncated = pageIndex === MAX_PAGES - 1 && current.hasNextPage
        if (!articles.length) throw new Error('Aucune note disponible')
        const value = { sourceUrl: HOTS_PATCH_NOTES_SOURCE, articles, truncated }
        cached = { value, expiresAt: now() + TTL }
        return value
      } catch {
        throw new HotsPatchNotesUnavailableError(
          'Les notes HotS sont temporairement indisponibles.',
        )
      }
    })()
    try {
      return await pending
    } finally {
      pending = null
    }
  }
  return { getPatchNotes }
}

export const hotsPatchNotes = createHotsPatchNotesClient()
