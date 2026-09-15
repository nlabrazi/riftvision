import type { GameDiffEvent, GameDiffResult, TeamEconomySummary } from '../types/diff'
import type { RiotAllGameData, RiotEvent, RiotPlayer, TeamType } from '../types/riot'
import { formatSecondsToTime, getItemIconUrl } from './ddragon'

/**
 * Parse turret string ID to extract lane and tier
 * Format: Turret_TChaos_R_03_A (TOrder/TChaos, L=Top, C=Mid, R=Bot)
 */
export function parseTurretDetails(turretId?: string): {
  destroyedTeam: TeamType
  lane: 'TOP' | 'MID' | 'BOT' | 'UNKNOWN'
} {
  if (!turretId) {
    return { destroyedTeam: 'UNKNOWN', lane: 'UNKNOWN' }
  }

  const destroyedTeam: TeamType = turretId.includes('TOrder')
    ? 'ORDER'
    : turretId.includes('TChaos')
      ? 'CHAOS'
      : 'UNKNOWN'

  let lane: 'TOP' | 'MID' | 'BOT' | 'UNKNOWN' = 'UNKNOWN'
  if (turretId.includes('_L_')) {
    lane = 'TOP'
  } else if (turretId.includes('_C_')) {
    lane = 'MID'
  } else if (turretId.includes('_R_')) {
    lane = 'BOT'
  }

  return { destroyedTeam, lane }
}

/**
 * Calculate team economy and objective metrics
 */
export function calculateTeamEconomy(
  players: RiotPlayer[],
  events: RiotEvent[],
  team: TeamType,
): TeamEconomySummary {
  const teamPlayers = players.filter((p) => p.team === team)

  const totalItemGold = teamPlayers.reduce((total, p) => {
    return (
      total +
      (p.items || []).reduce((acc, item) => {
        const itemCost = (item.price || 0) * (item.count || 1)
        return acc + itemCost
      }, 0)
    )
  }, 0)

  const killCount = teamPlayers.reduce((acc, p) => acc + (p.scores?.kills || 0), 0)
  const deathCount = teamPlayers.reduce((acc, p) => acc + (p.scores?.deaths || 0), 0)

  // Count objectives secured by this team
  let turretCount = 0
  let dragonCount = 0
  let baronCount = 0

  const playerNames = new Set(teamPlayers.map((p) => p.summonerName))

  for (const e of events) {
    if (e.EventName === 'TurretKilled') {
      const details = parseTurretDetails(e.TurretKilled)
      // If the destroyed turret was on the other team, this team destroyed it
      if (details.destroyedTeam !== 'UNKNOWN' && details.destroyedTeam !== team) {
        turretCount++
      } else if (e.KillerName && playerNames.has(e.KillerName)) {
        turretCount++
      }
    } else if (e.EventName === 'DragonKill' && e.KillerName && playerNames.has(e.KillerName)) {
      dragonCount++
    } else if (e.EventName === 'BaronKill' && e.KillerName && playerNames.has(e.KillerName)) {
      baronCount++
    }
  }

  return {
    totalItemGold,
    killCount,
    deathCount,
    turretCount,
    dragonCount,
    baronCount,
  }
}

/**
 * Compute the diff between previous state and current state.
 * Returns newly detected events and aggregated team economies.
 */
