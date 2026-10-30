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
