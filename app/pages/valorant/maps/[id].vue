<script setup lang="ts">
import { computed } from 'vue'
import type { ValorantMapsResponse } from '#shared/types/valorant'

const route = useRoute()
const id = computed(() => String(route.params.id ?? '').toLowerCase())
const { data, status, error, refresh } = await useFetch<ValorantMapsResponse>('/api/valorant/maps')
const map = computed(() => data.value?.data.find((entry) => entry.id === id.value))
const callouts = computed(() =>
  [...(map.value?.callouts ?? [])].sort(
    (a, b) => a.area.localeCompare(b.area, 'fr') || a.region.localeCompare(b.region, 'fr'),
  ),
)
useHead({ title: computed(() => `${map.value?.name ?? 'Carte Valorant'} — RiftVision`) })
</script>

<template>
  <ValorantLayout>
    <NuxtLink to="/valorant/maps" class="val-back">← Retour aux cartes Valorant</NuxtLink>
    <div v-if="status === 'pending'" class="val-notice" role="status">Chargement de la carte…</div>
    <div v-else-if="error || !data" class="val-notice" role="alert"><p>La fiche est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else-if="map">
      <section class="map-hero"><img v-if="map.splash" :src="map.splash" alt="" /><div><p class="val-kicker">CARTE · VALORANT</p><h1>{{ map.name }}</h1><p v-if="map.tacticalDescription">{{ map.tacticalDescription }}</p><p v-if="map.narrativeDescription">{{ map.narrativeDescription }}</p></div></section>
      <section class="map-details" aria-labelledby="map-plan-title">
        <p class="val-kicker">PLAN DE LA CARTE</p><h2 id="map-plan-title">Vue d’ensemble</h2>
        <img v-if="map.minimap" class="map-plan" :src="map.minimap" :alt="`Plan de ${map.name}`" />
        <p v-else>Le plan n’est pas disponible pour cette carte.</p>
      </section>
      <section class="map-details" aria-labelledby="map-callouts-title">
        <p class="val-kicker">REPÈRES</p><h2 id="map-callouts-title">Zones de la carte</h2>
        <template v-if="callouts.length"><p class="map-note">Noms de zones fournis par la source, dans leur langue d’origine.</p><ul class="callout-list"><li v-for="callout in callouts" :key="JSON.stringify([callout.area, callout.region])"><span>{{ callout.area }}</span> {{ callout.region }}</li></ul></template>
        <p v-else>Les noms de zones ne sont pas disponibles pour cette carte.</p>
      </section>
      <p class="maps-source">Données et visuels : Valorant-API, source communautaire non officielle.</p>
    </template>
    <div v-else class="val-notice" role="alert">Cette carte est introuvable.</div>
  </ValorantLayout>
</template>

<style scoped>
.map-hero { position: relative; display: flex; align-items: end; min-height: 270px; margin-top: 30px; padding: 28px; overflow: hidden; isolation: isolate; border: 1px solid #ed727c44; border-radius: 6px; background: linear-gradient(120deg, #3a1f32, #091521 70%); }
.map-hero img { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.map-hero::before { content: ''; position: absolute; z-index: -1; inset: 0; background: linear-gradient(90deg, #07111df5, #07111d77 75%); }
.map-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.map-hero p:not(.val-kicker) { color: #e0e8ed; line-height: 1.6; max-width: 720px; }
.map-details { margin-top: 18px; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.map-details h2 { margin: 8px 0 20px; color: #f1f1ee; font: 700 28px 'Rajdhani', sans-serif; }
.map-plan { display: block; width: min(100%, 650px); height: auto; border-radius: 5px; background: #162432; }
.map-note { line-height: 1.5; }
.callout-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 16px 0 0; list-style: none; }
.callout-list li { padding: 8px 12px; border: 1px solid #ffffff1a; border-radius: 4px; background: #091420; }
.callout-list span { color: #f5a4aa; font-weight: 700; }
.maps-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 600px) { .map-hero { min-height: 210px; padding: 20px; } .map-details { padding: 20px; } }
</style>
