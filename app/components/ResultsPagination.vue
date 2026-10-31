<script setup lang="ts">
import { nextTick } from 'vue'

const props = defineProps<{ page: number; pageCount: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

async function goToPage(page: number) {
  if (page < 1 || page > props.pageCount || page === props.page) return
  emit('update:page', page)
  await nextTick()
  document.getElementById('catalog-results')?.focus()
}

function selectPage(event: Event) {
  goToPage(Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <nav v-if="pageCount > 1" class="results-pagination" aria-label="Pagination des résultats">
    <button type="button" :disabled="page === 1" aria-controls="catalog-results" @click="goToPage(page - 1)">← Précédent</button>
    <span aria-live="polite" aria-atomic="true">Page {{ page }} sur {{ pageCount }}</span>
    <label>Aller à la page <select :value="page" aria-controls="catalog-results" @change="selectPage"><option v-for="number in pageCount" :key="number" :value="number">{{ number }}</option></select></label>
    <button type="button" :disabled="page === pageCount" aria-controls="catalog-results" @click="goToPage(page + 1)">Suivant →</button>
  </nav>
</template>

<style scoped>
.results-pagination { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; margin-top: 24px; color: #c5d0d8; font: 600 15px 'Rajdhani', sans-serif; }
.results-pagination label { display: flex; align-items: center; gap: 8px; }
.results-pagination select { min-height: 42px; padding: 8px; border: 1px solid #6d603f; border-radius: 4px; background: #102131; color: #e6d5ad; font: inherit; }
.results-pagination select:focus-visible { outline: 2px solid #dfc58d; outline-offset: 2px; }
.results-pagination button { min-height: 42px; padding: 8px 16px; border: 1px solid #6d603f; border-radius: 4px; background: #102131; color: #e6d5ad; font: inherit; cursor: pointer; }
.results-pagination button:hover:not(:disabled), .results-pagination button:focus-visible { border-color: #dfc58d; background: #1b3041; }
.results-pagination button:focus-visible { outline: 2px solid #dfc58d; outline-offset: 2px; }
.results-pagination button:disabled { opacity: .45; cursor: default; }
</style>
