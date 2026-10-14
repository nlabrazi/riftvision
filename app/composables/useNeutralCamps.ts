import { computed, watch } from 'vue'
import type { RiotAllGameData } from '#shared/types/riot'
import { calculateCampTimers, detectCampAlerts, type NeutralCamp } from '#shared/utils/campTimers'
import { getObjectiveIconUrl } from '#shared/utils/ddragon'
import { useFlashAlerts } from './useFlashAlerts'

export function useNeutralCamps(gameDataRef: { value: RiotAllGameData | null }) {
  const { triggerAlert } = useFlashAlerts()

  const gameTime = computed(() => gameDataRef.value?.gameData?.gameTime ?? 0)
  const events = computed(() => gameDataRef.value?.events?.Events ?? [])
  const players = computed(() => gameDataRef.value?.allPlayers ?? [])

  const camps = computed<NeutralCamp[]>(() =>
    calculateCampTimers(gameTime.value, events.value, players.value),
  )

  let previousCamps: NeutralCamp[] | null = null
  let previousGameTime: number | null = null

  watch(
    [gameTime, () => events.value.length],
    () => {
      if (!gameDataRef.value) {
        previousCamps = null
        previousGameTime = null
        return
      }

      const currentCamps = camps.value

      // If establishing initial baseline or resetting or time jump > 15s (connection to existing match or pause/resume)
      if (
        previousCamps === null ||
        previousGameTime === null ||
        gameTime.value < previousGameTime ||
        gameTime.value - previousGameTime > 15
      ) {
        previousCamps = currentCamps
        previousGameTime = gameTime.value
        return
      }

      const alerts = detectCampAlerts(previousCamps, currentCamps, gameTime.value)
      for (const alert of alerts) {
        const iconType =
          alert.campId === 'DRAGON' ? 'dragon' : alert.campId === 'BARON' ? 'baron' : 'herald'
        triggerAlert({
          id: alert.id,
          type: 'CAMP',
          title: alert.title,
          subtitle: alert.subtitle,
          durationMs: 4500,
          soundKey: alert.soundKey,
          soundType: 'objective',
          iconUrl: getObjectiveIconUrl(iconType, 'ORDER'),
        })
      }

      previousCamps = currentCamps
      previousGameTime = gameTime.value
    },
    { immediate: true },
  )

  const dragonCamp = computed(() => camps.value.find((c) => c.id === 'DRAGON'))
  const baronCamp = computed(() => camps.value.find((c) => c.id === 'BARON'))
  const heraldCamp = computed(() => camps.value.find((c) => c.id === 'HERALD'))
  const grubsCamp = computed(() => camps.value.find((c) => c.id === 'VOIDGRUBS'))

  return {
    camps,
    dragonCamp,
    baronCamp,
    heraldCamp,
    grubsCamp,
  }
}
