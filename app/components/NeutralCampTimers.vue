<script setup lang="ts">
import { computed } from 'vue'
import type { RiotAllGameData } from '#shared/types/riot'
import { calculateCampTimers, type NeutralCamp } from '#shared/utils/campTimers'
import { formatSecondsToTime, getObjectiveIconUrl } from '#shared/utils/ddragon'
import RvIcon from './RvIcon.vue'

const props = withDefaults(
  defineProps<{
    gameData: RiotAllGameData | null
    compact?: boolean
  }>(),
  { compact: false },
)

const gameTime = computed(() => props.gameData?.gameData?.gameTime ?? 0)
const events = computed(() => props.gameData?.events?.Events ?? [])

const camps = computed<NeutralCamp[]>(() => calculateCampTimers(gameTime.value, events.value))

const epicCamps = computed(() => camps.value.filter((c) => c.category === 'epic'))

const buffCamps = computed(() => camps.value.filter((c) => c.category === 'buff'))

function campBadgeClass(camp: NeutralCamp): string {
  if (camp.status === 'DESPAWNED') return 'badge-despawned'
  if (camp.status === 'ALIVE') return 'badge-alive'
  if (camp.remainingSeconds <= 60) return 'badge-imminent'
  return 'badge-spawning'
}

function formatRemaining(camp: NeutralCamp): string {
  if (camp.status === 'DESPAWNED') return 'Expiré'
  if (camp.status === 'ALIVE') return 'Disponible'
  return formatSecondsToTime(camp.remainingSeconds)
}
</script>

<template>
  <div data-testid="neutral-camp-timers" class="rv-panel camp-timers" :class="{ compact }">
    <header class="timers-header">
      <div class="header-title">
        <span class="rv-eyebrow">Faune & Objectifs</span>
        <h3>Timers des Camps Neutres</h3>
      </div>
      <span class="timers-clock" aria-label="Temps de jeu actuel">
        <RvIcon name="activity" :size="13" />
        {{ formatSecondsToTime(gameTime) }}
      </span>
    </header>

    <div class="camps-grid">
      <!-- Epic Camps: Dragon, Baron, Herald, Grubs -->
      <article
        v-for="camp in epicCamps"
        :key="camp.id"
        data-testid="epic-camp-card"
        class="camp-card"
        :class="[`camp-card--${camp.id.toLowerCase()}`, { 'is-alive': camp.status === 'ALIVE', 'is-imminent': camp.status === 'SPAWNING' && camp.remainingSeconds <= 60 }]"
      >
        <div class="camp-icon-wrapper">
          <img
            :src="getObjectiveIconUrl(camp.iconType === 'dragon' ? 'dragon' : camp.iconType === 'baron' ? 'baron' : 'herald', 'ORDER')"
            :alt="camp.name"
            class="camp-icon"
          />
          <span class="camp-status-dot" :class="campBadgeClass(camp)"></span>
        </div>

        <div class="camp-info">
          <div class="camp-name-row">
            <h4>{{ camp.name }}</h4>
            <span class="camp-badge" :class="campBadgeClass(camp)">
              {{ formatRemaining(camp) }}
            </span>
          </div>

          <p class="camp-subtext">
            <template v-if="camp.status === 'ALIVE'">
              Actuellement sur la Faille
            </template>
            <template v-else-if="camp.status === 'DESPAWNED'">
              Remplacé par le Baron
            </template>
            <template v-else-if="camp.remainingSeconds <= 60">
              <strong class="text-imminent">Apparition imminente !</strong>
            </template>
            <template v-else>
              Apparaît à {{ formatSecondsToTime(camp.nextSpawnTime) }}
            </template>
            <span v-if="camp.killCount > 0" class="kill-tag">· {{ camp.killCount }} abattu{{ camp.killCount > 1 ? 's' : '' }}</span>
          </p>
        </div>
      </article>
    </div>

    <!-- Buffs Bar (Red & Blue Sentinels) -->
    <div class="buffs-strip">
      <div v-for="buff in buffCamps" :key="buff.id" class="buff-item" :class="[`buff-${buff.team?.toLowerCase()}`, { 'is-available': buff.status === 'ALIVE' }]">
        <span class="buff-dot"></span>
        <span class="buff-label">{{ buff.id.startsWith('BLUE') ? 'Bleu' : 'Rouge' }} ({{ buff.team === 'ORDER' ? 'Bleu' : 'Rouge' }})</span>
        <span class="buff-status">{{ buff.status === 'ALIVE' ? 'Actif' : formatSecondsToTime(buff.remainingSeconds) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.camp-timers {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
}

.timers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgb(200 170 110 / 12%);
  padding-bottom: 10px;
}

.header-title h3 {
  margin: 2px 0 0;
  font-family: 'Cinzel', serif;
  font-size: 15px;
  font-weight: 600;
  color: #e7e5dc;
}

.timers-clock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #c8aa6e;
}

.camps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.camp-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgb(13 22 31 / 70%);
  border: 1px solid rgb(200 170 110 / 12%);
  transition: border-color 0.2s, background 0.2s;
}

.camp-card.is-alive {
  border-color: rgb(74 222 128 / 30%);
  background: rgb(20 38 30 / 60%);
}

.camp-card.is-imminent {
  border-color: rgb(249 115 22 / 50%);
  background: rgb(40 25 15 / 60%);
  animation: pulse-border 2s infinite ease-in-out;
}

@keyframes pulse-border {
  0%, 100% { border-color: rgb(249 115 22 / 40%); }
  50% { border-color: rgb(249 115 22 / 80%); }
}

.camp-icon-wrapper {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgb(8 13 18 / 80%);
  border: 1px solid rgb(200 170 110 / 25%);
}

.camp-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.camp-status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #080d12;
}

.camp-info {
  flex: 1;
  min-width: 0;
}

.camp-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.camp-name-row h4 {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 13px;
  font-weight: 600;
  color: #f1ede2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.camp-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.badge-alive {
  background: rgb(34 197 94 / 20%);
  color: #4ade80;
  border: 1px solid rgb(34 197 94 / 40%);
}

.badge-imminent {
  background: rgb(249 115 22 / 25%);
  color: #fb923c;
  border: 1px solid rgb(249 115 22 / 50%);
  animation: blink 1s infinite;
}

.badge-spawning {
  background: rgb(59 130 246 / 15%);
  color: #93c5fd;
  border: 1px solid rgb(59 130 246 / 30%);
}

.badge-despawned {
  background: rgb(107 114 128 / 20%);
  color: #9ca3af;
  border: 1px solid rgb(107 114 128 / 30%);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.camp-subtext {
  margin: 3px 0 0;
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  color: #9aa7b2;
}

.text-imminent {
  color: #f97316;
  font-weight: 700;
}

.kill-tag {
  color: #c8aa6e;
}

.buffs-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgb(200 170 110 / 10%);
}

.buff-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  color: #8c9ba5;
}

.buff-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748b;
}

.buff-order .buff-dot {
  background: #38bdf8;
}

.buff-chaos .buff-dot {
  background: #f43f5e;
}

.buff-status {
  color: #c8aa6e;
  font-weight: 600;
}
</style>
