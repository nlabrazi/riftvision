<template>
  <div class="tft-shell">
    <a class="skip-link" href="#tft-content">Aller au contenu</a>
    <header class="tft-header">
      <NuxtLink to="/" class="tft-brand">RiftVision</NuxtLink>
      <nav aria-label="Navigation Teamfight Tactics" class="tft-nav">
        <NuxtLink to="/">Tous les jeux</NuxtLink>
        <NuxtLink to="/tft/units">Unités</NuxtLink>
        <NuxtLink to="/tft/traits">Traits</NuxtLink>
        <NuxtLink to="/tft/items">Objets</NuxtLink>
        <NuxtLink to="/tft/patch-notes">Notes de patch</NuxtLink>
      </nav>
      <EncyclopediaSearch />
    </header>
    <main id="tft-content" class="tft-main"><slot /></main>
    <AppFooter />
  </div>
</template>

<style>
.tft-shell { display: flex; flex-direction: column; min-height: 100vh; }
.tft-header { display: flex; align-items: center; flex-wrap: wrap; gap: 16px 36px; min-height: 76px; padding: 14px 32px; background: #08111cf2; border-bottom: 1px solid var(--rv-border); }
.tft-brand { color: #e6d5ad; font: 700 20px 'Cinzel', Georgia, serif; text-decoration: none; }
.tft-nav { display: flex; flex-wrap: wrap; gap: 12px 24px; }
.tft-nav a { color: #bfcbd5; font: 600 15px 'Rajdhani', sans-serif; text-decoration: none; }
.tft-nav a:hover, .tft-nav a.router-link-exact-active { color: #dfc58d; }
.tft-main { flex: 1; width: 100%; max-width: 1440px; margin: 0 auto; padding: 34px 32px 70px; }
.tft-back { color: #d7bd88; font: 600 14px 'Rajdhani', sans-serif; text-decoration: none; }
.tft-back:hover { text-decoration: underline; }
.tft-kicker { color: #c8aa6e; font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .16em; text-transform: uppercase; }
.tft-notice { margin-top: 24px; padding: 24px; border: 1px solid #ffffff20; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.tft-notice p { margin: 0 0 14px; line-height: 1.5; }
.tft-current-badge { align-self: start; padding: 3px 6px; border: 1px solid #ba91e266; border-radius: 3px; background: #76539a33; color: #e3caff; font: 700 11px 'Rajdhani', sans-serif; }
@media (max-width: 600px) { .tft-header { padding: 14px 18px; } .tft-main { padding: 26px 18px 50px; } .tft-nav { gap: 8px 16px; } }
</style>
