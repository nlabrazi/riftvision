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

        <!-- Social Icons (FontAwesome style matching portfolio) -->
        <div class="social-links" role="navigation" aria-label="Liens et contact">
          <!-- Portfolio -->
          <a href="https://nabster.dev" target="_blank" rel="noopener noreferrer" class="social-link"
            title="Portfolio : nabster.dev" aria-label="Portfolio nabster.dev">
            <svg viewBox="0 0 512 512" fill="currentColor" class="fa-icon" aria-hidden="true">
              <path
                d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64h185.3c2.2 20.4 3.3 41.8 3.3 64zm28.8-64h120.2c-9.8-57.8-44.1-106.5-93.7-133.5c14.2 39.5 23.3 84.8 26.3 133.5zm26.3 128c-3 48.7-12.1 94-26.3 133.5c49.6-27 83.9-75.7 93.7-133.5H407.1zm-151.1 149.7c31-39.6 53.1-97.4 59.5-165.7H196.5c6.4 68.3 28.5 126.1 59.5 165.7zm0-415.4c-31 39.6-53.1 97.4-59.5 165.7h119c-6.4-68.3-28.5-126.1-59.5-165.7zm-84.8 47.9c-49.6 27-83.9 75.7-93.7 133.5h120.2c3-48.7 12.1-94 26.3-133.5zm-26.3 261.5H24.1c9.8 57.8 44.1 106.5 93.7 133.5c-14.2-39.5-23.3-84.8-26.3-133.5zM256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
            </svg>
          </a>

          <!-- GitHub Repo -->
          <a href="https://github.com/nlabrazi/riftvision" target="_blank" rel="noopener noreferrer" class="social-link"
            title="Dépôt GitHub (riftvision)" aria-label="Dépôt GitHub">
            <svg viewBox="0 0 496 512" fill="currentColor" class="fa-icon" aria-hidden="true">
              <path
                d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
            </svg>
          </a>

          <!-- Twitter / X -->
          <a href="https://x.com/Nabil71405502" target="_blank" rel="noopener noreferrer" class="social-link"
            title="X (Twitter) : @Nabil71405502" aria-label="X @Nabil71405502">
            <svg viewBox="0 0 512 512" fill="currentColor" class="fa-icon" aria-hidden="true">
              <path
                d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
            </svg>
          </a>

          <!-- Email / Contact -->
          <a href="mailto:na.labrazi@gmail.com" class="social-link" title="Contact : na.labrazi@gmail.com"
            aria-label="Contact Email">
            <svg viewBox="0 0 512 512" fill="currentColor" class="fa-icon" aria-hidden="true">
              <path
                d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
            </svg>
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
