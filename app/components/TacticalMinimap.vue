<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { GameDiffEvent, TeamEconomySummary } from '#shared/types/diff'
import type { RiotAllGameData, RiotPlayer } from '#shared/types/riot'
import { getChampionIconUrl, getObjectiveIconUrl } from '#shared/utils/ddragon'
import {
  getChampionMapPosition,
  getDestroyedTurretIds,
  OBJECTIVE_COORDINATES,
  TURRET_LANDMARKS,
} from '#shared/utils/mapCoordinates'
import {
  getMapEventLocation,
  isRecentMapEvent,
  type MapEventLocation,
  normalizeMapTurretId,
} from '#shared/utils/mapEvents'
import { useFlashAlerts } from '../composables/useFlashAlerts'

const props = withDefaults(
  defineProps<{
    gameData: RiotAllGameData | null
    blueEconomy?: TeamEconomySummary
    redEconomy?: TeamEconomySummary
    diffEvents?: GameDiffEvent[]
    variant?: 'dashboard' | 'immersive'
    selectedEvent?: GameDiffEvent | null
    isMock?: boolean
  }>(),
  { variant: 'dashboard', selectedEvent: null, isMock: false },
)

const { activeAlert } = useFlashAlerts()
const players = computed(() => props.gameData?.allPlayers || [])
const gameTime = computed(() => props.gameData?.gameData.gameTime ?? 0)
const focusedChampion = ref<string | null>(null)
const championDetailsId = `champion-map-details-${useId()}`
const selectedChampion = computed(() =>
  players.value.find((player) => player.summonerName === focusedChampion.value),
)
const destroyedTurretIds = computed(
  () =>
    new Set(
      [...getDestroyedTurretIds(props.gameData?.events?.Events || [])].map(normalizeMapTurretId),
    ),
)
const selectedLocation = computed(() =>
  props.selectedEvent ? getMapEventLocation(props.selectedEvent, players.value) : null,
)

interface MapPing {
  id: string
  title: string
  location: MapEventLocation
  source: 'live' | 'demo'
  team?: string
}

const livePings = ref<MapPing[]>([])
const pingTimers = new Map<string, ReturnType<typeof setTimeout>>()
let seenEventIds = new Set((props.diffEvents || []).map((event) => event.id))
let hasSnapshot = !!props.gameData
let previousGameTime = gameTime.value

function clearPings() {
  for (const timer of pingTimers.values()) clearTimeout(timer)
  pingTimers.clear()
  livePings.value = []
}

function addPing(ping: MapPing, duration = 6000) {
  const existingTimer = pingTimers.get(ping.id)
  if (existingTimer) clearTimeout(existingTimer)
  // Keep the board legible when several events arrive in the same poll.
  livePings.value = [...livePings.value.filter((entry) => entry.id !== ping.id), ping].slice(-3)
  pingTimers.set(
    ping.id,
    setTimeout(() => {
      livePings.value = livePings.value.filter((entry) => entry.id !== ping.id)
      pingTimers.delete(ping.id)
    }, duration),
  )
}

watch(
  [() => props.diffEvents, gameTime],
  ([events]) => {
    const currentEvents = events || []
    const currentIds = new Set(currentEvents.map((event) => event.id))
    // Loading an existing match (or restarting the demo) establishes a baseline.
    // Its historical events must never animate as though they just happened.
    if (!hasSnapshot || gameTime.value < previousGameTime) {
      hasSnapshot = !!props.gameData
      seenEventIds = currentIds
      previousGameTime = gameTime.value
      clearPings()
      return
    }
    for (const event of currentEvents) {
      if (seenEventIds.has(event.id) || !isRecentMapEvent(event, gameTime.value)) continue
      const location = getMapEventLocation(event, players.value)
      if (location)
        addPing({
          id: event.id,
          title: event.title,
          location,
          source: props.isMock ? 'demo' : 'live',
          team: event.team,
        })
    }
    seenEventIds = currentIds
    previousGameTime = gameTime.value
  },
  { deep: true },
)

