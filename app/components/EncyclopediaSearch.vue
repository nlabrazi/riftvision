<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type {
  DataDragonChampions,
  DataDragonItems,
  DataDragonRunes,
} from '#shared/types/dataDragon'
import type { TftChampionsResponse, TftItemsResponse, TftTraitsResponse } from '#shared/types/tft'
import type { HotsHeroesResponse, HotsMapsResponse } from '#shared/types/hots'
import { hotsImage } from '~/utils/hotsImages'
import type {
  ValorantAgentsResponse,
  ValorantMapsResponse,
  ValorantWeaponsResponse,
} from '#shared/types/valorant'
import type {
  WowClassesResponse,
  WowRacesResponse,
  WowSpecializationsResponse,
} from '#shared/types/wow'
import { valorantNumber, valorantWeaponCategory } from '~/utils/valorantWeapons'

type SearchResult = { id: string; name: string; subtitle: string; to: string; image: string }
type SearchGroup = { label: string; results: SearchResult[] }

const trigger = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const isLoading = ref(false)
const query = ref('')
const failures = ref<string[]>([])
const champions = ref<DataDragonChampions | null>(null)
const items = ref<DataDragonItems | null>(null)
const runes = ref<DataDragonRunes | null>(null)
const tftChampions = ref<TftChampionsResponse | null>(null)
const tftTraits = ref<TftTraitsResponse | null>(null)
const tftItems = ref<TftItemsResponse | null>(null)
const valorantAgents = ref<ValorantAgentsResponse | null>(null)
const valorantWeapons = ref<ValorantWeaponsResponse | null>(null)
const valorantMaps = ref<ValorantMapsResponse | null>(null)
const hotsHeroes = ref<HotsHeroesResponse | null>(null)
const hotsMaps = ref<HotsMapsResponse | null>(null)
const wowClasses = ref<WowClassesResponse | null>(null)
const wowRaces = ref<WowRacesResponse | null>(null)
const wowSpecializations = ref<WowSpecializationsResponse | null>(null)
let lastLoad = 0

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘']/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

