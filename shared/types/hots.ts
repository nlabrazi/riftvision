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

export interface HotsMapObjective {
  title: string
  description: string
  icons: string[]
}

export interface HotsMapSummary {
  id: string
  name: string
  art: string | null
  preview: string | null
}

export interface HotsMap extends HotsMapSummary {
  objectives: HotsMapObjective[]
}

export interface HotsMapsResponse {
  version: string
  locale: 'fr_FR'
  data: HotsMapSummary[]
}

export interface HotsMapResponse {
  version: string
  locale: 'fr_FR'
  data: HotsMap
}

export interface HotsPatchNote {
  title: string
  updatedAt: string
  url: string
  description: string | null
  imageUrl: string | null
}

export interface HotsPatchNotesResponse {
  sourceUrl: string
  articles: HotsPatchNote[]
  truncated: boolean
}
