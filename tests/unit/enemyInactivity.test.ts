import { describe, expect, it } from 'vitest'
import { mockGameData } from '../../server/data/mockGame'
import type { RiotPlayer } from '../../shared/types/riot'
import { trackEnemyInactivity } from '../../shared/utils/enemyInactivity'

describe('enemyInactivity tracker', () => {
  const getPlayers = (): RiotPlayer[] => JSON.parse(JSON.stringify(mockGameData.allPlayers))

  it('initializes state on first snapshot for all 5 roles without firing alerts', () => {
    const players = getPlayers()
    const result = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    expect(result.alerts).toHaveLength(0)
    // All 5 roles from CHAOS team should be tracked
    const toplaner = Array.from(result.states.values()).find((s) => s.position === 'TOP')
    const jungler = Array.from(result.states.values()).find((s) => s.position === 'JUNGLE')
    const midlaner = Array.from(result.states.values()).find((s) => s.position === 'MIDDLE')
    const adc = Array.from(result.states.values()).find((s) => s.position === 'BOTTOM')
    const support = Array.from(result.states.values()).find((s) => s.position === 'UTILITY')

    expect(toplaner).toBeDefined()
    expect(toplaner?.roleLabel).toBe('Toplaner')
    expect(toplaner?.thresholdSeconds).toBe(30)
    expect(toplaner?.isMissing).toBe(false)

    expect(jungler).toBeDefined()
    expect(jungler?.roleLabel).toBe('Jungler')
    expect(jungler?.thresholdSeconds).toBe(60)
    expect(jungler?.isMissing).toBe(false)

    expect(midlaner).toBeDefined()
    expect(midlaner?.roleLabel).toBe('Midlaner')
    expect(midlaner?.thresholdSeconds).toBe(30)
    expect(midlaner?.isMissing).toBe(false)

    expect(adc).toBeDefined()
    expect(adc?.roleLabel).toBe('ADC')
    expect(adc?.thresholdSeconds).toBe(30)
    expect(adc?.isMissing).toBe(false)

    expect(support).toBeDefined()
    expect(support?.roleLabel).toBe('Support')
    expect(support?.thresholdSeconds).toBe(30)
    expect(support?.isMissing).toBe(false)
  })

  it('triggers MIA alert with beware sound for all lane roles (Top, Mid, ADC, Support) at 30 seconds', () => {
    const players = getPlayers()
    for (const p of players) {
      p.isDead = false
      p.respawnTimer = 0
    }
    // Initial snapshot at t = 300
    const initial = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    // Tick at t = 320 (20s elapsed -> none missing yet)
    const tick20 = trackEnemyInactivity(players, 'ORDER', 320, [], initial.states)
    expect(tick20.alerts).toHaveLength(0)

    // Tick at t = 331 (31s elapsed -> all 30s laners cross threshold, jungler at 60s does not)
    const tick31 = trackEnemyInactivity(players, 'ORDER', 331, [], tick20.states)
    const midAlert = tick31.alerts.find((a) => a.role === 'MIDDLE')
    const topAlert = tick31.alerts.find((a) => a.role === 'TOP')
    const adcAlert = tick31.alerts.find((a) => a.role === 'BOTTOM')
    const supAlert = tick31.alerts.find((a) => a.role === 'UTILITY')
    const jungleAlert = tick31.alerts.find((a) => a.role === 'JUNGLE')

    expect(midAlert).toBeDefined()
    expect(midAlert?.soundKey).toBe('beware')
    expect(midAlert?.title).toContain('MIDLANER ADVERSE DISPARU')
    expect(midAlert?.subtitle).toContain('a disparu depuis 31s')

    expect(topAlert).toBeDefined()
    expect(topAlert?.soundKey).toBe('beware')
    expect(topAlert?.title).toContain('TOPLANER ADVERSE DISPARU')

    expect(adcAlert).toBeDefined()
    expect(adcAlert?.soundKey).toBe('beware')
    expect(adcAlert?.title).toContain('ADC ADVERSE DISPARU')

    expect(supAlert).toBeDefined()
    expect(supAlert?.soundKey).toBe('beware')
    expect(supAlert?.title).toContain('SUPPORT ADVERSE DISPARU')

    // Jungler threshold is 60s so not triggered at 31s
    expect(jungleAlert).toBeUndefined()

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

    // Tick at t = 450 (50s elapsed -> laners triggered at 30s, jungler not yet at 50s)
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

  it('resets inactivity timer and disarms alert when enemy player gains CS, level, or items', () => {
    const players = getPlayers()
    const initial = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    // Advance to 335s (midlaner becomes missing)
    const tick35 = trackEnemyInactivity(players, 'ORDER', 335, [], initial.states)
    const mid35 = Array.from(tick35.states.values()).find((s) => s.position === 'MIDDLE')
    expect(mid35?.isMissing).toBe(true)

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

  it('does not flag dead enemy players as MIA, handles respawn timer, and restarts timer fresh on respawn', () => {
    const players = getPlayers()
    const midPlayer = players.find((p) => p.team === 'CHAOS' && p.position === 'MIDDLE')
    if (!midPlayer) throw new Error('midPlayer missing')

    // Player dies at t = 300 with 25s respawn timer
    midPlayer.isDead = true
    midPlayer.respawnTimer = 25

    const initial = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    // While dead at t = 320 (20s passed, 5s respawn left)
    midPlayer.respawnTimer = 5
    const tickDead = trackEnemyInactivity(players, 'ORDER', 320, [], initial.states)
    const midDead = Array.from(tickDead.states.values()).find((s) => s.position === 'MIDDLE')
    expect(midDead?.isMissing).toBe(false)
    expect(midDead?.isDead).toBe(true)
    expect(midDead?.respawnTimer).toBe(5)
    expect(midDead?.inactivitySeconds).toBe(0)

    // Player respawns at t = 325 (isDead = false, respawnTimer = 0)
    midPlayer.isDead = false
    midPlayer.respawnTimer = 0
    const tickRespawn = trackEnemyInactivity(players, 'ORDER', 325, [], tickDead.states)
    const midRespawn = Array.from(tickRespawn.states.values()).find((s) => s.position === 'MIDDLE')
    expect(midRespawn?.isDead).toBe(false)
    expect(midRespawn?.isMissing).toBe(false)
    expect(midRespawn?.lastSeenGameTime).toBe(325)
    expect(midRespawn?.inactivitySeconds).toBe(0)

    // 20 seconds after respawning (t = 345) -> still within 30s threshold, NOT missing
    const tick20AfterRespawn = trackEnemyInactivity(players, 'ORDER', 345, [], tickRespawn.states)
    const mid20 = Array.from(tick20AfterRespawn.states.values()).find(
      (s) => s.position === 'MIDDLE',
    )
    expect(mid20?.isMissing).toBe(false)
    expect(mid20?.inactivitySeconds).toBe(20)

    // 31 seconds after respawning (t = 356) -> crossed 30s threshold -> NOW MIA!
    const tickMIA = trackEnemyInactivity(players, 'ORDER', 356, [], tick20AfterRespawn.states)
    const midMIA = Array.from(tickMIA.states.values()).find((s) => s.position === 'MIDDLE')
    expect(midMIA?.isMissing).toBe(true)
    expect(tickMIA.alerts.some((a) => a.role === 'MIDDLE')).toBe(true)
  })
})
