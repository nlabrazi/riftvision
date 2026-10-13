import type { SoundEffectKey } from '../types/diff'
import type { PlayerPosition, RiotEvent, RiotPlayer, TeamType } from '../types/riot'
import { cleanChampionName } from './ddragon'
import { isSamePlayer, parseTurretDetails } from './gameDiff'

export interface EnemyMIAState {
  summonerName: string
  championName: string
  team: TeamType
  position: PlayerPosition
  roleLabel: string
  thresholdSeconds: number // 60s (<5min) / 30s (>=5min) for Jungle; 25s (Mid) / 30s (Top/Bot) post-respawn for lanes
  lastSeenGameTime: number
  inactivitySeconds: number
  isMissing: boolean
  isDead: boolean
  respawnTimer: number
  waitingForReturnToLane?: boolean
  lastRespawnGameTime?: number
  lastAlertGameTime?: number
  alertTriggered: boolean
  lastCreepScore: number
  lastLevel: number
  lastKills: number
  lastDeaths: number
  lastAssists: number
  lastWardScore: number
  lastItemCount: number
  lastItemsSignature: string
}

export interface MIAAlert {
  id: string
  summonerName: string
  championName: string
  role: PlayerPosition
  roleLabel: string
  inactivitySeconds: number
  team: TeamType
  title: string
  subtitle: string
  soundKey: SoundEffectKey
}

export interface EnemyInactivityTrackerResult {
  states: Map<string, EnemyMIAState>
  alerts: MIAAlert[]
}

export function computeItemsSignature(player: RiotPlayer): string {
  if (!player.items || player.items.length === 0) return ''
  return [...player.items]
    .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
    .map((item) => `${item.slot}:${item.itemID}:${item.count}:${item.canUse ? 1 : 0}`)
    .join('|')
}

export function doesEventInvolvePlayer(event: RiotEvent, player: RiotPlayer): boolean {
  const identifiers = [
    player.summonerName,
    player.rawSummonerName,
    player.riotId,
    player.riotIdGameName,
    player.championName,
    cleanChampionName(player.championName),
    player.rawChampionName,
    cleanChampionName(player.rawChampionName),
  ].filter((s): s is string => typeof s === 'string' && !!s.trim())

  const matchesAny = (target?: string) =>
    Boolean(target && identifiers.some((id) => isSamePlayer(target, id)))

  if (matchesAny(event.KillerName) || matchesAny(event.VictimName) || matchesAny(event.Acer)) {
    return true
  }

  if (Array.isArray(event.Assisters)) {
    return event.Assisters.some((assister) => matchesAny(assister))
  }

  return false
}

export function getRoleLabel(position: string): string {
  switch (position) {
    case 'TOP':
      return 'Toplaner'
    case 'JUNGLE':
      return 'Jungler'
    case 'MIDDLE':
      return 'Midlaner'
    case 'BOTTOM':
      return 'ADC'
    case 'UTILITY':
      return 'Support'
    default:
      return 'Champion'
  }
}

export function getLanerWalkingThreshold(position: PlayerPosition): number {
  if (position === 'MIDDLE') {
    return 25 // 18s walking + 7s margin
  }
  return 30 // 25s walking + 5s margin for TOP, BOTTOM, UTILITY
}

export function getLaneFromPosition(position: PlayerPosition): 'TOP' | 'MID' | 'BOT' | null {
  switch (position) {
    case 'TOP':
      return 'TOP'
    case 'MIDDLE':
      return 'MID'
    case 'BOTTOM':
    case 'UTILITY':
      return 'BOT'
    default:
      return null
  }
}

export function isLaneT1Destroyed(
  events: RiotEvent[] = [],
  team: TeamType,
  lane: 'TOP' | 'MID' | 'BOT',
): boolean {
  return events.some((e) => {
    if (e.EventName !== 'TurretKilled' || !e.TurretKilled) return false
    const details = parseTurretDetails(e.TurretKilled)
    return details.destroyedTeam === team && details.lane === lane
  })
}

/**
 * Adjusts walking threshold based on destroyed outer turrets (T1):
 * - If enemy's own T1 is destroyed: minions crash closer to their base (T2).
 *   The enemy reaches their wave faster: threshold reduced by 5s (Mid: 20s, Side: 25s).
 * - If our allied T1 is destroyed (and enemy T1 alive): the wave pushes into our territory.
 *   The enemy must walk farther across the river: threshold increased by 5s (Mid: 30s, Side: 35s).
 * - Both T1 destroyed or both alive: baseline threshold (Mid: 25s, Side: 30s).
 */
export function getAdjustedLanerWalkingThreshold(
  position: PlayerPosition,
  events: RiotEvent[] = [],
  activePlayerTeam: TeamType = 'ORDER',
  enemyTeam: TeamType = 'CHAOS',
): number {
  const baseThreshold = getLanerWalkingThreshold(position)
  const lane = getLaneFromPosition(position)
  if (!lane) return baseThreshold

  const enemyT1Down = isLaneT1Destroyed(events, enemyTeam, lane)
  const alliedT1Down = isLaneT1Destroyed(events, activePlayerTeam, lane)

  if (enemyT1Down && !alliedT1Down) {
    return Math.max(15, baseThreshold - 5)
  }

  if (alliedT1Down && !enemyT1Down) {
    return baseThreshold + 5
  }

  return baseThreshold
}

