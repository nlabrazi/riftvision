<script setup lang="ts">
import RvIcon from './RvIcon.vue'

const { data: installer } = await useFetch<{ available: boolean }>('/api/download/availability')

defineProps<{
  isMock: boolean
  isLiveActive: boolean
  isChangingMode: boolean
  isOverlayConnected: boolean
  matchCount: number
}>()

const emit = defineEmits<{
  'toggle-live': []
  'start-demo': []
  'open-history': []
}>()
</script>

<template>
  <section id="league-of-legends" class="standby-panel rv-panel" aria-labelledby="standby-title">
    <div class="standby-copy">
      <span class="standby-badge">{{ isLiveActive ? 'CONNEXION AUTOMATIQUE' : 'VOTRE COMPAGNON DE PARTIE' }}</span>
      <h3 id="standby-title">
        <template v-if="isMock">{{ isChangingMode ? 'Chargement de la démo…' : 'La démo n’a pas pu être chargée.' }}</template>
        <template v-else-if="isLiveActive">En attente de<br /><span>votre partie.</span></template>
        <template v-else>Votre partie,<br /><span>plus facile à suivre.</span></template>
      </h3>
      <p v-if="isMock">{{ isChangingMode ? 'Le tableau de bord va s’ouvrir automatiquement.' : 'Quittez la démo puis relancez-la. Si le problème persiste, consultez l’aide et les réglages.' }}</p>
      <template v-else-if="isLiveActive">
        <p>Lancez une partie sur l’ordinateur où RiftVision est installé. Dès que vous entrez sur la carte, le tableau de bord s’ouvre automatiquement.</p>
        <p class="standby-hint">Vous êtes déjà en partie ? Vérifiez les étapes dans « Aide et réglages ».</p>
      </template>
      <template v-else>
        <p>Retrouvez les scores, les événements et les alertes sur votre second écran.</p>
        <div class="companion-status-pill" :class="{ 'companion-status-pill--live': isOverlayConnected }">
          <span class="status-dot" :class="{ 'status-dot--live': isOverlayConnected }" />
          <span>{{ isOverlayConnected ? 'Compagnon desktop détecté & synchronisé' : 'Compagnon desktop non détecté' }}</span>
        </div>
        <ol class="connection-steps standby-steps">
          <li><strong>Lancez une partie de League of Legends.</strong><span>Sur le même ordinateur que RiftVision.</span></li>
          <li><strong>Connectez votre partie ci-dessous.</strong><span>Le tableau de bord s’ouvre dès que la partie est détectée.</span></li>
        </ol>
      </template>
      <div v-if="!isMock" class="standby-actions">
        <button
          type="button"
          data-testid="live-toggle-button"
          class="rv-button"
          :class="{ 'rv-button-primary': !isLiveActive }"
          :disabled="isChangingMode"
          @click="emit('toggle-live')"
        >
          <RvIcon :name="isLiveActive ? 'close' : 'signal'" :size="17" />
          {{ isChangingMode ? 'Connexion…' : isLiveActive ? 'Annuler la recherche' : 'Connecter ma partie' }}
        </button>
        <a
          v-if="!isLiveActive && installer?.available"
          href="/api/download/overlay"
          download
          class="rv-button"
          title="Télécharger l'installateur Windows officiel (.exe)"
        >
          <RvIcon name="download" :size="16" />
          <span>Télécharger le compagnon (.exe)</span>
        </a>
        <button v-if="!isLiveActive" type="button" data-testid="mock-toggle-button" class="rv-button rv-button-quiet" :disabled="isChangingMode" @click="emit('start-demo')">
          Explorer la démo<RvIcon name="arrow-up-right" :size="16" />
        </button>
        <button
          v-if="!isLiveActive && matchCount > 0"
          type="button"
          data-testid="landing-history-btn"
          class="rv-button rv-button-quiet"
          @click="emit('open-history')"
        >
          <RvIcon name="clock" :size="15" />
          <span>Historique ({{ matchCount }})</span>
        </button>
      </div>
      <p v-if="!isLiveActive && !isMock" class="standby-hint">
        {{ isOverlayConnected ? 'Compagnon prêt ! Cliquez sur « Connecter ma partie » dès que votre jeu est lancé.' : installer?.available ? 'Pas encore installé ? Téléchargez le compagnon Windows ou découvrez la démo en 1 clic.' : 'Le téléchargement du compagnon Windows est indisponible. Vous pouvez découvrir la démo en 1 clic.' }}
      </p>
    </div>
    <div class="standby-map" aria-hidden="true">
      <div class="standby-map-ring"></div><img src="/assets/images/sr-map.png" alt="" />
      <span class="standby-map-label"><RvIcon name="crosshair" :size="14" />FAILLE DE L’INVOCATEUR</span>
      <span class="standby-map-point standby-map-point--blue"></span><span class="standby-map-point standby-map-point--red"></span>
    </div>
  </section>
</template>
