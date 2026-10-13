import { describe, expect, it } from 'vitest'
import { mockGameData } from '../../server/data/mockGame'
import type { RiotPlayer } from '../../shared/types/riot'
import {
  getJunglerThreshold,
  getLanerWalkingThreshold,
  trackEnemyInactivity,
} from '../../shared/utils/enemyInactivity'

describe('enemyInactivity tracker', () => {
  const getPlayers = (): RiotPlayer[] => JSON.parse(JSON.stringify(mockGameData.allPlayers))

  it('initializes state on first snapshot for all 5 roles without firing alerts', () => {
    const players = getPlayers()
    // Game time 200 (< 5 min / 300s): jungler threshold 60s, midlaner 25s, other lanes 30s
    const resultEarly = trackEnemyInactivity(players, 'ORDER', 200, [], null)

    expect(resultEarly.alerts).toHaveLength(0)
    const toplaner = Array.from(resultEarly.states.values()).find((s) => s.position === 'TOP')
    const jungler = Array.from(resultEarly.states.values()).find((s) => s.position === 'JUNGLE')
    const midlaner = Array.from(resultEarly.states.values()).find((s) => s.position === 'MIDDLE')
    const adc = Array.from(resultEarly.states.values()).find((s) => s.position === 'BOTTOM')
    const support = Array.from(resultEarly.states.values()).find((s) => s.position === 'UTILITY')

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
    expect(midlaner?.thresholdSeconds).toBe(25)
    expect(midlaner?.isMissing).toBe(false)

    expect(adc).toBeDefined()
    expect(adc?.roleLabel).toBe('ADC')
    expect(adc?.thresholdSeconds).toBe(30)
    expect(adc?.isMissing).toBe(false)

    expect(support).toBeDefined()
    expect(support?.roleLabel).toBe('Support')
    expect(support?.thresholdSeconds).toBe(30)
    expect(support?.isMissing).toBe(false)

    // After 5 minutes (gameTime >= 300s), jungler threshold becomes 30s
    const resultLater = trackEnemyInactivity(players, 'ORDER', 350, [], null)
    const junglerLater = Array.from(resultLater.states.values()).find(
      (s) => s.position === 'JUNGLE',
    )
    expect(junglerLater?.thresholdSeconds).toBe(30)
  })

  it('verifies helper thresholds for lanes and jungler', () => {
    expect(getLanerWalkingThreshold('MIDDLE')).toBe(25)
    expect(getLanerWalkingThreshold('TOP')).toBe(30)
    expect(getLanerWalkingThreshold('BOTTOM')).toBe(30)
    expect(getLanerWalkingThreshold('UTILITY')).toBe(30)

    expect(getJunglerThreshold(100)).toBe(60)
    expect(getJunglerThreshold(299)).toBe(60)
    expect(getJunglerThreshold(300)).toBe(30)
    expect(getJunglerThreshold(600)).toBe(30)
  })

  it('laners in normal play do not trigger false positive MIA alerts simply by farming without CS change', () => {
    const players = getPlayers()
    for (const p of players) {
      p.isDead = false
      p.respawnTimer = 0
    }
    // Initial snapshot at t = 300
    const initial = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    // Tick at t = 340 (40s elapsed with no CS changes because API rounds CS)
    const tick40 = trackEnemyInactivity(players, 'ORDER', 340, [], initial.states)

    // Laners should NOT be marked missing because they have not died and are still laning
    const midState = Array.from(tick40.states.values()).find((s) => s.position === 'MIDDLE')
    const topState = Array.from(tick40.states.values()).find((s) => s.position === 'TOP')
    const adcState = Array.from(tick40.states.values()).find((s) => s.position === 'BOTTOM')
    const supState = Array.from(tick40.states.values()).find((s) => s.position === 'UTILITY')

    expect(midState?.isMissing).toBe(false)
    expect(topState?.isMissing).toBe(false)
    expect(adcState?.isMissing).toBe(false)
    expect(supState?.isMissing).toBe(false)

    const lanerAlerts = tick40.alerts.filter((a) => a.role !== 'JUNGLE')
    expect(lanerAlerts).toHaveLength(0)
  })

  it('triggers MIA alert with beware sound post-respawn if laner does not return to lane within walking threshold', () => {
    const players = getPlayers()
    const midPlayer = players.find((p) => p.team === 'CHAOS' && p.position === 'MIDDLE')
    const topPlayer = players.find((p) => p.team === 'CHAOS' && p.position === 'TOP')
    if (!midPlayer || !topPlayer) throw new Error('Players missing')

    // 1. Laners are dead at t = 200
    midPlayer.isDead = true
    midPlayer.respawnTimer = 15
    topPlayer.isDead = true
    topPlayer.respawnTimer = 15

    const tickDead = trackEnemyInactivity(players, 'ORDER', 200, [], null)
    expect(tickDead.alerts).toHaveLength(0)

    // 2. Laners respawn at t = 215 (isDead = false, respawnTimer = 0)
    midPlayer.isDead = false
    midPlayer.respawnTimer = 0
    topPlayer.isDead = false
    topPlayer.respawnTimer = 0

    const tickRespawn = trackEnemyInactivity(players, 'ORDER', 215, [], tickDead.states)
    const midAfterRespawn = Array.from(tickRespawn.states.values()).find(
      (s) => s.position === 'MIDDLE',
    )
    const topAfterRespawn = Array.from(tickRespawn.states.values()).find(
      (s) => s.position === 'TOP',
    )

    expect(midAfterRespawn?.waitingForReturnToLane).toBe(true)
    expect(midAfterRespawn?.isMissing).toBe(false)
    expect(topAfterRespawn?.waitingForReturnToLane).toBe(true)
    expect(topAfterRespawn?.isMissing).toBe(false)

    // 3. At t = 235 (20s post-respawn) -> within walking threshold (Mid: 25s, Top: 30s) -> no alerts yet
    const tick20 = trackEnemyInactivity(players, 'ORDER', 235, [], tickRespawn.states)
    expect(tick20.alerts.filter((a) => a.role === 'MIDDLE' || a.role === 'TOP')).toHaveLength(0)

    // 4. At t = 241 (26s post-respawn) -> Mid crosses 25s threshold -> alerts! Top at 26s (< 30s) does not alert yet
    const tick26 = trackEnemyInactivity(players, 'ORDER', 241, [], tick20.states)
    const midAlert = tick26.alerts.find((a) => a.role === 'MIDDLE')
    const topAlertAt26 = tick26.alerts.find((a) => a.role === 'TOP')

    expect(midAlert).toBeDefined()
    expect(midAlert?.soundKey).toBe('beware')
    expect(midAlert?.title).toContain('MIDLANER ADVERSE NON REVENU EN LANE')
    expect(midAlert?.subtitle).toContain("n'est pas revenu sur sa voie")
    expect(topAlertAt26).toBeUndefined()

    // 5. At t = 246 (31s post-respawn) -> Top crosses 30s threshold -> alerts!
    const tick31 = trackEnemyInactivity(players, 'ORDER', 246, [], tick26.states)
    const topAlertAt31 = tick31.alerts.find((a) => a.role === 'TOP')
    expect(topAlertAt31).toBeDefined()
    expect(topAlertAt31?.soundKey).toBe('beware')
    expect(topAlertAt31?.title).toContain('TOPLANER ADVERSE NON REVENU EN LANE')

    // Mid should NOT duplicate/spam alert on subsequent tick
    const midDuplicateAlert = tick31.alerts.find((a) => a.role === 'MIDDLE')
    expect(midDuplicateAlert).toBeUndefined()
  })

  it('clears return-to-lane state without alerting when laner shows activity in lane before walking threshold expires', () => {
    const players = getPlayers()
    const midPlayer = players.find((p) => p.team === 'CHAOS' && p.position === 'MIDDLE')
    if (!midPlayer) throw new Error('midPlayer missing')

    // 1. Dead at t = 200
    midPlayer.isDead = true
    midPlayer.respawnTimer = 10
    const tickDead = trackEnemyInactivity(players, 'ORDER', 200, [], null)

    // 2. Respawn at t = 210
    midPlayer.isDead = false
    midPlayer.respawnTimer = 0
    const tickRespawn = trackEnemyInactivity(players, 'ORDER', 210, [], tickDead.states)

    // 3. At t = 225 (15s post-respawn < 25s), midlaner gets a CS in lane
    midPlayer.scores.creepScore += 10
    const tickSeen = trackEnemyInactivity(players, 'ORDER', 225, [], tickRespawn.states)
    const midSeen = Array.from(tickSeen.states.values()).find((s) => s.position === 'MIDDLE')

    expect(midSeen?.waitingForReturnToLane).toBe(false)
    expect(midSeen?.isMissing).toBe(false)
    expect(tickSeen.alerts).toHaveLength(0)

    // 4. At t = 245 (35s post-respawn), still no alert because they returned to lane
    const tickLater = trackEnemyInactivity(players, 'ORDER', 245, [], tickSeen.states)
    const midLaterAlert = tickLater.alerts.find((a) => a.role === 'MIDDLE')
    expect(midLaterAlert).toBeUndefined()
  })

  it('triggers periodic MIA alerts with beware sound for jungler (every 60s early game, every 30s late game)', () => {
    const players = getPlayers()

    // --- EARLY GAME (< 300s): Threshold is 60s ---
    const initialEarly = trackEnemyInactivity(players, 'ORDER', 100, [], null)

    // At t = 150 (50s elapsed < 60s) -> no alert
    const tick50 = trackEnemyInactivity(players, 'ORDER', 150, [], initialEarly.states)
    const j50 = Array.from(tick50.states.values()).find((s) => s.position === 'JUNGLE')
    expect(j50?.isMissing).toBe(false)
    expect(tick50.alerts).toHaveLength(0)

    // At t = 162 (62s elapsed >= 60s) -> first jungler alert!
    const tick62 = trackEnemyInactivity(players, 'ORDER', 162, [], tick50.states)
    const jungleAlert1 = tick62.alerts.find((a) => a.role === 'JUNGLE')
    expect(jungleAlert1).toBeDefined()
    expect(jungleAlert1?.soundKey).toBe('beware')
    expect(jungleAlert1?.title).toContain('JUNGLER ADVERSE DISPARU')
    expect(jungleAlert1?.subtitle).toContain('1 min')

    // At t = 190 (28s after alert1) -> under 60s repeat interval -> no duplicate
    const tick90 = trackEnemyInactivity(players, 'ORDER', 190, [], tick62.states)
    expect(tick90.alerts.find((a) => a.role === 'JUNGLE')).toBeUndefined()

    // At t = 223 (61s after alert1) -> periodic second alert triggers!
    const tickRepeat = trackEnemyInactivity(players, 'ORDER', 223, [], tick90.states)
    const jungleAlert2 = tickRepeat.alerts.find((a) => a.role === 'JUNGLE')
    expect(jungleAlert2).toBeDefined()
    expect(jungleAlert2?.soundKey).toBe('beware')

    // --- MID/LATE GAME (>= 300s): Threshold is 30s ---
    const initialLate = trackEnemyInactivity(players, 'ORDER', 400, [], null)
    // At t = 431 (31s elapsed >= 30s) -> 30s alert in late game!
    const tickLate31 = trackEnemyInactivity(players, 'ORDER', 431, [], initialLate.states)
    const jungleLateAlert = tickLate31.alerts.find((a) => a.role === 'JUNGLE')
    expect(jungleLateAlert).toBeDefined()
    expect(jungleLateAlert?.soundKey).toBe('beware')
  })

  it('resets inactivity timer and disarms jungler alert when jungler shows activity', () => {
    const players = getPlayers()
    const initial = trackEnemyInactivity(players, 'ORDER', 400, [], null)

    // Advance to 435s (jungler missing)
    const tick35 = trackEnemyInactivity(players, 'ORDER', 435, [], initial.states)
    const j35 = Array.from(tick35.states.values()).find((s) => s.position === 'JUNGLE')
    expect(j35?.isMissing).toBe(true)

    // Jungler kills a camp or buys an item at t = 440
    const junglerPlayer = players.find((p) => p.team === 'CHAOS' && p.position === 'JUNGLE')
    if (junglerPlayer) {
      junglerPlayer.scores.creepScore += 4
    }

    const tickSeen = trackEnemyInactivity(players, 'ORDER', 440, [], tick35.states)
    const jSeen = Array.from(tickSeen.states.values()).find((s) => s.position === 'JUNGLE')
    expect(jSeen?.isMissing).toBe(false)
    expect(jSeen?.alertTriggered).toBe(false)
    expect(jSeen?.lastSeenGameTime).toBe(440)
  })

  it('does not flag dead enemy players as MIA and handles respawn timer', () => {
    const players = getPlayers()
    const junglerPlayer = players.find((p) => p.team === 'CHAOS' && p.position === 'JUNGLE')
    if (!junglerPlayer) throw new Error('junglerPlayer missing')

    // Jungler dies at t = 300 with 25s respawn timer
    junglerPlayer.isDead = true
    junglerPlayer.respawnTimer = 25

    const initial = trackEnemyInactivity(players, 'ORDER', 300, [], null)

    // While dead at t = 320 (20s passed, 5s respawn left)
    junglerPlayer.respawnTimer = 5
    const tickDead = trackEnemyInactivity(players, 'ORDER', 320, [], initial.states)
    const jDead = Array.from(tickDead.states.values()).find((s) => s.position === 'JUNGLE')
    expect(jDead?.isMissing).toBe(false)
    expect(jDead?.isDead).toBe(true)
    expect(jDead?.respawnTimer).toBe(5)
    expect(jDead?.inactivitySeconds).toBe(0)

    // Jungler respawns at t = 325 (isDead = false, respawnTimer = 0)
    junglerPlayer.isDead = false
    junglerPlayer.respawnTimer = 0
    const tickRespawn = trackEnemyInactivity(players, 'ORDER', 325, [], tickDead.states)
    const jRespawn = Array.from(tickRespawn.states.values()).find((s) => s.position === 'JUNGLE')
    expect(jRespawn?.isDead).toBe(false)
    expect(jRespawn?.isMissing).toBe(false)
    expect(jRespawn?.lastSeenGameTime).toBe(325)
    expect(jRespawn?.inactivitySeconds).toBe(0)
  })
})
