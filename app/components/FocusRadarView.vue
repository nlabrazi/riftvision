<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { CombatLogFilter, GameDiffEvent, TeamEconomySummary } from '#shared/types/diff'
import type { RiotAllGameData } from '#shared/types/riot'
import { useFlashAlerts } from '../composables/useFlashAlerts'
import CombatLog from './CombatLog.vue'
import FlashAlertOverlay from './FlashAlertOverlay.vue'
import MatchScoreboard from './MatchScoreboard.vue'
import RvIcon from './RvIcon.vue'
import TacticalMinimap from './TacticalMinimap.vue'

withDefaults(
  defineProps<{
    gameData: RiotAllGameData | null
    blueEconomy: TeamEconomySummary
    redEconomy: TeamEconomySummary
    goldDifference: number
    diffEvents: GameDiffEvent[]
    formattedGameTime: string
    isMock?: boolean
    isPolling?: boolean
  }>(),
  { isMock: false, isPolling: true },
)

const emit = defineEmits<(e: 'switch-view', view: 'tactical') => void>()
const { activeAlert, isAudioMuted, toggleAudioMute } = useFlashAlerts()
const radarRoot = ref<HTMLElement | null>(null)
const showJournal = ref(true)
const isFullscreen = ref(false)
const fullscreenAvailable = ref(false)
const fullscreenError = ref('')
const selectedEvent = defineModel<GameDiffEvent | null>('selectedEvent', { default: null })
const filter = defineModel<CombatLogFilter>('filter', { default: 'all' })
const search = defineModel<string>('search', { default: '' })

function syncFullscreen() {
  isFullscreen.value = document.fullscreenElement === radarRoot.value
}
function exitFullscreenOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && document.fullscreenElement === radarRoot.value) {
    document.exitFullscreen().catch(() => {})
  }
}
async function toggleFullscreen() {
  fullscreenError.value = ''
  try {
    if (isFullscreen.value) await document.exitFullscreen()
    else await radarRoot.value?.requestFullscreen()
  } catch {
    fullscreenError.value = 'Le plein écran n’est pas disponible dans cette fenêtre.'
  }
}
async function returnToDashboard() {
  if (isFullscreen.value) {
    try {
      await document.exitFullscreen()
    } catch {
      /* The view remains navigable if fullscreen exits externally. */
    }
  }
  emit('switch-view', 'tactical')
}

onMounted(() => {
  fullscreenAvailable.value = !!document.fullscreenEnabled
  document.addEventListener('fullscreenchange', syncFullscreen)
  document.addEventListener('keydown', exitFullscreenOnEscape)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', syncFullscreen)
  document.removeEventListener('keydown', exitFullscreenOnEscape)
})
</script>