const normalizedQuery = computed(() => normalize(query.value))
const groups = computed<SearchGroup[]>(() => {
  const match = (text: string) =>
    normalizedQuery.value !== '' && normalize(text).includes(normalizedQuery.value)
  const championResults = Object.values(champions.value?.data ?? {})
    .filter((champion) => match(`${champion.name} ${champion.title}`))
    .map((champion) => ({
      id: champion.id,
      name: champion.name,
      subtitle: champion.title,
      to: `/league/champions/${champion.id}`,
      image: `https://ddragon.leagueoflegends.com/cdn/${champions.value?.version}/img/champion/${encodeURIComponent(champion.image.full)}`,
    }))
  const itemResults = (items.value?.data ?? [])
    .filter((item) => match(`${item.name} ${item.summary}`))
    .map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: `${item.totalGold} PO`,
      to: `/league/items/${item.id}`,
      image: `https://ddragon.leagueoflegends.com/cdn/${items.value?.version}/img/item/${encodeURIComponent(item.icon)}`,
    }))
  const runeResults = (runes.value?.data ?? []).flatMap((path) =>
    path.runes
      .filter((rune) => match(`${rune.name} ${path.name}`))
      .map((rune) => ({
        id: String(rune.id),
        name: rune.name,
        subtitle: path.name,
        to: `/league/runes/${rune.id}`,
        image: /^perk-images\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.png$/.test(rune.icon)
          ? `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`
          : '',
      })),
  )
  const tftChampionResults = (tftChampions.value?.data ?? [])
    .filter((unit) => match(`${unit.name} ${unit.id}`))
    .map((unit) => ({
      id: unit.id,
      name: unit.name,
      subtitle: `${unit.setNumber === null ? 'Set non identifié' : `Set ${unit.setNumber}`} · ${unit.cost} PO${unit.cost === 0 ? ' (donnée Riot)' : ''}`,
      to: `/tft/units/${encodeURIComponent(unit.id)}`,
      image: `https://ddragon.leagueoflegends.com/cdn/${tftChampions.value?.version}/img/tft-champion/${encodeURIComponent(unit.icon)}`,
    }))
  const tftTraitResults = (tftTraits.value?.data ?? [])
    .filter((trait) => match(`${trait.name} ${trait.id}`))
    .map((trait) => ({
      id: trait.id,
      name: trait.name,
      subtitle: trait.id,
      to: `/tft/traits?id=${encodeURIComponent(trait.id)}`,
      image: `https://ddragon.leagueoflegends.com/cdn/${tftTraits.value?.version}/img/tft-trait/${encodeURIComponent(trait.icon)}`,
    }))
  const tftItemResults = (tftItems.value?.data ?? [])
    .filter((item) => match(`${item.name} ${item.id}`))
    .map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: item.id,
      to: `/tft/items?id=${encodeURIComponent(item.id)}`,
      image: `https://ddragon.leagueoflegends.com/cdn/${tftItems.value?.version}/img/tft-item/${encodeURIComponent(item.icon)}`,
    }))
  const agentResults = (valorantAgents.value?.data ?? [])
    .filter((agent) => match(`${agent.name} ${agent.role ?? ''}`))
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      subtitle: agent.role ?? 'Rôle non renseigné',
      to: `/valorant/agents/${encodeURIComponent(agent.id)}`,
      image: agent.icon,
    }))
  const weaponResults = (valorantWeapons.value?.data ?? [])
    .filter((weapon) => match(`${weapon.name} ${valorantWeaponCategory(weapon.category)}`))
    .map((weapon) => ({
      id: weapon.id,
      name: weapon.name,
      subtitle: `${valorantWeaponCategory(weapon.category)}${weapon.cost === null ? '' : ` · ${valorantNumber(weapon.cost)} crédits`}`,
      to: `/valorant/weapons/${encodeURIComponent(weapon.id)}`,
      image: weapon.icon,
    }))
  const mapNameCounts = new Map<string, number>()
  for (const map of valorantMaps.value?.data ?? []) {
    const name = normalize(map.name)
    mapNameCounts.set(name, (mapNameCounts.get(name) ?? 0) + 1)
  }
  const mapResults = (valorantMaps.value?.data ?? [])
    .filter((map) => match(map.name))
    .map((map) => ({
      id: map.id,
      name: map.name,
      subtitle:
        (mapNameCounts.get(normalize(map.name)) ?? 0) > 1
          ? `Identifiant : ${map.id}`
          : (map.tacticalDescription ?? 'Carte Valorant'),
      to: `/valorant/maps/${encodeURIComponent(map.id)}`,
      image: map.splash ?? map.minimap ?? '',
    }))
  const hotsResults = (hotsHeroes.value?.data ?? [])
    .filter((hero) => match(`${hero.name} ${hero.title} ${hero.role}`))
    .map((hero) => ({
      id: hero.id,
      name: hero.name,
      subtitle: hero.role,
      to: `/hots/heroes/${encodeURIComponent(hero.id)}`,
      image: hotsImage('heroportraits', hero.portrait),
    }))
  const hotsMapResults = (hotsMaps.value?.data ?? [])
    .filter((map) => match(map.name))
    .map((map) => ({
      id: map.id,
      name: map.name,
      subtitle: 'Champ de bataille',
      to: `/hots/maps/${encodeURIComponent(map.id)}`,
      image: hotsImage('replaypreviews', map.preview),
    }))
  const wowClassResults = (wowClasses.value?.data ?? [])
    .filter((entry) => match(entry.name))
    .map((entry) => ({
      id: String(entry.id),
      name: entry.name,
      subtitle: 'Classe · Retail',
      to: `/wow/classes/${entry.id}`,
      image: entry.icon ?? '',
    }))
  const wowRaceResults = (wowRaces.value?.data ?? [])
    .filter((race) => match(`${race.name} ${race.faction?.name ?? ''}`))
    .map((race) => ({
      id: String(race.id),
      name: race.name,
      subtitle: `${race.faction?.name ?? 'Faction non renseignée'}${race.allied === true ? ' · Race alliée' : ''}`,
      to: `/wow/races/${race.id}`,
      image: '',
    }))
  const wowSpecializationResults = (wowSpecializations.value?.data ?? [])
    .filter((spec) => match(`${spec.name} ${spec.class.name}`))
    .map((spec) => ({
      id: String(spec.id),
      name: spec.name,
      subtitle: spec.class.name,
      to: `/wow/specializations/${spec.id}`,
      image: spec.icon ?? '',
    }))
  return [
    { label: 'Champions · LoL', results: championResults },
    { label: 'Objets · LoL', results: itemResults },
    { label: 'Runes · LoL', results: runeResults },
    { label: 'Unités · TFT', results: tftChampionResults },
    { label: 'Traits · TFT', results: tftTraitResults },
    { label: 'Objets · TFT', results: tftItemResults },
    { label: 'Agents · Valorant', results: agentResults },
    { label: 'Armes · Valorant', results: weaponResults },
    { label: 'Cartes · Valorant', results: mapResults },
    { label: 'Héros · Heroes of the Storm', results: hotsResults },
    { label: 'Champs de bataille · Heroes of the Storm', results: hotsMapResults },
    { label: 'Classes · WoW', results: wowClassResults },
    { label: 'Races · WoW', results: wowRaceResults },
    { label: 'Spécialisations · WoW', results: wowSpecializationResults },
  ].map((group) => ({
    ...group,
    results: group.results.sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  }))
})
const totalResults = computed(() =>
  groups.value.reduce((total, group) => total + group.results.length, 0),
)

