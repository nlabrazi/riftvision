<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HotsPatchNotesResponse } from '#shared/types/hots'

useHead({ title: 'Notes de patch Heroes of the Storm — RiftVision' })
const sourceUrl = 'https://news.blizzard.com/fr-fr/feed/heroes-of-the-storm'
const { data, status, error, refresh } =
  await useFetch<HotsPatchNotesResponse>('/api/hots/patch-notes')
const search = ref('')
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
const articles = computed(() => {
  const query = normalize(search.value)
  return (data.value?.articles ?? []).filter((article) =>
    normalize(`${article.title} ${article.description ?? ''}`).includes(query),
  )
})
const { page, pageCount, start, end } = usePagination(
  computed(() => articles.value.length),
  [search],
  24,
)
</script>

<template>
  <HotsLayout>
    <NuxtLink to="/hots/heroes" class="hots-back">← Retour aux héros du Nexus</NuxtLink>
    <GameCatalogBanner game="hots" eyebrow="Heroes of the Storm · Mises à jour" title="Notes de patch" description="Retrouvez les notes récentes publiées par Blizzard et consultez leurs détails sur le site officiel.">
      <a class="patch-source" :href="sourceUrl" target="_blank" rel="noopener noreferrer">Archive officielle Blizzard ↗ <span class="sr-only">(nouvel onglet)</span></a>
    </GameCatalogBanner>
    <div v-if="status === 'pending'" class="hots-notice" role="status">Chargement des notes de patch…</div>
    <div v-else-if="error || !data" class="hots-notice" role="alert">
      <p>Les notes de patch sont momentanément indisponibles. Vous pouvez consulter l’archive officielle de Blizzard.</p>
      <button type="button" class="rv-button" @click="refresh()">Réessayer</button>
      <a class="patch-fallback" :href="sourceUrl" target="_blank" rel="noopener noreferrer">Ouvrir l’archive officielle ↗ <span class="sr-only">(nouvel onglet)</span></a>
    </div>
    <template v-else>
      <div class="patch-toolbar"><label for="patch-search">Rechercher un patch</label><input id="patch-search" v-model="search" type="search" placeholder="Héros, date ou sujet" /></div>
      <p v-if="data.truncated" class="patch-scope">Notes repérées parmi les 120 dernières actualités du fil Blizzard. Pour les publications plus anciennes, consultez l’archive officielle.</p>
      <p class="patch-count" role="status">{{ articles.length }} note{{ articles.length > 1 ? 's' : '' }} de mise à jour</p>
      <div v-if="articles.length" id="catalog-results" tabindex="-1" class="patch-list">
        <PatchNoteCard v-for="article in articles.slice(start, end)" :key="article.url" :article="article" variant="hots" />
      </div>
      <div v-else class="hots-notice"><p>Aucune note ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="search = ''">Effacer la recherche</button></div>
      <ResultsPagination v-model:page="page" :page-count="pageCount" />
    </template>
  </HotsLayout>
</template>

<style scoped>
.patch-source, .patch-fallback { color: #c3b5ff; font: 700 14px 'Rajdhani', sans-serif; text-decoration: none; }
.patch-source:hover, .patch-fallback:hover { text-decoration: underline; }
.patch-fallback { display: inline-block; margin-left: 16px; }
.patch-toolbar { display: flex; flex-direction: column; gap: 8px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.patch-toolbar label { color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.patch-toolbar input { width: min(100%, 440px); min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.patch-toolbar input::placeholder { color: #9caab5; }
.patch-scope { margin: 18px 0 0; padding: 12px 15px; border-left: 2px solid #b7a4ff; background: #171b34; color: #c8cde0; line-height: 1.5; }
.patch-count { margin: 22px 0 12px; color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.patch-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr)); gap: 18px; align-items: stretch; }
@media (max-width: 600px) { .patch-fallback { display: block; margin: 16px 0 0; } }
</style>
