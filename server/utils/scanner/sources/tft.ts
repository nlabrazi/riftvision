import type { PatchNotesResponse } from '#shared/types/patchNotes'
import { dataDragon } from '../../dataDragon'
import { tftPatchNotes } from '../../patchNotes'
import { computeCanonicalHash } from '../hasher'
import type { SourceAdapter, SourceInspection } from '../types'

export interface TftSourceDependencies {
  getVersion?: () => Promise<string>
  getPatchNotes?: () => Promise<PatchNotesResponse>
}

export function createTftSourceAdapter(dependencies: TftSourceDependencies = {}): SourceAdapter {
  const getVersion = dependencies.getVersion ?? (() => dataDragon.getVersion())
  const getPatchNotes = dependencies.getPatchNotes ?? (() => tftPatchNotes.getPatchNotes())

  return {
    id: 'tft',
    name: 'Teamfight Tactics',
    game: 'tft',
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
        id: 'tft',
        name: 'Teamfight Tactics',
        game: 'tft',
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
