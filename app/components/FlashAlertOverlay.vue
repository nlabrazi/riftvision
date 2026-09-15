<script setup lang="ts">
import { computed } from 'vue'
import { useFlashAlerts } from '../composables/useFlashAlerts'
import RvIcon from './RvIcon.vue'

withDefaults(defineProps<{ inline?: boolean }>(), { inline: false })
const { activeAlert, alertQueue, dismissCurrentAlert } = useFlashAlerts()
const accent = computed(() => {
  if (activeAlert.value?.type === 'BARON' || activeAlert.value?.type === 'HERALD') return '#b694e8'
  if (activeAlert.value?.type === 'DRAGON' || activeAlert.value?.type === 'ITEM') return '#d9b971'
  return activeAlert.value?.team === 'CHAOS' ? '#ed8291' : '#6dcada'
})
</script>

<template>
  <div class="flash-region" :class="{ 'flash-region--inline': inline }" aria-live="polite" aria-atomic="true">
    <Transition name="flash">
      <article v-if="activeAlert" :key="activeAlert.id" data-testid="flash-alert-overlay" class="flash-card" :style="{ '--alert-accent': accent }">
        <div class="flash-heading">
          <span class="flash-category"><RvIcon name="activity" :size="13" />ALERTE ÉVÉNEMENT MAJEUR</span>
          <button type="button" data-testid="dismiss-alert-btn" class="rv-icon-button" aria-label="Masquer l’alerte" title="Masquer l’alerte" @click="dismissCurrentAlert"><RvIcon name="close" :size="15" /></button>
        </div>
        <div class="flash-content">
          <div v-if="activeAlert.iconUrl" class="flash-avatar" :class="{ 'flash-avatar--objective': ['BARON', 'DRAGON', 'HERALD', 'TURRET'].includes(activeAlert.type) }">
            <img :src="activeAlert.iconUrl" alt="" />
            <img v-if="activeAlert.victimIconUrl" :src="activeAlert.victimIconUrl" alt="" class="flash-victim" />
          </div>
          <div class="flash-copy">
            <h3>{{ activeAlert.title.replace('⚔️', '→') }}</h3>
            <p>{{ activeAlert.subtitle }}</p>
          </div>
        </div>
        <div class="flash-meta">
          <span v-if="activeAlert.team" class="flash-team" :class="{ 'flash-team--red': activeAlert.team === 'CHAOS' }">{{ activeAlert.team === 'CHAOS' ? 'Équipe Rouge' : 'Équipe Bleue' }}</span>
          <span v-if="activeAlert.id.startsWith('demo-')">Simulation</span>
          <span v-if="alertQueue.length">{{ alertQueue.length }} en attente</span>
        </div>
        <div class="flash-countdown" aria-hidden="true"><span :style="{ animationDuration: `${activeAlert.durationMs}ms` }"></span></div>
      </article>
    </Transition>
  </div>
</template>

<style scoped>
.flash-region { position: fixed; bottom: 24px; right: 24px; width: min(400px, calc(100vw - 32px)); z-index: 60; pointer-events: none; }
.flash-region--inline { position: relative; inset: auto; width: 100%; z-index: 35; }
.flash-card { position: relative; overflow: hidden; border: 1px solid color-mix(in srgb, var(--alert-accent) 45%, transparent); border-left: 3px solid var(--alert-accent); border-radius: 5px; background: linear-gradient(110deg, color-mix(in srgb, var(--alert-accent) 9%, #0c1723), #0c1723); padding: 12px 14px 14px; box-shadow: 0 8px 28px #0004; pointer-events: auto; }
.flash-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.flash-category { display: flex; gap: 6px; align-items: center; color: var(--alert-accent); font: 700 9px 'Rajdhani', sans-serif; letter-spacing: 0.09em; }
.flash-heading button { width: 26px; min-height: 26px; padding: 4px; }
.flash-content { display: flex; align-items: flex-start; gap: 12px; }
.flash-avatar { width: 40px; height: 40px; flex-shrink: 0; position: relative; border: 1px solid #c8aa6e45; border-radius: 4px; background: #0b121c; }
.flash-avatar > img { width: 100%; height: 100%; object-fit: cover; border-radius: 3px; }
.flash-avatar--objective > img { object-fit: contain; padding: 5px; }
.flash-avatar > .flash-victim { position: absolute; right: -5px; bottom: -5px; width: 22px; height: 22px; filter: grayscale(1); border: 1px solid #d57889; }
.flash-copy { min-width: 0; }
.flash-copy h3 { color: #f0e8d8; font: 700 17px/1.2 'Rajdhani', sans-serif; overflow-wrap: anywhere; }
.flash-copy p { color: #aebaca; font-size: 11px; line-height: 1.55; margin-top: 7px; }
.flash-meta { display: flex; align-items: center; gap: 10px; color: #8c9bad; margin-top: 12px; font: 500 11px 'Rajdhani', sans-serif; }
.flash-team { color: #77c8d7; }
.flash-team--red { color: #e28a97; }
.flash-countdown { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #ffffff06; }
.flash-countdown span { display: block; height: 100%; background: var(--alert-accent); transform-origin: left; animation: countdown linear forwards; }
.flash-enter-active, .flash-leave-active { transition: opacity 160ms, transform 160ms; }
.flash-enter-from, .flash-leave-to { opacity: 0; transform: translateY(8px); }
@keyframes countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@media (max-width: 700px) { .flash-region { right: 16px; bottom: 16px; } .flash-region--inline { right: auto; bottom: auto; } }
</style>
