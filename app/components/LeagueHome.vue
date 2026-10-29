<template>
  <div class="league-home">
    <nav class="league-breadcrumb" aria-label="Fil d’Ariane">
      <NuxtLink to="/">Tous les jeux</NuxtLink>
      <span aria-hidden="true">/</span>
      <span aria-current="page">League of Legends</span>
    </nav>

    <section class="league-hero" aria-labelledby="league-home-title">
      <div class="league-hero__content">
        <p class="league-kicker">RIFTVISION · LEAGUE OF LEGENDS</p>
        <h2 id="league-home-title">Bienvenue dans<br /><span>la Faille.</span></h2>
        <p>Votre espace League of Legends : suivez votre partie dès maintenant et retrouvez bientôt les champions, objets et patchs.</p>
        <a class="league-cta" href="#league-of-legends">Suivre ma partie <span aria-hidden="true">↘</span></a>
      </div>
    </section>

    <section class="league-explore" aria-labelledby="league-explore-title">
      <div class="league-explore__heading">
        <div>
          <p class="league-kicker">DANS VOTRE ESPACE LOL</p>
          <h2 id="league-explore-title">Explorer League of Legends<span>.</span></h2>
        </div>
        <p>De nouveaux contenus arrivent progressivement.</p>
      </div>
      <div class="league-sections">
        <article class="league-section">
          <span class="league-section__number" aria-hidden="true">01</span>
          <span class="league-section__status">À venir</span>
          <h3>Champions</h3>
          <p>Recherchez un champion et découvrez ses compétences.</p>
        </article>
        <article class="league-section">
          <span class="league-section__number" aria-hidden="true">02</span>
          <span class="league-section__status">À venir</span>
          <h3>Objets &amp; runes</h3>
          <p>Explorez les équipements et les runes de la Faille.</p>
        </article>
        <article class="league-section">
          <span class="league-section__number" aria-hidden="true">03</span>
          <span class="league-section__status">À venir</span>
          <h3>Notes de patch</h3>
          <p>Retrouvez les mises à jour et les changements du jeu.</p>
        </article>
      </div>
    </section>
    <div class="league-tracking-heading">
      <p class="league-kicker">VOTRE COMPAGNON DE PARTIE</p>
      <h2>Prêt à rejoindre la Faille<span> ?</span></h2>
      <p>Connectez votre partie ou explorez le tableau de bord en démo.</p>
    </div>
  </div>
</template>

<style scoped>
.league-home { margin-bottom: 24px; }
.league-breadcrumb { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 0 0 16px; color: #c4ced7; font: 600 13px 'Rajdhani', sans-serif; }
.league-breadcrumb a { color: #d8bd87; text-decoration: none; }
.league-breadcrumb a:hover { text-decoration: underline; }
.league-hero { display: flex; align-items: center; min-height: 370px; overflow: hidden; border: 1px solid #9e865134; border-radius: 8px; background: linear-gradient(90deg, #07111df7 5%, #07111de3 44%, #07111d52), url('/assets/images/league-ahri-splash.jpg') center 38% / cover; }
.league-hero__content { max-width: 640px; padding: clamp(28px, 5vw, 64px); }
.league-kicker { margin: 0 0 14px; color: #c8aa6e; font: 700 11px/1.4 'Rajdhani', sans-serif; letter-spacing: .17em; }
.league-hero h2 { margin: 0; color: #f1f1ee; font: 700 clamp(36px, 4vw, 60px)/1.04 'Rajdhani', sans-serif; }
.league-hero h2 span, .league-explore h2 span, .league-tracking-heading h2 span { color: #d6bb83; }
.league-hero__content > p:not(.league-kicker) { max-width: 440px; margin: 20px 0 24px; color: #c1cad4; font-size: 15px; line-height: 1.7; }
.league-cta { display: inline-flex; align-items: center; gap: 20px; min-height: 44px; padding: 11px 16px; border: 1px solid #c8aa6e; border-radius: 4px; background: #c8aa6e; color: #10151b; font-weight: 700; text-decoration: none; }
.league-cta:hover { background: #dfc38a; }
.league-explore, .league-tracking-heading { padding-top: 52px; }
.league-explore__heading { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.league-explore h2, .league-tracking-heading h2 { margin: 0; color: #f1f1ee; font: 700 clamp(28px, 3vw, 38px)/1.1 'Rajdhani', sans-serif; }
.league-explore__heading > p, .league-tracking-heading > p:last-child { margin: 10px 0 0; color: #aebbc8; line-height: 1.5; }
.league-sections { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.league-section { position: relative; min-height: 166px; padding: 20px; border: 1px solid #ffffff1a; border-radius: 6px; background: linear-gradient(145deg, #112132, #0a1521); }
.league-section__number { color: #8f9eaa; font: 700 12px 'Rajdhani', sans-serif; letter-spacing: .12em; }
.league-section__status { position: absolute; top: 18px; right: 18px; padding: 4px 8px; border: 1px solid #ffffff26; border-radius: 3px; color: #bdc8d0; font: 700 11px 'Rajdhani', sans-serif; }
.league-section h3 { margin: 20px 0 8px; color: #f0f2f2; font: 700 23px/1.15 'Rajdhani', sans-serif; }
.league-section p { margin: 0; color: #aebbc8; line-height: 1.55; }
@media (max-width: 700px) {
  .league-hero { min-height: 340px; background-position: center, 62% center; }
  .league-hero__content { padding: 30px 24px; }
  .league-sections { grid-template-columns: 1fr; }
  .league-explore, .league-tracking-heading { padding-top: 40px; }
}
</style>
