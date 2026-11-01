<script setup lang="ts">
import { computed } from 'vue'
import type { DataDragonChampionDetails } from '#shared/types/dataDragon'
import type { ChampionAbilitySlot } from '#shared/types/championMedia'
import ChampionAbilities from '~/components/ChampionAbilities.vue'
import { lolStatIcon } from '~/utils/lolStats'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const endpoint = computed(() => `/api/ddragon/champions/${encodeURIComponent(id.value)}`)
const { data, status, error, refresh } = await useFetch<DataDragonChampionDetails>(endpoint)

useHead({ title: computed(() => `${data.value?.data.name ?? 'Champion'} — RiftVision`) })

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function plainText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
}

const abilities = computed(() => {
  const champion = data.value?.data
  if (!champion) return []
  const spells = Array.isArray(champion.spells) ? champion.spells : []
  return [champion.passive, ...spells].flatMap((ability, index) => {
    const slot = (['P', 'Q', 'W', 'E', 'R'] as ChampionAbilitySlot[])[index]
    if (!slot || !isRecord(ability) || typeof ability.name !== 'string') return []
    const filename =
      isRecord(ability.image) && typeof ability.image.full === 'string' ? ability.image.full : ''
    return [
      {
        slot,
        key: ['P', 'A', 'Z', 'E', 'R'][index] ?? '',
        name: ability.name,
        description: plainText(ability.description),
        filename,
        group: index === 0 ? ('passive' as const) : ('spell' as const),
      },
    ]
  })
})

const statistics = computed(() => {
  const stats = data.value?.data.stats
  if (!isRecord(stats)) return []
  return [
    { key: 'hp', label: 'Points de vie' },
    { key: 'attackdamage', label: 'Dégâts d’attaque' },
    { key: 'armor', label: 'Armure' },
    { key: 'spellblock', label: 'Résistance magique' },
    { key: 'movespeed', label: 'Vitesse de déplacement' },
    { key: 'attackrange', label: 'Portée d’attaque' },
  ].flatMap(({ key, label }) =>
    typeof stats[key] === 'number' && Number.isFinite(stats[key])
      ? [{ label, value: stats[key], icon: lolStatIcon(key) }]
      : [],
  )
})

const roles: Record<string, string> = {
  Assassin: 'Assassin',
  Fighter: 'Combattant',
  Mage: 'Mage',
  Marksman: 'Tireur',
  Support: 'Support',
  Tank: 'Tank',
}
</script>

<template>
  <EncyclopediaLayout>
    <NuxtLink to="/league/champions" class="encyclopedia-back">← Retour aux champions</NuxtLink>
    <div v-if="status === 'pending'" class="encyclopedia-notice" role="status">Chargement du champion…</div>
    <div v-else-if="error || !data" class="encyclopedia-notice" role="alert">
      <p>{{ error?.statusCode === 404 ? 'Ce champion est introuvable.' : 'La fiche est momentanément indisponible.' }}</p>
      <button v-if="error?.statusCode !== 404" type="button" class="rv-button" @click="refresh()">Réessayer</button>
    </div>
    <template v-else>
      <section class="champion-hero" :style="{ backgroundImage: `linear-gradient(90deg, #07111df7 2%, #07111dd9 50%, #07111d55), url(https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${data.data.id}_0.jpg)` }">
        <div class="champion-hero__copy">
          <p class="encyclopedia-kicker">CHAMPION · LEAGUE OF LEGENDS</p>
          <h1>{{ data.data.name }}</h1>
          <p class="champion-hero__title">{{ data.data.title }}</p>
          <div class="champion-roles"><span v-for="role in data.data.tags" :key="role">{{ roles[role] ?? role }}</span></div>
          <p class="champion-version">Données Data Dragon · {{ data.version }}</p>
        </div>
      </section>

      <div class="champion-detail-grid">
        <div>
          <section v-if="plainText(data.data.lore)" class="detail-section" aria-labelledby="story-title">
            <p class="encyclopedia-kicker">SON HISTOIRE</p>
            <h2 id="story-title">À propos</h2>
            <p class="champion-story">{{ plainText(data.data.lore) }}</p>
          </section>
          <section class="detail-section" aria-labelledby="abilities-title">
            <p class="encyclopedia-kicker">EN JEU</p>
            <h2 id="abilities-title">Compétences</h2>
            <ChampionAbilities v-if="abilities.length" :key="data.data.id" :champion-key="data.data.key" :champion-name="data.data.name" :version="data.version" :abilities="abilities" />
            <p v-else class="champion-story">Compétences indisponibles pour cette version.</p>
          </section>
        </div>
        <aside class="stats-panel" aria-labelledby="stats-title">
          <p class="encyclopedia-kicker">NIVEAU 1</p>
          <h2 id="stats-title">Statistiques de base</h2>
          <dl v-if="statistics.length"><div v-for="stat in statistics" :key="stat.label"><dt><img v-if="stat.icon" :src="stat.icon" alt="" />{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
          <p v-else>Statistiques indisponibles pour cette version.</p>
        </aside>
      </div>
    </template>
  </EncyclopediaLayout>
</template>

<style scoped>
.champion-hero { display: flex; align-items: end; min-height: 360px; margin-top: 22px; overflow: hidden; border: 1px solid #9e865134; border-radius: 7px; background-color: #101d2a; background-position: center 35%; background-size: cover; }
.champion-hero__copy { max-width: 580px; padding: clamp(26px, 4vw, 54px); }
.champion-hero h1 { margin: 10px 0 3px; color: #f2f1ec; font: 700 clamp(44px, 6vw, 76px)/1 'Rajdhani', sans-serif; }
.champion-hero__title { color: #e2ca98; font: 600 20px 'Rajdhani', sans-serif; }
.champion-roles { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 20px; }
.champion-roles span { padding: 5px 10px; border: 1px solid #c8aa6e60; border-radius: 3px; background: #101b24cc; color: #e4d2af; font: 700 12px 'Rajdhani', sans-serif; }
.champion-version { margin-top: 18px; color: #c3cbd0; font: 600 12px 'Rajdhani', sans-serif; }
.champion-detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(230px, 320px); align-items: start; gap: 28px; }
.detail-section { margin-top: 42px; }
.detail-section h2, .stats-panel h2 { margin: 8px 0 18px; color: #f1f1ee; font: 700 29px/1.1 'Rajdhani', sans-serif; }
.champion-story { max-width: 850px; color: #c0cbd4; line-height: 1.75; }
.stats-panel { margin-top: 42px; padding: 22px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0b1824; }
.stats-panel h2 { font-size: 24px; }
.stats-panel dl { margin: 0; }
.stats-panel dl div { display: flex; justify-content: space-between; gap: 14px; padding: 10px 0; border-top: 1px solid #ffffff14; color: #becad3; }
.stats-panel dt { display: flex; align-items: center; gap: 9px; }
.stats-panel dt img { width: 20px; height: 20px; object-fit: contain; }
.stats-panel dd { margin: 0; color: #f0e6d2; font-weight: 600; }
.stats-panel > p:last-child { color: #becad3; }
@media (max-width: 800px) { .champion-detail-grid { grid-template-columns: 1fr; gap: 0; } .stats-panel { margin-top: 28px; } }
@media (max-width: 600px) { .champion-hero { min-height: 300px; background-position: 60% center; } .champion-hero__copy { padding: 26px; } }
</style>
