<script setup lang="ts">
import { computed } from 'vue'
import type { TeamEconomySummary } from '#shared/types/diff'
import { getObjectiveIconUrl, STAT_ICONS } from '#shared/utils/ddragon'

const props = withDefaults(
  defineProps<{
    blueEconomy: TeamEconomySummary
    redEconomy: TeamEconomySummary
    goldDifference: number
    formattedGameTime: string
    compact?: boolean
  }>(),
  { compact: false },
)

const teams = computed(() => [
  { id: 'ORDER' as const, name: 'Équipe Bleue', color: 'blue', economy: props.blueEconomy },
  { id: 'CHAOS' as const, name: 'Équipe Rouge', color: 'red', economy: props.redEconomy },
])

const blueGoldPercent = computed(() => {
  const total = props.blueEconomy.totalItemGold + props.redEconomy.totalItemGold
  return total ? Math.round((props.blueEconomy.totalItemGold / total) * 100) : 50
})

const goldLead = computed(() =>
  props.goldDifference === 0
    ? 'Équilibre économique'
    : `Avance ${props.goldDifference > 0 ? 'bleue' : 'rouge'} +${Math.abs(props.goldDifference).toLocaleString('fr-FR')}`,
)
</script>

<template>
  <section class="rv-panel match-scoreboard" :class="{ compact }" data-testid="scoreboard-header" aria-label="Score de la partie">
    <div v-for="team in teams" :key="team.id" class="score-team" :class="`score-${team.color}`">
      <div class="team-summary">
        <span class="team-score" :aria-label="`${team.economy.killCount} éliminations`">{{ team.economy.killCount }}</span>
        <div class="team-identity">
          <h2>{{ team.name }}</h2>
          <div class="team-economy" title="Valeur des objets actuellement équipés">
            <img :src="STAT_ICONS.gold" alt="" />
            <strong>{{ team.economy.totalItemGold.toLocaleString('fr-FR') }}</strong>
            <span>or d'inventaire</span>
          </div>
        </div>
      </div>
      <div class="team-objectives">
        <span :aria-label="`${team.economy.turretCount} tours détruites`" title="Tours détruites"><img :src="getObjectiveIconUrl('tower', team.id)" alt="" /><b>{{ team.economy.turretCount }}</b><span>Tours</span></span>
        <span :aria-label="`${team.economy.dragonCount} dragons éliminés`" title="Dragons éliminés"><img :src="getObjectiveIconUrl('dragon', team.id)" alt="" /><b>{{ team.economy.dragonCount }}</b><span>Dragons</span></span>
        <span :aria-label="`${team.economy.baronCount} barons éliminés`" title="Barons éliminés"><img :src="getObjectiveIconUrl('baron', team.id)" alt="" /><b>{{ team.economy.baronCount }}</b><span>Barons</span></span>
      </div>
    </div>

    <div class="match-center">
      <span class="match-label">Temps de partie</span>
      <time class="match-time">{{ formattedGameTime }}</time>
      <div class="gold-lead" :class="goldDifference > 0 ? 'lead-blue' : goldDifference < 0 ? 'lead-red' : ''">{{ goldLead }}<span v-if="goldDifference !== 0"> or</span></div>
      <div class="gold-balance" role="img" :aria-label="`Répartition de l'or d'inventaire : bleu ${blueGoldPercent} %, rouge ${100 - blueGoldPercent} %`">
        <span :style="{ width: `${blueGoldPercent}%` }" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.match-scoreboard { display: grid; grid-template-columns: 1fr minmax(170px, .8fr) 1fr; gap: 24px; align-items: center; padding: 20px 28px; position: relative; overflow: hidden; }
