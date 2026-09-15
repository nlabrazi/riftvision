import { beforeEach, describe, expect, it } from 'vitest'
import {
  SOUND_ASSETS,
  type SoundKey,
  playGameSound,
  playSynthesizedFallback,
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
    ]

    expect(Object.keys(SOUND_ASSETS)).toHaveLength(17)

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
})
