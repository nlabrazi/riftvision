import { describe, expect, it } from 'vitest'
import { getHotsMap, getHotsMaps } from '../../server/utils/hotsMaps'
import { hotsImage } from '../../app/utils/hotsImages'

describe('champs de bataille Heroes of the Storm', () => {
  it('expose des cartes identifiables et une liste légère pour la recherche', () => {
    const catalog = getHotsMaps()
    expect(catalog.locale).toBe('fr_FR')
    expect(catalog.version).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
    expect(catalog.data.length).toBeGreaterThan(20)
    expect(new Set(catalog.data.map((map) => map.id)).size).toBe(catalog.data.length)
    expect(catalog.data.find((map) => map.id === 'alterac_pass')).toMatchObject({
      name: 'La passe d’Alterac',
      preview: 'replayspreviewimage_alteracpass.png',
    })
    expect(catalog.data[0]).not.toHaveProperty('objectives')
  })

  it('associe les objectifs et leurs visuels à la bonne carte', () => {
    const map = getHotsMap('alterac_pass')?.data
    expect(map?.objectives).toHaveLength(3)
    expect(map?.objectives[0]).toMatchObject({
      title: 'Camps d’emprisonnement',
      icons: [
        'ui_ingame_mapmechanic_loadscreen_wcav_icon1_horde.png',
        'ui_ingame_mapmechanic_loadscreen_wcav_icon1_alliance.png',
      ],
    })
    expect(map?.objectives[0]?.description).toContain('Capturez le camp')
    expect(getHotsMap('deadmans_stand')?.data.objectives).toEqual([])
    expect(getHotsMap('inconnu')).toBeNull()
    expect(hotsImage('mapobjectives', '../icon.png')).toBe('')
  })
})
