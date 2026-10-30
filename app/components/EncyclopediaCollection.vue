<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DataDragonItems, DataDragonRunes } from '#shared/types/dataDragon'

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
</script>

<template>
  <EncyclopediaLayout>
    <NuxtLink :to="id ? basePath : '/league'" class="encyclopedia-back">← {{ id ? isItems ? 'Retour aux objets' : 'Retour aux runes' : 'Retour à League of Legends' }}</NuxtLink>
    <div v-if="status === 'pending' || status === 'idle'" class="encyclopedia-notice" role="status">Chargement des {{ isItems ? 'objets' : 'runes' }}…</div>
    <div v-else-if="error || !data" class="encyclopedia-notice" role="alert">
      <p>Les données sont momentanément indisponibles.</p>
      <button type="button" class="rv-button" @click="refresh()">Réessayer</button>
    </div>
    <template v-else-if="!id">
      <div class="collection-heading">
        <div><p class="encyclopedia-kicker">ENCYCLOPÉDIE · LEAGUE OF LEGENDS</p><h1>{{ isItems ? 'Les objets' : 'Les runes' }}<span>.</span></h1><p>{{ isItems ? 'Explorez les objets achetables dans la Faille de l’invocateur.' : 'Découvrez les runes et leurs voies.' }}</p></div>
        <span class="collection-version">Données Data Dragon · {{ data.version }}</span>
      </div>
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
      <div v-if="isItems && filteredItems.length" class="collection-grid">
        <NuxtLink v-for="item in filteredItems" :key="item.id" :to="`${basePath}/${item.id}`" class="collection-card">
          <img :src="itemImage(item.icon)" alt="" loading="lazy" /><span><strong>{{ item.name }}</strong><small>{{ item.totalGold }} PO</small></span><span class="collection-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else-if="!isItems && filteredRunes.length" class="collection-grid">
        <NuxtLink v-for="rune in filteredRunes" :key="rune.id" :to="`${basePath}/${rune.id}`" class="collection-card">
          <img v-if="runeImage(rune.icon)" :src="runeImage(rune.icon)" alt="" loading="lazy" /><span><strong>{{ rune.name }}</strong><small>{{ rune.pathName }}{{ rune.keystone ? ' · Rune fondamentale' : '' }}</small></span><span class="collection-arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
      <div v-else class="encyclopedia-notice"><p>Aucun résultat ne correspond à votre recherche.</p><button type="button" class="rv-button" @click="resetFilters">Effacer les filtres</button></div>
    </template>
    <template v-else-if="selectedItem || selectedRune">
      <div v-if="selectedItem" class="collection-detail">
        <div class="detail-hero"><img :src="itemImage(selectedItem.icon)" alt="" /><div><p class="encyclopedia-kicker">OBJET · FAILLE DE L’INVOCATEUR</p><h1>{{ selectedItem.name }}</h1><p>{{ selectedItem.summary }}</p><span class="collection-version">Données Data Dragon · {{ data.version }}</span></div></div>
        <section class="detail-panel"><h2>Description</h2><p class="detail-description">{{ plainText(selectedItem.description) || 'Description indisponible.' }}</p><dl class="detail-prices"><div><dt>Prix d’achat</dt><dd>{{ selectedItem.totalGold }} PO</dd></div><div><dt>Prix de vente</dt><dd>{{ selectedItem.sellGold }} PO</dd></div></dl></section>
        <section v-if="selectedItem.from.length || selectedItem.into.length" class="detail-panel"><h2>Fabrication</h2><div v-if="relatedFrom.length" class="related"><h3>Composants</h3><NuxtLink v-for="item in relatedFrom" :key="item.id" :to="`${basePath}/${item.id}`">{{ item.name }}</NuxtLink></div><div v-if="relatedInto.length" class="related"><h3>Entre dans la composition de</h3><NuxtLink v-for="item in relatedInto" :key="item.id" :to="`${basePath}/${item.id}`">{{ item.name }}</NuxtLink></div><p v-if="relatedFrom.length < selectedItem.from.length || relatedInto.length < selectedItem.into.length" class="related-note">Certains composants ou améliorations ne sont pas affichés car ils ne figurent pas parmi les objets achetables de la Faille.</p></section>
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
.collection-heading { display: flex; justify-content: space-between; align-items: end; flex-wrap: wrap; gap: 20px; margin: 40px 0 30px; }
.collection-heading h1, .detail-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.collection-heading h1 span { color: #d6bb83; }
.collection-heading p:not(.encyclopedia-kicker), .detail-hero p:not(.encyclopedia-kicker) { margin: 0; color: #b8c5cf; line-height: 1.5; }
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
.collection-detail { max-width: 980px; }
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
@media (max-width: 600px) { .collection-heading { margin-top: 30px; } .collection-field--filter { flex: 1 1 200px; } .collection-grid { grid-template-columns: 1fr; } .detail-hero { padding: 20px; gap: 16px; } .detail-hero img { width: 64px; height: 64px; flex-basis: 64px; } }
</style>