watch(
  activeAlert,
  (alert, previousAlert) => {
    if (previousAlert?.id.startsWith('demo-')) {
      livePings.value = livePings.value.filter((entry) => entry.id !== previousAlert.id)
      const timer = pingTimers.get(previousAlert.id)
      if (timer) clearTimeout(timer)
      pingTimers.delete(previousAlert.id)
    }
    if (!alert) return

    const event = props.diffEvents?.find((entry) => entry.id === alert.id)
    if (event) {
      if (!isRecentMapEvent(event, gameTime.value)) return
      const location = getMapEventLocation(event, players.value)
      if (location)
        addPing(
          {
            id: alert.id,
            title: alert.title,
            location,
            source: props.isMock ? 'demo' : 'live',
            team: alert.team,
          },
          alert.durationMs,
        )
      return
    }

    // Demo objectives have a known landmark. Demo kills have no spatial data.
    if (!alert.id.startsWith('demo-')) return
    const location: MapEventLocation | null =
      alert.type === 'DRAGON'
        ? {
            ...OBJECTIVE_COORDINATES.DRAGON_PIT,
            kind: 'objective',
            label: 'Fosse du dragon',
            indicative: false,
          }
        : ['BARON', 'HERALD'].includes(alert.type)
          ? {
              ...OBJECTIVE_COORDINATES.BARON_PIT,
              kind: 'objective',
              label: 'Fosse du Baron / Héraut',
              indicative: false,
            }
          : null
    if (location)
      addPing(
        { id: alert.id, title: alert.title, location, source: 'demo', team: alert.team },
        alert.durationMs,
      )
  },
  { immediate: true },
)

onBeforeUnmount(clearPings)

const visiblePings = computed(() =>
  livePings.value.filter((ping) => ping.id !== props.selectedEvent?.id),
)
const roleNames: Record<string, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'Bot',
  UTILITY: 'Support',
}
const roleName = (player: RiotPlayer) => roleNames[player.position] || 'Rôle inconnu'
const pointStyle = (point: { x: number; y: number }) => ({
  left: `${point.x}%`,
  top: `${point.y}%`,
})
const cleanTitle = (title: string) =>
  title
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

function championLabel(player: RiotPlayer) {
  return `${player.championName}, ${roleName(player)}, équipe ${player.team === 'ORDER' ? 'bleue' : 'rouge'}, niveau ${player.level}${player.isDead ? ', éliminé' : ''}. Afficher les détails.`
}
</script>

