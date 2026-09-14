import https from 'node:https'
import type {
  RiotActivePlayer,
  RiotAllGameData,
  RiotEvent,
  RiotGameStats,
  RiotPlayer,
  RiotStatusResponse,
} from '../../shared/types/riot'
import { mockGameData } from '../data/mockGame'

let mockModeEnabled = process.env.MOCK_RIOT === 'true'

export function getRiotBaseUrl(): string {
  return process.env.LIVE_CLIENT_BASE_URL || 'https://127.0.0.1:2999'
}

export function isMockMode(): boolean {
  return mockModeEnabled
}

export function setMockMode(enabled: boolean): void {
  mockModeEnabled = enabled
}

/**
 * Perform an HTTPS request to the local Riot Live Client Data API
 * with rejectUnauthorized: false to safely accept the local self-signed certificate.
 */
export function riotRequest<T>(path: string, timeoutMs = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(path, getRiotBaseUrl())
      const req = https.request(
        url,
        {
          method: 'GET',
          rejectUnauthorized: false,
          timeout: timeoutMs,
          headers: {
            Accept: 'application/json',
          },
        },
        (res) => {
          let rawData = ''
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            rawData += chunk
          })
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(rawData) as T)
              } catch (err) {
                reject(new Error(`Failed to parse Riot API response: ${(err as Error).message}`))
              }
            } else {
              reject(new Error(`Riot API responded with HTTP status ${res.statusCode}`))
            }
          })
        },
      )

      req.on('error', (err) => {
        reject(err)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error(`Riot API timeout after ${timeoutMs}ms`))
      })

      req.end()
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Check connectivity to the local Riot Live Client Data API.
 */
export async function checkRiotConnection(forceMock?: boolean): Promise<RiotStatusResponse> {
  const useMock = forceMock ?? mockModeEnabled

  if (useMock) {
    return {
      status: 'MOCK',
      latencyMs: 1,
      isMock: true,
      gameTime: mockGameData.gameData.gameTime,
      gameMode: mockGameData.gameData.gameMode,
      playerCount: mockGameData.allPlayers.length,
    }
  }

  const start = Date.now()
  try {
    const stats = await riotRequest<RiotGameStats>('/liveclientdata/gamestats', 1500)
    const latencyMs = Date.now() - start
    return {
      status: 'IN_GAME',
      latencyMs,
      isMock: false,
      gameTime: stats.gameTime,
      gameMode: stats.gameMode,
      playerCount: 10,
    }
  } catch (err) {
    return {
      status: 'DISCONNECTED',
      latencyMs: Date.now() - start,
      isMock: false,
      error: (err as Error).message,
    }
  }
}

/**
 * Fetch all game data (players, scores, items, events, stats).
 */
export async function fetchAllGameData(forceMock?: boolean): Promise<RiotAllGameData> {
  const useMock = forceMock ?? mockModeEnabled
  if (useMock) {
    return mockGameData
  }
  return riotRequest<RiotAllGameData>('/liveclientdata/allgamedata')
}

/**
 * Fetch game events, optionally filtering from a specific EventID.
 */
export async function fetchEventData(
  fromEventId?: number,
  forceMock?: boolean,
): Promise<RiotEvent[]> {
  const useMock = forceMock ?? mockModeEnabled
  let events: RiotEvent[]

  if (useMock) {
    events = mockGameData.events.Events
  } else {
    const res = await riotRequest<{ Events: RiotEvent[] }>('/liveclientdata/eventdata')
    events = res.Events || []
  }

  if (typeof fromEventId === 'number' && fromEventId >= 0) {
    return events.filter((e) => e.EventID > fromEventId)
  }

  return events
}

/**
 * Fetch active local player stats.
 */
export async function fetchActivePlayer(forceMock?: boolean): Promise<RiotActivePlayer> {
  const useMock = forceMock ?? mockModeEnabled
  if (useMock) {
    return mockGameData.activePlayer
  }
  return riotRequest<RiotActivePlayer>('/liveclientdata/activeplayer')
}

/**
 * Fetch 10 players data.
 */
export async function fetchPlayerList(forceMock?: boolean): Promise<RiotPlayer[]> {
  const useMock = forceMock ?? mockModeEnabled
  if (useMock) {
    return mockGameData.allPlayers
  }
  return riotRequest<RiotPlayer[]>('/liveclientdata/playerlist')
}

/**
 * Fetch game stats.
 */
export async function fetchGameStats(forceMock?: boolean): Promise<RiotGameStats> {
  const useMock = forceMock ?? mockModeEnabled
  if (useMock) {
    return mockGameData.gameData
  }
  return riotRequest<RiotGameStats>('/liveclientdata/gamestats')
}
