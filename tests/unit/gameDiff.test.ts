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

  it('should detect FirstBlood event and map firstblood sound key', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const currState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    currState.events.Events.push({
      EventID: 101,
      EventName: 'FirstBlood',
      EventTime: 120.0,
      Recipient: 'DariusMaster#EUW',
    })

    const result = computeGameDiff(prevState, currState)
    const fbEvents = result.newEvents.filter((e) => e.type === 'FIRST_BLOOD')
    expect(fbEvents).toHaveLength(1)
    expect(fbEvents[0].title).toBe('PREMIER SANG !')
    expect(fbEvents[0].metadata).toMatchObject({
      killerChampion: 'Darius',
      soundKey: 'firstblood',
    })
  })

  it('should detect Multikills (Double Kill, Penta Kill) and map correct sounds', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const currState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    currState.events.Events.push({
      EventID: 102,
      EventName: 'Multikill',
      EventTime: 500.0,
      KillerName: 'GetExcited#EUW',
      KillStreak: 2,
    })
    currState.events.Events.push({
      EventID: 103,
      EventName: 'Multikill',
      EventTime: 505.0,
      KillerName: 'GetExcited#EUW',
      KillStreak: 5,
    })

    const result = computeGameDiff(prevState, currState)
    const multiEvents = result.newEvents.filter((e) => e.type === 'MULTIKILL')
    expect(multiEvents).toHaveLength(2)
    expect(multiEvents[0].title).toBe('DOUBLE KILL !')
    expect(multiEvents[0].metadata).toMatchObject({ soundKey: 'doublekill', streak: 2 })
    expect(multiEvents[1].title).toBe('PENTAKILL (ULTRA KILL) !')
    expect(multiEvents[1].metadata).toMatchObject({ soundKey: 'ultrakill', streak: 5 })
  })

  it('should detect Ace and Baron events with team dominating sound keys', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const currState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    currState.events.Events.push({
      EventID: 104,
      EventName: 'Ace',
      EventTime: 800.0,
      Acer: 'FoxCharm#EUW',
      AcingTeam: 'ORDER',
    })
    currState.events.Events.push({
      EventID: 105,
      EventName: 'BaronKill',
      EventTime: 1200.0,
      KillerName: 'FoxCharm#EUW',
    })

    const result = computeGameDiff(prevState, currState)
    const aceEvent = result.newEvents.find((e) => e.type === 'ACE')
    expect(aceEvent).toBeDefined()
    expect(aceEvent?.metadata).toMatchObject({ soundKey: 'blue_team_dominating' })

    const baronEvent = result.newEvents.find((e) => e.type === 'BARON_KILL')
    expect(baronEvent).toBeDefined()
    expect(baronEvent?.metadata).toMatchObject({ soundKey: 'blue_team_dominating' })
  })

  it('should detect environment execution and map humiliating_defeat sound', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const currState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    currState.events.Events.push({
      EventID: 106,
      EventName: 'ChampionKill',
      EventTime: 650.0,
      KillerName: 'Turret_TOrder_L_01_A',
      VictimName: 'ShadowNinja#EUW',
    })

    const result = computeGameDiff(prevState, currState)
    const executeEvent = result.newEvents.find((e) => e.type === 'EXECUTE')
    expect(executeEvent).toBeDefined()
    expect(executeEvent?.title).toBe('MORT HUMILIANTE')
    expect(executeEvent?.metadata).toMatchObject({
      victimChampion: 'Zed',
      soundKey: 'humiliating_defeat',
    })
  })

  it('should detect solo kills and streak milestones (killing spree, godlike)', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const currState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    // Solo kill (0 assists)
    currState.events.Events.push({
      EventID: 107,
      EventName: 'ChampionKill',
      EventTime: 700.0,
      KillerName: 'DariusMaster#EUW',
      VictimName: 'DemaciaSpin#EUW',
      Assisters: [],
    })

    const result = computeGameDiff(prevState, currState)
    const soloKill = result.newEvents.find((e) => e.id === 'kill-107')
    expect(soloKill).toBeDefined()
    expect(soloKill?.title).toContain('Solo Kill')
    expect(soloKill?.metadata).toMatchObject({
      isSoloKill: true,
      soundKey: 'headshot',
    })
  })

  it('should detect GameEnd event and map victory sound', () => {
    const prevState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))
    const currState: RiotAllGameData = JSON.parse(JSON.stringify(mockGameData))

    currState.events.Events.push({
      EventID: 108,
      EventName: 'GameEnd',
      EventTime: 1800.0,
      Result: 'Win',
      Winner: 'ORDER',
    })

    const result = computeGameDiff(prevState, currState)
    const endEvent = result.newEvents.find((e) => e.type === 'GAME_END')
    expect(endEvent).toBeDefined()
    expect(endEvent?.title).toContain("VICTOIRE DE L'ÉQUIPE BLEUE")
    expect(endEvent?.metadata).toMatchObject({ soundKey: 'blue_team_is_the_winner' })
  })
})
