<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const genres = ['Tous', 'MOBA', 'Stratégie', 'FPS', 'MMO'] as const
type Genre = (typeof genres)[number]
const selectedGenre = ref<Genre>('Tous')
const { data: installer } = await useFetch<{ available: boolean }>('/api/download/availability')
const heroVideo = ref<HTMLVideoElement | null>(null)
const videoEnabled = ref(false)
const videoFailed = ref(false)
const videoPlaying = ref(false)
let motionPreference: MediaQueryList | undefined

function syncMotionPreference() {
  videoEnabled.value = !motionPreference?.matches
  if (!videoEnabled.value) videoPlaying.value = false
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncMotionPreference()
  motionPreference.addEventListener('change', syncMotionPreference)
})

onBeforeUnmount(() => motionPreference?.removeEventListener('change', syncMotionPreference))

async function toggleHeroVideo() {
  const wasEnabled = videoEnabled.value
  if (!videoEnabled.value) {
    videoEnabled.value = true
    await nextTick()
  }
  const video = heroVideo.value
  if (!video) return
  if (wasEnabled && !video.paused) {
    video.pause()
    return
  }
  try {
    await video.play()
  } catch {
    videoPlaying.value = false
  }
}

function showGenre(genre: Genre) {
  return selectedGenre.value === 'Tous' || selectedGenre.value === genre
}
</script>

