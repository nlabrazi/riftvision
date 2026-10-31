<script setup lang="ts">
import { computed } from 'vue'
import type { HotsMapResponse } from '#shared/types/hots'
import { hotsImage } from '~/utils/hotsImages'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const { data, status, error, refresh } = await useFetch<HotsMapResponse>(
  () => `/api/hots/maps/${encodeURIComponent(id.value)}`,
)
const map = computed(() => data.value?.data)
useHead({ title: computed(() => `${map.value?.name ?? 'Champ de bataille'} — RiftVision`) })
function hideBrokenImage(event: Event) {
  ;(event.target as HTMLImageElement).style.visibility = 'hidden'
}
</script>

<template>
  <HotsLayout>
    <NuxtLink to="/hots/maps" class="hots-back">← Retour aux champs de bataille</NuxtLink>
    <div v-if="status === 'pending'" class="hots-notice" role="status">Chargement du champ de bataille…</div>
    <div v-else-if="error?.statusCode === 404" class="hots-notice" role="alert">Ce champ de bataille est introuvable.</div>
    <div v-else-if="error || !data || !map" class="hots-notice" role="alert"><p>La fiche est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <header class="map-hero">
        <img v-if="map.art" :src="hotsImage('loadingscreens', map.art)" alt="" @error="hideBrokenImage" />
        <div><p class="hots-kicker">CHAMP DE BATAILLE · HEROES OF THE STORM</p><h1>{{ map.name }}</h1><p>Explorez les objectifs de ce lieu du Nexus.</p></div>
      </header>
      <section class="objectives" aria-labelledby="objectives-title">
        <p class="hots-kicker">MÉCANIQUES DE LA CARTE</p><h2 id="objectives-title">Objectifs du champ de bataille</h2>
        <div v-if="map.objectives.length" class="objective-grid">
          <article v-for="(objective, index) in map.objectives" :key="index" class="objective-card">
            <div v-if="objective.icons.length" class="objective-art"><img v-for="icon in objective.icons" :key="icon" :src="hotsImage('mapobjectives', icon)" alt="" loading="lazy" decoding="async" @error="hideBrokenImage" /></div>
            <div class="objective-copy"><span class="objective-number">OBJECTIF {{ String(index + 1).padStart(2, '0') }}</span><h3>{{ objective.title || `Objectif ${index + 1}` }}</h3><p v-if="objective.description">{{ objective.description }}</p><p v-else>Description indisponible.</p></div>
          </article>
        </div>
        <p v-else class="objective-empty">Les objectifs ne sont pas disponibles dans les données de cette carte.</p>
      </section>
      <p class="maps-source">Données et images : HeroesToolChest, source communautaire · version {{ data.version }}. La disponibilité en jeu peut varier.</p>
    </template>
  </HotsLayout>
</template>

<style scoped>
.map-hero { position: relative; display: flex; align-items: end; min-height: 320px; margin-top: 30px; padding: 32px; overflow: hidden; isolation: isolate; border: 1px solid #9075db55; border-radius: 8px; background: linear-gradient(120deg, #342a55, #101629 70%); }
.map-hero > img { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 45%; }
.map-hero::before { content: ''; position: absolute; z-index: -1; inset: 0; background: linear-gradient(90deg, #090e1cf5, #090e1c88 55%, #090e1c22), linear-gradient(0deg, #090e1cbf, transparent 65%); }
.map-hero h1 { margin: 10px 0; color: #f6f3ff; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.map-hero p:not(.hots-kicker) { margin: 0; color: #e0e3ef; line-height: 1.5; }
.objectives { margin-top: 18px; padding: 26px; border: 1px solid #ffffff1a; border-radius: 8px; background: #10192b; }
.objectives h2 { margin: 8px 0 22px; color: #f3f1ff; font: 700 29px 'Rajdhani', sans-serif; }
.objective-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.objective-card { overflow: hidden; border: 1px solid #9b86d13b; border-radius: 6px; background: linear-gradient(145deg, #1b2340, #11182a); }
.objective-art { display: flex; justify-content: center; align-items: center; min-height: 150px; padding: 10px; background: radial-gradient(ellipse at 50% 80%, #7557b15c, transparent 70%), #121a2d; }
.objective-art img { width: min(50%, 160px); height: 140px; object-fit: contain; }
.objective-art img:only-child { width: min(100%, 180px); }
.objective-copy { padding: 18px; }
.objective-number { color: #b9a3fa; font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .12em; }
.objective-copy h3 { margin: 8px 0; color: #f3f1ff; font: 700 22px/1.15 'Rajdhani', sans-serif; }
.objective-copy p, .objective-empty { margin: 0; color: #c6d0dc; line-height: 1.55; }
.maps-source { margin-top: 22px; color: #aebbc8; font: 600 13px/1.5 'Rajdhani', sans-serif; }
@media (max-width: 850px) { .objective-grid { grid-template-columns: 1fr; } .objective-card { display: flex; } .objective-art { flex: 0 0 150px; } }
@media (max-width: 600px) { .map-hero { min-height: 230px; padding: 20px; } .objectives { padding: 20px; } .objective-card { display: block; } .objective-art { min-height: 120px; } .objective-art img { height: 110px; } }
</style>
