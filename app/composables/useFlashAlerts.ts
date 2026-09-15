import { ref } from 'vue'
import type { GameDiffEvent } from '#shared/types/diff'
import type { TeamType } from '#shared/types/riot'
import { getChampionIconUrl, getItemIconUrl, getObjectiveIconUrl } from '#shared/utils/ddragon'

export type FlashAlertType =
  | 'DRAGON'
  | 'BARON'
  | 'HERALD'
  | 'FIRST_BLOOD'
  | 'ACE'
  | 'KILL'
  | 'ITEM'
  | 'TURRET'

export interface FlashAlert {
  id: string
  type: FlashAlertType
  title: string
  subtitle: string
  team?: TeamType
  iconUrl?: string
  victimIconUrl?: string
  actorName?: string
  targetName?: string
  durationMs: number
  soundType?: 'objective' | 'danger' | 'kill' | 'item' | 'ace'
}

const activeAlert = ref<FlashAlert | null>(null)
const isAudioMuted = ref(false)
const alertQueue = ref<FlashAlert[]>([])

let activeTimeout: ReturnType<typeof setTimeout> | null = null
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

export function playSynthesizedSound(
  soundType: 'objective' | 'danger' | 'kill' | 'item' | 'ace' = 'kill',
) {
  if (isAudioMuted.value) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime

    if (soundType === 'objective') {
      // Powerful brass-like dual tone (Major chord)
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'triangle'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(440, now) // A4
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3) // A5
      osc2.frequency.setValueAtTime(554.37, now) // C#5

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.6)
      osc2.stop(now + 0.6)
    } else if (soundType === 'ace') {
      // Fanfare ascending arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
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
    } else if (soundType === 'item') {
      // Crisp metallic coin ping (High chime)
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
    } else if (soundType === 'danger') {
      // Deep ominous bass drone
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
      // Standard punchy hit / kill chime
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
    // Ignore audio failures if browser restricts autoplay
  }
}

