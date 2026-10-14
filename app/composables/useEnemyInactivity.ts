import { computed, ref, watch } from 'vue'
import type { RiotAllGameData, TeamType } from '#shared/types/riot'
import { getChampionIconUrl } from '#shared/utils/ddragon'
import { type EnemyMIAState, trackEnemyInactivity } from '#shared/utils/enemyInactivity'
import { identifyActivePlayer } from '#shared/utils/gameDiff'
import { useFlashAlerts } from './useFlashAlerts'

export function useEnemyInactivity(gameDataRef: { value: RiotAllGameData | null }) {
  const { triggerAlert, revokeMIAAlert } = useFlashAlerts()

  const miaStates = ref<Map<string, EnemyMIAState>>(new Map())
  let previousGameTime = 0

  const activePlayerTeam = computed<TeamType>(() => {
    const data = gameDataRef.value
    if (!data) return 'ORDER'
    const matched = identifyActivePlayer(data.allPlayers, data.activePlayer)
    return matched?.team || 'ORDER'
  })

  watch(
    () => gameDataRef.value,
    (data) => {
      if (!data) {
        miaStates.value = new Map()
        previousGameTime = 0
        return
      }

      const gameTime = data.gameData?.gameTime ?? 0
      const allPlayers = data.allPlayers || []
      const events = data.events?.Events || []

      // If game restarted or rewound, clear previous states
      let prevStates = miaStates.value
      if (gameTime < previousGameTime || !prevStates.size) {
        prevStates = new Map()
      }

      const result = trackEnemyInactivity(
        allPlayers,
        activePlayerTeam.value,
        gameTime,
        events,
        prevStates.size ? prevStates : null,
      )

      miaStates.value = result.states
      previousGameTime = gameTime

      // Immediately revoke any queued or active MIA alert for enemies who have reappeared or died
      for (const state of result.states.values()) {
        if (!state.isMissing || state.isDead) {
          revokeMIAAlert(state.championName)
        }
      }

      // Trigger alerts with beware.wav
      for (const alert of result.alerts) {
        triggerAlert({
          id: alert.id,
          type: 'MIA',
          title: alert.title,
          subtitle: alert.subtitle,
          team: alert.team,
          actorName: alert.championName,
          iconUrl: getChampionIconUrl(alert.championName),
          soundKey: alert.soundKey, // 'beware'
          durationMs: 5000,
        })
      }
    },
    { deep: true, immediate: true },
  )

  const trackedEnemies = computed<EnemyMIAState[]>(() => Array.from(miaStates.value.values()))

  const missingEnemies = computed<EnemyMIAState[]>(() =>
    trackedEnemies.value.filter((e) => e.isMissing),
  )

  const enemyToplaner = computed<EnemyMIAState | undefined>(() =>
    trackedEnemies.value.find((e) => e.position === 'TOP'),
  )

  const enemyJungler = computed<EnemyMIAState | undefined>(() =>
    trackedEnemies.value.find((e) => e.position === 'JUNGLE'),
  )

  const enemyMidlaner = computed<EnemyMIAState | undefined>(() =>
    trackedEnemies.value.find((e) => e.position === 'MIDDLE'),
  )

  const enemyADC = computed<EnemyMIAState | undefined>(() =>
    trackedEnemies.value.find((e) => e.position === 'BOTTOM'),
  )

  const enemySupport = computed<EnemyMIAState | undefined>(() =>
    trackedEnemies.value.find((e) => e.position === 'UTILITY'),
  )

  return {
    miaStates,
    trackedEnemies,
    missingEnemies,
    enemyToplaner,
    enemyJungler,
    enemyMidlaner,
    enemyADC,
    enemySupport,
  }
}
