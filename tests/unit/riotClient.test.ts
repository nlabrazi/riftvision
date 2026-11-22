import { EventEmitter } from 'node:events'
import https from 'node:https'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkRiotConnection,
  fetchActivePlayer,
  fetchAllGameData,
  fetchEventData,
  fetchGameStats,
  fetchPlayerList,
  getRiotBaseUrl,
  isMockMode,
  riotRequest,
  setMockMode,
} from '../../server/utils/riotClient'

type MockHttpsBehavior =
  | { kind: 'response'; statusCode: number; chunks: string[] }
  | { kind: 'error'; error: Error }
  | { kind: 'timeout' }

function stubHttpsRequest(behavior: MockHttpsBehavior) {
  return vi.spyOn(https, 'request').mockImplementation(((
    _url: unknown,
    _opts: unknown,
    cb: unknown,
  ) => {
    const req = Object.assign(new EventEmitter(), {
      destroy: vi.fn(),
      end: vi.fn(() => {
        queueMicrotask(() => {
          if (behavior.kind === 'error') {
            req.emit('error', behavior.error)
            return
          }
          if (behavior.kind === 'timeout') {
            req.emit('timeout')
            return
          }
          const res = Object.assign(new EventEmitter(), {
            statusCode: behavior.statusCode,
            setEncoding: vi.fn(),
          })
          ;(cb as (response: EventEmitter) => void)(res)
          for (const chunk of behavior.chunks) {
            res.emit('data', chunk)
          }
          res.emit('end')
        })
      }),
    })
    return req as never
  }) as never)
}

describe('riotClient utility', () => {
  const prevBaseUrl = process.env.LIVE_CLIENT_BASE_URL

  beforeEach(() => {
    setMockMode(false)
    delete process.env.LIVE_CLIENT_BASE_URL
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (prevBaseUrl === undefined) {
      delete process.env.LIVE_CLIENT_BASE_URL
    } else {
      process.env.LIVE_CLIENT_BASE_URL = prevBaseUrl
    }
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
    stubHttpsRequest({ kind: 'error', error: new Error('ECONNREFUSED') })

    const status = await checkRiotConnection(false)
    expect(status.status).toBe('DISCONNECTED')
    expect(status.isMock).toBe(false)
    expect(status.error).toBe('ECONNREFUSED')
  })

  it('should resolve base URL from env or default localhost', () => {
    expect(getRiotBaseUrl()).toBe('https://127.0.0.1:2999')
    process.env.LIVE_CLIENT_BASE_URL = 'https://192.168.1.50:2999'
    expect(getRiotBaseUrl()).toBe('https://192.168.1.50:2999')
  })

  it('should handle riotRequest JSON parsing errors, non-2xx statuses, timeouts and invalid URLs', async () => {
    stubHttpsRequest({ kind: 'response', statusCode: 200, chunks: ['{"ok":', 'true}'] })
    await expect(riotRequest<{ ok: boolean }>('/liveclientdata/test')).resolves.toEqual({
      ok: true,
    })

    vi.restoreAllMocks()
    stubHttpsRequest({ kind: 'response', statusCode: 200, chunks: ['not-json'] })
    await expect(riotRequest('/liveclientdata/test')).rejects.toThrow(
      'Failed to parse Riot API response',
    )

    vi.restoreAllMocks()
    stubHttpsRequest({ kind: 'response', statusCode: 503, chunks: ['unavailable'] })
    await expect(riotRequest('/liveclientdata/test')).rejects.toThrow(
      'Riot API responded with HTTP status 503',
    )

    vi.restoreAllMocks()
    stubHttpsRequest({ kind: 'timeout' })
    await expect(riotRequest('/liveclientdata/test', 250)).rejects.toThrow(
      'Riot API timeout after 250ms',
    )

    vi.restoreAllMocks()
    process.env.LIVE_CLIENT_BASE_URL = '://bad-url'
    await expect(riotRequest('/liveclientdata/test')).rejects.toThrow()
  })

  it('should return IN_GAME status and live data across all fetch helpers', async () => {
    stubHttpsRequest({
      kind: 'response',
      statusCode: 200,
      chunks: [JSON.stringify({ gameTime: 420, gameMode: 'CLASSIC' })],
    })
    const status = await checkRiotConnection(false)
    expect(status).toMatchObject({
      status: 'IN_GAME',
      isMock: false,
      gameTime: 420,
      gameMode: 'CLASSIC',
      playerCount: 10,
    })

    vi.restoreAllMocks()
    stubHttpsRequest({
      kind: 'response',
      statusCode: 200,
      chunks: [JSON.stringify({ gameData: { gameTime: 100 } })],
    })
    await expect(fetchAllGameData(false)).resolves.toMatchObject({ gameData: { gameTime: 100 } })

    vi.restoreAllMocks()
    stubHttpsRequest({
      kind: 'response',
      statusCode: 200,
      chunks: [
        JSON.stringify({
          Events: [
            { EventID: 1, EventName: 'GameStart', EventTime: 0 },
            { EventID: 5, EventName: 'ChampionKill', EventTime: 120 },
          ],
        }),
      ],
    })
    await expect(fetchEventData(2, false)).resolves.toEqual([
      { EventID: 5, EventName: 'ChampionKill', EventTime: 120 },
    ])

    vi.restoreAllMocks()
    stubHttpsRequest({ kind: 'response', statusCode: 200, chunks: ['{}'] })
    await expect(fetchEventData(undefined, false)).resolves.toEqual([])

    vi.restoreAllMocks()
    stubHttpsRequest({
      kind: 'response',
      statusCode: 200,
      chunks: [JSON.stringify({ summonerName: 'LivePlayer#EUW', level: 18 })],
    })
    await expect(fetchActivePlayer(false)).resolves.toMatchObject({ level: 18 })

    vi.restoreAllMocks()
    stubHttpsRequest({
      kind: 'response',
      statusCode: 200,
      chunks: [JSON.stringify([{ summonerName: 'P1' }])],
    })
    await expect(fetchPlayerList(false)).resolves.toEqual([{ summonerName: 'P1' }])

    const mockStats = await fetchGameStats(true)
    expect(mockStats.gameMode).toBe('CLASSIC')

    vi.restoreAllMocks()
    stubHttpsRequest({
      kind: 'response',
      statusCode: 200,
      chunks: [JSON.stringify({ gameMode: 'ARAM', gameTime: 90 })],
    })
    await expect(fetchGameStats(false)).resolves.toMatchObject({ gameMode: 'ARAM', gameTime: 90 })
  })
})
