<template>
  <div class="game-portal">
    <section class="portal-hero" aria-labelledby="portal-title">
      <div class="portal-hero__content">
        <p class="portal-eyebrow">RIFTVISION · VOTRE COMPAGNON DE JEU</p>
        <h2 id="portal-title">Chaque partie<br /><span>mérite un autre regard.</span></h2>
        <p class="portal-hero__description">Retrouvez vos univers de jeu, explorez leurs contenus et gardez un œil sur votre partie.</p>
        <div class="portal-hero__actions">
          <a class="portal-primary" href="#jeux">Découvrir les jeux <span aria-hidden="true">↘</span></a>
          <a class="portal-secondary" href="#league-of-legends">Suivre ma partie LoL <span aria-hidden="true">→</span></a>
        </div>
        <p class="portal-hero__note"><span aria-hidden="true"></span> Suivi League of Legends disponible</p>
      </div>
    </section>

    <section id="jeux" class="portal-section" aria-labelledby="competitive-title">
      <div class="portal-section__heading">
        <div>
          <p class="portal-eyebrow">EXPLOREZ VOS UNIVERS</p>
          <h2 id="competitive-title">Jeux compétitifs<span>.</span></h2>
          <p>Choisissez votre jeu et découvrez les outils qui lui sont dédiés.</p>
        </div>
        <span class="portal-section__index" aria-hidden="true">01 / 02</span>
      </div>

      <div class="game-grid">
        <a class="game-card game-card--league" href="#league-of-legends">
          <div class="game-card__art" aria-hidden="true"></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>MOBA</span><span class="game-card__status game-card__status--available">Disponible</span></div>
            <h3>League of Legends</h3>
            <p>Suivez votre partie et retrouvez votre tableau de bord tactique.</p>
            <span class="game-card__link">Accéder à League of Legends <span aria-hidden="true">↗</span></span>
          </div>
        </a>
        <article class="game-card game-card--tft">
          <div class="game-card__art" aria-hidden="true"><span>TFT</span></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>STRATÉGIE</span><span class="game-card__status">À venir</span></div>
            <h3>Teamfight Tactics</h3>
            <p>Un espace dédié aux sets, unités et compositions est prévu.</p>
            <span class="game-card__link">En préparation</span>
          </div>
        </article>
        <article class="game-card game-card--valorant">
          <div class="game-card__art" aria-hidden="true"><span>V</span></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>FPS TACTIQUE</span><span class="game-card__status">À venir</span></div>
            <h3>Valorant</h3>
            <p>Un espace dédié aux agents, aux armes et aux cartes est prévu.</p>
            <span class="game-card__link">En préparation</span>
          </div>
        </article>
      </div>
    </section>

    <section class="portal-section" aria-labelledby="worlds-title">
      <div class="portal-section__heading">
        <div>
          <p class="portal-eyebrow">AU-DELÀ DE LA COMPÉTITION</p>
          <h2 id="worlds-title">D’autres univers<span>.</span></h2>
          <p>De nouvelles aventures à explorer, au fil de l’évolution de RiftVision.</p>
        </div>
        <span class="portal-section__index" aria-hidden="true">02 / 02</span>
      </div>
      <div class="game-grid">
        <article class="game-card game-card--wow">
          <div class="game-card__art" aria-hidden="true"><span>W</span></div>
          <div class="game-card__body">
            <div class="game-card__meta"><span>MMORPG</span><span class="game-card__status">À venir</span></div>
            <h3>World of Warcraft</h3>
            <p>Un futur espace pour explorer les richesses d’Azeroth.</p>
            <span class="game-card__link">En préparation</span>
          </div>
        </article>
        <article class="game-card game-card--future">
          <div class="game-card__art" aria-hidden="true"><span>+</span></div>
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
.portal-hero { position: relative; display: flex; align-items: center; min-height: 450px; overflow: hidden; border: 1px solid #9e865134; border-radius: 8px; background: linear-gradient(90deg, #07111df5 4%, #07111de8 36%, #07111d66 75%, #07111d3d), url('/screenshot.png') center 45% / cover; }
.portal-hero__content { position: relative; max-width: 690px; padding: clamp(28px, 5vw, 74px); }
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
.portal-hero__note span { width: 6px; height: 6px; background: #66d5ad; border-radius: 50%; }
.portal-section { padding-top: 65px; scroll-margin-top: 20px; }
.portal-section__heading { display: flex; justify-content: space-between; align-items: end; gap: 20px; margin-bottom: 24px; }
.portal-section h2, .portal-next-heading h2 { font-size: clamp(28px, 3vw, 38px); }
.portal-section__heading p:not(.portal-eyebrow), .portal-next-heading > p:last-child { margin: 10px 0 0; color: #aebbc8; line-height: 1.5; }
.portal-section__index { color: #7d8991; font: 600 12px 'Rajdhani', sans-serif; letter-spacing: .12em; }
.game-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.game-card { --card-accent: #c8aa6e; position: relative; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid #ffffff1a; border-radius: 7px; background: #0c1824; color: inherit; text-decoration: none; }
.game-card__art { display: grid; place-items: center; height: 165px; overflow: hidden; background: radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--card-accent) 27%, #101a28), #09111c 70%); }
.game-card__art span { color: color-mix(in srgb, var(--card-accent) 65%, white); opacity: .28; font: 700 96px/1 'Cinzel', Georgia, serif; letter-spacing: -.08em; }
.game-card--league .game-card__art { background: linear-gradient(0deg, #0c1824 0%, transparent 70%), url('/assets/images/sr-map.png') center 43% / cover; }
.game-card--tft { --card-accent: #b48dff; }
.game-card--valorant { --card-accent: #ed727c; }
.game-card--wow { --card-accent: #d8a450; }
.game-card--future { --card-accent: #6a8b9f; border-style: dashed; }
.game-card__body { display: flex; flex: 1; flex-direction: column; padding: 20px 22px 22px; }
.game-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #a5b1bc; font: 700 10px 'Rajdhani', sans-serif; letter-spacing: .1em; }
.game-card__status { padding: 4px 8px; border: 1px solid #ffffff22; border-radius: 3px; color: #b5c0c8; letter-spacing: .03em; }
.game-card__status--available { border-color: #66d5ad50; color: #8bdebd; }
.game-card h3 { margin: 16px 0 8px; color: #f0f2f2; font: 700 23px/1.15 'Rajdhani', sans-serif; }
.game-card__body p { margin: 0 0 22px; color: #aebbc8; line-height: 1.55; }
.game-card__link { margin-top: auto; color: #b7c1c9; font: 700 12px 'Rajdhani', sans-serif; }
.game-card--league .game-card__link { display: flex; justify-content: space-between; color: #dfc58d; }
a.game-card:hover, a.game-card:focus-visible { border-color: #c8aa6e; }
.portal-next-heading { padding-top: 65px; }
.portal-next-heading .portal-eyebrow { margin-bottom: 12px; }
@media (max-width: 900px) { .game-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .portal-hero { min-height: 420px; background-position: center, 62% center; }
  .portal-hero__content { padding: 30px 24px; }
  .portal-section, .portal-next-heading { padding-top: 46px; }
  .game-grid { grid-template-columns: 1fr; }
  .portal-section__index { display: none; }
}
</style>
