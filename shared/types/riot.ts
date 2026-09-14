export type TeamType = 'ORDER' | 'CHAOS' | 'NEUTRAL' | 'UNKNOWN'

export type PlayerPosition = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY' | 'UNKNOWN' | ''

export type EventName =
  | 'GameStart'
  | 'MinionsSpawning'
  | 'ChampionKill'
  | 'FirstBlood'
  | 'TurretKilled'
  | 'InhibKilled'
  | 'DragonKill'
  | 'BaronKill'
  | 'HeraldKill'
  | 'HordeKill'
  | 'Multikill'
  | 'Ace'

export interface RiotItem {
  canUse: boolean
  consumable: boolean
  count: number
  displayName: string
  itemID: number
  price: number
  rawDescription: string
  rawDisplayName: string
  slot: number
}

export interface RiotSummonerSpell {
  displayName: string
  rawDescription: string
  rawDisplayName: string
}

export interface RiotScores {
  assists: number
  creepScore: number
  deaths: number
  kills: number
  wardScore: number
}

export interface RiotRuneItem {
  displayName: string
  id: number
  rawDescription?: string
}

export interface RiotRunes {
  keystone: RiotRuneItem
  primaryRuneTree: RiotRuneItem
  secondaryRuneTree: RiotRuneItem
}

export interface RiotPlayer {
  championName: string
  isBot: boolean
  isDead: boolean
  items: RiotItem[]
  level: number
  position: PlayerPosition
  rawChampionName: string
  rawSkinName?: string
  respawnTimer: number
  runes: RiotRunes
  scores: RiotScores
  skinID: number
  skinName?: string
  summonerName: string
  rawSummonerName?: string
  summonerSpells: {
    summonerSpellOne: RiotSummonerSpell
    summonerSpellTwo: RiotSummonerSpell
  }
  team: TeamType
}

export interface RiotActivePlayer {
  championStats: Record<string, number>
  currentGold: number
  level: number
  summonerName: string
}

export interface RiotEvent {
  EventID: number
  EventName: EventName | string
  EventTime: number
  KillerName?: string
  VictimName?: string
  Assisters?: string[]
  TurretKilled?: string
  InhibKilled?: string
  DragonType?: string
  KillStreak?: number
  Acer?: string
  AcingTeam?: string
  [key: string]: unknown
}

export interface RiotGameStats {
  gameMode: string
  gameTime: number
  mapName: string
  mapNumber: number
  mapTerrain: string
}

export interface RiotAllGameData {
  activePlayer: RiotActivePlayer
  allPlayers: RiotPlayer[]
  events: {
    Events: RiotEvent[]
  }
  gameData: RiotGameStats
}

export type RiotConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'IN_GAME' | 'MOCK'

export interface RiotStatusResponse {
  status: RiotConnectionStatus
  latencyMs?: number
  isMock: boolean
  gameTime?: number
  gameMode?: string
  playerCount?: number
  error?: string
}
