import { ref } from 'vue'

// Import all 17 WAV sound assets
import blueTeamDominatingUrl from '../assets/sounds/blue_team_dominating.wav'
import blueTeamWinnerUrl from '../assets/sounds/blue_team_is_the_winner.wav'
import doubleKillUrl from '../assets/sounds/doublekill.wav'
import firstBloodUrl from '../assets/sounds/firstblood.wav'
import godlikeUrl from '../assets/sounds/godlike.wav'
import headshotUrl from '../assets/sounds/headshot.wav'
import humiliatingDefeatUrl from '../assets/sounds/Humiliating_defeat.wav'
import killingSpreeUrl from '../assets/sounds/killingspree.wav'
import ludicrousKillUrl from '../assets/sounds/LudicrousKill.wav'
import megaKillUrl from '../assets/sounds/megakill.wav'
import monsterKillUrl from '../assets/sounds/monsterkill.wav'
import multiKillUrl from '../assets/sounds/multikill.wav'
import redTeamDominatingUrl from '../assets/sounds/red_team_dominating.wav'
import redTeamWinnerUrl from '../assets/sounds/red_team_is_the_winner.wav'
import tripleKillUrl from '../assets/sounds/triplekill.wav'
import ultraKillUrl from '../assets/sounds/ultrakill.wav'
import type { SoundEffectKey } from '#shared/types/diff'
import unstoppableUrl from '../assets/sounds/unstoppable.wav'

export type SoundKey =
  | SoundEffectKey
  | 'firstblood'
  | 'doublekill'
  | 'triplekill'
  | 'multikill'
  | 'megakill'
  | 'ultrakill'
  | 'monsterkill'
  | 'ludicrouskill'
  | 'killingspree'
  | 'unstoppable'
  | 'godlike'
  | 'headshot'
  | 'blue_team_dominating'
  | 'red_team_dominating'
  | 'blue_team_is_the_winner'
  | 'red_team_is_the_winner'
  | 'humiliating_defeat'

export const SOUND_ASSETS: Record<SoundKey, string> = {
  firstblood: firstBloodUrl,
  doublekill: doubleKillUrl,
  triplekill: tripleKillUrl,
  multikill: multiKillUrl,
  megakill: megaKillUrl,
  ultrakill: ultraKillUrl,
  monsterkill: monsterKillUrl,
  ludicrouskill: ludicrousKillUrl,
  killingspree: killingSpreeUrl,
  unstoppable: unstoppableUrl,
  godlike: godlikeUrl,
  headshot: headshotUrl,
  blue_team_dominating: blueTeamDominatingUrl,
  red_team_dominating: redTeamDominatingUrl,
  blue_team_is_the_winner: blueTeamWinnerUrl,
  red_team_is_the_winner: redTeamWinnerUrl,
  humiliating_defeat: humiliatingDefeatUrl,
}

export const isAudioMuted = ref(false)
export const audioVolume = ref(0.75)
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      audioCtx = new AudioCtx()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * Fallback synthesizer using Web Audio API oscillators when audio file cannot play
 */
export function playSynthesizedFallback(
  kind: 'objective' | 'danger' | 'kill' | 'item' | 'ace' = 'kill',
) {
  if (isAudioMuted.value || typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    if (kind === 'objective') {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc1.type = 'triangle'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(440, now)
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3)
      osc2.frequency.setValueAtTime(554.37, now)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.6)
      osc2.stop(now + 0.6)
    } else if (kind === 'ace') {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, now + idx * 0.1)
        gain.gain.setValueAtTime(0.2, now + idx * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.1)
        osc.stop(now + idx * 0.1 + 0.35)
      })
    } else if (kind === 'item') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, now)
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.4)
    } else if (kind === 'danger') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(130, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.5)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.7)
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.35)
    }
  } catch {
    // Autoplay restrictions
  }
}

/**
 * Plays a game sound effect from the 17 WAV files with automatic fallback
 */
export function playGameSound(key: SoundKey | string): boolean {
  if (isAudioMuted.value || typeof window === 'undefined') return false

  const normalizedKey = key.toLowerCase() as SoundKey
  const soundUrl = SOUND_ASSETS[normalizedKey]

  if (!soundUrl) {
    playSynthesizedFallback('kill')
    return false
  }

  try {
    const audio = new Audio(soundUrl)
    audio.volume = audioVolume.value
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to oscillator sound if HTML5 audio play fails
        playSynthesizedFallback('kill')
      })
    }
    return true
  } catch {
    playSynthesizedFallback('kill')
    return false
  }
}

export function toggleAudioMute() {
  isAudioMuted.value = !isAudioMuted.value
}

export function setVolume(volume: number) {
  audioVolume.value = Math.max(0, Math.min(1, volume))
}

export function useSoundEffects() {
  return {
    isAudioMuted,
    audioVolume,
    toggleAudioMute,
    setVolume,
    playGameSound,
    playSynthesizedFallback,
    soundAssets: SOUND_ASSETS,
  }
}
