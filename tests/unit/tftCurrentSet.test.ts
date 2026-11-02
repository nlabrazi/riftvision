import { describe, expect, it, vi } from 'vitest'
import { createTftCurrentSetClient } from '../../server/utils/tftCurrentSet'
import { DataDragonUnavailableError } from '../../server/utils/dataDragon'
import type { PatchNotesResponse } from '#shared/types/patchNotes'

const now = Date.parse('2026-11-01T12:00:00Z')
const note = (title: string, publishedAt: string) => ({
  title,
  publishedAt,
  url: 'https://teamfighttactics.leagueoflegends.com/fr-fr/news/game-updates/patch/',
  description: null,
  imageUrl: null,
})
const membership = { units: ['DA_Ahri'], traits: ['DA_Solar18'], items: ['TFT_Item_BFSword'] }
function dependencies(articles: PatchNotesResponse['articles']) {
  return {
    getVersion: vi.fn(async () => '16.21.1'),
    getPatchNotes: vi.fn(async () => ({
      sourceUrl: 'https://teamfighttactics.leagueoflegends.com/fr-fr/news/tags/patch-notes/',
      articles,
    })),
    getSet: vi.fn(async (_number: number, _version: string) => membership),
  }
}

describe('set TFT actuel', () => {
  it('recoupe les notes officielles avec les données du set et partage le cache', async () => {
    const deps = dependencies([
      note('Notes de patch 18.5 de TFT', '2026-10-20T18:00:00Z'),
      note('Notes de patch 18.4 de TFT', '2026-10-06T18:00:00Z'),
    ])
    const client = createTftCurrentSetClient(deps, () => now)
    const [one, two] = await Promise.all([client.getCurrentSet(), client.getCurrentSet()])
    expect(one).toEqual({ number: 18, patch: '18.5', dataDragonVersion: '16.21.1', ...membership })
    expect(two).toEqual(one)
    expect(deps.getSet).toHaveBeenCalledOnce()
    expect(deps.getSet).toHaveBeenCalledWith(18, '16.21.1')
  })

  it('ne présente pas une annonce récente de nouveau set comme déjà active', async () => {
    const deps = dependencies([
      note('Notes de patch 19.1 de TFT', '2026-11-01T10:00:00Z'),
      note('Notes de patch 18.6 de TFT', '2026-10-20T18:00:00Z'),
    ])
    const client = createTftCurrentSetClient(deps, () => now)
    await expect(client.getCurrentSet()).rejects.toBeInstanceOf(DataDragonUnavailableError)
    expect(deps.getSet).not.toHaveBeenCalled()
  })

  it('ne devine pas le set si le titre ou les données ne sont pas disponibles', async () => {
    const unknown = dependencies([note('Mise à jour spéciale', '2026-10-20T18:00:00Z')])
    await expect(
      createTftCurrentSetClient(unknown, () => now).getCurrentSet(),
    ).rejects.toBeInstanceOf(DataDragonUnavailableError)
    const missing = dependencies([note('Notes de patch 18.5 de TFT', '2026-10-20T18:00:00Z')])
    missing.getSet = vi.fn(async () => null) as typeof missing.getSet
    await expect(
      createTftCurrentSetClient(missing, () => now).getCurrentSet(),
    ).rejects.toBeInstanceOf(DataDragonUnavailableError)
  })
})
