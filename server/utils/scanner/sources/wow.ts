import type { PatchNotesResponse } from '#shared/types/patchNotes'
import { wowPatchNotes } from '../../wowPatchNotes'
import { computeCanonicalHash } from '../hasher'
import type { SourceAdapter, SourceInspection } from '../types'

export interface WowSourceDependencies {
  getPatchNotes?: () => Promise<PatchNotesResponse>
}

export function createWowSourceAdapter(dependencies: WowSourceDependencies = {}): SourceAdapter {
  const getPatchNotes = dependencies.getPatchNotes ?? (() => wowPatchNotes.getPatchNotes())

  return {
    id: 'wow',
    name: 'World of Warcraft',
    game: 'wow',
    syncMode: 'automatic',
    async inspect(): Promise<SourceInspection> {
      const notes = await getPatchNotes()
      const latestArticle = notes.articles[0]

      const fingerprint = computeCanonicalHash({
        latestPatch: latestArticle
          ? {
              title: latestArticle.title,
              url: latestArticle.url,
              publishedAt: latestArticle.publishedAt,
            }
          : null,
      })

      return {
        id: 'wow',
        name: 'World of Warcraft',
        game: 'wow',
        syncMode: 'automatic',
        version: latestArticle?.title,
        fingerprint,
        metadata: {
          latestPatchTitle: latestArticle?.title ?? null,
          latestPatchUrl: latestArticle?.url ?? null,
          publishedAt: latestArticle?.publishedAt ?? null,
        },
      }
    },
  }
}
