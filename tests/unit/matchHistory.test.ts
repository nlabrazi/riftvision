import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useMatchHistory } from '../../app/composables/useMatchHistory'
import {
  clearAllStoredMatches,
  deleteStoredMatch,
  getStoredMatches,
  saveMatch,
} from '../../server/utils/matchHistoryStorage'
import type { TeamEconomySummary } from '../../shared/types/diff'
import type { SavedMatch } from '../../shared/types/history'
import type { RiotAllGameData } from '../../shared/types/riot'

const DATA_DIR = path.join(process.cwd(), 'server', 'data')
const HISTORY_FILE = path.join(DATA_DIR, 'match-history.json')

describe('Match History Storage (Server)', () => {
  let originalContent: string | null = null

  beforeEach(() => {
    if (fs.existsSync(HISTORY_FILE)) {
      originalContent = fs.readFileSync(HISTORY_FILE, 'utf-8')
    } else {
      originalContent = null
    }
    clearAllStoredMatches()
  })

  afterEach(() => {
    if (originalContent !== null) {
      fs.writeFileSync(HISTORY_FILE, originalContent, 'utf-8')
    } else if (fs.existsSync(HISTORY_FILE)) {
      fs.unlinkSync(HISTORY_FILE)
    }
  })

  it('starts with empty list when cleared', () => {
    const matches = getStoredMatches()
    expect(matches).toEqual([])
  })

  it('saves and retrieves match recaps', () => {
    const mockMatch: SavedMatch = {
      id: 'test-match-1',
      timestamp: Date.now(),
      dateFormatted: '14 oct. 16:00',
      durationSeconds: 1500,
      formattedGameTime: '25:00',
      result: 'VICTORY',
      championName: 'Aatrox',
      summonerName: 'TestSummoner',
      team: 'ORDER',
      kda: { kills: 8, deaths: 2, assists: 6, ratio: '7.0' },
      cs: 180,
      csPerMin: '7.2',
      gameData: {
        activePlayer: { summonerName: 'TestSummoner' },
        allPlayers: [],
        events: { Events: [] },
        gameData: { gameTime: 1500 },
      } as unknown as RiotAllGameData,
      blueEconomy: { totalItemGold: 25000, killCount: 20 } as TeamEconomySummary,
      redEconomy: { totalItemGold: 20000, killCount: 15 } as TeamEconomySummary,
      goldDifference: 5000,
    }

    const updated = saveMatch(mockMatch)
    expect(updated.length).toBe(1)
    expect(updated[0].id).toBe('test-match-1')
    expect(updated[0].championName).toBe('Aatrox')

    const read = getStoredMatches()
    expect(read.length).toBe(1)
    expect(read[0].result).toBe('VICTORY')
  })

  it('deletes a match by id', () => {
    const match1: SavedMatch = {
      id: 'match-to-delete',
      timestamp: 1000,
      dateFormatted: '14 oct.',
      durationSeconds: 1000,
      formattedGameTime: '16:40',
      result: 'DEFEAT',
      championName: 'Zed',
      summonerName: 'TestSummoner',
      team: 'CHAOS',
      kda: { kills: 1, deaths: 5, assists: 2, ratio: '0.6' },
      cs: 100,
      csPerMin: '6.0',
      gameData: {} as RiotAllGameData,
      blueEconomy: {} as TeamEconomySummary,
      redEconomy: {} as TeamEconomySummary,
      goldDifference: -3000,
    }

    saveMatch(match1)
    expect(getStoredMatches().length).toBe(1)

    const success = deleteStoredMatch('match-to-delete')
    expect(success).toBe(true)
    expect(getStoredMatches().length).toBe(0)
  })
})

describe('useMatchHistory Composable', () => {
  let store: Record<string, string> = {}

  beforeEach(() => {
    store = {}
    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: 0,
    } as unknown as Storage
  })

  it('builds a snapshot and calculates correct stats', () => {
    const { buildMatchSnapshot } = useMatchHistory()

    const mockGameData = {
      activePlayer: { summonerName: 'Faker' },
      allPlayers: [
        {
          summonerName: 'Faker',
          championName: 'Ahri',
          rawChampionName: 'game_character_displayname_Ahri',
          team: 'ORDER',
          scores: {
            kills: 10,
            deaths: 2,
            assists: 8,
            creepScore: 240,
          },
        },
      ],
      gameData: {
        gameTime: 1800, // 30 minutes
        gameMode: 'CLASSIC',
      },
      events: { Events: [] },
    } as unknown as RiotAllGameData

    const blueEco = { totalItemGold: 35000, killCount: 25 } as TeamEconomySummary
    const redEco = { totalItemGold: 30000, killCount: 15 } as TeamEconomySummary

    const snapshot = buildMatchSnapshot(mockGameData, blueEco, redEco, 5000, '30:00', 'VICTORY', [])

    expect(snapshot.championName).toBe('Ahri')
    expect(snapshot.result).toBe('VICTORY')
    expect(snapshot.kda.kills).toBe(10)
    expect(snapshot.kda.deaths).toBe(2)
    expect(snapshot.kda.assists).toBe(8)
    expect(snapshot.kda.ratio).toBe('9.0') // (10 + 8) / 2 = 9.0
    expect(snapshot.cs).toBe(240)
    expect(snapshot.csPerMin).toBe('8.0') // 240 / 30 = 8.0
    expect(snapshot.goldDifference).toBe(5000)
  })

  it('opens and closes active match report', () => {
    const { activeReportMatch, openMatchReport, closeMatchReport } = useMatchHistory()

    expect(activeReportMatch.value).toBeNull()

    const dummyMatch = {
      id: 'match-1',
      championName: 'LeeSin',
      result: 'VICTORY',
    } as unknown as SavedMatch

    openMatchReport(dummyMatch)
    expect(activeReportMatch.value).not.toBeNull()
    expect(activeReportMatch.value?.championName).toBe('LeeSin')

    closeMatchReport()
    expect(activeReportMatch.value).toBeNull()
  })
})