<template>
  <div class="game-portal">
    <section class="portal-hero" aria-labelledby="portal-title">
      <div class="portal-hero__content">
        <p class="portal-eyebrow">RIFTVISION · VOTRE COMPAGNON DE JEU</p>
        <h2 id="portal-title">Chaque partie<br /><span>mérite un autre regard.</span></h2>
        <p class="portal-hero__description">Explorez vos jeux, retrouvez leurs encyclopédies et découvrez les dernières mises à jour.</p>
        <div class="portal-hero__actions">
          <a class="portal-primary" href="#jeux">Découvrir les jeux <span aria-hidden="true">↘</span></a>
          <a v-if="installer?.available" class="portal-secondary" href="/api/download/overlay" download>Télécharger le compagnon LoL <span aria-hidden="true">↓</span></a>
          <NuxtLink v-else class="portal-secondary" to="/league#league-of-legends">Découvrir le compagnon LoL <span aria-hidden="true">→</span></NuxtLink>
        </div>
        <p class="portal-hero__note"><span aria-hidden="true" :class="{ 'portal-hero__dot--unavailable': !installer?.available }"></span><span>Overlay Windows pour League of Legends · nécessite RiftVision en local<template v-if="!installer?.available"> · téléchargement indisponible</template></span></p>
      </div>
      <div class="portal-hero__art" aria-hidden="true"><video v-if="videoEnabled && !videoFailed" ref="heroVideo" autoplay muted loop playsinline preload="metadata" @play="videoPlaying = true" @pause="videoPlaying = false" @error="videoFailed = true"><source src="/assets/videos/portal-hero.webm" type="video/webm; codecs=vp9" /><source src="/assets/videos/portal-hero.mp4" type="video/mp4" @error="videoFailed = true" /></video></div>
      <button v-if="!videoFailed" type="button" class="portal-hero__video-control" :aria-label="videoPlaying ? 'Mettre la vidéo en pause' : 'Lire la vidéo'" @click="toggleHeroVideo">{{ videoPlaying ? '❚❚' : '▶' }}</button>
      <span v-else class="portal-hero__video-error" role="status">Vidéo indisponible</span>
    </section>

    <section id="jeux" class="portal-section" aria-labelledby="games-title">
      <div class="portal-section__heading">
        <div>
          <p class="portal-eyebrow">EXPLOREZ VOS UNIVERS</p>
          <h2 id="games-title">Tous les jeux<span>.</span></h2>
          <p>Choisissez votre jeu et découvrez les outils qui lui sont dédiés.</p>
        </div>
      </div>

      <div class="game-filters" role="group" aria-label="Filtrer les jeux par genre">
        <button v-for="genre in genres" :key="genre" type="button" class="game-filter"
          :aria-pressed="selectedGenre === genre" @click="selectedGenre = genre">{{ genre }}</button>
      </div>
      <div class="game-grid">
        <NuxtLink v-if="showGenre('MOBA')" class="game-card game-card--league" to="/league">
          <div class="game-card__art" aria-hidden="true"><HoverPreview src="/assets/videos/league.mp4" /></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>MOBA</span><span class="game-card__status game-card__status--available">Disponible</span></div>
            <h3>League of Legends</h3>
            <p>Suivez votre partie et retrouvez votre tableau de bord tactique.</p>
            <span class="game-card__link">Accéder à League of Legends <span aria-hidden="true">↗</span></span>
          </div>
        </NuxtLink>
        <NuxtLink v-if="showGenre('Stratégie')" class="game-card game-card--tft" to="/tft">
          <div class="game-card__art" aria-hidden="true"><HoverPreview src="/assets/videos/tft.mp4" /></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>STRATÉGIE</span><span class="game-card__status game-card__status--available">Disponible</span></div>
            <h3>Teamfight Tactics</h3>
            <p>Explorez les unités disponibles dans le catalogue TFT.</p>
            <span class="game-card__link">Accéder au catalogue <span aria-hidden="true">↗</span></span>
          </div>
        </NuxtLink>
        <NuxtLink v-if="showGenre('FPS')" class="game-card game-card--valorant" to="/valorant">
          <div class="game-card__art" aria-hidden="true"><HoverPreview src="/assets/videos/valorant.mp4" /></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>FPS TACTIQUE</span><span class="game-card__status game-card__status--available">Disponible</span></div>
            <h3>Valorant</h3>
            <p>Découvrez les agents, leurs rôles et leurs compétences.</p>
            <span class="game-card__link">Accéder aux agents <span aria-hidden="true">↗</span></span>
          </div>
        </NuxtLink>
        <article v-if="showGenre('FPS')" class="game-card game-card--cs2">
          <div class="game-card__art" aria-hidden="true"><HoverPreview src="/assets/videos/cs2.mp4" /></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>FPS TACTIQUE</span><span class="game-card__status">À venir</span></div>
            <h3>Counter-Strike 2</h3>
            <p>Un futur espace dédié aux cartes, armes et parties.</p>
            <span class="game-card__link">En préparation</span>
          </div>
        </article>
        <NuxtLink v-if="showGenre('MOBA')" class="game-card game-card--hots" to="/hots">
          <div class="game-card__art" aria-hidden="true"><HoverPreview src="/assets/videos/hots.mp4" /></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>MOBA</span><span class="game-card__status game-card__status--available">Disponible</span></div>
            <h3>Heroes of the Storm</h3>
            <p>Découvrez les héros, leurs compétences et leurs talents.</p>
            <span class="game-card__link">Explorer le Nexus <span aria-hidden="true">↗</span></span>
          </div>
        </NuxtLink>
        <NuxtLink v-if="showGenre('MMO')" class="game-card game-card--wow" to="/wow">
          <div class="game-card__art" aria-hidden="true"><HoverPreview src="/assets/videos/wow.mp4" /></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>MMORPG</span><span class="game-card__status game-card__status--available">Retail</span></div>
            <h3>World of Warcraft</h3>
            <p>Découvrez les classes et spécialisations de World of Warcraft Retail.</p>
            <span class="game-card__link">Accéder aux classes <span aria-hidden="true">↗</span></span>
          </div>
        </NuxtLink>
        <article v-if="selectedGenre === 'Tous'" class="game-card game-card--future">
          <div class="game-card__art" aria-hidden="true"></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>À DÉCOUVRIR</span><span class="game-card__status">À venir</span></div>
            <h3>Et la suite ?</h3>
            <p>D’autres jeux pourront rejoindre RiftVision à l’avenir.</p>
            <span class="game-card__link">Prochains univers</span>
          </div>
        </article>
      </div>
    </section>
    <div class="portal-next-heading">
      <p class="portal-eyebrow">PRÊT À JOUER ?</p>
      <h2>Votre partie commence ici<span>.</span></h2>
      <p>Connectez League of Legends ou découvrez le tableau de bord en démo.</p>
    </div>
  </div>
</template>

