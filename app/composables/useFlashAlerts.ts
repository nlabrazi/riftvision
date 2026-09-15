import { ref } from 'vue'
import type { GameDiffEvent, SoundEffectKey } from '#shared/types/diff'
import type { TeamType } from '#shared/types/riot'
import { getChampionIconUrl, getItemIconUrl, getObjectiveIconUrl } from '#shared/utils/ddragon'
import {
  isAudioMuted,
  playGameSound,
  playSynthesizedFallback,
  toggleAudioMute,
} from './useSoundEffects'

export type FlashAlertType =
  | 'DRAGON'
  | 'BARON'
  | 'HERALD'
  | 'FIRST_BLOOD'
  | 'ACE'
  | 'KILL'
  | 'ITEM'
  | 'TURRET'
  | 'MULTIKILL'
  | 'KILL_STREAK'
  | 'DOMINATING'
  | 'GAME_END'
  | 'EXECUTE'

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
  soundKey?: SoundEffectKey
}

const activeAlert = ref<FlashAlert | null>(null)
const alertQueue = ref<FlashAlert[]>([])

let activeTimeout: ReturnType<typeof setTimeout> | null = null

export function playSynthesizedSound(
  soundType: 'objective' | 'danger' | 'kill' | 'item' | 'ace' = 'kill',
) {
  playSynthesizedFallback(soundType)
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
    if (alert.soundKey) {
      playGameSound(alert.soundKey)
    } else {
      playSynthesizedSound(alert.soundType || 'kill')
    }

    activeTimeout = setTimeout(() => {
      dismissCurrentAlert()
    }, alert.durationMs || 4000)
  }

  interface EventAlertMeta {
    killerChampion?: string
    victimChampion?: string
    killerChamp?: string
    dragonType?: string
    lane?: string
    streak?: number
    soundKey?: SoundEffectKey
    isSoloKill?: boolean
    item?: { price: number; displayName: string; iconUrl: string }
    championName?: string
  }

  /**
   * Translates real-time diff events into prioritized flash alerts
   */
  function ingestDiffEvents(events: GameDiffEvent[]) {
    for (const e of events) {
      const meta = e.metadata as EventAlertMeta | undefined

      if (e.type === 'FIRST_BLOOD') {
        const killerChamp = meta?.killerChampion || 'Tueur'
        const victimChamp = meta?.victimChampion
        triggerAlert({
          id: e.id,
          type: 'FIRST_BLOOD',
          title: 'PREMIER SANG ! (FIRST BLOOD)',
          subtitle: victimChamp
            ? `${killerChamp} élimine ${victimChamp} pour le Premier Sang`
            : `${killerChamp} a versé le Premier Sang !`,
          team: e.team,
          iconUrl: killerChamp ? getChampionIconUrl(killerChamp) : undefined,
          victimIconUrl: victimChamp ? getChampionIconUrl(victimChamp) : undefined,
          durationMs: 4500,
          soundKey: 'firstblood',
        })
      } else if (e.type === 'MULTIKILL') {
        const killerChamp = meta?.killerChampion || 'Champion'
        const streak = meta?.streak || 2
        const soundKey = (meta?.soundKey as SoundEffectKey) || 'doublekill'
        triggerAlert({
          id: e.id,
          type: 'MULTIKILL',
          title: e.title,
          subtitle: `${killerChamp} enchaîne ${streak} éliminations rapides !`,
          team: e.team,
          iconUrl: killerChamp ? getChampionIconUrl(killerChamp) : undefined,
          durationMs: 4500,
          soundKey,
        })
      } else if (e.type === 'KILL_STREAK') {
        const killerChamp = meta?.killerChampion || 'Champion'
        const soundKey = (meta?.soundKey as SoundEffectKey) || 'killingspree'
        triggerAlert({
          id: e.id,
          type: 'KILL_STREAK',
          title: e.title,
          subtitle: e.description,
          team: e.team,
          iconUrl: killerChamp ? getChampionIconUrl(killerChamp) : undefined,
          durationMs: 4500,
          soundKey,
        })
      } else if (e.type === 'EXECUTE') {
        const victimChamp = meta?.victimChampion || 'Champion'
        triggerAlert({
          id: e.id,
          type: 'EXECUTE',
          title: 'MORT HUMILIANTE',
          subtitle: `${victimChamp} s'est fait exécuter par l'environnement !`,
          team: e.team,
          victimIconUrl: victimChamp ? getChampionIconUrl(victimChamp) : undefined,
          durationMs: 4000,
          soundKey: 'humiliating_defeat',
        })
      } else if (e.type === 'DOMINATING') {
        const soundKey =
          (meta?.soundKey as SoundEffectKey) ||
          (e.team === 'ORDER' ? 'blue_team_dominating' : 'red_team_dominating')
        triggerAlert({
          id: e.id,
          type: 'DOMINATING',
          title: e.title,
          subtitle: e.description,
          team: e.team,
          durationMs: 5000,
          soundKey,
        })
      } else if (e.type === 'GAME_END') {
        const soundKey =
          (meta?.soundKey as SoundEffectKey) ||
          (e.team === 'ORDER' ? 'blue_team_is_the_winner' : 'red_team_is_the_winner')
        triggerAlert({
          id: e.id,
          type: 'GAME_END',
          title: e.title,
          subtitle: e.description,
          team: e.team,
          durationMs: 6000,
          soundKey,
        })
      } else if (e.type === 'BARON_KILL') {
        const killerChamp = meta?.killerChamp || 'Équipe'
        const soundKey =
          (meta?.soundKey as SoundEffectKey) ||
          (e.team === 'ORDER' ? 'blue_team_dominating' : 'red_team_dominating')
        triggerAlert({
          id: e.id,
          type: 'BARON',
          title: 'BARON NASHOR SÉCURISÉ',
          subtitle: `${killerChamp} a abattu le Baron Nashor !`,
          team: e.team,
          iconUrl: getObjectiveIconUrl('baron', e.team || 'ORDER'),
          durationMs: 5000,
          soundKey,
          soundType: 'objective',
        })
      } else if (e.type === 'DRAGON_KILL') {
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
      } else if (e.type === 'ACE') {
        const soundKey =
          (meta?.soundKey as SoundEffectKey) ||
          (e.team === 'ORDER' ? 'blue_team_dominating' : 'red_team_dominating')
        triggerAlert({
          id: e.id,
          type: 'ACE',
          title: e.title || 'ACE ENNEMI ÉLIMINÉ !',
          subtitle: e.description || 'Tous les champions adverses sont tombés !',
          team: e.team,
          durationMs: 4500,
          soundKey,
          soundType: 'ace',
        })
      } else if (e.type === 'CHAMPION_KILL') {
        const killerChamp = meta?.killerChampion
        const victimChamp = meta?.victimChampion
        const soundKey = meta?.soundKey as SoundEffectKey | undefined
        triggerAlert({
          id: e.id,
          type: 'KILL',
          title: meta?.isSoloKill
            ? `SOLO KILL : ${killerChamp || 'Champion'} ⚔️ ${victimChamp || 'Ennemi'}`
            : `${killerChamp || 'Champion'} ⚔️ ${victimChamp || 'Ennemi'}`,
          subtitle: `${killerChamp || 'Le tueur'} a éliminé ${victimChamp || "l'adversaire"}${meta?.isSoloKill ? ' en duel' : ''}`,
          team: e.team,
          iconUrl: killerChamp ? getChampionIconUrl(killerChamp) : undefined,
          victimIconUrl: victimChamp ? getChampionIconUrl(victimChamp) : undefined,
          durationMs: 3500,
          soundKey,
          soundType: 'kill',
        })
      } else if (e.type === 'TURRET_DESTROYED') {
        const lane = meta?.lane || ''
        triggerAlert({
          id: e.id,
          type: 'TURRET',
          title: `TOURELLE ${lane} ANÉANTIE`,
          subtitle: e.description,
          team: e.team,
          iconUrl: getObjectiveIconUrl('tower', e.team || 'ORDER'),
          durationMs: 3500,
          soundType: 'danger',
        })
      } else if (e.type === 'ITEM_PURCHASE') {
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
   * Helper to trigger a demo alert for testing visual impact and audio
   */
  function triggerDemoAlert(type: FlashAlertType, customSoundKey?: SoundEffectKey) {
    if (type === 'FIRST_BLOOD') {
      triggerAlert({
        id: `demo-fb-${Date.now()}`,
        type: 'FIRST_BLOOD',
        title: 'PREMIER SANG ! (FIRST BLOOD)',
        subtitle: 'Darius a terrassé Garen pour le premier sang !',
        team: 'ORDER',
        iconUrl: getChampionIconUrl('Darius'),
        victimIconUrl: getChampionIconUrl('Garen'),
        durationMs: 4500,
        soundKey: 'firstblood',
      })
    } else if (type === 'MULTIKILL') {
      const soundKey = customSoundKey || 'doublekill'
      const labels: Record<string, string> = {
        doublekill: 'DOUBLE KILL !',
        triplekill: 'TRIPLE KILL !',
        multikill: 'MULTI KILL !',
        megakill: 'QUADRA KILL (MEGA KILL) !',
        ultrakill: 'PENTAKILL (ULTRA KILL) !',
        monsterkill: 'MONSTER KILL !',
      }
      triggerAlert({
        id: `demo-multi-${Date.now()}`,
        type: 'MULTIKILL',
        title: labels[soundKey] || 'DOUBLE KILL !',
        subtitle: 'Jinx décime les rangs ennemis en quelques secondes !',
        team: 'ORDER',
        iconUrl: getChampionIconUrl('Jinx'),
        durationMs: 4500,
        soundKey,
      })
    } else if (type === 'KILL_STREAK') {
      const soundKey = customSoundKey || 'killingspree'
      const labels: Record<string, string> = {
        killingspree: 'SÉRIE DE MEURTRES (KILLING SPREE)',
        unstoppable: 'INARRÊTABLE (UNSTOPPABLE)',
        godlike: 'LÉGENDAIRE (GODLIKE)',
        ludicrouskill: 'CARNAGE TOTAL (LUDICROUS KILL)',
      }
      triggerAlert({
        id: `demo-streak-${Date.now()}`,
        type: 'KILL_STREAK',
        title: labels[soundKey] || 'SÉRIE DE MEURTRES',
        subtitle: 'Ahri enchaîne les victimes sans jamais tomber !',
        team: 'ORDER',
        iconUrl: getChampionIconUrl('Ahri'),
        durationMs: 4500,
        soundKey,
      })
    } else if (type === 'DOMINATING') {
      const soundKey = customSoundKey || 'blue_team_dominating'
      const isBlue = soundKey === 'blue_team_dominating'
      triggerAlert({
        id: `demo-dominating-${Date.now()}`,
        type: 'DOMINATING',
        title: isBlue ? "L'ÉQUIPE BLEUE DOMINE LA PARTIE !" : "L'ÉQUIPE ROUGE DOMINE LA PARTIE !",
        subtitle: 'Contrôle écrasant de la carte et des objectifs !',
        team: isBlue ? 'ORDER' : 'CHAOS',
        durationMs: 5000,
        soundKey,
      })
    } else if (type === 'GAME_END') {
      const soundKey = customSoundKey || 'blue_team_is_the_winner'
      const isBlue = soundKey === 'blue_team_is_the_winner'
      triggerAlert({
        id: `demo-gameend-${Date.now()}`,
        type: 'GAME_END',
        title: isBlue ? "VICTOIRE DE L'ÉQUIPE BLEUE !" : "VICTOIRE DE L'ÉQUIPE ROUGE !",
        subtitle: "Le Nexus adverse est anéanti. Fin de l'affrontement !",
        team: isBlue ? 'ORDER' : 'CHAOS',
        durationMs: 6000,
        soundKey,
      })
    } else if (type === 'EXECUTE') {
      triggerAlert({
        id: `demo-execute-${Date.now()}`,
        type: 'EXECUTE',
        title: 'MORT HUMILIANTE',
        subtitle: 'Yasuo a été abattu par la tourelle sans adversaire !',
        team: 'CHAOS',
        victimIconUrl: getChampionIconUrl('Yasuo'),
        durationMs: 4000,
        soundKey: 'humiliating_defeat',
      })
    } else if (type === 'DRAGON') {
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
        soundKey: 'blue_team_dominating',
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
        soundKey: 'blue_team_dominating',
        soundType: 'ace',
      })
    } else {
      // Standard or Headshot Kill
      const soundKey = customSoundKey === 'headshot' ? 'headshot' : undefined
      triggerAlert({
        id: `demo-kill-${Date.now()}`,
        type: 'KILL',
        title: soundKey === 'headshot' ? 'SOLO KILL : CAITLYN ⚔️ JINX' : 'DARIUS ⚔️ GAREN',
        subtitle:
          soundKey === 'headshot'
            ? 'Caitlyn a abattu Jinx en tir de précision solo !'
            : 'Darius a terrassé Garen sur la voie du haut !',
        team: 'ORDER',
        iconUrl: getChampionIconUrl(soundKey === 'headshot' ? 'Caitlyn' : 'Darius'),
        victimIconUrl: getChampionIconUrl(soundKey === 'headshot' ? 'Jinx' : 'Garen'),
        durationMs: 3800,
        soundKey,
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
