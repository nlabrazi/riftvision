<script setup lang="ts">
import type { GameDiffEvent, TeamEconomySummary } from '#shared/types/diff'
import type { RiotAllGameData } from '#shared/types/riot'
import { useFlashAlerts } from '../composables/useFlashAlerts'
import TacticalMinimap from './TacticalMinimap.vue'

const props = defineProps<{
  gameData: RiotAllGameData | null
  blueEconomy: TeamEconomySummary
  redEconomy: TeamEconomySummary
  goldDifference: number
  diffEvents: GameDiffEvent[]
  formattedGameTime: string
}>()

const emit = defineEmits<(e: 'switch-view', view: 'tactical' | 'diagnostic') => void>()

const { triggerDemoAlert } = useFlashAlerts()
</script>

<template>
  <div data-testid="focus-radar-view" class="relative space-y-5">
    <!-- Minimalist Top Bar for Second Screen -->
    <header class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#785a28]/60 bg-[#091428]/90 p-4 shadow-2xl backdrop-blur-md">
      <!-- Blue Team Kill Score -->
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-500/70 flex items-center justify-center font-rajdhani text-2xl font-black text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
          {{ blueEconomy.killCount }}
        </div>
        <div>
          <span class="font-cinzel text-xs font-bold text-cyan-300 uppercase tracking-wider block">Équipe Bleue</span>
          <span class="font-rajdhani text-xs text-slate-400 font-semibold">{{ blueEconomy.totalItemGold.toLocaleString('fr-FR') }}g</span>
        </div>
      </div>

      <!-- Center Clock & Gold Lead -->
      <div class="flex flex-col items-center justify-center text-center">
        <div class="font-rajdhani text-3xl font-black tracking-widest text-[#f0e6d2] drop-shadow-[0_0_10px_rgba(200,170,110,0.5)]">
          {{ formattedGameTime }}
        </div>
        <div
          class="text-[11px] font-rajdhani font-bold px-2.5 py-0.5 rounded-full border mt-0.5"
          :class="{
            'bg-cyan-950/80 border-cyan-500/60 text-cyan-300': goldDifference > 0,
            'bg-rose-950/80 border-rose-500/60 text-rose-300': goldDifference < 0,
            'bg-slate-900 border-[#785a28]/60 text-[#c8aa6e]': goldDifference === 0,
          }"
        >
          <span v-if="goldDifference > 0">Avance Bleue : +{{ Math.abs(goldDifference).toLocaleString('fr-FR') }}g</span>
          <span v-else-if="goldDifference < 0">Avance Rouge : +{{ Math.abs(goldDifference).toLocaleString('fr-FR') }}g</span>
          <span v-else>Or à égalité</span>
        </div>
      </div>

      <!-- Red Team Kill Score -->
      <div class="flex items-center gap-3 text-right">
        <div>
          <span class="font-cinzel text-xs font-bold text-rose-300 uppercase tracking-wider block">Équipe Rouge</span>
          <span class="font-rajdhani text-xs text-slate-400 font-semibold">{{ redEconomy.totalItemGold.toLocaleString('fr-FR') }}g</span>
        </div>
        <div class="h-10 w-10 rounded-xl bg-rose-950 border border-rose-500/70 flex items-center justify-center font-rajdhani text-2xl font-black text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
          {{ redEconomy.killCount }}
        </div>
      </div>
    </header>

    <!-- Interactive Map in Large Scale -->
    <main data-testid="radar-large-map">
      <TacticalMinimap
        :game-data="gameData"
        :blue-economy="blueEconomy"
        :red-economy="redEconomy"
        :diff-events="diffEvents"
        @close="emit('switch-view', 'tactical')"
      />
    </main>

    <!-- Flash Alert Demo Testing Bar -->
    <footer class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#785a28]/40 bg-[#091428]/80 p-3.5 shadow-xl backdrop-blur-md">
      <div class="flex items-center gap-2 text-xs font-rajdhani font-semibold text-slate-300">
        <span class="text-gold-gradient font-bold">⚡ Simulateur Flash Alertes :</span>
        <span class="text-slate-400">Testez le rendu visuel et sonore des événements majeurs</span>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs font-rajdhani font-bold">
        <button
          type="button"
          data-testid="test-alert-kill"
          @click="triggerDemoAlert('KILL')"
          class="px-2.5 py-1 rounded-lg border border-rose-600/70 bg-rose-950/80 hover:bg-rose-900 text-rose-200 transition shadow"
        >
          ⚔️ Kill
        </button>
        <button
          type="button"
          data-testid="test-alert-dragon"
          @click="triggerDemoAlert('DRAGON')"
          class="px-2.5 py-1 rounded-lg border border-amber-600/70 bg-amber-950/80 hover:bg-amber-900 text-amber-200 transition shadow"
        >
          🐉 Dragon
        </button>
        <button
          type="button"
          data-testid="test-alert-baron"
          @click="triggerDemoAlert('BARON')"
          class="px-2.5 py-1 rounded-lg border border-purple-600/70 bg-purple-950/80 hover:bg-purple-900 text-purple-200 transition shadow"
        >
          👑 Baron
        </button>
        <button
          type="button"
          data-testid="test-alert-item"
          @click="triggerDemoAlert('ITEM')"
          class="px-2.5 py-1 rounded-lg border border-[#c8aa6e]/70 bg-[#1c1409]/90 hover:bg-[#2e200f] text-[#f0e6d2] transition shadow"
        >
          🛍️ Power Spike
        </button>
        <button
          type="button"
          data-testid="test-alert-ace"
          @click="triggerDemoAlert('ACE')"
          class="px-2.5 py-1 rounded-lg border border-red-500/70 bg-red-950/90 hover:bg-red-900 text-red-200 transition shadow"
        >
          💀 Ace
        </button>
      </div>
    </footer>
  </div>
</template>
