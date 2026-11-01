<script setup lang="ts">
import type { TftCurrentSetResponse } from '#shared/types/tft'
defineProps<{ current: TftCurrentSetResponse | null }>()
</script>

<template>
  <div class="tft-season-notice" role="status">
    <template v-if="current"><span class="tft-season-badge">Set {{ current.number }} · Saison en cours</span><span>Patch TFT {{ current.patch }}</span></template>
    <span v-else>Saison en cours indisponible : le filtre par défaut est désactivé.</span>
  </div>
</template>

<style scoped>
.tft-season-notice { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 0 0 18px; color: #bdcbd4; font: 600 13px 'Rajdhani', sans-serif; }
.tft-season-badge { padding: 6px 10px; border: 1px solid #b996e280; border-radius: 4px; background: #503c6d55; color: #e8d2ff; font: 700 13px 'Rajdhani', sans-serif; }
</style>
