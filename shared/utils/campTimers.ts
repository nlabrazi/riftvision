import type { RiotEvent } from '../types/riot'
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
export function calculateCampTimers(gameTime: number, events: RiotEvent[] = []): NeutralCamp[] {
  const safeGameTime = Math.max(0, gameTime || 0)

  // 1. Dragon Calculations
  const dragonEvents = events.filter((e) => e.EventName === 'DragonKill')
  const dragonKillCount = dragonEvents.length
  const lastDragonEvent = dragonKillCount > 0 ? dragonEvents[dragonKillCount - 1] : undefined
  const lastDragonKillTime = lastDragonEvent?.EventTime

  // If 4 or more dragons are slain in total, elder dragon spawns next with 360s respawn
  const isElder = dragonKillCount >= 4
  const dragonRespawnDuration = isElder ? 360 : 300
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
  const grubsEvents = events.filter((e) => e.EventName === 'HordeKill')
  const grubsKillCount = grubsEvents.length
  const grubsInitialSpawn = 300 // 5:00
  const grubsDespawn = 825 // 13:45

  let grubsStatus: CampStatus = 'SPAWNING'
  let grubsNextSpawn = grubsInitialSpawn
  let grubsRemaining = 0

  if (grubsKillCount >= 2 || safeGameTime >= grubsDespawn) {
    grubsStatus = 'DESPAWNED'
    grubsNextSpawn = -1
    grubsRemaining = 0
  } else if (grubsKillCount === 1) {
    const lastGrubs = grubsEvents[0]
    const nextGrubsTime = lastGrubs.EventTime + 240
    if (nextGrubsTime >= grubsDespawn) {
      grubsStatus = 'DESPAWNED'
      grubsNextSpawn = -1
      grubsRemaining = 0
    } else if (safeGameTime >= nextGrubsTime) {
      grubsStatus = 'ALIVE'
      grubsNextSpawn = nextGrubsTime
      grubsRemaining = 0
    } else {
      grubsStatus = 'SPAWNING'
      grubsRemaining = Math.max(0, Math.ceil(nextGrubsTime - safeGameTime))
      grubsNextSpawn = nextGrubsTime
    }
  } else if (safeGameTime >= grubsInitialSpawn) {
    grubsStatus = 'ALIVE'
    grubsNextSpawn = grubsInitialSpawn
    grubsRemaining = 0
  } else {
    grubsStatus = 'SPAWNING'
    grubsRemaining = Math.max(0, Math.ceil(grubsInitialSpawn - safeGameTime))
    grubsNextSpawn = grubsInitialSpawn
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
      label: 'Larves du Néant',
      category: 'epic',
      iconType: 'herald',
      location: CAMP_LOCATIONS.VOIDGRUBS,
      status: grubsStatus,
      initialSpawnTime: grubsInitialSpawn,
      respawnDuration: 240,
      despawnTime: grubsDespawn,
      nextSpawnTime: grubsNextSpawn,
      remainingSeconds: grubsRemaining,
      killCount: grubsKillCount,
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
      })
    }
  }

  return alerts
}
