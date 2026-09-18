import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRiotLive } from '../../app/composables/useRiotLive'
import { mockGameData } from '../../server/data/mockGame'

vi.mock('vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue')>()),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useRiotLive', () => {
  it('loads live data and updates the event feed across refreshes without duplicates', async () => {
    const data = structuredClone(mockGameData)
    data.events.Events = []
    const fetch = vi.fn(async (url: string) =>
      url.includes('/status')
        ? { status: 'IN_GAME', isMock: false, globalMockEnabled: false }
        : { success: true, data: structuredClone(data) },
    )
    vi.stubGlobal('$fetch', fetch)
    const live = useRiotLive()

    await live.refreshAll()
    expect(fetch).toHaveBeenCalledWith('/api/riot/live?mock=false')
    expect(live.gameData.value?.allPlayers).toHaveLength(10)

    const killer = data.allPlayers.find((p) => p.team === 'ORDER')?.summonerName ?? 'Killer'
    const victim = data.allPlayers.find((p) => p.team === 'CHAOS')?.summonerName ?? 'Victim'
    data.events.Events.push(
      {
        EventID: 100,
        EventName: 'ChampionKill',
        EventTime: 100,
        KillerName: killer,
        VictimName: victim,
        Assisters: [],
      },
      {
        EventID: 101,
        EventName: 'DragonKill',
        EventTime: 101,
        KillerName: killer,
        DragonType: 'Fire',
      },
    )
    await live.refreshAll()
    expect(live.events.value.map((e) => e.EventName)).toEqual(['ChampionKill', 'DragonKill'])
    expect(live.diffEvents.value).toHaveLength(2)
    expect(live.blueEconomy.value.dragonCount).toBe(1)

    await live.refreshAll()
    expect(live.diffEvents.value).toHaveLength(2)
    expect(live.lastError.value).toBeNull()
    expect(live.isLoading.value).toBe(false)
  })

  it('starts in standby mode by default and allows toggling live mode', async () => {
    const fetch = vi.fn(async (url: string) => {
      if (url.includes('/status')) {
        return { status: 'DISCONNECTED', isMock: false, error: 'Riot API timeout after 1500ms' }
      }
      return { success: true }
    })
    vi.stubGlobal('$fetch', fetch)
    const live = useRiotLive()

    expect(live.isLiveActive.value).toBe(false)
    expect(live.status.value.status).toBe('DISCONNECTED')

    // Start live mode explicitly
    await live.startLiveMode()
    expect(live.isLiveActive.value).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/riot/status?mock=false')

    // Stop live mode
    live.stopLiveMode()
    expect(live.isLiveActive.value).toBe(false)
    expect(live.status.value.status).toBe('DISCONNECTED')
    expect(live.lastError.value).toBeNull()
  })

  it('switches cleanly between mock mode and live mode', async () => {
    let mockServerEnabled = false
    const fetch = vi.fn(async (url: string, opts?: { body?: { enabled?: boolean } }) => {
      if (url.includes('/mock') && opts?.body) {
        mockServerEnabled = !!opts.body.enabled
        return { success: true }
      }
      if (url.includes('/status')) {
        return mockServerEnabled
          ? { status: 'MOCK', isMock: true, globalMockEnabled: true }
          : { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false }
      }
      return { success: true, data: structuredClone(mockGameData) }
    })
    vi.stubGlobal('$fetch', fetch)
    const live = useRiotLive()

    // Start live mode
    await live.startLiveMode()
    expect(live.isLiveActive.value).toBe(true)

    // Starting mock mode should deactivate live mode
    await live.startMockMode()
    expect(live.isLiveActive.value).toBe(false)
    expect(live.clientMockMode.value).toBe(true)
    expect(live.status.value.status).toBe('MOCK')

    // Stopping mock mode resets state to standby
    await live.stopMockMode()
    expect(live.clientMockMode.value).toBe(false)
    expect(live.isLiveActive.value).toBe(false)
    expect(live.status.value.status).toBe('DISCONNECTED')
  })
  it('ignores game data arriving after the user disconnects', async () => {
    vi.useFakeTimers()
    let resolveData = (_value: { success: boolean; data: typeof mockGameData }) => {}
    const pendingData = new Promise<{ success: boolean; data: typeof mockGameData }>((resolve) => {
      resolveData = resolve
    })
    const fetch = vi.fn(async (url: string) =>
      url.includes('/status') ? { status: 'IN_GAME', isMock: false } : pendingData,
    )
    vi.stubGlobal('$fetch', fetch)
    const live = useRiotLive()
    const starting = live.startLiveMode()
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/riot/live?mock=false'))
    live.stopLiveMode()
    resolveData({ success: true, data: structuredClone(mockGameData) })
    await starting
    expect(live.gameData.value).toBeNull()
    expect(live.status.value.status).toBe('DISCONNECTED')
    expect(live.isLoading.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resumes automatic updates when starting a new session after a pause', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      '$fetch',
      vi.fn(async (url: string) =>
        url.includes('/status') ? { status: 'DISCONNECTED', isMock: false } : { success: true },
      ),
    )
    const live = useRiotLive()
    await live.startLiveMode()
    live.togglePolling()
    expect(live.isPolling.value).toBe(false)
    live.stopLiveMode()
    await live.startLiveMode()
    expect(live.isPolling.value).toBe(true)
    expect(vi.getTimerCount()).toBe(1)
    live.stopLiveMode()
  })

  it('returns to standby when leaving the demo even if a real game is available', async () => {
    vi.useFakeTimers()
    const fetch = vi.fn(async (url: string) => {
      if (url.includes('/status'))
        return url.includes('mock=true')
          ? { status: 'MOCK', isMock: true }
          : { status: 'IN_GAME', isMock: false }
      return { success: true, data: structuredClone(mockGameData) }
    })
    vi.stubGlobal('$fetch', fetch)
    const live = useRiotLive()
    await live.startMockMode()
    expect(live.gameData.value).not.toBeNull()
    await live.stopMockMode()
    expect(live.gameData.value).toBeNull()
    expect(live.status.value.status).toBe('DISCONNECTED')
    expect(live.isLiveActive.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })
})