<template>
  <section ref="radarRoot" data-testid="focus-radar-view" class="radar-workspace"
    :class="{ 'radar-workspace--fullscreen': isFullscreen }">
    <div class="radar-toolbar">
      <div class="radar-title">
        <button type="button" class="rv-button" data-testid="view-tactical-btn"
          @click="returnToDashboard">
          <RvIcon name="arrow-left" :size="17" /><span>Revenir au tableau de bord</span>
        </button>
        <h2 class="sr-only">Carte agrandie</h2>
      </div>
      <div class="radar-tools">
        <span v-if="isFullscreen && isMock" class="paused-label">Démo · données figées</span>
        <span v-else-if="isFullscreen && !isPolling" class="paused-label">Suivi en pause</span>
        <button type="button" data-testid="radar-journal-toggle" class="rv-button" :aria-expanded="showJournal"
          aria-controls="radar-journal" @click="showJournal = !showJournal">
          <RvIcon name="activity" :size="16" /><span>{{ showJournal ? 'Masquer le journal' : 'Afficher le journal' }}</span>
        </button>
        <button v-if="isFullscreen" type="button" data-testid="radar-audio-toggle" class="rv-icon-button" :aria-pressed="!isAudioMuted"
          :aria-label="isAudioMuted ? 'Activer les alertes sonores' : 'Couper les alertes sonores'"
          :title="isAudioMuted ? 'Activer le son' : 'Couper le son'" @click="toggleAudioMute">
          <RvIcon :name="isAudioMuted ? 'volume-off' : 'volume'" :size="17" />
        </button>
        <button v-if="fullscreenAvailable" type="button" data-testid="fullscreen-btn" class="rv-button"
          :aria-pressed="isFullscreen" :aria-label="isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'"
          @click="toggleFullscreen">
          <RvIcon :name="isFullscreen ? 'collapse' : 'expand'" :size="16" />
          <span v-if="isFullscreen">Quitter</span>
          <span v-else>Plein écran</span>
        </button>
      </div>
    </div>
    <p v-if="fullscreenError" class="fullscreen-error" role="status">{{ fullscreenError }}</p>

    <MatchScoreboard :blue-economy="blueEconomy" :red-economy="redEconomy" :gold-difference="goldDifference"
      :formatted-game-time="formattedGameTime" compact />

    <div class="radar-content" :class="{ 'radar-content--expanded': !showJournal }">
      <div data-testid="radar-large-map" class="radar-map-stage">
        <div class="radar-map-grid" aria-hidden="true"></div>
        <div class="radar-map-square">
          <TacticalMinimap :game-data="gameData" :blue-economy="blueEconomy" :red-economy="redEconomy"
            :diff-events="diffEvents" :selected-event="selectedEvent" :is-mock="isMock" variant="immersive" />
        </div>
        <div v-if="!showJournal" class="radar-floating-alert">
          <FlashAlertOverlay inline />
        </div>
        <span class="map-corner map-corner--tl" aria-hidden="true"></span><span class="map-corner map-corner--br"
          aria-hidden="true"></span>
      </div>

      <aside v-show="showJournal" id="radar-journal" data-testid="radar-alert-panel" class="radar-sidebar">
        <div class="radar-live-alert rv-panel">
          <div class="alert-section-heading"><span class="rv-eyebrow">{{ isMock ? 'APERÇU DES ALERTES' : 'ALERTES DE PARTIE' }}</span><span class="status-dot"
              :class="{ 'status-dot--live': isPolling && !isMock }"></span></div>
          <FlashAlertOverlay v-if="showJournal" inline />
          <div v-if="!activeAlert" class="alert-idle">
            <span class="alert-idle-symbol">
              <RvIcon name="crosshair" :size="24" />
            </span>
            <strong v-if="isMock">Découvrez les alertes</strong>
            <strong v-else-if="isPolling">À l’écoute de la Faille</strong>
            <strong v-else>Synchronisation en pause</strong>
            <p v-if="isMock">{{ isFullscreen ? 'Quittez le plein écran pour tester une alerte depuis le bandeau de démo.' : 'Utilisez « Tester une alerte » dans le bandeau de démo pour voir un exemple.' }}</p>
            <p v-else-if="isPolling">Les moments décisifs s’affichent ici et sur la carte.</p>
            <p v-else>Reprenez le suivi pour recevoir les nouveaux événements.</p>
          </div>
        </div>
        <CombatLog v-model:filter="filter" v-model:search="search" :is-mock="isMock" :events="diffEvents" :selected-event-id="selectedEvent?.id" :is-live="isPolling" compact
          @select-event="selectedEvent = $event" />
      </aside>
    </div>

    <div class="radar-bottom-bar">
      <div v-if="selectedEvent" class="radar-selection">
        <span>{{ selectedEvent.formattedTime }} · {{ selectedEvent.description }}</span>
        <button type="button" class="rv-icon-button" aria-label="Désélectionner l'événement"
          @click="selectedEvent = null">
          <RvIcon name="close" :size="14" />
        </button>
      </div>
      <span v-else class="radar-bottom-hint">
        <RvIcon name="crosshair" :size="13" />Sélectionnez un champion ou un événement pour afficher son détail.
      </span>

    </div>
  </section>
</template>

<style scoped>
.radar-workspace {
  height: calc(100dvh - 210px);
  min-height: 530px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radar-toolbar,
.radar-title,
.radar-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.radar-toolbar {
  justify-content: space-between;
  min-height: 36px;
}

.radar-title h2 {
  font: 600 20px 'Rajdhani', sans-serif;
  color: #e3e8ee;
}

.radar-title .rv-eyebrow {
  font-size: 9px;
  padding-left: 12px;
  margin-left: 5px;
  border-left: 1px solid #c8aa6e25;
}

.paused-label {
  color: #d4b77b;
  font: 500 12px 'Rajdhani', sans-serif;
}

.radar-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  flex: 1;
  gap: 16px;
  min-height: 0;
}

