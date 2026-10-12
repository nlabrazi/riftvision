import type { SoundEffectKey } from '../types/diff'
import type { RiotEvent, RiotPlayer, TeamType } from '../types/riot'
import { isSamePlayer } from './gameDiff'

export interface EnemyMIAState {
  summonerName: string
  championName: string
  team: TeamType
  position: 'JUNGLE' | 'MIDDLE'
  roleLabel: string
  thresholdSeconds: number // 60 for jungle, 30 for mid
  lastSeenGameTime: number
  inactivitySeconds: number
  isMissing: boolean
  isDead: boolean
  alertTriggered: boolean
  lastCreepScore: number
  lastLevel: number
  lastKills: number
  lastDeaths: number
  lastAssists: number
  lastWardScore: number
  lastItemCount: number
}

export interface MIAAlert {
  id: string
  summonerName: string
  championName: string
  role: 'JUNGLE' | 'MIDDLE'
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

/**
 * Tracks inactivity for enemy Jungler (60s) and enemy Midlaner (30s).
 * Emits MIA alerts with soundKey: 'beware' when threshold is reached.
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

  // Find recent events within the last 5 seconds to detect player participation
  const recentEvents = events.filter((e) => Math.abs(gameTime - e.EventTime) <= 5)

  for (const player of enemyPlayers) {
    if (player.position !== 'JUNGLE' && player.position !== 'MIDDLE') {
      continue
    }

    const key = player.summonerName || player.championName
    const role: 'JUNGLE' | 'MIDDLE' = player.position
    const roleLabel = role === 'JUNGLE' ? 'Jungler' : 'Midlaner'
    const thresholdSeconds = role === 'JUNGLE' ? 60 : 30
    const champ = player.championName

    const prev = previousStates?.get(key)
    const isDead = !!player.isDead

    // Check if player participated in any recent events
    const inRecentEvent = recentEvents.some(
      (e) =>
        isSamePlayer(e.KillerName, player.summonerName) ||
        isSamePlayer(e.VictimName, player.summonerName) ||
        (Array.isArray(e.Assisters) &&
          e.Assisters.some((a) => isSamePlayer(a, player.summonerName))),
    )

    // Check for score / level / CS / inventory changes
    const cs = player.scores?.creepScore ?? 0
    const level = player.level ?? 1
    const kills = player.scores?.kills ?? 0
    const deaths = player.scores?.deaths ?? 0
    const assists = player.scores?.assists ?? 0
    const wardScore = player.scores?.wardScore ?? 0
    const itemCount = player.items?.length ?? 0

    let hasActivity = inRecentEvent
    if (prev) {
      if (
        cs > prev.lastCreepScore ||
        level > prev.lastLevel ||
        kills !== prev.lastKills ||
        deaths !== prev.lastDeaths ||
        assists !== prev.lastAssists ||
        wardScore > prev.lastWardScore ||
        itemCount !== prev.lastItemCount
      ) {
        hasActivity = true
      }
    }

    let lastSeen = gameTime
    let alertTriggered = false
    let isMissing = false

    if (!prev) {
      // First snapshot initialization
      lastSeen = gameTime
      alertTriggered = false
      isMissing = false
    } else if (isDead) {
      // Dead players are in fountain and cannot gank
      lastSeen = gameTime
      alertTriggered = false
      isMissing = false
    } else if (prev.isDead && !isDead) {
      // Just respawned
      lastSeen = gameTime
      alertTriggered = false
      isMissing = false
    } else if (hasActivity || isEarlyGame) {
      // Player was recently seen active
      lastSeen = gameTime
      alertTriggered = false
      isMissing = false
    } else {
      // Alive and no activity detected
      lastSeen = prev.lastSeenGameTime
      const inactivity = Math.max(0, gameTime - lastSeen)

      if (inactivity >= thresholdSeconds) {
        isMissing = true
        alertTriggered = prev.alertTriggered

        // Trigger alert only once per MIA period
        if (!prev.alertTriggered) {
          alertTriggered = true
          const formattedDuration = role === 'JUNGLE' ? '1 min (60s)' : `${Math.floor(inactivity)}s`
          alerts.push({
            id: `mia-${role.toLowerCase()}-${champ.toLowerCase()}-${Math.floor(gameTime)}`,
            summonerName: player.summonerName,
            championName: champ,
            role,
            roleLabel,
            inactivitySeconds: inactivity,
            team: enemyTeam,
            title:
              role === 'JUNGLE'
                ? 'ATTENTION : JUNGLER ADVERSE DISPARU !'
                : 'ATTENTION : MIDLANER ADVERSE DISPARU !',
            subtitle:
              role === 'JUNGLE'
                ? `Le jungler adverse (${champ}) n'a pas été vu depuis ${formattedDuration} !`
                : `Le midlaner adverse (${champ}) a disparu depuis ${formattedDuration} !`,
            soundKey: 'beware',
          })
        }
      } else {
        isMissing = false
        alertTriggered = false
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
      inactivitySeconds: Math.max(0, gameTime - lastSeen),
      isMissing,
      isDead,
      alertTriggered,
      lastCreepScore: cs,
      lastLevel: level,
      lastKills: kills,
      lastDeaths: deaths,
      lastAssists: assists,
      lastWardScore: wardScore,
      lastItemCount: itemCount,
    }

    currentStates.set(key, state)
  }

  return {
    states: currentStates,
    alerts,
  }
}
