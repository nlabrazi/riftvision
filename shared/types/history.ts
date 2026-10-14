import type { GameDiffEvent, TeamEconomySummary } from './diff'
import type { RiotAllGameData, TeamType } from './riot'

export interface SavedMatchPlayerSummary {
  summonerName: string
  championName: string
  team: TeamType
  kills: number
  deaths: number
  assists: number
  cs: number
  gold: number
  items: number[]
}

export interface SavedMatch {
  id: string
  timestamp: number
  dateFormatted: string
  durationSeconds: number
  formattedGameTime: string
  result: 'VICTORY' | 'DEFEAT'
  championName: string
  championIconUrl?: string
  summonerName: string
  team: TeamType
  kda: {
    kills: number
    deaths: number
    assists: number
    ratio: string
  }
  cs: number
  csPerMin: string
  gameMode?: string
  gameData: RiotAllGameData
  blueEconomy: TeamEconomySummary
  redEconomy: TeamEconomySummary
  goldDifference: number
  diffEvents?: GameDiffEvent[]
}
