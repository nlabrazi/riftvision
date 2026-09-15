<script setup lang="ts">
import { ref } from 'vue'
import type { RiotAllGameData, RiotEvent, RiotStatusResponse } from '#shared/types/riot'

defineProps<{
  gameData: RiotAllGameData | null
  events: RiotEvent[]
  status: RiotStatusResponse
}>()

const activeTab = ref<'overview' | 'players' | 'events' | 'raw'>('overview')
</script>

<template>
      <!-- VIEW 3: Raw Diagnostic Console -->
      <section class="space-y-4">
        <!-- Navigation Tabs -->
        <div aria-label="Sections du diagnostic" class="diagnostic-tabs flex border-b border-[#785a28]/40 gap-2 font-rajdhani font-bold text-sm">
          <button type="button" data-testid="tab-overview" :aria-pressed="activeTab === 'overview'" @click="activeTab = 'overview'"
            class="px-4 py-2 border-b-2 transition"
            :class="activeTab === 'overview' ? 'border-[#c8aa6e] text-[#f0e6d2]' : 'border-transparent text-slate-400 hover:text-white'">
            Vue d'ensemble
          </button>
          <button type="button" data-testid="tab-players" :aria-pressed="activeTab === 'players'" @click="activeTab = 'players'"
            class="px-4 py-2 border-b-2 transition flex items-center gap-1.5"
            :class="activeTab === 'players' ? 'border-[#c8aa6e] text-[#f0e6d2]' : 'border-transparent text-slate-400 hover:text-white'">
            Joueurs
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-[#010a13] border border-[#785a28]/50 text-[#c8aa6e]">
              {{ gameData?.allPlayers?.length || 0 }}
            </span>
          </button>
          <button type="button" data-testid="tab-events" :aria-pressed="activeTab === 'events'" @click="activeTab = 'events'"
            class="px-4 py-2 border-b-2 transition flex items-center gap-1.5"
            :class="activeTab === 'events' ? 'border-[#c8aa6e] text-[#f0e6d2]' : 'border-transparent text-slate-400 hover:text-white'">
            Événements Riot
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-[#010a13] border border-[#785a28]/50 text-[#c8aa6e]">
              {{ events.length }}
            </span>
          </button>
          <button type="button" data-testid="tab-raw" :aria-pressed="activeTab === 'raw'" @click="activeTab = 'raw'" class="px-4 py-2 border-b-2 transition"
            :class="activeTab === 'raw' ? 'border-[#c8aa6e] text-[#f0e6d2]' : 'border-transparent text-slate-400 hover:text-white'">
            Payload JSON Brut
          </button>
        </div>

        <!-- Tab 1: Overview -->
        <div v-if="activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Active Player Card -->
          <div class="hextech-card rounded-xl p-4 space-y-3">
            <h3 class="font-cinzel text-xs uppercase tracking-wider text-[#c8aa6e] font-bold">
              Joueur Local (Active Player)
            </h3>
            <div v-if="gameData?.activePlayer" class="space-y-3">
              <div class="flex items-center justify-between border-b border-[#785a28]/30 pb-2">
                <span class="text-sm font-bold font-cinzel text-white">{{ gameData.activePlayer.summonerName }}</span>
                <span
                  class="text-xs font-rajdhani font-bold bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded">
                  Niveau {{ gameData.activePlayer.level }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs font-rajdhani">
                <div class="bg-[#010a13] border border-slate-800 p-2 rounded">
                  <span class="text-slate-400">Gold actuel:</span>
                  <span class="text-[#c8aa6e] font-bold ml-1">{{ gameData.activePlayer.currentGold }}g</span>
                </div>
                <div class="bg-[#010a13] border border-slate-800 p-2 rounded">
                  <span class="text-slate-400">PV:</span>
                  <span class="text-emerald-400 ml-1">
                    {{ gameData.activePlayer.championStats?.currentHealth?.toFixed(0) || '—' }} /
                    {{ gameData.activePlayer.championStats?.maxHealth?.toFixed(0) || '—' }}
                  </span>
                </div>
                <div class="bg-[#010a13] border border-slate-800 p-2 rounded">
                  <span class="text-slate-400">AD:</span>
                  <span class="text-orange-400 ml-1">{{ gameData.activePlayer.championStats?.attackDamage?.toFixed(0) ||
                    '—' }}</span>
                </div>
                <div class="bg-[#010a13] border border-slate-800 p-2 rounded">
                  <span class="text-slate-400">AP:</span>
                  <span class="text-purple-400 ml-1">{{ gameData.activePlayer.championStats?.abilityPower?.toFixed(0) ||
                    '—' }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-slate-500 py-6 text-center font-rajdhani">
              Aucune donnée de joueur local active.
            </div>
          </div>

          <!-- Quick Event Log -->
          <div class="hextech-card rounded-xl p-4 space-y-3">
            <h3 class="font-cinzel text-xs uppercase tracking-wider text-[#c8aa6e] font-bold">
              Derniers Événements Détectés
            </h3>
            <div v-if="events.length > 0" class="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div v-for="e in events.slice(-5).reverse()" :key="e.EventID"
                class="text-xs p-2 rounded-lg bg-[#010a13] border border-[#785a28]/30 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 font-rajdhani">
                  <span class="text-cyan-400 text-xs font-bold">
                    {{ Math.floor(e.EventTime / 60) }}:{{ String(Math.floor(e.EventTime % 60)).padStart(2, '0') }}
                  </span>
                  <span class="font-bold text-white">{{ e.EventName }}</span>
                  <span v-if="e.KillerName && e.VictimName" class="text-slate-300">
                    {{ e.KillerName.split('#')[0] }} ⚔️ {{ e.VictimName.split('#')[0] }}
                  </span>
                  <span v-else-if="e.TurretKilled" class="text-amber-400">
                    {{ e.TurretKilled }}
                  </span>
                  <span v-else-if="e.DragonType" class="text-indigo-400">
                    Dragon {{ e.DragonType }}
                  </span>
                </div>
                <span class="text-[10px] text-slate-500 font-rajdhani">#{{ e.EventID }}</span>
              </div>
            </div>
            <div v-else class="text-xs text-slate-500 py-6 text-center font-rajdhani">
              Aucun événement pour l'instant.
            </div>
          </div>
        </div>

        <!-- Tab 2: Players List -->
        <div v-if="activeTab === 'players'" class="space-y-4">
          <div v-if="gameData?.allPlayers?.length" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Team Order (Blue) -->
            <div class="hextech-card rounded-xl overflow-hidden border-cyan-800/40">
              <div class="bg-cyan-950/70 px-4 py-2.5 border-b border-cyan-900/40 flex items-center justify-between">
                <span class="font-cinzel text-xs font-bold uppercase text-cyan-300 tracking-wider">
                  Équipe Bleue (Order)
                </span>
              </div>
              <div class="divide-y divide-[#785a28]/20">
                <div v-for="p in gameData.allPlayers.filter(pl => pl.team === 'ORDER')" :key="p.summonerName"
                  class="p-3 hover:bg-slate-800/30 transition flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-cinzel font-bold text-white">{{ p.championName }}</span>
                      <span
                        class="text-[10px] font-rajdhani font-bold px-1.5 py-0.2 rounded bg-[#010a13] border border-cyan-800 text-cyan-300">
                        {{ p.position }}
                      </span>
                      <span v-if="p.isDead"
                        class="text-[10px] font-rajdhani font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded">
                        MORT ({{ p.respawnTimer }}s)
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5 font-rajdhani font-semibold">
                      {{ p.summonerName }} • Niv. {{ p.level }} • KDA: {{ p.scores.kills }}/{{ p.scores.deaths }}/{{
                        p.scores.assists }} ({{ p.scores.creepScore }} CS)
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <span v-for="(item, i) in p.items" :key="i" :title="item.displayName"
                      class="text-[10px] bg-[#010a13] border border-[#785a28]/40 px-1.5 py-0.5 rounded text-slate-300 truncate max-w-[100px]">
                      {{ item.displayName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Team Chaos (Red) -->
            <div class="hextech-card rounded-xl overflow-hidden border-rose-800/40">
              <div class="bg-rose-950/70 px-4 py-2.5 border-b border-rose-900/40 flex items-center justify-between">
                <span class="font-cinzel text-xs font-bold uppercase text-rose-300 tracking-wider">
                  Équipe Rouge (Chaos)
                </span>
              </div>
              <div class="divide-y divide-[#785a28]/20">
                <div v-for="p in gameData.allPlayers.filter(pl => pl.team === 'CHAOS')" :key="p.summonerName"
                  class="p-3 hover:bg-slate-800/30 transition flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-cinzel font-bold text-white">{{ p.championName }}</span>
                      <span
                        class="text-[10px] font-rajdhani font-bold px-1.5 py-0.2 rounded bg-[#010a13] border border-rose-800 text-rose-300">
                        {{ p.position }}
                      </span>
                      <span v-if="p.isDead"
                        class="text-[10px] font-rajdhani font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded">
                        MORT ({{ p.respawnTimer }}s)
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5 font-rajdhani font-semibold">
                      {{ p.summonerName }} • Niv. {{ p.level }} • KDA: {{ p.scores.kills }}/{{ p.scores.deaths }}/{{
                        p.scores.assists }} ({{ p.scores.creepScore }} CS)
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <span v-for="(item, i) in p.items" :key="i" :title="item.displayName"
                      class="text-[10px] bg-[#010a13] border border-[#785a28]/40 px-1.5 py-0.5 rounded text-slate-300 truncate max-w-[100px]">
                      {{ item.displayName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Events -->
        <div v-if="activeTab === 'events'" class="hextech-card rounded-xl p-4">
          <div v-if="events.length" class="space-y-2 max-h-96 overflow-y-auto font-rajdhani">
            <div v-for="e in events" :key="e.EventID"
              class="p-2.5 rounded-lg bg-[#010a13] border border-[#785a28]/30 text-xs flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="text-cyan-400 text-xs font-bold">
                  {{ Math.floor(e.EventTime / 60) }}:{{ String(Math.floor(e.EventTime % 60)).padStart(2, '0') }}
                </span>
                <span
                  class="font-bold text-white bg-[#091428] border border-[#785a28]/50 px-2 py-0.5 rounded text-[11px]">
                  {{ e.EventName }}
                </span>
                <span class="text-slate-300 font-sans">
                  <template v-if="e.KillerName && e.VictimName">
                    <span class="font-semibold text-emerald-400">{{ e.KillerName }}</span> a tué
                    <span class="font-semibold text-rose-400">{{ e.VictimName }}</span>
                    <span v-if="e.Assisters?.length" class="text-slate-400 text-[11px]">
                      (Assists: {{ e.Assisters.join(', ') }})
                    </span>
                  </template>
                  <template v-else-if="e.EventName === 'FirstBlood'">
                    Premier Sang (First Blood) obtenu par
                    <span class="font-semibold text-emerald-400">{{ e.Recipient }}</span>
                  </template>
                  <template v-else-if="e.TurretKilled">
                    Tour détruite: <span class="font-semibold text-amber-300">{{ e.TurretKilled }}</span> par {{
                      e.KillerName }}
                  </template>
                  <template v-else-if="e.DragonType">
                    Dragon <span class="font-semibold text-indigo-300">{{ e.DragonType }}</span> éliminé par {{
                      e.KillerName }}
                  </template>
                  <template v-else>
                    {{ JSON.stringify(e) }}
                  </template>
                </span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">#{{ e.EventID }}</span>
            </div>
          </div>
        </div>

        <!-- Tab 4: Raw JSON -->
        <div v-if="activeTab === 'raw'" class="hextech-card rounded-xl p-4">
          <pre
            class="text-xs font-mono bg-[#010a13] p-4 rounded-lg overflow-x-auto text-cyan-300/90 max-h-[500px] border border-[#785a28]/30">
    {{ JSON.stringify(gameData || status, null, 2) }}</pre>
        </div>
      </section>
</template>

<style scoped>
.diagnostic-tabs { flex-wrap: wrap; }
.hextech-card { min-width: 0; }
pre { max-width: 100%; }
@media (max-width: 700px) {
  .diagnostic-tabs button { padding: 8px 10px; }
  .hextech-card .flex { flex-wrap: wrap; min-width: 0; }
  .hextech-card .flex.gap-1 { flex-basis: 100%; }
  .hextech-card { overflow-wrap: anywhere; }
}
</style>
