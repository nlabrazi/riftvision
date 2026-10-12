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

  it('tracks enemy inactivity and triggers beware alerts when thresholds are reached', async () => {
    const { activeAlert, clearAlerts } = useFlashAlerts()
    const gameDataRef = ref<RiotAllGameData | null>(structuredClone(mockGameData))

    if (gameDataRef.value?.gameData) {
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

    // Advance time by 40s (gameTime = 140s) without enemy midlaner activity -> crosses 30s threshold!
    const current = gameDataRef.value
    if (!current?.gameData) throw new Error('gameData missing')
    gameDataRef.value = {
      ...current,
      gameData: {
        ...current.gameData,
        gameTime: 140,
      },
    }
    await nextTick()

    // Should alert with beware sound for missing enemy
    expect(activeAlert.value).not.toBeNull()
    expect(activeAlert.value?.type).toBe('MIA')
    expect(activeAlert.value?.soundKey).toBe('beware')
    expect(activeAlert.value?.title).toContain('DISPARU')

    clearAlerts()
  })
})
