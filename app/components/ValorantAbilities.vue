<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ValorantAbility, ValorantAbilityMediaResponse } from '#shared/types/valorant'

const props = defineProps<{ agentId: string; agentName: string; abilities: ValorantAbility[] }>()
const endpoint = computed(
  () => `/api/valorant/agents/${encodeURIComponent(props.agentId)}/ability-media`,
)
const { data: media, status } = await useLazyFetch<ValorantAbilityMediaResponse>(endpoint, {
  server: false,
})
const selectedIndex = ref(0)
const selected = computed(() => props.abilities[selectedIndex.value])
const selectedMedia = computed(() =>
  selected.value ? media.value?.abilities[selected.value.slot] : null,
)
const videoFailed = ref(false)
const reduceMotion = ref(true)
const videoElement = ref<HTMLVideoElement | null>(null)
const labels: Record<string, string> = {
  Ability1: 'Compétence',
  Ability2: 'Compétence',
  Grenade: 'Compétence',
  Ultimate: 'Ultime',
  Passive: 'Passive',
}
let motionQuery: MediaQueryList | undefined
function updateMotion() {
  reduceMotion.value = motionQuery?.matches ?? true
}
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  motionQuery.addEventListener('change', updateMotion)
})
onBeforeUnmount(() => motionQuery?.removeEventListener('change', updateMotion))
watch(
  () => [props.agentId, selectedIndex.value],
  () => {
    videoFailed.value = false
  },
)
watch(
  [videoElement, reduceMotion],
  ([video, reduced]) => {
    if (!video) return
    if (reduced) {
      video.pause()
      return
    }
    video.muted = true
    void video.play().catch(() => {
      /* Les commandes restent accessibles si la lecture est bloquée. */
    })
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="agent-abilities-view">
    <div class="ability-picker" aria-label="Compétences de l’agent">
      <button v-for="(ability, index) in abilities" :key="`${ability.slot}-${index}`" type="button" class="ability-picker__button" :aria-label="`${labels[ability.slot] ?? 'Compétence'} : ${ability.name}`" :aria-pressed="selectedIndex === index" @click="selectedIndex = index">
        <img v-if="ability.icon" :src="ability.icon" alt="" /><span v-else class="ability-picker__placeholder" aria-hidden="true">✦</span>
        <span>{{ labels[ability.slot] ?? 'Compétence' }}</span>
      </button>
    </div>
    <div v-if="selected" class="ability-view">
      <div class="ability-view__copy" aria-live="polite">
        <p class="ability-view__key">{{ labels[selected.slot] ?? 'Compétence' }}</p>
        <h3>{{ selected.name }}</h3>
        <p>{{ selected.description || 'Description indisponible.' }}</p>
      </div>
      <div class="ability-view__media">
        <video v-if="selectedMedia && !videoFailed" :key="`${agentId}-${selectedIndex}`" ref="videoElement" :poster="selectedMedia.poster ?? undefined" :autoplay="!reduceMotion" muted loop playsinline controls preload="metadata" :aria-label="`Aperçu de ${selected.name} : ${agentName}`" @error="videoFailed = true">
          <source v-if="selectedMedia.videoMp4" :src="selectedMedia.videoMp4" type="video/mp4" />
          <source v-if="selectedMedia.videoWebm" :src="selectedMedia.videoWebm" type="video/webm" />
        </video>
        <div v-else class="ability-view__fallback"><img v-if="selected.icon" :src="selected.icon" alt="" /><span v-else aria-hidden="true">✦</span><p>{{ status === 'idle' || status === 'pending' ? 'Chargement de l’aperçu…' : 'Aperçu vidéo indisponible.' }}</p></div>
      </div>
    </div>
    <p class="ability-view__source">Aperçus vidéo : Riot Games, lorsqu’ils sont disponibles.</p>
  </div>
</template>

<style scoped>
.agent-abilities-view { padding: 22px; border: 1px solid #ed727c40; border-radius: 7px; background: linear-gradient(135deg, #2c202e, #091521); }
.ability-picker { display: flex; flex-wrap: wrap; gap: 10px; }
.ability-picker__button { display: grid; justify-items: center; gap: 5px; min-width: 82px; padding: 7px; border: 1px solid #ffffff1c; border-radius: 5px; background: #0a1725; color: #b9c9d2; font: 700 12px 'Rajdhani', sans-serif; cursor: pointer; }
.ability-picker__button:hover, .ability-picker__button:focus-visible, .ability-picker__button[aria-pressed="true"] { border-color: #f18f96; color: #ffd5d4; background: #4c303c; }
.ability-picker__button img, .ability-picker__placeholder { display: grid; place-items: center; width: 48px; height: 48px; object-fit: contain; color: #f4a2a9; font-size: 24px; }
.ability-view { display: grid; grid-template-columns: minmax(220px, .8fr) minmax(0, 1.2fr); align-items: center; gap: 24px; margin-top: 22px; }
.ability-view__copy { min-width: 0; }
.ability-view__copy h3 { margin: 7px 0 10px; color: #f3eee3; font: 700 25px/1.1 'Rajdhani', sans-serif; }
.ability-view__copy p:not(.ability-view__key) { margin: 0; color: #c4d0d8; line-height: 1.65; white-space: pre-line; }
.ability-view__key { margin: 0; color: #f3a1a7; font: 700 12px 'Rajdhani', sans-serif; letter-spacing: .12em; text-transform: uppercase; }
.ability-view__media { overflow: hidden; aspect-ratio: 16 / 9; border: 1px solid #ed727c55; border-radius: 6px; background: #07111b; }
.ability-view__media video { display: block; width: 100%; height: 100%; object-fit: contain; }
.ability-view__fallback { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; width: 100%; height: 100%; color: #b8c7d0; font-size: 13px; }
.ability-view__fallback img { width: 52px; height: 52px; object-fit: contain; }
.ability-view__fallback span { color: #f4a2a9; font-size: 28px; }
.ability-view__fallback p { margin: 0; }
.ability-view__source { margin: 14px 0 0; color: #aebbc8; font: 600 12px 'Rajdhani', sans-serif; }
@media (max-width: 700px) { .ability-view { grid-template-columns: 1fr; gap: 18px; } .ability-view__media { grid-row: 1; } }
@media (max-width: 400px) { .agent-abilities-view { padding: 16px; } .ability-picker { gap: 6px; } .ability-picker__button { min-width: 70px; padding: 6px; } .ability-picker__button img, .ability-picker__placeholder { width: 40px; height: 40px; } }
</style>
