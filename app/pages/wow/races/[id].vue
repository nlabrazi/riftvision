<script setup lang="ts">
import { computed } from 'vue'
import type { WowClassesResponse, WowRacesResponse } from '#shared/types/wow'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const { data, status, error, refresh } = await useFetch<WowRacesResponse>('/api/wow/races')
const { data: classesData } = await useLazyFetch<WowClassesResponse>('/api/wow/classes')
const race = computed(() => data.value?.data.find((entry) => String(entry.id) === id.value))
const classes = computed(() =>
  [...(race.value?.classes ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
)
const availableClasses = computed(
  () => new Set((classesData.value?.data ?? []).map((entry) => entry.id)),
)
useHead({ title: computed(() => `${race.value?.name ?? 'Race WoW'} — RiftVision`) })
</script>

<template>
  <WowLayout>
    <NuxtLink to="/wow/races" class="wow-back">← Retour aux races WoW</NuxtLink>
    <div v-if="status === 'pending'" class="wow-notice" role="status">Chargement de la race…</div>
    <div v-else-if="error || !data" class="wow-notice" role="alert"><p>La fiche est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else-if="race">
      <section class="race-hero"><div><p class="wow-kicker">RACE · WORLD OF WARCRAFT RETAIL</p><h1>{{ race.name }}</h1><p>{{ race.faction?.name ?? 'Faction non renseignée' }}<template v-if="race.allied === true"> · Race alliée</template></p></div></section>
      <section class="race-details" aria-labelledby="race-classes-title"><p class="wow-kicker">EN JEU</p><h2 id="race-classes-title">Classes disponibles</h2><ul v-if="classes.length" class="class-list"><li v-for="entry in classes" :key="entry.id"><NuxtLink v-if="availableClasses.has(entry.id)" :to="`/wow/classes/${entry.id}`">{{ entry.name }} <span aria-hidden="true">↗</span></NuxtLink><span v-else>{{ entry.name }}</span></li></ul><p v-else>Les classes ne sont pas disponibles pour cette race.</p></section>
      <p class="race-source">Données : Blizzard · World of Warcraft Retail · Europe · Français</p>
    </template>
    <div v-else class="wow-notice" role="alert">Cette race est introuvable.</div>
  </WowLayout>
</template>

<style scoped>
.race-hero { display: flex; align-items: end; min-height: 220px; margin-top: 30px; padding: 28px; border: 1px solid #c8aa6e44; border-radius: 6px; background: linear-gradient(90deg, #07111df2, #09152188), url('/assets/images/game-wow.webp') center 40% / cover; }
.race-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.race-hero p:not(.wow-kicker) { color: #d0d9df; line-height: 1.6; }
.race-details { margin-top: 18px; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.race-details h2 { margin: 8px 0 20px; color: #f1f1ee; font: 700 28px 'Rajdhani', sans-serif; }
.class-list { display: flex; flex-wrap: wrap; gap: 10px; padding: 0; margin: 0; list-style: none; }
.class-list li { border: 1px solid #c8aa6e44; border-radius: 4px; background: #091420; color: #e8d6b0; font: 700 16px 'Rajdhani', sans-serif; }
.class-list li > a, .class-list li > span { display: block; padding: 10px 16px; color: inherit; text-decoration: none; }
.class-list a:hover, .class-list a:focus-visible { color: #fff; text-decoration: underline; }
.race-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 600px) { .race-hero { min-height: 160px; padding: 20px; } .race-details { padding: 20px; } }
</style>
