import { describe, expect, it } from 'vitest'
import { getHotsHero, getHotsHeroes } from '../../server/utils/hotsHeroes'
import { hotsImage } from '../../app/utils/hotsImages'

describe('catalogue Heroes of the Storm', () => {
  it('expose un catalogue français versionné sans charger toutes les fiches dans la recherche', () => {
    const response = getHotsHeroes()
    expect(response.locale).toBe('fr_FR')
    expect(response.version).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
    expect(response.data.length).toBeGreaterThan(80)
    expect(new Set(response.data.map((hero) => hero.id)).size).toBe(response.data.length)
    expect(response.data.find((hero) => hero.id === 'Xalatath')).toMatchObject({
      name: 'Xal’atath',
    })
    expect(response.data[0]).not.toHaveProperty('talents')
    expect(response.data[0]).not.toHaveProperty('abilities')
  })

  it('fournit des compétences et talents localisés et gère les identifiants absents', () => {
    const hero = getHotsHero('Xalatath')?.data
    expect(hero?.role).toBe('Assassin à distance')
    expect(hero?.abilities.some((ability) => ability.name === 'Marque de l’ombre')).toBe(true)
    expect(
      hero?.talents.some((talent) => talent.level === 1 && talent.name === 'Adepte du Vide'),
    ).toBe(true)
    expect(hero?.abilities[0]?.description).not.toMatch(/<[^>]+>|~~/)
    expect(getHotsHero('inconnu')).toBeNull()
  })

  it('construit uniquement des URL d’images communautaires valides', () => {
    expect(hotsImage('heroportraits', 'portrait.png')).toBe(
      'https://raw.githubusercontent.com/HeroesToolChest/heroes-images/main/heroesimages/heroportraits/portrait.png',
    )
    expect(hotsImage('abilitytalents', '../../image.png')).toBe('')
    expect(hotsImage('heroportraits', null)).toBe('')
  })
})