async function loadData() {
  if (isLoading.value) return
  isLoading.value = true
  if (lastLoad && Date.now() - lastLoad >= 60 * 60 * 1000) {
    champions.value = null
    items.value = null
    runes.value = null
    tftChampions.value = null
    tftTraits.value = null
    tftItems.value = null
    valorantAgents.value = null
    valorantWeapons.value = null
    valorantMaps.value = null
    hotsHeroes.value = null
    hotsMaps.value = null
    wowClasses.value = null
    wowRaces.value = null
    wowSpecializations.value = null
  }
  failures.value = []
  const requests: { label: string; run: () => Promise<void> }[] = []
  if (!champions.value)
    requests.push({
      label: 'champions',
      run: async () => {
        champions.value = await $fetch<DataDragonChampions>('/api/ddragon/champions')
      },
    })
  if (!items.value)
    requests.push({
      label: 'objets',
      run: async () => {
        items.value = await $fetch<DataDragonItems>('/api/ddragon/items')
      },
    })
  if (!runes.value)
    requests.push({
      label: 'runes',
      run: async () => {
        runes.value = await $fetch<DataDragonRunes>('/api/ddragon/runes')
      },
    })
  if (!tftChampions.value)
    requests.push({
      label: 'unités TFT',
      run: async () => {
        tftChampions.value = await $fetch<TftChampionsResponse>('/api/ddragon/tft/champions')
      },
    })
  if (!tftTraits.value)
    requests.push({
      label: 'traits TFT',
      run: async () => {
        tftTraits.value = await $fetch<TftTraitsResponse>('/api/ddragon/tft/traits')
      },
    })
  if (!tftItems.value)
    requests.push({
      label: 'objets TFT',
      run: async () => {
        tftItems.value = await $fetch<TftItemsResponse>('/api/ddragon/tft/items')
      },
    })
  if (!valorantAgents.value)
    requests.push({
      label: 'agents Valorant',
      run: async () => {
        valorantAgents.value = await $fetch<ValorantAgentsResponse>('/api/valorant/agents')
      },
    })
  if (!valorantWeapons.value)
    requests.push({
      label: 'armes Valorant',
      run: async () => {
        valorantWeapons.value = await $fetch<ValorantWeaponsResponse>('/api/valorant/weapons')
      },
    })
  if (!valorantMaps.value)
    requests.push({
      label: 'cartes Valorant',
      run: async () => {
        valorantMaps.value = await $fetch<ValorantMapsResponse>('/api/valorant/maps')
      },
    })
  if (!hotsHeroes.value)
    requests.push({
      label: 'héros Heroes of the Storm',
      run: async () => {
        hotsHeroes.value = await $fetch<HotsHeroesResponse>('/api/hots/heroes')
      },
    })
  if (!hotsMaps.value)
    requests.push({
      label: 'champs de bataille Heroes of the Storm',
      run: async () => {
        hotsMaps.value = await $fetch<HotsMapsResponse>('/api/hots/maps')
      },
    })
  if (!wowClasses.value)
    requests.push({
      label: 'classes WoW',
      run: async () => {
        wowClasses.value = await $fetch<WowClassesResponse>('/api/wow/classes')
      },
    })
  if (!wowRaces.value)
    requests.push({
      label: 'races WoW',
      run: async () => {
        wowRaces.value = await $fetch<WowRacesResponse>('/api/wow/races')
      },
    })
  if (!wowSpecializations.value)
    requests.push({
      label: 'spécialisations WoW',
      run: async () => {
        wowSpecializations.value = await $fetch<WowSpecializationsResponse>(
          '/api/wow/specializations',
        )
      },
    })
  const results = await Promise.allSettled(requests.map((request) => request.run()))
  failures.value = requests
    .filter((_, index) => results[index]?.status === 'rejected')
    .map((request) => request.label)
  lastLoad = Date.now()
  isLoading.value = false
}

