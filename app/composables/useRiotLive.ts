import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { RiotAllGameData, RiotEvent, RiotStatusResponse } from '../../shared/types/riot'

export function useRiotLive() {
  const clientMockMode = ref(false)
  const status = ref<RiotStatusResponse>({
    status: 'DISCONNECTED',
    isMock: false,
  })
  const gameData = ref<RiotAllGameData | null>(null)
  const events = ref<RiotEvent[]>([])
  const isLoading = ref(false)
  const isPolling = ref(true)
  const lastError = ref<string | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null

  async function fetchStatus() {
    try {
      const url = clientMockMode.value ? '/api/riot/status?mock=true' : '/api/riot/status'
      const res = await $fetch<RiotStatusResponse & { globalMockEnabled: boolean }>(url)
      status.value = res
      lastError.value = res.error || null
      return res
    } catch (err) {
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

    try {
      isLoading.value = true
      const url = isMockActive ? '/api/riot/live?mock=true' : '/api/riot/live'
      const res = await $fetch<{ success: boolean; data: RiotAllGameData }>(url)
      if (res?.success && res.data) {
        gameData.value = res.data
        events.value = res.data.events?.Events || []
      }
    } catch (err) {
      lastError.value = (err as Error).message
    } finally {
      isLoading.value = false
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
      gameData.value = null
      events.value = []
    }
  }

  async function toggleMockMode() {
    clientMockMode.value = !clientMockMode.value
    try {
      await $fetch('/api/riot/mock', {
        method: 'POST',
        body: { enabled: clientMockMode.value },
      })
    } catch {
      // Ignore if server endpoint has issues; client query mock=true is authoritative
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
