<template>
  <div class="val-shell">
    <a class="skip-link" href="#val-content">Aller au contenu</a>
    <header class="val-header">
      <NuxtLink to="/" class="val-brand">RiftVision</NuxtLink>
      <nav aria-label="Navigation Valorant" class="val-nav"><NuxtLink to="/">Tous les jeux</NuxtLink><NuxtLink to="/valorant">Agents Valorant</NuxtLink></nav>
    </header>
    <main id="val-content" class="val-main"><slot /></main>
    <AppFooter />
  </div>
</template>

<style>
.val-shell { display: flex; flex-direction: column; min-height: 100vh; }
.val-header { display: flex; align-items: center; flex-wrap: wrap; gap: 16px 36px; min-height: 76px; padding: 14px 32px; background: #08111cf2; border-bottom: 1px solid var(--rv-border); }
.val-brand { color: #e6d5ad; font: 700 20px 'Cinzel', Georgia, serif; text-decoration: none; }
.val-nav { display: flex; flex-wrap: wrap; gap: 12px 24px; }
.val-nav a { color: #bfcbd5; font: 600 15px 'Rajdhani', sans-serif; text-decoration: none; }
.val-nav a:hover, .val-nav a.router-link-exact-active { color: #ff8b91; }
.val-main { flex: 1; width: 100%; max-width: 1440px; margin: 0 auto; padding: 34px 32px 70px; }
.val-back { color: #f2a0a4; font: 600 14px 'Rajdhani', sans-serif; text-decoration: none; }
.val-back:hover { text-decoration: underline; }
.val-kicker { color: #fa8c94; font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .16em; text-transform: uppercase; }
.val-notice { margin-top: 24px; padding: 24px; border: 1px solid #ffffff20; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.val-notice p { margin: 0 0 14px; line-height: 1.5; }
@media (max-width: 600px) { .val-header { padding: 14px 18px; } .val-main { padding: 26px 18px 50px; } }
</style>
