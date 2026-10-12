import { describe, expect, it } from 'vitest'
import { mockGameData } from '../../server/data/mockGame'
import type { RiotPlayer } from '../../shared/types/riot'
import { trackEnemyInactivity } from '../../shared/utils/enemyInactivity'

describe('enemyInactivity tracker', () => {
  const getPlayers = (): RiotPlayer[] => JSON.parse(JSON.stringify(mockGameData.allPlayers))

  it('initializes state on first snapshot without firing alerts', () => {
    const players = getPlayers()
    const result = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    expect(result.alerts).toHaveLength(0)
    // Jungler and Midlaner from CHAOS team should be tracked
    const jungler = Array.from(result.states.values()).find((s) => s.position === 'JUNGLE')
    const midlaner = Array.from(result.states.values()).find((s) => s.position === 'MIDDLE')

    expect(jungler).toBeDefined()
    expect(jungler?.roleLabel).toBe('Jungler')
    expect(jungler?.thresholdSeconds).toBe(60)
    expect(jungler?.isMissing).toBe(false)

    expect(midlaner).toBeDefined()
    expect(midlaner?.roleLabel).toBe('Midlaner')
    expect(midlaner?.thresholdSeconds).toBe(30)
    expect(midlaner?.isMissing).toBe(false)
  })

  it('triggers MIA alert with beware sound when enemy midlaner is missing for 30 seconds', () => {
    const players = getPlayers()
    // Initial snapshot at t = 300
    const initial = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    // Tick at t = 320 (20s elapsed -> not missing yet)
    const tick20 = trackEnemyInactivity(players, 'ORDER', 320, [], initial.states)
    expect(tick20.alerts).toHaveLength(0)
    const mid20 = Array.from(tick20.states.values()).find((s) => s.position === 'MIDDLE')
    expect(mid20?.isMissing).toBe(false)

    // Tick at t = 331 (31s elapsed -> midlaner crossed 30s threshold!)
    const tick31 = trackEnemyInactivity(players, 'ORDER', 331, [], tick20.states)
    expect(tick31.alerts).toHaveLength(1)
    expect(tick31.alerts[0].role).toBe('MIDDLE')
    expect(tick31.alerts[0].soundKey).toBe('beware')
    expect(tick31.alerts[0].title).toContain('MIDLANER ADVERSE DISPARU')
    expect(tick31.alerts[0].subtitle).toContain('a disparu depuis 31s')

    // Subsequent tick without new activity should NOT re-trigger alert (prevents spam)
    const tick35 = trackEnemyInactivity(players, 'ORDER', 335, [], tick31.states)
    expect(tick35.alerts).toHaveLength(0)
    const mid35 = Array.from(tick35.states.values()).find((s) => s.position === 'MIDDLE')
    expect(mid35?.isMissing).toBe(true)
    expect(mid35?.alertTriggered).toBe(true)
  })

  it('triggers MIA alert with beware sound when enemy jungler is missing for 60 seconds (1 min)', () => {
    const players = getPlayers()
    // Initial snapshot at t = 400
    const initial = trackEnemyInactivity(players, 'ORDER', 400, [], null)

    // Tick at t = 450 (50s elapsed -> mid already triggered at 30s, jungler not yet at 50s)
    const tick50 = trackEnemyInactivity(players, 'ORDER', 450, [], initial.states)
    const j50 = Array.from(tick50.states.values()).find((s) => s.position === 'JUNGLE')
    expect(j50?.isMissing).toBe(false)

    // Tick at t = 461 (61s elapsed -> jungler crossed 60s threshold!)
    const tick61 = trackEnemyInactivity(players, 'ORDER', 461, [], tick50.states)
    const jungleAlert = tick61.alerts.find((a) => a.role === 'JUNGLE')
    expect(jungleAlert).toBeDefined()
    expect(jungleAlert?.soundKey).toBe('beware')
    expect(jungleAlert?.title).toContain('JUNGLER ADVERSE DISPARU')
    expect(jungleAlert?.subtitle).toContain("n'a pas été vu depuis 1 min (60s)")
  })

  it('resets inactivity timer and disarms alert when enemy player gains CS or level', () => {
    const players = getPlayers()
    const initial = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    // Advance to 335s (midlaner becomes missing)
    const tick35 = trackEnemyInactivity(players, 'ORDER', 335, [], initial.states)
    expect(tick35.alerts).toHaveLength(1)

    // Player kills a minion at t = 340 (CS increases)
    const midPlayer = players.find((p) => p.team === 'CHAOS' && p.position === 'MIDDLE')
    if (midPlayer) {
      midPlayer.scores.creepScore += 1
    }

    const tickSeen = trackEnemyInactivity(players, 'ORDER', 340, [], tick35.states)
    const midSeen = Array.from(tickSeen.states.values()).find((s) => s.position === 'MIDDLE')
    expect(midSeen?.isMissing).toBe(false)
    expect(midSeen?.alertTriggered).toBe(false)
    expect(midSeen?.lastSeenGameTime).toBe(340)
  })

  it('does not flag dead enemy players as MIA', () => {
    const players = getPlayers()
    const midPlayer = players.find((p) => p.team === 'CHAOS' && p.position === 'MIDDLE')
    if (midPlayer) {
      midPlayer.isDead = true
    }

    const initial = trackEnemyInactivity(players, 'ORDER', 300, [], null)
    // 50 seconds pass while dead
    const tick50 = trackEnemyInactivity(players, 'ORDER', 350, [], initial.states)

    expect(tick50.alerts).toHaveLength(0)
    const midState = Array.from(tick50.states.values()).find((s) => s.position === 'MIDDLE')
    expect(midState?.isMissing).toBe(false)
  })
})
