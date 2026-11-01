<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { tftSetFromId } from '~/utils/tftCatalog'
import type { TftItemsResponse } from '#shared/types/tft'

useHead({ title: 'Objets TFT — RiftVision' })
const { data, status, error, refresh } = await useFetch<TftItemsResponse>('/api/ddragon/tft/items')
const search = ref('')
const selectedSet = ref('all')
const sortOrder = ref('asc')
const sets = computed(() =>
  Array.from(
    new Set(
      (data.value?.data ?? []).flatMap((entry) => {
        const set = tftSetFromId(entry.id)
        return set === null ? [] : [set]
      }),
    ),
  ).sort((a, b) => b - a),
)
const route = useRoute()
watch(
  () => route.query.id,
  (value) => {
    search.value = typeof value === 'string' ? value : ''
  },
  { immediate: true },
)
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
const objets = computed(() => {
  const query = normalize(search.value)
  return (data.value?.data ?? [])
    .filter((objet) =>
      typeof route.query.id === 'string' && search.value === route.query.id
        ? objet.id === route.query.id
        : normalize(`${objet.name} ${objet.id}`).includes(query),
    )
    .filter(
      (objet) =>
        selectedSet.value === 'all' ||
        (selectedSet.value === 'other'
          ? tftSetFromId(objet.id) === null
          : String(tftSetFromId(objet.id)) === selectedSet.value),
    )
    .sort(
      (a, b) =>
        (a.name.localeCompare(b.name, 'fr') || a.id.localeCompare(b.id)) *
        (sortOrder.value === 'asc' ? 1 : -1),
    )
})
const { page, pageCount, start, end } = usePagination(
  computed(() => objets.value.length),
  [search, selectedSet, sortOrder, () => route.query.id],
  48,
)
function resetFilters() {
  search.value = ''
  selectedSet.value = 'all'
  sortOrder.value = 'asc'
}
</script>

<template>
  <TftLayout>
    <NuxtLink to="/tft/units" class="tft-back">← Retour aux unités TFT</NuxtLink>
    <GameCatalogBanner game="tft" eyebrow="Encyclopédie · Teamfight Tactics" title="Les objets TFT" description="Explorez les objets répertoriés dans les données officielles." :badge="data ? `Données Data Dragon · ${data.version}` : undefined" />
    <p class="objets-source-note">Ce catalogue peut contenir plusieurs sets et modes. Le set est déduit de l’identifiant lorsqu’il y figure : les autres entrées peuvent être communes ou non identifiées. Les entrées sans nom ne sont pas affichées. Les données disponibles ne précisent pas les effets ni les recettes des objets.</p>
    <div v-if="status === 'pending'" class="tft-notice" role="status">Chargement des objets…</div>
    <div v-else-if="error || !data" class="tft-notice" role="alert"><p>Le catalogue des objets TFT est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="objets-filters">
        <label class="objets-field"><span>Rechercher un objet</span><input v-model="search" type="search" placeholder="Nom ou identifiant" /></label>
        <label class="objets-field objets-field--select"><span>Set identifié</span><select v-model="selectedSet"><option value="all">Tous les sets</option><option v-for="set in sets" :key="set" :value="String(set)">Set {{ set }}</option><option value="other">Non identifié ou commun</option></select></label>
        <label class="objets-field objets-field--select"><span>Tri</span><select v-model="sortOrder"><option value="asc">Nom : A à Z</option><option value="desc">Nom : Z à A</option></select></label>
      </div>
      <p class="objets-count" role="status">{{ objets.length }} objet{{ objets.length > 1 ? 's' : '' }}</p>
      <div v-if="objets.length" id="catalog-results" tabindex="-1" class="objets-grid">
        <article v-for="objet in objets.slice(start, end)" :key="objet.id" class="objets-card">
          <img :src="`https://ddragon.leagueoflegends.com/cdn/${data.version}/img/tft-item/${encodeURIComponent(objet.icon)}`" alt="" loading="lazy" decoding="async" />
          <div><strong>{{ objet.name }}</strong><small>{{ objet.id }}</small></div>
        </article>
      </div>
      <div v-else class="tft-notice"><p>Aucun objet ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button></div>
      <ResultsPagination v-model:page="page" :page-count="pageCount" />
    </template>
  </TftLayout>
</template>

<style scoped>
.objets-count { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.objets-source-note { margin: 0 0 24px; padding: 12px 15px; border-left: 2px solid #c8aa6e; background: #12202c; color: #c4cfd7; line-height: 1.5; }
.objets-filters { display: flex; flex-wrap: wrap; gap: 14px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.objets-field { display: flex; flex: 1 1 250px; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.objets-field--select { flex: 0 1 180px; }
.objets-field input, .objets-field select { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.objets-field input::placeholder { color: #9caab5; }
.objets-count { margin: 22px 0 12px; }
.objets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.objets-card { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 14px; border: 1px solid #c8aa6e33; border-radius: 6px; background: linear-gradient(125deg, #182b3d, #0a1724); color: #f0f2f2; }
.objets-card img { flex: 0 0 48px; width: 48px; height: 48px; object-fit: contain; border: 1px solid #c8aa6e55; border-radius: 4px; }
.objets-card div { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.objets-card strong { font: 700 17px 'Rajdhani', sans-serif; }
.objets-card small { color: #b7c2cb; line-height: 1.3; overflow-wrap: anywhere; }
@media (max-width: 600px) { .objets-field--select { flex: 1 1 140px; } .objets-grid { grid-template-columns: 1fr; } }
</style>
