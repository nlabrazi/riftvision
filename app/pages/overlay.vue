<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import FlashAlertOverlay from '../components/FlashAlertOverlay.vue'
import RvIcon from '../components/RvIcon.vue'
import { useFlashAlerts } from '../composables/useFlashAlerts'
import { useRiotLive } from '../composables/useRiotLive'

useHead({
  title: 'RiftVision — In-Game HUD Overlay',
  htmlAttrs: {
    class: 'rv-overlay-mode',
  },
  bodyAttrs: {
    class: 'rv-overlay-mode',
  },
})

const route = useRoute()
const {
  isAudioMuted,
  toggleAudioMute,
  triggerDemoAlert,
  triggerAlert,
  clearAlerts,
  dismissCurrentAlert,
  ingestDiffEvents,
} = useFlashAlerts()

let eventSource: EventSource | null = null

// Position prédéfinie : 'center' (défaut) ou 'top'
const currentPosition = ref<'center' | 'top'>('center')
if (route.query.pos === 'top') {
  currentPosition.value = 'top'
}

// Coordonnées personnalisées (Drag & Drop persistant)
interface OverlayCoords {
  x: number
  y: number
}

const STORAGE_KEY = 'riftvision_hud_coords'
const customCoords = ref<OverlayCoords | null>(null)
const previewCoords = ref<OverlayCoords>({ x: 0, y: 0 })
const isCalibrating = ref(false)
const isDragging = ref(false)
const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 })

function getDefaultCoords(): OverlayCoords {
  if (typeof window === 'undefined') return { x: 400, y: 80 }
  const width = Math.min(520, window.innerWidth - 32)
  const x = Math.max(16, (window.innerWidth - width) / 2)
  const y = Math.max(16, window.innerHeight * 0.08)
  return { x: Math.round(x), y: Math.round(y) }
}

function loadSavedCoords() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        customCoords.value = { x: parsed.x, y: parsed.y }
        previewCoords.value = { x: parsed.x, y: parsed.y }
        return
      }
    }
  } catch {
    // Ignore storage parse error
  }
  previewCoords.value = getDefaultCoords()
}

function saveCoords(coords: OverlayCoords) {
  customCoords.value = { ...coords }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coords))
    } catch {
      // Ignore storage error
    }
  }
}

function resetCoords() {
  customCoords.value = null
  previewCoords.value = getDefaultCoords()
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }
}

function toggleCalibrationMode(forceState?: boolean) {
  const next = typeof forceState === 'boolean' ? forceState : !isCalibrating.value
  isCalibrating.value = next

  if (next) {
    if (customCoords.value) {
      previewCoords.value = { ...customCoords.value }
    } else {
      previewCoords.value = getDefaultCoords()
    }
  }

  // Notifie le pont Electron s'il est présent
  if (typeof window !== 'undefined') {
    const bridge = (
      window as unknown as {
        riftvisionBridge?: {
          setCalibrationMode?: (v: boolean) => void
          setIgnoreMouseEvents?: (v: boolean) => void
        }
      }
    ).riftvisionBridge

    if (bridge?.setCalibrationMode) {
      bridge.setCalibrationMode(next)
    } else if (bridge?.setIgnoreMouseEvents) {
      bridge.setIgnoreMouseEvents(!next)
    }
  }
}

function finishCalibration() {
  saveCoords(previewCoords.value)
  toggleCalibrationMode(false)
}

function startDrag(e: MouseEvent) {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - previewCoords.value.x,
    y: e.clientY - previewCoords.value.y,
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopDrag)
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  const cardWidth = Math.min(520, window.innerWidth - 32)
  const newX = Math.max(
    16,
    Math.min(window.innerWidth - cardWidth - 16, e.clientX - dragOffset.value.x),
  )
  const newY = Math.max(16, Math.min(window.innerHeight - 150, e.clientY - dragOffset.value.y))
  previewCoords.value = { x: Math.round(newX), y: Math.round(newY) }
}

