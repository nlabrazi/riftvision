<script setup lang="ts">
defineProps<{
  game: 'league' | 'tft' | 'valorant' | 'wow' | 'hots'
  eyebrow: string
  title: string
  description: string
  badge?: string
}>()
</script>

<template>
  <header class="catalog-banner" :class="`catalog-banner--${game}`">
    <div class="catalog-banner__content">
      <p class="catalog-banner__eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}<span>.</span></h1>
      <p class="catalog-banner__description">{{ description }}</p>
    </div>
    <span v-if="badge" class="catalog-banner__badge">{{ badge }}</span>
    <slot />
  </header>
</template>

<style scoped>
.catalog-banner { --banner-accent: #d6bb83; display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 20px; min-height: 170px; margin: 30px 0 24px; padding: 32px; overflow: hidden; border: 1px solid var(--banner-border); border-radius: 8px; background: var(--banner-overlay), var(--banner-image) var(--banner-position, center) / cover; }
.catalog-banner--league { --banner-accent: #e4c27e; --banner-border: #c8aa6e55; --banner-overlay: linear-gradient(90deg, #0b1521f7, #101a27e3 42%, #101a2766); --banner-image: url('/assets/images/league-ahri-splash.jpg'); --banner-position: center 25%; }
.catalog-banner--tft { --banner-accent: #d1b1ff; --banner-border: #aa8ce155; --banner-overlay: linear-gradient(90deg, #12152af5, #17142be0 42%, #17142b6b); --banner-image: url('/assets/images/game-tft-banner.webp'); --banner-position: center 12%; }
.catalog-banner--valorant { --banner-accent: #fa8c94; --banner-border: #ed727c55; --banner-overlay: linear-gradient(90deg, #101522f7, #141725e3 42%, #151a2b66); --banner-image: url('/assets/images/game-valorant.webp'); --banner-position: center 10%; }
.catalog-banner--wow { --banner-accent: #e4c27e; --banner-border: #c8aa6e55; --banner-overlay: linear-gradient(90deg, #111824f5, #101624e0 42%, #15152366); --banner-image: url('/assets/images/game-wow.webp'); --banner-position: center 10%; }
.catalog-banner--hots { --banner-accent: #b6a0ff; --banner-border: #9075db55; --banner-overlay: linear-gradient(90deg, #101629f2, #101629ac); --banner-image: url('/assets/images/game-hots.webp'); --banner-position: center 43%; }
.catalog-banner__content { min-width: 0; max-width: 720px; }
.catalog-banner__eyebrow { margin: 0; color: var(--banner-accent); font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .16em; text-transform: uppercase; }
.catalog-banner h1 { margin: 9px 0; color: #f3f1ff; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.catalog-banner h1 span { color: var(--banner-accent); }
.catalog-banner__description { margin: 0; color: #d1d7df; line-height: 1.5; }
.catalog-banner__badge { padding: 7px 10px; border: 1px solid var(--banner-border); border-radius: 4px; background: #0b1321dd; color: #e8dece; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 600px) { .catalog-banner { min-height: 0; padding: 22px; } }
</style>
