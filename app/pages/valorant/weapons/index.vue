<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ValorantWeaponsResponse } from '#shared/types/valorant'
import { valorantNumber, valorantWeaponCategory } from '~/utils/valorantWeapons'

useHead({ title: 'Armes Valorant — RiftVision' })
const { data, status, error, refresh } =
  await useFetch<ValorantWeaponsResponse>('/api/valorant/weapons')
const search = ref('')
const selectedCategory = ref('all')
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
const categories = computed(() =>
  Array.from(new Set((data.value?.data ?? []).map((weapon) => weapon.category))).sort((a, b) =>
    valorantWeaponCategory(a).localeCompare(valorantWeaponCategory(b), 'fr'),
  ),
)
const weapons = computed(() => {
  const query = normalize(search.value)
  return (data.value?.data ?? [])
    .filter(
      (weapon) =>
        (selectedCategory.value === 'all' || weapon.category === selectedCategory.value) &&
        normalize(weapon.name).includes(query),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
})
function resetFilters() {
  search.value = ''
  selectedCategory.value = 'all'
}
</script>

<template>
  <ValorantLayout>
    <NuxtLink to="/valorant" class="val-back">← Retour aux agents Valorant</NuxtLink>
    <GameCatalogBanner game="valorant" eyebrow="Encyclopédie · Valorant" title="Les armes Valorant" description="Explorez les armes et leurs caractéristiques disponibles." />
    <div v-if="status === 'pending'" class="val-notice" role="status">Chargement des armes…</div>
    <div v-else-if="error || !data" class="val-notice" role="alert"><p>Le catalogue des armes est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="weapon-filters">
        <label><span>Rechercher une arme</span><input v-model="search" type="search" placeholder="Nom de l’arme" /></label>
        <label class="weapon-category-filter"><span>Catégorie</span><select v-model="selectedCategory"><option value="all">Toutes les catégories</option><option v-for="category in categories" :key="category" :value="category">{{ valorantWeaponCategory(category) }}</option></select></label>
      </div>
      <p class="weapon-count" role="status">{{ weapons.length }} arme{{ weapons.length > 1 ? 's' : '' }}</p>
      <div v-if="weapons.length" class="weapon-grid">
        <NuxtLink v-for="weapon in weapons" :key="weapon.id" :to="`/valorant/weapons/${weapon.id}`" class="weapon-card">
          <div class="weapon-art"><img :src="weapon.icon" alt="" loading="lazy" decoding="async" /></div>
          <div class="weapon-copy"><strong>{{ weapon.name }}</strong><span>{{ valorantWeaponCategory(weapon.category) }}<template v-if="weapon.cost !== null"> · {{ valorantNumber(weapon.cost) }} crédits</template></span></div><span class="weapon-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else class="val-notice"><p>Aucune arme ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button></div>
      <p class="weapon-source">Données et visuels : Valorant-API, source communautaire non officielle.</p>
    </template>
  </ValorantLayout>
</template>

<style scoped>
.weapon-filters { display: flex; flex-wrap: wrap; gap: 14px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.weapon-filters label { display: flex; flex: 1 1 250px; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.weapon-filters .weapon-category-filter { flex: 0 1 220px; }
.weapon-filters input, .weapon-filters select { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.weapon-count, .weapon-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.weapon-count { margin: 22px 0 12px; }
.weapon-source { margin-top: 24px; }
.weapon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
.weapon-card { position: relative; overflow: hidden; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #f0f2f2; text-decoration: none; }
.weapon-card:hover, .weapon-card:focus-visible { border-color: #fa8c94; }
.weapon-art { display: flex; align-items: center; justify-content: center; height: 130px; padding: 20px; background: linear-gradient(140deg, #472638, #132330); overflow: hidden; }
.weapon-art img { width: 100%; height: 100%; object-fit: contain; transition: transform .3s ease; }
.weapon-card:hover img, .weapon-card:focus-visible img { transform: scale(1.05); }
.weapon-copy { display: flex; flex-direction: column; gap: 4px; padding: 14px 34px 14px 14px; }
.weapon-copy strong { font: 700 20px 'Rajdhani', sans-serif; }
.weapon-copy span { color: #b7c2cb; font-size: 13px; }
.weapon-arrow { position: absolute; right: 14px; bottom: 14px; color: #fa8c94; }
@media (prefers-reduced-motion: reduce) { .weapon-art img { transition: none; } .weapon-card:hover img, .weapon-card:focus-visible img { transform: none; } }
@media (max-width: 600px) { .weapon-filters .weapon-category-filter { flex: 1 1 140px; } .weapon-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .weapon-art { height: 100px; padding: 14px; } }
</style>
