<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TftTraitsResponse } from '#shared/types/tft'

useHead({ title: 'Traits TFT — RiftVision' })
const { data, status, error, refresh } =
  await useFetch<TftTraitsResponse>('/api/ddragon/tft/traits')
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
const traits = computed(() => {
  const query = normalize(search.value)
  return (data.value?.data ?? [])
    .filter((trait) =>
      typeof route.query.id === 'string' && search.value === route.query.id
        ? trait.id === route.query.id
        : normalize(`${trait.name} ${trait.id}`).includes(query),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'fr') || a.id.localeCompare(b.id))
})
const { page, pageCount, start, end } = usePagination(
  computed(() => traits.value.length),
  [search, () => route.query.id],
  48,
)
</script>

<template>
  <TftLayout>
    <NuxtLink to="/tft" class="tft-back">← Retour aux unités TFT</NuxtLink>
    <GameCatalogBanner game="tft" eyebrow="Encyclopédie · Teamfight Tactics" title="Les traits TFT" description="Explorez les traits répertoriés dans les données officielles." :badge="data ? `Données Data Dragon · ${data.version}` : undefined" />
    <p class="traits-source-note">Ce catalogue peut contenir plusieurs sets et modes. Les données disponibles ne précisent pas les effets des traits ni les unités associées.</p>
    <div v-if="status === 'pending'" class="tft-notice" role="status">Chargement des traits…</div>
    <div v-else-if="error || !data" class="tft-notice" role="alert"><p>Le catalogue des traits TFT est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="traits-filters"><label class="traits-field"><span>Rechercher un trait</span><input v-model="search" type="search" placeholder="Nom ou identifiant" /></label></div>
      <p class="traits-count" role="status">{{ traits.length }} trait{{ traits.length > 1 ? 's' : '' }}</p>
      <div v-if="traits.length" id="catalog-results" tabindex="-1" class="traits-grid">
        <article v-for="trait in traits.slice(start, end)" :key="trait.id" class="traits-card">
          <img :src="`https://ddragon.leagueoflegends.com/cdn/${data.version}/img/tft-trait/${encodeURIComponent(trait.icon)}`" alt="" loading="lazy" decoding="async" />
          <div><strong>{{ trait.name }}</strong><small>{{ trait.id }}</small></div>
        </article>
      </div>
      <div v-else class="tft-notice"><p>Aucun trait ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="search = ''">Effacer la recherche</button></div>
      <ResultsPagination v-model:page="page" :page-count="pageCount" />
    </template>
  </TftLayout>
</template>

<style scoped>
.traits-count { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.traits-source-note { margin: 0 0 24px; padding: 12px 15px; border-left: 2px solid #c8aa6e; background: #12202c; color: #c4cfd7; line-height: 1.5; }
.traits-filters { padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.traits-field { display: flex; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.traits-field input { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.traits-field input::placeholder { color: #9caab5; }
.traits-count { margin: 22px 0 12px; }
.traits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.traits-card { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 14px; border: 1px solid #c8aa6e33; border-radius: 6px; background: linear-gradient(125deg, #182b3d, #0a1724); color: #f0f2f2; }
.traits-card img { flex: 0 0 48px; width: 48px; height: 48px; object-fit: contain; border: 1px solid #c8aa6e55; border-radius: 4px; }
.traits-card div { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.traits-card strong { font: 700 17px 'Rajdhani', sans-serif; }
.traits-card small { color: #b7c2cb; line-height: 1.3; overflow-wrap: anywhere; }
@media (max-width: 600px) { .traits-grid { grid-template-columns: 1fr; } }
</style>
