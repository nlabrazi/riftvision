<script setup lang="ts">
import { computed } from 'vue'
import type { GameDiffEvent, TeamEconomySummary } from '#shared/types/diff'
import type { RiotAllGameData, RiotPlayer } from '#shared/types/riot'
import {
  getChampionIconUrl,
  getObjectiveIconUrl,
  getRoleIconUrl,
} from '#shared/utils/ddragon'
import {
  OBJECTIVE_COORDINATES,
  TURRET_LANDMARKS,
  getChampionMapPosition,
  getDestroyedTurretIds,
} from '#shared/utils/mapCoordinates'

const props = defineProps<{
  gameData: RiotAllGameData | null
  blueEconomy?: TeamEconomySummary
  redEconomy?: TeamEconomySummary
  diffEvents?: GameDiffEvent[]
}>()

const emit = defineEmits<(e: 'close') => void>()

const destroyedTurretIds = computed(() => {
  const events = props.gameData?.events?.Events || []
  return getDestroyedTurretIds(events)
})

const players = computed<RiotPlayer[]>(() => {
  return props.gameData?.allPlayers || []
})

const lastDragonKill = computed(() => {
  const events = props.gameData?.events?.Events || []
  return [...events].reverse().find((e) => e.EventName === 'DragonKill')
})

const lastBaronKill = computed(() => {
  const events = props.gameData?.events?.Events || []
  return [...events].reverse().find((e) => e.EventName === 'BaronKill')
})
</script>

