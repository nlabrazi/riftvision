<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ValorantAgentsResponse } from '#shared/types/valorant'

useHead({ title: 'Agents Valorant — RiftVision' })
const { data, status, error, refresh } =
  await useFetch<ValorantAgentsResponse>('/api/valorant/agents')
const search = ref('')
const selectedRole = ref('all')
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
const roles = computed(() =>
  Array.from(
    new Set((data.value?.data ?? []).flatMap((agent) => (agent.role ? [agent.role] : []))),
  ).sort((a, b) => a.localeCompare(b, 'fr')),
)
const agents = computed(() => {
  const query = normalize(search.value)
  return (data.value?.data ?? [])
    .filter(
      (agent) =>
        (selectedRole.value === 'all' || agent.role === selectedRole.value) &&
        normalize(agent.name).includes(query),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
})
function resetFilters() {
  search.value = ''
  selectedRole.value = 'all'
}
</script>

<template>
  <ValorantLayout>
    <NuxtLink to="/" class="val-back">← Retour à tous les jeux</NuxtLink>
    <GameCatalogBanner game="valorant" eyebrow="Encyclopédie · Valorant" title="Les agents Valorant" description="Découvrez les agents, leurs rôles et leurs compétences." />
    <div v-if="status === 'pending'" class="val-notice" role="status">Chargement des agents…</div>
    <div v-else-if="error || !data" class="val-notice" role="alert"><p>Le catalogue des agents est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="agent-filters">
        <label><span>Rechercher un agent</span><input v-model="search" type="search" placeholder="Nom de l’agent" /></label>
        <label class="agent-role-filter"><span>Rôle</span><select v-model="selectedRole"><option value="all">Tous les rôles</option><option v-for="role in roles" :key="role" :value="role">{{ role }}</option></select></label>
      </div>
      <p class="agent-count" role="status">{{ agents.length }} agent{{ agents.length > 1 ? 's' : '' }}</p>
      <div v-if="agents.length" class="agent-grid">
        <NuxtLink v-for="agent in agents" :key="agent.id" :to="`/valorant/agents/${agent.id}`" class="agent-card">
          <div class="agent-art"><img :src="agent.icon" alt="" loading="lazy" decoding="async" /></div>
          <div class="agent-copy"><strong>{{ agent.name }}</strong><span>{{ agent.role ?? 'Rôle non renseigné' }}</span></div><span class="agent-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else class="val-notice"><p>Aucun agent ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button></div>
      <p class="agent-source">Données et visuels : Valorant-API, source communautaire non officielle.</p>
    </template>
  </ValorantLayout>
</template>

<style scoped>
.agent-filters { display: flex; flex-wrap: wrap; gap: 14px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.agent-filters label { display: flex; flex: 1 1 250px; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.agent-filters .agent-role-filter { flex: 0 1 200px; }
.agent-filters input, .agent-filters select { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.agent-count, .agent-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.agent-count { margin: 22px 0 12px; }
.agent-source { margin-top: 24px; }
.agent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.agent-card { position: relative; overflow: hidden; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #f0f2f2; text-decoration: none; }
.agent-card:hover, .agent-card:focus-visible { border-color: #fa8c94; }
.agent-art { aspect-ratio: 1; background: linear-gradient(140deg, #552b3d, #132330); overflow: hidden; }
.agent-art img { width: 100%; height: 100%; object-fit: contain; transition: transform .3s ease; }
.agent-card:hover img, .agent-card:focus-visible img { transform: scale(1.05); }
.agent-copy { display: flex; flex-direction: column; gap: 4px; padding: 14px; }
.agent-copy strong { font: 700 20px 'Rajdhani', sans-serif; }
.agent-copy span { color: #b7c2cb; font-size: 13px; }
.agent-arrow { position: absolute; right: 14px; bottom: 14px; color: #fa8c94; }
@media (prefers-reduced-motion: reduce) { .agent-art img { transition: none; } .agent-card:hover img, .agent-card:focus-visible img { transform: none; } }
@media (max-width: 600px) { .agent-filters .agent-role-filter { flex: 1 1 140px; } .agent-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
