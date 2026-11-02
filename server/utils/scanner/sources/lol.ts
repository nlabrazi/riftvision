import type { PatchNotesResponse } from '#shared/types/patchNotes'
import { dataDragon } from '../../dataDragon'
import { patchNotes } from '../../patchNotes'
import { computeCanonicalHash } from '../hasher'
import type { SourceAdapter, SourceInspection } from '../types'

export interface LolSourceDependencies {
  getVersion?: () => Promise<string>
  getPatchNotes?: () => Promise<PatchNotesResponse>
}

export function createLolSourceAdapter(dependencies: LolSourceDependencies = {}): SourceAdapter {
  const getVersion = dependencies.getVersion ?? (() => dataDragon.getVersion())
  const getPatchNotes = dependencies.getPatchNotes ?? (() => patchNotes.getPatchNotes())

  return {
    id: 'lol',
    name: 'League of Legends',
    game: 'lol',
    syncMode: 'automatic',
    async inspect(): Promise<SourceInspection> {
      const [version, notes] = await Promise.all([getVersion(), getPatchNotes()])
      const latestArticle = notes.articles[0]

      const fingerprint = computeCanonicalHash({
        version,
        latestPatch: latestArticle
          ? {
              title: latestArticle.title,
              url: latestArticle.url,
              publishedAt: latestArticle.publishedAt,
            }
          : null,
      })

      return {
        id: 'lol',
        name: 'League of Legends',
        game: 'lol',
        syncMode: 'automatic',
        version,
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
