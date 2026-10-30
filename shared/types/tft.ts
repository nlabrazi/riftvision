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
