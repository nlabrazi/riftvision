import type { PatchNotesResponse } from '#shared/types/patchNotes'
import type { ValorantAgentsResponse } from '#shared/types/valorant'
import { valorantPatchNotes } from '../../patchNotes'
import { valorantAgents } from '../../valorantAgents'
import { computeCanonicalHash } from '../hasher'
import type { SourceAdapter, SourceInspection } from '../types'

export interface ValorantSourceDependencies {
  getAgents?: () => Promise<ValorantAgentsResponse>
  getPatchNotes?: () => Promise<PatchNotesResponse>
}

export function createValorantSourceAdapter(
  dependencies: ValorantSourceDependencies = {},
): SourceAdapter {
  const getAgents = dependencies.getAgents ?? (() => valorantAgents.getAgents())
  const getPatchNotes = dependencies.getPatchNotes ?? (() => valorantPatchNotes.getPatchNotes())

  return {
    id: 'valorant',
    name: 'Valorant',
    game: 'valorant',
    syncMode: 'automatic',
    async inspect(): Promise<SourceInspection> {
      const [agentsResp, notes] = await Promise.all([getAgents(), getPatchNotes()])
      const latestArticle = notes.articles[0]

      const agentSignatures = agentsResp.data.map((a) => `${a.id}:${a.name}`).sort()

      const fingerprint = computeCanonicalHash({
        agentSignatures,
        latestPatch: latestArticle
          ? {
              title: latestArticle.title,
              url: latestArticle.url,
              publishedAt: latestArticle.publishedAt,
            }
          : null,
      })

      return {
        id: 'valorant',
        name: 'Valorant',
        game: 'valorant',
        syncMode: 'automatic',
        version: latestArticle?.title,
        fingerprint,
        metadata: {
          agentsCount: agentsResp.data.length,
          latestPatchTitle: latestArticle?.title ?? null,
          latestPatchUrl: latestArticle?.url ?? null,
          publishedAt: latestArticle?.publishedAt ?? null,
        },
      }
    },
  }
}
