<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HotsMapsResponse } from '#shared/types/hots'
import { hotsImage } from '~/utils/hotsImages'

useHead({ title: 'Champs de bataille — Heroes of the Storm — RiftVision' })
const { data, status, error, refresh } = await useFetch<HotsMapsResponse>('/api/hots/maps')
const search = ref('')
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘']/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
const maps = computed(() =>
  (data.value?.data ?? [])
    .filter((map) => normalize(map.name).includes(normalize(search.value)))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
)
const { page, pageCount, start, end } = usePagination(
  computed(() => maps.value.length),
  [search],
  36,
)
function hideBrokenImage(event: Event) {
  ;(event.target as HTMLImageElement).style.visibility = 'hidden'
}
</script>

<template>
  <HotsLayout>
    <NuxtLink to="/hots" class="hots-back">← Retour aux héros du Nexus</NuxtLink>
    <GameCatalogBanner game="hots" eyebrow="Encyclopédie · Heroes of the Storm" title="Champs de bataille" description="Découvrez les lieux du Nexus et les objectifs qui façonnent chaque partie." :badge="data ? `Données communautaires · ${data.version}` : undefined" />
    <div v-if="status === 'pending'" class="hots-notice" role="status">Chargement des champs de bataille…</div>
    <div v-else-if="error || !data" class="hots-notice" role="alert"><p>Le catalogue est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <p class="maps-disclaimer">Ce catalogue inclut aussi d’anciennes cartes et des modes spéciaux. Il ne représente pas la rotation actuelle.</p>
      <div class="maps-search"><label for="hots-map-search">Rechercher un champ de bataille</label><input id="hots-map-search" v-model="search" type="search" placeholder="Ex. passe d’Alterac" /></div>
      <p class="maps-count" role="status">{{ maps.length }} champ{{ maps.length > 1 ? 's' : '' }} de bataille</p>
      <div v-if="maps.length" id="catalog-results" tabindex="-1" class="maps-grid">
        <NuxtLink v-for="map in maps.slice(start, end)" :key="map.id" :to="`/hots/maps/${map.id}`" class="map-card">
          <div class="map-image"><img v-if="map.preview || map.art" :src="map.preview ? hotsImage('replaypreviews', map.preview) : hotsImage('loadingscreens', map.art)" alt="" loading="lazy" decoding="async" @error="hideBrokenImage" /><span>HEROES OF THE STORM</span></div>
          <div class="map-copy"><strong>{{ map.name }}</strong><span aria-hidden="true">↗</span></div>
        </NuxtLink>
      </div>
      <div v-else class="hots-notice"><p>Aucun champ de bataille ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="search = ''">Effacer la recherche</button></div>
      <ResultsPagination v-model:page="page" :page-count="pageCount" />
      <p class="maps-source">Données et images : HeroesToolChest, source communautaire · version {{ data.version }}</p>
    </template>
  </HotsLayout>
</template>

<style scoped>
.maps-disclaimer { margin: 0 0 18px; color: #bbc4d4; font-size: 13px; line-height: 1.5; }
.maps-search { display: flex; flex-direction: column; gap: 8px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #10192b; }
.maps-search label { color: #c5c9d8; font: 600 13px 'Rajdhani', sans-serif; }
.maps-search input { width: min(100%, 480px); min-height: 42px; padding: 9px 12px; border: 1px solid #4a4967; border-radius: 4px; background: #0a1220; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.maps-count, .maps-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.maps-count { margin: 22px 0 12px; } .maps-source { margin-top: 25px; }
.maps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 14px; }
.map-card { overflow: hidden; min-width: 0; border: 1px solid #9b86d13b; border-radius: 7px; background: linear-gradient(150deg, #1a2440, #101627); color: #eef0f7; text-decoration: none; transition: transform .2s, border-color .2s; }
.map-card:hover, .map-card:focus-visible { border-color: #b8a1ff; transform: translateY(-3px); }
.map-image { position: relative; overflow: hidden; aspect-ratio: 16 / 9; background: radial-gradient(ellipse at 65% 60%, #624e9477, transparent 65%), #12192a; }
.map-image img { display: block; width: 100%; height: 100%; object-fit: cover; }
.map-image span { position: absolute; top: 10px; left: 10px; padding: 4px 8px; border: 1px solid #b8a1ff55; border-radius: 3px; background: #0d1423dc; color: #e0d8ff; font: 700 10px 'Rajdhani', sans-serif; letter-spacing: .05em; }
.map-copy { display: flex; align-items: start; justify-content: space-between; gap: 10px; padding: 16px 18px; }
.map-copy strong { color: #f4f2ff; font: 700 21px/1.15 'Rajdhani', sans-serif; }
.map-copy > span { color: #c6b2ff; }
@media (prefers-reduced-motion: reduce) { .map-card { transition: none; } .map-card:hover, .map-card:focus-visible { transform: none; } }
@media (max-width: 600px) { .maps-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .map-copy { padding: 12px; } .map-copy strong { font-size: 18px; } .map-image span { font-size: 9px; } }
</style>