<style scoped>
.game-portal { margin-bottom: 24px; }
.portal-hero { position: relative; display: flex; align-items: center; min-height: 450px; overflow: hidden; isolation: isolate; border: 1px solid #9e865134; border-radius: 8px; background: radial-gradient(ellipse at 78% 40%, #273451, transparent 55%), #07111d; }
.portal-hero__content { position: relative; z-index: 1; max-width: 690px; padding: clamp(28px, 5vw, 74px); }
.portal-hero__art { position: absolute; inset: 0; overflow: hidden; background: url('/assets/images/league-ahri-splash.jpg') center / cover; }
.portal-hero__art video { width: 100%; height: 100%; object-fit: cover; object-position: center; }
.portal-hero__art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #07111df7 0%, #07111dd9 32%, #07111d55 68%, #07111d33), linear-gradient(0deg, #07111d99, transparent 55%); }
.portal-hero__video-control { position: absolute; z-index: 2; right: 18px; bottom: 18px; display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid #ffffff70; border-radius: 50%; background: #07111dbb; color: #fff; font-size: 12px; cursor: pointer; }
.portal-hero__video-control:hover, .portal-hero__video-control:focus-visible { border-color: #e6ca91; background: #101d2c; }
.portal-hero__video-error { position: absolute; z-index: 2; right: 18px; bottom: 18px; padding: 6px 10px; border-radius: 4px; background: #07111dcc; color: #e4e8ed; font-size: 12px; }
.portal-eyebrow { margin: 0 0 15px; color: #c8aa6e; font: 700 11px/1.4 'Rajdhani', sans-serif; letter-spacing: .18em; }
.portal-hero h2, .portal-section h2, .portal-next-heading h2 { margin: 0; color: #f1f1ee; font: 700 clamp(36px, 4vw, 62px)/1.04 'Rajdhani', sans-serif; letter-spacing: -.025em; }
.portal-hero h2 span, .portal-section h2 span, .portal-next-heading h2 span { color: #d6bb83; }
.portal-hero__description { max-width: 430px; margin: 20px 0 26px; color: #c1cad4; font-size: 15px; line-height: 1.7; }
.portal-hero__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.portal-primary, .portal-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 20px; min-height: 44px; padding: 11px 16px; border: 1px solid #c8aa6e; border-radius: 4px; font-weight: 700; text-decoration: none; }
.portal-primary { background: #c8aa6e; color: #10151b; }
.portal-secondary { background: #09131dd9; color: #e5dfd2; border-color: #ffffff42; }
.portal-primary:hover { background: #dfc38a; }
.portal-secondary:hover { border-color: #c8aa6e; }
.portal-hero__note { display: flex; align-items: center; gap: 8px; margin: 20px 0 0; color: #a7b3bb; font-size: 12px; }
.portal-hero__note > span:first-child { flex: 0 0 6px; width: 6px; height: 6px; background: #66d5ad; border-radius: 50%; }
.portal-hero__note > .portal-hero__dot--unavailable { background: #b6a178; }
.portal-section { padding-top: 65px; scroll-margin-top: 20px; }
.portal-section__heading { display: flex; justify-content: space-between; align-items: end; gap: 20px; margin-bottom: 24px; }
.portal-section h2, .portal-next-heading h2 { font-size: clamp(28px, 3vw, 38px); }
.portal-section__heading p:not(.portal-eyebrow), .portal-next-heading > p:last-child { margin: 10px 0 0; color: #aebbc8; line-height: 1.5; }
.game-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
.game-filter { padding: 8px 16px; border: 1px solid #ffffff2a; border-radius: 999px; background: #ffffff08; color: #bfc9d0; font: 700 14px 'Rajdhani', sans-serif; }
.game-filter:hover { color: #f0e6d2; border-color: #c8aa6e88; }
.game-filter[aria-pressed="true"] { background: #c8aa6e22; border-color: #c8aa6e; color: #ecd6a7; }
.game-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 250px)); gap: 16px; }
.game-card { --card-accent: #c8aa6e; position: relative; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid #ffffff1a; border-radius: 7px; background: #0c1824; color: inherit; text-decoration: none; }
.game-card__art { position: relative; aspect-ratio: 3 / 4; overflow: hidden; isolation: isolate; background: #09111c; }
.game-card__art::before { content: ''; position: absolute; z-index: -2; inset: 0; background: var(--card-image) var(--image-position, center) / cover; }
.game-card__art::after { content: ''; position: absolute; z-index: -1; inset: 0; background: linear-gradient(0deg, #07111de0, #07111d05 52%), linear-gradient(120deg, transparent 20%, color-mix(in srgb, var(--card-accent) 18%, transparent) 50%, transparent 80%); opacity: .5; }
.game-card--league { --card-image: url('/assets/images/league-ahri-splash.jpg'); --image-position: 53% center; }
.game-card--tft { --card-accent: #b48dff; }
.game-card--tft { --card-image: url('/assets/images/game-tft.webp'); }
.game-card--valorant { --card-accent: #ed727c; --card-image: url('/assets/images/game-valorant.webp'); }
.game-card--cs2 { --card-accent: #e09b4e; --card-image: url('/assets/images/game-cs2.webp'); }
.game-card--hots { --card-accent: #8c9dff; --card-image: url('/assets/images/game-hots.webp'); --image-position: 73% center; }
.game-card--wow { --card-accent: #d8a450; --card-image: url('/assets/images/game-wow.webp'); --image-position: 66% center; }
.game-card--future { --card-accent: #6a8b9f; --card-image: radial-gradient(ellipse at center, #294152, #101c29 55%, #09121d); border-style: dashed; }
.game-card--future .game-card__art::after { inset: 22%; border: 1px solid #99b1bf66; transform: rotate(45deg); background: transparent; }
.game-card__body { display: flex; flex: 1; flex-direction: column; padding: 18px 20px 20px; border-top: 2px solid color-mix(in srgb, var(--card-accent) 50%, transparent); }
.game-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #a5b1bc; font: 700 10px 'Rajdhani', sans-serif; letter-spacing: .1em; }
.game-card__status { padding: 4px 8px; border: 1px solid #ffffff22; border-radius: 3px; color: #b5c0c8; letter-spacing: .03em; }
.game-card__status--available { border-color: #66d5ad50; color: #8bdebd; }
.game-card h3 { margin: 16px 0 8px; color: #f0f2f2; font: 700 23px/1.15 'Rajdhani', sans-serif; }
.game-card__body p { margin: 0 0 22px; color: #aebbc8; line-height: 1.55; }
.game-card__link { margin-top: auto; color: #b7c1c9; font: 700 12px 'Rajdhani', sans-serif; }
.game-card--league .game-card__link { display: flex; justify-content: space-between; color: #dfc58d; }
a.game-card:hover, a.game-card:focus-visible { border-color: #c8aa6e; }
@media (prefers-reduced-motion: no-preference) {
  .game-card, .game-card__art::before, .game-card__art::after, .game-card__body, .game-card__link span { transition: transform 400ms ease, opacity 350ms ease, border-color 250ms ease, box-shadow 350ms ease, background-color 350ms ease; }
  .game-card:hover .game-card__art::before, .game-card:focus-visible .game-card__art::before { transform: scale(1.08); }
  .game-card:hover, .game-card:focus-visible { transform: translateY(-4px); border-color: color-mix(in srgb, var(--card-accent) 70%, transparent); box-shadow: 0 16px 34px #0008, 0 0 22px color-mix(in srgb, var(--card-accent) 15%, transparent); }
  .game-card:hover .game-card__art::after, .game-card:focus-visible .game-card__art::after { opacity: 1; }
  .game-card:hover .game-card__body, .game-card:focus-visible .game-card__body { border-color: var(--card-accent); background-color: color-mix(in srgb, var(--card-accent) 7%, #0c1824); }
  .game-card--league:hover .game-card__link span, .game-card--league:focus-visible .game-card__link span { transform: translate(3px, -3px); }
}
.portal-next-heading { padding-top: 65px; }
.portal-next-heading .portal-eyebrow { margin-bottom: 12px; }
@media (max-width: 600px) {
  .portal-hero { min-height: 490px; }
  .portal-hero__content { padding: 30px 24px 68px; }
  .portal-hero__art::after { background: linear-gradient(90deg, #07111dd9, #07111d99), linear-gradient(0deg, #07111d99, transparent); }
  .portal-section, .portal-next-heading { padding-top: 46px; }
  .game-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .game-card__body { padding: 14px 12px 16px; }
  .game-card__meta { flex-wrap: wrap; }
  .game-card h3 { font-size: 20px; }
}
</style>
