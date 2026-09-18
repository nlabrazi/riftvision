<template>
  <footer class="app-footer" role="contentinfo">
    <div class="footer-container">
      <div class="footer-row">
        <!-- Brand & Creator -->
        <div class="footer-identity">
          <div class="footer-brand">
            <span class="brand-title">RIFTVISION</span>
            <span class="brand-sub">SECOND SCREEN COMPANION</span>
          </div>
          <span class="footer-dot" aria-hidden="true">·</span>
          <div class="footer-creator">
            <span>Créé par</span>
            <a href="https://nabster.dev" target="_blank" rel="noopener noreferrer" class="creator-link"
              title="Portfolio : nabster.dev">
              Nabster
            </a>
          </div>
        </div>

        <!-- Social Icons (Font Awesome) -->
        <div class="social-links" role="navigation" aria-label="Liens et contact">
          <!-- Portfolio -->
          <a href="https://nabster.dev" target="_blank" rel="noopener noreferrer" class="social-link"
            title="Portfolio : nabster.dev" aria-label="Portfolio nabster.dev">
            <FontAwesomeIcon :icon="['fas', 'globe']" class="fa-icon" aria-hidden="true" />
          </a>

          <!-- GitHub Repo -->
          <a href="https://github.com/nlabrazi/riftvision" target="_blank" rel="noopener noreferrer" class="social-link"
            title="Dépôt GitHub (riftvision)" aria-label="Dépôt GitHub">
            <FontAwesomeIcon :icon="['fab', 'github']" class="fa-icon" aria-hidden="true" />
          </a>

          <!-- Twitter / X -->
          <a href="https://x.com/Nabil71405502" target="_blank" rel="noopener noreferrer" class="social-link"
            title="X (Twitter) : @Nabil71405502" aria-label="X @Nabil71405502">
            <FontAwesomeIcon :icon="['fab', 'x-twitter']" class="fa-icon" aria-hidden="true" />
          </a>

          <!-- Email / Contact -->
          <a href="mailto:na.labrazi@gmail.com" class="social-link" title="Contact : na.labrazi@gmail.com"
            aria-label="Contact Email">
            <FontAwesomeIcon :icon="['fas', 'envelope']" class="fa-icon" aria-hidden="true" />
          </a>
        </div>
      </div>

      <!-- Riot Games Disclaimer -->
      <div class="footer-legal">
        <p class="disclaimer-text">
          RiftVision isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone
          officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties
          are trademarks or registered trademarks of Riot Games, Inc.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  width: 100%;
  background: #040910;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 14px 28px 16px;
  color: #768492;
}

.footer-container {
  max-width: 1536px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

/* Identity / Brand */
.footer-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.brand-title {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.14em;
  color: #a28e67;
}

.brand-sub {
  font-family: 'Rajdhani', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #5d6d7e;
}

.footer-dot {
  color: #2a3744;
  font-size: 13px;
}

.footer-creator {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #637383;
}

.creator-link {
  color: #c8aa6e;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s ease;
}

.creator-link:hover {
  color: #f0e6d2;
  text-decoration: underline;
}

.creator-domain {
  color: #7d8d9d;
  font-weight: 400;
}

/* Social links (discreet icon-only buttons matching portfolio style) */
.social-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8c9bad;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.social-link:hover {
  background: rgba(200, 170, 110, 0.12);
  border-color: rgba(200, 170, 110, 0.4);
  color: #f0e6d2;
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(200, 170, 110, 0.2);
}

.fa-icon {
  width: 14px;
  height: 14px;
}

/* Legal Disclaimer */
.footer-legal {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 8px;
}

.disclaimer-text {
  font: 10px/1.5 'Segoe UI', sans-serif;
  color: #556473;
  margin: 0;
  max-width: 960px;
}

@media (max-width: 700px) {
  .app-footer {
    padding: 14px 18px 16px;
  }

  .footer-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
