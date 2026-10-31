import type { HotsHero, HotsHeroResponse, HotsHeroesResponse } from '#shared/types/hots'
import first from '../data/hots-heroes-a.json'
import second from '../data/hots-heroes-b.json'

const heroes = [...first.data, ...second.data] as HotsHero[]
const version = first.version

export function getHotsHeroes(): HotsHeroesResponse {
  return {
    version,
    locale: 'fr_FR',
    data: heroes.map(({ abilities: _abilities, talents: _talents, ...hero }) => hero),
  }
}

export function getHotsHero(id: string): HotsHeroResponse | null {
  const hero = heroes.find((entry) => entry.id === id)
  return hero ? { version, locale: 'fr_FR', data: hero } : null
}
