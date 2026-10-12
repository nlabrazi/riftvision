import type {
  GameDiffEvent,
  GameDiffResult,
  SoundEffectKey,
  TeamEconomySummary,
} from '../types/diff'
import type {
  RiotActivePlayer,
  RiotAllGameData,
  RiotEvent,
  RiotPlayer,
  TeamType,
} from '../types/riot'
import { formatSecondsToTime, getItemIconUrl } from './ddragon'

/**
 * Check if two names refer to the same player (ignoring case and region tag like #EUW)
 */
export function isSamePlayer(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false
  const cleanA = nameA.trim().toLowerCase().split('#')[0]
  const cleanB = nameB.trim().toLowerCase().split('#')[0]
  return cleanA === cleanB
}

/**
 * Build a lookup map indexing players by full name, normalized name, and base name without tag
 */
export function buildPlayerMap(
  players: RiotPlayer[],
  activePlayer?: RiotActivePlayer,
): Map<string, RiotPlayer> {
  const map = new Map<string, RiotPlayer>()

  const normalize = (s?: string) => (s || '').trim().toLowerCase()
  const baseName = (s?: string) => normalize(s).split('#')[0]

  // Identify active player in allPlayers if activePlayer is provided
  let matchedActivePlayer: RiotPlayer | undefined
  if (activePlayer?.summonerName) {
    const actNorm = normalize(activePlayer.summonerName)
    const actBase = baseName(activePlayer.summonerName)
    matchedActivePlayer = players.find((p) => {
      const pNorm = normalize(p.summonerName)
      const pBase = baseName(p.summonerName)
      return pNorm === actNorm || pBase === actBase
    })
  }

  for (const p of players) {
    map.set(p.summonerName, p)
    map.set(normalize(p.summonerName), p)
    map.set(baseName(p.summonerName), p)

    if (p.rawSummonerName) {
      map.set(p.rawSummonerName, p)
      map.set(normalize(p.rawSummonerName), p)
      map.set(baseName(p.rawSummonerName), p)
    }

    if (p.championName) {
      map.set(p.championName, p)
      map.set(normalize(p.championName), p)
    }
  }

  if (activePlayer?.summonerName && matchedActivePlayer) {
    map.set(activePlayer.summonerName, matchedActivePlayer)
    map.set(normalize(activePlayer.summonerName), matchedActivePlayer)
    map.set(baseName(activePlayer.summonerName), matchedActivePlayer)
  }

  return map
}

/**
 * Find a player by summonerName, riotId, or championName
 */
