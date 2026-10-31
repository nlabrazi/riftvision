<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HotsHeroesResponse } from '#shared/types/hots'
import { hotsImage } from '~/utils/hotsImages'

useHead({ title: 'Héros du Nexus — RiftVision' })
const { data, status, error, refresh } = await useFetch<HotsHeroesResponse>('/api/hots/heroes')
const search = ref('')
const role = ref('all')
const universe = ref('all')
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘']/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
const roles = computed(() =>
  [...new Set((data.value?.data ?? []).map((hero) => hero.role).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  ),
)
const universes = computed(() =>
  [...new Set((data.value?.data ?? []).map((hero) => hero.universe).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  ),
)
const heroes = computed(() =>
  (data.value?.data ?? [])
    .filter(
      (hero) =>
        (role.value === 'all' || hero.role === role.value) &&
        (universe.value === 'all' || hero.universe === universe.value) &&
        normalize(`${hero.name} ${hero.title} ${hero.role}`).includes(normalize(search.value)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
)
const { page, pageCount, start, end } = usePagination(
  computed(() => heroes.value.length),
  [search, role, universe],
  36,
)
function resetFilters() {
  search.value = ''
  role.value = 'all'
  universe.value = 'all'
}
function hideBrokenImage(event: Event) {
  ;(event.target as HTMLImageElement).style.visibility = 'hidden'
}
</script>

<template>
  <HotsLayout>
    <NuxtLink to="/" class="hots-back">← Retour à tous les jeux</NuxtLink>
    <header class="hots-heading">
      <div><p class="hots-kicker">ENCYCLOPÉDIE · HEROES OF THE STORM</p><h1>Les héros du Nexus<span>.</span></h1><p>Retrouvez les héros de vos univers Blizzard, leurs compétences et leurs talents.</p></div>
      <span v-if="data" class="hots-version">Données communautaires · {{ data.version }}</span>
    </header>
    <div v-if="status === 'pending'" class="hots-notice" role="status">Chargement des héros…</div>
    <div v-else-if="error || !data" class="hots-notice" role="alert"><p>Le catalogue des héros est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <div class="hots-filters">
        <label><span>Rechercher un héros</span><input v-model="search" type="search" placeholder="Nom, titre ou rôle" /></label>
        <label><span>Rôle</span><select v-model="role"><option value="all">Tous les rôles</option><option v-for="entry in roles" :key="entry" :value="entry">{{ entry }}</option></select></label>
        <label><span>Univers</span><select v-model="universe"><option value="all">Tous les univers</option><option v-for="entry in universes" :key="entry" :value="entry">{{ entry }}</option></select></label>
      </div>
      <p class="hots-count" role="status">{{ heroes.length }} héros</p>
      <div v-if="heroes.length" id="catalog-results" tabindex="-1" class="hero-grid">
        <NuxtLink v-for="hero in heroes.slice(start, end)" :key="hero.id" :to="`/hots/heroes/${hero.id}`" class="hero-card">
          <div class="hero-art"><img v-if="hero.art" :src="hotsImage('heroportraits', hero.art)" alt="" loading="lazy" decoding="async" @error="hideBrokenImage" /><span class="hero-universe">{{ hero.universe }}</span></div>
          <div class="hero-copy"><div><strong>{{ hero.name }}</strong><span>{{ hero.title }}</span></div><p>{{ hero.role }}</p><span class="hero-arrow" aria-hidden="true">↗</span></div>
        </NuxtLink>
      </div>
      <div v-else class="hots-notice"><p>Aucun héros ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button></div>
      <ResultsPagination v-model:page="page" :page-count="pageCount" />
      <p class="hots-source">Données et images : HeroesToolChest, source communautaire · version {{ data.version }} · Français</p>
    </template>
  </HotsLayout>
</template>

<style scoped>
.hots-heading { display: flex; justify-content: space-between; align-items: end; flex-wrap: wrap; gap: 20px; margin: 30px 0 24px; padding: 32px; border: 1px solid #9075db55; border-radius: 8px; background: linear-gradient(90deg, #101629f2, #101629ac), url('/assets/images/game-hots.webp') center 43% / cover; }
.hots-heading h1 { margin: 9px 0; color: #f3f1ff; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.hots-heading h1 span { color: #b6a0ff; }
.hots-heading p:not(.hots-kicker) { margin: 0; color: #c4cbdc; line-height: 1.5; }
.hots-version { padding: 7px 10px; border: 1px solid #8e80c766; border-radius: 4px; background: #111324dd; color: #d2c6ff; font: 600 13px 'Rajdhani', sans-serif; }
.hots-filters { display: flex; flex-wrap: wrap; gap: 14px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #10192b; }
.hots-filters label { display: flex; flex: 1 1 190px; flex-direction: column; gap: 8px; color: #c5c9d8; font: 600 13px 'Rajdhani', sans-serif; }
.hots-filters input, .hots-filters select { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #4a4967; border-radius: 4px; background: #0a1220; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.hots-count, .hots-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.hots-count { margin: 22px 0 12px; } .hots-source { margin-top: 25px; }
.hero-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 14px; }
.hero-card { overflow: hidden; min-width: 0; border: 1px solid #9b86d13b; border-radius: 7px; background: linear-gradient(150deg, #1a2440, #101627); color: #eef0f7; text-decoration: none; transition: transform .2s, border-color .2s; }
.hero-card:hover, .hero-card:focus-visible { border-color: #b8a1ff; transform: translateY(-3px); }
.hero-art { position: relative; overflow: hidden; height: 150px; background: radial-gradient(ellipse at 65% 60%, #624e9477, transparent 65%), #12192a; }
.hero-art img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; }
.hero-universe { position: absolute; top: 10px; left: 10px; padding: 4px 8px; border: 1px solid #b8a1ff55; border-radius: 3px; background: #0d1423dc; color: #d2c6ff; font: 700 11px 'Rajdhani', sans-serif; text-transform: uppercase; }
.hero-copy { position: relative; display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; }
.hero-copy > div { display: flex; flex-direction: column; gap: 3px; padding-right: 20px; }
.hero-copy strong { color: #f4f2ff; font: 700 22px/1.1 'Rajdhani', sans-serif; }
.hero-copy > div span { color: #b9c4d2; font: 14px 'Rajdhani', sans-serif; }
.hero-copy p { margin: 0; color: #c6b2ff; font: 700 13px 'Rajdhani', sans-serif; }
.hero-arrow { position: absolute; right: 18px; top: 18px; color: #c6b2ff; }
@media (prefers-reduced-motion: reduce) { .hero-card { transition: none; } .hero-card:hover, .hero-card:focus-visible { transform: none; } }
@media (max-width: 600px) { .hots-heading { padding: 22px; } .hero-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .hero-art { height: 105px; } .hero-copy { padding: 12px; } .hero-copy strong { font-size: 19px; } }
</style>
