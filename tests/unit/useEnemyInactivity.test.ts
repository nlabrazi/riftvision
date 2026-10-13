import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { useEnemyInactivity } from '../../app/composables/useEnemyInactivity'
import { useFlashAlerts } from '../../app/composables/useFlashAlerts'
import type { RiotAllGameData } from '../../shared/types/riot'
import { mockGameData } from '../../server/data/mockGame'

describe('useEnemyInactivity', () => {
  beforeEach(() => {
    const { clearAlerts } = useFlashAlerts()
    clearAlerts()
  })

  it('tracks enemy jungler inactivity and triggers beware alerts when threshold is reached, revoking on activity', async () => {
    const { activeAlert, alertQueue, clearAlerts } = useFlashAlerts()
    const gameDataRef = ref<RiotAllGameData | null>(structuredClone(mockGameData))

    if (gameDataRef.value?.gameData) {
      // Early game (gameTime = 100s) -> jungler threshold is 60s
      gameDataRef.value.gameData.gameTime = 100
      if (gameDataRef.value.events) {
        gameDataRef.value.events.Events = []
      }
    }

    const { miaStates } = useEnemyInactivity(gameDataRef)
    await nextTick()

    // Initially at gameTime 100, inactivity is 0 or within threshold
    expect(miaStates.value).toBeDefined()
    expect(activeAlert.value).toBeNull()

    // Advance time by 65s (gameTime = 165s) without jungler activity -> crosses 60s threshold!
    const current = gameDataRef.value
    if (!current?.gameData) throw new Error('gameData missing')
    gameDataRef.value = {
      ...current,
      gameData: {
        ...current.gameData,
        gameTime: 165,
      },
    }
    await nextTick()

    // Should alert with beware sound for missing jungler
    expect(activeAlert.value).not.toBeNull()
    expect(activeAlert.value?.type).toBe('MIA')
    expect(activeAlert.value?.soundKey).toBe('beware')
    expect(activeAlert.value?.title).toContain('JUNGLER ADVERSE DISPARU')

    // Now simulate jungler showing activity (gaining CS) at gameTime = 168
    const activeUpdate = gameDataRef.value
    if (!activeUpdate?.gameData) throw new Error('gameData missing')
    gameDataRef.value = {
      ...activeUpdate,
      allPlayers: activeUpdate.allPlayers.map((p) =>
        p.position === 'JUNGLE'
          ? { ...p, scores: { ...p.scores, creepScore: p.scores.creepScore + 4 } }
          : p,
      ),
      gameData: {
        ...activeUpdate.gameData,
        gameTime: 168,
      },
    }
    await nextTick()

    // Both activeAlert and alertQueue for MIA jungler must be immediately revoked!
    expect(activeAlert.value).toBeNull()
    expect(alertQueue.value).toHaveLength(0)

    clearAlerts()
  })

  it('tracks laner post-respawn absence and revokes alert immediately when laner returns to lane', async () => {
    const { activeAlert, alertQueue, clearAlerts } = useFlashAlerts()
    const gameDataRef = ref<RiotAllGameData | null>(structuredClone(mockGameData))

    // Step 1: Enemy midlaner is dead at t = 200
    if (gameDataRef.value?.gameData) {
      gameDataRef.value.gameData.gameTime = 200
      gameDataRef.value.allPlayers = gameDataRef.value.allPlayers.map((p) => {
        if (p.team === 'CHAOS' && p.position === 'MIDDLE') {
          return { ...p, isDead: true, respawnTimer: 10 }
        }
        return p
      })
    }

    useEnemyInactivity(gameDataRef)
    await nextTick()
    expect(activeAlert.value).toBeNull()

    // Step 2: Midlaner respawns at t = 210
    const d2 = gameDataRef.value
    if (!d2) throw new Error('gameData missing')
    gameDataRef.value = {
      ...d2,
      gameData: { ...d2.gameData, gameTime: 210 },
      allPlayers: d2.allPlayers.map((p) => {
        if (p.team === 'CHAOS' && p.position === 'MIDDLE') {
          return { ...p, isDead: false, respawnTimer: 0 }
        }
        return p
      }),
    }
    await nextTick()
    expect(activeAlert.value).toBeNull()

    // Step 3: 26s after respawn (t = 236) -> Midlaner exceeded 25s walking threshold -> MIA alert!
    const d3 = gameDataRef.value
    if (!d3) throw new Error('gameData missing')
    gameDataRef.value = {
      ...d3,
      gameData: { ...d3.gameData, gameTime: 236 },
    }
    await nextTick()

    expect(activeAlert.value).not.toBeNull()
    expect(activeAlert.value?.type).toBe('MIA')
    expect(activeAlert.value?.soundKey).toBe('beware')
    expect(activeAlert.value?.title).toContain('MIDLANER ADVERSE NON REVENU EN LANE')

    // Step 4: Midlaner gets a CS in lane at t = 238 -> alert revoked immediately!
    const d4 = gameDataRef.value
    if (!d4) throw new Error('gameData missing')
    gameDataRef.value = {
      ...d4,
      gameData: { ...d4.gameData, gameTime: 238 },
      allPlayers: d4.allPlayers.map((p) => {
        if (p.team === 'CHAOS' && p.position === 'MIDDLE') {
          return { ...p, scores: { ...p.scores, creepScore: p.scores.creepScore + 10 } }
        }
        return p
      }),
    }
    await nextTick()

    expect(activeAlert.value).toBeNull()
    expect(alertQueue.value).toHaveLength(0)

    clearAlerts()
  })
})