export function getJunglerThreshold(gameTime: number): number {
  return gameTime < 300 ? 60 : 30
}

export function getLanerNotReturnedTitle(position: string): string {
  switch (position) {
    case 'TOP':
      return 'ATTENTION : TOPLANER ADVERSE NON REVENU EN LANE !'
    case 'MIDDLE':
      return 'ATTENTION : MIDLANER ADVERSE NON REVENU EN LANE !'
    case 'BOTTOM':
      return 'ATTENTION : ADC ADVERSE NON REVENU EN LANE !'
    case 'UTILITY':
      return 'ATTENTION : SUPPORT ADVERSE NON REVENU EN LANE !'
    default:
      return 'ATTENTION : ENNEMI NON REVENU EN LANE !'
  }
}

/**
 * Tracks inactivity with domain-grounded rules:
 * 1. Laners (Top, Mid, ADC, Support):
 *    - Tracked strictly after death + respawn.
 *    - Once respawned at fountain, walking time + 5s margin is counted:
 *      (Mid = 25s, Top/Bot/Support = 30s).
 *    - If no activity is shown once the walking threshold expires:
 *      the player has NOT returned to their lane -> emit MIA alert with beware.wav!
 *    - Any lane activity (CS, level, kill/assist, item change) cancels and confirms their return.
 * 2. Jungler:
 *    - Periodic checks: every 60s in early game (< 5 min / 300s), every 30s after 5 min.
 *    - Emits MIA alerts until seen active.
 */