<template>
  <div
    data-testid="tactical-minimap"
    class="tactical-map"
    :class="`tactical-map--${variant}`"
    role="region"
    aria-label="Carte tactique de la Faille de l'Invocateur"
    @keydown.esc="focusedChampion = null"
  >
    <img class="map-background" src="/assets/images/sr-map.png" alt="" draggable="false" />
    <div class="map-texture" aria-hidden="true"></div>

    <div class="map-coordinates" aria-hidden="true"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span></div>
    <span v-if="isMock" class="map-demo">Simulation</span>

    <div class="map-nexus team-blue" :style="pointStyle(OBJECTIVE_COORDINATES.BLUE_NEXUS)" aria-label="Nexus bleu">
      <span></span><small>BLUE</small>
    </div>
    <div class="map-nexus team-red" :style="pointStyle(OBJECTIVE_COORDINATES.RED_NEXUS)" aria-label="Nexus rouge">
      <span></span><small>RED</small>
    </div>

    <div data-testid="baron-pit-marker" class="map-objective map-objective--baron" :style="pointStyle(OBJECTIVE_COORDINATES.BARON_PIT)">
      <span class="objective-token"><img :src="getObjectiveIconUrl('baron', 'ORDER')" alt="" /></span>
      <span class="objective-name">Baron / Héraut</span>
    </div>
    <div data-testid="dragon-pit-marker" class="map-objective map-objective--dragon" :style="pointStyle(OBJECTIVE_COORDINATES.DRAGON_PIT)">
      <span class="objective-token"><img :src="getObjectiveIconUrl('dragon', 'ORDER')" alt="" /></span>
      <span class="objective-name">Dragon</span>
    </div>

    <div
      v-for="turret in TURRET_LANDMARKS"
      :key="turret.id"
      data-testid="turret-pin"
      class="map-turret"
      :class="[turret.team === 'ORDER' ? 'team-blue' : 'team-red', { 'is-destroyed': destroyedTurretIds.has(turret.id) }]"
      :style="pointStyle(turret)"
      :title="`Tour ${turret.lane} ${turret.team === 'ORDER' ? 'bleue' : 'rouge'}${destroyedTurretIds.has(turret.id) ? ' détruite' : ''}`"
    >
      <RvIcon v-if="destroyedTurretIds.has(turret.id)" name="close" :size="9" />
      <img v-else :src="getObjectiveIconUrl('tower', turret.team)" alt="" />
    </div>

    <button
      v-for="player in players"
      :key="player.summonerName"
      type="button"
      data-testid="champion-map-pin"
      class="champion-pin"
      :class="[player.team === 'ORDER' ? 'team-blue' : 'team-red', { 'is-dead': player.isDead, 'is-selected': focusedChampion === player.summonerName }]"
      :style="pointStyle(getChampionMapPosition(player.team, player.position))"
      :aria-label="championLabel(player)"
      :aria-pressed="focusedChampion === player.summonerName"
      :aria-controls="championDetailsId"
      @click="focusedChampion = player.summonerName"
      @focus="focusedChampion = player.summonerName"
    >
      <span class="champion-portrait">
        <img :src="getChampionIconUrl(player.championName)" alt="" />
        <span v-if="player.isDead" class="respawn-timer">{{ player.respawnTimer > 0 ? `${Math.ceil(player.respawnTimer)}s` : 'KO' }}</span>
      </span>
      <span v-if="!player.isDead" class="champion-level">{{ player.level }}</span>
      <span class="champion-name">{{ player.championName }}</span>
    </button>

    <div class="map-events" aria-live="polite" aria-atomic="false">
      <div
        v-for="ping in visiblePings"
        :key="ping.id"
        data-testid="map-event-ping"
        :data-event-kind="ping.location.kind"
        :data-event-source="ping.source"
        class="map-event"
        :class="[ping.team === 'CHAOS' ? 'team-red' : 'team-blue', { 'event-align-left': ping.location.x > 70, 'event-align-right': ping.location.x < 30, 'event-align-below': ping.location.y < 28 }]"
        :style="pointStyle(ping.location)"
        :aria-label="`${cleanTitle(ping.title)} · ${ping.location.label}`"
      >
        <span class="event-ring" aria-hidden="true"></span>
        <div class="event-label">
          <small><i></i>{{ ping.source === 'demo' ? 'Simulation' : 'À l’instant' }}</small>
          <strong>{{ cleanTitle(ping.title) }}</strong>
          <span v-if="ping.location.indicative">Repère par rôle · indicatif</span>
        </div>
      </div>
    </div>

    <div
      v-if="selectedLocation && selectedEvent"
      data-testid="map-selected-event"
      class="map-event map-event--selected"
      :class="{ 'event-align-left': selectedLocation.x > 70, 'event-align-right': selectedLocation.x < 30, 'event-align-below': selectedLocation.y < 28 }"
      :style="pointStyle(selectedLocation)"
    >
      <span class="event-ring" aria-hidden="true"></span>
      <div class="event-label">
        <small>Journal · {{ selectedEvent.formattedTime }}</small>
        <strong>{{ cleanTitle(selectedEvent.title) }}</strong>
        <span v-if="selectedLocation.indicative">Repère par rôle · indicatif</span>
      </div>
    </div>

    <div v-if="selectedEvent && !selectedLocation" class="map-unlocated-event" role="status">
      <strong>{{ cleanTitle(selectedEvent.title) }}</strong>
      <span>Aucune position disponible pour cet événement.</span>
    </div>

    <Transition name="map-details">
      <section v-if="selectedChampion" :id="championDetailsId" data-testid="champion-map-details" class="champion-details" aria-label="Détails du champion sélectionné">
        <div class="details-heading">
          <img :src="getChampionIconUrl(selectedChampion.championName)" alt="" />
          <div><strong>{{ selectedChampion.championName }}</strong><span>{{ roleName(selectedChampion) }} · Niveau {{ selectedChampion.level }}</span></div>
          <button type="button" class="details-close" aria-label="Fermer les détails du champion" @click="focusedChampion = null"><RvIcon name="close" :size="14" /></button>
        </div>
        <dl class="details-stats">
          <div><dt>K / D / A</dt><dd>{{ selectedChampion.scores.kills }} / {{ selectedChampion.scores.deaths }} / {{ selectedChampion.scores.assists }}</dd></div>
          <div><dt>CS</dt><dd>{{ selectedChampion.scores.creepScore }}</dd></div>
          <div><dt>État</dt><dd :class="selectedChampion.isDead ? 'text-dead' : 'text-alive'">{{ selectedChampion.isDead ? `${Math.ceil(selectedChampion.respawnTimer)}s` : 'En vie' }}</dd></div>
        </dl>
      </section>
    </Transition>

    <div class="map-position-note"><RvIcon name="crosshair" :size="12" /><span>Repères par rôle · positions indicatives</span></div>
  </div>
</template>

