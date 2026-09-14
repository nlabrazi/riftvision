import { beforeEach, describe, expect, it } from 'vitest'
import {
  checkRiotConnection,
  fetchActivePlayer,
  fetchAllGameData,
  fetchEventData,
  fetchPlayerList,
  isMockMode,
  setMockMode,
} from '../../server/utils/riotClient'

describe('riotClient utility', () => {
  beforeEach(() => {
    setMockMode(false)
  })

  it('should toggle mock mode properly', () => {
    expect(isMockMode()).toBe(false)
    setMockMode(true)
    expect(isMockMode()).toBe(true)
  })

  it('should return MOCK status response when mock mode is enabled', async () => {
    setMockMode(true)
    const status = await checkRiotConnection()

    expect(status.status).toBe('MOCK')
    expect(status.isMock).toBe(true)
    expect(status.playerCount).toBe(10)
    expect(status.gameMode).toBe('CLASSIC')
    expect(status.gameTime).toBeGreaterThan(0)
  })

  it('should return mock allGameData when forceMock is true', async () => {
    const data = await fetchAllGameData(true)
    expect(data.allPlayers).toHaveLength(10)
    expect(data.activePlayer.summonerName).toBe('DariusMaster#EUW')
    expect(data.events.Events.length).toBeGreaterThan(0)
  })

  it('should filter events when fromEventId is provided in mock mode', async () => {
    const allEvents = await fetchEventData(undefined, true)
    const filteredEvents = await fetchEventData(4, true)

    expect(allEvents.length).toBeGreaterThan(filteredEvents.length)
    for (const event of filteredEvents) {
      expect(event.EventID).toBeGreaterThan(4)
    }
  })

  it('should return active player and player list in mock mode', async () => {
    const active = await fetchActivePlayer(true)
    expect(active.level).toBe(11)

    const players = await fetchPlayerList(true)
    expect(players).toHaveLength(10)
  })

  it('should handle offline Riot client gracefully with DISCONNECTED status', async () => {
    setMockMode(false)
    // Testing against port that has no LoL client running
    const status = await checkRiotConnection(false)
    expect(status.status).toBe('DISCONNECTED')
    expect(status.isMock).toBe(false)
    expect(status.error).toBeDefined()
  })
})
