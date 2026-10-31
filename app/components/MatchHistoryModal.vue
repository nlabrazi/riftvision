<script setup lang="ts">
import type { SavedMatch } from '../../shared/types/history'
import RvIcon from './RvIcon.vue'

defineProps<{
  matches: SavedMatch[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'selectMatch', match: SavedMatch): void
  (e: 'deleteMatch', matchId: string): void
}>()
</script>

<template>
  <div class="rv-modal-backdrop" @click.self="$emit('close')">
    <div class="rv-modal-card history-modal" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div class="rv-modal-header">
        <div class="history-title-wrap">
          <RvIcon name="clock" :size="20" class="history-icon" />
          <div>
            <h3 id="history-modal-title">Historique des parties</h3>
            <p class="history-subtitle">
              {{ matches.length }} {{ matches.length > 1 ? 'parties enregistrées' : 'partie enregistrée' }} localement
            </p>
            <p class="history-subtitle">Historique actuellement disponible pour League of Legends.</p>
          </div>
        </div>
        <button type="button" class="rv-icon-button" aria-label="Fermer" title="Fermer l'historique"
          @click="$emit('close')">
          <RvIcon name="close" :size="16" />
        </button>
      </div>

      <div class="history-modal-body">
        <div v-if="isLoading" class="history-loading">
          <RvIcon name="refresh" :size="24" class="is-spinning" />
          <span>Chargement de l'historique...</span>
        </div>

        <div v-else-if="matches.length === 0" class="history-empty" data-testid="history-empty">
          <div class="history-empty-icon">
            <RvIcon name="clock" :size="36" />
          </div>
          <h4>Aucune partie enregistrée</h4>
          <p>
            Les parties League of Legends suivies avec RiftVision sont archivées ici. Vous pourrez rouvrir le bilan
            complet, comparer l'économie et analyser vos performances à tout moment.
          </p>
        </div>

        <div v-else class="history-list" data-testid="history-list">
          <article v-for="m in matches" :key="m.id" class="history-card" :class="{
            'history-card--victory': m.result === 'VICTORY',
            'history-card--defeat': m.result === 'DEFEAT',
          }" data-testid="history-card">
            <div class="card-left">
              <div class="card-badge" :class="m.result === 'VICTORY' ? 'badge--win' : 'badge--loss'">
                {{ m.result === 'VICTORY' ? 'VICTOIRE' : 'DÉFAITE' }}
              </div>
              <div class="card-meta">
                <span class="card-champion">{{ m.championName }}</span>
                <span class="card-dot">·</span>
                <span class="card-duration">{{ m.formattedGameTime }}</span>
                <span class="card-dot">·</span>
                <span class="card-date">{{ m.dateFormatted }}</span>
              </div>
            </div>

            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-label">KDA</span>
                <span class="stat-value highlight">
                  {{ m.kda.kills }} / <span class="stat-deaths">{{ m.kda.deaths }}</span> / {{ m.kda.assists }}
                </span>
                <span class="stat-sub">Ratio {{ m.kda.ratio }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">CS</span>
                <span class="stat-value">{{ m.cs }}</span>
                <span class="stat-sub">{{ m.csPerMin }}/min</span>
              </div>
              <div v-if="m.goldDifference !== undefined" class="stat-item">
                <span class="stat-label">&Delta; Gold</span>
                <span class="stat-value" :class="m.goldDifference >= 0 ? 'gold-pos' : 'gold-neg'">
                  {{ m.goldDifference >= 0 ? '+' : '' }}{{ Math.round(m.goldDifference) }}
                </span>
                <span class="stat-sub">{{ m.goldDifference >= 0 ? 'Lead équipe' : 'Retard' }}</span>
              </div>
            </div>

            <div class="card-actions">
              <button type="button" class="rv-button rv-button-primary card-action-btn"
                title="Consulter le rapport complet de cette partie" @click="$emit('selectMatch', m)">
                <RvIcon name="dashboard" :size="13" /> Consulter le bilan
              </button>
              <button type="button" class="rv-icon-button delete-btn" title="Supprimer cette partie de l'historique"
                @click="$emit('deleteMatch', m.id)">
                <RvIcon name="close" :size="14" />
              </button>
            </div>
          </article>
        </div>
      </div>

      <div class="rv-modal-footer">
        <span class="history-count-text">
          Sauvegardé localement dans <code>server/data/match-history.json</code>
        </span>
        <button type="button" class="rv-button" @click="$emit('close')">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-modal {
  max-width: 820px;
  width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.history-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-icon {
  color: #c8aa6e;
}

.history-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.history-modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.history-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #c8aa6e;
}

.history-empty {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.history-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(200, 170, 110, 0.1);
  border: 1px solid rgba(200, 170, 110, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8aa6e;
  margin-bottom: 8px;
}

.history-empty h4 {
  font-family: 'Beaufort for LOL', 'Rajdhani', sans-serif;
  font-size: 18px;
  color: #f0e6d2;
  margin: 0;
}

.history-empty p {
  max-width: 480px;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(10, 20, 32, 0.7);
  border: 1px solid rgba(200, 170, 110, 0.2);
  border-radius: 8px;
  position: relative;
  transition: all 0.15s ease;
}

.history-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.history-card--victory::before {
  background: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.5);
}

.history-card--defeat::before {
  background: #f87171;
  box-shadow: 0 0 8px rgba(248, 113, 113, 0.5);
}

.history-card:hover {
  background: rgba(15, 30, 48, 0.85);
  border-color: rgba(200, 170, 110, 0.4);
}

.card-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}

.card-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Beaufort for LOL', 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.badge--win {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.4);
}

.badge--loss {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.4);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #cbd5e1;
}

.card-champion {
  font-weight: 700;
  color: #f0e6d2;
}

.card-dot {
  color: #64748b;
}

.card-duration {
  font-family: monospace;
}

.card-date {
  font-size: 11px;
  color: #94a3b8;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #e2e8f0;
}

.stat-value.highlight {
  color: #f0e6d2;
}

.stat-deaths {
  color: #f87171;
}

.stat-sub {
  font-size: 10px;
  color: #94a3b8;
}

.gold-pos {
  color: #34d399;
}

.gold-neg {
  color: #f87171;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-action-btn {
  font-size: 12px;
  padding: 6px 12px;
  white-space: nowrap;
}

.delete-btn {
  color: #64748b;
  opacity: 0.7;
}

.delete-btn:hover {
  color: #f87171;
  opacity: 1;
}

.rv-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(200, 170, 110, 0.2);
  background: rgba(6, 13, 21, 0.95);
}

.history-count-text {
  font-size: 11px;
  color: #94a3b8;
}

.history-count-text code {
  color: #c8aa6e;
  background: rgba(200, 170, 110, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
