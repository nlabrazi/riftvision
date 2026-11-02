import type { TftCurrentSetResponse } from '#shared/types/tft'
import { dataDragon, DataDragonUnavailableError } from './dataDragon'
import { tftAbilities } from './tftAbilities'
import { tftPatchNotes } from './patchNotes'

const TTL = 60 * 60 * 1000
const TRANSITION_DELAY = 24 * 60 * 60 * 1000

export function createTftCurrentSetClient(
  dependencies: {
    getVersion: typeof dataDragon.getVersion
    getPatchNotes: typeof tftPatchNotes.getPatchNotes
    getSet: typeof tftAbilities.getSet
  } = {
    getVersion: dataDragon.getVersion,
    getPatchNotes: tftPatchNotes.getPatchNotes,
    getSet: tftAbilities.getSet,
  },
  now: () => number = Date.now,
) {
  let cache: { key: string; value: TftCurrentSetResponse; expiresAt: number } | null = null
  const pending = new Map<string, Promise<TftCurrentSetResponse>>()

  function patchNumber(title: string): { number: number; patch: string } | null {
    const match =
      /^Notes de patch\s+(\d{1,3})\.(\d{1,2}[a-z]?)\s+de\s+(?:TFT|Teamfight Tactics)\s*$/i.exec(
        title.trim(),
      )
    if (!match) return null
    const number = Number(match[1])
    return number > 0 ? { number, patch: `${number}.${match[2]}` } : null
  }

  async function getCurrentSet(): Promise<TftCurrentSetResponse> {
    const [version, notes] = await Promise.all([
      dependencies.getVersion(),
      dependencies.getPatchNotes(),
    ])
    const articles = notes.articles.filter((article) => Date.parse(article.publishedAt) <= now())
    const latest = articles[0]
    const patch = latest && patchNumber(latest.title)
    if (!patch) throw new DataDragonUnavailableError('Set TFT actuel non identifié.')
    const previous = articles[1] && patchNumber(articles[1].title)
    if (
      (!previous || previous.number !== patch.number) &&
      now() - Date.parse(latest.publishedAt) < TRANSITION_DELAY
    )
      throw new DataDragonUnavailableError('Changement de set TFT en cours.')
    const key = `${version}:${patch.patch}`
    if (cache?.key === key && cache.expiresAt > now()) return cache.value
    const inFlight = pending.get(key)
    if (inFlight) return inFlight
    const task = (async () => {
      const set = await dependencies.getSet(patch.number, version)
      if (!set) throw new DataDragonUnavailableError('Données du set TFT actuel indisponibles.')
      const value = { number: patch.number, patch: patch.patch, dataDragonVersion: version, ...set }
      cache = { key, value, expiresAt: now() + TTL }
      return value
    })()
    pending.set(key, task)
    try {
      return await task
    } finally {
      pending.delete(key)
    }
  }
  return { getCurrentSet }
}

export const tftCurrentSet = createTftCurrentSetClient()
