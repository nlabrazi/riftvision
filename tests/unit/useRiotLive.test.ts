import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRiotLive } from '../../app/composables/useRiotLive'
import { mockGameData } from '../../server/data/mockGame'

vi.mock('vue', async (importOriginal) => ({
  ...await importOriginal<typeof import('vue')>(),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
}))

afterEach(() => vi.unstubAllGlobals())

describe('useRiotLive', () => {
  it('loads live data and updates the event feed across refreshes without duplicates', async () => {
    const data = structuredClone(mockGameData)
    data.events.Events = []
    const fetch = vi.fn(async (url: string) => url.includes('/status')
      ? { status: 'IN_GAME', isMock: false, globalMockEnabled: false }
      : { success: true, data: structuredClone(data) })
    vi.stubGlobal('$fetch', fetch)
    const live = useRiotLive()

    await live.refreshAll()
    expect(fetch).toHaveBeenCalledWith('/api/riot/live?mock=false')
    expect(live.gameData.value?.allPlayers).toHaveLength(10)

    const killer = data.allPlayers.find(p => p.team === 'ORDER')!.summonerName
    const victim = data.allPlayers.find(p => p.team === 'CHAOS')!.summonerName
    data.events.Events.push(
      { EventID: 100, EventName: 'ChampionKill', EventTime: 100, KillerName: killer, VictimName: victim, Assisters: [] },
      { EventID: 101, EventName: 'DragonKill', EventTime: 101, KillerName: killer, DragonType: 'Fire' },
    )
    await live.refreshAll()
    expect(live.events.value.map(e => e.EventName)).toEqual(['ChampionKill', 'DragonKill'])
    expect(live.diffEvents.value).toHaveLength(2)
    expect(live.blueEconomy.value.dragonCount).toBe(1)

    await live.refreshAll()
    expect(live.diffEvents.value).toHaveLength(2)
    expect(live.lastError.value).toBeNull()
    expect(live.isLoading.value).toBe(false)
  })
})
