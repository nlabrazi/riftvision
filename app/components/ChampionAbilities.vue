<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  ChampionAbility,
  ChampionAbilityMediaResponse,
  ChampionAbilitySlot,
} from '#shared/types/championMedia'

const props = defineProps<{
  championKey: string
  championName: string
  version: string
  abilities: ChampionAbility[]
}>()
const endpoint = computed(
  () =>
    `/api/league/champion-abilities/${encodeURIComponent(props.championKey)}?version=${encodeURIComponent(props.version)}`,
)
const { data: media, status } = await useLazyFetch<ChampionAbilityMediaResponse>(endpoint, {
  server: false,
})
const selectedSlot = ref<ChampionAbilitySlot>('P')
const selected = computed(
  () =>
    props.abilities.find((ability) => ability.slot === selectedSlot.value) ?? props.abilities[0],
)
const selectedMedia = computed(() =>
  selected.value ? media.value?.abilities[selected.value.slot] : null,
)
const videoFailed = ref(false)
const reduceMotion = ref(true)
const videoElement = ref<HTMLVideoElement | null>(null)
let motionQuery: MediaQueryList | undefined
function updateMotion() {
  reduceMotion.value = motionQuery?.matches ?? true
  if (reduceMotion.value) videoElement.value?.pause()
}
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  motionQuery.addEventListener('change', updateMotion)
})
onBeforeUnmount(() => motionQuery?.removeEventListener('change', updateMotion))
watch(
  () => [props.championKey, selectedSlot.value],
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
      /* Les commandes restent disponibles si le navigateur bloque la lecture. */
    })
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="champion-abilities">
    <div class="ability-picker" aria-label="Compétences du champion">
      <button v-for="ability in abilities" :key="ability.slot" type="button" class="ability-picker__button" :aria-label="`${ability.key === 'P' ? 'Passif' : ability.key} : ${ability.name}`" :aria-pressed="selected?.slot === ability.slot" @click="selectedSlot = ability.slot">
        <img v-if="ability.filename" :src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/${ability.group}/${encodeURIComponent(ability.filename)}`" alt="" />
        <span>{{ ability.key === 'P' ? 'Passif' : ability.key }}</span>
      </button>
    </div>
    <div v-if="selected" class="ability-view">
      <div class="ability-view__copy" aria-live="polite">
        <p class="ability-view__key">{{ selected.key === 'P' ? 'PASSIF' : `COMPÉTENCE ${selected.key}` }}</p>
        <h3>{{ selected.name }}</h3>
        <p>{{ selected.description || 'Description indisponible.' }}</p>
      </div>
      <div class="ability-view__media">
        <video v-if="selectedMedia && !videoFailed" :key="`${championKey}-${selected.slot}`" ref="videoElement" :poster="selectedMedia.poster ?? undefined" :autoplay="!reduceMotion" muted loop playsinline controls preload="metadata" :aria-label="`Aperçu de ${selected.name} : ${championName}`" @error="videoFailed = true">
          <source :src="selectedMedia.videoMp4" type="video/mp4" />
          <source :src="selectedMedia.videoWebm" type="video/webm" />
        </video>
        <div v-else class="ability-view__fallback"><img v-if="selected.filename" :src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/${selected.group}/${encodeURIComponent(selected.filename)}`" alt="" /><p>{{ status === 'idle' || status === 'pending' ? 'Chargement de l’aperçu…' : 'Aperçu vidéo indisponible.' }}</p></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.champion-abilities { padding: 22px; border: 1px solid #c8aa6e33; border-radius: 7px; background: linear-gradient(135deg, #152636, #091521); }
.ability-picker { display: flex; flex-wrap: wrap; gap: 10px; }
.ability-picker__button { display: grid; justify-items: center; gap: 5px; min-width: 64px; padding: 7px; border: 1px solid #ffffff1c; border-radius: 5px; background: #0a1725; color: #b9c9d2; font: 700 12px 'Rajdhani', sans-serif; cursor: pointer; }
.ability-picker__button:hover, .ability-picker__button:focus-visible, .ability-picker__button[aria-pressed="true"] { border-color: #dbbd78; color: #f1d99e; background: #253447; }
.ability-picker__button img { width: 48px; height: 48px; border-radius: 3px; object-fit: cover; }
.ability-view { display: grid; grid-template-columns: minmax(180px, .8fr) minmax(0, 1.2fr); align-items: center; gap: 24px; margin-top: 22px; }
.ability-view__copy { min-width: 0; }
.ability-view__copy h3 { margin: 7px 0 10px; color: #f3eee3; font: 700 25px/1.1 'Rajdhani', sans-serif; }
.ability-view__copy p:not(.ability-view__key) { margin: 0; color: #c4d0d8; line-height: 1.65; }
.ability-view__key { margin: 0; color: #d8bb7c; font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .12em; }
.ability-view__media { overflow: hidden; aspect-ratio: 16 / 9; border: 1px solid #c8aa6e44; border-radius: 6px; background: #07111b; }
.ability-view__media video { display: block; width: 100%; height: 100%; object-fit: contain; }
.ability-view__fallback { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; width: 100%; height: 100%; color: #b8c7d0; font-size: 13px; }
.ability-view__fallback img { width: 52px; height: 52px; border: 1px solid #c8aa6e55; border-radius: 5px; }
.ability-view__fallback p { margin: 0; }
@media (max-width: 700px) { .ability-view { grid-template-columns: 1fr; gap: 18px; } .ability-view__media { grid-row: 1; } }
@media (max-width: 400px) { .champion-abilities { padding: 16px; } .ability-picker { gap: 5px; } .ability-picker__button { min-width: 52px; padding: 5px; } .ability-picker__button img { width: 40px; height: 40px; } }
</style>
