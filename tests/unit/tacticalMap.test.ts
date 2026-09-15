import { describe, expect, it } from 'vitest'
import {
  OBJECTIVE_COORDINATES,
  ROLE_COORDINATES,
  TURRET_LANDMARKS,
  getChampionMapPosition,
  getDestroyedTurretIds,
} from '../../shared/utils/mapCoordinates'

describe('mapCoordinates', () => {
  it('returns valid coordinates for all standard roles across both teams', () => {
    const roles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const
    for (const role of roles) {
      const bluePos = getChampionMapPosition('ORDER', role)
      expect(bluePos.x).toBeGreaterThanOrEqual(0)
      expect(bluePos.x).toBeLessThanOrEqual(100)
      expect(bluePos.y).toBeGreaterThanOrEqual(0)
      expect(bluePos.y).toBeLessThanOrEqual(100)

      const redPos = getChampionMapPosition('CHAOS', role)
      expect(redPos.x).toBeGreaterThanOrEqual(0)
      expect(redPos.x).toBeLessThanOrEqual(100)
      expect(redPos.y).toBeGreaterThanOrEqual(0)
      expect(redPos.y).toBeLessThanOrEqual(100)
    }
  })

  it('falls back gracefully on unknown or empty positions', () => {
    const posUnknown = getChampionMapPosition('ORDER', 'UNKNOWN')
    expect(posUnknown).toEqual(ROLE_COORDINATES.ORDER.UNKNOWN)

    const posEmpty = getChampionMapPosition('CHAOS', '')
    expect(posEmpty).toEqual(ROLE_COORDINATES.CHAOS[''])
  })

  it('defines objective landmarks in appropriate river quadrants', () => {
    // Baron is upper river (low x, low y)
    expect(OBJECTIVE_COORDINATES.BARON_PIT.x).toBeLessThan(50)
    expect(OBJECTIVE_COORDINATES.BARON_PIT.y).toBeLessThan(50)

    // Dragon is lower river (high x, high y)
    expect(OBJECTIVE_COORDINATES.DRAGON_PIT.x).toBeGreaterThan(50)
    expect(OBJECTIVE_COORDINATES.DRAGON_PIT.y).toBeGreaterThan(50)
  })

  it('detects destroyed turret IDs from event logs', () => {
    const mockEvents = [
      { EventID: 1, EventName: 'ChampionKill' },
      { EventID: 2, EventName: 'TurretKilled', TurretKilled: 'Turret_T2_L_03_A' },
      { EventID: 3, EventName: 'TurretKilled', TurretKilled: 'Turret_T1_C_05_A' },
      { EventID: 4, EventName: 'DragonKill' },
    ]

    const destroyed = getDestroyedTurretIds(mockEvents)
    expect(destroyed.size).toBe(2)
    expect(destroyed.has('Turret_T2_L_03_A')).toBe(true)
    expect(destroyed.has('Turret_T1_C_05_A')).toBe(true)
    expect(destroyed.has('Turret_T1_L_03_A')).toBe(false)
  })

  it('has turret landmarks for both teams with valid lanes', () => {
    expect(TURRET_LANDMARKS.length).toBeGreaterThan(0)
    const orderTurrets = TURRET_LANDMARKS.filter((t) => t.team === 'ORDER')
    const chaosTurrets = TURRET_LANDMARKS.filter((t) => t.team === 'CHAOS')

    expect(orderTurrets.length).toBe(6)
    expect(chaosTurrets.length).toBe(6)
  })
})