async function openSearch() {
  isOpen.value = true
  query.value = ''
  await nextTick()
  input.value?.focus()
  void loadData()
}

function closeSearch(restoreFocus = true) {
  isOpen.value = false
  if (restoreFocus) void nextTick(() => trigger.value?.focus())
}

function handleDialogKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSearch()
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return
  const focusable = Array.from(
    dialog.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled])',
    ),
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
</script>

<template>
  <button ref="trigger" type="button" class="rv-button search-trigger" aria-haspopup="dialog" @click="openSearch">
    <span aria-hidden="true">⌕</span> Rechercher
  </button>
  <Teleport to="body">
    <div v-if="isOpen" class="search-backdrop" @click.self="closeSearch()">
      <section ref="dialog" class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title" @keydown="handleDialogKey">
        <div class="search-dialog__heading"><div><p>ENCYCLOPÉDIE · LOL, TFT, VALORANT, HOTS &amp; WOW</p><h2 id="search-title">Rechercher</h2></div><button type="button" class="search-close" aria-label="Fermer la recherche" @click="closeSearch()">×</button></div>
        <label class="search-label" for="encyclopedia-search-input">Rechercher dans les encyclopédies</label>
        <input id="encyclopedia-search-input" ref="input" v-model="query" type="search" autocomplete="off" placeholder="Ex. Ahri, Bottes, Jett" />
        <div class="search-content">
          <p v-if="isLoading" class="search-message" role="status">Chargement des données…</p>
          <div v-if="failures.length && !isLoading" class="search-error" role="alert"><p>Données indisponibles : {{ failures.join(', ') }}. Les résultats des catégories chargées restent accessibles.</p><button type="button" class="rv-button" @click="loadData">Réessayer</button></div>
          <p v-if="!normalizedQuery" class="search-message">Saisissez un nom ou un titre pour commencer.</p>
          <template v-else>
            <p v-if="!isLoading" class="search-message" role="status">{{ totalResults }} résultat{{ totalResults > 1 ? 's' : '' }}{{ failures.length ? ' dans les catégories disponibles' : '' }}</p>
            <p v-if="!isLoading && !totalResults && !failures.length" class="search-message">Aucun résultat. Essayez un autre terme.</p>
            <section v-for="group in groups" v-show="group.results.length" :key="group.label" class="search-group" :aria-label="group.label">
              <h3>{{ group.label }} <span>{{ group.results.length }}</span></h3>
              <NuxtLink v-for="result in group.results.slice(0, 8)" :key="result.id" :to="result.to" class="search-result" @click="closeSearch(false)">
                <img v-if="result.image" :src="result.image" alt="" loading="lazy" /><span><strong>{{ result.name }}</strong><small>{{ result.subtitle }}</small></span><span aria-hidden="true">↗</span>
              </NuxtLink>
              <p v-if="group.results.length > 8" class="search-more">{{ group.results.length - 8 }} résultat(s) supplémentaires : précisez votre recherche.</p>
            </section>
          </template>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.search-trigger span { font-size: 20px; line-height: 1; }
