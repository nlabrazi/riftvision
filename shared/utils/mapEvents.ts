import type { GameDiffEvent } from '../types/diff'
import type { RiotPlayer } from '../types/riot'
import {
  getChampionMapPosition,
  type MapPoint,
  OBJECTIVE_COORDINATES,
  TURRET_LANDMARKS,
} from './mapCoordinates'

export interface MapEventLocation extends MapPoint {
  kind: 'objective' | 'turret' | 'role'
  label: string
  indicative: boolean
}

/** Riot and the demo use different names for the same structure IDs. */
export function normalizeMapTurretId(id: string): string {
  return id.replace('_TOrder_', '_T1_').replace('_TChaos_', '_T2_')
}

export function isRecentMapEvent(event: GameDiffEvent, gameTime: number, maxAge = 8): boolean {
  const age = gameTime - event.gameTime
  return Number.isFinite(age) && age >= 0 && age <= maxAge
}

/** Only objective landmarks are locations. Player tokens are role references. */
export function getMapEventLocation(
  event: GameDiffEvent,
  players: RiotPlayer[] = [],
): MapEventLocation | null {
  if (event.type === 'DRAGON_KILL') {
    return {
      ...OBJECTIVE_COORDINATES.DRAGON_PIT,
      kind: 'objective',
      label: 'Fosse du dragon',
      indicative: false,
    }
  }

  if (['BARON_KILL', 'HERALD_KILL', 'HORDE_KILL'].includes(event.type)) {
    return {
      ...OBJECTIVE_COORDINATES.BARON_PIT,
      kind: 'objective',
      label: 'Fosse du Baron / Héraut',
      indicative: false,
    }
  }

  const metadata =
    event.metadata && typeof event.metadata === 'object'
      ? (event.metadata as Record<string, unknown>)
      : {}

  if (event.type === 'TURRET_DESTROYED') {
    if (typeof metadata.turretId !== 'string') return null
    const id = normalizeMapTurretId(metadata.turretId)
    const turret = TURRET_LANDMARKS.find((entry) => entry.id === id)
    if (!turret) return null
    return {
      x: turret.x,
      y: turret.y,
      kind: 'turret',
      label: `Tour ${turret.lane} · ${turret.team === 'ORDER' ? 'bleue' : 'rouge'}`,
      indicative: false,
    }
  }

  const isKill = event.type === 'CHAMPION_KILL' || event.type === 'FIRST_BLOOD'
  if (!isKill && event.type !== 'CHAMPION_DEATH' && event.type !== 'CHAMPION_RESPAWN') return null

  const summonerName = isKill ? metadata.victimName : metadata.summonerName
  const championName = isKill ? metadata.victimChampion : metadata.championName
  const team = isKill ? metadata.victimTeam : event.team
  let matchingPlayers = players.filter(
    (player) => typeof summonerName === 'string' && player.summonerName === summonerName,
  )
  if (!matchingPlayers.length) {
    matchingPlayers = players.filter(
      (player) =>
        typeof championName === 'string' &&
        player.championName === championName &&
        (!team || player.team === team),
    )
  }
  // Ambiguous champions or missing roles do not provide a useful map reference.
  if (matchingPlayers.length !== 1) return null
  const player = matchingPlayers[0]
  if (
    !player?.position ||
    player.position === 'UNKNOWN' ||
    !['ORDER', 'CHAOS'].includes(player.team)
  )
    return null

  return {
    ...getChampionMapPosition(player.team, player.position),
    kind: 'role',
    label: `Repère de ${player.championName} · position indicative`,
    indicative: true,
  }
}
