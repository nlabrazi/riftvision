import type { SoundEffectKey } from '../types/diff'
import type { RiotEvent, RiotPlayer } from '../types/riot'
import { OBJECTIVE_COORDINATES } from './mapCoordinates'

export type NeutralCampId =
  | 'DRAGON'
  | 'BARON'
  | 'HERALD'
  | 'VOIDGRUBS'
  | 'BLUE_ORDER'
  | 'BLUE_CHAOS'
  | 'RED_ORDER'
  | 'RED_CHAOS'
  | 'SCUTTLE_TOP'
  | 'SCUTTLE_BOT'

export type CampStatus = 'ALIVE' | 'SPAWNING' | 'DESPAWNED'

export interface NeutralCamp {
  id: NeutralCampId
  name: string
  label: string
  category: 'epic' | 'buff' | 'scuttle'
  iconType: 'dragon' | 'baron' | 'herald' | 'buff' | 'scuttle'
  team?: 'ORDER' | 'CHAOS'
  location: { x: number; y: number }
  status: CampStatus
  initialSpawnTime: number // gameTime in seconds
  respawnDuration: number // seconds after kill
  despawnTime?: number // gameTime in seconds
  nextSpawnTime: number // gameTime in seconds, -1 if despawned
  remainingSeconds: number // seconds until next spawn (0 if currently ALIVE)
  killCount: number
  lastKillTime?: number
  dragonType?: string
  isElder?: boolean
}

export interface CampAlert {
  id: string
  campId: NeutralCampId
  campName: string
  type: 'warning' | 'spawn'
  title: string
  subtitle: string
  remainingSeconds: number
  gameTime: number
  location: { x: number; y: number }
  soundKey?: SoundEffectKey
}

export const CAMP_LOCATIONS = {
  DRAGON: OBJECTIVE_COORDINATES.DRAGON_PIT,
  BARON: OBJECTIVE_COORDINATES.BARON_PIT,
  HERALD: OBJECTIVE_COORDINATES.BARON_PIT,
  VOIDGRUBS: OBJECTIVE_COORDINATES.BARON_PIT,
  BLUE_ORDER: { x: 28, y: 70 },
  BLUE_CHAOS: { x: 72, y: 30 },
  RED_ORDER: { x: 52, y: 78 },
  RED_CHAOS: { x: 48, y: 22 },
  SCUTTLE_TOP: { x: 40, y: 40 },
  SCUTTLE_BOT: { x: 60, y: 60 },
}

/**
 * Calculates current status and remaining seconds for all neutral camps on Summoner's Rift
 */
