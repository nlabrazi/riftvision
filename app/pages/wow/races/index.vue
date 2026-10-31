<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WowRacesResponse } from '#shared/types/wow'
import { wowRaceArt } from '~/utils/wowRaceArt'

useHead({ title: 'Races WoW — RiftVision' })
const { data, status, error, refresh } = await useFetch<WowRacesResponse>('/api/wow/races')
const search = ref('')
const selectedFaction = ref('all')
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
const factions = computed(() => {
  const found = new Map<string, string>()
  for (const race of data.value?.data ?? [])
    if (race.faction) found.set(race.faction.type, race.faction.name)
  return [...found].sort((a, b) => a[1].localeCompare(b[1], 'fr'))
})
const races = computed(() => {
  const query = normalize(search.value)
  return (data.value?.data ?? [])
    .filter(
      (race) =>
        normalize(race.name).includes(query) &&
        (selectedFaction.value === 'all' || race.faction?.type === selectedFaction.value),
    )
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name, 'fr') ||
        (a.faction?.name ?? '').localeCompare(b.faction?.name ?? '', 'fr') ||
        a.id - b.id,
    )
})
function resetFilters() {
  search.value = ''
  selectedFaction.value = 'all'
}
</script>

<template>
  <WowLayout>
    <NuxtLink to="/wow" class="wow-back">← Retour aux classes WoW</NuxtLink>
    <GameCatalogBanner game="wow" eyebrow="Encyclopédie · World of Warcraft Retail" title="Les races WoW" description="Explorez les races et leurs classes disponibles." />
    <p class="race-note">Certaines races apparaissent plusieurs fois : Blizzard distingue leurs variantes par faction.</p>
    <div v-if="status === 'pending'" class="wow-notice" role="status">Chargement des races…</div>
    <div v-else-if="error || !data" class="wow-notice" role="alert"><p>Le catalogue des races est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="race-filters"><label><span>Rechercher une race</span><input v-model="search" type="search" placeholder="Nom de la race" /></label><label class="faction-filter"><span>Faction</span><select v-model="selectedFaction"><option value="all">Toutes les factions</option><option v-for="[type, name] in factions" :key="type" :value="type">{{ name }}</option></select></label></div>
      <p class="race-count" role="status">{{ races.length }} race{{ races.length > 1 ? 's' : '' }}</p>
      <div v-if="races.length" class="race-grid">
        <NuxtLink v-for="race in races" :key="race.id" :to="`/wow/races/${race.id}`" class="race-card">
          <div class="race-art" aria-hidden="true"><img v-if="wowRaceArt(race.id)" :src="wowRaceArt(race.id)!" alt="" loading="lazy" decoding="async" /></div><div class="race-copy"><strong>{{ race.name }}</strong><span>{{ race.faction?.name ?? 'Faction non renseignée' }}<template v-if="race.allied === true"> · Race alliée</template></span></div><span class="race-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else class="wow-notice"><p>Aucune race ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button></div>
      <p class="race-source">Données : Blizzard · World of Warcraft Retail · Europe · Français</p>
    </template>
  </WowLayout>
</template>

<style scoped>
.race-note { margin: 0 0 24px; padding: 12px 15px; border-left: 2px solid #c8aa6e; background: #12202c; color: #c4cfd7; line-height: 1.5; }
.race-filters { display: flex; flex-wrap: wrap; gap: 14px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.race-filters label { display: flex; flex: 1 1 250px; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.race-filters .faction-filter { flex: 0 1 220px; }
.race-filters input, .race-filters select { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.race-count, .race-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.race-count { margin: 22px 0 12px; }
.race-source { margin-top: 24px; }
.race-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.race-card { position: relative; overflow: hidden; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #f0f2f2; text-decoration: none; }
.race-card:hover, .race-card:focus-visible { border-color: #c8aa6e; }
.race-art { height: 180px; overflow: hidden; background: radial-gradient(circle at 50% 35%, #644c3766, transparent 70%), linear-gradient(145deg, #192b3b, #0a1522); }
.race-art img { width: 100%; height: 100%; object-fit: cover; object-position: center 24%; transition: transform .25s ease; }
.race-card:hover .race-art img, .race-card:focus-visible .race-art img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .race-art img { transition: none; } .race-card:hover .race-art img, .race-card:focus-visible .race-art img { transform: none; } }
.race-copy { display: flex; flex-direction: column; gap: 4px; padding: 14px 34px 14px 14px; }
.race-copy strong { font: 700 20px 'Rajdhani', sans-serif; }
.race-copy span { color: #b7c2cb; font-size: 13px; }
.race-arrow { position: absolute; right: 14px; bottom: 14px; color: #d6bb83; }
@media (max-width: 600px) { .race-filters .faction-filter { flex: 1 1 140px; } .race-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
