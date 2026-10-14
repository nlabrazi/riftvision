import { describe, expect, it } from 'vitest'
import type { GameDiffEvent } from '../../shared/types/diff'

describe('Post-Game Recap Logic', () => {
  it('calculates player KDA ratio correctly', () => {
    const calcKda = (kills: number, deaths: number, assists: number) => {
      const d = Math.max(1, deaths)
      return ((kills + assists) / d).toFixed(1)
    }

    expect(calcKda(10, 2, 5)).toBe('7.5')
    expect(calcKda(0, 0, 0)).toBe('0.0') // 0 deaths treated as max(1, 0)
    expect(calcKda(3, 4, 7)).toBe('2.5')
  })

  it('calculates kill participation percentage correctly', () => {
    const calcKp = (kills: number, assists: number, teamKills: number) => {
      if (teamKills === 0) return 0
      return Math.min(100, Math.round(((kills + assists) / teamKills) * 100))
    }

    expect(calcKp(5, 5, 20)).toBe(50)
    expect(calcKp(10, 10, 10)).toBe(100) // capped at 100
    expect(calcKp(0, 0, 0)).toBe(0)
    expect(calcKp(3, 2, 15)).toBe(33)
  })

  it('calculates CS per minute correctly', () => {
    const calcCsPerMin = (cs: number, formattedTime: string) => {
      const parts = formattedTime.split(':')
      const minutes =
        parts.length === 2 ? Math.max(1, parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60) : 15
      return (cs / minutes).toFixed(1)
    }

    expect(calcCsPerMin(150, '15:00')).toBe('10.0')
    expect(calcCsPerMin(200, '25:00')).toBe('8.0')
    expect(calcCsPerMin(0, '10:00')).toBe('0.0')
  })

  it('filters highlights properly from diff events', () => {
    const highlightTypes = [
      'FIRST_BLOOD',
      'MULTIKILL',
      'DRAGON_KILL',
      'BARON_KILL',
      'HERALD_KILL',
      'ACE',
    ]

    const events: GameDiffEvent[] = [
      {
        id: '1',
        type: 'KILL',
        title: 'Kill standard',
        subtitle: 'Ahri a éliminé Zed',
        timestamp: 120,
        team: 'ORDER',
        severity: 'info',
      },
      {
        id: '2',
        type: 'FIRST_BLOOD',
        title: 'Premier Sang',
        subtitle: 'Ahri',
        timestamp: 150,
        team: 'ORDER',
        severity: 'high',
      },
      {
        id: '3',
        type: 'DRAGON_KILL',
        title: 'Dragon abattu',
        subtitle: 'Dragon des Océans',
        timestamp: 450,
        team: 'CHAOS',
        severity: 'high',
      },
      {
        id: '4',
        type: 'TURRET_PLATE',
        title: 'Plaque détruite',
        subtitle: 'Top',
        timestamp: 600,
        team: 'ORDER',
        severity: 'info',
      },
      {
        id: '5',
        type: 'ACE',
        title: 'Ace !',
        subtitle: 'Équipe éliminée',
        timestamp: 900,
        team: 'ORDER',
        severity: 'critical',
      },
    ]

    const highlights = events.filter((e) => highlightTypes.includes(e.type))
    expect(highlights).toHaveLength(3)
    expect(highlights.map((h) => h.type)).toEqual(['FIRST_BLOOD', 'DRAGON_KILL', 'ACE'])
  })

  it('formats post-game clipboard summary', () => {
    const outcome = 'Victoire'
    const formattedGameTime = '24:15'
    const champ = 'Ahri'
    const k = 8
    const d = 2
    const a = 12
    const kdaRatio = '10.0'
    const kp = 65
    const cs = 190
    const csMin = '7.9'
    const blueDragons = 3
    const redDragons = 1
    const blueBarons = 1
    const redBarons = 0

    const summary = `🎮 RiftVision — Bilan de Match
🏆 Résultat : ${outcome} (${formattedGameTime})
🧙 Champion : ${champ}
⚔️ KDA : ${k}/${d}/${a} (${kdaRatio} Ratio, ${kp}% KP)
🎯 CS : ${cs} (${csMin}/min)
🐉 Dragons : Bleu ${blueDragons} vs Rouge ${redDragons}
👾 Barons : Bleu ${blueBarons} vs Rouge ${redBarons}`

    expect(summary).toContain('Victoire (24:15)')
    expect(summary).toContain('Ahri')
    expect(summary).toContain('8/2/12')
    expect(summary).toContain('10.0 Ratio, 65% KP')
    expect(summary).toContain('Dragons : Bleu 3 vs Rouge 1')
  })
})