.search-backdrop { position: fixed; z-index: 1000; inset: 0; display: flex; justify-content: center; align-items: flex-start; padding: min(10vh, 80px) 16px 20px; background: #020811d9; }
.search-dialog { display: flex; flex-direction: column; width: min(100%, 650px); max-height: calc(90vh - 20px); padding: 24px; overflow: hidden; border: 1px solid #c8aa6e55; border-radius: 8px; background: #0a1622; box-shadow: 0 20px 70px #000b; }
.search-dialog__heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
.search-dialog__heading p { margin: 0 0 8px; color: #c8aa6e; font: 700 10px 'Rajdhani', sans-serif; letter-spacing: .16em; }
.search-dialog__heading h2 { margin: 0; color: #f0f2f2; font: 700 30px 'Rajdhani', sans-serif; }
.search-close { width: 36px; height: 36px; border: 1px solid #ffffff2a; border-radius: 4px; background: #132331; color: #e4e8ed; font-size: 24px; line-height: 1; }
.search-label { margin: 20px 0 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.search-dialog input { flex: none; width: 100%; min-height: 46px; padding: 10px 12px; border: 1px solid #526371; border-radius: 4px; background: #06101a; color: #edf0f4; font: 15px 'Segoe UI', sans-serif; }
.search-dialog input::placeholder { color: #9caab5; }
.search-content { overflow-y: auto; padding: 4px 2px 0; }
.search-message, .search-more { margin: 16px 0; color: #b4c2cd; font-size: 13px; line-height: 1.5; }
.search-error { margin-top: 16px; padding: 12px; border: 1px solid #edbb6755; border-radius: 4px; background: #372b1a66; color: #f0d5a9; }
.search-error p { margin: 0 0 10px; line-height: 1.4; }
.search-group { padding-top: 12px; }
.search-group h3 { display: flex; gap: 8px; margin: 0 0 8px; color: #e7d6b1; font: 700 15px 'Rajdhani', sans-serif; }
.search-group h3 span { color: #a6b6c2; }
.search-result { display: flex; align-items: center; gap: 12px; padding: 9px; border: 1px solid transparent; border-radius: 4px; color: #eaf0f2; text-decoration: none; }
.search-result:hover, .search-result:focus-visible { border-color: #c8aa6e88; background: #162838; }
.search-result img { width: 40px; height: 40px; flex: 0 0 40px; object-fit: contain; border-radius: 4px; }
.search-result > span:not(:last-child) { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 3px; }
.search-result strong { font: 700 16px 'Rajdhani', sans-serif; }
.search-result small { color: #b2c0ca; overflow-wrap: anywhere; }
@media (max-width: 600px) { .search-backdrop { padding-top: 20px; } .search-dialog { max-height: calc(100vh - 40px); padding: 18px; } }
</style>
