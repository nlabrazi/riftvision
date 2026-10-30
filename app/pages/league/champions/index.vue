<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DataDragonChampions } from '#shared/types/dataDragon'

useHead({ title: 'Champions LoL — RiftVision' })

const { data, status, error, refresh } =
  await useFetch<DataDragonChampions>('/api/ddragon/champions')
const search = ref('')
const selectedRole = ref('all')
const roles = [
  { id: 'all', label: 'Toutes les classes' },
  { id: 'Assassin', label: 'Assassin' },
  { id: 'Fighter', label: 'Combattant' },
  { id: 'Mage', label: 'Mage' },
  { id: 'Marksman', label: 'Tireur' },
  { id: 'Support', label: 'Support' },
  { id: 'Tank', label: 'Tank' },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

const champions = computed(() => {
  const query = normalize(search.value)
  return Object.values(data.value?.data ?? {})
    .filter(
      (champion) => selectedRole.value === 'all' || champion.tags.includes(selectedRole.value),
    )
    .filter((champion) => normalize(`${champion.name} ${champion.title}`).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
})

function resetFilters() {
  search.value = ''
  selectedRole.value = 'all'
}
</script>

<template>
  <EncyclopediaLayout>
    <NuxtLink to="/league" class="encyclopedia-back">← Retour à League of Legends</NuxtLink>
    <div class="champion-heading">
      <div>
        <p class="encyclopedia-kicker">ENCYCLOPÉDIE · LEAGUE OF LEGENDS</p>
        <h1>Les champions<span>.</span></h1>
        <p>Découvrez les champions de la Faille, leurs histoires et leurs compétences.</p>
      </div>
      <span v-if="data" class="champion-version">Données Data Dragon · {{ data.version }}</span>
    </div>

    <div v-if="status === 'pending'" class="encyclopedia-notice" role="status">Chargement des champions…</div>
    <div v-else-if="error || !data" class="encyclopedia-notice" role="alert">
      <p>Le catalogue est momentanément indisponible.</p>
      <button type="button" class="rv-button" @click="refresh()">Réessayer</button>
    </div>
    <template v-else>
      <div class="champion-filters">
        <label class="champion-field">
          <span>Rechercher un champion</span>
          <input v-model="search" type="search" placeholder="Nom ou titre" />
        </label>
        <label class="champion-field champion-field--role">
          <span>Classe</span>
          <select v-model="selectedRole">
            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.label }}</option>
          </select>
        </label>
      </div>
      <p class="champion-count" role="status">{{ champions.length }} champion{{ champions.length > 1 ? 's' : '' }}</p>
      <div v-if="champions.length" class="champion-grid">
        <NuxtLink v-for="champion in champions" :key="champion.id" class="champion-card" :to="`/league/champions/${champion.id}`">
          <img :src="`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion.id}_0.jpg`" alt="" loading="lazy" decoding="async" />
          <span class="champion-card__copy"><strong>{{ champion.name }}</strong><span>{{ champion.title }}</span></span>
        </NuxtLink>
      </div>
      <div v-else class="encyclopedia-notice">
        <p>Aucun champion ne correspond à votre recherche.</p>
        <button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button>
      </div>
    </template>
  </EncyclopediaLayout>
</template>

<style scoped>
.champion-heading { display: flex; justify-content: space-between; align-items: end; flex-wrap: wrap; gap: 20px; margin: 40px 0 30px; }
.champion-heading h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.champion-heading h1 span { color: #d6bb83; }
.champion-heading p:not(.encyclopedia-kicker) { margin: 0; color: #b8c5cf; line-height: 1.5; }
.champion-version, .champion-count { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.champion-filters { display: flex; flex-wrap: wrap; gap: 14px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.champion-field { display: flex; flex: 1 1 250px; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.champion-field--role { flex: 0 1 230px; }
.champion-field input, .champion-field select { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.champion-field input::placeholder { color: #9caab5; }
.champion-count { margin: 22px 0 12px; }
.champion-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
.champion-card { position: relative; display: flex; align-items: end; min-height: 230px; aspect-ratio: 3 / 4; overflow: hidden; border: 1px solid #ffffff24; border-radius: 6px; background: #101d2a; color: #f4f4f1; text-decoration: none; }
.champion-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 350ms ease; }
.champion-card::after { content: ''; position: absolute; inset: 30% 0 0; background: linear-gradient(transparent, #050b13f5); }
.champion-card__copy { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 3px; width: 100%; padding: 16px 12px; }
.champion-card__copy strong { font: 700 20px/1.1 'Rajdhani', sans-serif; }
.champion-card__copy span { color: #d0d7dc; font-size: 12px; line-height: 1.3; }
.champion-card:hover, .champion-card:focus-visible { border-color: #c8aa6e; }
@media (prefers-reduced-motion: no-preference) { .champion-card:hover img, .champion-card:focus-visible img { transform: scale(1.05); } }
@media (prefers-reduced-motion: reduce) { .champion-card img { transition: none; } }
@media (max-width: 600px) { .champion-heading { margin-top: 30px; } .champion-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .champion-field--role { flex: 1 1 200px; } }
</style>
