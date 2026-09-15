<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })

const paths: Record<string, string> = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16',
  activity: 'M2 12h4l3-8 6 16 3-8h4',
  'chevron-right': 'm9 5 7 7-7 7',
  'chevron-down': 'm6 9 6 6 6-6',
  expand: 'M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5',
  collapse: 'M3 8h5V3 M21 8h-5V3 M8 21v-5H3 M16 21v-5h5',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  close: 'm6 6 12 12 M6 18 18 6',
  clock: 'M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z',
  swords:
    'm3 3 5 1 11 11-4 4L4 8z M14 20l6-6 M18 18l3 3 M21 3l-5 1-4 4 M7 13l-4 4 M4 14l6 6 M6 18l-3 3',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  volume: 'm11 4-6 5H2v6h3l6 5z M15 8a6 6 0 0 1 0 8 M18 5a10 10 0 0 1 0 14',
  'volume-off': 'm11 4-6 5H2v6h3l6 5z M16 9l6 6 M16 15l6-6',
  play: 'm7 4 14 8-14 8z',
  pause: 'M7 4v16 M17 4v16',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 3 M18 18a8 8 0 0 1-13-3',
  'arrow-left': 'M20 12H4 m6-6-6 6 6 6',
  check: 'm5 12 4 4L19 6',
  crosshair: 'M12 2v4 M12 18v4 M2 12h4 M18 12h4 M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  signal: 'M4 20v-4 M9 20v-8 M14 20V8 M19 20V4',
  layers: 'm12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',
  flask: 'M9 3h6 M10 3v6L4 19c-1 2 1 2 2 2h12c1 0 3 0 2-2L14 9V3 M7 14h10',
  'arrow-up-right': 'M6 18 18 6 M6 6h12v12',
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
    focusable="false" class="rv-icon">
    <path :d="paths[name] || paths.activity" />
  </svg>
</template>

<style scoped>
.rv-icon { flex-shrink: 0; }
</style>
