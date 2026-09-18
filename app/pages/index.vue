<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { CombatLogFilter, GameDiffEvent } from '#shared/types/diff'
import AlertTester from '../components/AlertTester.vue'
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
  startMockMode,
  stopMockMode,
  startLiveMode,
  stopLiveMode,
  togglePolling,
} = useRiotLive()
const { isAudioMuted, toggleAudioMute, ingestDiffEvents, clearAlerts, triggerDemoAlert } =
  useFlashAlerts()
const currentView = ref<'tactical' | 'radar'>('tactical')
const isHelpOpen = ref(false)
const isChangingMode = ref(false)
const isRefreshing = ref(false)
const selectedEvent = ref<GameDiffEvent | null>(null)
const journalFilter = ref<CombatLogFilter>('all')
const journalSearch = ref('')
const hasGame = computed(() => isConnected.value && !!gameData.value)
const isImmersive = computed(
  () => currentView.value === 'radar' && hasGame.value && !isHelpOpen.value,
)
const statusText = computed(() => {
  if (status.value.isMock) return 'Démo · exemple de partie à 16:45'
  if (hasGame.value && !isPolling.value) return 'Suivi en pause · données figées'
  if (hasGame.value && lastError.value)
    return 'Connexion interrompue · nouvelle tentative automatique'
  if (hasGame.value) return 'Partie connectée · mise à jour automatique'
  if (isLiveActive.value) return 'Recherche de votre partie…'
  return 'Aucune partie connectée'
})
const viewHeading = computed(() => {
  if (isHelpOpen.value) return 'Aide et réglages'
  if (hasGame.value) return 'Votre partie en un coup d’œil'
  return 'Bienvenue sur RiftVision'
})

async function focusContent() {
  await nextTick()
  document.getElementById('main-content')?.focus({ preventScroll: true })
  window.scrollTo(0, 0)
}

function switchView(view: 'tactical' | 'radar') {
  currentView.value = view
  focusContent()
}

function returnHome() {
  isHelpOpen.value = false
  switchView('tactical')
}

function toggleHelp() {
  isHelpOpen.value = !isHelpOpen.value
  focusContent()
}

async function changeMode(action: () => void | Promise<void>) {
  if (isChangingMode.value) return
  isChangingMode.value = true
  clearAlerts()
  selectedEvent.value = null
  journalFilter.value = 'all'
  journalSearch.value = ''
  currentView.value = 'tactical'
  isHelpOpen.value = false
  try {
    await action()
  } finally {
    isChangingMode.value = false
    focusContent()
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
  if (!connected) {
    clearAlerts()
    selectedEvent.value = null
    journalFilter.value = 'all'
    journalSearch.value = ''
    currentView.value = 'tactical'
  }
})
onUnmounted(clearAlerts)
</script>