.radar-content--expanded {
  grid-template-columns: minmax(0, 1fr);
}

.radar-map-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(ellipse at center, #152835 0%, #09141e 65%, #07111b 100%);
  border: 1px solid #c8aa6e22;
  border-radius: 4px;
  overflow: hidden;
  container-type: size;
}

.radar-map-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.25;
  background-image: linear-gradient(#91adbb15 1px, transparent 1px), linear-gradient(90deg, #91adbb15 1px, transparent 1px);
  background-size: 48px 48px;
}

.radar-map-square {
  width: min(100cqw, 100cqh);
  aspect-ratio: 1;
  position: relative;
}

.radar-sidebar {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radar-live-alert {
  padding: 14px;
  flex-shrink: 0;
}

.alert-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.alert-section-heading .rv-eyebrow {
  font-size: 10px;
}

.alert-idle {
  padding: 10px 10px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.alert-idle-symbol {
  width: 46px;
  height: 46px;
  border: 1px solid #c8aa6e35;
  color: #a78f5e;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #c8aa6e06;
  margin-bottom: 12px;
}

.alert-idle strong {
  font: 600 16px 'Rajdhani', sans-serif;
  color: #ccd5df;
}

.alert-idle p {
  font-size: 11px;
  color: #8999aa;
  line-height: 1.7;
  margin-top: 4px;
  max-width: 220px;
}

.radar-sidebar> :last-child {
  flex: 1;
  min-height: 0;
}

.radar-floating-alert {
  position: absolute;
  top: 16px;
  right: 16px;
  width: min(350px, calc(100% - 32px));
  z-index: 40;
}

.map-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  pointer-events: none;
  border-color: #a28b58;
}

.map-corner--tl {
  top: 8px;
  left: 8px;
  border-left: 1px solid;
  border-top: 1px solid;
}

.map-corner--br {
  bottom: 8px;
  right: 8px;
  border-right: 1px solid;
  border-bottom: 1px solid;
}

.radar-bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 26px;
}

.radar-bottom-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #8394a5;
  font: 500 11px 'Rajdhani', sans-serif;
}

.radar-selection {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #bda77b;
  font: 500 12px 'Rajdhani', sans-serif;
}

.radar-selection>span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.radar-selection button {
  min-height: 26px;
  width: 26px;
  padding: 4px;
}

.fullscreen-error {
  color: #e6b974;
  font-size: 12px;
}

.radar-workspace:fullscreen {
  height: 100dvh;
  min-height: 0;
  padding: 16px 24px;
  background: #060e18;
}

@media (max-width: 1150px) {
  .radar-workspace {
    height: calc(100dvh - 230px);
  }

  .radar-title .rv-eyebrow {
    display: none;
  }

  .radar-content {
    grid-template-columns: minmax(0, 1fr) 270px;
    gap: 12px;
  }

  .radar-content--expanded {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 700px) {
  .radar-workspace {
    height: auto;
    min-height: 0;
    gap: 12px;
  }

  .radar-toolbar {
    flex-wrap: wrap;
  }

  .radar-title h2 {
    font-size: 19px;
  }

  .radar-title {
    gap: 4px;
  }

  .radar-tools {
    gap: 2px;
  }

  .radar-tools .rv-button {
    padding: 7px 8px;
    font-size: 12px;
  }

  .radar-content {
    display: flex;
    flex-direction: column;
  }

  .radar-map-stage {
    container-type: inline-size;
    aspect-ratio: 1;
    flex-shrink: 0;
  }

  .radar-map-square {
    width: 100%;
  }

  .radar-sidebar {
    max-height: 540px;
  }

  .alert-idle {
    padding: 4px 12px;
  }

  .alert-idle-symbol {
    display: none;
  }

  .radar-bottom-bar {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .radar-workspace:fullscreen {
    padding: 12px;
    overflow-y: auto;
  }

  .paused-label {
    display: none;
  }
}
</style>
