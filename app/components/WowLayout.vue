<template>
  <div class="wow-shell">
    <a class="skip-link" href="#wow-content">Aller au contenu</a>
    <header class="wow-header">
      <NuxtLink to="/" class="wow-brand">RiftVision</NuxtLink>
      <nav aria-label="Navigation World of Warcraft" class="wow-nav"><NuxtLink to="/">Tous les jeux</NuxtLink><NuxtLink to="/wow">Classes WoW</NuxtLink></nav>
    </header>
    <main id="wow-content" class="wow-main"><slot /></main>
    <AppFooter />
  </div>
</template>

<style>
.wow-shell { display: flex; flex-direction: column; min-height: 100vh; }
.wow-header { display: flex; align-items: center; flex-wrap: wrap; gap: 16px 36px; min-height: 76px; padding: 14px 32px; background: #08111cf2; border-bottom: 1px solid var(--rv-border); }
.wow-brand { color: #e6d5ad; font: 700 20px 'Cinzel', Georgia, serif; text-decoration: none; }
.wow-nav { display: flex; flex-wrap: wrap; gap: 12px 24px; }
.wow-nav a { color: #bfcbd5; font: 600 15px 'Rajdhani', sans-serif; text-decoration: none; }
.wow-nav a:hover, .wow-nav a.router-link-exact-active { color: #dfc58d; }
.wow-main { flex: 1; width: 100%; max-width: 1440px; margin: 0 auto; padding: 34px 32px 70px; }
.wow-back { color: #d7bd88; font: 600 14px 'Rajdhani', sans-serif; text-decoration: none; }
.wow-back:hover { text-decoration: underline; }
.wow-kicker { color: #c8aa6e; font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .16em; text-transform: uppercase; }
.wow-notice { margin-top: 24px; padding: 24px; border: 1px solid #ffffff20; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.wow-notice p { margin: 0 0 14px; line-height: 1.5; }
@media (max-width: 600px) { .wow-header { padding: 14px 18px; } .wow-main { padding: 26px 18px 50px; } }
</style>
