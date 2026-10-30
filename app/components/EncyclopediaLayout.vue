<template>
  <div class="encyclopedia-shell">
    <a class="skip-link" href="#encyclopedia-content">Aller au contenu</a>
    <header class="encyclopedia-header">
      <NuxtLink to="/" class="encyclopedia-brand">RiftVision</NuxtLink>
      <nav aria-label="Navigation League of Legends" class="encyclopedia-nav">
        <NuxtLink to="/league">League of Legends</NuxtLink>
        <NuxtLink to="/league/champions">Champions</NuxtLink>
        <NuxtLink to="/league/items">Objets</NuxtLink>
        <NuxtLink to="/league/runes">Runes</NuxtLink>
        <NuxtLink to="/league#league-of-legends">Suivre ma partie</NuxtLink>
      </nav>
      <EncyclopediaSearch />
    </header>
    <main id="encyclopedia-content" class="encyclopedia-main">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<style>
.encyclopedia-shell { min-height: 100vh; display: flex; flex-direction: column; }
.encyclopedia-header { display: flex; align-items: center; flex-wrap: wrap; gap: 16px 36px; min-height: 76px; padding: 14px 32px; background: #08111cf2; border-bottom: 1px solid var(--rv-border); }
.encyclopedia-brand { color: #e6d5ad; font: 700 20px 'Cinzel', Georgia, serif; text-decoration: none; }
.encyclopedia-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; }
.encyclopedia-nav a { color: #bfcbd5; font: 600 15px 'Rajdhani', sans-serif; text-decoration: none; }
.encyclopedia-nav a:hover, .encyclopedia-nav a.router-link-exact-active { color: #dfc58d; }
.encyclopedia-main { flex: 1; width: 100%; max-width: 1440px; margin: 0 auto; padding: 34px 32px 70px; }
.encyclopedia-back { color: #d7bd88; font: 600 14px 'Rajdhani', sans-serif; text-decoration: none; }
.encyclopedia-back:hover { text-decoration: underline; }
.encyclopedia-kicker { color: #c8aa6e; font: 700 11px 'Rajdhani', sans-serif; letter-spacing: .16em; text-transform: uppercase; }
.encyclopedia-notice { margin-top: 24px; padding: 24px; border: 1px solid #ffffff20; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.encyclopedia-notice p { margin: 0 0 14px; line-height: 1.5; }
@media (max-width: 600px) {
  .encyclopedia-header { padding: 14px 18px; }
  .encyclopedia-main { padding: 26px 18px 50px; }
  .encyclopedia-nav { gap: 8px 16px; }
}
</style>
