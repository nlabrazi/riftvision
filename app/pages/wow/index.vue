<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WowClassesResponse } from '#shared/types/wow'

useHead({ title: 'Classes WoW — RiftVision' })
const { data, status, error, refresh } = await useFetch<WowClassesResponse>('/api/wow/classes')
const search = ref('')
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
const classes = computed(() => {
  const query = normalize(search.value)
  return (data.value?.data ?? [])
    .filter((entry) => normalize(entry.name).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
})
</script>

<template>
  <WowLayout>
    <NuxtLink to="/" class="wow-back">← Retour à tous les jeux</NuxtLink>
    <header class="class-heading"><p class="wow-kicker">ENCYCLOPÉDIE · WORLD OF WARCRAFT RETAIL</p><h1>Les classes WoW<span>.</span></h1><p>Découvrez les classes et leurs spécialisations dans World of Warcraft Retail.</p></header>
    <div v-if="status === 'pending'" class="wow-notice" role="status">Chargement des classes…</div>
    <div v-else-if="error || !data" class="wow-notice" role="alert"><p>Le catalogue des classes est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="class-filters"><label><span>Rechercher une classe</span><input v-model="search" type="search" placeholder="Nom de la classe" /></label></div>
      <p class="class-count" role="status">{{ classes.length }} classe{{ classes.length > 1 ? 's' : '' }}</p>
      <div v-if="classes.length" class="class-grid">
        <NuxtLink v-for="entry in classes" :key="entry.id" :to="`/wow/classes/${entry.id}`" class="class-card">
          <img v-if="entry.icon" :src="entry.icon" alt="" loading="lazy" decoding="async" /><span v-else class="class-icon-placeholder" aria-hidden="true">✦</span>
          <strong>{{ entry.name }}</strong><span class="class-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else class="wow-notice"><p>Aucune classe ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="search = ''">Effacer la recherche</button></div>
      <p class="class-source">Données : Blizzard · World of Warcraft Retail · Europe · Français</p>
    </template>
  </WowLayout>
</template>

<style scoped>
.class-heading { margin: 40px 0 24px; }
.class-heading h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.class-heading h1 span { color: #d6bb83; }
.class-heading > p:last-child { color: #b8c5cf; line-height: 1.5; }
.class-filters { padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.class-filters label { display: flex; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.class-filters input { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.class-count, .class-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.class-count { margin: 22px 0 12px; }
.class-source { margin-top: 24px; }
.class-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.class-card { display: flex; align-items: center; gap: 14px; min-width: 0; padding: 16px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #f0f2f2; text-decoration: none; }
.class-card:hover, .class-card:focus-visible { border-color: #c8aa6e; background: #122333; }
.class-card img, .class-icon-placeholder { width: 56px; height: 56px; flex: 0 0 56px; border-radius: 5px; }
.class-icon-placeholder { display: grid; place-items: center; color: #d6bb83; background: #28313b; font-size: 26px; }
.class-card strong { flex: 1; font: 700 20px 'Rajdhani', sans-serif; }
.class-arrow { color: #d6bb83; }
@media (max-width: 600px) { .class-heading { margin-top: 30px; } .class-grid { grid-template-columns: 1fr; } }
</style>
