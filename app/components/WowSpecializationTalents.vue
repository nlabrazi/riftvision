<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { WowTalentNode, WowTalentsResponse } from '#shared/types/wow'

const props = defineProps<{ specializationId: number }>()
const endpoint = computed(() => `/api/wow/specializations/${props.specializationId}/talents`)
const { data, status, error, refresh } = await useLazyFetch<WowTalentsResponse>(endpoint, {
  server: false,
})
const selectedGroup = ref('class')
const selectedNode = ref<number | null>(null)
const detail = ref<HTMLElement | null>(null)
const groups = computed(() => data.value?.data?.groups.filter((group) => group.nodes.length) ?? [])
const group = computed(
  () => groups.value.find((item) => item.id === selectedGroup.value) ?? groups.value[0],
)
const node = computed(
  () => group.value?.nodes.find((item) => item.id === selectedNode.value) ?? null,
)

watch(
  () => props.specializationId,
  () => {
    selectedGroup.value = 'class'
    selectedNode.value = null
  },
)
function chooseGroup(id: string) {
  selectedGroup.value = id
  selectedNode.value = null
}
async function chooseNode(id: number) {
  selectedNode.value = id
  if (window.matchMedia('(max-width: 800px)').matches) {
    await nextTick()
    detail.value?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }
}
function name(item: WowTalentNode) {
  return item.options.length
    ? item.options.map((option) => option.name).join(' / ')
    : 'Talent indisponible'
}
</script>

<template>
  <section class="talents" aria-labelledby="wow-talents-title">
    <p class="wow-kicker">WORLD OF WARCRAFT RETAIL</p>
    <h2 id="wow-talents-title">Talents</h2>
    <p class="talents-intro">Explorez les talents de classe, de spécialisation et de héros disponibles dans les données de Blizzard.</p>
    <p v-if="status === 'idle' || status === 'pending'" class="talents-notice" role="status">Chargement des talents…</p>
    <div v-else-if="error" class="talents-notice" role="alert"><p>Les talents sont momentanément indisponibles.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <p v-else-if="!data?.data || !groups.length" class="talents-notice">Blizzard ne fournit pas d’arbre de talents pour cette spécialisation.</p>
    <template v-else>
      <div class="talents-groups" aria-label="Catégories de talents">
        <button v-for="item in groups" :key="item.id" type="button" :aria-pressed="group?.id === item.id" @click="chooseGroup(item.id)">{{ item.id.startsWith('hero-') ? `Héros · ${item.name}` : item.name }}</button>
      </div>
      <p class="talents-hint">Sélectionnez un talent pour consulter ses rangs et ses effets. Les choix sont indiqués lorsqu’un emplacement propose plusieurs talents.</p>
      <div class="talents-layout">
        <div class="talents-grid" :aria-label="`Talents : ${group?.name}`">
          <button v-for="item in group?.nodes" :key="item.id" type="button" class="talent-card" :class="{ 'talent-card--selected': node?.id === item.id }" :disabled="!item.options.length" :aria-pressed="node?.id === item.id" @click="chooseNode(item.id)">
            <span class="talent-card__image"><span aria-hidden="true">✦</span><img v-if="item.options[0]?.spellId" :src="`/api/wow/spells/${item.options[0].spellId}/icon`" alt="" loading="lazy" decoding="async" @error="($event.target as HTMLImageElement).hidden = true" /></span>
            <span class="talent-card__name">{{ name(item) }}</span><span v-if="item.options.length > 1" class="talent-card__choice">Choix</span>
          </button>
        </div>
        <div ref="detail" class="talent-detail" aria-live="polite">
          <template v-if="node">
            <p class="talent-detail__label">{{ node.options.length > 1 ? 'CHOIX DE TALENTS' : 'TALENT' }}</p>
            <div v-for="option in node.options" :key="option.id" class="talent-option">
              <div class="talent-option__title"><span class="talent-card__image"><span aria-hidden="true">✦</span><img v-if="option.spellId" :src="`/api/wow/spells/${option.spellId}/icon`" alt="" loading="lazy" @error="($event.target as HTMLImageElement).hidden = true" /></span><h3>{{ option.name }}</h3></div>
              <div v-for="rank in option.ranks" :key="rank.rank" class="talent-rank"><p class="talent-rank__label">Rang {{ rank.rank }}<span v-if="rank.defaultPoints"> · Accordé par défaut</span></p><p v-if="rank.description" class="talent-rank__description">{{ rank.description }}</p><p v-else>Effet non disponible auprès de Blizzard.</p></div>
            </div>
          </template>
          <p v-else>Sélectionnez un talent pour afficher ses détails.</p>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.talents { margin-top: 18px; padding: 24px; border: 1px solid #c8aa6e33; border-radius: 6px; background: linear-gradient(140deg, #142231, #0c1824 65%); }
.talents h2 { margin: 8px 0; color: #f1f1ee; font: 700 28px 'Rajdhani', sans-serif; }
.talents-intro, .talents-hint, .talents-notice, .talent-detail { color: #c6d0d9; line-height: 1.55; }
.talents-intro { margin: 0; }
.talents-notice { margin-top: 20px; }
.talents-notice button { margin-top: 10px; }
.talents-groups { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
.talents-groups button { padding: 9px 14px; border: 1px solid #c8aa6e44; border-radius: 5px; background: #0a1724; color: #e8d6b0; font: 700 15px 'Rajdhani', sans-serif; cursor: pointer; }
.talents-groups button[aria-pressed="true"] { border-color: #d5b771; background: #4b3d29; color: #fff2d3; }
.talents-hint { margin: 16px 0; font-size: 13px; }
.talents-layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(260px, .6fr); align-items: start; gap: 18px; }
.talents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
.talent-card { display: flex; align-items: center; flex-direction: column; gap: 6px; min-width: 0; min-height: 112px; padding: 10px 6px; border: 1px solid #ffffff1a; border-radius: 6px; background: #091725; color: #e5e8ea; text-align: center; cursor: pointer; }
.talent-card:hover, .talent-card:focus-visible, .talent-card--selected { border-color: #d6bb83; background: #213348; }
.talent-card:disabled { opacity: .55; cursor: default; }
.talent-card__image { position: relative; display: grid; place-items: center; overflow: hidden; flex: 0 0 48px; width: 48px; height: 48px; border: 1px solid #c8aa6e77; border-radius: 5px; background: #293544; color: #d6bb83; font-size: 22px; }
.talent-card__image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.talent-card__name { font: 600 13px/1.15 'Rajdhani', sans-serif; overflow-wrap: anywhere; }
.talent-card__choice { color: #e0bf7c; font: 700 11px 'Rajdhani', sans-serif; text-transform: uppercase; }
.talent-detail { position: sticky; top: 18px; padding: 18px; border: 1px solid #c8aa6e44; border-radius: 6px; background: #091521; }
.talent-detail > p { margin: 0; }
.talent-detail__label, .talent-rank__label { color: #d8b876; font: 700 12px 'Rajdhani', sans-serif; letter-spacing: .08em; }
.talent-option + .talent-option { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ffffff1c; }
.talent-option__title { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.talent-option h3 { margin: 0; color: #f4e7cb; font: 700 21px 'Rajdhani', sans-serif; }
.talent-rank { margin-top: 14px; }
.talent-rank p { margin: 0; }
.talent-rank__description { margin-top: 6px !important; white-space: pre-line; font-size: 14px; }
@media (max-width: 800px) { .talents-layout { grid-template-columns: 1fr; } .talent-detail { position: static; grid-row: 1; } }
@media (max-width: 600px) { .talents { padding: 20px; } .talents-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); } }
</style>
