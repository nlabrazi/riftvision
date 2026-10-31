<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PatchNotesResponse } from '#shared/types/patchNotes'

useHead({ title: 'Notes de patch Valorant — RiftVision' })
const sourceUrl = 'https://playvalorant.com/fr-fr/news/tags/patch-notes/'
const { data, status, error, refresh } = await useFetch<PatchNotesResponse>(
  '/api/valorant/patch-notes',
)
const search = ref('')
const articles = computed(() => {
  const query = search.value.toLocaleLowerCase('fr-FR').trim()
  return (data.value?.articles ?? []).filter((article) =>
    `${article.title} ${article.description ?? ''}`.toLocaleLowerCase('fr-FR').includes(query),
  )
})
const { page, pageCount, start, end } = usePagination(
  computed(() => articles.value.length),
  [search],
  24,
)
</script>

<template>
  <ValorantLayout>
    <NuxtLink to="/valorant" class="val-back">← Retour aux agents Valorant</NuxtLink>
    <header class="patch-heading">
      <div><p class="val-kicker">VALORANT · MISES À JOUR</p><h1>Notes de patch<span>.</span></h1><p>Retrouvez les mises à jour publiées par Riot Games et consultez leurs notes complètes.</p></div>
      <a class="patch-source" :href="sourceUrl" target="_blank" rel="noopener noreferrer">Archive officielle Riot ↗ <span class="sr-only">(nouvel onglet)</span></a>
    </header>
    <div v-if="status === 'pending'" class="val-notice" role="status">Chargement des notes de patch…</div>
    <div v-else-if="error || !data" class="val-notice" role="alert">
      <p>Les notes de patch sont momentanément indisponibles. Vous pouvez consulter l’archive officielle de Riot.</p>
      <button type="button" class="rv-button" @click="refresh()">Réessayer</button>
      <a class="patch-fallback" :href="sourceUrl" target="_blank" rel="noopener noreferrer">Ouvrir l’archive officielle ↗ <span class="sr-only">(nouvel onglet)</span></a>
    </div>
    <template v-else>
      <div class="patch-toolbar"><label for="patch-search">Rechercher un patch</label><input id="patch-search" v-model="search" type="search" placeholder="Ex. 13.09" /></div>
      <p class="patch-count" role="status">{{ articles.length }} note{{ articles.length > 1 ? 's' : '' }} de patch</p>
      <div v-if="articles.length" id="catalog-results" tabindex="-1" class="patch-list">
        <PatchNoteCard v-for="article in articles.slice(start, end)" :key="article.url" :article="article" variant="valorant" :featured="article.url === data.articles[0]?.url" />
      </div>
      <div v-else class="val-notice"><p>Aucune note ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="search = ''">Effacer la recherche</button></div>
      <ResultsPagination v-model:page="page" :page-count="pageCount" />
    </template>
  </ValorantLayout>
</template>

<style scoped>
.patch-heading { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin: 40px 0 30px; }
.patch-heading h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.patch-heading h1 span { color: #fa8c94; }
.patch-heading p:not(.val-kicker) { max-width: 620px; margin: 0; color: #b8c5cf; line-height: 1.5; }
.patch-source, .patch-fallback { color: #f2a0a4; font: 700 14px 'Rajdhani', sans-serif; text-decoration: none; }
.patch-source:hover, .patch-fallback:hover { text-decoration: underline; }
.patch-fallback { display: inline-block; margin-left: 16px; }
.patch-toolbar { display: flex; flex-direction: column; gap: 8px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.patch-toolbar label { color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.patch-toolbar input { width: min(100%, 440px); min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.patch-toolbar input::placeholder { color: #9caab5; }
.patch-count { margin: 22px 0 12px; color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.patch-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr)); gap: 18px; align-items: stretch; }
@media (max-width: 600px) { .patch-heading { margin-top: 30px; } .patch-fallback { display: block; margin: 16px 0 0; } }
</style>
