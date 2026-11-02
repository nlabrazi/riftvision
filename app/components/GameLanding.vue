<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { type GameLandingId, gameLandings } from '../utils/gameLanding'

const props = defineProps<{ game: GameLandingId }>()

const entry = computed(() => gameLandings[props.game])
const prefersReducedMotion = ref(true)
const previewFailed = ref(false)
let motionPreference: MediaQueryList | undefined

const { data: installer } = await useFetch<{ available: boolean }>('/api/download/availability', {
  immediate: props.game === 'league',
  default: () => ({ available: false }),
})

const hasLeagueCompanion = computed(() => entry.value.id === 'league')
const canDownloadCompanion = computed(
  () => hasLeagueCompanion.value && installer.value?.available === true,
)
const landingStyle = computed(() => ({
  '--landing-accent': entry.value.accent,
  '--landing-accent-soft': entry.value.accentSoft,
  '--landing-image': `url('${entry.value.image}')`,
  '--landing-image-position': entry.value.imagePosition,
}))

useHead(() => ({
  title: `${entry.value.name} — RiftVision`,
  meta: [{ name: 'description', content: entry.value.description }],
}))

function updateMotionPreference() {
  prefersReducedMotion.value = motionPreference?.matches ?? true
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotionPreference()
  motionPreference.addEventListener('change', updateMotionPreference)
})

onBeforeUnmount(() => motionPreference?.removeEventListener('change', updateMotionPreference))
</script>

