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

if (typeof window !== 'undefined') {
  ;(window as unknown as { __triggerDemoAlert?: (type?: string) => void }).__triggerDemoAlert = (
    type = 'DRAGON',
  ) => {
    triggerDemoAlert(type as Parameters<typeof triggerDemoAlert>[0])
  }

  // Connect to SSE stream from server for cross-process alerts (e.g. from Firefox on Screen 2 to Electron)
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

// Position: 'center' (default) or 'top'
const currentPosition = ref<'center' | 'top'>('center')
if (route.query.pos === 'top') {
  currentPosition.value = 'top'
}

// Standalone mode: independent polling if no second screen dashboard is open
const isStandalone = computed(() => route.query.standalone === '1')
const isDebug = ref(route.query.debug === '1')
const showStatusNotice = ref(true)

let statusTimer: ReturnType<typeof setTimeout> | null = null

// Optional standalone poller
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
  // F8: Basculer la position (centre / haut)
  if (event.key === 'F8') {
    currentPosition.value = currentPosition.value === 'center' ? 'top' : 'center'
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
  // Mute audio by default on the overlay to avoid double sound with Screen 2 dashboard
  if (route.query.sound !== '1' && !isAudioMuted.value) {
    toggleAudioMute()
  }

  // Auto-hide the launch notice after 5 seconds
  statusTimer = setTimeout(() => {
    if (!isDebug.value) {
      showStatusNotice.value = false
    }
  }, 5000)

  // Demo alert on load if requested
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
})
</script>

<template>
  <div class="rv-overlay-root">
    <!-- Notice temporaire ou permanente en mode debug -->
    <Transition name="fade">
      <div v-if="showStatusNotice || isDebug" class="rv-overlay-status-pill" data-testid="overlay-status-pill">
        <span class="rv-pill-dot" />
        <span class="rv-pill-text">
          RiftVision Overlay · {{ isStandalone ? 'Autonome' : 'Synchronisé' }}
          <template v-if="isDebug"> (F8: Position · F9: Test · F10: Masquer)</template>
        </span>
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

    <!-- Composant d'alerte centré HUD transparent et non-bloquant -->
    <FlashAlertOverlay :position="currentPosition" :interactive="false" />
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
  background: rgba(6, 13, 21, 0.88);
  border: 1px solid rgba(200, 170, 110, 0.3);
  border-radius: 9999px;
  font: 600 11px/1.2 'Rajdhani', sans-serif;
  color: #c8aa6e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
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
  padding: 2px 6px;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.rv-pill-action:hover {
  background: rgba(200, 170, 110, 0.3);
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
