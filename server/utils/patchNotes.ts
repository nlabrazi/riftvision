import type { PatchNoteLink, PatchNotesResponse } from '#shared/types/patchNotes'

export const PATCH_NOTES_SOURCE = 'https://www.leagueoflegends.com/fr-fr/news/tags/patch-notes/'
const ORIGIN = 'https://www.leagueoflegends.com'
const TTL = 60 * 60 * 1000

export class PatchNotesUnavailableError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Lit uniquement les métadonnées nécessaires dans les données intégrées à la page Riot. */
export function parsePatchNotes(html: string): PatchNotesResponse {
  const match = html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!match?.[1]) throw new PatchNotesUnavailableError('Données Riot introuvables.')
  let root: unknown
  try {
    root = JSON.parse(match[1])
  } catch {
    throw new PatchNotesUnavailableError('Données Riot invalides.')
  }
  if (
    !isRecord(root) ||
    !isRecord(root.props) ||
    !isRecord(root.props.pageProps) ||
    !isRecord(root.props.pageProps.page) ||
    !Array.isArray(root.props.pageProps.page.blades)
  ) {
    throw new PatchNotesUnavailableError('Données Riot invalides.')
  }
  const articles: PatchNoteLink[] = []
  const seen = new Set<string>()
  for (const blade of root.props.pageProps.page.blades) {
    if (!isRecord(blade) || !Array.isArray(blade.items)) continue
    for (const item of blade.items) {
      if (
        !isRecord(item) ||
        typeof item.title !== 'string' ||
        typeof item.publishedAt !== 'string' ||
        !Number.isFinite(Date.parse(item.publishedAt)) ||
        !isRecord(item.product) ||
        item.product.machineName !== 'league_of_legends' ||
        !isRecord(item.action) ||
        !isRecord(item.action.payload) ||
        typeof item.action.payload.url !== 'string'
      )
        continue
      let url: URL
      try {
        url = new URL(item.action.payload.url, ORIGIN)
      } catch {
        continue
      }
      if (
        url.origin !== ORIGIN ||
        !/^\/fr-fr\/news\/game-updates\/[a-z0-9-]+\/?$/.test(url.pathname) ||
        !url.pathname.includes('patch') ||
        !url.pathname.includes('notes') ||
        url.search ||
        url.hash ||
        seen.has(url.href)
      )
        continue
      seen.add(url.href)
      articles.push({ title: item.title, publishedAt: item.publishedAt, url: url.href })
    }
  }
  if (!articles.length)
    throw new PatchNotesUnavailableError('Aucune note de patch Riot disponible.')
  articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  return { sourceUrl: PATCH_NOTES_SOURCE, articles }
}

export function createPatchNotesClient(
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
        const response = await fetcher(PATCH_NOTES_SOURCE, { signal: AbortSignal.timeout(5000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const value = parsePatchNotes(await response.text())
        cached = { value, expiresAt: now() + TTL }
        return value
      } catch {
        throw new PatchNotesUnavailableError(
          'Les notes de patch sont temporairement indisponibles.',
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

export const patchNotes = createPatchNotesClient()
