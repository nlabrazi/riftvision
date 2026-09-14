import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { GameDiffEvent, TeamEconomySummary } from '#shared/types/diff'
import type { RiotAllGameData, RiotEvent, RiotStatusResponse } from '#shared/types/riot'
import { computeGameDiff } from '#shared/utils/gameDiff'

export function useRiotLive() {
  const clientMockMode = ref(false)
  const status = ref<RiotStatusResponse>({
    status: 'DISCONNECTED',
    isMock: false,
  })
  const gameData = ref<RiotAllGameData | null>(null)
  const previousGameData = ref<RiotAllGameData | null>(null)
  const events = ref<RiotEvent[]>([])
  const allDiffEvents = ref<GameDiffEvent[]>([])

  const blueEconomy = ref<TeamEconomySummary>({
    totalItemGold: 0,
    killCount: 0,
    deathCount: 0,
    turretCount: 0,
    dragonCount: 0,
    baronCount: 0,
  })

  const redEconomy = ref<TeamEconomySummary>({
    totalItemGold: 0,
    killCount: 0,
    deathCount: 0,
    turretCount: 0,
    dragonCount: 0,
    baronCount: 0,
  })

  const goldDifference = ref(0)
  const isLoading = ref(false)
  const isPolling = ref(true)
  const lastError = ref<string | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null
  let statusSeq = 0
  let liveDataSeq = 0

  async function fetchStatus() {
    const seq = ++statusSeq
    try {
      const url = clientMockMode.value ? '/api/riot/status?mock=true' : '/api/riot/status'
      const res = await $fetch<RiotStatusResponse & { globalMockEnabled: boolean }>(url)
      if (seq !== statusSeq) return status.value
      status.value = res
      lastError.value = res.error || null
      return res
    } catch (err) {
      if (seq !== statusSeq) return status.value
      lastError.value = (err as Error).message
      status.value = {
        status: clientMockMode.value ? 'MOCK' : 'DISCONNECTED',
        isMock: clientMockMode.value,
        error: (err as Error).message,
      }
      return status.value
    }
  }

  async function fetchLiveData() {
    const isMockActive = clientMockMode.value || status.value.isMock
    if (status.value.status === 'DISCONNECTED' && !isMockActive) {
      return
    }

    const seq = ++liveDataSeq
    try {
      isLoading.value = true
      const url = isMockActive ? '/api/riot/live?mock=true' : '/api/riot/live'
      const res = await $fetch<{ success: boolean; data: RiotAllGameData }>(url)
      if (seq !== liveDataSeq) return
      if (res?.success && res.data) {
        const diff = computeGameDiff(previousGameData.value, res.data)
        blueEconomy.value = diff.blueEconomy
        redEconomy.value = diff.redEconomy
        goldDifference.value = diff.goldDifference

        if (diff.newEvents.length > 0) {
          // Prepend new events, avoiding duplicate ids, and cap at 100
          const existingIds = new Set(allDiffEvents.value.map((e) => e.id))
          const freshEvents = diff.newEvents.filter((e) => !existingIds.has(e.id))
          allDiffEvents.value = [...freshEvents, ...allDiffEvents.value].slice(0, 100)
        }

        previousGameData.value = res.data
        gameData.value = res.data
        events.value = res.data.events?.Events || []
      }
    } catch (err) {
      if (seq === liveDataSeq) {
        lastError.value = (err as Error).message
      }
    } finally {
      if (seq === liveDataSeq) {
        isLoading.value = false
      }
    }
  }

  async function refreshAll() {
    const currentStatus = await fetchStatus()
    if (
      currentStatus.status === 'IN_GAME' ||
      currentStatus.status === 'MOCK' ||
      clientMockMode.value ||
      currentStatus.isMock
    ) {
      await fetchLiveData()
    } else {
      previousGameData.value = null
      gameData.value = null
      events.value = []
      allDiffEvents.value = []
    }
  }

  async function toggleMockMode() {
    const nextState = !status.value.isMock
    clientMockMode.value = nextState
    try {
      await $fetch('/api/riot/mock', {
        method: 'POST',
        body: { enabled: nextState },
      })
    } catch {
      // Ignore fallback
    }
    await refreshAll()
  }

  function startPolling() {
    if (timer) return
    isPolling.value = true
    timer = setInterval(() => {
      refreshAll()
    }, 2000)
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isPolling.value = false
  }

  function togglePolling() {
    if (isPolling.value) {
      stopPolling()
    } else {
      startPolling()
      refreshAll()
    }
  }

  const isConnected = computed(
    () => status.value.status === 'IN_GAME' || status.value.status === 'MOCK',
  )

  const formattedGameTime = computed(() => {
    const time = gameData.value?.gameData?.gameTime || status.value.gameTime || 0
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  onMounted(() => {
    refreshAll()
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    clientMockMode,
    status,
    gameData,
    events,
    diffEvents: allDiffEvents,
    blueEconomy,
    redEconomy,
    goldDifference,
    isLoading,
    isPolling,
    lastError,
    isConnected,
    formattedGameTime,
    refreshAll,
    toggleMockMode,
    togglePolling,
  }
}
