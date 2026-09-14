<script setup lang="ts">
import { ref } from 'vue'
import TacticalDashboard from '../components/TacticalDashboard.vue'
import { useRiotLive } from '../composables/useRiotLive'

const {
  status,
  gameData,
  events,
  diffEvents,
  blueEconomy,
  redEconomy,
  goldDifference,
  isPolling,
  lastError,
  isConnected,
  formattedGameTime,
  refreshAll,
  toggleMockMode,
  togglePolling,
} = useRiotLive()

const currentView = ref<'tactical' | 'diagnostic'>('tactical')
const activeTab = ref<'overview' | 'players' | 'events' | 'raw'>('overview')
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
    <!-- Header -->
    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-950">
            RV
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold tracking-tight text-white">RiftVision</h1>
              <span class="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-950/80 border border-cyan-800 text-cyan-400">v0.2.0</span>
            </div>
            <p class="text-xs text-slate-400">Copilote Tactique Second-Screen LoL</p>
          </div>
        </div>

        <!-- View Switcher -->
        <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            data-testid="view-tactical-btn"
            @click="currentView = 'tactical'"
            class="px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5"
            :class="currentView === 'tactical' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          >
            <span>⚔️</span> Tableau Tactique
          </button>
          <button
            type="button"
            data-testid="view-diagnostic-btn"
            @click="currentView = 'diagnostic'"
            class="px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5"
            :class="currentView === 'diagnostic' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          >
            <span>🛠️</span> Diagnostic API
          </button>
        </div>

        <!-- Controls -->
        <div class="flex items-center flex-wrap gap-2">
          <button
            type="button"
            data-testid="mock-toggle-button"
            @click="toggleMockMode"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5"
            :class="status.isMock
              ? 'bg-purple-950/80 border-purple-600 text-purple-200 hover:bg-purple-900'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'"
          >
            <span class="w-2 h-2 rounded-full" :class="status.isMock ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'"></span>
            {{ status.isMock ? 'Mode Simulation Actif' : 'Activer Simulation' }}
          </button>

          <button
            type="button"
            @click="togglePolling"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5"
            :class="isPolling
              ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'"
          >
            <span class="w-2 h-2 rounded-full" :class="isPolling ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'"></span>
            {{ isPolling ? 'Polling 2s' : 'Pause' }}
          </button>

          <button
            type="button"
            @click="refreshAll"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            Actualiser
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
      <!-- Status Banner -->
      <section
        data-testid="status-banner"
        class="rounded-2xl border p-4 transition-all shadow-xl"
        :class="{
          'bg-gradient-to-r from-emerald-950/30 to-slate-900 border-emerald-600/40 text-emerald-200': status.status === 'IN_GAME',
          'bg-gradient-to-r from-purple-950/30 to-slate-900 border-purple-600/40 text-purple-200': status.status === 'MOCK',
          'bg-gradient-to-r from-rose-950/30 to-slate-900 border-rose-800/40 text-rose-300': status.status === 'DISCONNECTED',
        }"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="relative flex h-3.5 w-3.5">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                :class="{
                  'bg-emerald-400': status.status === 'IN_GAME',
                  'bg-purple-400': status.status === 'MOCK',
                  'bg-rose-500': status.status === 'DISCONNECTED',
                }"
              ></span>
              <span
                class="relative inline-flex rounded-full h-3.5 w-3.5"
                :class="{
                  'bg-emerald-500': status.status === 'IN_GAME',
                  'bg-purple-500': status.status === 'MOCK',
                  'bg-rose-600': status.status === 'DISCONNECTED',
                }"
              ></span>
            </span>

            <div>
              <h2 class="text-sm font-bold tracking-wide flex items-center gap-2">
                <span v-if="status.status === 'IN_GAME'">Partie en cours détectée (Port 2999)</span>
                <span v-else-if="status.status === 'MOCK'">Mode Simulation / Mock actif</span>
                <span v-else>En attente du client League of Legends</span>
              </h2>
              <p class="text-xs opacity-80 mt-0.5">
                <span v-if="status.status === 'IN_GAME'">Synchronisation Live Client API active.</span>
                <span v-else-if="status.status === 'MOCK'">Snapshot simulé (16:45) avec détection d'achats d'items et kills.</span>
                <span v-else>Lancez une partie LoL (ou activez la Simulation ci-dessus pour tester).</span>
              </p>
            </div>
          </div>

          <!-- Quick Latency / Mode -->
          <div class="flex items-center gap-2 text-xs">
            <div class="bg-slate-950/60 rounded-xl px-3 py-1.5 border border-slate-800 text-center">
              <div class="text-[10px] uppercase text-slate-400 font-semibold">Mode</div>
              <div class="font-mono text-xs font-bold text-white">{{ gameData?.gameData?.gameMode || status.gameMode || '—' }}</div>
            </div>
            <div class="bg-slate-950/60 rounded-xl px-3 py-1.5 border border-slate-800 text-center">
              <div class="text-[10px] uppercase text-slate-400 font-semibold">Latence</div>
              <div class="font-mono text-xs font-bold text-cyan-400">{{ status.latencyMs !== undefined ? `${status.latencyMs}ms` : '—' }}</div>
            </div>
          </div>
        </div>

        <div v-if="lastError && status.status === 'DISCONNECTED'" class="mt-2 text-xs text-rose-400/90 font-mono bg-rose-950/40 p-2 rounded-lg border border-rose-900/50">
          Dernière erreur de connexion : {{ lastError }}
        </div>
      </section>

      <!-- VIEW 1: Tactical Dashboard -->
      <section v-if="currentView === 'tactical'" class="space-y-6">
        <TacticalDashboard
          v-if="isConnected"
          :game-data="gameData"
          :blue-economy="blueEconomy"
          :red-economy="redEconomy"
          :gold-difference="goldDifference"
          :diff-events="diffEvents"
          :formatted-game-time="formattedGameTime"
        />

        <div v-else class="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-4">
          <div class="text-4xl">🎮</div>
          <h3 class="text-base font-bold text-white">Aucune partie active détectée</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Pour afficher le tableau de bord tactique en direct, lancez une partie dans League of Legends ou activez le mode simulation.
          </p>
          <button
            type="button"
            @click="toggleMockMode"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-950/50"
          >
            Lancer le Mode Simulation (Démo)
          </button>
        </div>
      </section>

      <!-- VIEW 2: Raw Diagnostic Console -->
      <section v-if="currentView === 'diagnostic'" class="space-y-4">
        <!-- Navigation -->
        <div class="flex border-b border-slate-800 gap-2">
          <button
            type="button"
            data-testid="tab-overview"
            @click="activeTab = 'overview'"
            class="px-4 py-2 text-xs font-semibold border-b-2 transition"
            :class="activeTab === 'overview' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            Vue d'ensemble
          </button>
          <button
            type="button"
            data-testid="tab-players"
            @click="activeTab = 'players'"
            class="px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5"
            :class="activeTab === 'players' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            Joueurs
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {{ gameData?.allPlayers?.length || 0 }}
            </span>
          </button>
          <button
            type="button"
            data-testid="tab-events"
            @click="activeTab = 'events'"
            class="px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5"
            :class="activeTab === 'events' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            Événements Riot
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {{ events.length }}
            </span>
          </button>
          <button
            type="button"
            data-testid="tab-raw"
            @click="activeTab = 'raw'"
            class="px-4 py-2 text-xs font-semibold border-b-2 transition"
            :class="activeTab === 'raw' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            Payload JSON Brut
          </button>
        </div>

        <!-- Tab 1: Overview -->
        <div v-if="activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Active Player Card -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Joueur Local (Active Player)</h3>
            <div v-if="gameData?.activePlayer" class="space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <span class="text-sm font-bold text-white">{{ gameData.activePlayer.summonerName }}</span>
                <span class="text-xs font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded">
                  Niveau {{ gameData.activePlayer.level }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                <div class="bg-slate-950 p-2 rounded">
                  <span class="text-slate-400">Gold actuel:</span>
                  <span class="text-amber-400 font-bold ml-1">{{ gameData.activePlayer.currentGold }}g</span>
                </div>
                <div class="bg-slate-950 p-2 rounded">
                  <span class="text-slate-400">PV:</span>
                  <span class="text-emerald-400 ml-1">
                    {{ gameData.activePlayer.championStats?.currentHealth?.toFixed(0) || '—' }} /
                    {{ gameData.activePlayer.championStats?.maxHealth?.toFixed(0) || '—' }}
                  </span>
                </div>
                <div class="bg-slate-950 p-2 rounded">
                  <span class="text-slate-400">AD:</span>
                  <span class="text-orange-400 ml-1">{{ gameData.activePlayer.championStats?.attackDamage?.toFixed(0) || '—' }}</span>
                </div>
                <div class="bg-slate-950 p-2 rounded">
                  <span class="text-slate-400">AP:</span>
                  <span class="text-purple-400 ml-1">{{ gameData.activePlayer.championStats?.abilityPower?.toFixed(0) || '—' }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-slate-500 py-6 text-center">
              Aucune donnée de joueur local active.
            </div>
          </div>

          <!-- Quick Event Log -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Derniers Événements Détectés</h3>
            <div v-if="events.length > 0" class="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div
                v-for="e in events.slice(-5).reverse()"
                :key="e.EventID"
                class="text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <span class="font-mono text-cyan-400 text-[10px]">
                    {{ Math.floor(e.EventTime / 60) }}:{{ String(Math.floor(e.EventTime % 60)).padStart(2, '0') }}
                  </span>
                  <span class="font-bold text-slate-200">{{ e.EventName }}</span>
                  <span v-if="e.KillerName && e.VictimName" class="text-slate-400">
                    {{ e.KillerName.split('#')[0] }} ⚔️ {{ e.VictimName.split('#')[0] }}
                  </span>
                  <span v-else-if="e.TurretKilled" class="text-amber-400">
                    {{ e.TurretKilled }}
                  </span>
                  <span v-else-if="e.DragonType" class="text-indigo-400">
                    Dragon {{ e.DragonType }}
                  </span>
                </div>
                <span class="text-[10px] text-slate-500">ID #{{ e.EventID }}</span>
              </div>
            </div>
            <div v-else class="text-xs text-slate-500 py-6 text-center">
              Aucun événement pour l'instant.
            </div>
          </div>
        </div>

        <!-- Tab 2: Players List -->
        <div v-if="activeTab === 'players'" class="space-y-4">
          <div v-if="gameData?.allPlayers?.length" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Team Order (Blue) -->
            <div class="bg-slate-900 border border-blue-900/40 rounded-xl overflow-hidden">
              <div class="bg-blue-950/60 px-4 py-2.5 border-b border-blue-900/40 flex items-center justify-between">
                <span class="text-xs font-bold uppercase text-blue-300 tracking-wider">Équipe Bleue (Order)</span>
              </div>
              <div class="divide-y divide-slate-800/80">
                <div
                  v-for="p in gameData.allPlayers.filter(pl => pl.team === 'ORDER')"
                  :key="p.summonerName"
                  class="p-3 hover:bg-slate-800/30 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-white">{{ p.championName }}</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{{ p.position }}</span>
                      <span v-if="p.isDead" class="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded">
                        MORT ({{ p.respawnTimer }}s)
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">
                      {{ p.summonerName }} • Niv. {{ p.level }} • KDA: {{ p.scores.kills }}/{{ p.scores.deaths }}/{{ p.scores.assists }} ({{ p.scores.creepScore }} CS)
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <span
                      v-for="(item, i) in p.items"
                      :key="i"
                      :title="item.displayName"
                      class="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300 truncate max-w-[100px]"
                    >
                      {{ item.displayName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Team Chaos (Red) -->
            <div class="bg-slate-900 border border-rose-900/40 rounded-xl overflow-hidden">
              <div class="bg-rose-950/60 px-4 py-2.5 border-b border-rose-900/40 flex items-center justify-between">
                <span class="text-xs font-bold uppercase text-rose-300 tracking-wider">Équipe Rouge (Chaos)</span>
              </div>
              <div class="divide-y divide-slate-800/80">
                <div
                  v-for="p in gameData.allPlayers.filter(pl => pl.team === 'CHAOS')"
                  :key="p.summonerName"
                  class="p-3 hover:bg-slate-800/30 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-white">{{ p.championName }}</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{{ p.position }}</span>
                      <span v-if="p.isDead" class="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded">
                        MORT ({{ p.respawnTimer }}s)
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">
                      {{ p.summonerName }} • Niv. {{ p.level }} • KDA: {{ p.scores.kills }}/{{ p.scores.deaths }}/{{ p.scores.assists }} ({{ p.scores.creepScore }} CS)
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <span
                      v-for="(item, i) in p.items"
                      :key="i"
                      :title="item.displayName"
                      class="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300 truncate max-w-[100px]"
                    >
                      {{ item.displayName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Events -->
        <div v-if="activeTab === 'events'" class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div v-if="events.length" class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="e in events"
              :key="e.EventID"
              class="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3">
                <span class="font-mono text-cyan-400 text-xs font-semibold">
                  {{ Math.floor(e.EventTime / 60) }}:{{ String(Math.floor(e.EventTime % 60)).padStart(2, '0') }}
                </span>
                <span class="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">{{ e.EventName }}</span>
                <span class="text-slate-300">
                  <template v-if="e.KillerName && e.VictimName">
                    <span class="font-semibold text-emerald-400">{{ e.KillerName }}</span> a tué <span class="font-semibold text-rose-400">{{ e.VictimName }}</span>
                    <span v-if="e.Assisters?.length" class="text-slate-400 text-[11px]"> (Assists: {{ e.Assisters.join(', ') }})</span>
                  </template>
                  <template v-else-if="e.EventName === 'FirstBlood'">
                    Premier Sang (First Blood) obtenu par <span class="font-semibold text-emerald-400">{{ e.Recipient }}</span>
                  </template>
                  <template v-else-if="e.TurretKilled">
                    Tour détruite: <span class="font-semibold text-amber-300">{{ e.TurretKilled }}</span> par {{ e.KillerName }}
                  </template>
                  <template v-else-if="e.DragonType">
                    Dragon <span class="font-semibold text-indigo-300">{{ e.DragonType }}</span> éliminé par {{ e.KillerName }}
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
        <div v-if="activeTab === 'raw'" class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <pre class="text-xs font-mono bg-slate-950 p-4 rounded-lg overflow-x-auto text-cyan-300/90 max-h-[500px]">{{ JSON.stringify(gameData || status, null, 2) }}</pre>
        </div>
      </section>
    </main>

    <!-- Riot Games Legal Disclaimer Footer -->
    <footer class="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-[11px] text-slate-500">
      <div class="max-w-4xl mx-auto space-y-1">
        <p>
          RiftVision isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.
        </p>
        <p>
          Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
        </p>
      </div>
    </footer>
  </div>
</template>
