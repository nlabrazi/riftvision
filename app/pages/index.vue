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
  startMockMode,
  stopMockMode,
  togglePolling,
} = useRiotLive()

const currentView = ref<'tactical' | 'diagnostic'>('tactical')
const activeTab = ref<'overview' | 'players' | 'events' | 'raw'>('overview')
</script>

<template>
  <div
    class="relative min-h-screen bg-[#010a13] text-slate-100 flex flex-col font-sans selection:bg-[#c8aa6e] selection:text-black">
    <!-- LoL Atmospheric Background Texture & Vignette Overlay -->
    <div class="fixed inset-0 pointer-events-none bg-cover bg-center opacity-25 z-0"
      style="background-image: url('/assets/images/background.jpg');"></div>
    <div class="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#010a13]/85 via-[#010a13]/90 to-[#010a13] z-0">
    </div>

    <!-- Header -->
    <header
      class="relative z-30 border-b border-[#785a28]/40 bg-[#091428]/95 backdrop-blur-md sticky top-0 px-6 py-3.5 shadow-2xl">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div
            class="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-[#785a28] via-[#c8aa6e] to-[#f0e6d2] p-[1px] shadow-lg shadow-[#785a28]/40">
            <div
              class="w-full h-full bg-[#010a13] rounded-xl flex items-center justify-center font-cinzel font-black text-lg text-gold-gradient">
              RV
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold tracking-wider font-cinzel text-gold-gradient drop-shadow">
                RiftVision
              </h1>
              <span
                class="text-xs px-2 py-0.5 rounded font-rajdhani font-bold bg-[#010a13] border border-[#785a28] text-[#c8aa6e]">
                v0.2.0
              </span>
            </div>
            <p class="text-xs font-rajdhani font-semibold text-[#c8aa6e]/80 tracking-wide">
              Copilote Tactique Second-Screen LoL
            </p>
          </div>
        </div>

        <!-- View Switcher -->
        <div
          class="flex items-center bg-[#010a13] p-1 rounded-xl border border-[#785a28]/50 text-xs font-rajdhani font-bold shadow-inner">
          <button type="button" data-testid="view-tactical-btn" @click="currentView = 'tactical'"
            class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
            :class="currentView === 'tactical' ? 'bg-[#c8aa6e] text-black shadow font-black' : 'text-slate-400 hover:text-white'">
            <span>⚔️</span> Tableau Tactique
          </button>
          <button type="button" data-testid="view-diagnostic-btn" @click="currentView = 'diagnostic'"
            class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
            :class="currentView === 'diagnostic' ? 'bg-[#c8aa6e] text-black shadow font-black' : 'text-slate-400 hover:text-white'">
            <span>🛠️</span> Diagnostic API
          </button>
        </div>

        <!-- Controls -->
        <div class="flex items-center flex-wrap gap-2.5 font-rajdhani font-bold text-xs">
          <button type="button" data-testid="mock-toggle-button" @click="status.isMock ? stopMockMode() : startMockMode()"
            class="px-3.5 py-1.5 rounded-lg transition border flex items-center gap-2 shadow-sm" :class="status.isMock
              ? 'bg-rose-950/90 border-rose-500/80 text-rose-200 hover:bg-rose-900 hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-[#010a13] border-[#785a28]/60 text-[#c8aa6e] hover:border-[#c8aa6e] hover:text-[#f0e6d2]'">
            <span v-if="status.isMock" class="w-2 h-2 rounded-sm bg-rose-400"></span>
            <span v-else class="w-2 h-2 rounded-full bg-[#785a28]"></span>
            {{ status.isMock ? '⏹️ Arrêter la Démo' : '▶️ Activer Simulation' }}
          </button>

          <button type="button" @click="togglePolling"
            class="px-3 py-1.5 rounded-lg transition border flex items-center gap-2" :class="isPolling
              ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'bg-[#010a13] border-slate-800 text-slate-400'">
            <span class="w-2 h-2 rounded-full"
              :class="isPolling ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'"></span>
            {{ isPolling ? 'Polling 2s' : 'Pause' }}
          </button>

          <button type="button" @click="refreshAll" class="px-3.5 py-1.5 rounded-lg btn-hextech-gold shadow">
            Actualiser
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="relative z-10 flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
      <!-- Status Banner -->
      <section data-testid="status-banner"
        class="rounded-2xl border p-4 transition-all duration-300 shadow-2xl backdrop-blur-md" :class="{
          'bg-gradient-to-r from-emerald-950/40 via-[#091428] to-slate-900 border-emerald-600/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]': status.status === 'IN_GAME',
          'bg-gradient-to-r from-purple-950/40 via-[#091428] to-slate-900 border-[#c8aa6e]/60 text-[#f0e6d2] shadow-[0_0_20px_rgba(200,170,110,0.15)]': status.status === 'MOCK',
          'bg-gradient-to-r from-rose-950/40 via-[#091428] to-slate-900 border-rose-800/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.1)]': status.status === 'DISCONNECTED',
        }">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <span class="relative flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="{
                'bg-emerald-400': status.status === 'IN_GAME',
                'bg-purple-400': status.status === 'MOCK',
                'bg-rose-500': status.status === 'DISCONNECTED',
              }"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5" :class="{
                'bg-emerald-500': status.status === 'IN_GAME',
                'bg-purple-500': status.status === 'MOCK',
                'bg-rose-600': status.status === 'DISCONNECTED',
              }"></span>
            </span>

            <div>
              <div class="text-sm font-bold font-cinzel tracking-wide flex items-center gap-2.5">
                <span v-if="status.status === 'IN_GAME'">Partie en cours détectée (Port 2999)</span>
                <span v-else-if="status.status === 'MOCK'" class="flex items-center gap-3">
                  <span>Mode Simulation / Mock actif</span>
                  <button type="button" @click="stopMockMode"
                    class="px-2.5 py-0.5 rounded-md text-[11px] font-rajdhani font-bold bg-rose-900/80 hover:bg-rose-800 border border-rose-600 text-rose-200 transition flex items-center gap-1 shadow">
                    <span>⏹️</span>
                    <span>Arrêter la Démo</span>
                  </button>
                </span>
                <span v-else>En attente du client League of Legends</span>
              </div>
              <p class="text-xs opacity-80 mt-0.5 font-sans">
                <span v-if="status.status === 'IN_GAME'">Synchronisation Live Client API active.</span>
                <span v-else-if="status.status === 'MOCK'">Snapshot simulé (16:45) avec détection d'achats d'items et
                  kills.</span>
                <span v-else>Lancez une partie LoL (ou activez la Simulation ci-dessus pour tester).</span>
              </p>
            </div>
          </div>

          <!-- Quick Latency / Mode Chips -->
          <div class="flex items-center gap-2 text-xs font-rajdhani">
            <div class="bg-[#010a13]/80 rounded-xl px-3 py-1.5 border border-[#785a28]/40 text-center">
              <div class="text-[10px] uppercase text-slate-400 font-semibold">Mode</div>
              <div class="font-bold text-white tracking-wider">
                {{ gameData?.gameData?.gameMode || status.gameMode || '—' }}
              </div>
            </div>
            <div class="bg-[#010a13]/80 rounded-xl px-3 py-1.5 border border-[#785a28]/40 text-center">
              <div class="text-[10px] uppercase text-slate-400 font-semibold">Latence</div>
              <div class="font-bold text-cyan-400 tracking-wider">
                {{ status.latencyMs !== undefined ? `${status.latencyMs}ms` : '—' }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="lastError && status.status === 'DISCONNECTED'"
          class="mt-2.5 text-xs text-rose-300 font-mono bg-rose-950/50 p-2.5 rounded-lg border border-rose-900/60">
          Dernière erreur de connexion : {{ lastError }}
        </div>
      </section>

      <!-- VIEW 1: Tactical Dashboard -->
      <section v-if="currentView === 'tactical'" class="space-y-6">
        <TacticalDashboard v-if="isConnected" :game-data="gameData" :blue-economy="blueEconomy"
          :red-economy="redEconomy" :gold-difference="goldDifference" :diff-events="diffEvents"
          :formatted-game-time="formattedGameTime" :is-mock="status.isMock" @stop-mock="stopMockMode" />

        <div v-else class="text-center py-20 hextech-card rounded-2xl p-8 space-y-4">
          <div class="text-5xl drop-shadow">⚔️</div>
          <h3 class="text-lg font-bold font-cinzel text-gold-gradient">
            Aucune partie active détectée
          </h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Pour afficher le tableau de bord tactique en direct, lancez une partie dans League of Legends ou activez le
            mode simulation ci-dessus.
          </p>
          <button type="button" @click="startMockMode"
            class="px-5 py-2.5 rounded-xl text-xs font-bold font-rajdhani bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white transition shadow-lg shadow-purple-950/60 border border-purple-400/40 uppercase tracking-wider">
            Lancer le Mode Simulation (Démo)
          </button>
        </div>
      </section>

      <!-- VIEW 2: Raw Diagnostic Console -->
      <section v-if="currentView === 'diagnostic'" class="space-y-4">
        <!-- Navigation Tabs -->
        <div class="flex border-b border-[#785a28]/40 gap-2 font-rajdhani font-bold text-sm">
          <button type="button" data-testid="tab-overview" @click="activeTab = 'overview'"
            class="px-4 py-2 border-b-2 transition"
            :class="activeTab === 'overview' ? 'border-[#c8aa6e] text-[#f0e6d2]' : 'border-transparent text-slate-400 hover:text-white'">
            Vue d'ensemble
          </button>
          <button type="button" data-testid="tab-players" @click="activeTab = 'players'"
            class="px-4 py-2 border-b-2 transition flex items-center gap-1.5"
            :class="activeTab === 'players' ? 'border-[#c8aa6e] text-[#f0e6d2]' : 'border-transparent text-slate-400 hover:text-white'">
            Joueurs
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-[#010a13] border border-[#785a28]/50 text-[#c8aa6e]">
              {{ gameData?.allPlayers?.length || 0 }}
            </span>
          </button>
          <button type="button" data-testid="tab-events" @click="activeTab = 'events'"
            class="px-4 py-2 border-b-2 transition flex items-center gap-1.5"
            :class="activeTab === 'events' ? 'border-[#c8aa6e] text-[#f0e6d2]' : 'border-transparent text-slate-400 hover:text-white'">
            Événements Riot
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-[#010a13] border border-[#785a28]/50 text-[#c8aa6e]">
              {{ events.length }}
            </span>
          </button>
          <button type="button" data-testid="tab-raw" @click="activeTab = 'raw'" class="px-4 py-2 border-b-2 transition"
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
    </main>

    <!-- Riot Games Legal Disclaimer Footer -->
    <footer
      class="relative z-10 border-t border-[#785a28]/40 bg-[#091428]/95 py-4 px-6 text-center text-[11px] text-slate-400">
      <div class="max-w-4xl mx-auto space-y-1">
        <p>
          RiftVision isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone
          officially involved in producing or managing Riot Games properties.
        </p>
        <p class="text-[#c8aa6e]/60">
          Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
        </p>
      </div>
    </footer>
  </div>
</template>