export function useFlashAlerts() {
  function clearAlerts() {
    if (activeTimeout) clearTimeout(activeTimeout)
    activeTimeout = null
    alertQueue.value = []
    activeAlert.value = null
  }

  function dismissCurrentAlert() {
    if (activeTimeout) {
      clearTimeout(activeTimeout)
      activeTimeout = null
    }
    activeAlert.value = null

    // Process next queued alert if available
    if (alertQueue.value.length > 0) {
      const next = alertQueue.value.shift()
      if (next) {
        triggerAlert(next)
      }
    }
  }

  function triggerAlert(alert: FlashAlert) {
    if (activeAlert.value) {
      // Put in queue if current alert is playing
      alertQueue.value.push(alert)
      return
    }

    activeAlert.value = alert
    playSynthesizedSound(alert.soundType || 'kill')

    activeTimeout = setTimeout(() => {
      dismissCurrentAlert()
    }, alert.durationMs || 4000)
  }

  function toggleAudioMute() {
    isAudioMuted.value = !isAudioMuted.value
  }

  /**
   * Translates real-time diff events into prioritized flash alerts
   */
  function ingestDiffEvents(events: GameDiffEvent[]) {
    for (const e of events) {
      if (e.type === 'BARON_KILL') {
        const killerChamp = (e.metadata as { killerChamp?: string })?.killerChamp || 'Équipe'
        triggerAlert({
          id: e.id,
          type: 'BARON',
          title: 'BARON NASHOR SÉCURISÉ',
          subtitle: `${killerChamp} a abattu le Baron Nashor !`,
          team: e.team,
          iconUrl: getObjectiveIconUrl('baron', e.team || 'ORDER'),
          durationMs: 5000,
          soundType: 'objective',
        })
      } else if (e.type === 'DRAGON_KILL') {
        const meta = e.metadata as { dragonType?: string; killerChamp?: string }
        const drakeType = meta?.dragonType || 'Élémentaire'
        const killerChamp = meta?.killerChamp || 'Équipe'
        triggerAlert({
          id: e.id,
          type: 'DRAGON',
          title: `DRAGON ${drakeType.toUpperCase()}`,
          subtitle: `${killerChamp} a sécurisé le Dragon !`,
          team: e.team,
          iconUrl: getObjectiveIconUrl('dragon', e.team || 'ORDER'),
          durationMs: 4500,
          soundType: 'objective',
        })
      } else if (e.type === 'HERALD_KILL') {
        triggerAlert({
          id: e.id,
          type: 'HERALD',
          title: 'HÉRAUT DE LA FAILLE ÉLIMINÉ',
          subtitle: e.description,
          team: e.team,
          iconUrl: getObjectiveIconUrl('herald', e.team || 'ORDER'),
          durationMs: 4000,
          soundType: 'objective',
        })
      } else if (e.type === 'FIRST_BLOOD') {
        const meta = e.metadata as { killerChampion?: string; victimChampion?: string }
        triggerAlert({
          id: e.id,
          type: 'FIRST_BLOOD',
          title: 'PREMIER SANG ! (FIRST BLOOD)',
          subtitle: `${meta?.killerChampion || 'Tueur'} élimine ${meta?.victimChampion || 'Victime'}`,
          team: e.team,
          iconUrl: meta?.killerChampion ? getChampionIconUrl(meta.killerChampion) : undefined,
          victimIconUrl: meta?.victimChampion ? getChampionIconUrl(meta.victimChampion) : undefined,
          durationMs: 4500,
          soundType: 'kill',
        })
      } else if (e.type === 'ACE') {
        triggerAlert({
          id: e.id,
          type: 'ACE',
          title: 'ACE ENNEMI ÉLIMINÉ !',
          subtitle: 'Tous les champions adverses sont tombés !',
          team: e.team,
          durationMs: 4500,
          soundType: 'ace',
        })
      } else if (e.type === 'CHAMPION_KILL') {
        const meta = e.metadata as { killerChampion?: string; victimChampion?: string }
        triggerAlert({
          id: e.id,
          type: 'KILL',
          title: `${meta?.killerChampion || 'Champion'} ⚔️ ${meta?.victimChampion || 'Ennemi'}`,
          subtitle: `${meta?.killerChampion || 'Le tueur'} a éliminé ${meta?.victimChampion || "l'adversaire"}`,
          team: e.team,
          iconUrl: meta?.killerChampion ? getChampionIconUrl(meta.killerChampion) : undefined,
          victimIconUrl: meta?.victimChampion ? getChampionIconUrl(meta.victimChampion) : undefined,
          durationMs: 3500,
          soundType: 'kill',
        })
      } else if (e.type === 'TURRET_DESTROYED') {
        const meta = e.metadata as { lane?: string; killerChamp?: string }
        triggerAlert({
          id: e.id,
          type: 'TURRET',
          title: `TOURELLE ${meta?.lane || ''} ANÉANTIE`,
          subtitle: e.description,
          team: e.team,
          iconUrl: getObjectiveIconUrl('tower', e.team || 'ORDER'),
          durationMs: 3500,
          soundType: 'danger',
        })
      } else if (e.type === 'ITEM_PURCHASE') {
        const meta = e.metadata as {
          item?: { price: number; displayName: string; iconUrl: string }
          championName?: string
        }
        // Only trigger prominent flash alerts for major items (>= 2500g)
        if (meta?.item && meta.item.price >= 2500) {
          triggerAlert({
            id: e.id,
            type: 'ITEM',
            title: `POWER SPIKE : ${meta.item.displayName.toUpperCase()}`,
            subtitle: `${meta.championName || 'Joueur'} a complété ${meta.item.displayName} (${meta.item.price}g)`,
            team: e.team,
            iconUrl: meta.item.iconUrl,
            durationMs: 4000,
            soundType: 'item',
          })
        }
      }
    }
  }

  /**
   * Helper to trigger a demo alert for testing visual impact
   */
  function triggerDemoAlert(type: FlashAlertType) {
    if (type === 'DRAGON') {
      triggerAlert({
        id: `demo-dragon-${Date.now()}`,
        type: 'DRAGON',
        title: 'DRAGON CHIMTECH SÉCURISÉ',
        subtitle: "L'Équipe Bleue s'empare du Dragon Chimtech !",
        team: 'ORDER',
        iconUrl: getObjectiveIconUrl('dragon', 'ORDER'),
        durationMs: 4500,
        soundType: 'objective',
      })
    } else if (type === 'BARON') {
      triggerAlert({
        id: `demo-baron-${Date.now()}`,
        type: 'BARON',
        title: 'BARON NASHOR ÉLIMINÉ',
        subtitle: "Darius a sécurisé le Baron Nashor pour l'Équipe Bleue !",
        team: 'ORDER',
        iconUrl: getObjectiveIconUrl('baron', 'ORDER'),
        durationMs: 5000,
        soundType: 'objective',
      })
    } else if (type === 'ITEM') {
      triggerAlert({
        id: `demo-item-${Date.now()}`,
        type: 'ITEM',
        title: "POWER SPIKE : LAME D'INFINI",
        subtitle: "Jinx a complété Lame d'infini (3400g) !",
        team: 'ORDER',
        iconUrl: getItemIconUrl(3031),
        durationMs: 4000,
        soundType: 'item',
      })
    } else if (type === 'ACE') {
      triggerAlert({
        id: `demo-ace-${Date.now()}`,
        type: 'ACE',
        title: "ACE ! TOUTE L'ÉQUIPE ENNEMIE EST DÉTRUITE",
        subtitle: 'Tous les champions adverses sont en temps de réapparition !',
        team: 'ORDER',
        durationMs: 4500,
        soundType: 'ace',
      })
    } else {
      triggerAlert({
        id: `demo-kill-${Date.now()}`,
        type: 'KILL',
        title: 'DARIUS ⚔️ GAREN',
        subtitle: 'Darius a terrassé Garen sur la voie du haut !',
        team: 'ORDER',
        iconUrl: getChampionIconUrl('Darius'),
        victimIconUrl: getChampionIconUrl('Garen'),
        durationMs: 3800,
        soundType: 'kill',
      })
    }
  }

  return {
    activeAlert,
    isAudioMuted,
    alertQueue,
    dismissCurrentAlert,
    clearAlerts,
    triggerAlert,
    toggleAudioMute,
    ingestDiffEvents,
    triggerDemoAlert,
  }
}