<template>
  <div class="rift-app" :class="{ 'rift-app--immersive': isImmersive }">
    <a class="skip-link" href="#main-content">Aller au contenu</a>
    <header class="app-header">
      <a href="/" class="app-brand" :aria-label="hasGame ? 'Revenir au tableau de bord' : 'Revenir à l’accueil'"
        @click.exact.prevent="returnHome">
        <div class="brand-symbol" aria-hidden="true"><span>R</span><i></i></div>
        <div>
          <div class="brand-title"><h1>RiftVision</h1><span class="version-tag">1.1</span></div>
          <p>VOTRE REGARD SUR LA FAILLE</p>
        </div>
      </a>
      <div class="header-controls">
        <button v-if="hasGame" type="button" data-testid="audio-toggle-btn" class="rv-button"
          :aria-label="isAudioMuted ? 'Activer les alertes sonores' : 'Couper les alertes sonores'"
          :aria-pressed="!isAudioMuted" @click="toggleAudioMute">
          <RvIcon :name="isAudioMuted ? 'volume-off' : 'volume'" :size="17" />
          <span>{{ isAudioMuted ? 'Son coupé' : 'Son activé' }}</span>
        </button>
        <button v-if="!isHelpOpen" type="button" data-testid="view-diagnostic-btn" class="rv-button" @click="toggleHelp">
          <RvIcon name="settings" :size="17" /><span>Aide et réglages</span>
        </button>
      </div>
    </header>

    <main id="main-content" tabindex="-1" class="app-main" :class="{ 'app-main--immersive': isImmersive }" :aria-busy="isChangingMode">
      <div v-if="!isImmersive" class="workspace-heading">
        <div class="workspace-title"><h2>{{ viewHeading }}</h2></div>
        <button v-if="isHelpOpen" type="button" data-testid="close-help-btn" class="rv-button" @click="toggleHelp">
          <RvIcon name="arrow-left" :size="16" />
          {{ hasGame ? currentView === 'radar' ? 'Revenir à la carte' : 'Revenir à ma partie' : 'Revenir à l’accueil' }}
        </button>
      </div>

      <div class="session-bar" :class="{ 'session-bar--demo': status.isMock }">
        <div class="session-copy">
          <div data-testid="status-banner" class="session-status" role="status">
            <span class="status-dot" :class="{ 'status-dot--live': hasGame && !status.isMock && isPolling && !lastError, 'status-dot--demo': status.isMock, 'status-dot--waiting': isLiveActive && !hasGame }"></span>
            <span>{{ statusText }}</span>
          </div>
          <p v-if="status.isMock">Les données sont figées. Explorez la carte et le journal librement.</p>
        </div>
        <div v-if="!isHelpOpen" class="session-actions">
          <template v-if="status.isMock">
            <button v-if="hasGame" type="button" class="rv-button" data-testid="test-alert-dragon" @click="triggerDemoAlert('DRAGON')">
              <RvIcon name="flask" :size="15" />Tester une alerte
            </button>
            <button type="button" data-testid="live-toggle-button" class="rv-button rv-button-primary" :disabled="isChangingMode" @click="changeMode(startLiveMode)">Connecter ma partie</button>
            <button type="button" data-testid="mock-toggle-button" class="rv-button rv-button-quiet" :disabled="isChangingMode" @click="changeMode(stopMockMode)">Quitter la démo</button>
          </template>
          <template v-else-if="hasGame">
            <button v-if="!isPolling" type="button" class="rv-button rv-button-primary" @click="togglePolling">Reprendre le suivi</button>
            <button type="button" data-testid="live-toggle-button" class="rv-button rv-button-quiet" :disabled="isChangingMode" @click="changeMode(stopLiveMode)">Déconnecter</button>
          </template>
        </div>
      </div>

      <div v-if="isHelpOpen" class="diagnostic-workspace">
        <section class="rv-panel help-panel" aria-labelledby="connection-help-title">
          <h3 id="connection-help-title">Connecter votre partie</h3>
          <ol class="connection-steps">
            <li><strong>Lancez une partie de League of Legends.</strong><span>Le client ouvert ou la sélection des champions ne suffisent pas : entrez sur la carte.</span></li>
            <li><strong>Connectez RiftVision depuis l’accueil.</strong><span>RiftVision doit être lancé sur le même ordinateur que le jeu. Vous pouvez ouvrir cette page sur votre second écran ou votre tablette.</span></li>
            <li><strong>Gardez le tableau de bord ouvert.</strong><span>Les scores, le journal et les alertes se mettent à jour automatiquement pendant la partie.</span></li>
          </ol>
        </section>
        <section class="rv-panel help-panel" aria-labelledby="reading-help-title">
          <h3 id="reading-help-title">Comprendre le tableau de bord</h3>
          <p>Sélectionnez un événement du journal pour afficher son détail sur la carte. Le bouton « Agrandir la carte » donne plus de place à la carte et aux alertes.</p>
          <p>Les champions sont placés selon leur rôle : ce ne sont pas leurs positions en temps réel. L’économie compare la valeur des objets équipés, pas l’or total gagné.</p>
        </section>
        <details class="rv-panel advanced-tools">
          <summary>Diagnostic technique <span>Connexion et données brutes</span><RvIcon name="chevron-down" :size="16" /></summary>
          <div class="advanced-content">
            <div class="diagnostic-connection">
              <span>Latence <strong>{{ status.latencyMs !== undefined ? `${status.latencyMs} ms` : '—' }}</strong></span>
              <div class="diagnostic-actions">
                <button v-if="hasGame && !status.isMock" type="button" data-testid="polling-toggle-btn" class="rv-button" :aria-pressed="!isPolling" @click="togglePolling">
                  <RvIcon :name="isPolling ? 'pause' : 'play'" :size="15" />{{ isPolling ? 'Mettre le suivi en pause' : 'Reprendre le suivi' }}
                </button>
                <button type="button" class="rv-button" :disabled="isRefreshing || isChangingMode" @click="refresh">
                  <RvIcon name="refresh" :size="15" :class="{ 'is-spinning': isRefreshing }" />{{ isRefreshing ? 'Vérification…' : 'Vérifier la connexion' }}
                </button>
              </div>
            </div>
            <p v-if="lastError" class="connection-error">Dernière erreur de connexion : {{ lastError }}</p>
            <AlertTester v-if="status.isMock" />
            <DiagnosticPanel :game-data="gameData" :events="events" :status="status" />
          </div>
        </details>
      </div>

      <TacticalDashboard v-else-if="hasGame && currentView === 'tactical'" v-model:selected-event="selectedEvent"
        v-model:filter="journalFilter" v-model:search="journalSearch"
        :game-data="gameData" :blue-economy="blueEconomy" :red-economy="redEconomy" :gold-difference="goldDifference"
        :diff-events="diffEvents" :formatted-game-time="formattedGameTime" :is-mock="status.isMock" :is-polling="isPolling"
        @switch-view="switchView('radar')" />

      <FocusRadarView v-else-if="isImmersive" v-model:selected-event="selectedEvent" v-model:filter="journalFilter" v-model:search="journalSearch"
        :game-data="gameData" :blue-economy="blueEconomy" :red-economy="redEconomy" :gold-difference="goldDifference"
        :diff-events="diffEvents" :formatted-game-time="formattedGameTime" :is-mock="status.isMock" :is-polling="isPolling"
        @switch-view="switchView('tactical')" />

      <section v-else class="standby-panel rv-panel" aria-labelledby="standby-title">
        <div class="standby-copy">
          <span class="standby-badge">{{ isLiveActive ? 'CONNEXION AUTOMATIQUE' : 'VOTRE COMPAGNON DE PARTIE' }}</span>
          <h3 id="standby-title">
            <template v-if="status.isMock">{{ isChangingMode ? 'Chargement de la démo…' : 'La démo n’a pas pu être chargée.' }}</template>
            <template v-else-if="isLiveActive">En attente de<br /><span>votre partie.</span></template>
            <template v-else>Votre partie,<br /><span>plus facile à suivre.</span></template>
          </h3>
          <p v-if="status.isMock">{{ isChangingMode ? 'Le tableau de bord va s’ouvrir automatiquement.' : 'Quittez la démo puis relancez-la. Si le problème persiste, consultez l’aide et les réglages.' }}</p>
          <template v-else-if="isLiveActive">
            <p>Lancez une partie sur l’ordinateur où RiftVision est installé. Dès que vous entrez sur la carte, le tableau de bord s’ouvre automatiquement.</p>
            <p class="standby-hint">Vous êtes déjà en partie ? Vérifiez les étapes dans « Aide et réglages ».</p>
          </template>
          <template v-else>
            <p>Retrouvez les scores, les événements et les alertes sur votre second écran.</p>
            <ol class="connection-steps standby-steps">
              <li><strong>Lancez une partie de League of Legends.</strong><span>Sur le même ordinateur que RiftVision.</span></li>
              <li><strong>Connectez votre partie ci-dessous.</strong><span>Le tableau de bord s’ouvre dès que la partie est détectée.</span></li>
            </ol>
          </template>
          <div v-if="!status.isMock" class="standby-actions">
            <button type="button" data-testid="live-toggle-button" class="rv-button" :class="{ 'rv-button-primary': !isLiveActive }" :disabled="isChangingMode"
              @click="changeMode(isLiveActive ? stopLiveMode : startLiveMode)">
              <RvIcon :name="isLiveActive ? 'close' : 'signal'" :size="17" />
              {{ isChangingMode ? 'Connexion…' : isLiveActive ? 'Annuler la recherche' : 'Connecter ma partie' }}
            </button>
            <button v-if="!isLiveActive" type="button" data-testid="mock-toggle-button" class="rv-button rv-button-quiet" :disabled="isChangingMode" @click="changeMode(startMockMode)">
              Explorer la démo<RvIcon name="arrow-up-right" :size="16" />
            </button>
          </div>
          <p v-if="!isLiveActive && !status.isMock" class="standby-hint">Pas de partie en cours ? La démo permet de découvrir l’interface.</p>
        </div>
        <div class="standby-map" aria-hidden="true">
          <div class="standby-map-ring"></div><img src="/assets/images/sr-map.png" alt="" />
          <span class="standby-map-label"><RvIcon name="crosshair" :size="14" />FAILLE DE L’INVOCATEUR</span>
          <span class="standby-map-point standby-map-point--blue"></span><span class="standby-map-point standby-map-point--red"></span>
        </div>
      </section>
      <FlashAlertOverlay v-if="!isImmersive && hasGame" />
    </main>
    <AppFooter />
  </div>
</template>
