<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PatchNoteLink } from '#shared/types/patchNotes'

const props = defineProps<{
  article: PatchNoteLink
  featured?: boolean
  variant?: 'league' | 'tft' | 'valorant' | 'wow'
}>()
const imageFailed = ref(false)
watch(
  () => props.article.imageUrl,
  () => {
    imageFailed.value = false
  },
)
const formattedDate = computed(() =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(
    new Date(props.article.publishedAt),
  ),
)
</script>

<template>
  <article class="patch-card" :class="[`patch-card--${variant ?? 'league'}`, { 'patch-card--featured': featured }]">
    <div class="patch-card__media">
      <img v-if="article.imageUrl && !imageFailed" :src="article.imageUrl" alt="" :loading="featured ? 'eager' : 'lazy'" decoding="async" @error="imageFailed = true" />
      <span v-else class="patch-card__placeholder">Visuel indisponible</span>
      <span v-if="featured" class="patch-card__badge">Dernier patch publié</span>
    </div>
    <div class="patch-card__content">
      <time class="patch-card__date" :datetime="article.publishedAt">{{ formattedDate }}</time>
      <h2>{{ article.title }}</h2>
      <p v-if="article.description" class="patch-card__description">{{ article.description }}</p>
      <a :href="article.url" target="_blank" rel="noopener noreferrer">Lire les notes officielles <span aria-hidden="true">↗</span><span class="sr-only"> pour {{ article.title }} (nouvel onglet)</span></a>
    </div>
  </article>
</template>

<style scoped>
.patch-card { --patch-accent: #dfc58d; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid #ffffff20; border-radius: 8px; background: linear-gradient(150deg, #142637, #0a1521); box-shadow: 0 12px 30px #00000020; transition: transform .2s, border-color .2s; }
.patch-card--valorant { --patch-accent: #f3a0a5; }
.patch-card:hover, .patch-card:focus-within { border-color: var(--patch-accent); transform: translateY(-3px); }
.patch-card__media { position: relative; overflow: hidden; aspect-ratio: 16 / 9; background: radial-gradient(circle at 70% 35%, #637b8055, transparent 55%), linear-gradient(135deg, #26394a, #0c1927); }
.patch-card__media img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
.patch-card:hover .patch-card__media img { transform: scale(1.035); }
.patch-card__placeholder { position: absolute; inset: 0; display: grid; place-items: center; color: #aab9c4; font: 600 14px 'Rajdhani', sans-serif; }
.patch-card__badge { position: absolute; top: 14px; left: 14px; padding: 6px 10px; border: 1px solid #e4cc9a80; border-radius: 4px; background: #07121fe8; color: #f0d9a5; font: 700 12px 'Rajdhani', sans-serif; letter-spacing: .04em; }
.patch-card__content { display: flex; flex: 1; flex-direction: column; align-items: flex-start; padding: 22px 24px 24px; }
.patch-card__date { color: var(--patch-accent); font: 700 13px 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: .06em; }
.patch-card h2 { margin: 10px 0 0; color: #f3f3ef; font: 700 25px/1.16 'Rajdhani', sans-serif; }
.patch-card__description { display: -webkit-box; overflow: hidden; margin: 12px 0 0; color: #c2cdd5; font: 14px/1.55 'Segoe UI', sans-serif; -webkit-line-clamp: 4; -webkit-box-orient: vertical; }
.patch-card a { display: inline-flex; align-items: center; gap: 7px; margin-top: auto; padding-top: 20px; color: var(--patch-accent); font: 700 15px 'Rajdhani', sans-serif; text-decoration: none; }
.patch-card a:hover { text-decoration: underline; }
.patch-card a:focus-visible { outline: 2px solid var(--patch-accent); outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) { .patch-card, .patch-card__media img { transition: none; } .patch-card:hover, .patch-card:focus-within, .patch-card:hover .patch-card__media img { transform: none; } }
</style>
