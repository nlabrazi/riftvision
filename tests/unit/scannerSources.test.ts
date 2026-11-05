import { describe, expect, it } from 'vitest'
import { createDefaultSourceAdapters } from '../../server/utils/scanner/sources'
import { createHotsSourceAdapter } from '../../server/utils/scanner/sources/hots'
import { createLolSourceAdapter } from '../../server/utils/scanner/sources/lol'
import { createTftSourceAdapter } from '../../server/utils/scanner/sources/tft'
import { createValorantSourceAdapter } from '../../server/utils/scanner/sources/valorant'
import { createWowSourceAdapter } from '../../server/utils/scanner/sources/wow'

describe('Scanner Sources', () => {
  it('instantiates all 5 default source adapters', () => {
    const adapters = createDefaultSourceAdapters()
    expect(adapters).toHaveLength(5)
    expect(adapters.map((a) => a.id)).toEqual(['lol', 'tft', 'valorant', 'wow', 'hots'])
  })

  describe('LoL source adapter', () => {
    it('inspects version and latest patch note correctly', async () => {
      const adapter = createLolSourceAdapter({
        getVersion: async () => '14.22.1',
        getPatchNotes: async () => ({
          sourceUrl: 'https://leagueoflegends.com',
          articles: [
            {
              title: 'Notes de patch 14.22',
              url: 'https://leagueoflegends.com/patch-14-22',
              publishedAt: '2026-11-01T12:00:00Z',
              description: 'Patch 14.22',
              imageUrl: null,
            },
          ],
        }),
      })

      const inspection = await adapter.inspect()
      expect(inspection.id).toBe('lol')
      expect(inspection.game).toBe('lol')
      expect(inspection.syncMode).toBe('automatic')
      expect(inspection.version).toBe('14.22.1')
      expect(inspection.fingerprint).toHaveLength(16)
      expect(inspection.metadata?.latestPatchTitle).toBe('Notes de patch 14.22')
    })

    it('propagates error when dependency fails', async () => {
      const adapter = createLolSourceAdapter({
        getVersion: async () => {
          throw new Error('DataDragon unreachable')
        },
      })

      await expect(adapter.inspect()).rejects.toThrow('DataDragon unreachable')
    })
  })

  describe('TFT source adapter', () => {
    it('inspects TFT patch notes and version', async () => {
      const adapter = createTftSourceAdapter({
        getVersion: async () => '14.22.1',
        getPatchNotes: async () => ({
          sourceUrl: 'https://teamfighttactics.leagueoflegends.com',
          articles: [
            {
              title: 'Notes de patch 14.22 de TFT',
              url: 'https://teamfighttactics.leagueoflegends.com/patch-14-22',
              publishedAt: '2026-11-01T12:00:00Z',
              description: 'TFT 14.22',
              imageUrl: null,
            },
          ],
        }),
      })

      const inspection = await adapter.inspect()
      expect(inspection.id).toBe('tft')
      expect(inspection.game).toBe('tft')
      expect(inspection.syncMode).toBe('automatic')
      expect(inspection.version).toBe('14.22.1')
      expect(inspection.fingerprint).toHaveLength(16)
      expect(inspection.metadata?.latestPatchTitle).toBe('Notes de patch 14.22 de TFT')
    })
  })

  describe('Valorant source adapter', () => {
    it('inspects agents count and latest patch note', async () => {
      const adapter = createValorantSourceAdapter({
        getAgents: async () => ({
          locale: 'fr-FR',
          data: [
            {
              id: 'jett-uuid',
              name: 'Jett',
              description: 'Agile',
              role: 'Duelist',
              icon: null,
              portrait: null,
              abilities: [],
            },
            {
              id: 'sova-uuid',
              name: 'Sova',
              description: 'Recon',
              role: 'Initiator',
              icon: null,
              portrait: null,
              abilities: [],
            },
          ],
        }),
        getPatchNotes: async () => ({
          sourceUrl: 'https://playvalorant.com',
          articles: [
            {
              title: 'Notes de patch 9.09',
              url: 'https://playvalorant.com/patch-9-09',
              publishedAt: '2026-11-01T14:00:00Z',
              description: 'Patch Valorant',
              imageUrl: null,
            },
          ],
        }),
      })

      const inspection = await adapter.inspect()
      expect(inspection.id).toBe('valorant')
      expect(inspection.game).toBe('valorant')
      expect(inspection.syncMode).toBe('automatic')
      expect(inspection.fingerprint).toHaveLength(16)
      expect(inspection.metadata?.agentsCount).toBe(2)
      expect(inspection.metadata?.latestPatchTitle).toBe('Notes de patch 9.09')
    })
  })

  describe('WoW source adapter', () => {
    it('inspects patch notes correctly', async () => {
      const adapter = createWowSourceAdapter({
        getPatchNotes: async () => ({
          sourceUrl: 'https://worldofwarcraft.blizzard.com',
          articles: [
            {
              title: 'Mise à jour 11.0.5 — Notes de version',
              url: 'https://worldofwarcraft.blizzard.com/patch-11-0-5',
              publishedAt: '2026-10-23T10:00:00Z',
              description: 'WoW Patch',
              imageUrl: null,
            },
          ],
        }),
      })

      const inspection = await adapter.inspect()
      expect(inspection.id).toBe('wow')
      expect(inspection.game).toBe('wow')
      expect(inspection.syncMode).toBe('automatic')
      expect(inspection.version).toBe('Mise à jour 11.0.5 — Notes de version')
      expect(inspection.fingerprint).toHaveLength(16)
      expect(inspection.metadata?.latestPatchTitle).toBe('Mise à jour 11.0.5 — Notes de version')
    })
  })

  describe('HotS source adapter', () => {
    it('flags syncMode as manual_action_required and combines local and remote data', async () => {
      const adapter = createHotsSourceAdapter({
        getPatchNotes: async () => ({
          sourceUrl: 'https://news.blizzard.com',
          articles: [
            {
              title: 'Notes de mise à jour de Heroes of the Storm - 2.57.1',
              url: 'https://news.blizzard.com/fr-fr/hots-2-57-1',
              updatedAt: '2026-11-01T15:00:00Z',
              description: 'HotS Notes',
              imageUrl: null,
            },
          ],
          truncated: false,
        }),
        getLocalHeroes: () => ({
          version: '2.57.0.98348',
          locale: 'fr_FR',
          data: [
            {
              id: 'Abathur',
              name: 'Abathur',
              title: 'Maître des évolutions',
              description: 'Héros unique',
              lore: 'Lore',
              role: 'Soutien',
              universe: 'Starcraft',
              portrait: null,
              art: null,
            },
          ],
        }),
      })

      const inspection = await adapter.inspect()
      expect(inspection.id).toBe('hots')
      expect(inspection.game).toBe('hots')
      expect(inspection.syncMode).toBe('manual_action_required')
      expect(inspection.version).toBe('2.57.0.98348')
      expect(inspection.fingerprint).toHaveLength(16)
      expect(inspection.metadata?.localVersion).toBe('2.57.0.98348')
      expect(inspection.metadata?.heroesCount).toBe(1)
      expect(inspection.metadata?.latestPatchTitle).toBe(
        'Notes de mise à jour de Heroes of the Storm - 2.57.1',
      )
    })
  })
})
