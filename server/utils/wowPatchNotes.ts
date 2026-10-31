import type { PatchNoteLink, PatchNotesResponse } from '#shared/types/patchNotes'
import { patchNoteDescription, patchNoteImage } from './patchNoteMedia'

export const WOW_PATCH_NOTES_SOURCE =
  'https://worldofwarcraft.blizzard.com/fr-fr/content-update-notes'
const ORIGIN = 'https://worldofwarcraft.blizzard.com'
const TTL = 60 * 60 * 1000
const MAX_PAGES = 20

export class WowPatchNotesUnavailableError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Lit les métadonnées intégrées à une page de l'archive officielle Blizzard. */
export function parseWowPatchNotesPage(html: string, expectedPage: number) {
  const match = html.match(
    /<script\b[^>]*\bid=["']model["'][^>]*>\s*model\s*=\s*([\s\S]*?)\s*;?\s*<\/script>/i,
  )
  if (!match?.[1]) throw new WowPatchNotesUnavailableError('Données Blizzard introuvables.')
  let root: unknown
  try {
    root = JSON.parse(match[1].replace(/;\s*$/, ''))
  } catch {
    throw new WowPatchNotesUnavailableError('Données Blizzard invalides.')
  }
  if (
    !isRecord(root) ||
    !Array.isArray(root.blogs) ||
    !isRecord(root.page) ||
    root.page.page !== expectedPage ||
    typeof root.page.total !== 'number' ||
    !Number.isInteger(root.page.total) ||
    root.page.total < expectedPage ||
    root.page.total > MAX_PAGES
  ) {
    throw new WowPatchNotesUnavailableError('Pagination Blizzard invalide.')
  }
  const articles: PatchNoteLink[] = []
  for (const item of root.blogs) {
    if (
      !isRecord(item) ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      typeof item.published !== 'string' ||
      !Number.isFinite(Date.parse(item.published)) ||
      typeof item.url !== 'string'
    )
      continue
    let url: URL
    try {
      url = new URL(item.url, ORIGIN)
    } catch {
      continue
    }
    if (
      url.origin !== ORIGIN ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^\/news\/\d+\/[^/]+\/?$/.test(url.pathname)
    )
      continue
    articles.push({
      title: item.title.trim(),
      publishedAt: item.published,
      url: `${ORIGIN}/fr-fr${url.pathname}`,
      description: patchNoteDescription(item.description),
      imageUrl: patchNoteImage(
        isRecord(item.image) ? item.image.url : null,
        'bnetcmsus-a.akamaihd.net',
      ),
    })
  }
  if (!articles.length) throw new WowPatchNotesUnavailableError('Aucune note Blizzard disponible.')
  return { articles, totalPages: root.page.total }
}

export function createWowPatchNotesClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let cached: { value: PatchNotesResponse; expiresAt: number } | null = null
  let pending: Promise<PatchNotesResponse> | null = null

  async function getPatchNotes(): Promise<PatchNotesResponse> {
    if (cached && cached.expiresAt > now()) return cached.value
    if (pending) return pending
    pending = (async () => {
      try {
        const loadPage = async (page: number) => {
          const url = new URL(WOW_PATCH_NOTES_SOURCE)
          if (page > 1) url.searchParams.set('page', String(page))
          const response = await fetcher(url.href, { signal: AbortSignal.timeout(5000) })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return parseWowPatchNotesPage(await response.text(), page)
        }
        const first = await loadPage(1)
        const rest = await Promise.all(
          Array.from({ length: first.totalPages - 1 }, (_, index) => loadPage(index + 2)),
        )
        if (rest.some((page) => page.totalPages !== first.totalPages))
          throw new Error('Pagination modifiée')
        const seen = new Set<string>()
        const articles = [first, ...rest]
          .flatMap((page) => page.articles)
          .filter((article) => {
            const key = article.url.replace(/\/+$/, '')
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        const value = { sourceUrl: WOW_PATCH_NOTES_SOURCE, articles }
        cached = { value, expiresAt: now() + TTL }
        return value
      } catch {
        throw new WowPatchNotesUnavailableError(
          'Les notes Blizzard sont temporairement indisponibles.',
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

export const wowPatchNotes = createWowPatchNotesClient()
