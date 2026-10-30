export interface ValorantAbility {
  slot: string
  name: string
  description: string
  icon: string | null
}

export interface ValorantAgent {
  id: string
  name: string
  description: string
  role: string | null
  icon: string
  portrait: string | null
  abilities: ValorantAbility[]
}

export interface ValorantAgentsResponse {
  locale: 'fr-FR'
  data: ValorantAgent[]
}

export interface ValorantDamageRange {
  start: number
  end: number
  head: number
  body: number
  leg: number
}

export interface ValorantWeapon {
  id: string
  name: string
  category: string
  icon: string
  cost: number | null
  magazine: number | null
  fireRate: number | null
  reloadSeconds: number | null
  pelletCount: number | null
  damageRanges: ValorantDamageRange[]
}

export interface ValorantWeaponsResponse {
  locale: 'fr-FR'
  data: ValorantWeapon[]
}
