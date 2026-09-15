import type { PlayerPosition, TeamType } from '../types/riot'

export interface MapPoint {
  x: number // percentage 0-100 from left
  y: number // percentage 0-100 from top
}

export interface TurretCoordinate {
  id: string
  lane: 'TOP' | 'MID' | 'BOT'
  team: TeamType
  tier: number // 1: Outer, 2: Inner, 3: Inhibitor
  x: number
  y: number
}

/**
 * Standard lane deployment coordinates on Summoner's Rift 2D map (0-100%).
 * Origin (0,0) is top-left.
 * Blue base (Order) is bottom-left (~10%, 90%).
 * Red base (Chaos) is top-right (~90%, 10%).
 */
export const ROLE_COORDINATES: Record<TeamType, Record<PlayerPosition, MapPoint>> = {
  ORDER: {
    TOP: { x: 18, y: 26 },
    JUNGLE: { x: 34, y: 62 },
    MIDDLE: { x: 42, y: 58 },
    BOTTOM: { x: 72, y: 82 },
    UTILITY: { x: 78, y: 86 },
    UNKNOWN: { x: 25, y: 75 },
    '': { x: 25, y: 75 },
  },
  CHAOS: {
    TOP: { x: 28, y: 18 },
    JUNGLE: { x: 66, y: 38 },
    MIDDLE: { x: 58, y: 42 },
    BOTTOM: { x: 82, y: 72 },
    UTILITY: { x: 86, y: 78 },
    UNKNOWN: { x: 75, y: 25 },
    '': { x: 75, y: 25 },
  },
}

/**
 * Key neutral objective pit locations on Summoner's Rift.
 */
export const OBJECTIVE_COORDINATES = {
  BARON_PIT: { x: 32, y: 32 },
  DRAGON_PIT: { x: 68, y: 68 },
  BLUE_NEXUS: { x: 12, y: 88 },
  RED_NEXUS: { x: 88, y: 12 },
}

/**
 * Standard outer and inner turret landmarks.
 */
export const TURRET_LANDMARKS: TurretCoordinate[] = [
  // Blue Turrets (ORDER)
  { id: 'Turret_T1_L_03_A', lane: 'TOP', team: 'ORDER', tier: 1, x: 16, y: 44 },
  { id: 'Turret_T1_L_02_A', lane: 'TOP', team: 'ORDER', tier: 2, x: 16, y: 60 },
  { id: 'Turret_T1_C_05_A', lane: 'MID', team: 'ORDER', tier: 1, x: 38, y: 62 },
  { id: 'Turret_T1_C_04_A', lane: 'MID', team: 'ORDER', tier: 2, x: 28, y: 72 },
  { id: 'Turret_T1_R_03_A', lane: 'BOT', team: 'ORDER', tier: 1, x: 58, y: 84 },
  { id: 'Turret_T1_R_02_A', lane: 'BOT', team: 'ORDER', tier: 2, x: 42, y: 84 },

  // Red Turrets (CHAOS)
  { id: 'Turret_T2_L_03_A', lane: 'TOP', team: 'CHAOS', tier: 1, x: 42, y: 16 },
  { id: 'Turret_T2_L_02_A', lane: 'TOP', team: 'CHAOS', tier: 2, x: 58, y: 16 },
  { id: 'Turret_T2_C_05_A', lane: 'MID', team: 'CHAOS', tier: 1, x: 62, y: 38 },
  { id: 'Turret_T2_C_04_A', lane: 'MID', team: 'CHAOS', tier: 2, x: 72, y: 28 },
  { id: 'Turret_T2_R_03_A', lane: 'BOT', team: 'CHAOS', tier: 1, x: 84, y: 56 },
  { id: 'Turret_T2_R_02_A', lane: 'BOT', team: 'CHAOS', tier: 2, x: 84, y: 42 },
]

/**
 * Returns the estimated 2D coordinates for a player based on team and role.
 */
export function getChampionMapPosition(
  team: TeamType,
  position: PlayerPosition = 'UNKNOWN',
): MapPoint {
  const teamPositions = ROLE_COORDINATES[team] || ROLE_COORDINATES.ORDER
  return teamPositions[position] || teamPositions.UNKNOWN
}

/**
 * Determines which turrets are destroyed based on the Riot events list.
 */
export function getDestroyedTurretIds(
  events: Array<{ EventName: string; TurretKilled?: string }>,
): Set<string> {
  const destroyed = new Set<string>()
  for (const e of events) {
    if (e.EventName === 'TurretKilled' && e.TurretKilled) {
      destroyed.add(e.TurretKilled)
    }
  }
  return destroyed
}