.match-scoreboard::before { content: ''; position: absolute; inset: 0 0 auto; height: 1px; background: linear-gradient(90deg, #4ba9b9, transparent 40%, transparent 60%, #b15372); opacity: .7; }
.score-team { --team-color: #69d7e7; min-width: 0; grid-column: 1; grid-row: 1; }
.score-red { --team-color: #ef879e; grid-column: 3; }
.team-summary { display: flex; align-items: center; gap: 16px; }
.team-score { font-family: 'Rajdhani', sans-serif; font-size: 44px; font-weight: 600; line-height: 1; color: var(--team-color); font-variant-numeric: tabular-nums; }
.team-identity h2 { margin: 0 0 5px; font-family: 'Cinzel', serif; font-size: 13px; font-weight: 600; color: var(--team-color); }
.team-economy { display: flex; align-items: center; gap: 5px; font-family: 'Rajdhani', sans-serif; font-size: 12px; color: #8197a7; }
.team-economy img { width: 13px; height: 13px; object-fit: contain; opacity: .85; }
.team-economy strong { font-size: 16px; font-weight: 600; color: #d7c8a5; font-variant-numeric: tabular-nums; }
.team-objectives { display: flex; gap: 18px; align-items: center; margin-top: 14px; }
.team-objectives > span { display: flex; align-items: center; gap: 5px; font-family: 'Rajdhani', sans-serif; font-size: 11px; color: #8197a7; }
.team-objectives img { width: 13px; height: 13px; object-fit: contain; opacity: .75; }
.team-objectives b { font-size: 14px; font-weight: 600; color: #cad5df; }
.score-red .team-summary { flex-direction: row-reverse; text-align: right; }
.score-red .team-economy, .score-red .team-objectives { justify-content: flex-end; }
.match-center { grid-column: 2; grid-row: 1; display: flex; flex-direction: column; align-items: center; }
.match-label { font-family: 'Rajdhani', sans-serif; font-size: 10px; color: #7e93a3; text-transform: uppercase; letter-spacing: .14em; }
.match-time { margin-top: 2px; font-family: 'Rajdhani', sans-serif; font-size: 31px; font-weight: 600; line-height: 1.1; color: #e6e6df; letter-spacing: .04em; font-variant-numeric: tabular-nums; }
.gold-lead { margin-top: 6px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 500; color: #a3b0b7; }
.lead-blue { color: #72bdcd; }
.lead-red { color: #d1899c; }
.gold-balance { position: relative; height: 3px; width: min(100%, 180px); background: #b75972; border-radius: 2px; margin-top: 10px; overflow: hidden; }
.gold-balance > span { display: block; height: 100%; background: #4daabb; transition: width .4s ease; }
.gold-balance::after { content: ''; position: absolute; top: 0; left: 50%; width: 2px; height: 100%; background: #d9d3c5; }
.compact { padding: 12px 22px; }
.compact .team-score { font-size: 36px; }
.compact .team-objectives { margin-top: 7px; gap: 14px; }
.compact .team-objectives > span > span { display: none; }
.compact .team-identity h2 { font-size: 12px; }
.compact .match-time { font-size: 28px; }
.compact .match-label { display: none; }
@media (max-width: 950px) { .match-scoreboard { padding: 18px; gap: 15px; } .team-summary { gap: 10px; } .team-identity h2 { font-size: 11px; } .team-economy > span { display: none; } .team-objectives { gap: 10px; } }
@media (max-width: 620px) { .match-scoreboard { grid-template-columns: 1fr minmax(100px, .9fr) 1fr; gap: 8px; padding: 15px 12px; } .team-score { font-size: 30px; } .team-summary { align-items: start; gap: 4px; flex-direction: column-reverse; } .score-red .team-summary { flex-direction: column-reverse; align-items: end; } .team-identity h2 { font-size: 10px; margin-bottom: 3px; } .team-economy strong { font-size: 13px; } .team-economy img { width: 10px; height: 10px; } .team-objectives { gap: 9px; margin-top: 7px; } .team-objectives > span { gap: 3px; } .team-objectives > span > span { display: none; } .team-objectives img { width: 10px; height: 10px; } .team-objectives b { font-size: 12px; } .match-label { font-size: 8px; letter-spacing: .05em; } .match-time { font-size: 28px; } .gold-lead { font-size: 10px; text-align: center; } .compact { padding: 10px 12px; } .compact .team-score { font-size: 26px; } .compact .team-identity h2 { font-size: 9px; } .compact .team-objectives { gap: 8px; } }
@media (prefers-reduced-motion: reduce) { .gold-balance > span { transition: none; } }
</style>
