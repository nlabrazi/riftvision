<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TftItemsResponse } from '#shared/types/tft'

useHead({ title: 'Objets TFT — RiftVision' })
const { data, status, error, refresh } = await useFetch<TftItemsResponse>('/api/ddragon/tft/items')
const search = ref('')
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
    .sort((a, b) => a.name.localeCompare(b.name, 'fr') || a.id.localeCompare(b.id))
})
const { page, pageCount, start, end } = usePagination(
  computed(() => objets.value.length),
  [search, () => route.query.id],
  48,
)
</script>

<template>
  <TftLayout>
    <NuxtLink to="/tft" class="tft-back">← Retour aux unités TFT</NuxtLink>
    <GameCatalogBanner game="tft" eyebrow="Encyclopédie · Teamfight Tactics" title="Les objets TFT" description="Explorez les objets répertoriés dans les données officielles." :badge="data ? `Données Data Dragon · ${data.version}` : undefined" />
    <p class="objets-source-note">Ce catalogue peut contenir plusieurs sets et modes. Les entrées sans nom ne sont pas affichées. Les données disponibles ne précisent pas les effets ni les recettes des objets.</p>
    <div v-if="status === 'pending'" class="tft-notice" role="status">Chargement des objets…</div>
    <div v-else-if="error || !data" class="tft-notice" role="alert"><p>Le catalogue des objets TFT est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="objets-filters"><label class="objets-field"><span>Rechercher un objet</span><input v-model="search" type="search" placeholder="Nom ou identifiant" /></label></div>
      <p class="objets-count" role="status">{{ objets.length }} objet{{ objets.length > 1 ? 's' : '' }}</p>
      <div v-if="objets.length" id="catalog-results" tabindex="-1" class="objets-grid">
        <article v-for="objet in objets.slice(start, end)" :key="objet.id" class="objets-card">
          <img :src="`https://ddragon.leagueoflegends.com/cdn/${data.version}/img/tft-item/${encodeURIComponent(objet.icon)}`" alt="" loading="lazy" decoding="async" />
          <div><strong>{{ objet.name }}</strong><small>{{ objet.id }}</small></div>
        </article>
      </div>
      <div v-else class="tft-notice"><p>Aucun objet ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="search = ''">Effacer la recherche</button></div>
      <ResultsPagination v-model:page="page" :page-count="pageCount" />
    </template>
  </TftLayout>
</template>

<style scoped>
.objets-count { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.objets-source-note { margin: 0 0 24px; padding: 12px 15px; border-left: 2px solid #c8aa6e; background: #12202c; color: #c4cfd7; line-height: 1.5; }
.objets-filters { padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.objets-field { display: flex; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.objets-field input { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.objets-field input::placeholder { color: #9caab5; }
.objets-count { margin: 22px 0 12px; }
.objets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.objets-card { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 14px; border: 1px solid #c8aa6e33; border-radius: 6px; background: linear-gradient(125deg, #182b3d, #0a1724); color: #f0f2f2; }
.objets-card img { flex: 0 0 48px; width: 48px; height: 48px; object-fit: contain; border: 1px solid #c8aa6e55; border-radius: 4px; }
.objets-card div { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.objets-card strong { font: 700 17px 'Rajdhani', sans-serif; }
.objets-card small { color: #b7c2cb; line-height: 1.3; overflow-wrap: anywhere; }
@media (max-width: 600px) { .objets-grid { grid-template-columns: 1fr; } }
</style>
