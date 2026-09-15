<script setup lang="ts">
import { useFlashAlerts } from '../composables/useFlashAlerts'

const { activeAlert, dismissCurrentAlert } = useFlashAlerts()
</script>

<template>
  <Transition
    enter-active-class="transform transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-125 -translate-y-6"
    enter-to-class="opacity-100 scale-100 translate-y-0"
    leave-active-class="transform transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100 translate-y-0"
    leave-to-class="opacity-0 scale-95 -translate-y-4"
  >
    <div
      v-if="activeAlert"
      data-testid="flash-alert-overlay"
      class="fixed top-24 inset-x-4 max-w-2xl mx-auto z-40 pointer-events-none select-none"
    >
      <div
        class="relative overflow-hidden rounded-2xl border-2 p-5 backdrop-blur-xl shadow-2xl transition-all pointer-events-auto"
        :class="{
          'bg-gradient-to-r from-purple-950/95 via-[#091428]/95 to-purple-950/95 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.7)]':
            activeAlert.type === 'BARON' || activeAlert.type === 'HERALD',
          'bg-gradient-to-r from-amber-950/95 via-[#091428]/95 to-amber-950/95 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.7)]':
            activeAlert.type === 'DRAGON',
          'bg-gradient-to-r from-rose-950/95 via-[#091428]/95 to-rose-950/95 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.7)]':
            activeAlert.type === 'FIRST_BLOOD' || activeAlert.type === 'ACE' || activeAlert.type === 'KILL',
          'bg-gradient-to-r from-[#1c1409]/95 via-[#091428]/95 to-[#1c1409]/95 border-[#c8aa6e] shadow-[0_0_40px_rgba(200,170,110,0.7)]':
            activeAlert.type === 'ITEM',
          'bg-gradient-to-r from-slate-950/95 via-[#091428]/95 to-slate-950/95 border-slate-500 shadow-[0_0_30px_rgba(100,116,139,0.5)]':
            activeAlert.type === 'TURRET',
        }"
      >
        <!-- Top Shimmer Line -->
        <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>

        <!-- Alert Header / Category Badge -->
        <div class="flex items-center justify-between gap-3 mb-2">
          <div class="flex items-center gap-2">
            <span class="flex h-2.5 w-2.5 rounded-full animate-ping"
              :class="{
                'bg-purple-400': activeAlert.type === 'BARON' || activeAlert.type === 'HERALD',
                'bg-amber-400': activeAlert.type === 'DRAGON',
                'bg-rose-400': activeAlert.type === 'FIRST_BLOOD' || activeAlert.type === 'ACE' || activeAlert.type === 'KILL',
                'bg-[#c8aa6e]': activeAlert.type === 'ITEM',
                'bg-slate-400': activeAlert.type === 'TURRET',
              }"
            ></span>
            <span
              class="font-rajdhani text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-black/60"
              :class="{
                'border-purple-500/80 text-purple-300': activeAlert.type === 'BARON' || activeAlert.type === 'HERALD',
                'border-amber-500/80 text-amber-300': activeAlert.type === 'DRAGON',
                'border-rose-500/80 text-rose-300': activeAlert.type === 'FIRST_BLOOD' || activeAlert.type === 'ACE' || activeAlert.type === 'KILL',
                'border-[#c8aa6e]/80 text-[#c8aa6e]': activeAlert.type === 'ITEM',
                'border-slate-500 text-slate-300': activeAlert.type === 'TURRET',
              }"
            >
              ALERTE ÉVÉNEMENT MAJEUR
            </span>
          </div>

          <button
            type="button"
            data-testid="dismiss-alert-btn"
            @click="dismissCurrentAlert"
            class="h-6 w-6 rounded-lg bg-black/60 border border-slate-700 hover:border-white text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition shadow"
            title="Masquer l'alerte"
          >
            ✕
          </button>
        </div>

        <!-- Main Banner Content -->
        <div class="flex items-center gap-4">
          <!-- Left Icon or Actors Cluster -->
          <div class="flex-shrink-0 flex items-center gap-2">
            <!-- Killer / Primary Actor Avatar -->
            <div
              v-if="activeAlert.iconUrl"
              class="relative h-16 w-16 rounded-2xl overflow-hidden border-2 bg-black shadow-lg"
              :class="activeAlert.team === 'CHAOS' ? 'border-rose-500 shadow-rose-950/80' : 'border-cyan-400 shadow-cyan-950/80'"
            >
              <img :src="activeAlert.iconUrl" alt="Acteur" class="h-full w-full object-cover" />
            </div>

            <!-- VS Icon for Kills -->
            <span v-if="activeAlert.victimIconUrl" class="text-lg font-black text-rose-400 font-cinzel">⚔️</span>

            <!-- Victim Avatar -->
            <div
              v-if="activeAlert.victimIconUrl"
              class="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-rose-600/80 bg-black shadow-lg grayscale brightness-75"
            >
              <img :src="activeAlert.victimIconUrl" alt="Victime" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-rose-950/40 flex items-center justify-center">
                <span class="text-base">💀</span>
              </div>
            </div>
          </div>

          <!-- Alert Texts -->
          <div class="flex-1 min-w-0 space-y-1">
            <h2
              class="font-cinzel text-xl md:text-2xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] truncate"
              :class="{
                'text-purple-200': activeAlert.type === 'BARON' || activeAlert.type === 'HERALD',
                'text-amber-200': activeAlert.type === 'DRAGON',
                'text-rose-200': activeAlert.type === 'FIRST_BLOOD' || activeAlert.type === 'ACE' || activeAlert.type === 'KILL',
                'text-[#f0e6d2]': activeAlert.type === 'ITEM',
              }"
            >
              {{ activeAlert.title }}
            </h2>
            <p class="font-rajdhani text-sm md:text-base font-bold text-slate-200 tracking-wide line-clamp-2">
              {{ activeAlert.subtitle }}
            </p>
          </div>
        </div>

        <!-- Animated Progress Countdown Bar -->
        <div class="absolute bottom-0 inset-x-0 h-1 bg-black/50">
          <div
            class="h-full transition-all ease-linear"
            :class="{
              'bg-purple-400': activeAlert.type === 'BARON' || activeAlert.type === 'HERALD',
              'bg-amber-400': activeAlert.type === 'DRAGON',
              'bg-rose-500': activeAlert.type === 'FIRST_BLOOD' || activeAlert.type === 'ACE' || activeAlert.type === 'KILL',
              'bg-[#c8aa6e]': activeAlert.type === 'ITEM',
              'bg-slate-400': activeAlert.type === 'TURRET',
            }"
            :style="{
              animation: `shrink ${activeAlert.durationMs}ms linear forwards`,
            }"
          ></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
