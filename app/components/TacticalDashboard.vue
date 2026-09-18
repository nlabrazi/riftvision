<script setup lang="ts">
import { computed } from 'vue'
import type { CombatLogFilter, GameDiffEvent, TeamEconomySummary } from '#shared/types/diff'
import type { RiotAllGameData, RiotPlayer } from '#shared/types/riot'
import { getChampionIconUrl, getItemIconUrl, getRoleIconUrl } from '#shared/utils/ddragon'
import CombatLog from './CombatLog.vue'
import MatchScoreboard from './MatchScoreboard.vue'
import TacticalMinimap from './TacticalMinimap.vue'

const props = withDefaults(
  defineProps<{
    gameData: RiotAllGameData | null
    blueEconomy: TeamEconomySummary
    redEconomy: TeamEconomySummary
    goldDifference: number
    diffEvents: GameDiffEvent[]
    formattedGameTime: string
    isMock?: boolean
    isPolling?: boolean
  }>(),
  { isMock: false, isPolling: true },
)

defineEmits<{
  'switch-view': [view: 'radar']
}>()

const selectedEvent = defineModel<GameDiffEvent | null>('selectedEvent', { default: null })
const filter = defineModel<CombatLogFilter>('filter', { default: 'all' })
const search = defineModel<string>('search', { default: '' })
const roleOrder: Record<string, number> = { TOP: 1, JUNGLE: 2, MIDDLE: 3, BOTTOM: 4, UTILITY: 5 }
const roleLabels: Record<string, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'ADC',
  UTILITY: 'Support',
}

function playersFor(team: 'ORDER' | 'CHAOS'): RiotPlayer[] {
  return (props.gameData?.allPlayers || [])
    .filter((player) => player.team === team)
    .sort((a, b) => (roleOrder[a.position] || 99) - (roleOrder[b.position] || 99))
}

const teams = computed(() => [
  {
    id: 'ORDER',
    name: 'Équipe Bleue',
    color: 'blue',
    players: playersFor('ORDER'),
  },
  { id: 'CHAOS', name: 'Équipe Rouge', color: 'red', players: playersFor('CHAOS') },
])

function inventory(player: RiotPlayer) {
  return Array.from({ length: 7 }, (_, slot) => player.items.find((item) => item.slot === slot))
}

function onChampionError(event: Event) {
  const image = event.target as HTMLImageElement
  image.onerror = null
  image.src = '/favicon.ico'
}
</script>

