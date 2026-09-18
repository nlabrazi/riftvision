<script setup lang="ts">
import { computed } from 'vue'
import type { CombatLogFilter, DiffEventType, GameDiffEvent } from '#shared/types/diff'
import { getChampionIconUrl, getItemIconUrl, getObjectiveIconUrl } from '#shared/utils/ddragon'

const props = withDefaults(
  defineProps<{
    events: GameDiffEvent[]
    compact?: boolean
    selectedEventId?: string | null
    isLive?: boolean
    isMock?: boolean
  }>(),
  { compact: false, selectedEventId: null, isLive: true, isMock: false },
)

const emit = defineEmits<{ 'select-event': [event: GameDiffEvent] }>()
const activeFilter = defineModel<CombatLogFilter>('filter', { default: 'all' })
const search = defineModel<string>('search', { default: '' })
const filters: { id: CombatLogFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'combat', label: 'Combats' },
  { id: 'items', label: 'Objets' },
  { id: 'objectives', label: 'Objectifs' },
]

const eventKinds: Record<DiffEventType, { filter: CombatLogFilter; label: string; icon: string }> =
  {
    ITEM_PURCHASE: { filter: 'items', label: 'Achat', icon: 'layers' },
    CHAMPION_KILL: { filter: 'combat', label: 'Élimination', icon: 'swords' },
    CHAMPION_DEATH: { filter: 'combat', label: 'Mort', icon: 'swords' },
    CHAMPION_RESPAWN: { filter: 'combat', label: 'Réapparition', icon: 'refresh' },
    FIRST_BLOOD: { filter: 'combat', label: 'Premier sang', icon: 'swords' },
    ACE: { filter: 'combat', label: 'Ace', icon: 'swords' },
    TURRET_DESTROYED: { filter: 'objectives', label: 'Tour', icon: 'shield' },
    INHIB_DESTROYED: { filter: 'objectives', label: 'Inhibiteur', icon: 'shield' },
    DRAGON_KILL: { filter: 'objectives', label: 'Dragon', icon: 'shield' },
    BARON_KILL: { filter: 'objectives', label: 'Baron Nashor', icon: 'shield' },
    HERALD_KILL: { filter: 'objectives', label: 'Héraut', icon: 'shield' },
    HORDE_KILL: { filter: 'objectives', label: 'Larves du Néant', icon: 'shield' },
    MULTIKILL: { filter: 'combat', label: 'Multikill', icon: 'swords' },
    KILL_STREAK: { filter: 'combat', label: 'Série', icon: 'activity' },
    DOMINATING: { filter: 'objectives', label: 'Domination', icon: 'shield' },
    GAME_END: { filter: 'combat', label: 'Fin de match', icon: 'activity' },
    EXECUTE: { filter: 'combat', label: 'Exécution', icon: 'swords' },
  }

const filteredEvents = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('fr')
  return [...props.events]
    .sort((a, b) => b.gameTime - a.gameTime)
    .filter(
      (event) =>
        (activeFilter.value === 'all' || eventKinds[event.type].filter === activeFilter.value) &&
        (!query ||
          `${event.description} ${eventKinds[event.type].label}`
            .toLocaleLowerCase('fr')
            .includes(query)),
    )
})

function eventImage(event: GameDiffEvent): string | undefined {
  const metadata =
    event.metadata && typeof event.metadata === 'object'
      ? (event.metadata as Record<string, unknown>)
      : {}
  const item =
    metadata.item && typeof metadata.item === 'object'
      ? (metadata.item as Record<string, unknown>)
      : undefined
  if (event.type === 'ITEM_PURCHASE' && typeof item?.itemID === 'number')
    return getItemIconUrl(item.itemID)
  const team = event.team === 'CHAOS' ? 'CHAOS' : 'ORDER'
  if (event.type === 'DRAGON_KILL') return getObjectiveIconUrl('dragon', team)
  if (event.type === 'BARON_KILL') return getObjectiveIconUrl('baron', team)
  if (event.type === 'HERALD_KILL') return getObjectiveIconUrl('herald', team)
  if (event.type === 'TURRET_DESTROYED') return getObjectiveIconUrl('tower', team)
  const champion = metadata.championName || metadata.killerChampion || metadata.killerChamp
  return typeof champion === 'string' ? getChampionIconUrl(champion) : undefined
}
</script>

