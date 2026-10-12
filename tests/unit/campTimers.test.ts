import { describe, expect, it } from 'vitest'
import type { RiotEvent } from '../../shared/types/riot'
import { calculateCampTimers, detectCampAlerts } from '../../shared/utils/campTimers'

describe('campTimers utility', () => {
  it('calculates initial state before any epic monster spawns', () => {
    const camps = calculateCampTimers(100, [])
    const dragon = camps.find((c) => c.id === 'DRAGON')
    const baron = camps.find((c) => c.id === 'BARON')
    const herald = camps.find((c) => c.id === 'HERALD')
    const blueOrder = camps.find((c) => c.id === 'BLUE_ORDER')

    expect(dragon).toBeDefined()
    expect(dragon?.status).toBe('SPAWNING')
    // At 100s, dragon spawns at 300s -> 200s remaining
    expect(dragon?.remainingSeconds).toBe(200)

    expect(baron).toBeDefined()
    expect(baron?.status).toBe('SPAWNING')
    // Baron spawns at 1200s -> 1100s remaining
    expect(baron?.remainingSeconds).toBe(1100)

    expect(herald?.status).toBe('SPAWNING')
    expect(herald?.remainingSeconds).toBe(740)

    // Blue buff spawns at 90s, so at 100s it is ALIVE
    expect(blueOrder?.status).toBe('ALIVE')
    expect(blueOrder?.remainingSeconds).toBe(0)
  })

  it('marks dragon as ALIVE once initial spawn time is reached without kills', () => {
    const camps = calculateCampTimers(320, [])
    const dragon = camps.find((c) => c.id === 'DRAGON')

    expect(dragon?.status).toBe('ALIVE')
    expect(dragon?.remainingSeconds).toBe(0)
  })

  it('calculates dragon respawn timer (5 min = 300s) after DragonKill event', () => {
    const events: RiotEvent[] = [
      {
        EventID: 10,
        EventName: 'DragonKill',
        EventTime: 600, // killed at 10:00
        DragonType: 'Chemtech',
      },
    ]

    // At 700s (11:40), next spawn is 600 + 300 = 900s (15:00)
    const camps = calculateCampTimers(700, events)
    const dragon = camps.find((c) => c.id === 'DRAGON')

    expect(dragon?.status).toBe('SPAWNING')
    expect(dragon?.nextSpawnTime).toBe(900)
    expect(dragon?.remainingSeconds).toBe(200)
    expect(dragon?.killCount).toBe(1)
    expect(dragon?.dragonType).toBe('Chemtech')

    // At 900s, dragon respawns
    const respawned = calculateCampTimers(901, events)
    const dragonAlive = respawned.find((c) => c.id === 'DRAGON')
    expect(dragonAlive?.status).toBe('ALIVE')
    expect(dragonAlive?.remainingSeconds).toBe(0)
  })

  it('calculates Baron Nashor respawn timer (6 min = 360s) after BaronKill event', () => {
    const events: RiotEvent[] = [
      {
        EventID: 20,
        EventName: 'BaronKill',
        EventTime: 1300, // killed at 21:40
      },
    ]

    // At 1400s, next spawn is 1300 + 360 = 1660s -> remaining = 260s
    const camps = calculateCampTimers(1400, events)
    const baron = camps.find((c) => c.id === 'BARON')

    expect(baron?.status).toBe('SPAWNING')
    expect(baron?.nextSpawnTime).toBe(1660)
    expect(baron?.remainingSeconds).toBe(260)
    expect(baron?.killCount).toBe(1)
  })

  it('marks Herald as DESPAWNED after kill or past 19:45', () => {
    const killedEvents: RiotEvent[] = [
      {
        EventID: 30,
        EventName: 'HeraldKill',
        EventTime: 900,
      },
    ]
    const killedCamps = calculateCampTimers(920, killedEvents)
    expect(killedCamps.find((c) => c.id === 'HERALD')?.status).toBe('DESPAWNED')

    // Or despawns naturally at 1185s (19:45)
    const pastTimeCamps = calculateCampTimers(1200, [])
    expect(pastTimeCamps.find((c) => c.id === 'HERALD')?.status).toBe('DESPAWNED')
  })

  it('detects 60s and 30s warnings and spawn alerts when thresholds are crossed', () => {
    const prevCamps = calculateCampTimers(238, []) // 62s remaining
    const currCamps60 = calculateCampTimers(241, []) // 59s remaining

    const alerts60 = detectCampAlerts(prevCamps, currCamps60, 241)
    const dragonAlert60 = alerts60.find((a) => a.campId === 'DRAGON')
    expect(dragonAlert60).toBeDefined()
    expect(dragonAlert60?.title).toContain('DRAGON DANS 60 SECONDES')

    // 30s alert
    const prevCamps32 = calculateCampTimers(268, []) // 32s remaining
    const currCamps30 = calculateCampTimers(271, []) // 29s remaining
    const alerts30 = detectCampAlerts(prevCamps32, currCamps30, 271)
    const dragonAlert30 = alerts30.find((a) => a.campId === 'DRAGON')
    expect(dragonAlert30).toBeDefined()
    expect(dragonAlert30?.title).toContain('DRAGON DANS 30 SECONDES')

    // Spawn alert
    const prevSpawning = calculateCampTimers(298, []) // 2s remaining
    const currAlive = calculateCampTimers(301, []) // ALIVE
    const alertsSpawn = detectCampAlerts(prevSpawning, currAlive, 301)
    const dragonAlertSpawn = alertsSpawn.find((a) => a.campId === 'DRAGON')
    expect(dragonAlertSpawn).toBeDefined()
    expect(dragonAlertSpawn?.type).toBe('spawn')
    expect(dragonAlertSpawn?.title).toContain('DRAGON SUR LA FAILLE !')
  })
})
