<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameDiffEvent, TeamEconomySummary } from '#shared/types/diff'
import type { RiotAllGameData } from '#shared/types/riot'
import RvIcon from './RvIcon.vue'

const props = withDefaults(
  defineProps<{
    gameData: RiotAllGameData | null
    blueEconomy: TeamEconomySummary
    redEconomy: TeamEconomySummary
    goldDifference: number
    formattedGameTime: string
    result?: 'VICTORY' | 'DEFEAT' | null
    diffEvents?: GameDiffEvent[]
  }>(),
  {
    result: 'VICTORY',
    diffEvents: () => [],
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'newGame'): void
}>()

const copiedToast = ref(false)

const activePlayerName = computed(() => props.gameData?.activePlayer?.summonerName || '')

const activePlayerRecord = computed(() => {
  if (!props.gameData?.allPlayers?.length) return null
  return (
    props.gameData.allPlayers.find((p) => p.summonerName === activePlayerName.value) ||
    props.gameData.allPlayers[0]
  )
})

const playerTeam = computed(() => activePlayerRecord.value?.team || 'ORDER')
const isBlueTeam = computed(() => playerTeam.value === 'ORDER')

const totalTeamKills = computed(() => {
  return isBlueTeam.value ? props.blueEconomy.killCount : props.redEconomy.killCount
})

const killParticipation = computed(() => {
  if (!activePlayerRecord.value || totalTeamKills.value === 0) return 0
  const k = activePlayerRecord.value.scores?.kills || 0
  const a = activePlayerRecord.value.scores?.assists || 0
  return Math.min(100, Math.round(((k + a) / totalTeamKills.value) * 100))
})

const kdaRatio = computed(() => {
  if (!activePlayerRecord.value) return '0.0'
  const k = activePlayerRecord.value.scores?.kills || 0
  const d = Math.max(1, activePlayerRecord.value.scores?.deaths || 0)
  const a = activePlayerRecord.value.scores?.assists || 0
  return ((k + a) / d).toFixed(1)
})

const gameMinutes = computed(() => {
  const parts = props.formattedGameTime.split(':')
  if (parts.length === 2) {
    return Math.max(1, parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60)
  }
  return 15
})

const csPerMin = computed(() => {
  if (!activePlayerRecord.value) return '0.0'
  const cs = activePlayerRecord.value.scores?.creepScore || 0
  return (cs / gameMinutes.value).toFixed(1)
})

const playerItems = computed(() => {
  const items = activePlayerRecord.value?.items || []
  const slots = [0, 1, 2, 3, 4, 5, 6]
  return slots.map((slot) => items.find((i) => i.slot === slot) || null)
})

const keyHighlights = computed(() => {
  if (!props.diffEvents?.length) return []
  const highlightTypes = [
    'FIRST_BLOOD',
    'MULTIKILL',
    'DRAGON_KILL',
    'BARON_KILL',
    'HERALD_KILL',
    'ACE',
  ]
  return props.diffEvents
    .filter((e) => highlightTypes.includes(e.type))
    .slice(-6)
    .reverse()
})

