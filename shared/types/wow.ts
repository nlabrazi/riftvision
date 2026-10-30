export interface WowClassSummary {
  id: number
  name: string
  icon: string | null
}

export interface WowSpecialization {
  id: number
  name: string
}

export interface WowClassDetails extends WowClassSummary {
  powerType: string | null
  specializations: WowSpecialization[]
}

export interface WowClassesResponse {
  locale: 'fr_FR'
  edition: 'retail'
  data: WowClassSummary[]
}

export interface WowClassResponse {
  locale: 'fr_FR'
  edition: 'retail'
  data: WowClassDetails
}

export interface WowRace {
  id: number
  name: string
  faction: { type: string; name: string } | null
  allied: boolean | null
  classes: { id: number; name: string }[]
}

export interface WowRacesResponse {
  locale: 'fr_FR'
  edition: 'retail'
  data: WowRace[]
}
