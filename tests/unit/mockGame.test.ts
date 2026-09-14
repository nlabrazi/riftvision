import { describe, expect, it } from 'vitest'
import { mockGameData } from '../../server/data/mockGame'

describe('mockGameData Fixture', () => {
  it('should have valid gameData properties', () => {
    expect(mockGameData.gameData).toBeDefined()
    expect(mockGameData.gameData.gameMode).toBe('CLASSIC')
    expect(mockGameData.gameData.gameTime).toBeGreaterThan(0)
    expect(mockGameData.gameData.mapNumber).toBe(11)
  })

  it('should have 10 players evenly split between ORDER and CHAOS', () => {
    expect(mockGameData.allPlayers).toHaveLength(10)

    const blueTeam = mockGameData.allPlayers.filter((p) => p.team === 'ORDER')
    const redTeam = mockGameData.allPlayers.filter((p) => p.team === 'CHAOS')

    expect(blueTeam).toHaveLength(5)
    expect(redTeam).toHaveLength(5)
  })

  it('should cover all standard 5 roles for each team', () => {
    const expectedRoles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

    const blueRoles = mockGameData.allPlayers
      .filter((p) => p.team === 'ORDER')
      .map((p) => p.position)
    const redRoles = mockGameData.allPlayers
      .filter((p) => p.team === 'CHAOS')
      .map((p) => p.position)

    expect(blueRoles.sort()).toEqual(expectedRoles.sort())
    expect(redRoles.sort()).toEqual(expectedRoles.sort())
  })

  it('should have valid activePlayer details', () => {
    expect(mockGameData.activePlayer).toBeDefined()
    expect(mockGameData.activePlayer.summonerName).toBe('DariusMaster#EUW')
    expect(mockGameData.activePlayer.currentGold).toBeGreaterThan(0)
    expect(mockGameData.activePlayer.championStats.currentHealth).toBeGreaterThan(0)
  })

  it('should contain chronologically ordered game events', () => {
    const events = mockGameData.events.Events
    expect(events.length).toBeGreaterThan(0)

    for (let i = 1; i < events.length; i++) {
      expect(events[i].EventTime).toBeGreaterThanOrEqual(events[i - 1].EventTime)
      expect(events[i].EventID).toBe(i)
    }
  })
})