export function calculateCampTimers(
  gameTime: number,
  events: RiotEvent[] = [],
  allPlayers: RiotPlayer[] = [],
): NeutralCamp[] {
  const safeGameTime = Math.max(0, gameTime || 0)

  // 1. Dragon Calculations
  const dragonEvents = events.filter((e) => e.EventName === 'DragonKill')
  const dragonKillCount = dragonEvents.length
  const lastDragonEvent = dragonKillCount > 0 ? dragonEvents[dragonKillCount - 1] : undefined
  const lastDragonKillTime = lastDragonEvent?.EventTime

  // Determine if Dragon Soul has been claimed by either team (4 dragons by the same team)
  let orderDragons = 0
  let chaosDragons = 0
  if (allPlayers.length > 0) {
    for (const de of dragonEvents) {
      if (de.DragonType === 'Elder') continue
      const killer = (de.KillerName || '').trim().toLowerCase().split('#')[0]
      const p = allPlayers.find((player) => {
        const s = (player.summonerName || '').trim().toLowerCase().split('#')[0]
        const r = (player.rawSummonerName || '').trim().toLowerCase().split('#')[0]
        const g = (player.riotIdGameName || '').trim().toLowerCase().split('#')[0]
        return s === killer || r === killer || g === killer
      })
      if (p?.team === 'ORDER') orderDragons++
      else if (p?.team === 'CHAOS') chaosDragons++
    }
  }

  const hasSoul = orderDragons >= 4 || chaosDragons >= 4
  const isElder = hasSoul || lastDragonEvent?.DragonType === 'Elder' || dragonKillCount >= 8
  const dragonRespawnDuration = isElder ? 360 : 300 // 6:00 for Elder, 5:00 for Elemental
  const dragonInitialSpawn = 300 // 5:00

  let dragonStatus: CampStatus = 'SPAWNING'
  let dragonNextSpawn = dragonInitialSpawn
  let dragonRemaining = 0

  if (lastDragonKillTime !== undefined) {
    dragonNextSpawn = lastDragonKillTime + dragonRespawnDuration
    if (safeGameTime >= dragonNextSpawn) {
      dragonStatus = 'ALIVE'
      dragonRemaining = 0
    } else {
      dragonStatus = 'SPAWNING'
      dragonRemaining = Math.max(0, Math.ceil(dragonNextSpawn - safeGameTime))
    }
  } else {
    if (safeGameTime >= dragonInitialSpawn) {
      dragonStatus = 'ALIVE'
      dragonRemaining = 0
      dragonNextSpawn = dragonInitialSpawn
    } else {
      dragonStatus = 'SPAWNING'
      dragonRemaining = Math.max(0, Math.ceil(dragonInitialSpawn - safeGameTime))
      dragonNextSpawn = dragonInitialSpawn
    }
  }

  // 2. Baron Nashor Calculations
  const baronEvents = events.filter((e) => e.EventName === 'BaronKill')
  const baronKillCount = baronEvents.length
  const lastBaronEvent = baronKillCount > 0 ? baronEvents[baronKillCount - 1] : undefined
  const lastBaronKillTime = lastBaronEvent?.EventTime
  const baronInitialSpawn = 1200 // 20:00
  const baronRespawnDuration = 360 // 6 minutes

  let baronStatus: CampStatus = 'SPAWNING'
  let baronNextSpawn = baronInitialSpawn
  let baronRemaining = 0

  if (lastBaronKillTime !== undefined) {
    baronNextSpawn = lastBaronKillTime + baronRespawnDuration
    if (safeGameTime >= baronNextSpawn) {
      baronStatus = 'ALIVE'
      baronRemaining = 0
    } else {
      baronStatus = 'SPAWNING'
      baronRemaining = Math.max(0, Math.ceil(baronNextSpawn - safeGameTime))
    }
  } else {
    if (safeGameTime >= baronInitialSpawn) {
      baronStatus = 'ALIVE'
      baronRemaining = 0
      baronNextSpawn = baronInitialSpawn
    } else {
      baronStatus = 'SPAWNING'
      baronRemaining = Math.max(0, Math.ceil(baronInitialSpawn - safeGameTime))
      baronNextSpawn = baronInitialSpawn
    }
  }

  // 3. Rift Herald Calculations
  const heraldEvents = events.filter((e) => e.EventName === 'HeraldKill')
  const heraldKillCount = heraldEvents.length
  const heraldInitialSpawn = 840 // 14:00
  const heraldDespawn = 1185 // 19:45

  let heraldStatus: CampStatus = 'SPAWNING'
  let heraldNextSpawn = heraldInitialSpawn
  let heraldRemaining = 0

  if (heraldKillCount > 0 || safeGameTime >= heraldDespawn) {
    heraldStatus = 'DESPAWNED'
    heraldNextSpawn = -1
    heraldRemaining = 0
  } else if (safeGameTime >= heraldInitialSpawn) {
    heraldStatus = 'ALIVE'
    heraldNextSpawn = heraldInitialSpawn
    heraldRemaining = 0
  } else {
    heraldStatus = 'SPAWNING'
    heraldRemaining = Math.max(0, Math.ceil(heraldInitialSpawn - safeGameTime))
    heraldNextSpawn = heraldInitialSpawn
  }

  // 4. Voidgrubs (Larves du Néant) Calculations
  // Since Patch 14.8, initial spawn is at 6:00 (360s).
  // Grubs spawn in groups of 3. Each individual grub kill emits a HordeKill event.
  // When the 3 grubs of batch 1 are slain before 9:45 (585s), batch 2 spawns 4:00 (240s) later.
  // At 13:45 (825s), any remaining grubs despawn to make way for Rift Herald at 14:00.
  const grubsEvents = events.filter((e) => e.EventName === 'HordeKill')
  const totalGrubsKilled = grubsEvents.length // 0 to 6
  const grubsInitialSpawn = 360 // 6:00 (Patch 14.8)
  const grubsDespawn = 825 // 13:45

  let grubsStatus: CampStatus = 'SPAWNING'
  let grubsNextSpawn = grubsInitialSpawn
  let grubsRemaining = 0
  let grubsLabel = 'Larves du Néant'

  if (safeGameTime >= grubsDespawn || totalGrubsKilled >= 6) {
    grubsStatus = 'DESPAWNED'
    grubsNextSpawn = -1
    grubsRemaining = 0
    grubsLabel =
      totalGrubsKilled >= 6
        ? 'Larves du Néant (Vagues terminées)'
        : 'Larves du Néant (Héraut à 14:00)'
  } else if (totalGrubsKilled < 3) {
    // Vague 1 in progress or not spawned yet
    if (safeGameTime < grubsInitialSpawn) {
      grubsStatus = 'SPAWNING'
      grubsNextSpawn = grubsInitialSpawn
      grubsRemaining = Math.max(0, Math.ceil(grubsInitialSpawn - safeGameTime))
      grubsLabel = 'Larves du Néant (Vague 1)'
    } else {
      grubsStatus = 'ALIVE'
      grubsNextSpawn = grubsInitialSpawn
      grubsRemaining = 0
      grubsLabel =
        totalGrubsKilled === 0
          ? 'Larves du Néant (Vague 1)'
          : `Larves du Néant (Vague 1 · ${totalGrubsKilled}/3)`
    }
  } else {
    // At least 3 grubs killed (Vague 1 fully cleared)
    const batch1ClearEvent = grubsEvents[2]
    const batch1ClearTime = batch1ClearEvent?.EventTime ?? 0

    if (batch1ClearTime >= 585) {
      // Batch 1 cleared after 9:45 -> no second batch spawns
      grubsStatus = 'DESPAWNED'
      grubsNextSpawn = -1
      grubsRemaining = 0
      grubsLabel = 'Larves du Néant (Terminées)'
    } else {
      // Second batch spawns 4:00 (240s) after batch 1 clear
      const batch2SpawnTime = batch1ClearTime + 240
      if (batch2SpawnTime >= grubsDespawn) {
        grubsStatus = 'DESPAWNED'
        grubsNextSpawn = -1
        grubsRemaining = 0
        grubsLabel = 'Larves du Néant (Héraut à 14:00)'
      } else if (safeGameTime < batch2SpawnTime) {
        grubsStatus = 'SPAWNING'
        grubsNextSpawn = batch2SpawnTime
        grubsRemaining = Math.max(0, Math.ceil(batch2SpawnTime - safeGameTime))
        grubsLabel = 'Larves du Néant (Vague 2)'
      } else {
        // Batch 2 is currently alive!
        const grubsInBatch2 = totalGrubsKilled - 3
        grubsStatus = 'ALIVE'
        grubsNextSpawn = batch2SpawnTime
        grubsRemaining = 0
        grubsLabel =
          grubsInBatch2 === 0
            ? 'Larves du Néant (Vague 2)'
            : `Larves du Néant (Vague 2 · ${grubsInBatch2}/3)`
      }
    }
  }

  // 5. Buffs (Blue & Red)
  const buffInitialSpawn = 90 // 1:30
  const computeBuff = (
    id: NeutralCampId,
    name: string,
    team: 'ORDER' | 'CHAOS',
    location: { x: number; y: number },
  ): NeutralCamp => {
    const isBuffAlive = safeGameTime >= buffInitialSpawn
    return {
      id,
      name,
      label: `${name} (${team === 'ORDER' ? 'Bleu' : 'Rouge'})`,
      category: 'buff',
      iconType: 'buff',
      team,
      location,
      status: isBuffAlive ? 'ALIVE' : 'SPAWNING',
      initialSpawnTime: buffInitialSpawn,
      respawnDuration: 300,
      nextSpawnTime: isBuffAlive ? buffInitialSpawn : buffInitialSpawn,
      remainingSeconds: isBuffAlive ? 0 : Math.max(0, Math.ceil(buffInitialSpawn - safeGameTime)),
      killCount: 0,
    }
  }

  // 6. Scuttle Crabs
  const scuttleInitialSpawn = 210 // 3:30
  const computeScuttle = (
    id: NeutralCampId,
    name: string,
    location: { x: number; y: number },
  ): NeutralCamp => {
    const isScuttleAlive = safeGameTime >= scuttleInitialSpawn
    return {
      id,
      name,
      label: name,
      category: 'scuttle',
      iconType: 'scuttle',
      location,
      status: isScuttleAlive ? 'ALIVE' : 'SPAWNING',
      initialSpawnTime: scuttleInitialSpawn,
      respawnDuration: 150,
      nextSpawnTime: isScuttleAlive ? scuttleInitialSpawn : scuttleInitialSpawn,
      remainingSeconds: isScuttleAlive
        ? 0
        : Math.max(0, Math.ceil(scuttleInitialSpawn - safeGameTime)),
      killCount: 0,
    }
  }

  const camps: NeutralCamp[] = [
    {
      id: 'DRAGON',
      name: isElder ? 'Dragon Ancestral' : 'Dragon',
      label: isElder
        ? 'Dragon Ancestral'
        : lastDragonEvent?.DragonType
          ? `Dragon ${lastDragonEvent.DragonType}`
          : 'Dragon des Éléments',
      category: 'epic',
      iconType: 'dragon',
      location: CAMP_LOCATIONS.DRAGON,
      status: dragonStatus,
      initialSpawnTime: dragonInitialSpawn,
      respawnDuration: dragonRespawnDuration,
      nextSpawnTime: dragonNextSpawn,
      remainingSeconds: dragonRemaining,
      killCount: dragonKillCount,
      lastKillTime: lastDragonKillTime,
      dragonType: lastDragonEvent?.DragonType,
      isElder,
    },
    {
      id: 'BARON',
      name: 'Baron Nashor',
      label: 'Baron Nashor',
      category: 'epic',
      iconType: 'baron',
      location: CAMP_LOCATIONS.BARON,
      status: baronStatus,
      initialSpawnTime: baronInitialSpawn,
      respawnDuration: baronRespawnDuration,
      nextSpawnTime: baronNextSpawn,
      remainingSeconds: baronRemaining,
      killCount: baronKillCount,
      lastKillTime: lastBaronKillTime,
    },
    {
      id: 'HERALD',
      name: 'Héraut de la Faille',
      label: 'Héraut de la Faille',
      category: 'epic',
      iconType: 'herald',
      location: CAMP_LOCATIONS.HERALD,
      status: heraldStatus,
      initialSpawnTime: heraldInitialSpawn,
      respawnDuration: 0,
      despawnTime: heraldDespawn,
      nextSpawnTime: heraldNextSpawn,
      remainingSeconds: heraldRemaining,
      killCount: heraldKillCount,
    },
    {
      id: 'VOIDGRUBS',
      name: 'Larves du Néant',
      label: grubsLabel,
      category: 'epic',
      iconType: 'herald',
      location: CAMP_LOCATIONS.VOIDGRUBS,
      status: grubsStatus,
      initialSpawnTime: grubsInitialSpawn,
      respawnDuration: 240,
      despawnTime: grubsDespawn,
      nextSpawnTime: grubsNextSpawn,
      remainingSeconds: grubsRemaining,
      killCount: totalGrubsKilled,
    },
    computeBuff('BLUE_ORDER', 'Sentinelle Bleue', 'ORDER', CAMP_LOCATIONS.BLUE_ORDER),
    computeBuff('BLUE_CHAOS', 'Sentinelle Bleue', 'CHAOS', CAMP_LOCATIONS.BLUE_CHAOS),
    computeBuff('RED_ORDER', 'Raptor Rouge', 'ORDER', CAMP_LOCATIONS.RED_ORDER),
    computeBuff('RED_CHAOS', 'Raptor Rouge', 'CHAOS', CAMP_LOCATIONS.RED_CHAOS),
    computeScuttle('SCUTTLE_TOP', 'Carapateur Voie du Haut', CAMP_LOCATIONS.SCUTTLE_TOP),
    computeScuttle('SCUTTLE_BOT', 'Carapateur Voie du Bas', CAMP_LOCATIONS.SCUTTLE_BOT),
  ]

  return camps
}

