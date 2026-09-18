<script setup lang="ts">
import { icons } from '../utils/icons'

withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })
</script>

<template>
  <FontAwesomeIcon :icon="icons[name] || icons.activity" :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true" focusable="false" class="rv-icon" />
</template>

<style scoped>
.rv-icon {
  flex-shrink: 0;
}
</style>
