<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import AppFooter from '../components/AppFooter.vue'
import DiagnosticPanel from '../components/DiagnosticPanel.vue'
import FlashAlertOverlay from '../components/FlashAlertOverlay.vue'
import FocusRadarView from '../components/FocusRadarView.vue'
import RvIcon from '../components/RvIcon.vue'
import TacticalDashboard from '../components/TacticalDashboard.vue'
import { useFlashAlerts } from '../composables/useFlashAlerts'
import { useRiotLive } from '../composables/useRiotLive'

const {
  status,
  isLiveActive,
  gameData,
  events,
  diffEvents,
  latestLiveEvents,
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
  toggleLiveMode,
  togglePolling,
} = useRiotLive()
const { isAudioMuted, toggleAudioMute, ingestDiffEvents, clearAlerts } = useFlashAlerts()
const currentView = ref<'tactical' | 'radar' | 'diagnostic'>('tactical')
const isChangingMode = ref(false)
const isRefreshing = ref(false)
const hasGame = computed(() => isConnected.value && !!gameData.value)
const isImmersive = computed(() => currentView.value === 'radar' && hasGame.value)
const statusText = computed(() => {
  if (status.value.isMock) return 'Mode Simulation / Mock actif'
  if (status.value.status === 'IN_GAME') return 'Partie en cours'
  if (isLiveActive.value) return 'Recherche de partie en cours…'
  return 'En attente du client League of Legends'
})
const viewEyebrow = computed(() => {
  return currentView.value === 'diagnostic' ? 'OUTILS DE CONNEXION' : 'CENTRE TACTIQUE'
})
const viewHeading = computed(() => {
  if (currentView.value === 'diagnostic') return 'Diagnostic API'
  if (currentView.value === 'radar') return 'Carte immersive'
  return 'Vue d’ensemble'
})

async function changeMode(action: () => Promise<void>) {
  if (isChangingMode.value) return
  isChangingMode.value = true
  clearAlerts()
  try {
    await action()
  } finally {
    isChangingMode.value = false
  }
}

async function refresh() {
  isRefreshing.value = true
  try {
    await refreshAll()
  } finally {
    isRefreshing.value = false
  }
}

watch(latestLiveEvents, (fresh) => {
  if (fresh.length) ingestDiffEvents(fresh)
})
watch(hasGame, (connected) => {
  if (!connected) clearAlerts()
})
onUnmounted(clearAlerts)
</script>