function stopDrag() {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopDrag)
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { __triggerDemoAlert?: (type?: string) => void }).__triggerDemoAlert = (
    type = 'DRAGON',
  ) => {
    triggerDemoAlert(type as Parameters<typeof triggerDemoAlert>[0])
  }

  ;(
    window as unknown as { __setCalibrationMode?: (enabled: boolean) => void }
  ).__setCalibrationMode = (enabled: boolean) => {
    isCalibrating.value = enabled
    if (enabled && !customCoords.value) {
      previewCoords.value = getDefaultCoords()
    }
  }

  ;(window as unknown as { __toggleOverlayCalibration?: () => void }).__toggleOverlayCalibration =
    () => {
      toggleCalibrationMode()
    }

  // Écoute les notifications via Electron Bridge
  const bridge = (
    window as unknown as {
      riftvisionBridge?: {
        onToggleCalibration?: (cb: (enabled: boolean) => void) => void
      }
    }
  ).riftvisionBridge
  if (bridge?.onToggleCalibration) {
    bridge.onToggleCalibration((enabled: boolean) => {
      isCalibrating.value = enabled
      if (enabled && !customCoords.value) {
        previewCoords.value = getDefaultCoords()
      }
    })
  }

  // Connexion SSE depuis le serveur Nuxt (alertes temps-réel)
  if ('EventSource' in window) {
    try {
      eventSource = new EventSource('/api/alerts/stream')
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data?.type === 'CLEAR_ALERTS') {
            clearAlerts(false)
          } else if (data?.type === 'DISMISS_ALERT') {
            dismissCurrentAlert(false)
          } else if (data?.id) {
            triggerAlert(data, false)
          }
        } catch {
          // ignore parse error
        }
      }
    } catch {
      // ignore connection error
    }
  }
}

// Standalone mode: polling indépendant si aucun dashboard ouvert
const isStandalone = computed(() => route.query.standalone === '1')
const isDebug = ref(route.query.debug === '1')
const showStatusNotice = ref(true)

let statusTimer: ReturnType<typeof setTimeout> | null = null
let riotLive: ReturnType<typeof useRiotLive> | null = null

if (isStandalone.value) {
  riotLive = useRiotLive()
  watch(
    () => riotLive?.latestLiveEvents.value,
    (fresh) => {
      if (fresh?.length) {
        ingestDiffEvents(fresh)
      }
    },
  )
}

function handleKeyDown(event: KeyboardEvent) {
  // F8: Calibrer / repositionner la zone d'alerte (Drag & Drop)
  if (event.key === 'F8') {
    event.preventDefault()
    if (isCalibrating.value) {
      finishCalibration()
    } else {
      toggleCalibrationMode(true)
    }
    return
  }

  if (isCalibrating.value) {
    const step = event.shiftKey ? 20 : 5
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      previewCoords.value.y = Math.max(16, previewCoords.value.y - step)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      previewCoords.value.y = Math.min(window.innerHeight - 150, previewCoords.value.y + step)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      previewCoords.value.x = Math.max(16, previewCoords.value.x - step)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      previewCoords.value.x = Math.min(window.innerWidth - 536, previewCoords.value.x + step)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      finishCalibration()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      toggleCalibrationMode(false)
    }
    return
  }

  // F9: Déclencher une alerte de test
  if (event.key === 'F9') {
    triggerDemoAlert('DRAGON')
  }
  // F10: Afficher/masquer les infos de debug
  if (event.key === 'F10') {
    isDebug.value = !isDebug.value
    showStatusNotice.value = true
  }
}

