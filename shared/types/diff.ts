import type { TeamType } from './riot'

export type DiffEventType =
  | 'ITEM_PURCHASE'
  | 'CHAMPION_KILL'
  | 'CHAMPION_DEATH'
  | 'CHAMPION_RESPAWN'
  | 'TURRET_DESTROYED'
  | 'INHIB_DESTROYED'
  | 'DRAGON_KILL'
  | 'BARON_KILL'
  | 'HERALD_KILL'
  | 'HORDE_KILL'
  | 'FIRST_BLOOD'
  | 'ACE'
  | 'MULTIKILL'
  | 'KILL_STREAK'
  | 'DOMINATING'
  | 'GAME_END'
  | 'EXECUTE'

export type SoundEffectKey =
  | 'firstblood'
  | 'doublekill'
  | 'triplekill'
  | 'multikill'
  | 'megakill'
  | 'ultrakill'
  | 'monsterkill'
  | 'ludicrouskill'
  | 'killingspree'
  | 'unstoppable'
  | 'godlike'
  | 'headshot'
  | 'blue_team_dominating'
  | 'red_team_dominating'
  | 'blue_team_is_the_winner'
  | 'red_team_is_the_winner'
  | 'humiliating_defeat'

export interface DiffItemPurchase {
  summonerName: string
  championName: string
  team: TeamType
  item: {
    itemID: number
    displayName: string
    price: number
    iconUrl: string
  }
}

export interface DiffChampionKill {
  killerName: string
  killerChampion: string
  killerTeam: TeamType
  victimName: string
  victimChampion: string
  victimTeam: TeamType
  assisters: Array<{
    summonerName: string
    championName: string
  }>
}

export interface DiffStructureEvent {
  turretId: string
  lane: 'TOP' | 'MID' | 'BOT' | 'UNKNOWN'
  tier?: number
  destroyedTeam: TeamType
  killerName?: string
  killerChampion?: string
}

export interface DiffMonsterKill {
  monsterType: 'Dragon' | 'Baron' | 'Herald' | 'Horde'
  dragonType?: string
  killerName: string
  killerChampion?: string
  team: TeamType
}

export interface TeamEconomySummary {
  totalItemGold: number
  killCount: number
  deathCount: number
  turretCount: number
  dragonCount: number
  baronCount: number
}

export interface GameDiffEvent {
  id: string
  type: DiffEventType
  gameTime: number
  formattedTime: string
  title: string
  description: string
  team?: TeamType
  metadata?: unknown
}

export interface GameDiffResult {
  newEvents: GameDiffEvent[]
  blueEconomy: TeamEconomySummary
  redEconomy: TeamEconomySummary
  goldDifference: number // Positive means blue lead, negative means red lead
}
