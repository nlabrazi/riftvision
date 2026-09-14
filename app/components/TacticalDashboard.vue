<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameDiffEvent, TeamEconomySummary } from '../../shared/types/diff'
import type { RiotAllGameData, RiotPlayer } from '../../shared/types/riot'
import { getChampionIconUrl, getItemIconUrl } from '../../shared/utils/ddragon'

const props = defineProps<{
  gameData: RiotAllGameData | null
  blueEconomy: TeamEconomySummary
  redEconomy: TeamEconomySummary
  goldDifference: number
  diffEvents: GameDiffEvent[]
  formattedGameTime: string
}>()

const roleOrder: Record<string, number> = {
  TOP: 1,
  JUNGLE: 2,
  MIDDLE: 3,
  BOTTOM: 4,
  UTILITY: 5,
}

function sortPlayersByRole(players: RiotPlayer[]): RiotPlayer[] {
  return [...players].sort((a, b) => {
    const orderA = roleOrder[a.position] || 99
    const orderB = roleOrder[b.position] || 99
    return orderA - orderB
  })
}

const bluePlayers = computed(() => {
  const players = props.gameData?.allPlayers?.filter((p) => p.team === 'ORDER') || []
  return sortPlayersByRole(players)
})

const redPlayers = computed(() => {
  const players = props.gameData?.allPlayers?.filter((p) => p.team === 'CHAOS') || []
  return sortPlayersByRole(players)
})

const feedFilter = ref<'ALL' | 'ITEMS' | 'KILLS' | 'OBJECTIVES'>('ALL')

const filteredEvents = computed(() => {
  if (feedFilter.value === 'ALL') return props.diffEvents
  if (feedFilter.value === 'ITEMS') {
    return props.diffEvents.filter((e) => e.type === 'ITEM_PURCHASE')
  }
  if (feedFilter.value === 'KILLS') {
    return props.diffEvents.filter(
      (e) =>
        e.type === 'CHAMPION_KILL' || e.type === 'CHAMPION_DEATH' || e.type === 'CHAMPION_RESPAWN',
    )
  }
  if (feedFilter.value === 'OBJECTIVES') {
    return props.diffEvents.filter(
      (e) => e.type === 'TURRET_DESTROYED' || e.type === 'DRAGON_KILL' || e.type === 'BARON_KILL',
    )
  }
  return props.diffEvents
})
</script>

