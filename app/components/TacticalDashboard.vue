<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameDiffEvent, TeamEconomySummary } from '#shared/types/diff'
import type { RiotAllGameData, RiotPlayer } from '#shared/types/riot'
import {
  STAT_ICONS,
  getChampionIconUrl,
  getItemIconUrl,
  getObjectiveIconUrl,
  getRoleIconUrl,
} from '#shared/utils/ddragon'

const props = defineProps<{
  gameData: RiotAllGameData | null
  blueEconomy: TeamEconomySummary
  redEconomy: TeamEconomySummary
  goldDifference: number
  diffEvents: GameDiffEvent[]
  formattedGameTime: string
  isMock?: boolean
}>()

const emit = defineEmits<(e: 'stop-mock') => void>()

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

const totalGold = computed(
  () => props.blueEconomy.totalItemGold + props.redEconomy.totalItemGold || 1,
)

const blueGoldPercent = computed(() =>
  Math.min(90, Math.max(10, Math.round((props.blueEconomy.totalItemGold / totalGold.value) * 100))),
)

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
    <section data-testid="scoreboard-header"
      class="relative overflow-hidden rounded-2xl border border-[#785a28]/60 bg-[#091428]/90 p-5 shadow-2xl backdrop-blur-md"
      style="background-image: radial-gradient(circle at 50% 0%, rgba(200, 170, 110, 0.1) 0%, transparent 70%);">
      <!-- Decorative top golden border line -->
      <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c8aa6e] to-transparent">
      </div>

      <!-- Demo Banner Indicator (when in mock mode) -->
      <div
        v-if="isMock"
        class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-600/50 bg-purple-950/60 px-4 py-2 text-xs font-rajdhani"
      >
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-purple-400 animate-ping"></span>
          <span class="font-bold text-purple-200">
            🎮 Partie Simulée Active — Match test à 16:45 avec détection d'achats d'items et kills
          </span>
        </div>

        <button
          type="button"
          @click="emit('stop-mock')"
          class="flex items-center gap-1.5 rounded-lg border border-rose-500/80 bg-rose-950/90 px-3 py-1 font-bold text-rose-200 hover:bg-rose-900 hover:border-rose-400 transition shadow"
        >
          <span>⏹️</span>
          <span>Arrêter le Mode Démo</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
        <!-- Blue Team Summary -->
        <div class="flex items-center gap-4">
          <div
            class="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-950 via-[#0a1a2e] to-cyan-900/60 shadow-lg shadow-cyan-950/50">
            <span class="font-rajdhani text-3xl font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(10,203,230,0.6)]">
              {{ blueEconomy.killCount }}
            </span>
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-cinzel text-base font-bold tracking-wider text-cyan-300 drop-shadow">
                Équipe Bleue
              </span>
              <span
                class="rounded border border-cyan-800/80 bg-cyan-950/80 px-2 py-0.5 font-rajdhani text-[11px] font-bold uppercase text-cyan-400">
                Order
              </span>
            </div>

            <!-- Objectives & Economy Row -->
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div class="flex items-center gap-1 font-rajdhani font-bold text-[#c8aa6e]">
                <img :src="STAT_ICONS.gold" alt="Gold" class="h-3.5 w-3.5 object-contain" />
                <span>{{ blueEconomy.totalItemGold.toLocaleString('fr-FR') }}g</span>
              </div>
              <div class="flex items-center gap-1 font-rajdhani font-semibold text-slate-300" title="Tours détruites">
                <img :src="getObjectiveIconUrl('tower', 'ORDER')" alt="Tours" class="h-3.5 w-3.5 object-contain" />
                <span>{{ blueEconomy.turretCount }}</span>
              </div>
              <div class="flex items-center gap-1 font-rajdhani font-semibold text-slate-300" title="Dragons éliminés">
                <img :src="getObjectiveIconUrl('dragon', 'ORDER')" alt="Dragons" class="h-3.5 w-3.5 object-contain" />
                <span>{{ blueEconomy.dragonCount }}</span>
              </div>
              <div class="flex items-center gap-1 font-rajdhani font-semibold text-slate-300" title="Barons éliminés">
                <img :src="getObjectiveIconUrl('baron', 'ORDER')" alt="Barons" class="h-3.5 w-3.5 object-contain" />
                <span>{{ blueEconomy.baronCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Center Match Stats & Gold Tug-of-War -->
        <div class="flex flex-col items-center justify-center space-y-2 text-center">
          <!-- Game Time Clock -->
          <div class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-[#c8aa6e] animate-ping"></span>
            <div
              class="font-rajdhani text-3xl font-black tracking-widest text-[#f0e6d2] drop-shadow-[0_0_10px_rgba(200,170,110,0.4)]">
              {{ formattedGameTime }}
            </div>
            <span class="h-1.5 w-1.5 rounded-full bg-[#c8aa6e] animate-ping"></span>
          </div>

          <!-- Gold Lead Badge -->
          <div
            class="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold font-rajdhani uppercase tracking-wider shadow-inner"
            :class="{
              'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(10,203,230,0.2)]': goldDifference > 0,
              'bg-rose-950/80 border border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(232,64,87,0.2)]': goldDifference < 0,
              'bg-slate-900 border border-[#785a28]/60 text-[#c8aa6e]': goldDifference === 0,
            }">
            <span v-if="goldDifference > 0">
              Avance Bleue : +{{ Math.abs(goldDifference).toLocaleString('fr-FR') }}g
            </span>
            <span v-else-if="goldDifference < 0">
              Avance Rouge : +{{ Math.abs(goldDifference).toLocaleString('fr-FR') }}g
            </span>
            <span v-else>Égalité en or d'inventaire</span>
          </div>

          <!-- Gold Tug-of-War Progress Bar -->
          <div class="w-full max-w-xs space-y-1">
            <div
              class="relative h-2 w-full overflow-hidden rounded-full bg-slate-950 border border-[#785a28]/40 shadow-inner">
              <div
                class="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                :style="{ width: `${blueGoldPercent}%` }"></div>
              <div
                class="absolute right-0 top-0 h-full bg-gradient-to-l from-rose-600 to-rose-400 transition-all duration-500"
                :style="{ width: `${100 - blueGoldPercent}%` }"></div>
              <!-- Center Marker -->
              <div class="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-[#f0e6d2]/80"></div>
            </div>
            <div class="flex justify-between text-[10px] font-rajdhani font-semibold text-slate-400 px-1">
              <span class="text-cyan-400">{{ blueGoldPercent }}%</span>
              <span class="text-[#c8aa6e]">Économie d'Équipe</span>
              <span class="text-rose-400">{{ 100 - blueGoldPercent }}%</span>
            </div>
          </div>
        </div>

        <!-- Red Team Summary -->
        <div class="flex items-center justify-end gap-4 text-right">
          <div class="space-y-1">
            <div class="flex items-center justify-end gap-2">
              <span
                class="rounded border border-rose-800/80 bg-rose-950/80 px-2 py-0.5 font-rajdhani text-[11px] font-bold uppercase text-rose-400">
                Chaos
              </span>
              <span class="font-cinzel text-base font-bold tracking-wider text-rose-300 drop-shadow">
                Équipe Rouge
              </span>
            </div>

            <!-- Objectives & Economy Row -->
            <div class="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-300">
              <div class="flex items-center gap-1 font-rajdhani font-semibold text-slate-300" title="Barons éliminés">
                <span>{{ redEconomy.baronCount }}</span>
                <img :src="getObjectiveIconUrl('baron', 'CHAOS')" alt="Barons" class="h-3.5 w-3.5 object-contain" />
              </div>
              <div class="flex items-center gap-1 font-rajdhani font-semibold text-slate-300" title="Dragons éliminés">
                <span>{{ redEconomy.dragonCount }}</span>
                <img :src="getObjectiveIconUrl('dragon', 'CHAOS')" alt="Dragons" class="h-3.5 w-3.5 object-contain" />
              </div>
              <div class="flex items-center gap-1 font-rajdhani font-semibold text-slate-300" title="Tours détruites">
                <span>{{ redEconomy.turretCount }}</span>
                <img :src="getObjectiveIconUrl('tower', 'CHAOS')" alt="Tours" class="h-3.5 w-3.5 object-contain" />
              </div>
              <div class="flex items-center gap-1 font-rajdhani font-bold text-[#c8aa6e]">
                <span>{{ redEconomy.totalItemGold.toLocaleString('fr-FR') }}g</span>
                <img :src="STAT_ICONS.gold" alt="Gold" class="h-3.5 w-3.5 object-contain" />
              </div>
            </div>
          </div>

          <div
            class="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-rose-500/60 bg-gradient-to-br from-rose-950 via-[#2a0c14] to-rose-900/60 shadow-lg shadow-rose-950/50">
            <span class="font-rajdhani text-3xl font-black text-rose-300 drop-shadow-[0_0_8px_rgba(232,64,87,0.6)]">
              {{ redEconomy.killCount }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Side-by-Side Teams Tactical Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Blue Team Column -->
      <section data-testid="blue-team-column"
        class="rounded-2xl border border-cyan-800/40 bg-[#091428]/85 p-4.5 space-y-3 shadow-2xl backdrop-blur-md">
        <div class="flex items-center justify-between pb-2.5 border-b border-cyan-900/40">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#0acbe6]"></span>
            <h3 class="font-cinzel text-xs font-bold uppercase tracking-wider text-cyan-300">
              Équipe Bleue • Piltover & Order
            </h3>
          </div>
          <span class="font-rajdhani text-xs font-bold text-slate-400">{{ bluePlayers.length }}/5 Joueurs</span>
        </div>

        <div class="space-y-2.5">
          <div v-for="p in bluePlayers" :key="p.summonerName"
            class="hextech-blue-card relative p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3"
            :class="p.isDead ? 'border-rose-900/80 opacity-70 bg-rose-950/20' : ''">
            <!-- Avatar & Champ Info -->
            <div class="flex items-center gap-3">
              <!-- Champion Avatar with Level & Dead Overlay -->
              <div
                class="relative h-13 w-13 rounded-xl overflow-hidden border-2 border-[#785a28] flex-shrink-0 bg-[#010a13] shadow-md">
                <img :src="getChampionIconUrl(p.championName)" :alt="p.championName" class="h-full w-full object-cover"
                  :class="p.isDead ? 'grayscale brightness-75' : ''" loading="lazy"
                  @error="(e) => ((e.target as HTMLImageElement).src = '/favicon.ico')" />

                <!-- Role Icon Badge at Top-Left -->
                <div v-if="getRoleIconUrl(p.position)"
                  class="absolute top-0 left-0 bg-[#010a13]/90 rounded-br p-0.5 border-b border-r border-[#785a28]/60"
                  :title="p.position">
                  <img :src="getRoleIconUrl(p.position)" :alt="p.position" class="h-3.5 w-3.5 object-contain" />
                </div>

                <!-- Level Badge at Bottom-Right -->
                <span
                  class="absolute bottom-0 right-0 bg-[#010a13]/95 text-[#f0e6d2] font-rajdhani font-bold text-[10px] px-1 rounded-tl border-t border-l border-[#c8aa6e]">
                  {{ p.level }}
                </span>

                <!-- Dead Respawn Overlay -->
                <div v-if="p.isDead"
                  class="absolute inset-0 bg-rose-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center text-center">
                  <span class="font-rajdhani text-[9px] font-bold text-rose-300 uppercase tracking-wider">MORT</span>
                  <span class="font-rajdhani text-sm font-black text-rose-100 animate-pulse">
                    {{ Math.ceil(p.respawnTimer) }}s
                  </span>
                </div>
              </div>

              <!-- Champion & Stats Text -->
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-cinzel font-bold text-sm text-white tracking-wide">{{ p.championName }}</span>
                  <span
                    class="font-rajdhani text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950/90 border border-cyan-800 text-cyan-300">
                    {{ p.position || 'FLEX' }}
                  </span>
                </div>

                <div class="flex items-center gap-2.5 text-xs text-slate-300 font-rajdhani font-semibold">
                  <!-- KDA -->
                  <div class="flex items-center gap-1">
                    <img :src="STAT_ICONS.kills" alt="Kills" class="h-3 w-3 object-contain opacity-80" />
                    <span>
                      <span class="text-emerald-400 font-bold">{{ p.scores.kills }}</span>/
                      <span class="text-rose-400 font-bold">{{ p.scores.deaths }}</span>/
                      <span class="text-amber-300 font-bold">{{ p.scores.assists }}</span>
                    </span>
                  </div>
                  <span>•</span>
                  <!-- CS -->
                  <div class="flex items-center gap-1">
                    <img :src="STAT_ICONS.minions" alt="CS" class="h-3 w-3 object-contain opacity-80" />
                    <span>{{ p.scores.creepScore }} CS</span>
                  </div>
                  <span>•</span>
                  <!-- Summoner Name -->
                  <span class="text-slate-400 truncate max-w-[110px] font-normal text-[11px]">
                    {{ p.summonerName.split('#')[0] }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Items Inventory (6 slots + 1 trinket) -->
            <div class="flex items-center gap-1">
              <div v-for="idx in 7" :key="idx"
                class="hextech-slot relative h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                :class="idx === 7 ? 'border-amber-600/60 bg-amber-950/30' : ''">
                <img v-if="p.items[idx - 1]?.itemID" :src="getItemIconUrl(p.items[idx - 1].itemID)"
                  :alt="p.items[idx - 1].displayName"
                  :title="`${p.items[idx - 1].displayName} (${p.items[idx - 1].price}g)`"
                  class="h-full w-full object-cover transition-transform hover:scale-110" loading="lazy" />
                <span v-else class="text-[8px] text-[#785a28]/60">•</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Red Team Column -->
      <section data-testid="red-team-column"
        class="rounded-2xl border border-rose-800/40 bg-[#091428]/85 p-4.5 space-y-3 shadow-2xl backdrop-blur-md">
        <div class="flex items-center justify-between pb-2.5 border-b border-rose-900/40">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#e84057]"></span>
            <h3 class="font-cinzel text-xs font-bold uppercase tracking-wider text-rose-300">
              Équipe Rouge • Noxus & Chaos
            </h3>
          </div>
          <span class="font-rajdhani text-xs font-bold text-slate-400">{{ redPlayers.length }}/5 Joueurs</span>
        </div>

        <div class="space-y-2.5">
          <div v-for="p in redPlayers" :key="p.summonerName"
            class="hextech-red-card relative p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3"
            :class="p.isDead ? 'border-rose-900/80 opacity-70 bg-rose-950/20' : ''">
            <!-- Avatar & Champ Info -->
            <div class="flex items-center gap-3">
              <!-- Champion Avatar with Level & Dead Overlay -->
              <div
                class="relative h-13 w-13 rounded-xl overflow-hidden border-2 border-[#785a28] flex-shrink-0 bg-[#010a13] shadow-md">
                <img :src="getChampionIconUrl(p.championName)" :alt="p.championName" class="h-full w-full object-cover"
                  :class="p.isDead ? 'grayscale brightness-75' : ''" loading="lazy"
                  @error="(e) => ((e.target as HTMLImageElement).src = '/favicon.ico')" />

                <!-- Role Icon Badge at Top-Left -->
                <div v-if="getRoleIconUrl(p.position)"
                  class="absolute top-0 left-0 bg-[#010a13]/90 rounded-br p-0.5 border-b border-r border-[#785a28]/60"
                  :title="p.position">
                  <img :src="getRoleIconUrl(p.position)" :alt="p.position" class="h-3.5 w-3.5 object-contain" />
                </div>

                <!-- Level Badge at Bottom-Right -->
                <span
                  class="absolute bottom-0 right-0 bg-[#010a13]/95 text-[#f0e6d2] font-rajdhani font-bold text-[10px] px-1 rounded-tl border-t border-l border-[#c8aa6e]">
                  {{ p.level }}
                </span>

                <!-- Dead Respawn Overlay -->
                <div v-if="p.isDead"
                  class="absolute inset-0 bg-rose-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center text-center">
                  <span class="font-rajdhani text-[9px] font-bold text-rose-300 uppercase tracking-wider">MORT</span>
                  <span class="font-rajdhani text-sm font-black text-rose-100 animate-pulse">
                    {{ Math.ceil(p.respawnTimer) }}s
                  </span>
                </div>
              </div>

              <!-- Champion & Stats Text -->
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-cinzel font-bold text-sm text-white tracking-wide">{{ p.championName }}</span>
                  <span
                    class="font-rajdhani text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-950/90 border border-rose-800 text-rose-300">
                    {{ p.position || 'FLEX' }}
                  </span>
                </div>

                <div class="flex items-center gap-2.5 text-xs text-slate-300 font-rajdhani font-semibold">
                  <!-- KDA -->
                  <div class="flex items-center gap-1">
                    <img :src="STAT_ICONS.kills" alt="Kills" class="h-3 w-3 object-contain opacity-80" />
                    <span>
                      <span class="text-emerald-400 font-bold">{{ p.scores.kills }}</span>/
                      <span class="text-rose-400 font-bold">{{ p.scores.deaths }}</span>/
                      <span class="text-amber-300 font-bold">{{ p.scores.assists }}</span>
                    </span>
                  </div>
                  <span>•</span>
                  <!-- CS -->
                  <div class="flex items-center gap-1">
                    <img :src="STAT_ICONS.minions" alt="CS" class="h-3 w-3 object-contain opacity-80" />
                    <span>{{ p.scores.creepScore }} CS</span>
                  </div>
                  <span>•</span>
                  <!-- Summoner Name -->
                  <span class="text-slate-400 truncate max-w-[110px] font-normal text-[11px]">
                    {{ p.summonerName.split('#')[0] }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Items Inventory (6 slots + 1 trinket) -->
            <div class="flex items-center gap-1">
              <div v-for="idx in 7" :key="idx"
                class="hextech-slot relative h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                :class="idx === 7 ? 'border-amber-600/60 bg-amber-950/30' : ''">
                <img v-if="p.items[idx - 1]?.itemID" :src="getItemIconUrl(p.items[idx - 1].itemID)"
                  :alt="p.items[idx - 1].displayName"
                  :title="`${p.items[idx - 1].displayName} (${p.items[idx - 1].price}g)`"
                  class="h-full w-full object-cover transition-transform hover:scale-110" loading="lazy" />
                <span v-else class="text-[8px] text-[#785a28]/60">•</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Live Event Feed (Diff Stream) -->
    <section data-testid="live-diff-feed" class="hextech-card rounded-2xl p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#785a28]/30">
        <div class="flex items-center gap-2.5">
          <span class="h-2.5 w-2.5 rounded-full bg-[#c8aa6e] animate-pulse shadow-[0_0_8px_#c8aa6e]"></span>
          <h3 class="font-cinzel text-sm font-bold uppercase tracking-wider text-[#f0e6d2]">
            Journal des Détections en Direct
          </h3>
          <span
            class="font-rajdhani text-xs px-2.5 py-0.5 rounded-full bg-[#010a13] border border-[#785a28]/60 text-[#c8aa6e] font-bold">
            {{ diffEvents.length }} événements
          </span>
        </div>

        <!-- Filter Buttons -->
        <div class="flex items-center gap-1.5 text-xs font-rajdhani font-bold">
          <button type="button" @click="feedFilter = 'ALL'" class="px-3 py-1 rounded-lg transition border"
            :class="feedFilter === 'ALL' ? 'bg-[#c8aa6e] border-[#f0e6d2] text-black shadow' : 'bg-[#010a13] border-[#785a28]/50 text-slate-400 hover:text-white hover:border-[#c8aa6e]'">
            Tous
          </button>
          <button type="button" @click="feedFilter = 'ITEMS'"
            class="px-3 py-1 rounded-lg transition border flex items-center gap-1"
            :class="feedFilter === 'ITEMS' ? 'bg-purple-600 border-purple-400 text-white shadow' : 'bg-[#010a13] border-[#785a28]/50 text-slate-400 hover:text-white hover:border-[#c8aa6e]'">
            <img :src="STAT_ICONS.gold" alt="Items" class="h-3 w-3 object-contain" />
            Achats d'Items
          </button>
          <button type="button" @click="feedFilter = 'KILLS'"
            class="px-3 py-1 rounded-lg transition border flex items-center gap-1"
            :class="feedFilter === 'KILLS' ? 'bg-rose-600 border-rose-400 text-white shadow' : 'bg-[#010a13] border-[#785a28]/50 text-slate-400 hover:text-white hover:border-[#c8aa6e]'">
            <img :src="STAT_ICONS.kills" alt="Kills" class="h-3 w-3 object-contain" />
            Kills & Morts
          </button>
          <button type="button" @click="feedFilter = 'OBJECTIVES'"
            class="px-3 py-1 rounded-lg transition border flex items-center gap-1"
            :class="feedFilter === 'OBJECTIVES' ? 'bg-amber-600 border-amber-400 text-white shadow' : 'bg-[#010a13] border-[#785a28]/50 text-slate-400 hover:text-white hover:border-[#c8aa6e]'">
            <span>🏰</span>
            Objectifs
          </button>
        </div>
      </div>

      <!-- Feed List -->
      <div v-if="filteredEvents.length > 0" class="space-y-2 max-h-80 overflow-y-auto pr-1">
        <div v-for="event in [...filteredEvents].reverse()" :key="event.id"
          class="p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all bg-[#010a13]/80"
          :class="{
            'border-purple-800/60 hover:border-purple-500': event.type === 'ITEM_PURCHASE',
            'border-rose-800/60 hover:border-rose-500': event.type === 'CHAMPION_KILL' || event.type === 'CHAMPION_DEATH',
            'border-amber-800/60 hover:border-amber-500': event.type === 'TURRET_DESTROYED' || event.type === 'DRAGON_KILL' || event.type === 'BARON_KILL',
            'border-emerald-800/60 hover:border-emerald-500': event.type === 'CHAMPION_RESPAWN',
          }">
          <div class="flex items-center gap-3">
            <span class="font-rajdhani text-cyan-400 text-xs font-bold">{{ event.formattedTime }}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold font-rajdhani uppercase tracking-wider border"
              :class="{
                'bg-purple-950/80 border-purple-700 text-purple-300': event.type === 'ITEM_PURCHASE',
                'bg-rose-950/80 border-rose-700 text-rose-300': event.type === 'CHAMPION_KILL' || event.type === 'CHAMPION_DEATH',
                'bg-amber-950/80 border-amber-700 text-amber-300': event.type === 'TURRET_DESTROYED' || event.type === 'DRAGON_KILL' || event.type === 'BARON_KILL',
                'bg-emerald-950/80 border-emerald-700 text-emerald-300': event.type === 'CHAMPION_RESPAWN',
              }">
              {{
                event.type === 'ITEM_PURCHASE'
                  ? 'Item'
                  : event.type === 'CHAMPION_KILL'
                    ? 'Kill'
                    : event.type === 'CHAMPION_DEATH'
                      ? 'Mort'
                      : event.type === 'CHAMPION_RESPAWN'
                        ? 'Respawn'
                        : 'Objectif'
              }}
            </span>
            <span class="text-slate-200 font-medium font-sans">{{ event.description }}</span>
          </div>

          <span v-if="event.team"
            class="text-[10px] font-rajdhani px-2.5 py-0.5 rounded font-bold uppercase tracking-wider"
            :class="event.team === 'ORDER' ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-800' : 'text-rose-300 bg-rose-950/80 border border-rose-800'">
            {{ event.team === 'ORDER' ? 'BLEU' : 'ROUGE' }}
          </span>
        </div>
      </div>
      <div v-else class="text-center py-10 text-xs text-slate-500 font-rajdhani">
        Aucun événement détecté pour ce filtre.
      </div>
    </section>
  </div>
</template>