<template>
  <div class="game-landing" :class="`game-landing--${entry.id}`" :style="landingStyle">
    <a class="skip-link" href="#game-choices">Aller aux choix</a>
    <header class="game-landing__header">
      <NuxtLink to="/" class="game-landing__brand">RiftVision</NuxtLink>
      <NuxtLink to="/" class="game-landing__all-games">← Tous les jeux</NuxtLink>
    </header>

    <main>
      <section class="game-landing__hero" :aria-labelledby="`game-title-${entry.id}`">
        <div class="game-landing__hero-art" aria-hidden="true" />
        <div class="game-landing__hero-content">
          <p class="game-landing__eyebrow">{{ entry.genre }} · RIFTVISION</p>
          <h1 :id="`game-title-${entry.id}`">{{ entry.name }}<span>.</span></h1>
          <p class="game-landing__tagline">{{ entry.tagline }}</p>
          <p class="game-landing__description">{{ entry.description }}</p>
        </div>
      </section>

      <section id="game-choices" class="game-landing__choices" aria-label="Choisissez votre expérience">
        <article class="game-choice game-choice--encyclopedia">
          <div class="game-choice__preview game-choice__preview--encyclopedia" aria-hidden="true">
            <img :src="entry.image" alt="" />
            <video
              v-if="!prefersReducedMotion && !previewFailed"
              :src="entry.video"
              muted
              autoplay
              loop
              playsinline
              preload="metadata"
              @error="previewFailed = true"
            />
            <div class="encyclopedia-preview">
              <div class="encyclopedia-preview__topbar">
                <span class="encyclopedia-preview__signal" />
                <span>RiftVision · Encyclopédie</span>
                <span>⌕</span>
              </div>
              <p>{{ entry.name }}</p>
              <div class="encyclopedia-preview__list">
                <span v-for="item in entry.encyclopediaPreview" :key="item">{{ item }}</span>
              </div>
            </div>
          </div>
          <div class="game-choice__body">
            <p class="game-choice__eyebrow"><RvIcon name="layers" :size="15" /> Avant la partie</p>
            <h2>Explorer l’encyclopédie</h2>
            <p>{{ entry.encyclopediaDescription }}</p>
            <NuxtLink :to="entry.encyclopediaHref" class="game-choice__action" data-testid="encyclopedia-action">
              {{ entry.encyclopediaLabel }} <RvIcon name="arrow-up-right" :size="14" />
            </NuxtLink>
          </div>
        </article>

        <article class="game-choice game-choice--companion" :class="{ 'game-choice--coming-soon': !hasLeagueCompanion }">
          <div class="game-choice__preview game-choice__preview--companion" aria-hidden="true">
            <div class="companion-preview">
              <div class="companion-preview__topbar">
                <span class="companion-preview__brand"><i>R</i> RiftVision</span>
                <span class="companion-preview__live">LIVE</span>
              </div>
              <div class="companion-preview__main">
                <div class="companion-preview__radar"><span /><i /><b /></div>
                <div class="companion-preview__data">
                  <span>Suivi de partie</span>
                  <strong>{{ hasLeagueCompanion ? '27:48' : 'À venir' }}</strong>
                  <div><i /><i /><i /></div>
                </div>
              </div>
              <div class="companion-preview__events">
                <span /><span /><span />
              </div>
            </div>
            <span v-if="!hasLeagueCompanion" class="game-choice__preview-lock">Bientôt disponible</span>
          </div>
          <div class="game-choice__body">
            <p class="game-choice__eyebrow"><RvIcon name="dashboard" :size="15" /> Pendant la partie</p>
            <h2>Le Compagnon RiftVision</h2>
            <p v-if="hasLeagueCompanion">Suivi en direct, alertes et récapitulatif de match sur votre second écran ou dans l’overlay en jeu.</p>
            <p v-else>Le compagnon regroupera vos outils RiftVision directement pendant vos parties. {{ entry.name }} arrive prochainement.</p>
            <a
              v-if="canDownloadCompanion"
              href="/api/download/overlay"
              download
              class="game-choice__action game-choice__action--companion"
              data-testid="companion-download-action"
            >
              Télécharger le compagnon <RvIcon name="download" :size="14" />
            </a>
            <NuxtLink
              v-else-if="hasLeagueCompanion"
              to="/league/compagnon"
              class="game-choice__action game-choice__action--companion"
              data-testid="companion-action"
            >
              Découvrir le compagnon <RvIcon name="arrow-up-right" :size="14" />
            </NuxtLink>
            <button
              v-else
              type="button"
              class="game-choice__action game-choice__action--disabled"
              disabled
              data-testid="companion-coming-soon"
            >
              Compagnon bientôt disponible <RvIcon name="lock" :size="13" />
            </button>
          </div>
        </article>
      </section>
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.game-landing { min-height: 100dvh; background: #060d15; color: #e8edf2; }
.game-landing__header { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 76px; padding: 14px max(32px, calc((100vw - 1536px) / 2)); border-bottom: 1px solid color-mix(in srgb, var(--landing-accent) 19%, transparent); background: #07101bf2; }
.game-landing__brand { color: #e8dcc0; font: 700 20px 'Cinzel', Georgia, serif; text-decoration: none; }
.game-landing__all-games { color: #bdc7d0; font: 700 14px 'Rajdhani', sans-serif; text-decoration: none; }
.game-landing__all-games:hover { color: var(--landing-accent); }
.game-landing__hero { position: relative; display: flex; align-items: end; min-height: clamp(300px, 38vw, 490px); overflow: hidden; isolation: isolate; border-bottom: 1px solid color-mix(in srgb, var(--landing-accent) 24%, transparent); background: #091522; }
.game-landing__hero-art { position: absolute; z-index: -1; inset: 0; background: var(--landing-image) var(--landing-image-position) / cover; filter: saturate(.9); }
.game-landing__hero-art::after { position: absolute; inset: 0; content: ''; background: linear-gradient(90deg, #07111df5 0%, #07111dd4 39%, #07111d38 74%, #07111d8c), linear-gradient(0deg, #060d15 0%, transparent 52%); }
.game-landing__hero-content { width: 100%; max-width: 1536px; margin: 0 auto; padding: clamp(38px, 6vw, 82px) max(32px, calc((100vw - 1536px) / 2)); }
.game-landing__eyebrow, .game-choice__eyebrow { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--landing-accent); font: 700 11px/1.4 'Rajdhani', sans-serif; letter-spacing: .17em; text-transform: uppercase; }
.game-landing h1 { max-width: 770px; margin: 12px 0 0; color: #f3f2ee; font: 700 clamp(42px, 6vw, 76px)/.98 'Rajdhani', sans-serif; letter-spacing: -.035em; }
.game-landing h1 span { color: var(--landing-accent); }
.game-landing__tagline { margin: 17px 0 0; color: #f0e5cf; font: 600 clamp(22px, 2.4vw, 32px)/1.15 'Rajdhani', sans-serif; }
.game-landing__description { max-width: 610px; margin: 13px 0 0; color: #c4ced6; font-size: 15px; line-height: 1.65; }
.game-landing__choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(16px, 2vw, 28px); width: 100%; max-width: 1280px; margin: clamp(-36px, -3vw, -24px) auto 72px; padding: 0 32px; position: relative; z-index: 1; }
.game-choice { min-width: 0; overflow: hidden; border: 1px solid color-mix(in srgb, var(--landing-accent) 26%, #ffffff18); border-radius: 8px; background: #0b1724; box-shadow: 0 22px 48px #02070d5c; }
.game-choice__preview { position: relative; aspect-ratio: 16 / 7.2; overflow: hidden; background: #0a1420; }
.game-choice__preview--encyclopedia > img, .game-choice__preview--encyclopedia > video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.game-choice__preview--encyclopedia > img { filter: saturate(.72) brightness(.6); }
.game-choice__preview--encyclopedia > video { filter: saturate(.78) brightness(.64); }
.game-choice__preview--encyclopedia::after { position: absolute; inset: 0; content: ''; background: linear-gradient(115deg, #07111dbb, transparent 62%), linear-gradient(0deg, #07111db8, transparent 70%); }
.encyclopedia-preview { position: absolute; z-index: 1; right: clamp(14px, 4vw, 34px); bottom: 0; left: clamp(14px, 4vw, 34px); padding: 13px 15px 15px; border: 1px solid #ffffff2b; border-bottom: 0; border-radius: 6px 6px 0 0; background: #07121be8; box-shadow: 0 10px 24px #0007; backdrop-filter: blur(7px); }
.encyclopedia-preview__topbar { display: flex; align-items: center; gap: 8px; color: #b9c4cd; font: 600 11px 'Rajdhani', sans-serif; letter-spacing: .08em; }
.encyclopedia-preview__topbar > :last-child { margin-left: auto; color: var(--landing-accent); font-size: 17px; }
.encyclopedia-preview__signal { width: 6px; height: 6px; border-radius: 50%; background: var(--landing-accent); box-shadow: 0 0 10px var(--landing-accent); }
.encyclopedia-preview > p { margin: 11px 0 7px; color: #f1f3f1; font: 700 20px 'Rajdhani', sans-serif; }
.encyclopedia-preview__list { display: flex; flex-wrap: wrap; gap: 6px; }
.encyclopedia-preview__list span { padding: 4px 7px; border: 1px solid color-mix(in srgb, var(--landing-accent) 45%, transparent); border-radius: 3px; color: #d6dde0; font: 600 11px 'Rajdhani', sans-serif; }
.game-choice__preview--companion { display: grid; place-items: center; background: radial-gradient(ellipse at 24% 25%, color-mix(in srgb, var(--landing-accent) 25%, transparent), transparent 50%), linear-gradient(125deg, #081723, #101d2c); }
.companion-preview { width: min(78%, 390px); padding: 12px; border: 1px solid #ffffff2b; border-radius: 7px; background: #08121be8; box-shadow: 0 16px 28px #0009; transform: perspective(800px) rotateX(5deg) rotateY(-8deg); }
.companion-preview__topbar, .companion-preview__main, .companion-preview__events { display: flex; align-items: center; }
.companion-preview__topbar { justify-content: space-between; color: #b7c4ce; font: 700 10px 'Rajdhani', sans-serif; letter-spacing: .08em; }
.companion-preview__brand { display: inline-flex; align-items: center; gap: 6px; }
.companion-preview__brand i { display: grid; width: 17px; height: 17px; place-items: center; border: 1px solid var(--landing-accent); color: var(--landing-accent); font: 700 12px 'Cinzel', serif; font-style: normal; }
.companion-preview__live { padding: 3px 5px; border: 1px solid #62d5ad75; border-radius: 2px; color: #84ddb9; }
.companion-preview__main { gap: 16px; margin: 12px 0; padding: 11px; border: 1px solid #ffffff15; border-radius: 4px; background: #102230; }
.companion-preview__radar { position: relative; width: 68px; height: 68px; overflow: hidden; border: 1px solid color-mix(in srgb, var(--landing-accent) 55%, transparent); border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--landing-accent) 15%, transparent) 2%, transparent 3% 30%, color-mix(in srgb, var(--landing-accent) 25%, transparent) 31% 32%, transparent 33% 60%, color-mix(in srgb, var(--landing-accent) 20%, transparent) 61% 62%, transparent 63%); }
.companion-preview__radar::after { position: absolute; inset: -50%; content: ''; background: conic-gradient(from 220deg, transparent 0 80%, color-mix(in srgb, var(--landing-accent) 55%, transparent) 88%, transparent 96%); animation: companion-scan 4s linear infinite; }
.companion-preview__radar span, .companion-preview__radar i, .companion-preview__radar b { position: absolute; z-index: 1; width: 5px; height: 5px; border-radius: 50%; background: #79d8ba; box-shadow: 0 0 8px #79d8ba; }
.companion-preview__radar span { top: 20%; left: 62%; }.companion-preview__radar i { right: 24%; bottom: 26%; background: #e88493; box-shadow: 0 0 8px #e88493; }.companion-preview__radar b { bottom: 20%; left: 27%; background: var(--landing-accent); box-shadow: 0 0 8px var(--landing-accent); }
.companion-preview__data { display: grid; gap: 4px; flex: 1; color: #9eafba; font: 600 10px 'Rajdhani', sans-serif; }.companion-preview__data strong { color: #f0f3f1; font: 700 26px/1 'Rajdhani', sans-serif; }.companion-preview__data div { display: flex; gap: 4px; }.companion-preview__data i { display: block; width: 21px; height: 3px; background: var(--landing-accent); }.companion-preview__data i:nth-child(2) { opacity: .58; }.companion-preview__data i:nth-child(3) { opacity: .24; }
.companion-preview__events { gap: 6px; }.companion-preview__events span { height: 5px; flex: 1; border-radius: 999px; background: linear-gradient(90deg, var(--landing-accent), color-mix(in srgb, var(--landing-accent) 10%, transparent)); }.companion-preview__events span:nth-child(2) { opacity: .62; }.companion-preview__events span:nth-child(3) { opacity: .34; }
.game-choice__preview-lock { position: absolute; z-index: 2; right: 14px; bottom: 14px; padding: 5px 8px; border: 1px solid #ffffff24; border-radius: 3px; background: #07111de3; color: #bec6cd; font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .06em; text-transform: uppercase; }
.game-choice__body { display: flex; flex-direction: column; min-height: 220px; padding: clamp(22px, 3vw, 32px); }.game-choice__body h2 { margin: 13px 0 8px; color: #f2f3f0; font: 700 clamp(27px, 2.7vw, 36px)/1 'Rajdhani', sans-serif; }.game-choice__body > p:last-of-type { max-width: 520px; margin: 0 0 20px; color: #b7c2ca; line-height: 1.58; }
.game-choice__action { display: inline-flex; align-items: center; justify-content: center; gap: 10px; align-self: flex-start; min-height: 42px; margin-top: auto; padding: 9px 14px; border: 1px solid var(--landing-accent); border-radius: 4px; background: color-mix(in srgb, var(--landing-accent) 15%, #08121c); color: #f3ead6; font: 700 14px 'Rajdhani', sans-serif; text-decoration: none; transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease; }.game-choice__action:hover, .game-choice__action:focus-visible { border-color: #f0d99f; background: color-mix(in srgb, var(--landing-accent) 27%, #08121c); transform: translateY(-2px); }.game-choice__action--companion { background: var(--landing-accent); color: #08121c; }.game-choice__action--companion:hover, .game-choice__action--companion:focus-visible { background: #f0d99f; color: #08121c; }.game-choice__action--disabled { border-color: #5a6570; background: #151d25; color: #7e8b96; cursor: not-allowed; opacity: 1; }.game-choice__action--disabled:hover { transform: none; border-color: #5a6570; background: #151d25; }
.game-choice--coming-soon { border-color: #ffffff18; }.game-choice--coming-soon .game-choice__preview--companion { filter: grayscale(.43); }.game-choice--coming-soon .companion-preview__live { border-color: #ffffff2e; color: #aeb8c0; }.game-choice--coming-soon .companion-preview__radar::after { animation: none; opacity: .35; }
@keyframes companion-scan { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: no-preference) { .game-choice { transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease; }.game-choice:hover { transform: translateY(-5px); border-color: color-mix(in srgb, var(--landing-accent) 65%, transparent); box-shadow: 0 26px 54px #02070d78; } }
@media (prefers-reduced-motion: reduce) { .companion-preview__radar::after { animation: none; } .game-choice__action { transition: none; } }
@media (max-width: 720px) { .game-landing__header { min-height: 66px; padding: 12px 18px; }.game-landing__hero-content { padding: 42px 20px 58px; }.game-landing__hero-art { background-position: 62% center; }.game-landing__choices { grid-template-columns: 1fr; margin-top: -23px; margin-bottom: 48px; padding: 0 14px; }.game-choice__body { min-height: 205px; }.game-choice__preview { aspect-ratio: 16 / 8.5; }.companion-preview { width: min(83%, 390px); } }
</style>
