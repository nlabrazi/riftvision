<script setup lang="ts">
import { computed } from 'vue'
import type { ValorantAgentsResponse } from '#shared/types/valorant'
import ValorantAbilities from '~/components/ValorantAbilities.vue'

const route = useRoute()
const id = computed(() => String(route.params.id ?? '').toLowerCase())
const { data, status, error, refresh } =
  await useFetch<ValorantAgentsResponse>('/api/valorant/agents')
const agent = computed(() => data.value?.data.find((entry) => entry.id === id.value))
useHead({ title: computed(() => `${agent.value?.name ?? 'Agent Valorant'} — RiftVision`) })
</script>

<template>
  <ValorantLayout>
    <NuxtLink to="/valorant" class="val-back">← Retour aux agents Valorant</NuxtLink>
    <div v-if="status === 'pending'" class="val-notice" role="status">Chargement de l’agent…</div>
    <div v-else-if="error || !data" class="val-notice" role="alert"><p>La fiche est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else-if="agent">
      <section class="agent-hero">
        <div><p class="val-kicker">AGENT · VALORANT</p><h1>{{ agent.name }}</h1><p class="agent-role">{{ agent.role ?? 'Rôle non renseigné' }}</p><p class="agent-description">{{ agent.description }}</p></div>
        <img :src="agent.portrait ?? agent.icon" alt="" />
      </section>
      <section class="agent-abilities" aria-labelledby="agent-abilities-title">
        <p class="val-kicker">EN JEU</p><h2 id="agent-abilities-title">Compétences</h2>
        <ValorantAbilities v-if="agent.abilities.length" :key="agent.id" :agent-id="agent.id" :agent-name="agent.name" :abilities="agent.abilities" />
        <p v-else>Les compétences ne sont pas disponibles pour cet agent.</p>
        <p class="agent-source">Données et visuels : Valorant-API, source communautaire non officielle.</p>
      </section>
    </template>
    <div v-else class="val-notice" role="alert">Cet agent est introuvable.</div>
  </ValorantLayout>
</template>

<style scoped>
.agent-hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 280px; margin-top: 30px; padding: 28px; border: 1px solid #ed727c44; border-radius: 6px; background: linear-gradient(120deg, #3a1f32, #091521 70%); overflow: hidden; }
.agent-hero > div { max-width: 700px; }
.agent-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.agent-role { color: #f5a4aa; font: 700 17px 'Rajdhani', sans-serif; }
.agent-description { color: #d0d9df; line-height: 1.7; }
.agent-hero img { width: min(38%, 300px); max-height: 300px; object-fit: contain; }
.agent-abilities { margin-top: 18px; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.agent-abilities h2 { margin: 8px 0 20px; color: #f1f1ee; font: 700 28px 'Rajdhani', sans-serif; }
.agent-source { margin: 24px 0 0; color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 600px) { .agent-hero { align-items: start; padding: 20px; } .agent-hero img { width: 30%; } .agent-abilities { padding: 20px; } }
</style>