export function trackEnemyInactivity(
  allPlayers: RiotPlayer[] = [],
  activePlayerTeam: TeamType = 'ORDER',
  gameTime = 0,
  events: RiotEvent[] = [],
  previousStates: Map<string, EnemyMIAState> | null = null,
): EnemyInactivityTrackerResult {
  const currentStates = new Map<string, EnemyMIAState>()
  const alerts: MIAAlert[] = []

  // If game hasn't started yet (e.g. initial 90s spawn), don't trigger missing alerts
  const isEarlyGame = gameTime < 90

  // Determine enemy team
  const enemyTeam: TeamType = activePlayerTeam === 'CHAOS' ? 'ORDER' : 'CHAOS'
  const enemyPlayers = allPlayers.filter((p) => p.team === enemyTeam)

  for (const player of enemyPlayers) {
    const key = player.summonerName || player.championName
    const role: PlayerPosition = player.position || 'MIDDLE'
    const roleLabel = getRoleLabel(role)
    const champ = player.championName

    const prev = previousStates?.get(key)
    const isDead = Boolean(player.isDead || (player.respawnTimer && player.respawnTimer > 0))
    const respawnTimer = Math.max(0, player.respawnTimer ?? 0)

    // Find any event involving this player since their last seen time (or within last 5s)
    const minEventTime = prev ? prev.lastSeenGameTime : gameTime - 5
    const inRecentEvent = events.some(
      (e) =>
        e.EventTime > minEventTime &&
        e.EventTime <= gameTime + 2 &&
        doesEventInvolvePlayer(e, player),
    )

    // Check for score / level / CS / ward / full inventory state changes
    const cs = player.scores?.creepScore ?? 0
    const level = player.level ?? 1
    const kills = player.scores?.kills ?? 0
    const deaths = player.scores?.deaths ?? 0
    const assists = player.scores?.assists ?? 0
    const wardScore = player.scores?.wardScore ?? 0
    const itemCount = player.items?.length ?? 0
    const itemsSignature = computeItemsSignature(player)

    let hasActivity = inRecentEvent
    if (prev) {
      if (
        cs !== prev.lastCreepScore ||
        level !== prev.lastLevel ||
        kills !== prev.lastKills ||
        deaths !== prev.lastDeaths ||
        assists !== prev.lastAssists ||
        Math.abs(wardScore - prev.lastWardScore) > 0.001 ||
        itemCount !== prev.lastItemCount ||
        itemsSignature !== prev.lastItemsSignature
      ) {
        hasActivity = true
      }
    }

    let lastSeen = gameTime
    let alertTriggered = false
    let isMissing = false
    let waitingForReturnToLane = false
    let lastRespawnGameTime = 0
    let lastAlertGameTime = 0
    let inactivitySeconds = 0
    let thresholdSeconds = 30

    if (role === 'JUNGLE') {
      thresholdSeconds = getJunglerThreshold(gameTime)

      if (!prev) {
        // Initial baseline
        lastSeen = gameTime
        alertTriggered = false
        isMissing = false
        lastAlertGameTime = 0
      } else if (isDead) {
        // Jungler is dead
        lastSeen = gameTime
        alertTriggered = false
        isMissing = false
        lastAlertGameTime = 0
      } else if (prev.isDead && !isDead) {
        // Just respawned
        lastSeen = gameTime
        alertTriggered = false
        isMissing = false
        lastAlertGameTime = 0
      } else if (hasActivity || isEarlyGame) {
        // Seen active
        lastSeen = gameTime
        alertTriggered = false
        isMissing = false
        lastAlertGameTime = 0
      } else {
        // Still not seen
        lastSeen = prev.lastSeenGameTime
        inactivitySeconds = Math.max(0, gameTime - lastSeen)
        lastAlertGameTime = prev.lastAlertGameTime ?? 0

        if (inactivitySeconds >= thresholdSeconds) {
          isMissing = true

          // Emit alert every thresholdSeconds period (e.g. every 60s in early, every 30s after)
          const timeSinceLastAlert =
            lastAlertGameTime > 0 ? gameTime - lastAlertGameTime : inactivitySeconds
          if (timeSinceLastAlert >= thresholdSeconds) {
            alertTriggered = true
            lastAlertGameTime = gameTime
            const formattedDuration =
              inactivitySeconds >= 60
                ? `${Math.floor(inactivitySeconds / 60)} min`
                : `${Math.floor(inactivitySeconds)}s`

            alerts.push({
              id: `mia-jungle-${champ.toLowerCase()}-${Math.floor(gameTime)}`,
              summonerName: player.summonerName,
              championName: champ,
              role,
              roleLabel,
              inactivitySeconds,
              team: enemyTeam,
              title: 'ATTENTION : JUNGLER ADVERSE DISPARU !',
              subtitle: `Le jungler adverse (${champ}) n'a pas été vu depuis ${formattedDuration} !`,
              soundKey: 'beware',
            })
          } else {
            alertTriggered = prev.alertTriggered
          }
        }
      }
    } else {
      // Laners: Post-death return-to-lane detection with turret status adjustment
      thresholdSeconds = getAdjustedLanerWalkingThreshold(role, events, activePlayerTeam, enemyTeam)

      if (!prev) {
        lastSeen = gameTime
        waitingForReturnToLane = false
        lastRespawnGameTime = 0
        alertTriggered = false
        isMissing = false
      } else if (isDead) {
        // While dead, reset return flag and update baseline
        lastSeen = gameTime
        waitingForReturnToLane = false
        lastRespawnGameTime = 0
        alertTriggered = false
        isMissing = false
      } else if (prev.isDead && !isDead) {
        // Respawned at fountain! Start walking countdown to lane
        lastSeen = gameTime
        waitingForReturnToLane = true
        lastRespawnGameTime = gameTime
        alertTriggered = false
        isMissing = false
      } else if (prev.waitingForReturnToLane) {
        lastRespawnGameTime = prev.lastRespawnGameTime ?? gameTime

        if (hasActivity) {
          // Laner has shown activity in lane (CS, items, level, kills/assists)!
          waitingForReturnToLane = false
          lastSeen = gameTime
          alertTriggered = false
          isMissing = false
          inactivitySeconds = 0
        } else {
          // Still waiting for them to show in lane
          waitingForReturnToLane = true
          lastSeen = prev.lastSeenGameTime
          const timeSinceRespawn = Math.max(0, gameTime - lastRespawnGameTime)
          inactivitySeconds = timeSinceRespawn

          if (timeSinceRespawn >= thresholdSeconds) {
            isMissing = true
            alertTriggered = prev.alertTriggered

            if (!prev.alertTriggered) {
              alertTriggered = true
              const formattedDuration = `${Math.floor(timeSinceRespawn)}s`
              alerts.push({
                id: `mia-${String(role).toLowerCase()}-${champ.toLowerCase()}-${Math.floor(gameTime)}`,
                summonerName: player.summonerName,
                championName: champ,
                role,
                roleLabel,
                inactivitySeconds: timeSinceRespawn,
                team: enemyTeam,
                title: getLanerNotReturnedTitle(role),
                subtitle: `Après sa réapparition, ${champ} n'est pas revenu sur sa voie (${formattedDuration}, roam probable) !`,
                soundKey: 'beware',
              })
            }
          }
        }
      } else {
        // Regular lane presence: active on lane, reset timer on any activity
        waitingForReturnToLane = false
        lastRespawnGameTime = 0
        lastSeen = hasActivity ? gameTime : prev.lastSeenGameTime
        alertTriggered = false
        isMissing = false
        inactivitySeconds = 0
      }
    }

    const state: EnemyMIAState = {
      summonerName: player.summonerName,
      championName: champ,
      team: enemyTeam,
      position: role,
      roleLabel,
      thresholdSeconds,
      lastSeenGameTime: lastSeen,
      inactivitySeconds,
      isMissing,
      isDead,
      respawnTimer,
      waitingForReturnToLane,
      lastRespawnGameTime,
      lastAlertGameTime,
      alertTriggered,
      lastCreepScore: cs,
      lastLevel: level,
      lastKills: kills,
      lastDeaths: deaths,
      lastAssists: assists,
      lastWardScore: wardScore,
      lastItemCount: itemCount,
      lastItemsSignature: itemsSignature,
    }

    currentStates.set(key, state)
  }

  return {
    states: currentStates,
    alerts,
  }
}