<template>
  <div class="tactical-dashboard" data-testid="tactical-dashboard">
    <MatchScoreboard
      :blue-economy="blueEconomy"
      :red-economy="redEconomy"
      :gold-difference="goldDifference"
      :formatted-game-time="formattedGameTime"
    />

    <div class="overview-grid">
      <section class="rv-panel map-panel" aria-labelledby="dashboard-map-title">
        <header class="panel-heading">
          <div>
            <span class="rv-eyebrow">Vision tactique</span>
            <h2 id="dashboard-map-title">La Faille</h2>
          </div>
          <button
            type="button"
            class="rv-button expand-map"
            data-testid="view-map-btn"
            @click="$emit('switch-view', 'radar')"
          >
            <RvIcon name="expand" :size="15" />
            <span>Agrandir la carte</span>
          </button>
        </header>

        <div class="dashboard-map">
          <TacticalMinimap
            :game-data="gameData"
            :blue-economy="blueEconomy"
            :red-economy="redEconomy"
            :diff-events="diffEvents"
            :selected-event="selectedEvent"
            :is-mock="isMock"
            variant="dashboard"
          />
        </div>

        <footer class="map-caption">
          <template v-if="selectedEvent">
            <span class="selected-caption"><span>{{ selectedEvent.formattedTime }}</span> {{ selectedEvent.description }}</span>
            <button
              type="button"
              class="rv-icon-button"
              aria-label="Désélectionner l'événement"
              @click="selectedEvent = null"
            ><RvIcon name="close" :size="14" /></button>
          </template>
          <template v-else>
            <RvIcon name="crosshair" :size="13" />
            <span>Sélectionnez un champion ou un événement du journal pour en savoir plus.</span>
          </template>
        </footer>
      </section>

      <CombatLog
        v-model:filter="filter"
        v-model:search="search"
        :is-mock="isMock"
        :events="diffEvents"
        :is-live="isPolling"
        :selected-event-id="selectedEvent?.id"
        @select-event="selectedEvent = $event"
      />
    </div>

    <div class="rosters-heading">
      <div>
        <span class="rv-eyebrow">Les forces en présence</span>
        <h2>Équipes & inventaires</h2>
      </div>
      <span class="rosters-hint">Éliminations / morts / assistances · Sbires · Objets</span>
    </div>

    <div class="teams-grid">
      <section
        v-for="team in teams"
        :key="team.id"
        :data-testid="`${team.color}-team-column`"
        :aria-label="team.name"
        class="rv-panel team-panel"
        :class="`team-${team.color}`"
      >
        <header class="team-heading">
          <div class="team-name"><span class="team-dot" /><h3>{{ team.name }}</h3></div>
          <span class="alive-count">{{ team.players.filter(player => !player.isDead).length }} / {{ team.players.length }} en vie</span>
        </header>

        <div class="roster-labels" aria-hidden="true">
          <span class="champion-label">Champion</span><span>K / D / A</span><span>CS</span><span>Inventaire</span>
        </div>

        <div v-for="player in team.players" :key="player.summonerName" class="player-row" :class="{ 'player-dead': player.isDead }">
          <div class="champion-portrait">
            <img :src="getChampionIconUrl(player.championName)" :alt="player.championName" loading="lazy" @error="onChampionError" />
            <span v-if="!player.isDead" class="champion-level" :aria-label="`Niveau ${player.level}`">{{ player.level }}</span>
            <span v-else class="respawn-timer" :aria-label="`Mort, réapparition dans ${Math.ceil(player.respawnTimer)} secondes`">{{ Math.ceil(player.respawnTimer) }}s</span>
          </div>

          <div class="champion-info">
            <div class="champion-name"><strong>{{ player.championName }}</strong><img v-if="getRoleIconUrl(player.position)" :src="getRoleIconUrl(player.position)" :alt="roleLabels[player.position] || 'Rôle inconnu'" :title="roleLabels[player.position]" /></div>
            <span class="summoner-name" :title="player.summonerName">{{ player.summonerName.split('#')[0] }}</span>
          </div>

          <span class="player-kda" :aria-label="`${player.scores.kills} éliminations, ${player.scores.deaths} morts, ${player.scores.assists} assistances`">
            {{ player.scores.kills }} <span>/</span> <span class="deaths">{{ player.scores.deaths }}</span> <span>/</span> {{ player.scores.assists }}
          </span>
          <span class="player-cs" :aria-label="`${player.scores.creepScore} sbires tués`">{{ player.scores.creepScore }}</span>

          <div class="player-inventory" :aria-label="`Inventaire de ${player.championName}`">
            <div v-for="(item, slot) in inventory(player)" :key="slot" class="item-slot" :class="{ 'trinket-slot': slot === 6 }" :title="item ? `${item.displayName} · ${item.price.toLocaleString('fr-FR')} or` : slot === 6 ? 'Bijou vide' : 'Emplacement vide'">
              <img v-if="item?.itemID" :src="getItemIconUrl(item.itemID)" :alt="item.displayName" loading="lazy" />
              <span v-else aria-hidden="true" />
              <span v-if="item && item.count > 1" class="item-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
        <p v-if="team.players.length === 0" class="empty-team">En attente des joueurs…</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tactical-dashboard { display: grid; gap: 18px; min-width: 0; }
