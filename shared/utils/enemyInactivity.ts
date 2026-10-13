import type { SoundEffectKey } from '../types/diff'
import type { PlayerPosition, RiotEvent, RiotPlayer, TeamType } from '../types/riot'
import { cleanChampionName } from './ddragon'
import { isSamePlayer } from './gameDiff'

export interface EnemyMIAState {
  summonerName: string
  championName: string
  team: TeamType
  position: PlayerPosition
  roleLabel: string
  thresholdSeconds: number // 60 for jungle, 30 for lanes (top, mid, adc, support)
  lastSeenGameTime: number
  inactivitySeconds: number
  isMissing: boolean
  isDead: boolean
  respawnTimer: number
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

export function getAlertTitle(position: string): string {
  switch (position) {
    case 'TOP':
      return 'ATTENTION : TOPLANER ADVERSE DISPARU !'
    case 'JUNGLE':
      return 'ATTENTION : JUNGLER ADVERSE DISPARU !'
    case 'MIDDLE':
      return 'ATTENTION : MIDLANER ADVERSE DISPARU !'
    case 'BOTTOM':
      return 'ATTENTION : ADC ADVERSE DISPARU !'
    case 'UTILITY':
      return 'ATTENTION : SUPPORT ADVERSE DISPARU !'
    default:
      return 'ATTENTION : ENNEMI DISPARU !'
  }
}

export function getAlertSubtitle(
  position: string,
  champ: string,
  formattedDuration: string,
): string {
  switch (position) {
    case 'TOP':
      return `Le toplaner adverse (${champ}) a disparu depuis ${formattedDuration} !`
    case 'JUNGLE':
      return `Le jungler adverse (${champ}) n'a pas été vu depuis ${formattedDuration} !`
    case 'MIDDLE':
      return `Le midlaner adverse (${champ}) a disparu depuis ${formattedDuration} !`
    case 'BOTTOM':
      return `L'ADC adverse (${champ}) a disparu depuis ${formattedDuration} !`
    case 'UTILITY':
      return `Le support adverse (${champ}) a disparu depuis ${formattedDuration} !`
    default:
      return `L'adversaire (${champ}) a disparu depuis ${formattedDuration} !`
  }
}

/**
 * Tracks inactivity for all enemy roles (Top, Jungle, Mid, ADC, Support).
 * - Jungler threshold: 60 seconds (1 minute)
 * - Laners (Top, Mid, ADC, Support) threshold: 30 seconds
 * Dead players in fountain are an exception and cannot be MIA; their respawn timer is tracked.
 * When an enemy respawns, the inactivity baseline restarts from the moment of respawn.
 * Emits MIA alerts with soundKey: 'beware' when thresholds are reached.
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
    const thresholdSeconds = role === 'JUNGLE' ? 60 : 30
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

    if (!prev) {
      // First snapshot initialization: establish baseline
      lastSeen = gameTime
      alertTriggered = false
      isMissing = false
    } else if (isDead) {
      // Dead players are in fountain and cannot roam/gank; timer does not advance while dead
      lastSeen = gameTime
      alertTriggered = false
      isMissing = false
    } else if (prev.isDead && !isDead) {
      // Just respawned at fountain: timer restarts fresh from respawn time
      lastSeen = gameTime
      alertTriggered = false
      isMissing = false
    } else if (hasActivity || isEarlyGame) {
      // Player was recently seen active: immediately reset timer to 0
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
            id: `mia-${String(role).toLowerCase()}-${champ.toLowerCase()}-${Math.floor(gameTime)}`,
            summonerName: player.summonerName,
            championName: champ,
            role,
            roleLabel,
            inactivitySeconds: inactivity,
            team: enemyTeam,
            title: getAlertTitle(role),
            subtitle: getAlertSubtitle(role, champ, formattedDuration),
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
      inactivitySeconds: isDead ? 0 : Math.max(0, gameTime - lastSeen),
      isMissing,
      isDead,
      respawnTimer,
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
