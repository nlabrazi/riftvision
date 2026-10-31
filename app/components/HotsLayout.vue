<template>
  <div class="hots-shell">
    <a class="skip-link" href="#hots-content">Aller au contenu</a>
    <header class="hots-header">
      <NuxtLink to="/" class="hots-brand">RiftVision</NuxtLink>
      <nav aria-label="Navigation Heroes of the Storm" class="hots-nav"><NuxtLink to="/">Tous les jeux</NuxtLink><NuxtLink to="/hots">Héros du Nexus</NuxtLink></nav>
      <EncyclopediaSearch />
    </header>
    <main id="hots-content" class="hots-main"><slot /></main>
    <AppFooter />
  </div>
</template>

<style>
.hots-shell { display: flex; flex-direction: column; min-height: 100vh; }
.hots-header { display: flex; align-items: center; flex-wrap: wrap; gap: 16px 36px; min-height: 76px; padding: 14px 32px; background: #0c1020f2; border-bottom: 1px solid #7d75bd35; }
.hots-brand { color: #e6d5ad; font: 700 20px 'Cinzel', Georgia, serif; text-decoration: none; }
.hots-nav { display: flex; flex-wrap: wrap; gap: 12px 24px; }
.hots-nav a { color: #bfcbd5; font: 600 15px 'Rajdhani', sans-serif; text-decoration: none; }
.hots-nav a:hover, .hots-nav a.router-link-exact-active { color: #b7a4ff; }
.hots-main { flex: 1; width: 100%; max-width: 1440px; margin: 0 auto; padding: 34px 32px 70px; }
.hots-back { color: #c3b5ff; font: 600 14px 'Rajdhani', sans-serif; text-decoration: none; }
.hots-back:hover { text-decoration: underline; }
.hots-kicker { color: #b7a4ff; font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .16em; text-transform: uppercase; }
.hots-notice { margin-top: 24px; padding: 24px; border: 1px solid #ffffff20; border-radius: 6px; background: #10192b; color: #c6d0d9; }
.hots-notice p { margin: 0 0 14px; line-height: 1.5; }
@media (max-width: 600px) { .hots-header { padding: 14px 18px; } .hots-main { padding: 26px 18px 50px; } }
</style>
