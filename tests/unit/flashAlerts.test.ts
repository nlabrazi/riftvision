import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFlashAlerts } from '../../app/composables/useFlashAlerts'
import type { GameDiffEvent } from '../../shared/types/diff'

describe('useFlashAlerts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const { alertQueue, isAudioMuted, activeAlert } = useFlashAlerts()
    alertQueue.value = []
    activeAlert.value = null
    if (isAudioMuted.value) {
      useFlashAlerts().toggleAudioMute()
    }
  })

  it('triggers a flash alert and dismisses it after its duration', () => {
    const { activeAlert, triggerAlert, dismissCurrentAlert } = useFlashAlerts()

    triggerAlert({
      id: 'test-1',
      type: 'DRAGON',
      title: 'DRAGON DES ENFERS',
      subtitle: 'Sécurisé par Darius',
      durationMs: 3000,
    })

    expect(activeAlert.value).not.toBeNull()
    expect(activeAlert.value?.title).toBe('DRAGON DES ENFERS')

    // Fast-forward 3000ms
    vi.advanceTimersByTime(3000)
    expect(activeAlert.value).toBeNull()

    // Can also dismiss manually
    triggerAlert({
      id: 'test-2',
      type: 'KILL',
      title: 'FIRST BLOOD',
      subtitle: 'Ahri élimine Zed',
      durationMs: 4000,
    })
    expect(activeAlert.value?.title).toBe('FIRST BLOOD')
    dismissCurrentAlert()
    expect(activeAlert.value).toBeNull()
  })

  it('queues concurrent alerts and displays them sequentially', () => {
    const { activeAlert, alertQueue, triggerAlert, dismissCurrentAlert } = useFlashAlerts()

    triggerAlert({
      id: 'alert-1',
      type: 'BARON',
      title: 'BARON NASHOR',
      subtitle: 'Sub 1',
      durationMs: 2000,
    })

    triggerAlert({
      id: 'alert-2',
      type: 'ACE',
      title: 'ACE ENNEMI',
      subtitle: 'Sub 2',
      durationMs: 2000,
    })

    expect(activeAlert.value?.title).toBe('BARON NASHOR')
    expect(alertQueue.value).toHaveLength(1)
    expect(alertQueue.value[0]?.title).toBe('ACE ENNEMI')

    // Dismiss first alert
    dismissCurrentAlert()
    expect(activeAlert.value?.title).toBe('ACE ENNEMI')
    expect(alertQueue.value).toHaveLength(0)

    dismissCurrentAlert()
    expect(activeAlert.value).toBeNull()
  })

  it('ingests diff events and produces high-impact flash alerts', () => {
    const { activeAlert, ingestDiffEvents, dismissCurrentAlert } = useFlashAlerts()

    const events: GameDiffEvent[] = [
      {
        id: 'diff-drake',
        type: 'DRAGON_KILL',
        gameTime: 120,
        formattedTime: '02:00',
        title: 'Dragon Kill',
        description: 'Dragon killed',
        team: 'ORDER',
        metadata: { dragonType: 'Fire', killerChamp: 'Darius' },
      },
      {
        id: 'diff-baron',
        type: 'BARON_KILL',
        gameTime: 1200,
        formattedTime: '20:00',
        title: 'Baron Kill',
        description: 'Baron killed',
        team: 'ORDER',
        metadata: { killerChamp: 'Darius' },
      },
    ]

    ingestDiffEvents(events)
    expect(activeAlert.value).not.toBeNull()
    expect(activeAlert.value?.type).toBe('DRAGON')
    expect(activeAlert.value?.title).toContain('DRAGON FIRE')

    dismissCurrentAlert()
    expect(activeAlert.value?.type).toBe('BARON')
    expect(activeAlert.value?.title).toBe('BARON NASHOR SÉCURISÉ')
  })

  it('filters out minor items and only triggers alerts for major power spikes (>= 2500g)', () => {
    const { activeAlert, ingestDiffEvents } = useFlashAlerts()

    const cheapItemEvent: GameDiffEvent = {
      id: 'diff-cheap-item',
      type: 'ITEM_PURCHASE',
      gameTime: 300,
      formattedTime: '05:00',
      title: 'Item',
      description: 'Long Sword',
      team: 'ORDER',
      metadata: {
        championName: 'Darius',
        item: { itemID: 1036, displayName: 'Épée longue', price: 350, iconUrl: '' },
      },
    }

    ingestDiffEvents([cheapItemEvent])
    expect(activeAlert.value).toBeNull()

    const majorItemEvent: GameDiffEvent = {
      id: 'diff-major-item',
      type: 'ITEM_PURCHASE',
      gameTime: 900,
      formattedTime: '15:00',
      title: 'Major Item',
      description: 'Infinity Edge',
      team: 'ORDER',
      metadata: {
        championName: 'Jinx',
        item: { itemID: 3031, displayName: "Lame d'infini", price: 3400, iconUrl: '' },
      },
    }

    ingestDiffEvents([majorItemEvent])
    expect(activeAlert.value).not.toBeNull()
    expect(activeAlert.value?.type).toBe('ITEM')
    expect(activeAlert.value?.title).toContain("LAME D'INFINI")
  })

  it('toggles audio mute status correctly', () => {
    const { isAudioMuted, toggleAudioMute } = useFlashAlerts()
    expect(isAudioMuted.value).toBe(false)
    toggleAudioMute()
    expect(isAudioMuted.value).toBe(true)
    toggleAudioMute()
    expect(isAudioMuted.value).toBe(false)
  })

  it('clears active and queued alerts when leaving a game', () => {
    const { activeAlert, alertQueue, triggerDemoAlert, clearAlerts } = useFlashAlerts()
    triggerDemoAlert('BARON')
    triggerDemoAlert('DRAGON')
    expect(alertQueue.value).toHaveLength(1)

    clearAlerts()
    expect(activeAlert.value).toBeNull()
    expect(alertQueue.value).toHaveLength(0)

    // The old game timer must not dismiss a new session's alert.
    vi.advanceTimersByTime(4000)
    triggerDemoAlert('ITEM')
    vi.advanceTimersByTime(1000)
    expect(activeAlert.value?.type).toBe('ITEM')
    clearAlerts()
  })

  it('triggers demo alerts for each major event type', () => {
    const { activeAlert, triggerDemoAlert, dismissCurrentAlert } = useFlashAlerts()

    const types = [
      'DRAGON',
      'BARON',
      'ITEM',
      'ACE',
      'KILL',
      'FIRST_BLOOD',
      'MULTIKILL',
      'KILL_STREAK',
      'DOMINATING',
      'GAME_END',
      'EXECUTE',
    ] as const
    for (const t of types) {
      triggerDemoAlert(t)
      expect(activeAlert.value?.type).toBe(t)
      dismissCurrentAlert()
    }
  })

  it('correctly ingests and maps sound keys for multikill, first blood, and streaks', () => {
    const { activeAlert, ingestDiffEvents, dismissCurrentAlert } = useFlashAlerts()

    const events: GameDiffEvent[] = [
      {
        id: 'diff-fb',
        type: 'FIRST_BLOOD',
        gameTime: 180,
        formattedTime: '03:00',
        title: 'PREMIER SANG !',
        description: 'First blood',
        team: 'ORDER',
        metadata: { killerChampion: 'Darius', victimChampion: 'Garen', soundKey: 'firstblood' },
      },
      {
        id: 'diff-multi',
        type: 'MULTIKILL',
        gameTime: 400,
        formattedTime: '06:40',
        title: 'DOUBLE KILL !',
        description: 'Double kill',
        team: 'ORDER',
        metadata: { killerChampion: 'Jinx', streak: 2, soundKey: 'doublekill' },
      },
      {
        id: 'diff-streak',
        type: 'KILL_STREAK',
        gameTime: 500,
        formattedTime: '08:20',
        title: 'SÉRIE DE MEURTRES',
        description: 'Killing Spree',
        team: 'ORDER',
        metadata: { killerChampion: 'Ahri', streak: 3, soundKey: 'killingspree' },
      },
      {
        id: 'diff-execute',
        type: 'EXECUTE',
        gameTime: 600,
        formattedTime: '10:00',
        title: 'MORT HUMILIANTE',
        description: 'Executed',
        team: 'CHAOS',
        metadata: { victimChampion: 'Yasuo', soundKey: 'humiliating_defeat' },
      },
    ]

    ingestDiffEvents(events)

    expect(activeAlert.value?.type).toBe('FIRST_BLOOD')
    expect(activeAlert.value?.soundKey).toBe('firstblood')

    dismissCurrentAlert()
    expect(activeAlert.value?.type).toBe('MULTIKILL')
    expect(activeAlert.value?.soundKey).toBe('doublekill')

    dismissCurrentAlert()
    expect(activeAlert.value?.type).toBe('KILL_STREAK')
    expect(activeAlert.value?.soundKey).toBe('killingspree')

    dismissCurrentAlert()
    expect(activeAlert.value?.type).toBe('EXECUTE')
    expect(activeAlert.value?.soundKey).toBe('humiliating_defeat')
  })
})