onMounted(() => {
  loadSavedCoords()

  // Mute l'audio par défaut sur l'overlay pour éviter le double son
  if (route.query.sound !== '1' && !isAudioMuted.value) {
    toggleAudioMute()
  }

  // Auto-hide la notice de lancement après 5s
  statusTimer = setTimeout(() => {
    if (!isDebug.value) {
      showStatusNotice.value = false
    }
  }, 5000)

  // Alerte de démonstration si requise
  if (route.query.demo === '1') {
    setTimeout(() => {
      triggerDemoAlert('DRAGON')
    }, 600)
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (statusTimer) clearTimeout(statusTimer)
  if (eventSource) eventSource.close()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <div class="rv-overlay-root">
    <!-- Notice temporaire ou permanente en mode debug -->
    <Transition name="fade">
      <div
        v-if="(showStatusNotice || isDebug) && !isCalibrating"
        class="rv-overlay-status-pill"
        data-testid="overlay-status-pill"
      >
        <span class="rv-pill-dot" />
        <span class="rv-pill-text">
          RiftVision Overlay · {{ isStandalone ? 'Autonome' : 'Synchronisé' }}
          <template v-if="isDebug"> (F8: Déplacer · F9: Test · F10: Masquer)</template>
        </span>
        <button
          type="button"
          class="rv-pill-action"
          title="Ajuster l'emplacement de l'alerte"
          @click="toggleCalibrationMode(true)"
        >
          <RvIcon name="crosshair" :size="12" /> Calibrer (F8)
        </button>
        <button
          v-if="isDebug"
          type="button"
          class="rv-pill-action"
          title="Tester une alerte"
          @click="triggerDemoAlert('KILL')"
        >
          <RvIcon name="flask" :size="12" /> Test
        </button>
      </div>
    </Transition>

    <!-- Modal interactif de Calibration HUD (Drag & Drop) -->
    <Transition name="fade">
      <div
        v-if="isCalibrating"
        class="rv-calibration-box"
        :style="{ left: `${previewCoords.x}px`, top: `${previewCoords.y}px` }"
        data-testid="overlay-calibration-box"
      >
        <div class="rv-calibration-bar" @mousedown="startDrag">
          <div class="rv-bar-title">
            <RvIcon name="crosshair" :size="14" />
            <span>Position de l'alerte · Glissez pour déplacer</span>
          </div>
          <div class="rv-bar-coords">X: {{ previewCoords.x }}px · Y: {{ previewCoords.y }}px</div>
        </div>

        <div class="rv-calibration-preview">
          <div class="rv-preview-tag">Aperçu Alerte In-Game</div>
          <div class="rv-preview-content">
            <div class="rv-preview-icon">🐉</div>
            <div class="rv-preview-text">
              <div class="rv-preview-title">DRAGON DES ENFERS DANS 60s</div>
              <div class="rv-preview-sub">Apparition imminente · Préparez la vision fosse</div>
            </div>
          </div>
        </div>

        <div class="rv-calibration-actions">
          <button
            type="button"
            class="rv-calib-btn rv-calib-btn--reset"
            title="Revenir au haut centré par défaut (8% du haut)"
            @click="resetCoords"
          >
            <RvIcon name="refresh" :size="12" /> Défaut (8% haut)
          </button>
          <button
            type="button"
            class="rv-calib-btn rv-calib-btn--save"
            title="Enregistrer cette position et reprendre le jeu"
            @click="finishCalibration"
          >
            <RvIcon name="check" :size="12" /> Enregistrer (F8 / Entrée)
          </button>
        </div>
      </div>
    </Transition>

    <!-- Composant d'alerte HUD transparent et non-bloquant -->
    <FlashAlertOverlay
      v-if="!isCalibrating"
      :custom-coords="customCoords"
      :position="currentPosition"
      :interactive="false"
    />
  </div>
</template>

<style scoped>
.rv-overlay-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  pointer-events: none;
  background: transparent !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

.rv-overlay-status-pill {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: rgba(6, 13, 21, 0.92);
  border: 1px solid rgba(200, 170, 110, 0.4);
  border-radius: 9999px;
  font: 600 11px/1.2 'Rajdhani', sans-serif;
  color: #c8aa6e;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
  pointer-events: auto;
}

.rv-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 6px #34d399;
}

.rv-pill-text {
  color: #e4e8ed;
}

.rv-pill-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(200, 170, 110, 0.15);
  border: 1px solid rgba(200, 170, 110, 0.4);
  color: #f0e6d2;
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rv-pill-action:hover {
  background: rgba(200, 170, 110, 0.35);
  border-color: #f0e6d2;
}

/* Boîte de calibration Drag & Drop */
.rv-calibration-box {
  position: fixed;
  width: min(520px, calc(100vw - 32px));
  z-index: 10000;
  background: rgba(6, 13, 21, 0.96);
  border: 2px dashed #c8aa6e;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.85), 0 0 20px rgba(200, 170, 110, 0.3);
  pointer-events: auto;
  user-select: none;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.rv-calibration-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: linear-gradient(90deg, rgba(200, 170, 110, 0.25), rgba(6, 13, 21, 0.6));
  border-bottom: 1px solid rgba(200, 170, 110, 0.3);
  cursor: grab;
  color: #f0e6d2;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
}

.rv-calibration-bar:active {
  cursor: grabbing;
  background: linear-gradient(90deg, rgba(200, 170, 110, 0.4), rgba(6, 13, 21, 0.8));
}

.rv-bar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #c8aa6e;
}

.rv-bar-coords {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.rv-calibration-preview {
  padding: 12px 14px;
  background: rgba(10, 20, 32, 0.7);
  margin: 10px;
  border: 1px solid rgba(200, 170, 110, 0.2);
  border-radius: 6px;
}

.rv-preview-tag {
  font-size: 10px;
  font-weight: 700;
  color: #34d399;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
}

.rv-preview-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rv-preview-icon {
  font-size: 24px;
  line-height: 1;
}

.rv-preview-title {
  font-family: 'Beaufort for LOL', 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: #f0e6d2;
  letter-spacing: 0.5px;
}

.rv-preview-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.rv-calibration-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 8px 14px 12px;
}

.rv-calib-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rv-calib-btn--reset {
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
}

.rv-calib-btn--reset:hover {
  background: rgba(148, 163, 184, 0.3);
  border-color: #e2e8f0;
}

.rv-calib-btn--save {
  background: linear-gradient(135deg, #c8aa6e, #9b7e3f);
  border: 1px solid #f0e6d2;
  color: #060d15;
  box-shadow: 0 2px 8px rgba(200, 170, 110, 0.4);
}

.rv-calib-btn--save:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
