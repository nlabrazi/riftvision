<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TftChampionsResponse } from '#shared/types/tft'

useHead({ title: 'Unités TFT — RiftVision' })
const { data, status, error, refresh } = await useFetch<TftChampionsResponse>(
  '/api/ddragon/tft/champions',
)
const search = ref('')
const selectedSet = ref('all')
const selectedCost = ref('all')
const sets = computed(() =>
  Array.from(
    new Set(
      (data.value?.data ?? []).flatMap((unit) => (unit.setNumber === null ? [] : [unit.setNumber])),
    ),
  ).sort((a, b) => b - a),
)
const costs = computed(() =>
  Array.from(new Set((data.value?.data ?? []).map((unit) => unit.cost))).sort((a, b) => a - b),
)
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
const units = computed(() => {
  const query = normalize(search.value)
  return (data.value?.data ?? [])
    .filter(
      (unit) =>
        selectedSet.value === 'all' ||
        (selectedSet.value === 'other'
          ? unit.setNumber === null
          : String(unit.setNumber) === selectedSet.value),
    )
    .filter((unit) => selectedCost.value === 'all' || String(unit.cost) === selectedCost.value)
    .filter((unit) => normalize(`${unit.name} ${unit.id}`).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr') || (b.setNumber ?? 0) - (a.setNumber ?? 0))
})
function resetFilters() {
  search.value = ''
  selectedSet.value = 'all'
  selectedCost.value = 'all'
}
</script>

<template>
  <TftLayout>
    <NuxtLink to="/" class="tft-back">← Retour à tous les jeux</NuxtLink>
    <header class="tft-heading">
      <div><p class="tft-kicker">ENCYCLOPÉDIE · TEAMFIGHT TACTICS</p><h1>Les unités TFT<span>.</span></h1><p>Explorez les unités répertoriées dans les données officielles.</p></div>
      <span v-if="data" class="tft-version">Données Data Dragon · {{ data.version }}</span>
    </header>
    <p class="tft-source-note">Ce catalogue peut contenir plusieurs sets et modes. Le set affiché est déduit de l’identifiant fourni par Riot ; il ne désigne pas nécessairement le set actuel.</p>
    <div v-if="status === 'pending'" class="tft-notice" role="status">Chargement des unités…</div>
    <div v-else-if="error || !data" class="tft-notice" role="alert"><p>Le catalogue TFT est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="tft-filters">
        <label class="tft-field"><span>Rechercher une unité</span><input v-model="search" type="search" placeholder="Nom ou identifiant" /></label>
        <label class="tft-field tft-field--select"><span>Set</span><select v-model="selectedSet"><option value="all">Tous les sets</option><option v-for="set in sets" :key="set" :value="String(set)">Set {{ set }}</option><option value="other">Autres ou non identifié</option></select></label>
        <label class="tft-field tft-field--select"><span>Coût</span><select v-model="selectedCost"><option value="all">Tous les coûts</option><option v-for="cost in costs" :key="cost" :value="String(cost)">{{ cost }} PO</option></select></label>
      </div>
      <p class="tft-count" role="status">{{ units.length }} unité{{ units.length > 1 ? 's' : '' }}</p>
      <div v-if="units.length" class="tft-grid">
        <NuxtLink v-for="unit in units" :key="unit.id" :to="`/tft/champions/${unit.id}`" class="tft-card">
          <img :src="`https://ddragon.leagueoflegends.com/cdn/${data.version}/img/tft-champion/${encodeURIComponent(unit.icon)}`" alt="" loading="lazy" decoding="async" />
          <span><strong>{{ unit.name }}</strong><small>{{ unit.setNumber === null ? 'Set non identifié' : `Set ${unit.setNumber}` }} · {{ unit.cost }} PO{{ unit.cost === 0 ? ' (donnée Riot)' : '' }}</small></span>
          <span class="tft-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else class="tft-notice"><p>Aucune unité ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button></div>
    </template>
  </TftLayout>
</template>

<style scoped>
.tft-heading { display: flex; justify-content: space-between; align-items: end; flex-wrap: wrap; gap: 20px; margin: 40px 0 24px; }
.tft-heading h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.tft-heading h1 span { color: #d6bb83; }
.tft-heading p:not(.tft-kicker) { margin: 0; color: #b8c5cf; line-height: 1.5; }
.tft-version, .tft-count { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.tft-source-note { margin: 0 0 24px; padding: 12px 15px; border-left: 2px solid #c8aa6e; background: #12202c; color: #c4cfd7; line-height: 1.5; }
.tft-filters { display: flex; flex-wrap: wrap; gap: 14px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.tft-field { display: flex; flex: 1 1 250px; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.tft-field--select { flex: 0 1 180px; }
.tft-field input, .tft-field select { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.tft-field input::placeholder { color: #9caab5; }
.tft-count { margin: 22px 0 12px; }
.tft-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.tft-card { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 14px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #f0f2f2; text-decoration: none; }
.tft-card:hover, .tft-card:focus-visible { border-color: #c8aa6e; background: #122333; }
.tft-card img { flex: 0 0 48px; width: 48px; height: 48px; object-fit: contain; border-radius: 4px; }
.tft-card > span:not(.tft-arrow) { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 4px; }
.tft-card strong { font: 700 17px 'Rajdhani', sans-serif; }
.tft-card small { color: #b7c2cb; line-height: 1.3; }
.tft-arrow { color: #d6bb83; }
@media (max-width: 600px) { .tft-heading { margin-top: 30px; } .tft-field--select { flex: 1 1 140px; } .tft-grid { grid-template-columns: 1fr; } }
</style>