<style scoped>
.tactical-map {
  --blue: #5ad6e0;
  --red: #ee8396;
  --map-gold: #c5ab73;
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #081416;
  color: #dbe5e7;
  user-select: none;
}
.map-background { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .78; filter: saturate(.48) brightness(.67); pointer-events: none; }
.map-texture { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 32%, #050e16a6 100%), linear-gradient(#6aa6a509 1px, transparent 1px), linear-gradient(90deg, #6aa6a509 1px, transparent 1px); background-size: auto, 20% 20%, 20% 20%; box-shadow: inset 0 0 45px #04101980; }
.map-coordinates { position: absolute; inset: 9px 9% auto; display: flex; justify-content: space-between; font: 9px monospace; color: #b7c4c440; }
.map-demo { position: absolute; top: 13px; right: 13px; color: #c5ab73; background: #101719df; border: 1px solid #c5ab7340; border-radius: 4px; padding: 3px 6px; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; }
.team-blue { --team-color: var(--blue); }
.team-red { --team-color: var(--red); }
.map-nexus, .map-objective, .map-turret, .champion-pin, .map-event { position: absolute; transform: translate(-50%, -50%); }
.map-nexus { display: flex; align-items: center; flex-direction: column; color: var(--team-color); gap: 5px; }
.map-nexus > span { width: clamp(15px, 3.5cqw, 25px); aspect-ratio: 1; border: 1px solid var(--team-color); transform: rotate(45deg); background: color-mix(in srgb, var(--team-color) 12%, #07101a); box-shadow: 0 0 18px color-mix(in srgb, var(--team-color) 12%, transparent); }
.map-nexus small { font-size: clamp(7px, 1.35cqw, 10px); letter-spacing: .15em; }
.map-objective { z-index: 2; display: flex; align-items: center; flex-direction: column; gap: 5px; }
.map-objective--baron { --objective-color: #bcabe0; }
.map-objective--dragon { --objective-color: #ddba75; }
.objective-token { display: grid; place-items: center; width: clamp(25px, 5.5cqw, 40px); aspect-ratio: 1; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--objective-color) 55%, transparent); background: #101922ec; box-shadow: 0 3px 14px #0009; }
.objective-token img { width: 63%; height: 63%; object-fit: contain; }
.objective-name { padding: 2px 6px; border-radius: 3px; background: #091219e6; color: var(--objective-color); font-size: clamp(8px, 1.5cqw, 11px); font-weight: 600; white-space: nowrap; }
.map-turret { z-index: 1; width: clamp(11px, 2.2cqw, 17px); aspect-ratio: 1; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--team-color) 65%, transparent); color: var(--team-color); background: #0a1723; border-radius: 3px; box-shadow: 0 1px 5px #0008; }
.map-turret img { width: 75%; height: 75%; object-fit: contain; }
.map-turret.is-destroyed { opacity: .36; border-style: dashed; background: #09121b; }
.champion-pin { z-index: 4; width: clamp(25px, 5.8cqw, 43px); aspect-ratio: 1; border: 0; border-radius: 50%; padding: 0; background: none; color: var(--team-color); cursor: pointer; transition: filter .18s, box-shadow .18s; outline-offset: 4px; }
.champion-portrait { display: block; width: 100%; height: 100%; overflow: hidden; border: 2px solid var(--team-color); border-radius: 50%; background: #10212c; box-shadow: 0 2px 8px #000c; }
.champion-portrait img { width: 100%; height: 100%; object-fit: cover; }
.champion-pin:hover, .champion-pin:focus-visible, .champion-pin.is-selected { z-index: 6; outline: 2px solid #e6d5a9; }
.champion-pin.is-dead .champion-portrait { border-color: #6b7280; }
.champion-pin.is-dead img { filter: grayscale(1) brightness(.45); }
.respawn-timer { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: clamp(9px, 1.8cqw, 13px); font-weight: 700; text-shadow: 0 1px 4px #000; }
.champion-level { position: absolute; right: -3px; bottom: -2px; display: grid; place-items: center; min-width: 14px; height: 14px; padding: 0 2px; font-size: 9px; line-height: 1; color: #dcebed; background: #0c1a25; border: 1px solid var(--team-color); border-radius: 4px; }
.champion-name { position: absolute; top: calc(100% + 4px); left: 50%; transform: translateX(-50%); padding: 1px 4px; background: #08131bd9; color: #e3eef1; border-radius: 3px; font-size: clamp(8px, 1.45cqw, 11px); line-height: 1.35; white-space: nowrap; }
.map-events { position: absolute; inset: 0; pointer-events: none; }
.map-event { z-index: 8; width: 1px; height: 1px; pointer-events: none; }
.event-ring { position: absolute; width: clamp(55px, 14cqw, 95px); aspect-ratio: 1; border: 2px solid var(--team-color, var(--map-gold)); border-radius: 50%; transform: translate(-50%, -50%); background: radial-gradient(circle, transparent 30%, color-mix(in srgb, var(--team-color, var(--map-gold)) 15%, transparent)); box-shadow: 0 0 30px color-mix(in srgb, var(--team-color, var(--map-gold)) 25%, transparent); animation: event-pulse 1.8s ease-out infinite; }
.event-label { position: absolute; bottom: clamp(25px, 6cqw, 43px); left: 0; transform: translateX(-50%); display: flex; flex-direction: column; gap: 4px; width: max-content; max-width: min(225px, 55cqw); padding: 9px 12px; border: 1px solid color-mix(in srgb, var(--team-color, var(--map-gold)) 50%, transparent); border-radius: 6px; color: #ecf2f5; background: #08141df5; box-shadow: 0 8px 24px #0007; }
.event-label small { display: flex; align-items: center; gap: 5px; font-size: 8px; text-transform: uppercase; letter-spacing: .12em; color: var(--team-color, var(--map-gold)); }
.event-label small i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; }
.event-label strong { font-size: clamp(10px, 2cqw, 13px); line-height: 1.3; font-weight: 600; }
.event-label > span { font-size: 9px; color: #a8b8c4; }
.event-align-left .event-label { transform: translateX(-85%); }
.event-align-right .event-label { transform: translateX(-15%); }
.event-align-below .event-label { bottom: auto; top: clamp(25px, 6cqw, 43px); }
.map-event--selected { z-index: 7; }
.map-event--selected .event-ring { animation: none; border-style: dashed; box-shadow: none; }
.champion-details { position: absolute; left: 13px; bottom: 47px; z-index: 12; width: min(253px, calc(100% - 26px)); padding: 13px; border: 1px solid #ad966240; border-radius: 9px; background: #0a1723f5; box-shadow: 0 8px 28px #0008; backdrop-filter: blur(12px); }
.details-heading { display: flex; gap: 9px; align-items: center; }
.details-heading > img { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #697780; }
.details-heading > div { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.details-heading strong { font-size: 13px; font-weight: 600; }
.details-heading span { font-size: 10px; color: #9eacba; }
.details-close { display: grid; place-items: center; align-self: flex-start; width: 27px; height: 27px; padding: 0; border: 1px solid #ffffff12; border-radius: 5px; color: #aab6c0; background: #ffffff05; cursor: pointer; }
.details-close:hover { color: #fff; background: #ffffff10; }
.details-close:focus-visible { outline: 2px solid #c5ab73; outline-offset: 2px; }
.details-stats { display: flex; justify-content: space-between; gap: 14px; margin: 12px 0 0; padding-top: 9px; border-top: 1px solid #ffffff0c; }
.details-stats dt { font-size: 8px; text-transform: uppercase; letter-spacing: .08em; color: #8f9dad; }
.details-stats dd { margin: 4px 0 0; font-size: 12px; font-variant-numeric: tabular-nums; }
.text-dead { color: var(--red); }
.text-alive { color: var(--blue); }
.map-position-note { position: absolute; left: 12px; bottom: 11px; display: flex; align-items: center; gap: 6px; max-width: calc(100% - 24px); padding: 6px 8px; border: 1px solid #ffffff0a; border-radius: 5px; background: #08121beb; color: #a5b3bd; font-size: clamp(8px, 1.65cqw, 11px); pointer-events: none; }
.map-position-note svg { color: var(--map-gold); flex: none; }
.map-unlocated-event { position: absolute; z-index: 12; top: 34px; left: 12px; right: 12px; display: grid; gap: 4px; padding: 10px 12px; border: 1px solid #c8aa6e40; border-radius: 4px; background: #0a1723f5; font-size: 11px; color: #b6c3ce; }
.map-unlocated-event strong { color: #ddc99f; font-family: 'Rajdhani', sans-serif; font-size: 13px; }
.map-details-enter-active, .map-details-leave-active { transition: opacity .15s, transform .15s; }
.map-details-enter-from, .map-details-leave-to { opacity: 0; transform: translateY(5px); }
@keyframes event-pulse { 0% { opacity: .95; transform: translate(-50%, -50%) scale(.72); } 75%, 100% { opacity: .2; transform: translate(-50%, -50%) scale(1.15); } }
@container (max-width: 360px) { .champion-name { display: none; } .champion-level { min-width: 12px; height: 12px; font-size: 8px; } .objective-name { font-size: 8px; } .map-demo { top: 9px; right: 9px; font-size: 8px; } }
@media (prefers-reduced-motion: reduce) { .event-ring { animation: none; } .champion-pin, .map-details-enter-active, .map-details-leave-active { transition: none; } }
</style>