<template>
  <div data-testid="tactical-minimap"
    class="relative overflow-hidden rounded-2xl border border-[#785a28]/70 bg-[#091428]/95 p-5 shadow-2xl backdrop-blur-md space-y-4">
    <!-- Header Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#785a28]/40 pb-3">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#010a13] border border-[#785a28] text-base">
          🗺️
        </div>
        <div>
          <h2 class="font-cinzel text-base font-bold text-gold-gradient tracking-wide">
            Faille de l'Invocateur — Carte Tactique
          </h2>
          <p class="font-rajdhani text-xs font-semibold text-slate-400">
            Projection 2D temps réel des positions, tourelles et objectifs neutres
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="text-xs px-2.5 py-1 rounded-lg font-rajdhani font-bold bg-[#010a13] border border-cyan-700/60 text-cyan-300">
          ● 10 Champions en jeu
        </span>
        <button type="button" data-testid="close-map-btn" @click="emit('close')"
          class="flex items-center gap-1 px-3 py-1 text-xs font-rajdhani font-bold rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition shadow">
          <span>✕</span> Masquer la Carte
        </button>
      </div>
    </div>

    <!-- Map Board Container -->
    <div class="relative mx-auto w-full max-w-[560px] aspect-square select-none overflow-hidden rounded-2xl border-2 border-[#785a28]/60 shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-black">
      <!-- Summoner's Rift Map Background Image -->
      <img src="/assets/images/sr-map.png" alt="Summoner's Rift Map"
        class="h-full w-full object-cover pointer-events-none opacity-90" />

      <!-- Subtle Hextech Vignette & Grid Lines -->
      <div class="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-transparent to-black/50"></div>
      <div class="absolute inset-0 pointer-events-none border border-[#c8aa6e]/20 rounded-2xl"></div>

      <!-- Blue Base (Order Nexus) -->
      <div class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none group z-10"
        :style="{ left: `${OBJECTIVE_COORDINATES.BLUE_NEXUS.x}%`, top: `${OBJECTIVE_COORDINATES.BLUE_NEXUS.y}%` }">
        <div class="h-6 w-6 rounded-full border border-cyan-400/80 bg-cyan-950/90 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.8)]">
          <span class="text-[10px] font-bold text-cyan-300">⚔️</span>
        </div>
        <span class="text-[9px] font-rajdhani font-bold text-cyan-300 bg-black/80 px-1 rounded mt-0.5 border border-cyan-900">
          Nexus Bleu
        </span>
      </div>

      <!-- Red Base (Chaos Nexus) -->
      <div class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none group z-10"
        :style="{ left: `${OBJECTIVE_COORDINATES.RED_NEXUS.x}%`, top: `${OBJECTIVE_COORDINATES.RED_NEXUS.y}%` }">
        <div class="h-6 w-6 rounded-full border border-rose-500/80 bg-rose-950/90 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.8)]">
          <span class="text-[10px] font-bold text-rose-300">⚔️</span>
        </div>
        <span class="text-[9px] font-rajdhani font-bold text-rose-300 bg-black/80 px-1 rounded mt-0.5 border border-rose-900">
          Nexus Rouge
        </span>
      </div>

      <!-- Baron / Herald Pit Landmark -->
      <div data-testid="baron-pit-marker"
        class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-15 cursor-pointer"
        :style="{ left: `${OBJECTIVE_COORDINATES.BARON_PIT.x}%`, top: `${OBJECTIVE_COORDINATES.BARON_PIT.y}%` }">
        <div class="relative h-7 w-7 rounded-full border-2 border-purple-400 bg-purple-950/90 flex items-center justify-center shadow-[0_0_14px_rgba(168,85,247,0.7)] group-hover:scale-110 transition-transform">
          <img :src="getObjectiveIconUrl('baron', 'ORDER')" alt="Baron" class="h-4 w-4 object-contain" />
          <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
        </div>
        <span class="text-[8px] font-rajdhani font-bold text-purple-200 bg-black/85 px-1 py-0.2 rounded border border-purple-800 shadow mt-0.5 whitespace-nowrap">
          {{ lastBaronKill ? 'Baron Éliminé' : 'Baron / Héraut' }}
        </span>
      </div>

      <!-- Dragon Pit Landmark -->
      <div data-testid="dragon-pit-marker"
        class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-15 cursor-pointer"
        :style="{ left: `${OBJECTIVE_COORDINATES.DRAGON_PIT.x}%`, top: `${OBJECTIVE_COORDINATES.DRAGON_PIT.y}%` }">
        <div class="relative h-7 w-7 rounded-full border-2 border-amber-400 bg-amber-950/90 flex items-center justify-center shadow-[0_0_14px_rgba(245,158,11,0.7)] group-hover:scale-110 transition-transform">
          <img :src="getObjectiveIconUrl('dragon', 'ORDER')" alt="Dragon" class="h-4 w-4 object-contain" />
          <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        </div>
        <span class="text-[8px] font-rajdhani font-bold text-amber-200 bg-black/85 px-1 py-0.2 rounded border border-amber-800 shadow mt-0.5 whitespace-nowrap">
          {{ lastDragonKill?.DragonType ? `Dragon ${lastDragonKill.DragonType}` : 'Fosse Dragon' }}
        </span>
      </div>

      <!-- Turrets Landmarks -->
      <div v-for="turret in TURRET_LANDMARKS" :key="turret.id" data-testid="turret-pin"
        class="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-opacity"
        :style="{ left: `${turret.x}%`, top: `${turret.y}%` }"
        :class="destroyedTurretIds.has(turret.id) ? 'opacity-30' : 'opacity-90'">
        <div class="relative flex items-center justify-center h-4 w-4 rounded-full border shadow"
          :class="turret.team === 'ORDER'
            ? (destroyedTurretIds.has(turret.id) ? 'border-slate-600 bg-slate-900' : 'border-cyan-400 bg-cyan-950 shadow-cyan-500/50')
            : (destroyedTurretIds.has(turret.id) ? 'border-slate-600 bg-slate-900' : 'border-rose-500 bg-rose-950 shadow-rose-500/50')">
          <span v-if="destroyedTurretIds.has(turret.id)" class="text-[8px] text-slate-500">✕</span>
          <img v-else :src="getObjectiveIconUrl('tower', turret.team)" alt="Tour" class="h-3 w-3 object-contain" />
        </div>
      </div>

      <!-- Champion Pins (10 Players) -->
      <div v-for="player in players" :key="player.summonerName" data-testid="champion-map-pin"
        class="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
        :style="{
          left: `${getChampionMapPosition(player.team, player.position).x}%`,
          top: `${getChampionMapPosition(player.team, player.position).y}%`,
        }">
        <div class="relative flex flex-col items-center">
          <!-- Champion Circle Token -->
          <div class="relative h-9 w-9 rounded-full border-2 overflow-hidden shadow-lg transition-transform group-hover:scale-125"
            :class="[
              player.team === 'ORDER'
                ? 'border-cyan-400 shadow-cyan-900/80'
                : 'border-rose-500 shadow-rose-900/80',
              player.isDead ? 'grayscale filter brightness-50 border-slate-600' : ''
            ]">
            <img :src="getChampionIconUrl(player.championName)" :alt="player.championName"
              class="h-full w-full object-cover" />

            <!-- Death Overlay with skull and timer -->
            <div v-if="player.isDead"
              class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
              <span class="text-[10px]">💀</span>
              <span v-if="player.respawnTimer > 0" class="text-[8px] font-bold text-rose-300 font-rajdhani leading-none">
                {{ Math.ceil(player.respawnTimer) }}s
              </span>
            </div>
          </div>

          <!-- Level Badge (when alive) -->
          <span v-if="!player.isDead"
            class="absolute -bottom-1 -right-1 rounded-full px-1 text-[8px] font-bold font-rajdhani border"
            :class="player.team === 'ORDER'
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
              : 'bg-rose-950 text-rose-300 border-rose-500'">
            {{ player.level }}
          </span>

          <!-- Role Icon Badge -->
          <span v-if="player.position"
            class="absolute -top-1 -left-1 h-3.5 w-3.5 rounded-full bg-[#010a13] border border-[#785a28] p-[1px] flex items-center justify-center">
            <img :src="getRoleIconUrl(player.position)" :alt="player.position" class="h-2.5 w-2.5 object-contain" />
          </span>

          <!-- Champion Name Label -->
          <span class="mt-0.5 text-[9px] font-rajdhani font-bold px-1 py-0.2 rounded border shadow whitespace-nowrap bg-black/80"
            :class="player.team === 'ORDER'
              ? 'border-cyan-900 text-cyan-200'
              : 'border-rose-900 text-rose-200'">
            {{ player.championName }}
          </span>

          <!-- Hover Tooltip Card -->
          <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col rounded-lg border border-[#785a28] bg-[#010a13]/95 p-2 shadow-xl z-30 pointer-events-none min-w-[130px]">
            <div class="flex items-center justify-between border-b border-[#785a28]/40 pb-1">
              <span class="font-bold text-xs text-[#c8aa6e]">{{ player.championName }}</span>
              <span class="text-[10px] font-rajdhani font-bold" :class="player.team === 'ORDER' ? 'text-cyan-400' : 'text-rose-400'">
                Niv. {{ player.level }}
              </span>
            </div>
            <div class="text-[10px] text-slate-300 mt-1 font-rajdhani space-y-0.5">
              <div>KDA : <span class="font-bold text-white">{{ player.scores.kills }}/{{ player.scores.deaths }}/{{ player.scores.assists }}</span></div>
              <div>CS : <span class="font-bold text-amber-300">{{ player.scores.creepScore }}</span></div>
              <div>Rôle : <span class="font-bold text-slate-200">{{ player.position || '—' }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Legend Bar -->
    <div class="flex flex-wrap items-center justify-center gap-4 text-xs font-rajdhani border-t border-[#785a28]/40 pt-3 text-slate-400">
      <div class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-cyan-400 border border-cyan-200 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
        <span class="font-bold text-cyan-300">Équipe Bleue (Order)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-rose-500 border border-rose-200 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
        <span class="font-bold text-rose-300">Équipe Rouge (Chaos)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <img :src="getObjectiveIconUrl('baron', 'ORDER')" alt="Baron" class="h-3 w-3 object-contain" />
        <span class="font-semibold text-purple-300">Baron / Héraut</span>
      </div>
      <div class="flex items-center gap-1.5">
        <img :src="getObjectiveIconUrl('dragon', 'ORDER')" alt="Dragon" class="h-3 w-3 object-contain" />
        <span class="font-semibold text-amber-300">Dragons</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px]">💀</span>
        <span class="font-semibold text-slate-300">Mort / En attente de réapparition</span>
      </div>
    </div>
  </div>
</template>
