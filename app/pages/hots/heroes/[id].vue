<script setup lang="ts">
import { computed } from 'vue'
import type { HotsHeroResponse } from '#shared/types/hots'
import { hotsImage } from '~/utils/hotsImages'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const { data, status, error, refresh } = await useFetch<HotsHeroResponse>(
  () => `/api/hots/heroes/${encodeURIComponent(id.value)}`,
)
const hero = computed(() => data.value?.data)
const levels = computed(() =>
  [...new Set((hero.value?.talents ?? []).map((talent) => talent.level))].sort((a, b) => a - b),
)
const labels: Record<string, string> = {
  Basic: 'Compétence',
  Trait: 'Trait',
  Heroic: 'Capacité héroïque',
}
useHead({
  title: computed(() => `${hero.value?.name ?? 'Héros'} — Heroes of the Storm · RiftVision`),
})
function hideBrokenImage(event: Event) {
  ;(event.target as HTMLImageElement).style.visibility = 'hidden'
}
</script>

<template>
  <HotsLayout>
    <NuxtLink to="/hots/heroes" class="hots-back">← Retour aux héros du Nexus</NuxtLink>
    <div v-if="status === 'pending'" class="hots-notice" role="status">Chargement du héros…</div>
    <div v-else-if="error || !data" class="hots-notice" role="alert"><p>{{ error?.statusCode === 404 ? 'Ce héros est introuvable.' : 'La fiche est momentanément indisponible.' }}</p><button v-if="error?.statusCode !== 404" type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else-if="hero">
      <section class="hero-heading"><img v-if="hero.art" class="hero-heading__art" :src="hotsImage('heroportraits', hero.art)" alt="" @error="hideBrokenImage" /><div class="hero-heading__copy"><p class="hots-kicker">HÉROS · {{ hero.universe }}</p><h1>{{ hero.name }}</h1><p class="hero-title">{{ hero.title }}</p><p class="hero-description">{{ hero.description }}</p><span class="hero-role">{{ hero.role }}</span></div></section>
      <div class="hero-content">
        <section v-if="hero.lore" class="hero-panel"><p class="hots-kicker">LE NEXUS</p><h2>À propos</h2><p class="hero-lore">{{ hero.lore }}</p></section>
        <section class="hero-panel" aria-labelledby="abilities-title"><p class="hots-kicker">EN JEU</p><h2 id="abilities-title">Compétences principales</h2><div v-if="hero.abilities.length" class="ability-grid"><article v-for="ability in hero.abilities" :key="ability.id" class="ability-card"><img v-if="ability.icon" :src="hotsImage('abilitytalents', ability.icon)" alt="" loading="lazy" @error="hideBrokenImage" /><div><p class="ability-label">{{ labels[ability.group] ?? 'Compétence' }}<template v-if="['Q', 'W', 'E', 'R', 'D'].includes(ability.slot)"> · {{ ability.slot }}</template></p><h3>{{ ability.name }}</h3><p class="ability-description">{{ ability.description }}</p></div></article></div><p v-else>Les compétences ne sont pas disponibles pour ce héros.</p></section>
        <section class="hero-panel" aria-labelledby="talents-title"><p class="hots-kicker">PROGRESSION</p><h2 id="talents-title">Talents</h2><p class="talents-intro">Découvrez les choix disponibles à chaque palier.</p><div v-if="levels.length" class="talent-levels"><details v-for="level in levels" :key="level" :open="level === 1"><summary>Niveau {{ level }} <span>{{ hero.talents.filter((talent) => talent.level === level).length }} choix</span></summary><div class="talent-grid"><article v-for="talent in hero.talents.filter((entry) => entry.level === level)" :key="talent.id" class="ability-card"><img v-if="talent.icon" :src="hotsImage('abilitytalents', talent.icon)" alt="" loading="lazy" @error="hideBrokenImage" /><div><h3>{{ talent.name }}</h3><p class="ability-description">{{ talent.description }}</p></div></article></div></details></div><p v-else>Les talents ne sont pas disponibles pour ce héros.</p></section>
      </div>
      <p class="hero-source">Données et images : HeroesToolChest, source communautaire · version {{ data.version }} · valeurs de base susceptibles d’évoluer en partie.</p>
    </template>
  </HotsLayout>
</template>

<style scoped>
.hero-heading { position: relative; display: flex; align-items: center; min-height: 280px; overflow: hidden; margin-top: 28px; padding: 32px clamp(24px, 4vw, 52px); border: 1px solid #a28de155; border-radius: 8px; background: radial-gradient(circle at 75% 50%, #6c4e9b88, transparent 45%), linear-gradient(110deg, #1a1d39, #0a1423 75%); }
.hero-heading__art { position: absolute; right: 0; top: 0; width: min(60%, 720px); height: 100%; object-fit: cover; object-position: center; opacity: .9; mask-image: linear-gradient(to right, transparent, #000 30%); }
.hero-heading__copy { position: relative; z-index: 1; max-width: 600px; }
.hero-heading h1 { margin: 9px 0 0; color: #f3f1ff; font: 700 clamp(42px, 5vw, 68px)/1.05 'Rajdhani', sans-serif; }
.hero-title { margin: 6px 0 0; color: #d3bfff; font: 700 20px 'Rajdhani', sans-serif; }
.hero-description { color: #d0d7e2; line-height: 1.6; }
.hero-role { display: inline-block; padding: 6px 10px; border: 1px solid #b5a0e966; border-radius: 4px; background: #111426dc; color: #e0d5ff; font: 700 14px 'Rajdhani', sans-serif; }
.hero-content { display: grid; gap: 16px; margin-top: 18px; }
.hero-panel { padding: 26px; border: 1px solid #a28de133; border-radius: 7px; background: #101b2b; color: #c8d2de; }
.hero-panel h2 { margin: 8px 0 20px; color: #f4f2ff; font: 700 28px 'Rajdhani', sans-serif; }
.hero-lore, .talents-intro { margin: 0; color: #becbd7; line-height: 1.65; }
.ability-grid, .talent-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 12px; }
.ability-card { display: flex; align-items: flex-start; gap: 14px; min-width: 0; padding: 16px; border: 1px solid #a28de133; border-radius: 6px; background: linear-gradient(140deg, #192a40, #0b1625); }
.ability-card img { width: 54px; height: 54px; flex: 0 0 54px; object-fit: contain; border: 1px solid #a28de166; border-radius: 5px; }
.ability-card h3 { margin: 0 0 8px; color: #f1efff; font: 700 20px 'Rajdhani', sans-serif; }
.ability-label { margin: 0 0 4px; color: #c5b2ff; font: 700 12px 'Rajdhani', sans-serif; text-transform: uppercase; }
.ability-description { margin: 0; color: #bdc9d5; line-height: 1.55; white-space: pre-line; }
.talent-levels { display: grid; gap: 10px; margin-top: 16px; }
.talent-levels details { overflow: hidden; border: 1px solid #a28de140; border-radius: 6px; background: #0b1727; }
.talent-levels summary { display: flex; justify-content: space-between; gap: 12px; padding: 14px 16px; color: #ede5ff; cursor: pointer; font: 700 18px 'Rajdhani', sans-serif; }
.talent-levels summary span { color: #b7a4df; font-size: 13px; }
.talent-grid { padding: 0 12px 12px; }
.hero-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 600px) { .hero-heading { min-height: 240px; padding: 22px; } .hero-heading__art { width: 70%; opacity: .45; } .hero-panel { padding: 18px; } }
</style>
