<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ValorantMapsResponse } from '#shared/types/valorant'

useHead({ title: 'Cartes Valorant — RiftVision' })
const { data, status, error, refresh } = await useFetch<ValorantMapsResponse>('/api/valorant/maps')
const search = ref('')
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
const duplicateNames = computed(() => {
  const counts = new Map<string, number>()
  for (const map of data.value?.data ?? [])
    counts.set(normalize(map.name), (counts.get(normalize(map.name)) ?? 0) + 1)
  return new Set(
    Array.from(counts)
      .filter(([, count]) => count > 1)
      .map(([name]) => name),
  )
})
const maps = computed(() => {
  const query = normalize(search.value)
  return (data.value?.data ?? [])
    .filter((map) => normalize(map.name).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr') || a.id.localeCompare(b.id))
})
</script>

<template>
  <ValorantLayout>
    <NuxtLink to="/valorant" class="val-back">← Retour aux agents Valorant</NuxtLink>
    <GameCatalogBanner game="valorant" eyebrow="Encyclopédie · Valorant" title="Les cartes Valorant" description="Découvrez les cartes et leurs plans disponibles." />
    <p class="maps-note">Ce catalogue contient des cartes de plusieurs modes, y compris l’entraînement. Il n’indique pas la rotation actuelle.</p>
    <div v-if="status === 'pending'" class="val-notice" role="status">Chargement des cartes…</div>
    <div v-else-if="error || !data" class="val-notice" role="alert"><p>Le catalogue des cartes est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="maps-filters"><label><span>Rechercher une carte</span><input v-model="search" type="search" placeholder="Nom de la carte" /></label></div>
      <p class="maps-count" role="status">{{ maps.length }} carte{{ maps.length > 1 ? 's' : '' }}</p>
      <div v-if="maps.length" class="maps-grid">
        <NuxtLink v-for="map in maps" :key="map.id" :to="`/valorant/maps/${map.id}`" class="map-card">
          <div class="map-art"><img v-if="map.splash" :src="map.splash" alt="" loading="lazy" decoding="async" /><span v-else>Visuel indisponible</span></div>
          <div class="map-copy"><strong>{{ map.name }}</strong><span v-if="map.tacticalDescription">{{ map.tacticalDescription }}</span><span v-if="duplicateNames.has(normalize(map.name))">Identifiant : {{ map.id }}</span></div><span class="map-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else class="val-notice"><p>Aucune carte ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="search = ''">Effacer la recherche</button></div>
      <p class="maps-source">Données et visuels : Valorant-API, source communautaire non officielle.</p>
    </template>
  </ValorantLayout>
</template>

<style scoped>
.maps-note { margin: 0 0 24px; padding: 12px 15px; border-left: 2px solid #fa8c94; background: #12202c; color: #c4cfd7; line-height: 1.5; }
.maps-filters { padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.maps-filters label { display: flex; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.maps-filters input { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.maps-count, .maps-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.maps-count { margin: 22px 0 12px; }
.maps-source { margin-top: 24px; }
.maps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
.map-card { position: relative; overflow: hidden; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #f0f2f2; text-decoration: none; }
.map-card:hover, .map-card:focus-visible { border-color: #fa8c94; }
.map-art { display: flex; align-items: center; justify-content: center; aspect-ratio: 16/9; background: linear-gradient(140deg, #472638, #132330); overflow: hidden; color: #c4cfd7; font-size: 13px; }
.map-art img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
.map-card:hover img, .map-card:focus-visible img { transform: scale(1.05); }
.map-copy { display: flex; flex-direction: column; gap: 4px; padding: 14px 34px 14px 14px; }
.map-copy strong { font: 700 20px 'Rajdhani', sans-serif; }
.map-copy span { color: #b7c2cb; font-size: 13px; overflow-wrap: anywhere; }
.map-arrow { position: absolute; right: 14px; bottom: 14px; color: #fa8c94; }
@media (prefers-reduced-motion: reduce) { .map-art img { transition: none; } .map-card:hover img, .map-card:focus-visible img { transform: none; } }
@media (max-width: 600px) { .maps-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
