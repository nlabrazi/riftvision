export interface TftChampion {
  id: string
  name: string
  tier: number
  cost: number
  icon: string
  setNumber: number | null
}

export interface TftChampionsResponse {
  version: string
  locale: 'fr_FR'
  data: TftChampion[]
}

export interface TftAbility {
  name: string
  description: string
  icon: string | null
}

export interface TftAbilityResponse {
  ability: TftAbility | null
  sourceVersion: string
}

export interface TftTrait {
  id: string
  name: string
  icon: string
}

export interface TftTraitsResponse {
  version: string
  locale: 'fr_FR'
  data: TftTrait[]
}

export interface TftItem {
  id: string
  name: string
  icon: string
}

export interface TftItemsResponse {
  version: string
  locale: 'fr_FR'
  data: TftItem[]
}
