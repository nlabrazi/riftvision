<script setup lang="ts">
import { computed } from 'vue'
import type { WowClassResponse } from '#shared/types/wow'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const endpoint = computed(() => `/api/wow/classes/${encodeURIComponent(id.value)}`)
const { data, status, error, refresh } = await useFetch<WowClassResponse>(endpoint)
useHead({ title: computed(() => `${data.value?.data.name ?? 'Classe WoW'} — RiftVision`) })
</script>

<template>
  <WowLayout>
    <NuxtLink to="/wow" class="wow-back">← Retour aux classes WoW</NuxtLink>
    <div v-if="status === 'pending'" class="wow-notice" role="status">Chargement de la classe…</div>
    <div v-else-if="error || !data" class="wow-notice" role="alert"><p>{{ error?.statusCode === 404 ? 'Cette classe est introuvable.' : 'La fiche est momentanément indisponible.' }}</p><button v-if="error?.statusCode !== 404" type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <section class="class-hero"><img v-if="data.data.icon" :src="data.data.icon" alt="" /><span v-else class="class-icon-placeholder" aria-hidden="true">✦</span><div><p class="wow-kicker">CLASSE · WORLD OF WARCRAFT RETAIL</p><h1>{{ data.data.name }}</h1><p v-if="data.data.powerType">Ressource principale : {{ data.data.powerType }}</p></div></section>
      <section class="class-details" aria-labelledby="specializations-title"><p class="wow-kicker">EN JEU</p><h2 id="specializations-title">Spécialisations</h2><ul v-if="data.data.specializations.length" class="spec-list"><li v-for="spec in data.data.specializations" :key="spec.id">{{ spec.name }}</li></ul><p v-else>Les spécialisations ne sont pas disponibles pour cette classe.</p></section>
      <p class="class-source">Données : Blizzard · World of Warcraft Retail · Europe · Français</p>
    </template>
  </WowLayout>
</template>

<style scoped>
.class-hero { display: flex; align-items: center; gap: 24px; min-height: 190px; margin-top: 30px; padding: 28px; border: 1px solid #c8aa6e44; border-radius: 6px; background: linear-gradient(120deg, #302841, #091521 70%); }
.class-hero img, .class-icon-placeholder { width: 88px; height: 88px; flex: 0 0 88px; border-radius: 6px; }
.class-icon-placeholder { display: grid; place-items: center; color: #d6bb83; background: #28313b; font-size: 34px; }
.class-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.class-hero p:not(.wow-kicker) { color: #d0d9df; line-height: 1.6; }
.class-details { margin-top: 18px; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.class-details h2 { margin: 8px 0 20px; color: #f1f1ee; font: 700 28px 'Rajdhani', sans-serif; }
.spec-list { display: flex; flex-wrap: wrap; gap: 10px; padding: 0; margin: 0; list-style: none; }
.spec-list li { padding: 10px 16px; border: 1px solid #c8aa6e44; border-radius: 4px; background: #091420; color: #e8d6b0; font: 700 16px 'Rajdhani', sans-serif; }
.class-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 600px) { .class-hero { gap: 16px; min-height: 150px; padding: 20px; } .class-hero img, .class-icon-placeholder { width: 64px; height: 64px; flex-basis: 64px; } .class-details { padding: 20px; } }
</style>
