import type { PatchNoteLink, PatchNotesResponse } from '#shared/types/patchNotes'

export const PATCH_NOTES_SOURCE = 'https://www.leagueoflegends.com/fr-fr/news/tags/patch-notes/'
export const TFT_PATCH_NOTES_SOURCE =
  'https://teamfighttactics.leagueoflegends.com/fr-fr/news/tags/patch-notes/'
const LOL_CONFIG = {
  source: PATCH_NOTES_SOURCE,
  origin: 'https://www.leagueoflegends.com',
  product: 'league_of_legends',
  requireNotes: true,
}
const TFT_CONFIG = {
  source: TFT_PATCH_NOTES_SOURCE,
  origin: 'https://teamfighttactics.leagueoflegends.com',
  product: 'teamfight_tactics',
  requireNotes: false,
}
const TTL = 60 * 60 * 1000

export class PatchNotesUnavailableError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Lit uniquement les métadonnées nécessaires dans les données intégrées à la page Riot. */
function parseRiotPatchNotes(html: string, config: typeof LOL_CONFIG): PatchNotesResponse {
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
        !item.title.trim() ||
        typeof item.publishedAt !== 'string' ||
        !Number.isFinite(Date.parse(item.publishedAt)) ||
        !isRecord(item.product) ||
        item.product.machineName !== config.product ||
        !isRecord(item.action) ||
        !isRecord(item.action.payload) ||
        typeof item.action.payload.url !== 'string'
      )
        continue
      let url: URL
      try {
        url = new URL(item.action.payload.url, config.origin)
      } catch {
        continue
      }
      if (
        url.origin !== config.origin ||
        url.username ||
        url.password ||
        !/^\/fr-fr\/news\/game-updates\/[a-z0-9-]+\/?$/.test(url.pathname) ||
        !url.pathname.includes('patch') ||
        (config.requireNotes && !url.pathname.includes('notes')) ||
        url.search ||
        url.hash ||
        seen.has(url.pathname.replace(/\/+$/, ''))
      )
        continue
      seen.add(url.pathname.replace(/\/+$/, ''))
      articles.push({ title: item.title, publishedAt: item.publishedAt, url: url.href })
    }
  }
  if (!articles.length)
    throw new PatchNotesUnavailableError('Aucune note de patch Riot disponible.')
  articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  return { sourceUrl: config.source, articles }
}

export function parsePatchNotes(html: string): PatchNotesResponse {
  return parseRiotPatchNotes(html, LOL_CONFIG)
}

export function parseTftPatchNotes(html: string): PatchNotesResponse {
  return parseRiotPatchNotes(html, TFT_CONFIG)
}

export function createPatchNotesClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  return createRiotPatchNotesClient(LOL_CONFIG, fetcher, now)
}

export function createTftPatchNotesClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  return createRiotPatchNotesClient(TFT_CONFIG, fetcher, now)
}

function createRiotPatchNotesClient(
  config: typeof LOL_CONFIG,
  fetcher: typeof fetch,
  now: () => number,
) {
  let cached: { value: PatchNotesResponse; expiresAt: number } | null = null
  let pending: Promise<PatchNotesResponse> | null = null

  async function getPatchNotes(): Promise<PatchNotesResponse> {
    if (cached && cached.expiresAt > now()) return cached.value
    if (pending) return pending
    pending = (async () => {
      try {
        const response = await fetcher(config.source, { signal: AbortSignal.timeout(5000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const value = parseRiotPatchNotes(await response.text(), config)
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
export const tftPatchNotes = createTftPatchNotesClient()
