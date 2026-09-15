import { describe, expect, it } from 'vitest'
import type { GameDiffEvent } from '../../shared/types/diff'
import type { RiotPlayer } from '../../shared/types/riot'
import { getChampionMapPosition, OBJECTIVE_COORDINATES } from '../../shared/utils/mapCoordinates'
import {
  getMapEventLocation,
  isRecentMapEvent,
  normalizeMapTurretId,
} from '../../shared/utils/mapEvents'

const event = (type: GameDiffEvent['type'], metadata?: unknown): GameDiffEvent => ({
  id: 'event-42',
  type,
  metadata,
  gameTime: 120,
  formattedTime: '02:00',
  title: 'Événement',
  description: '',
})

const victim = {
  championName: 'Garen',
  summonerName: 'Enemy#EUW',
  position: 'TOP',
  team: 'CHAOS',
} as RiotPlayer

describe('map event locations', () => {
  it('uses the known pits for neutral objective events', () => {
    expect(getMapEventLocation(event('DRAGON_KILL'))).toMatchObject({
      ...OBJECTIVE_COORDINATES.DRAGON_PIT,
      indicative: false,
    })
    for (const type of ['BARON_KILL', 'HERALD_KILL', 'HORDE_KILL'] as const) {
      expect(getMapEventLocation(event(type))).toMatchObject({
        ...OBJECTIVE_COORDINATES.BARON_PIT,
        kind: 'objective',
        indicative: false,
      })
    }
  })

  it('matches exact turret IDs in both Riot and demo notation', () => {
    expect(normalizeMapTurretId('Turret_TChaos_C_05_A')).toBe('Turret_T2_C_05_A')
    const riotLocation = getMapEventLocation(
      event('TURRET_DESTROYED', { turretId: 'Turret_TChaos_C_05_A' }),
    )
    const demoLocation = getMapEventLocation(
      event('TURRET_DESTROYED', { turretId: 'Turret_T2_C_05_A' }),
    )
    expect(riotLocation).toEqual(demoLocation)
    expect(riotLocation).toMatchObject({ x: 62, y: 38, kind: 'turret', indicative: false })
  })

  it('does not invent a turret location from its lane or an unsupported ID', () => {
    expect(
      getMapEventLocation(event('TURRET_DESTROYED', { lane: 'MID', destroyedTeam: 'CHAOS' })),
    ).toBeNull()
    expect(
      getMapEventLocation(event('TURRET_DESTROYED', { turretId: 'Turret_TChaos_C_99_A' })),
    ).toBeNull()
  })

  it('labels combat references as indicative, using the victim role', () => {
    const location = getMapEventLocation(
      event('CHAMPION_KILL', { victimName: victim.summonerName }),
      [victim],
    )
    expect(location).toMatchObject({
      ...getChampionMapPosition('CHAOS', 'TOP'),
      kind: 'role',
      indicative: true,
    })
    expect(location?.label).toContain('position indicative')
  })

  it('can resolve a known champion and team when the summoner name is absent', () => {
    expect(
      getMapEventLocation(
        event('CHAMPION_KILL', { victimChampion: 'Garen', victimTeam: 'CHAOS' }),
        [victim],
      ),
    ).toMatchObject({ kind: 'role' })
  })

  it('does not locate unknown or ambiguous combat participants', () => {
    expect(getMapEventLocation(event('CHAMPION_KILL', {}), [victim])).toBeNull()
    expect(
      getMapEventLocation(event('CHAMPION_KILL', { victimName: victim.summonerName }), [
        { ...victim, position: 'UNKNOWN' },
      ]),
    ).toBeNull()
    expect(
      getMapEventLocation(event('CHAMPION_KILL', { victimChampion: 'Garen' }), [
        victim,
        { ...victim, summonerName: 'Mirror#EUW', team: 'ORDER' },
      ]),
    ).toBeNull()
  })

  it('does not infer spatial information for purchases and team-wide events', () => {
    expect(
      getMapEventLocation(event('ITEM_PURCHASE', { championName: 'Garen' }), [victim]),
    ).toBeNull()
    expect(getMapEventLocation(event('ACE'), [victim])).toBeNull()
  })

  it('rejects old snapshots, future events and invalid times for live pings', () => {
    const kill = event('CHAMPION_KILL')
    expect(isRecentMapEvent(kill, 120)).toBe(true)
    expect(isRecentMapEvent(kill, 128)).toBe(true)
    expect(isRecentMapEvent(kill, 129)).toBe(false)
    expect(isRecentMapEvent(kill, 119)).toBe(false)
    expect(isRecentMapEvent(kill, Number.NaN)).toBe(false)
  })
})