export function computeGameDiff(
  prev: RiotAllGameData | null,
  curr: RiotAllGameData,
): GameDiffResult {
  const players = curr.allPlayers || []
  const allEvents = curr.events?.Events || []
  const gameTime = curr.gameData?.gameTime || 0

  const blueEconomy = calculateTeamEconomy(players, allEvents, 'ORDER')
  const redEconomy = calculateTeamEconomy(players, allEvents, 'CHAOS')
  const goldDifference = blueEconomy.totalItemGold - redEconomy.totalItemGold

  const newEvents: GameDiffEvent[] = []

  // Player Map for quick lookup
  const playerMap = new Map<string, RiotPlayer>()
  for (const p of players) {
    playerMap.set(p.summonerName, p)
  }

  // 1. Detect New Items Purchased (Inventory Diff)
  if (prev?.allPlayers?.length) {
    const prevPlayersMap = new Map<string, RiotPlayer>()
    for (const p of prev.allPlayers) {
      prevPlayersMap.set(p.summonerName, p)
    }

    for (const currPlayer of players) {
      const prevPlayer = prevPlayersMap.get(currPlayer.summonerName)
      if (prevPlayer) {
        const prevItemCounts = new Map<number, number>()
        for (const it of prevPlayer.items || []) {
          prevItemCounts.set(it.itemID, (prevItemCounts.get(it.itemID) || 0) + (it.count || 1))
        }

        for (const currItem of currPlayer.items || []) {
          if (!currItem.itemID) continue
          const prevCount = prevItemCounts.get(currItem.itemID) || 0
          const currCount = currItem.count || 1

          if (currCount > prevCount) {
            newEvents.push({
              id: `item-${currPlayer.championName}-${currItem.itemID}-${gameTime}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'ITEM_PURCHASE',
              gameTime,
              formattedTime: formatSecondsToTime(gameTime),
              title: `Nouvel objet : ${currItem.displayName}`,
              description: `${currPlayer.championName} a acheté ${currItem.displayName} (${currItem.price}g)`,
              team: currPlayer.team,
              metadata: {
                championName: currPlayer.championName,
                summonerName: currPlayer.summonerName,
                team: currPlayer.team,
                item: {
                  ...currItem,
                  iconUrl: getItemIconUrl(currItem.itemID),
                },
              },
            })
          }
        }

        // 2. Detect Death / Respawn Status Changes
        if (!prevPlayer.isDead && currPlayer.isDead) {
          newEvents.push({
            id: `death-${currPlayer.championName}-${gameTime}`,
            type: 'CHAMPION_DEATH',
            gameTime,
            formattedTime: formatSecondsToTime(gameTime),
            title: `Mort de ${currPlayer.championName}`,
            description: `${currPlayer.championName} (${currPlayer.team === 'ORDER' ? 'Bleu' : 'Rouge'}) a été éliminé (Respawn: ${currPlayer.respawnTimer}s)`,
            team: currPlayer.team,
            metadata: { championName: currPlayer.championName, team: currPlayer.team },
          })
        } else if (prevPlayer.isDead && !currPlayer.isDead) {
          newEvents.push({
            id: `respawn-${currPlayer.championName}-${gameTime}`,
            type: 'CHAMPION_RESPAWN',
            gameTime,
            formattedTime: formatSecondsToTime(gameTime),
            title: `Respawn : ${currPlayer.championName}`,
            description: `${currPlayer.championName} est de retour sur la Faille`,
            team: currPlayer.team,
            metadata: { championName: currPlayer.championName, team: currPlayer.team },
          })
        }
      }
    }
  }

  // 3. Detect Game Events (Kills, Towers, Dragons, Barons)
  let lastSeenEventId = -1
  if (prev?.events?.Events?.length) {
    lastSeenEventId = Math.max(...prev.events.Events.map((e) => e.EventID))
  }

  const rawNewEvents =
    lastSeenEventId >= 0
      ? allEvents.filter((e) => e.EventID > lastSeenEventId)
      : prev === null
        ? allEvents.slice(-5) // On initial load, take last 5 events
        : allEvents

  for (const e of rawNewEvents) {
    if (e.EventName === 'ChampionKill') {
      const killer = e.KillerName ? playerMap.get(e.KillerName) : undefined
      const victim = e.VictimName ? playerMap.get(e.VictimName) : undefined

      const killerChamp = killer?.championName || e.KillerName?.split('#')[0] || 'Inconnu'
      const victimChamp = victim?.championName || e.VictimName?.split('#')[0] || 'Inconnu'

      newEvents.push({
        id: `kill-${e.EventID}`,
        type: 'CHAMPION_KILL',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title: `Kill : ${killerChamp} ⚔️ ${victimChamp}`,
        description: `${killerChamp} a éliminé ${victimChamp}`,
        team: killer?.team,
        metadata: {
          killerName: e.KillerName,
          killerChampion: killerChamp,
          killerTeam: killer?.team,
          victimName: e.VictimName,
          victimChampion: victimChamp,
          victimTeam: victim?.team,
          assisters: e.Assisters || [],
        },
      })
    } else if (e.EventName === 'TurretKilled') {
      const { destroyedTeam, lane } = parseTurretDetails(e.TurretKilled)
      const killer = e.KillerName ? playerMap.get(e.KillerName) : undefined
      const killerChamp = killer?.championName || e.KillerName || 'Inconnu'

      newEvents.push({
        id: `turret-${e.EventID}`,
        type: 'TURRET_DESTROYED',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title: `Tour ${lane} détruite`,
        description: `Tour ${lane} (${destroyedTeam === 'ORDER' ? 'Bleue' : 'Rouge'}) détruite par ${killerChamp}`,
        team: killer?.team,
        metadata: { turretId: e.TurretKilled, lane, destroyedTeam, killerChamp },
      })
    } else if (e.EventName === 'DragonKill') {
      const killer = e.KillerName ? playerMap.get(e.KillerName) : undefined
      const killerChamp = killer?.championName || e.KillerName || 'Inconnu'

      newEvents.push({
        id: `dragon-${e.EventID}`,
        type: 'DRAGON_KILL',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title: `Dragon ${e.DragonType || ''} éliminé`,
        description: `Dragon ${e.DragonType || ''} sécurisé par ${killerChamp}`,
        team: killer?.team,
        metadata: { dragonType: e.DragonType, killerChamp },
      })
    } else if (e.EventName === 'BaronKill') {
      const killer = e.KillerName ? playerMap.get(e.KillerName) : undefined
      const killerChamp = killer?.championName || e.KillerName || 'Inconnu'

      newEvents.push({
        id: `baron-${e.EventID}`,
        type: 'BARON_KILL',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title: 'Baron Nashor éliminé',
        description: `Baron Nashor sécurisé par ${killerChamp}`,
        team: killer?.team,
        metadata: { killerChamp },
      })
    }
  }

  return {
    newEvents,
    blueEconomy,
    redEconomy,
    goldDifference,
  }
}
