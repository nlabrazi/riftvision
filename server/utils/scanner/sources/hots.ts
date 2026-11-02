import type { HotsHeroesResponse, HotsPatchNotesResponse } from '#shared/types/hots'
import { getHotsHeroes } from '../../hotsHeroes'
import { hotsPatchNotes } from '../../hotsPatchNotes'
import { computeCanonicalHash } from '../hasher'
import type { SourceAdapter, SourceInspection } from '../types'

export interface HotsSourceDependencies {
  getPatchNotes?: () => Promise<HotsPatchNotesResponse>
  getLocalHeroes?: () => HotsHeroesResponse
}

export function createHotsSourceAdapter(dependencies: HotsSourceDependencies = {}): SourceAdapter {
  const getPatchNotes = dependencies.getPatchNotes ?? (() => hotsPatchNotes.getPatchNotes())
  const getLocalHeroes = dependencies.getLocalHeroes ?? (() => getHotsHeroes())

  return {
    id: 'hots',
    name: 'Heroes of the Storm',
    game: 'hots',
    syncMode: 'manual_action_required',
    async inspect(): Promise<SourceInspection> {
      const [notes, localCatalog] = await Promise.all([
        getPatchNotes(),
        Promise.resolve(getLocalHeroes()),
      ])
      const latestArticle = notes.articles[0]

      const fingerprint = computeCanonicalHash({
        localVersion: localCatalog.version,
        latestPatch: latestArticle
          ? {
              title: latestArticle.title,
              url: latestArticle.url,
              updatedAt: latestArticle.updatedAt,
            }
          : null,
      })

      return {
        id: 'hots',
        name: 'Heroes of the Storm',
        game: 'hots',
        syncMode: 'manual_action_required',
        version: localCatalog.version,
        fingerprint,
        metadata: {
          localVersion: localCatalog.version,
          heroesCount: localCatalog.data.length,
          latestPatchTitle: latestArticle?.title ?? null,
          latestPatchUrl: latestArticle?.url ?? null,
          updatedAt: latestArticle?.updatedAt ?? null,
        },
      }
    },
  }
}