<template>
  <div class="rift-app" :class="{ 'rift-app--immersive': isImmersive }">
    <a class="skip-link" href="#main-content">Aller au contenu</a>
    <header class="app-header">
      <div class="app-brand">
        <div class="brand-symbol" aria-hidden="true"><span>R</span><i></i></div>
        <div>
          <div class="brand-title">
            <h1>RiftVision</h1><span class="version-tag">1.1</span>
          </div>
          <p>VOTRE REGARD SUR LA FAILLE</p>
        </div>
      </div>

      <nav class="view-navigation" aria-label="Vues principales">
        <button type="button" data-testid="view-tactical-btn" :aria-pressed="currentView === 'tactical'"
          :class="{ 'is-active': currentView === 'tactical' }" @click="currentView = 'tactical'">
          <RvIcon name="dashboard" :size="17" /><span>Dashboard</span>
        </button>
        <button type="button" data-testid="view-map-btn" :aria-pressed="currentView === 'radar'"
          :class="{ 'is-active': currentView === 'radar' }" @click="currentView = 'radar'">
          <RvIcon name="map" :size="18" /><span>Carte immersive</span>
        </button>
      </nav>

      <div class="header-controls">
        <button type="button" data-testid="live-toggle-button" class="rv-button live-button"
          :class="{ 'is-listening': isLiveActive }" :aria-pressed="isLiveActive" :disabled="isChangingMode"
          @click="changeMode(toggleLiveMode)">
          <span class="status-dot" :class="{ 'status-dot--live': isLiveActive }"></span>
          {{ isLiveActive ? 'Arrêter Live' : 'Activer Live' }}
        </button>
        <button type="button" data-testid="mock-toggle-button" class="rv-button demo-button"
          :class="{ 'is-demo': status.isMock }" :aria-pressed="status.isMock" :disabled="isChangingMode"
          @click="changeMode(toggleMockMode)">
          <RvIcon :name="status.isMock ? 'close' : 'flask'" :size="15" />
          {{ status.isMock ? 'Arrêter la démo' : 'Activer Simulation' }}
        </button>
        <span class="control-divider" aria-hidden="true"></span>
        <button type="button" data-testid="audio-toggle-btn" class="rv-icon-button" @click="toggleAudioMute"
          :aria-label="isAudioMuted ? 'Muet : activer les alertes sonores' : 'Audio : couper les alertes sonores'"
          :title="isAudioMuted ? 'Activer les alertes sonores' : 'Couper les alertes sonores'"
          :aria-pressed="!isAudioMuted">
          <RvIcon :name="isAudioMuted ? 'volume-off' : 'volume'" />
          <span class="sr-only">{{ isAudioMuted ? 'Muet' : 'Audio' }}</span>
        </button>
        <button type="button" data-testid="view-diagnostic-btn" class="rv-icon-button" title="Diagnostic API"
          aria-label="Ouvrir le diagnostic API" :aria-pressed="currentView === 'diagnostic'"
          @click="currentView = currentView === 'diagnostic' ? 'tactical' : 'diagnostic'">
          <RvIcon name="settings" />
        </button>
      </div>
    </header>

    <main id="main-content" tabindex="-1" class="app-main" :class="{ 'app-main--immersive': isImmersive }">
      <div class="workspace-heading" :class="{ 'workspace-heading--immersive': isImmersive }">
        <div v-if="!isImmersive" class="workspace-title">
          <p class="rv-eyebrow">{{ viewEyebrow }}</p>
          <h2>{{ viewHeading }}</h2>
        </div>
        <div class="session-toolbar">
          <div data-testid="status-banner" class="session-status" role="status">
            <span class="status-dot"
              :class="{ 'status-dot--live': status.status === 'IN_GAME', 'status-dot--demo': status.isMock, 'status-dot--waiting': isLiveActive && !hasGame }"></span>
            <span>{{ statusText }}</span>
          </div>
          <span v-if="hasGame" class="sync-label" :class="{ 'is-paused': !isPolling }">
            {{ isPolling ? 'Synchronisé · 2 s' : 'Synchronisation en pause' }}
          </span>
          <template v-if="hasGame">
            <button type="button" data-testid="polling-toggle-btn" class="rv-icon-button" :aria-pressed="!isPolling"
              :aria-label="isPolling ? 'Mettre la synchronisation en pause' : 'Reprendre la synchronisation'"
              :title="isPolling ? 'Mettre en pause' : 'Reprendre'" @click="togglePolling">
              <RvIcon :name="isPolling ? 'pause' : 'play'" :size="16" />
            </button>
            <button type="button" class="rv-icon-button" aria-label="Actualiser les données" title="Actualiser"
              :disabled="isRefreshing || isChangingMode" @click="refresh">
              <RvIcon name="refresh" :size="16" :class="{ 'is-spinning': isRefreshing }" />
            </button>
          </template>
        </div>
      </div>

      <TacticalDashboard v-if="currentView === 'tactical' && hasGame" :game-data="gameData" :blue-economy="blueEconomy"
        :red-economy="redEconomy" :gold-difference="goldDifference" :diff-events="diffEvents"
        :formatted-game-time="formattedGameTime" :is-mock="status.isMock" :is-polling="isPolling"
        @stop-mock="changeMode(stopMockMode)" @switch-view="currentView = 'radar'" />

      <FocusRadarView v-else-if="isImmersive" :game-data="gameData" :blue-economy="blueEconomy"
        :red-economy="redEconomy" :gold-difference="goldDifference" :diff-events="diffEvents"
        :formatted-game-time="formattedGameTime" :is-mock="status.isMock" :is-polling="isPolling"
        @switch-view="currentView = $event" />

      <div v-else-if="currentView === 'diagnostic'" class="diagnostic-workspace">
        <div class="diagnostic-connection rv-panel">
          <span>Latence <strong>{{ status.latencyMs !== undefined ? `${status.latencyMs} ms` : '—' }}</strong></span>
          <span>Mode <strong>{{ gameData?.gameData.gameMode || 'Veille' }}</strong></span>
          <button type="button" class="rv-button" :disabled="isRefreshing" @click="refresh">
            <RvIcon name="refresh" :size="15" />Actualiser
          </button>
        </div>
        <p v-if="lastError" class="connection-error">Dernière erreur de connexion : {{ lastError }}</p>
        <DiagnosticPanel :game-data="gameData" :events="events" :status="status" />
      </div>

      <section v-else class="standby-panel rv-panel" aria-labelledby="standby-title">
        <div class="standby-copy">
          <span class="standby-badge">
            <span class="status-dot" :class="{ 'status-dot--waiting': isLiveActive }"></span>
            <template v-if="isLiveActive">ÉCOUTE ACTIVE</template>
            <template v-else>PRÊT POUR LA PROCHAINE PARTIE</template>
          </span>
          <h3 id="standby-title">Gardez une longueur<br /><span>d’avance.</span></h3>
          <p>La Faille, les combats et les moments décisifs.<br class="desktop-break" /> Toutes vos informations
            tactiques
            réunies sur un second écran.</p>
          <div class="standby-actions">
            <button type="button" class="rv-button rv-button-primary" :disabled="isChangingMode"
              @click="changeMode(toggleLiveMode)">
              <RvIcon :name="isLiveActive ? 'pause' : 'signal'" :size="17" />
              {{ isLiveActive ? 'Arrêter la recherche' : 'Connecter ma partie' }}
            </button>
            <button type="button" class="rv-button" :disabled="isChangingMode"
              @click="changeMode(startMockMode)">Explorer la
              démo
              <RvIcon name="arrow-up-right" :size="16" />
            </button>
          </div>
          <p v-if="isLiveActive" class="standby-hint">Lancez une partie : la connexion se fera automatiquement.</p>
          <p v-else class="standby-hint">Lancez une partie de League of Legends, puis activez le Live.</p>
          <div class="standby-features">
            <div>
              <RvIcon name="dashboard" /><span>Dashboard & combat log</span>
            </div>
            <div>
              <RvIcon name="crosshair" /><span>Carte & alertes en direct</span>
            </div>
          </div>
        </div>
        <div class="standby-map" aria-hidden="true">
          <div class="standby-map-ring"></div>
          <img src="/assets/images/sr-map.png" alt="" />
          <span class="standby-map-label">
            <RvIcon name="crosshair" :size="14" />FAILLE DE L’INVOCATEUR
          </span>
          <span class="standby-map-point standby-map-point--blue"></span>
          <span class="standby-map-point standby-map-point--red"></span>
        </div>
      </section>

      <FlashAlertOverlay v-if="!isImmersive" />
    </main>

    <AppFooter />
  </div>
</template>
