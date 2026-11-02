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

export interface WowSpecializationDetails {
  id: number
  name: string
  class: { id: number; name: string }
  role: string | null
  powerType: string | null
  primaryStat: string | null
  descriptionMale: string | null
  descriptionFemale: string | null
  icon: string | null
}

export interface WowSpecializationResponse {
  locale: 'fr_FR'
  edition: 'retail'
  data: WowSpecializationDetails
}

export interface WowTalentRank {
  rank: number
  description: string | null
  defaultPoints: number
}

export interface WowTalentOption {
  id: number
  name: string
  spellId: number | null
  ranks: WowTalentRank[]
}

export interface WowTalentNode {
  id: number
  row: number
  column: number
  options: WowTalentOption[]
}

export interface WowTalentGroup {
  id: string
  name: string
  nodes: WowTalentNode[]
}

export interface WowTalentsResponse {
  locale: 'fr_FR'
  edition: 'retail'
  data: { groups: WowTalentGroup[] } | null
}

export interface WowSpecializationSummary extends WowSpecialization {
  class: { id: number; name: string }
  icon: string | null
}

export interface WowSpecializationsResponse {
  locale: 'fr_FR'
  edition: 'retail'
  data: WowSpecializationSummary[]
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