<template>
  <section class="rv-panel combat-log" :class="{ compact }" data-testid="live-diff-feed" aria-label="Journal de combat">
    <header class="log-heading">
      <div><span class="rv-eyebrow">Fil d'événements</span>
        <h2>Journal de combat</h2>
      </div>
      <span class="live-label" :class="{ paused: !isLive || isMock }"><span />{{ isMock ? 'Exemple' : isLive ? 'En direct' : 'En pause' }}</span>
    </header>

    <div class="log-controls">
      <div class="log-filters" role="group" aria-label="Filtrer le journal">
        <button v-for="filter in filters" :key="filter.id" type="button" :aria-pressed="activeFilter === filter.id"
          :class="{ active: activeFilter === filter.id }" @click="activeFilter = filter.id">{{ filter.label }}</button>
      </div>
      <label class="log-search">
        <RvIcon name="search" :size="14" /><input v-model="search" type="search" aria-label="Rechercher dans le journal"
          placeholder="Rechercher…" />
      </label>
    </div>

    <div class="event-list" tabindex="0" aria-label="Événements de la partie, du plus récent au plus ancien">
      <ol v-if="filteredEvents.length">
        <li v-for="event in filteredEvents" :key="event.id">
          <button type="button" class="event-row"
            :class="[eventKinds[event.type].filter, { selected: selectedEventId === event.id, 'team-blue': event.team === 'ORDER', 'team-red': event.team === 'CHAOS' }]"
            :aria-pressed="selectedEventId === event.id"
            :aria-label="`${event.formattedTime} · ${event.description}. Afficher le détail`"
            data-testid="combat-log-event" @click="emit('select-event', event)">
            <time>{{ event.formattedTime }}</time>
            <span class="event-visual"><img v-if="eventImage(event)" :src="eventImage(event)" alt="" loading="lazy" />
              <RvIcon v-else :name="eventKinds[event.type].icon" :size="16" />
            </span>
            <span class="event-copy"><span class="event-meta"><span class="event-type">{{ eventKinds[event.type].label
            }}</span><span v-if="event.team === 'ORDER' || event.team === 'CHAOS'" class="event-team">{{
                    event.team === 'ORDER' ? 'Équipe bleue' : 'Équipe rouge' }}</span></span><span
                class="event-description">{{ event.description }}</span></span>
            <RvIcon name="chevron-right" :size="14" class="event-arrow" />
          </button>
        </li>
      </ol>
      <div v-else class="log-empty">
        <RvIcon name="activity" :size="26" />
        <strong v-if="events.length">Aucun événement correspondant</strong>
        <strong v-else>La Faille est calme</strong>
        <p v-if="events.length">Essayez un autre filtre ou une autre recherche.</p>
        <p v-else>Les combats, achats et objectifs apparaîtront ici.</p>
        <button v-if="activeFilter !== 'all' || search" type="button" class="rv-button" @click="activeFilter = 'all'; search = ''">Réinitialiser les filtres</button>
      </div>
    </div>

    <footer class="log-footer"><span>{{ filteredEvents.length }} événement{{ filteredEvents.length > 1 ? 's' : ''
    }}</span><span>Plus récents en premier</span></footer>
  </section>
</template>

<style scoped>
.combat-log {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.log-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 70px;
  padding: 14px 20px;
}

h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 3px 0 0;
  font-family: 'Cinzel', serif;
  font-size: 16px;
  font-weight: 600;
  color: #e7e5dc;
}

.live-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  letter-spacing: .04em;
  color: #80bdb5;
}

.live-label>span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #73c3ad;
}

.live-label.paused {
  color: #9ba6b0;
}

.live-label.paused>span {
  background: #9ba6b0;
}

.log-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px 13px;
  border-bottom: 1px solid rgb(200 170 110 / 12%);
}

.log-filters {
  display: flex;
  gap: 4px;
}

.log-filters button {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 5px 10px;
  color: #8d9eac;
  background: transparent;
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, color .15s;
}

.log-filters button:hover {
  background: rgb(200 170 110 / 5%);
  color: #e7dfd0;
}

.log-filters button.active {
  color: #d3bd8e;
  background: rgb(200 170 110 / 9%);
  border-color: rgb(200 170 110 / 22%);
}

.log-search {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 150px;
  min-width: 80px;
  border: 1px solid #223340;
  border-radius: 4px;
  padding: 6px 8px;
  color: #718999;
}

.log-search:focus-within {
  border-color: #c8aa6e;
}

.log-search input {
  width: 100%;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: none;
  color: #c6d4de;
  font-size: 11px;
}