async function copySummary() {
  const champ = activePlayerRecord.value?.championName || 'Champion'
  const k = activePlayerRecord.value?.scores?.kills || 0
  const d = activePlayerRecord.value?.scores?.deaths || 0
  const a = activePlayerRecord.value?.scores?.assists || 0
  const outcome = props.result === 'VICTORY' ? 'Victoire' : 'Défaite'

  const text = `🎮 RiftVision — Bilan de Match
🏆 Résultat : ${outcome} (${props.formattedGameTime})
🧙 Champion : ${champ}
⚔️ KDA : ${k}/${d}/${a} (${kdaRatio.value} Ratio, ${killParticipation.value}% KP)
🎯 CS : ${activePlayerRecord.value?.scores?.creepScore || 0} (${csPerMin.value}/min)
🐉 Dragons : Bleu ${props.blueEconomy.dragonCount} vs Rouge ${props.redEconomy.dragonCount}
👾 Barons : Bleu ${props.blueEconomy.baronCount} vs Rouge ${props.redEconomy.baronCount}`

  try {
    await navigator.clipboard.writeText(text)
    copiedToast.value = true
    setTimeout(() => {
      copiedToast.value = false
    }, 3000)
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="post-game-backdrop" role="dialog" aria-modal="true" aria-labelledby="post-game-title">
    <div class="post-game-card">
      <!-- 1. En-tête Héroïque Victoire / Défaite -->
      <div class="post-game-hero" :class="result === 'VICTORY' ? 'post-game-hero--victory' : 'post-game-hero--defeat'">
        <button type="button" class="post-game-close-btn" aria-label="Fermer le bilan" @click="emit('close')">
          <RvIcon name="close" :size="16" />
        </button>
        <div class="hero-badge">{{ result === 'VICTORY' ? 'PARTIE REMPORTÉE' : 'PARTIE TERMINÉE' }}</div>
        <h2 id="post-game-title" class="hero-title">
          {{ result === 'VICTORY' ? 'VICTOIRE' : 'DÉFAITE' }}
        </h2>
        <div class="hero-meta">
          <span><RvIcon name="clock" :size="14" /> {{ formattedGameTime }}</span>
          <span>•</span>
          <span><RvIcon name="crosshair" :size="14" /> Faille de l’Invocateur</span>
          <span>•</span>
          <span :class="isBlueTeam ? 'text-blue' : 'text-red'">
            Équipe {{ isBlueTeam ? 'Bleue' : 'Rouge' }}
          </span>
        </div>
      </div>

      <div class="post-game-body">
        <!-- 2. Fiche de Performance Personnelle -->
        <section v-if="activePlayerRecord" class="player-recap-card">
          <div class="player-header">
            <div class="player-avatar-wrapper">
              <img
                :src="`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${activePlayerRecord.championName}.png`"
                :alt="activePlayerRecord.championName"
                class="player-avatar"
                @error="($event.target as HTMLElement).style.display = 'none'"
              />
              <span class="player-level">{{ activePlayerRecord.level }}</span>
            </div>
            <div class="player-identity">
              <div class="player-summoner">{{ activePlayerRecord.summonerName }}</div>
              <div class="player-champion">{{ activePlayerRecord.championName }}</div>
            </div>
            <div class="player-badges">
              <span class="rv-badge rv-badge--gold" title="Ratio KDA">{{ kdaRatio }} KDA</span>
              <span class="rv-badge rv-badge--cyan" title="Participation aux éliminations de l'équipe">
                {{ killParticipation }}% KP
              </span>
            </div>
          </div>

          <!-- Statistiques clés du joueur -->
          <div class="player-stats-grid">
            <div class="stat-box">
              <span class="stat-label">K / D / A</span>
              <span class="stat-val highlight-val">
                {{ activePlayerRecord.scores.kills }} / {{ activePlayerRecord.scores.deaths }} / {{ activePlayerRecord.scores.assists }}
              </span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Sbires (CS)</span>
              <span class="stat-val">
                {{ activePlayerRecord.scores.creepScore }}
                <small>({{ csPerMin }}/m)</small>
              </span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Score de Vision</span>
              <span class="stat-val">{{ activePlayerRecord.scores.wardScore }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Valeur Inventaire</span>
              <span class="stat-val text-gold">
                {{ playerItems.reduce((acc, i) => acc + (i?.price || 0), 0).toLocaleString() }} G
              </span>
            </div>
          </div>

          <!-- Inventaire 6 slots + Trinket -->
          <div class="player-inventory-row">
            <div class="inventory-label">Équipement final :</div>
            <div class="inventory-slots">
              <div
                v-for="(item, idx) in playerItems"
                :key="idx"
                class="inventory-slot"
                :class="{ 'inventory-slot--trinket': idx === 6, 'inventory-slot--empty': !item }"
                :title="item ? item.displayName : 'Emplacement vide'"
              >
                <img
                  v-if="item"
                  :src="`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${item.itemID}.png`"
                  :alt="item.displayName"
                  class="item-img"
                  @error="($event.target as HTMLElement).style.display = 'none'"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Comparatif d'Équipe (Bleue vs Rouge) -->
        <section class="team-comparison-card">
          <div class="team-header-row">
            <span class="team-label text-blue">ÉQUIPE BLEUE</span>
            <span class="comparison-center-title">OBJECTIFS & STRUCTURES</span>
            <span class="team-label text-red">ÉQUIPE ROUGE</span>
          </div>

          <div class="comparison-rows">
            <!-- Kills -->
            <div class="comparison-row">
              <span class="team-stat text-blue">{{ blueEconomy.killCount }}</span>
              <span class="stat-name"><RvIcon name="swords" :size="13" /> Kills</span>
              <span class="team-stat text-red">{{ redEconomy.killCount }}</span>
            </div>
            <!-- Dragons -->
            <div class="comparison-row">
              <span class="team-stat text-blue">{{ blueEconomy.dragonCount }}</span>
              <span class="stat-name">Dragons</span>
              <span class="team-stat text-red">{{ redEconomy.dragonCount }}</span>
            </div>
            <!-- Barons -->
            <div class="comparison-row">
              <span class="team-stat text-blue">{{ blueEconomy.baronCount }}</span>
              <span class="stat-name">Barons Nashor</span>
              <span class="team-stat text-red">{{ redEconomy.baronCount }}</span>
            </div>
            <!-- Tourelles -->
            <div class="comparison-row">
              <span class="team-stat text-blue">{{ blueEconomy.turretCount }}</span>
              <span class="stat-name">Tourelles</span>
              <span class="team-stat text-red">{{ redEconomy.turretCount }}</span>
            </div>
            <!-- Économie -->
            <div class="comparison-row">
              <span class="team-stat text-blue">{{ (blueEconomy.totalItemGold / 1000).toFixed(1) }}k G</span>
              <span class="stat-name">Or d’équipement</span>
              <span class="team-stat text-red">{{ (redEconomy.totalItemGold / 1000).toFixed(1) }}k G</span>
            </div>
          </div>
        </section>

        <!-- 4. Moments Clés du Match -->
        <section v-if="keyHighlights.length" class="highlights-card">
          <h4><RvIcon name="bolt" :size="14" /> Faits marquants de la partie</h4>
          <div class="highlights-list">
            <div v-for="hl in keyHighlights" :key="hl.id" class="highlight-item">
              <span class="highlight-time">{{ Math.floor(hl.timestamp / 60) }}:{{ ((hl.timestamp % 60) | 0).toString().padStart(2, '0') }}</span>
              <span class="highlight-title">{{ hl.title }}</span>
              <span class="highlight-sub">{{ hl.subtitle }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- 5. Actions du Footer -->
      <div class="post-game-footer">
        <button type="button" class="rv-button rv-button-quiet" @click="copySummary">
          <RvIcon name="flask" :size="14" />
          <span>{{ copiedToast ? '✓ Bilan copié dans le presse-papier !' : 'Copier le récapitulatif' }}</span>
        </button>
        <button type="button" class="rv-button" @click="emit('close')">
          <span>Revoir le tableau de bord</span>
        </button>
        <button type="button" class="rv-button rv-button-primary" @click="emit('newGame')">
          <RvIcon name="check" :size="14" />
          <span>Prêt pour la partie suivante</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-game-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(3, 8, 14, 0.88);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.post-game-card {
  width: 100%;
  max-width: 820px;
  background: #060d15;
  border: 1px solid #c8aa6e50;
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85);
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* En-tête Héroïque */
.post-game-hero {
  position: relative;
  padding: 36px 24px 28px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.post-game-hero--victory {
  background: radial-gradient(ellipse at top, rgba(10, 200, 185, 0.25) 0%, rgba(6, 13, 21, 0.8) 70%);
}

.post-game-hero--defeat {
  background: radial-gradient(ellipse at top, rgba(232, 64, 87, 0.25) 0%, rgba(6, 13, 21, 0.8) 70%);
}

.post-game-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  background: transparent;
  border: none;
  color: #8c9bad;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: color 0.15s;
}

.post-game-close-btn:hover {
  color: #f0e6d2;
}

.hero-badge {
  font: 700 11px/1 'Rajdhani', sans-serif;
  letter-spacing: 2.5px;
  color: #c8aa6e;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.hero-title {
  font: 800 44px/1 'Cinzel', 'Rajdhani', serif;
  letter-spacing: 3px;
  margin: 0 0 12px;
  text-shadow: 0 0 24px currentColor;
}

.post-game-hero--victory .hero-title {
  color: #34d399;
}

.post-game-hero--defeat .hero-title {
  color: #f87171;
}

.hero-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
  color: #97a6b7;
}

/* Contenu */
.post-game-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

/* Fiche Joueur */
.player-recap-card {
  background: rgba(10, 20, 32, 0.6);
  border: 1px solid rgba(200, 170, 110, 0.2);
  border-radius: 6px;
  padding: 18px;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.player-avatar-wrapper {
  position: relative;
  width: 52px;
  height: 52px;
}

.player-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #c8aa6e;
  object-fit: cover;
}

.player-level {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #060d15;
  border: 1px solid #c8aa6e;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font: 700 11px/18px 'Rajdhani', sans-serif;
  text-align: center;
  color: #f0e6d2;
}

.player-identity {
  flex: 1;
}

.player-summoner {
  font: 700 17px/1.2 'Rajdhani', sans-serif;
  color: #f0e6d2;
}

.player-champion {
  font-size: 13px;
  color: #c8aa6e;
}

.player-badges {
  display: flex;
  gap: 8px;
}

.rv-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font: 700 12px/1 'Rajdhani', sans-serif;
  letter-spacing: 0.5px;
}

.rv-badge--gold {
  background: rgba(200, 170, 110, 0.15);
  border: 1px solid rgba(200, 170, 110, 0.4);
  color: #f0e6d2;
}

.rv-badge--cyan {
  background: rgba(10, 200, 185, 0.15);
  border: 1px solid rgba(10, 200, 185, 0.4);
  color: #38bdf8;
}

.player-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  background: rgba(6, 13, 21, 0.5);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 14px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: #8c9bad;
  text-transform: uppercase;
}

.stat-val {
  font: 700 16px/1.2 'Rajdhani', sans-serif;
  color: #e4e8ed;
}

.highlight-val {
  color: #38bdf8;
  font-size: 18px;
}

.player-inventory-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.inventory-label {
  font-size: 12px;
  color: #8c9bad;
}

.inventory-slots {
  display: flex;
  gap: 6px;
}

.inventory-slot {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(200, 170, 110, 0.25);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.inventory-slot--trinket {
  border-radius: 50%;
  margin-left: 6px;
  border-color: rgba(56, 189, 248, 0.35);
}

.inventory-slot--empty {
  opacity: 0.3;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Comparatif Équipes */
.team-comparison-card {
  background: rgba(10, 20, 32, 0.6);
  border: 1px solid rgba(200, 170, 110, 0.2);
  border-radius: 6px;
  padding: 18px;
}

.team-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font: 700 13px 'Rajdhani', sans-serif;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.comparison-center-title {
  color: #8c9bad;
  font-size: 11px;
}

.comparison-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(6, 13, 21, 0.3);
}

.stat-name {
  font-size: 12px;
  color: #8c9bad;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.team-stat {
  font: 700 15px 'Rajdhani', sans-serif;
  width: 60px;
}

.team-stat:first-child {
  text-align: left;
}

.team-stat:last-child {
  text-align: right;
}

.text-blue { color: #38bdf8; }
.text-red { color: #f87171; }
.text-gold { color: #eab308; }

/* Highlights */
.highlights-card {
  background: rgba(10, 20, 32, 0.4);
  border: 1px solid rgba(200, 170, 110, 0.15);
  border-radius: 6px;
  padding: 14px 18px;
}

.highlights-card h4 {
  font: 600 14px 'Rajdhani', sans-serif;
  color: #c8aa6e;
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.highlights-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 3px;
  background: rgba(6, 13, 21, 0.4);
}

.highlight-time {
  color: #c8aa6e;
  font-family: monospace;
  font-size: 11px;
}

.highlight-title {
  color: #f0e6d2;
  font-weight: 600;
}

.highlight-sub {
  color: #8c9bad;
  margin-left: auto;
}

/* Footer */
.post-game-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(6, 13, 21, 0.6);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
