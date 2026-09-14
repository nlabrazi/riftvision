import { describe, expect, it } from 'vitest'
import { mockGameData } from '../../server/data/mockGame'
import type { RiotAllGameData } from '../../shared/types/riot'
import {
  calculateTeamEconomy,
  computeGameDiff,
  parseTurretDetails,
} from '../../shared/utils/gameDiff'

describe('gameDiff utility & economy engine', () => {
  it('should parse turret identifiers accurately', () => {
    const botTurret = parseTurretDetails('Turret_TChaos_R_03_A')
    expect(botTurret.destroyedTeam).toBe('CHAOS')
    expect(botTurret.lane).toBe('BOT')

    const topTurret = parseTurretDetails('Turret_TOrder_L_01_A')
    expect(topTurret.destroyedTeam).toBe('ORDER')
    expect(topTurret.lane).toBe('TOP')

    const midTurret = parseTurretDetails('Turret_TChaos_C_02_A')
    expect(midTurret.destroyedTeam).toBe('CHAOS')
    expect(midTurret.lane).toBe('MID')

    const unknownTurret = parseTurretDetails(undefined)
    expect(unknownTurret.destroyedTeam).toBe('UNKNOWN')
    expect(unknownTurret.lane).toBe('UNKNOWN')
  })

  it('should calculate team economy from mock game data', () => {
    const blueEco = calculateTeamEconomy(
      mockGameData.allPlayers,
      mockGameData.events.Events,
      'ORDER',
    )
    const redEco = calculateTeamEconomy(
      mockGameData.allPlayers,
      mockGameData.events.Events,
      'CHAOS',
    )

    expect(blueEco.totalItemGold).toBeGreaterThan(10000)
    expect(redEco.totalItemGold).toBeGreaterThan(10000)
    expect(blueEco.killCount).toBe(14)
    expect(redEco.killCount).toBe(6)
    expect(blueEco.dragonCount).toBe(1)
    expect(blueEco.turretCount).toBe(2)
  })

  it('should compute initial diff with gold lead calculation', () => {
    const result = computeGameDiff(null, mockGameData)

    expect(result.blueEconomy).toBeDefined()
    expect(result.redEconomy).toBeDefined()
    expect(typeof result.goldDifference).toBe('number')
    // In mockGameData, Red has completed slightly more items while Blue sits on 1420 unspent gold
    expect(result.goldDifference).toBe(-450)
  })

  it('should detect new item purchase between two snapshots', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const currState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    // Give Garen an Infinity Edge (itemID: 3031, price: 3400)
    const garen = currState.allPlayers.find((p) => p.championName === 'Garen')
    expect(garen).toBeDefined()
    garen?.items.push({
      canUse: false,
      consumable: false,
      count: 1,
      displayName: 'Infinity Edge',
      itemID: 3031,
      price: 3400,
      rawDescription: '',
      rawDisplayName: '',
      slot: 2,
    })

    const result = computeGameDiff(prevState, currState)

    const itemEvents = result.newEvents.filter((e) => e.type === 'ITEM_PURCHASE')
    expect(itemEvents).toHaveLength(1)
    expect(itemEvents[0].title).toContain('Infinity Edge')
    expect(itemEvents[0].description).toContain('Garen')
    expect(itemEvents[0].team).toBe('CHAOS')

    // Red economy should have increased by 3400
    expect(result.redEconomy.totalItemGold).toBe(
      calculateTeamEconomy(prevState.allPlayers, prevState.events.Events, 'CHAOS').totalItemGold +
        3400,
    )
  })

  it('should detect champion death and respawn events', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const deathState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    // Kill Ahri
    const ahriDeath = deathState.allPlayers.find((p) => p.championName === 'Ahri')
    expect(ahriDeath).toBeDefined()
    if (ahriDeath) {
      ahriDeath.isDead = true
      ahriDeath.respawnTimer = 35
    }

    const deathResult = computeGameDiff(prevState, deathState)
    const deathEvents = deathResult.newEvents.filter((e) => e.type === 'CHAMPION_DEATH')
    expect(deathEvents).toHaveLength(1)
    expect(deathEvents[0].description).toContain('Ahri')

    // Now Ahri respawns
    const respawnState: RiotAllGameData = JSON.parse(JSON.stringify(deathState))
    const ahriRespawn = respawnState.allPlayers.find((p) => p.championName === 'Ahri')
    if (ahriRespawn) {
      ahriRespawn.isDead = false
      ahriRespawn.respawnTimer = 0
    }

    const respawnResult = computeGameDiff(deathState, respawnState)
    const respawnEvents = respawnResult.newEvents.filter((e) => e.type === 'CHAMPION_RESPAWN')
    expect(respawnEvents).toHaveLength(1)
    expect(respawnEvents[0].description).toContain('Ahri')
  })

  it('should detect new champion kill events from event stream', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const currState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    currState.events.Events.push({
      EventID: 99,
      EventName: 'ChampionKill',
      EventTime: 1050.0,
      KillerName: 'FoxCharm#EUW',
      VictimName: 'DemaciaSpin#EUW',
      Assisters: ['BlindMonk#EUW'],
    })

    const result = computeGameDiff(prevState, currState)
    const killEvents = result.newEvents.filter((e) => e.type === 'CHAMPION_KILL')
    expect(killEvents).toHaveLength(1)
    expect(killEvents[0].title).toContain('Ahri')
    expect(killEvents[0].title).toContain('Garen')
  })
})
