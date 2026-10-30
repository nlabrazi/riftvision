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