export function findPlayer(
  name: string | undefined,
  playerMap: Map<string, RiotPlayer>,
  players: RiotPlayer[],
  activePlayer?: RiotActivePlayer,
): RiotPlayer | undefined {
  if (!name) return undefined
  const trimmed = name.trim()
  if (!trimmed) return undefined

  if (playerMap.has(trimmed)) return playerMap.get(trimmed)

  const norm = trimmed.toLowerCase()
  if (playerMap.has(norm)) return playerMap.get(norm)

  const base = norm.split('#')[0]
  if (playerMap.has(base)) return playerMap.get(base)

  if (activePlayer?.summonerName && isSamePlayer(name, activePlayer.summonerName)) {
    const actBase = activePlayer.summonerName.trim().toLowerCase().split('#')[0]
    const p = players.find(
      (pl) => isSamePlayer(pl.summonerName, actBase) || isSamePlayer(pl.rawSummonerName, actBase),
    )
    if (p) return p
  }

  const found = players.find((p) => {
    const pBase = (p.summonerName || '').trim().toLowerCase().split('#')[0]
    const pRaw = (p.rawSummonerName || '').trim().toLowerCase().split('#')[0]
    return (
      pBase === base ||
      pRaw === base ||
      (pBase.length >= 3 && base.length >= 3 && (pBase.includes(base) || base.includes(pBase)))
    )
  })
  if (found) return found

  return undefined
}

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

  const playerNames = new Set<string>()
  for (const p of teamPlayers) {
    playerNames.add(p.summonerName)
    playerNames.add(p.summonerName.toLowerCase())
    playerNames.add(p.summonerName.toLowerCase().split('#')[0])
    if (p.rawSummonerName) {
      playerNames.add(p.rawSummonerName)
      playerNames.add(p.rawSummonerName.toLowerCase())
      playerNames.add(p.rawSummonerName.toLowerCase().split('#')[0])
    }
  }

  const isTeamKiller = (killer?: string) => {
    if (!killer) return false
    const norm = killer.toLowerCase()
    const base = norm.split('#')[0]
    return playerNames.has(killer) || playerNames.has(norm) || playerNames.has(base)
  }

  for (const e of events) {
    if (e.EventName === 'TurretKilled') {
      const details = parseTurretDetails(e.TurretKilled)
      // If the destroyed turret was on the other team, this team destroyed it
      if (details.destroyedTeam !== 'UNKNOWN' && details.destroyedTeam !== team) {
        turretCount++
      } else if (isTeamKiller(e.KillerName)) {
        turretCount++
      }
    } else if (e.EventName === 'DragonKill' && isTeamKiller(e.KillerName)) {
      dragonCount++
    } else if (e.EventName === 'BaronKill' && isTeamKiller(e.KillerName)) {
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
 * Calculate kill streak for a summoner up to a given event timestamp
 */
export function calculateKillStreak(
  allEvents: RiotEvent[],
  summonerName: string,
  upToEventTime: number,
): number {
  let streak = 0
  const sorted = [...allEvents]
    .filter((e) => e.EventTime <= upToEventTime)
    .sort((a, b) => a.EventTime - b.EventTime)

  for (const ev of sorted) {
    if (ev.EventName === 'ChampionKill') {
      if (isSamePlayer(ev.KillerName, summonerName)) {
        streak++
      } else if (isSamePlayer(ev.VictimName, summonerName)) {
        streak = 0
      }
    }
  }
  return streak
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

  // Player Map for quick lookup with flexible Riot ID / Summoner Name matching
  const playerMap = buildPlayerMap(players, curr.activePlayer)

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
    if (e.EventName === 'FirstBlood') {
      const recipient = findPlayer(e.Recipient, playerMap, players, curr.activePlayer)
      const killerChamp = recipient?.championName || 'Champion'
      newEvents.push({
        id: `firstblood-${e.EventID}`,
        type: 'FIRST_BLOOD',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title: 'PREMIER SANG !',
        description: `${killerChamp} a versé le Premier Sang !`,
        team: recipient?.team,
        metadata: {
          recipientName: e.Recipient,
          killerChampion: killerChamp,
          team: recipient?.team,
          soundKey: 'firstblood' as SoundEffectKey,
        },
      })
    } else if (e.EventName === 'Multikill') {
      const killer = findPlayer(e.KillerName, playerMap, players, curr.activePlayer)
      const killerChamp = killer?.championName || 'Champion'
      const streak = Number(e.KillStreak) || 2

      let title = 'DOUBLE KILL !'
      let soundKey: SoundEffectKey = 'doublekill'
      if (streak === 2) {
        title = 'DOUBLE KILL !'
        soundKey = 'doublekill'
      } else if (streak === 3) {
        title = 'TRIPLE KILL !'
        soundKey = 'triplekill'
      } else if (streak === 4) {
        title = 'QUADRA KILL (MEGA KILL) !'
        soundKey = 'megakill'
      } else if (streak === 5) {
        title = 'PENTAKILL (ULTRA KILL) !'
        soundKey = 'ultrakill'
      } else {
        title = 'MONSTER KILL !'
        soundKey = 'monsterkill'
      }

      newEvents.push({
        id: `multikill-${e.EventID}`,
        type: 'MULTIKILL',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title,
        description: `${killerChamp} réalise un ${title}`,
        team: killer?.team,
        metadata: {
          killerName: e.KillerName,
          killerChampion: killerChamp,
          streak,
          soundKey,
        },
      })
    } else if (e.EventName === 'Ace') {
      const acingTeamStr = typeof e.AcingTeam === 'string' ? e.AcingTeam.toUpperCase() : ''
      const team: TeamType =
        acingTeamStr.includes('ORDER') || acingTeamStr === 'BLUE' ? 'ORDER' : 'CHAOS'
      const soundKey: SoundEffectKey =
        team === 'ORDER' ? 'blue_team_dominating' : 'red_team_dominating'
      newEvents.push({
        id: `ace-${e.EventID}`,
        type: 'ACE',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title: `ACE POUR L'ÉQUIPE ${team === 'ORDER' ? 'BLEUE' : 'ROUGE'} !`,
        description: 'Tous les champions adverses sont éliminés !',
        team,
        metadata: {
          acer: e.Acer,
          team,
          soundKey,
        },
      })
    } else if (e.EventName === 'ChampionKill') {
      const isExecution =
        !e.KillerName || e.KillerName.startsWith('Turret_') || e.KillerName.startsWith('Minion_')
      const victim = findPlayer(e.VictimName, playerMap, players, curr.activePlayer)
      const victimChamp = victim?.championName || 'Ennemi'

      if (isExecution) {
        newEvents.push({
          id: `execute-${e.EventID}`,
          type: 'EXECUTE',
          gameTime: e.EventTime,
          formattedTime: formatSecondsToTime(e.EventTime),
          title: 'MORT HUMILIANTE',
          description: `${victimChamp} s'est fait exécuter par l'environnement !`,
          team: victim?.team,
          metadata: {
            victimName: e.VictimName,
            victimChampion: victimChamp,
            victimTeam: victim?.team,
            soundKey: 'humiliating_defeat' as SoundEffectKey,
          },
        })
      } else {
        const killer = findPlayer(e.KillerName, playerMap, players, curr.activePlayer)
        const killerChamp = killer?.championName || 'Champion'
        const isSoloKill = !e.Assisters || e.Assisters.length === 0
        const streak = e.KillerName ? calculateKillStreak(allEvents, e.KillerName, e.EventTime) : 1

        let soundKey: SoundEffectKey = 'headshot'
        if (streak >= 8) soundKey = 'ludicrouskill'
        else if (streak >= 6) soundKey = 'godlike'
        else if (streak >= 4) soundKey = 'unstoppable'
        else if (streak === 3) soundKey = 'killingspree'
        else soundKey = 'headshot'

        newEvents.push({
          id: `kill-${e.EventID}`,
          type: 'CHAMPION_KILL',
          gameTime: e.EventTime,
          formattedTime: formatSecondsToTime(e.EventTime),
          title: isSoloKill
            ? `Solo Kill : ${killerChamp} ⚔️ ${victimChamp}`
            : `Kill : ${killerChamp} ⚔️ ${victimChamp}`,
          description: `${killerChamp} a éliminé ${victimChamp}${isSoloKill ? ' en duel (Solo Kill)' : ''}`,
          team: killer?.team,
          metadata: {
            killerName: e.KillerName,
            killerChampion: killerChamp,
            killerTeam: killer?.team,
            victimName: e.VictimName,
            victimChampion: victimChamp,
            victimTeam: victim?.team,
            assisters: e.Assisters || [],
            isSoloKill,
            streak,
            soundKey,
          },
        })

        if ([3, 4, 6, 8].includes(streak)) {
          const streakMap: Record<number, { title: string; sound: SoundEffectKey }> = {
            3: { title: 'SÉRIE DE MEURTRES (KILLING SPREE)', sound: 'killingspree' },
            4: { title: 'INARRÊTABLE (UNSTOPPABLE)', sound: 'unstoppable' },
            6: { title: 'LÉGENDAIRE (GODLIKE)', sound: 'godlike' },
            8: { title: 'CARNAGE TOTAL (LUDICROUS KILL)', sound: 'ludicrouskill' },
          }
          const info = streakMap[streak]
          if (info) {
            newEvents.push({
              id: `streak-${e.EventID}-${streak}`,
              type: 'KILL_STREAK',
              gameTime: e.EventTime,
              formattedTime: formatSecondsToTime(e.EventTime),
              title: info.title,
              description: `${killerChamp} enchaîne ${streak} éliminations sans mourir !`,
              team: killer?.team,
              metadata: {
                killerName: e.KillerName,
                killerChampion: killerChamp,
                streak,
                soundKey: info.sound,
              },
            })
          }
        }
      }
    } else if (e.EventName === 'TurretKilled') {
      const { destroyedTeam, lane } = parseTurretDetails(e.TurretKilled)
      const killer = findPlayer(e.KillerName, playerMap, players, curr.activePlayer)
      const killerChamp = killer?.championName || 'Équipe'

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
      const killer = findPlayer(e.KillerName, playerMap, players, curr.activePlayer)
      const killerChamp = killer?.championName || 'Équipe'

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
      const killer = findPlayer(e.KillerName, playerMap, players, curr.activePlayer)
      const killerChamp = killer?.championName || 'Équipe'
      const team: TeamType = killer?.team || 'ORDER'
      const soundKey: SoundEffectKey =
        team === 'ORDER' ? 'blue_team_dominating' : 'red_team_dominating'

      newEvents.push({
        id: `baron-${e.EventID}`,
        type: 'BARON_KILL',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title: 'Baron Nashor éliminé',
        description: `Baron Nashor sécurisé par ${killerChamp}`,
        team,
        metadata: { killerChamp, soundKey },
      })
    } else if (e.EventName === 'GameEnd') {
      const winner: TeamType = e.Result === 'Win' || e.Winner === 'ORDER' ? 'ORDER' : 'CHAOS'
      const soundKey: SoundEffectKey =
        winner === 'ORDER' ? 'blue_team_is_the_winner' : 'red_team_is_the_winner'
      newEvents.push({
        id: `gameend-${e.EventID}`,
        type: 'GAME_END',
        gameTime: e.EventTime,
        formattedTime: formatSecondsToTime(e.EventTime),
        title: `VICTOIRE DE L'ÉQUIPE ${winner === 'ORDER' ? 'BLEUE' : 'ROUGE'} !`,
        description: `Fin de partie - Victoire de l'équipe ${winner === 'ORDER' ? 'Bleue' : 'Rouge'}`,
        team: winner,
        metadata: { winner, soundKey },
      })
    }
  }

  // 4. Check Gold Dominance threshold (+5000 / -5000)
  if (prev) {
    const prevBlueEco = calculateTeamEconomy(
      prev.allPlayers || [],
      prev.events?.Events || [],
      'ORDER',
    )
    const prevRedEco = calculateTeamEconomy(
      prev.allPlayers || [],
      prev.events?.Events || [],
      'CHAOS',
    )
    const prevGoldDiff = prevBlueEco.totalItemGold - prevRedEco.totalItemGold

    if (prevGoldDiff < 5000 && goldDifference >= 5000) {
      newEvents.push({
        id: `dominating-order-${gameTime}`,
        type: 'DOMINATING',
        gameTime,
        formattedTime: formatSecondsToTime(gameTime),
        title: "L'ÉQUIPE BLEUE DOMINE LA FAILLE !",
        description: "L'Équipe Bleue prend plus de 5 000 pièces d'or d'avance !",
        team: 'ORDER',
        metadata: { soundKey: 'blue_team_dominating' as SoundEffectKey },
      })
    } else if (prevGoldDiff > -5000 && goldDifference <= -5000) {
      newEvents.push({
        id: `dominating-chaos-${gameTime}`,
        type: 'DOMINATING',
        gameTime,
        formattedTime: formatSecondsToTime(gameTime),
        title: "L'ÉQUIPE ROUGE DOMINE LA FAILLE !",
        description: "L'Équipe Rouge prend plus de 5 000 pièces d'or d'avance !",
        team: 'CHAOS',
        metadata: { soundKey: 'red_team_dominating' as SoundEffectKey },
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