.log-search input::placeholder {
  color: #708696;
}

.event-list {
  flex: 1;
  min-height: 0;
  height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #354652 transparent;
}

.event-list ol {
  list-style: none;
  margin: 0;
  padding: 0;
}

.event-row {
  --event-color: #d49ba7;
  display: grid;
  grid-template-columns: 38px 32px minmax(0, 1fr) 14px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 66px;
  padding: 11px 20px;
  background: transparent;
  text-align: left;
  border: 0;
  border-bottom: 1px solid rgb(200 170 110 / 6%);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background .15s;
}

.event-row:hover {
  background: rgb(200 170 110 / 4%);
}

.event-row.selected {
  border-left-color: #c8aa6e;
  background: rgb(200 170 110 / 8%);
}

.event-row.items {
  --event-color: #b3a3d4;
}

.event-row.objectives {
  --event-color: #cbb27b;
}

.event-row>time {
  align-self: start;
  padding-top: 2px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 12px;
  color: #7b93a5;
  font-variant-numeric: tabular-nums;
}

.event-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  overflow: hidden;
  border: 1px solid rgb(200 170 110 / 20%);
  border-radius: 4px;
  background: #0e1a28;
  color: var(--event-color);
}

.event-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.objectives .event-visual img {
  width: 23px;
  height: 23px;
  object-fit: contain;
}

.event-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 10px;
  font-weight: 600;
}

.event-type {
  color: var(--event-color);
  text-transform: uppercase;
  letter-spacing: .08em;
}

.event-team {
  color: #8392a2;
  font-weight: 400;
}

.team-blue .event-team {
  color: #719da9;
}

.team-red .event-team {
  color: #b58292;
}

.event-description {
  font-size: 12px;
  line-height: 1.5;
  color: #ccd5de;
  overflow-wrap: anywhere;
}

.event-arrow {
  color: #405667;
  opacity: 0;
}

.event-row:hover .event-arrow,
.event-row:focus-visible .event-arrow,
.event-row.selected .event-arrow {
  opacity: 1;
}

.event-row.selected .event-arrow {
  color: #c8aa6e;
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 210px;
  height: 100%;
  padding: 24px;
  color: #607f90;
  text-align: center;
}

.log-empty strong {
  color: #b1bec8;
  font-size: 13px;
  font-weight: 500;
}

.log-empty p {
  color: #8095a5;
  font-size: 11px;
  line-height: 1.7;
  margin: 0;
}

.log-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 20px;
  border-top: 1px solid rgb(200 170 110 / 10%);
  color: #6f8799;
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
}

.compact .log-heading {
  min-height: 66px;
  padding: 13px 15px;
}

.compact h2 {
  font-size: 14px;
}

.compact .log-controls {
  flex-wrap: wrap;
  padding: 0 15px 12px;
}

.compact .log-search { width: 100%; }

.compact .log-filters {
  width: 100%;
  justify-content: space-between;
  gap: 1px;
}

.compact .log-filters button {
  padding: 5px 8px;
}

.compact .event-row {
  grid-template-columns: 31px 28px minmax(0, 1fr);
  padding: 12px;
  gap: 8px;
}

.compact .event-visual {
  width: 28px;
  height: 28px;
}

.compact .event-meta {
  gap: 6px;
  flex-wrap: wrap;
  font-size: 9px;
}

.compact .event-description {
  font-size: 11px;
}

.compact .event-arrow {
  display: none;
}

.compact .log-footer {
  padding-inline: 15px;
}

@media (max-width: 1080px) {
  .log-controls {
    flex-wrap: wrap;
    gap: 9px;
  }

  .log-search {
    flex: 1;
    min-width: 110px;
  }

  .log-heading,
  .log-controls {
    padding-inline: 15px;
  }

  .event-row {
    padding-inline: 14px;
    gap: 9px;
  }
}

@media (max-width: 540px) {
  .log-heading h2 {
    font-size: 14px;
  }

  .log-search {
    width: 100%;
    flex-basis: 100%;
  }

  .event-row {
    grid-template-columns: 32px 28px minmax(0, 1fr);
    gap: 9px;
  }

  .event-visual {
    width: 28px;
    height: 28px;
  }

  .event-arrow {
    display: none;
  }

  .event-description {
    font-size: 11px;
  }

  .log-filters {
    width: 100%;
    justify-content: space-between;
  }
}

@media (prefers-reduced-motion: reduce) {

  .event-row,
  .log-filters button {
    transition: none;
  }
}
</style>
