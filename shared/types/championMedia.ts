export type ChampionAbilitySlot = 'P' | 'Q' | 'W' | 'E' | 'R'

export interface ChampionAbilityMedia {
  videoMp4: string
  videoWebm: string
  poster: string | null
}

export interface ChampionAbilityMediaResponse {
  abilities: Partial<Record<ChampionAbilitySlot, ChampionAbilityMedia>>
}

export interface ChampionAbility {
  slot: ChampionAbilitySlot
  key: string
  name: string
  description: string
  filename: string
  group: 'passive' | 'spell'
}