/**
 * Detects newly crossed thresholds for camp warnings and spawns
 */
export function detectCampAlerts(
  previousCamps: NeutralCamp[] | null,
  currentCamps: NeutralCamp[],
  gameTime: number,
): CampAlert[] {
  if (!previousCamps?.length) return []
  const alerts: CampAlert[] = []

  const prevMap = new Map(previousCamps.map((c) => [c.id, c]))

  // We primarily alert on major Epic camps: DRAGON, BARON, HERALD, VOIDGRUBS
  const epicCampIds: NeutralCampId[] = ['DRAGON', 'BARON', 'HERALD', 'VOIDGRUBS']

  for (const curr of currentCamps) {
    if (!epicCampIds.includes(curr.id)) continue
    const prev = prevMap.get(curr.id)
    if (!prev) continue

    const soundKey: SoundEffectKey | undefined =
      curr.id === 'DRAGON' ? 'deathwing' : curr.id === 'BARON' ? 'archimonde' : undefined

    // 1. Warning alert: crossed 60s remaining threshold (between 58s and 60s)
    if (prev.remainingSeconds > 60 && curr.remainingSeconds <= 60 && curr.remainingSeconds > 0) {
      alerts.push({
        id: `camp-warn-60-${curr.id}-${Math.floor(curr.nextSpawnTime)}`,
        campId: curr.id,
        campName: curr.name,
        type: 'warning',
        title: `${curr.name.toUpperCase()} DANS 60 SECONDES`,
        subtitle: `Préparez la vision autour de la ${curr.id === 'DRAGON' ? 'fosse du dragon' : 'fosse du Baron'} !`,
        remainingSeconds: curr.remainingSeconds,
        gameTime,
        location: curr.location,
        soundKey,
      })
    }
    // 2. Warning alert: crossed 30s remaining threshold
    else if (
      prev.remainingSeconds > 30 &&
      curr.remainingSeconds <= 30 &&
      curr.remainingSeconds > 0
    ) {
      alerts.push({
        id: `camp-warn-30-${curr.id}-${Math.floor(curr.nextSpawnTime)}`,
        campId: curr.id,
        campName: curr.name,
        type: 'warning',
        title: `${curr.name.toUpperCase()} DANS 30 SECONDES`,
        subtitle: `${curr.name} apparaît sous peu sur la Faille !`,
        remainingSeconds: curr.remainingSeconds,
        gameTime,
        location: curr.location,
        soundKey,
      })
    }
    // 3. Spawn alert: transitioned from SPAWNING to ALIVE (or remaining was > 0 and became 0)
    else if (prev.status === 'SPAWNING' && curr.status === 'ALIVE') {
      alerts.push({
        id: `camp-spawn-${curr.id}-${Math.floor(gameTime)}`,
        campId: curr.id,
        campName: curr.name,
        type: 'spawn',
        title: `${curr.name.toUpperCase()} SUR LA FAILLE !`,
        subtitle: `${curr.name} est désormais disponible et prêt à être sécurisé.`,
        remainingSeconds: 0,
        gameTime,
        location: curr.location,
        soundKey,
      })
    }
  }

  return alerts
}
