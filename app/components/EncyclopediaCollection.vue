<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DataDragonItems, DataDragonRunes } from '#shared/types/dataDragon'
import { goldIcon, itemStatLines } from '~/utils/lolStats'

const props = defineProps<{ kind: 'items' | 'runes' }>()
const route = useRoute()
const isItems = props.kind === 'items'
const basePath = `/league/${props.kind}`
const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const { data, error, status, refresh } = useFetch<DataDragonItems | DataDragonRunes>(
  `/api/ddragon/${props.kind}`,
)
const search = ref('')
const filter = ref('all')

const items = computed(() => (isItems ? ((data.value as DataDragonItems | null)?.data ?? []) : []))
const paths = computed(() => (!isItems ? ((data.value as DataDragonRunes | null)?.data ?? []) : []))
const runes = computed(() =>
  paths.value.flatMap((path) =>
    path.runes.map((rune) => ({ ...rune, pathId: path.id, pathName: path.name })),
  ),
)
const categories = [
  { id: 'all', label: 'Toutes les catégories', tags: [] },
  {
    id: 'attack',
    label: 'Attaque',
    tags: ['Damage', 'AttackSpeed', 'CriticalStrike', 'LifeSteal', 'ArmorPenetration'],
  },
  { id: 'magic', label: 'Puissance', tags: ['SpellDamage', 'MagicPenetration'] },
  { id: 'defense', label: 'Défense', tags: ['Health', 'Armor', 'MagicResist', 'SpellBlock'] },
  { id: 'movement', label: 'Déplacement', tags: ['Boots', 'NonbootsMovement'] },
  { id: 'utility', label: 'Utilitaire', tags: ['Consumable', 'Trinket', 'Vision', 'Active'] },
]
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}
function plainText(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/@[A-Za-z0-9_]+@/g, '[valeur indisponible]')
}
function itemImage(icon: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${data.value?.version}/img/item/${encodeURIComponent(icon)}`
}
function runeImage(icon: string) {
  return /^perk-images\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.png$/.test(icon)
    ? `https://ddragon.leagueoflegends.com/cdn/img/${icon}`
    : ''
}
const filteredItems = computed(() => {
  const tags = categories.find((category) => category.id === filter.value)?.tags ?? []
  const query = normalize(search.value)
  return items.value
    .filter(
      (item) =>
        (!tags.length || item.tags.some((tag) => tags.includes(tag))) &&
        normalize(`${item.name} ${item.summary}`).includes(query),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
})
const filteredRunes = computed(() => {
  const query = normalize(search.value)
  return runes.value
    .filter(
      (rune) =>
        (filter.value === 'all' || String(rune.pathId) === filter.value) &&
        normalize(`${rune.name} ${rune.pathName}`).includes(query),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
})
const selectedItem = computed(() => items.value.find((item) => item.id === id.value))
const itemStats = computed(() => itemStatLines(selectedItem.value?.description ?? ''))
const itemDescription = computed(() =>
  plainText(
    itemStats.value.length
      ? (selectedItem.value?.description ?? '').replace(/<stats\b[^>]*>[\s\S]*?<\/stats>/i, '')
      : (selectedItem.value?.description ?? ''),
  ).trim(),
)
const selectedRune = computed(() => runes.value.find((rune) => String(rune.id) === id.value))
const relatedFrom = computed(
  () =>
    selectedItem.value?.from.flatMap(
      (itemId) => items.value.find((item) => item.id === itemId) ?? [],
    ) ?? [],
)
const relatedInto = computed(
  () =>
    selectedItem.value?.into.flatMap(
      (itemId) => items.value.find((item) => item.id === itemId) ?? [],
    ) ?? [],
)
const title = computed(() =>
  id.value
    ? (selectedItem.value?.name ?? selectedRune.value?.name ?? (isItems ? 'Objet' : 'Rune'))
    : isItems
      ? 'Objets'
      : 'Runes',
)
useHead({ title: computed(() => `${title.value} LoL — RiftVision`) })
function resetFilters() {
  search.value = ''
  filter.value = 'all'
}
const { page, pageCount, start, end } = usePagination(
  computed(() => filteredItems.value.length),
  [search, filter],
  48,
)
</script>

<template>
  <EncyclopediaLayout>
    <NuxtLink :to="id ? basePath : '/league'" class="encyclopedia-back">← {{ id ? isItems ? 'Retour aux objets' : 'Retour aux runes' : 'Retour à League of Legends' }}</NuxtLink>
    <GameCatalogBanner v-if="!id" game="league" eyebrow="Encyclopédie · League of Legends" :title="isItems ? 'Les objets' : 'Les runes'" :description="isItems ? 'Explorez les objets achetables dans la Faille de l’invocateur.' : 'Découvrez les runes et leurs voies.'" :badge="data ? `Données Data Dragon · ${data.version}` : undefined" />
    <div v-if="status === 'pending' || status === 'idle'" class="encyclopedia-notice" role="status">Chargement des {{ isItems ? 'objets' : 'runes' }}…</div>
    <div v-else-if="error || !data" class="encyclopedia-notice" role="alert">
      <p>Les données sont momentanément indisponibles.</p>
      <button type="button" class="rv-button" @click="refresh()">Réessayer</button>
    </div>
    <template v-else-if="!id">
      <div class="collection-filters">
        <label class="collection-field"><span>Rechercher {{ isItems ? 'un objet' : 'une rune' }}</span><input v-model="search" type="search" placeholder="Nom" /></label>
        <label class="collection-field collection-field--filter"><span>{{ isItems ? 'Catégorie' : 'Voie' }}</span>
          <select v-model="filter">
            <template v-if="isItems"><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.label }}</option></template>
            <template v-else><option value="all">Toutes les voies</option><option v-for="path in paths" :key="path.id" :value="String(path.id)">{{ path.name }}</option></template>
          </select>
        </label>
      </div>
      <p class="collection-count" role="status">{{ isItems ? filteredItems.length : filteredRunes.length }} {{ isItems ? 'objet(s)' : 'rune(s)' }}</p>
      <div v-if="isItems && filteredItems.length" id="catalog-results" tabindex="-1" class="collection-grid">
        <NuxtLink v-for="item in filteredItems.slice(start, end)" :key="item.id" :to="`${basePath}/${item.id}`" class="collection-card">
          <img class="collection-card__icon" :src="itemImage(item.icon)" alt="" loading="lazy" /><span><strong>{{ item.name }}</strong><small v-if="item.summary" class="collection-summary">{{ item.summary }}</small><small class="collection-price"><img :src="goldIcon" alt="" /> {{ item.totalGold }} PO</small></span><span class="collection-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else-if="!isItems && filteredRunes.length" class="collection-grid">
        <NuxtLink v-for="rune in filteredRunes" :key="rune.id" :to="`${basePath}/${rune.id}`" class="collection-card">
          <img v-if="runeImage(rune.icon)" :src="runeImage(rune.icon)" alt="" loading="lazy" /><span><strong>{{ rune.name }}</strong><small>{{ rune.pathName }}{{ rune.keystone ? ' · Rune fondamentale' : '' }}</small></span><span class="collection-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else class="encyclopedia-notice"><p>Aucun résultat ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button></div>
      <ResultsPagination v-if="isItems" v-model:page="page" :page-count="pageCount" />
    </template>
    <template v-else-if="selectedItem || selectedRune">
      <div v-if="selectedItem" class="collection-detail item-detail">
        <div class="detail-hero item-hero"><img :src="itemImage(selectedItem.icon)" alt="" /><div><p class="encyclopedia-kicker">OBJET · FAILLE DE L’INVOCATEUR</p><h1>{{ selectedItem.name }}</h1><p>{{ selectedItem.summary }}</p><div class="item-hero__meta"><span><img :src="goldIcon" alt="" /> {{ selectedItem.totalGold }} PO</span><span>Data Dragon · {{ data.version }}</span></div></div></div>
        <div class="item-detail-grid">
          <section class="detail-panel item-description"><p class="encyclopedia-kicker">EFFETS DE L’OBJET</p><h2>Description</h2><div v-if="itemStats.length" class="item-stat-list"><div v-for="stat in itemStats" :key="stat.text"><img v-if="stat.icon" :src="stat.icon" alt="" /><span>{{ stat.text }}</span></div></div><p v-if="itemDescription" class="detail-description">{{ itemDescription }}</p><p v-else-if="!itemStats.length" class="detail-description">Description indisponible.</p></section>
          <aside class="item-sidebar"><section class="detail-panel item-prices"><p class="encyclopedia-kicker">VALEUR</p><h2>Prix</h2><dl class="detail-prices"><div><dt>Prix d’achat</dt><dd><img :src="goldIcon" alt="" /> {{ selectedItem.totalGold }} PO</dd></div><div><dt>Prix de vente</dt><dd><img :src="goldIcon" alt="" /> {{ selectedItem.sellGold }} PO</dd></div></dl></section>
          <section v-if="selectedItem.from.length || selectedItem.into.length" class="detail-panel item-recipe"><p class="encyclopedia-kicker">PROGRESSION</p><h2>Fabrication</h2><div v-if="relatedFrom.length" class="related"><h3>Composants</h3><NuxtLink v-for="item in relatedFrom" :key="item.id" :to="`${basePath}/${item.id}`"><img :src="itemImage(item.icon)" alt="" /><span>{{ item.name }}</span></NuxtLink></div><div v-if="relatedInto.length" class="related"><h3>Entre dans la composition de</h3><NuxtLink v-for="item in relatedInto" :key="item.id" :to="`${basePath}/${item.id}`"><img :src="itemImage(item.icon)" alt="" /><span>{{ item.name }}</span></NuxtLink></div><p v-if="relatedFrom.length < selectedItem.from.length || relatedInto.length < selectedItem.into.length" class="related-note">Certains composants ou améliorations ne sont pas affichés car ils ne figurent pas parmi les objets achetables de la Faille.</p></section></aside>
        </div>
      </div>
      <div v-else-if="selectedRune" class="collection-detail">
        <div class="detail-hero"><img v-if="runeImage(selectedRune.icon)" :src="runeImage(selectedRune.icon)" alt="" /><div><p class="encyclopedia-kicker">{{ selectedRune.pathName }} · {{ selectedRune.keystone ? 'RUNE FONDAMENTALE' : 'RUNE' }}</p><h1>{{ selectedRune.name }}</h1><p>{{ plainText(selectedRune.shortDescription) }}</p><span class="collection-version">Données Data Dragon · {{ data.version }}</span></div></div>
        <section class="detail-panel"><h2>Description</h2><p class="detail-description">{{ plainText(selectedRune.longDescription) || 'Description indisponible.' }}</p></section>
      </div>
    </template>
    <div v-else class="encyclopedia-notice" role="alert">{{ isItems ? 'Cet objet est introuvable dans la Faille.' : 'Cette rune est introuvable.' }}</div>
  </EncyclopediaLayout>