<template>
  <div class="space-y-6">
    <!-- Match Scoreboard Header -->
    <section data-testid="scoreboard-header" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur shadow-2xl">
      <div class="grid grid-cols-3 items-center gap-4">
        <!-- Blue Team Summary -->
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-600/40 flex items-center justify-center font-black text-blue-400 text-xl shadow-lg shadow-blue-950/50">
            {{ blueEconomy.killCount }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold uppercase tracking-wider text-blue-300">Équipe Bleue</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800 text-blue-400 font-mono">Order</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span class="font-semibold text-slate-300">💰 {{ blueEconomy.totalItemGold.toLocaleString('fr-FR') }}g</span>
              <span>🏰 {{ blueEconomy.turretCount }}</span>
              <span>🐉 {{ blueEconomy.dragonCount }}</span>
              <span>👾 {{ blueEconomy.baronCount }}</span>
            </div>
          </div>
        </div>

        <!-- Center Match Stats & Gold Delta -->
        <div class="text-center space-y-1">
          <div class="font-mono text-2xl font-black text-white tracking-widest">
            {{ formattedGameTime }}
          </div>

          <!-- Gold Lead Badge -->
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-inner"
            :class="{
              'bg-blue-950/90 border border-blue-600/50 text-blue-300': goldDifference > 0,
              'bg-rose-950/90 border border-rose-600/50 text-rose-300': goldDifference < 0,
              'bg-slate-800 border border-slate-700 text-slate-300': goldDifference === 0,
            }"
          >
            <span v-if="goldDifference > 0">Équipe Bleue +{{ Math.abs(goldDifference).toLocaleString('fr-FR') }}g</span>
            <span v-else-if="goldDifference < 0">Équipe Rouge +{{ Math.abs(goldDifference).toLocaleString('fr-FR') }}g</span>
            <span v-else>Égalité en or</span>
          </div>
        </div>

        <!-- Red Team Summary -->
        <div class="flex items-center justify-end gap-4 text-right">
          <div>
            <div class="flex items-center justify-end gap-2">
              <span class="text-xs px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 font-mono">Chaos</span>
              <span class="text-sm font-bold uppercase tracking-wider text-rose-300">Équipe Rouge</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center justify-end gap-3">
              <span>👾 {{ redEconomy.baronCount }}</span>
              <span>🐉 {{ redEconomy.dragonCount }}</span>
              <span>🏰 {{ redEconomy.turretCount }}</span>
              <span class="font-semibold text-slate-300">💰 {{ redEconomy.totalItemGold.toLocaleString('fr-FR') }}g</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-600/40 flex items-center justify-center font-black text-rose-400 text-xl shadow-lg shadow-rose-950/50">
            {{ redEconomy.killCount }}
          </div>
        </div>
      </div>
    </section>

    <!-- Side-by-Side Teams Tactical Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Blue Team Column -->
      <section data-testid="blue-team-column" class="bg-slate-900/80 border border-blue-900/40 rounded-2xl p-4 space-y-3 shadow-xl backdrop-blur">
        <div class="flex items-center justify-between pb-2 border-b border-blue-900/30">
          <h3 class="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Équipe Bleue (Order)
          </h3>
          <span class="text-xs text-slate-400 font-mono">{{ bluePlayers.length }}/5 Joueurs</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="p in bluePlayers"
            :key="p.summonerName"
            class="p-3 rounded-xl bg-slate-950/80 border transition-all flex items-center justify-between gap-3"
            :class="p.isDead ? 'border-rose-900/50 opacity-60' : 'border-slate-800/80 hover:border-blue-700/60'"
          >
            <!-- Avatar & Champ Info -->
            <div class="flex items-center gap-3">
              <div class="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                <img
                  :src="getChampionIconUrl(p.championName)"
                  :alt="p.championName"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  @error="(e) => ((e.target as HTMLImageElement).src = '/favicon.ico')"
                />
                <!-- Level Badge -->
                <span class="absolute bottom-0 right-0 bg-slate-950/90 text-cyan-300 font-mono text-[9px] px-1 rounded-tl border-t border-l border-slate-700">
                  {{ p.level }}
                </span>

                <!-- Dead Respawn Overlay -->
                <div v-if="p.isDead" class="absolute inset-0 bg-rose-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center">
                  <span class="text-[9px] font-bold text-rose-300 uppercase">MORT</span>
                  <span class="font-mono text-xs font-black text-rose-100 animate-pulse">{{ Math.ceil(p.respawnTimer) }}s</span>
                </div>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm">{{ p.championName }}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800 text-blue-300 font-semibold">
                    {{ p.position || 'FLEX' }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span class="text-emerald-400 font-semibold">{{ p.scores.kills }}/{{ p.scores.deaths }}/{{ p.scores.assists }}</span>
                  <span>•</span>
                  <span>{{ p.scores.creepScore }} CS</span>
                  <span>•</span>
                  <span class="text-slate-500 truncate max-w-[120px]">{{ p.summonerName.split('#')[0] }}</span>
                </div>
              </div>
            </div>

            <!-- Items Inventory (6 items + trinket) -->
            <div class="flex items-center gap-1">
              <div
                v-for="idx in 7"
                :key="idx"
                class="w-7 h-7 rounded-lg border flex items-center justify-center overflow-hidden bg-slate-900"
                :class="idx === 7 ? 'border-amber-700/50 bg-amber-950/20' : 'border-slate-800'"
              >
                <img
                  v-if="p.items[idx - 1]?.itemID"
                  :src="getItemIconUrl(p.items[idx - 1].itemID)"
                  :alt="p.items[idx - 1].displayName"
                  :title="`${p.items[idx - 1].displayName} (${p.items[idx - 1].price}g)`"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <span v-else class="text-[9px] text-slate-700">•</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Red Team Column -->
      <section data-testid="red-team-column" class="bg-slate-900/80 border border-rose-900/40 rounded-2xl p-4 space-y-3 shadow-xl backdrop-blur">
        <div class="flex items-center justify-between pb-2 border-b border-rose-900/30">
          <h3 class="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Équipe Rouge (Chaos)
          </h3>
          <span class="text-xs text-slate-400 font-mono">{{ redPlayers.length }}/5 Joueurs</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="p in redPlayers"
            :key="p.summonerName"
            class="p-3 rounded-xl bg-slate-950/80 border transition-all flex items-center justify-between gap-3"
            :class="p.isDead ? 'border-rose-900/50 opacity-60' : 'border-slate-800/80 hover:border-rose-700/60'"
          >
            <!-- Avatar & Champ Info -->
            <div class="flex items-center gap-3">
              <div class="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                <img
                  :src="getChampionIconUrl(p.championName)"
                  :alt="p.championName"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  @error="(e) => ((e.target as HTMLImageElement).src = '/favicon.ico')"
                />
                <!-- Level Badge -->
                <span class="absolute bottom-0 right-0 bg-slate-950/90 text-rose-300 font-mono text-[9px] px-1 rounded-tl border-t border-l border-slate-700">
                  {{ p.level }}
                </span>

                <!-- Dead Respawn Overlay -->
                <div v-if="p.isDead" class="absolute inset-0 bg-rose-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center">
                  <span class="text-[9px] font-bold text-rose-300 uppercase">MORT</span>
                  <span class="font-mono text-xs font-black text-rose-100 animate-pulse">{{ Math.ceil(p.respawnTimer) }}s</span>
                </div>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm">{{ p.championName }}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800 text-rose-300 font-semibold">
                    {{ p.position || 'FLEX' }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span class="text-emerald-400 font-semibold">{{ p.scores.kills }}/{{ p.scores.deaths }}/{{ p.scores.assists }}</span>
                  <span>•</span>
                  <span>{{ p.scores.creepScore }} CS</span>
                  <span>•</span>
                  <span class="text-slate-500 truncate max-w-[120px]">{{ p.summonerName.split('#')[0] }}</span>
                </div>
              </div>
            </div>

            <!-- Items Inventory (6 items + trinket) -->
            <div class="flex items-center gap-1">
              <div
                v-for="idx in 7"
                :key="idx"
                class="w-7 h-7 rounded-lg border flex items-center justify-center overflow-hidden bg-slate-900"
                :class="idx === 7 ? 'border-amber-700/50 bg-amber-950/20' : 'border-slate-800'"
              >
                <img
                  v-if="p.items[idx - 1]?.itemID"
                  :src="getItemIconUrl(p.items[idx - 1].itemID)"
                  :alt="p.items[idx - 1].displayName"
                  :title="`${p.items[idx - 1].displayName} (${p.items[idx - 1].price}g)`"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <span v-else class="text-[9px] text-slate-700">•</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Live Event Feed (Diff Stream) -->
    <section data-testid="live-diff-feed" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <h3 class="text-sm font-bold uppercase tracking-wider text-white">Journal des Détections en Direct</h3>
          <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {{ diffEvents.length }} événements
          </span>
        </div>

        <!-- Filter Buttons -->
        <div class="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            @click="feedFilter = 'ALL'"
            class="px-2.5 py-1 rounded-lg transition"
            :class="feedFilter === 'ALL' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            Tous
          </button>
          <button
            type="button"
            @click="feedFilter = 'ITEMS'"
            class="px-2.5 py-1 rounded-lg transition"
            :class="feedFilter === 'ITEMS' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            Achats d'Items
          </button>
          <button
            type="button"
            @click="feedFilter = 'KILLS'"
            class="px-2.5 py-1 rounded-lg transition"
            :class="feedFilter === 'KILLS' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            Kills & Morts
          </button>
          <button
            type="button"
            @click="feedFilter = 'OBJECTIVES'"
            class="px-2.5 py-1 rounded-lg transition"
            :class="feedFilter === 'OBJECTIVES' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            Objectifs
          </button>
        </div>
      </div>

      <!-- Feed List -->
      <div v-if="filteredEvents.length > 0" class="space-y-2 max-h-72 overflow-y-auto pr-1">
        <div
          v-for="event in [...filteredEvents].reverse()"
          :key="event.id"
          class="p-3 rounded-xl bg-slate-950 border text-xs flex items-center justify-between gap-3 transition"
          :class="{
            'border-purple-800/60 bg-purple-950/20': event.type === 'ITEM_PURCHASE',
            'border-rose-800/60 bg-rose-950/20': event.type === 'CHAMPION_KILL' || event.type === 'CHAMPION_DEATH',
            'border-amber-800/60 bg-amber-950/20': event.type === 'TURRET_DESTROYED' || event.type === 'DRAGON_KILL' || event.type === 'BARON_KILL',
            'border-emerald-800/60 bg-emerald-950/20': event.type === 'CHAMPION_RESPAWN',
          }"
        >
          <div class="flex items-center gap-3">
            <span class="font-mono text-cyan-400 text-xs font-bold">{{ event.formattedTime }}</span>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              :class="{
                'bg-purple-950 border border-purple-700 text-purple-300': event.type === 'ITEM_PURCHASE',
                'bg-rose-950 border border-rose-700 text-rose-300': event.type === 'CHAMPION_KILL' || event.type === 'CHAMPION_DEATH',
                'bg-amber-950 border border-amber-700 text-amber-300': event.type === 'TURRET_DESTROYED' || event.type === 'DRAGON_KILL' || event.type === 'BARON_KILL',
                'bg-emerald-950 border border-emerald-700 text-emerald-300': event.type === 'CHAMPION_RESPAWN',
              }"
            >
              {{ event.type === 'ITEM_PURCHASE' ? 'Item' : event.type === 'CHAMPION_KILL' ? 'Kill' : event.type === 'CHAMPION_DEATH' ? 'Mort' : event.type === 'CHAMPION_RESPAWN' ? 'Respawn' : 'Objectif' }}
            </span>
            <span class="text-slate-200 font-medium">{{ event.description }}</span>
          </div>

          <span v-if="event.team" class="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
            :class="event.team === 'ORDER' ? 'text-blue-400 bg-blue-950/80 border border-blue-900' : 'text-rose-400 bg-rose-950/80 border border-rose-900'"
          >
            {{ event.team === 'ORDER' ? 'BLEU' : 'ROUGE' }}
          </span>
        </div>
      </div>
      <div v-else class="text-center py-8 text-xs text-slate-500">
        Aucun événement détecté pour ce filtre.
      </div>
    </section>
  </div>
</template>