.overview-grid { display: grid; grid-template-columns: minmax(310px, .86fr) minmax(0, 1.4fr); gap: 18px; align-items: stretch; }
.map-panel { min-width: 0; overflow: hidden; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 70px; padding: 14px 18px; border-bottom: 1px solid rgb(200 170 110 / 12%); }
h2 { margin: 3px 0 0; font-family: 'Cinzel', serif; font-size: 16px; color: #e7e5dc; font-weight: 600; }
.expand-map { padding: 7px 10px; white-space: nowrap; font-size: 12px; }
.dashboard-map { padding: 10px; }
.map-caption { min-height: 38px; display: flex; align-items: center; gap: 8px; padding: 0 15px 10px; color: #879aa9; font-size: 11px; }
.selected-caption { min-width: 0; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.selected-caption > span { color: #c8aa6e; margin-right: 5px; font-variant-numeric: tabular-nums; }
.map-caption .rv-icon-button { flex-shrink: 0; width: 26px; height: 26px; }
.rosters-heading { display: flex; justify-content: space-between; align-items: end; gap: 12px; padding: 6px 0 0; }
.rosters-hint { color: #798c9c; font-family: 'Rajdhani', sans-serif; font-size: 13px; }
.teams-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.team-panel { --team-color: #68d5e5; overflow: hidden; }
.team-red { --team-color: #ef849b; }
.team-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid rgb(200 170 110 / 12%); }
.team-name { display: flex; align-items: center; gap: 8px; }
.team-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--team-color); }
h3 { font-family: 'Cinzel', serif; font-size: 12px; font-weight: 600; color: var(--team-color); }
.team-side { color: #61768a; font-family: 'Rajdhani', sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: .08em; margin-left: 4px; }
.alive-count { color: #8da0b0; font-family: 'Rajdhani', sans-serif; font-size: 12px; }
.roster-labels, .player-row { display: grid; grid-template-columns: 36px minmax(76px, 1fr) 64px 30px 186px; gap: 9px; align-items: center; padding: 10px 14px; }
.roster-labels { padding-top: 10px; padding-bottom: 5px; color: #708798; font-family: 'Rajdhani', sans-serif; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }
.champion-label { grid-column: 1 / 3; }
.roster-labels > span:nth-child(2), .roster-labels > span:nth-child(3) { text-align: center; }
.player-row { min-height: 61px; border-bottom: 1px solid rgb(200 170 110 / 6%); transition: background .15s; }
.player-row:last-child { border-bottom: 0; }
.player-row:hover { background: rgb(200 170 110 / 3%); }
.champion-portrait { position: relative; width: 36px; height: 36px; border: 1px solid rgb(200 170 110 / 25%); border-radius: 4px; }
.champion-portrait > img { width: 100%; height: 100%; object-fit: cover; border-radius: 3px; }
.champion-level { position: absolute; bottom: -4px; right: -4px; background: #102131; border: 1px solid #36434a; color: #e7e5dc; font-family: 'Rajdhani', sans-serif; font-size: 10px; line-height: 14px; min-width: 15px; text-align: center; border-radius: 2px; }
.player-dead .champion-portrait > img { filter: grayscale(1) brightness(.45); }
.respawn-timer { position: absolute; inset: 0; display: grid; place-items: center; font-family: 'Rajdhani', sans-serif; font-weight: 700; color: #ffafbd; font-size: 16px; }
.champion-info { min-width: 0; }
.champion-name { display: flex; align-items: center; gap: 6px; }
.champion-name strong { font-size: 12px; color: #d5dee4; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.champion-name img { width: 12px; height: 12px; object-fit: contain; opacity: .6; flex-shrink: 0; }
.summoner-name { display: block; font-size: 10px; color: #758c9e; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; margin-top: 3px; }
.player-kda, .player-cs { white-space: nowrap; font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 13px; color: #cad7e0; text-align: center; font-variant-numeric: tabular-nums; }
.player-kda > span:not(.deaths) { color: #536979; }
.player-kda .deaths { color: #bf8391; }
.player-cs { color: #94a8b7; }
.player-inventory { display: flex; gap: 3px; }
.item-slot { position: relative; width: 24px; height: 24px; flex-shrink: 0; display: grid; place-items: center; border: 1px solid #203040; border-radius: 3px; background: #08111b; overflow: hidden; }
.item-slot > img { width: 100%; height: 100%; object-fit: cover; }
.item-slot > span:only-child { width: 3px; height: 3px; background: #253646; border-radius: 1px; }
.trinket-slot { margin-left: 3px; border-color: rgb(200 170 110 / 35%); }
.item-count { position: absolute; right: 1px; bottom: 0; font-family: 'Rajdhani', sans-serif; font-size: 10px; font-weight: 700; line-height: 11px; color: white; text-shadow: 0 1px 2px black; }
.empty-team { padding: 30px; color: #879aa9; text-align: center; font-size: 12px; }
@media (max-width: 1230px) { .teams-grid { grid-template-columns: 1fr; } .roster-labels, .player-row { grid-template-columns: 36px minmax(76px, 1fr) 82px 60px 186px; } }
@media (max-width: 850px) { .overview-grid { grid-template-columns: 1fr; } .dashboard-map { max-width: 510px; width: 100%; margin-inline: auto; } .overview-grid :deep(.combat-log) { min-height: 400px; max-height: 540px; } }
@media (max-width: 540px) { .tactical-dashboard, .overview-grid, .teams-grid { gap: 12px; } .panel-heading { padding: 12px; } .rosters-hint { display: none; } .team-heading { padding: 12px; } .team-side { display: none; } .roster-labels { display: none; } .player-row { grid-template-columns: 36px minmax(80px, 1fr) 72px 28px; gap: 4px 10px; padding: 11px 12px; } .champion-portrait { grid-row: 1 / 3; align-self: start; } .player-inventory { grid-column: 2 / 5; margin-top: 2px; } .player-cs::after { content: ' CS'; font-size: 9px; } .team-name h3 { font-size: 11px; } }
</style>
