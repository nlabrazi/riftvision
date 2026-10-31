export interface HotsHeroSummary {
  id: string
  name: string
  title: string
  description: string
  lore: string
  role: string
  universe: string
  portrait: string | null
  art: string | null
}

export interface HotsAbility {
  id: string
  name: string
  description: string
  icon: string | null
  slot: string
  group: string
}

export interface HotsTalent {
  id: string
  name: string
  description: string
  icon: string | null
  slot: string
  level: number
}

export interface HotsHero extends HotsHeroSummary {
  abilities: HotsAbility[]
  talents: HotsTalent[]
}

export interface HotsHeroesResponse {
  version: string
  locale: 'fr_FR'
  data: HotsHeroSummary[]
}

export interface HotsHeroResponse {
  version: string
  locale: 'fr_FR'
  data: HotsHero
}