</template>

<style scoped>
.detail-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.detail-hero p:not(.encyclopedia-kicker) { margin: 0; color: #b8c5cf; line-height: 1.5; }
.collection-version, .collection-count { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.collection-filters { display: flex; flex-wrap: wrap; gap: 14px; padding: 18px; border: 1px solid #ffffff19; border-radius: 6px; background: #0c1824; }
.collection-field { display: flex; flex: 1 1 250px; flex-direction: column; gap: 8px; color: #c5d0d8; font: 600 13px 'Rajdhani', sans-serif; }
.collection-field--filter { flex: 0 1 230px; }
.collection-field input, .collection-field select { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #394957; border-radius: 4px; background: #07111b; color: #edf0f4; font: 14px 'Segoe UI', sans-serif; }
.collection-field input::placeholder { color: #9caab5; }
.collection-count { margin: 22px 0 12px; }
.collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.collection-card { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 14px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #f0f2f2; text-decoration: none; }
.collection-card:hover, .collection-card:focus-visible { border-color: #c8aa6e; background: #122333; }
.collection-card img { flex: 0 0 48px; width: 48px; height: 48px; object-fit: contain; border-radius: 4px; }
.collection-card > span:not(.collection-arrow) { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 4px; }
.collection-card strong { font: 700 16px/1.15 'Rajdhani', sans-serif; }
.collection-card small { color: #b7c2cb; line-height: 1.3; }
.collection-arrow { color: #d6bb83; }
.collection-detail { max-width: none; }
.detail-hero { display: flex; align-items: center; gap: 24px; margin-top: 30px; padding: 28px; border: 1px solid #c8aa6e33; border-radius: 6px; background: linear-gradient(120deg, #122538, #091521); }
.detail-hero img { width: 88px; height: 88px; flex: 0 0 88px; object-fit: contain; border-radius: 6px; }
.detail-hero .collection-version { display: block; margin-top: 14px; }
.detail-panel { margin-top: 18px; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; }
.detail-panel h2 { margin: 0 0 16px; color: #f1f1ee; font: 700 25px 'Rajdhani', sans-serif; }
.detail-description { margin: 0; color: #c6d0d9; line-height: 1.7; white-space: pre-line; }
.detail-prices { display: flex; flex-wrap: wrap; gap: 14px 36px; margin: 24px 0 0; }
.detail-prices dt { color: #aebbc8; font-size: 12px; }
.detail-prices dd { margin: 5px 0 0; color: #e3c78d; font-weight: 700; }
.related { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 14px; }
.related h3 { flex-basis: 100%; margin: 0; color: #bfcbd3; font: 700 15px 'Rajdhani', sans-serif; }
.related a { padding: 7px 10px; border: 1px solid #ffffff26; border-radius: 4px; color: #dfc58d; text-decoration: none; }
.related a:hover { border-color: #c8aa6e; }
.related-note { margin: 16px 0 0; color: #aebbc8; font-size: 13px; line-height: 1.5; }
.collection-card { min-height: 100px; background: linear-gradient(125deg, #182e40, #0a1724); transition: border-color .18s, background .18s; }
.collection-card .collection-summary { overflow: hidden; color: #aebec9; text-overflow: ellipsis; white-space: nowrap; }
.collection-card__icon { border: 1px solid #c8aa6e66; }
.collection-card .collection-price { display: flex; align-items: center; gap: 5px; color: #e3c78d; font-weight: 600; }
.collection-card .collection-price img, .item-hero__meta img, .detail-prices dd img { width: 15px; height: 15px; flex: 0 0 15px; object-fit: contain; }
.item-detail { max-width: none; }
.item-hero { min-height: 210px; background: radial-gradient(circle at 13% 50%, #b59a5638, transparent 30%), linear-gradient(115deg, #1a3041, #091521 75%); }
.item-hero > img { width: 112px; height: 112px; flex-basis: 112px; border: 1px solid #c8aa6e; box-shadow: 0 0 25px #c8aa6e26; }
.item-hero__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.item-hero__meta span { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border: 1px solid #c8aa6e55; border-radius: 4px; color: #e3c78d; background: #081420; font: 700 13px 'Rajdhani', sans-serif; }
.item-detail-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr); gap: 16px; align-items: start; }
.item-detail-grid .detail-panel { min-width: 0; }
.item-description { min-height: 220px; }
.item-stat-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
.item-stat-list > div { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border: 1px solid #b59e5c4d; border-radius: 4px; background: #172c3a; color: #e8d7b0; font-weight: 600; }
.item-stat-list img { width: 24px; height: 24px; object-fit: contain; }
.item-prices .detail-prices { margin-top: 0; }
.item-prices .detail-prices dd { display: flex; align-items: center; gap: 6px; }
.item-recipe .related a { display: inline-flex; align-items: center; gap: 8px; background: #091520; }
.item-recipe .related img { width: 32px; height: 32px; border-radius: 3px; }
@media (max-width: 800px) { .item-detail-grid { grid-template-columns: 1fr; gap: 0; } }
@media (max-width: 600px) { .item-hero > img { width: 72px; height: 72px; flex-basis: 72px; } }
@media (max-width: 600px) { .collection-field--filter { flex: 1 1 200px; } .collection-grid { grid-template-columns: 1fr; } .detail-hero { padding: 20px; gap: 16px; } .detail-hero img { width: 64px; height: 64px; flex-basis: 64px; } }
</style>
