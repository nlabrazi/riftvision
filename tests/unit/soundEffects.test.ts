import { beforeEach, describe, expect, it } from 'vitest'
import {
  SOUND_ASSETS,
  type SoundKey,
  playGameSound,
  playSynthesizedFallback,
  resetSoundHistory,
  useSoundEffects,
} from '../../app/composables/useSoundEffects'

describe('useSoundEffects', () => {
  beforeEach(() => {
    const { isAudioMuted, toggleAudioMute, setVolume } = useSoundEffects()
    if (isAudioMuted.value) {
      toggleAudioMute()
    }
    setVolume(0.75)
  })

  it('contains all 17 sound assets mapped to valid paths', () => {
    const expectedKeys: SoundKey[] = [
      'firstblood',
      'doublekill',
      'triplekill',
      'multikill',
      'megakill',
      'ultrakill',
      'monsterkill',
      'ludicrouskill',
      'killingspree',
      'unstoppable',
      'godlike',
      'headshot',
      'blue_team_dominating',
      'red_team_dominating',
      'blue_team_is_the_winner',
      'red_team_is_the_winner',
      'humiliating_defeat',
      'beware',
    ]

    expect(Object.keys(SOUND_ASSETS)).toHaveLength(18)

    for (const key of expectedKeys) {
      expect(SOUND_ASSETS[key]).toBeDefined()
      expect(typeof SOUND_ASSETS[key]).toBe('string')
      expect(SOUND_ASSETS[key].length).toBeGreaterThan(0)
    }
  })

  it('toggles audio mute correctly', () => {
    const { isAudioMuted, toggleAudioMute } = useSoundEffects()
    expect(isAudioMuted.value).toBe(false)
    toggleAudioMute()
    expect(isAudioMuted.value).toBe(true)
    toggleAudioMute()
    expect(isAudioMuted.value).toBe(false)
  })

  it('clamps volume properly between 0 and 1', () => {
    const { audioVolume, setVolume } = useSoundEffects()
    setVolume(0.5)
    expect(audioVolume.value).toBe(0.5)

    setVolume(1.5)
    expect(audioVolume.value).toBe(1)

    setVolume(-0.2)
    expect(audioVolume.value).toBe(0)
  })

  it('does not attempt to play when audio is muted', () => {
    const { isAudioMuted, toggleAudioMute } = useSoundEffects()
    toggleAudioMute()
    expect(isAudioMuted.value).toBe(true)

    const played = playGameSound('firstblood')
    expect(played).toBe(false)
  })

  it('handles synthesized fallbacks gracefully in node environment without throwing', () => {
    expect(() => {
      playSynthesizedFallback('objective')
      playSynthesizedFallback('danger')
      playSynthesizedFallback('kill')
      playSynthesizedFallback('item')
      playSynthesizedFallback('ace')
    }).not.toThrow()
  })

  it('debounces identical sound effect within 1.5s in browser environment', () => {
    const originalWindow = globalThis.window
    try {
      let playCalled = 0
      globalThis.window = {
        AudioContext: class {},
      } as unknown as Window & typeof globalThis

      // @ts-expect-error test mock
      globalThis.Audio = class {
        volume = 1
        play() {
          playCalled++
          return Promise.resolve()
        }
      }

      resetSoundHistory()
      const first = playGameSound('headshot')
      expect(first).toBe(true)
      expect(playCalled).toBe(1)

      // Immediate second call with same key should be blocked by debounce
      const second = playGameSound('headshot')
      expect(second).toBe(false)
      expect(playCalled).toBe(1)

      // Different key should be allowed
      const differentKey = playGameSound('doublekill')
      expect(differentKey).toBe(true)
      expect(playCalled).toBe(2)

      // After resetSoundHistory, same key can be played again
      resetSoundHistory()
      const afterReset = playGameSound('headshot')
      expect(afterReset).toBe(true)
      expect(playCalled).toBe(3)
    } finally {
      globalThis.window = originalWindow
      // @ts-expect-error restore
      delete globalThis.Audio
    }
  })
})
