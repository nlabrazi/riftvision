<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

defineProps<{ src: string }>()

const wrapper = ref<HTMLElement | null>(null)
const hovered = ref(false)
const focused = ref(false)
const reducedMotion = ref(true)
const ready = ref(false)
const active = computed(() => !reducedMotion.value && (hovered.value || focused.value))
let card: HTMLElement | null = null
let motionPreference: MediaQueryList | null = null

function pointerEnter(event: PointerEvent) {
  if (event.pointerType !== 'touch') hovered.value = true
}

function pointerLeave() {
  hovered.value = false
  if (!focused.value) ready.value = false
}

function focusIn() {
  focused.value = true
}

function focusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && card?.contains(event.relatedTarget)) return
  focused.value = false
  if (!hovered.value) ready.value = false
}

function updateMotion() {
  reducedMotion.value = motionPreference?.matches ?? true
  if (reducedMotion.value) ready.value = false
}

onMounted(() => {
  card = wrapper.value?.closest('.game-card') ?? null
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  motionPreference.addEventListener('change', updateMotion)
  card?.addEventListener('pointerenter', pointerEnter)
  card?.addEventListener('pointerleave', pointerLeave)
  card?.addEventListener('focusin', focusIn)
  card?.addEventListener('focusout', focusOut)
})

onUnmounted(() => {
  motionPreference?.removeEventListener('change', updateMotion)
  card?.removeEventListener('pointerenter', pointerEnter)
  card?.removeEventListener('pointerleave', pointerLeave)
  card?.removeEventListener('focusin', focusIn)
  card?.removeEventListener('focusout', focusOut)
})
</script>

<template>
  <span ref="wrapper" class="hover-preview" aria-hidden="true">
    <video v-if="active" :src="src" :class="{ 'hover-preview__video--ready': ready }"
      class="hover-preview__video" muted autoplay loop playsinline preload="none"
      tabindex="-1" @playing="ready = true" @error="ready = false" />
  </span>
</template>

<style scoped>
.hover-preview { position: absolute; z-index: 0; inset: 0; pointer-events: none; }
.hover-preview__video { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 300ms ease; }
.hover-preview__video--ready { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .hover-preview__video { transition: none; }
}
</style>
