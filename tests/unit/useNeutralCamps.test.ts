import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { useFlashAlerts } from '../../app/composables/useFlashAlerts'
import { useNeutralCamps } from '../../app/composables/useNeutralCamps'
import type { RiotAllGameData } from '../../shared/types/riot'
import { mockGameData } from '../../server/data/mockGame'

describe('useNeutralCamps', () => {
  beforeEach(() => {
    const { clearAlerts } = useFlashAlerts()
    clearAlerts()
  })

  it('calculates camp timers and triggers flash alerts for imminent epic camp spawns', async () => {
    const { activeAlert, clearAlerts } = useFlashAlerts()
    const gameDataRef = ref<RiotAllGameData | null>(structuredClone(mockGameData))

    if (gameDataRef.value?.gameData) {
      // 230 seconds = 70s before Dragon/Voidgrub spawn at 300s
      gameDataRef.value.gameData.gameTime = 230
      if (gameDataRef.value.events) {
        gameDataRef.value.events.Events = []
      }
    }

    const { dragonCamp, baronCamp } = useNeutralCamps(gameDataRef)
    await nextTick()

    expect(dragonCamp.value?.id).toBe('DRAGON')
    expect(dragonCamp.value?.status).toBe('SPAWNING')
    expect(baronCamp.value?.id).toBe('BARON')

    // Advance time to 241s (59s remaining before spawn, crossing the 60s threshold)
    if (gameDataRef.value?.gameData) {
      gameDataRef.value.gameData.gameTime = 241
    }
    await nextTick()

    expect(activeAlert.value).not.toBeNull()
    expect(activeAlert.value?.type).toBe('CAMP')
    expect(activeAlert.value?.title).toContain('DRAGON')
    expect(activeAlert.value?.soundKey).toBe('deathwing')
    clearAlerts()
  })
})
