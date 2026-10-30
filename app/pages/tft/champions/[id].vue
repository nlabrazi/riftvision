<script setup lang="ts">
import { computed } from 'vue'
import type { TftAbilityResponse, TftChampionsResponse } from '#shared/types/tft'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const { data, status, error, refresh } = await useFetch<TftChampionsResponse>(
  '/api/ddragon/tft/champions',
)
const unit = computed(() => data.value?.data.find((entry) => entry.id === id.value))
const abilityUrl = computed(() => `/api/tft/champions/${encodeURIComponent(id.value)}/ability`)
const {
  data: abilityData,
  status: abilityStatus,
  error: abilityError,
  refresh: refreshAbility,
} = await useLazyFetch<TftAbilityResponse>(abilityUrl, { server: false })
useHead({ title: computed(() => `${unit.value?.name ?? 'Unité TFT'} — RiftVision`) })
</script>

<template>
  <TftLayout>
    <NuxtLink to="/tft" class="tft-back">← Retour aux unités TFT</NuxtLink>
    <div v-if="status === 'pending'" class="tft-notice" role="status">Chargement de l’unité…</div>
    <div v-else-if="error || !data" class="tft-notice" role="alert"><p>La fiche est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else-if="unit">
      <section class="tft-unit">
        <img :src="`https://ddragon.leagueoflegends.com/cdn/${data.version}/img/tft-champion/${encodeURIComponent(unit.icon)}`" alt="" />
        <div><p class="tft-kicker">UNITÉ · TEAMFIGHT TACTICS</p><h1>{{ unit.name }}</h1><p>{{ unit.setNumber === null ? 'Set non identifié' : `Set ${unit.setNumber}` }}</p><span>Données Data Dragon · {{ data.version }}</span></div>
      </section>
      <section class="tft-details" aria-labelledby="tft-details-title">
        <h2 id="tft-details-title">Informations</h2>
        <dl><div><dt>Coût</dt><dd>{{ unit.cost }} PO{{ unit.cost === 0 ? ' (donnée Riot)' : '' }}</dd></div><div><dt>Palier</dt><dd>{{ unit.tier }}</dd></div></dl>
        <p>Les traits associés ne sont pas encore disponibles dans cette fiche. Le set indiqué est déduit de l’identifiant fourni par Riot.</p>
      </section>
      <section class="tft-details tft-ability" aria-labelledby="tft-ability-title">
        <h2 id="tft-ability-title">Compétence</h2>
        <p v-if="abilityStatus === 'pending' || abilityStatus === 'idle'" role="status">Chargement de la compétence…</p>
        <div v-else-if="abilityError" role="alert"><p>La compétence est momentanément indisponible.</p><button type="button" class="rv-button" @click="refreshAbility()">Réessayer</button></div>
        <template v-else-if="abilityData?.ability">
          <h3>{{ abilityData.ability.name }}</h3>
          <p class="tft-ability-description">{{ abilityData.ability.description }}</p>
          <p class="tft-ability-source">Données CommunityDragon · patch {{ abilityData.sourceVersion }}. Certaines valeurs dépendent du contexte de jeu et sont indiquées comme variables.</p>
        </template>
        <p v-else>La compétence de cette unité n’est pas disponible pour cette version.</p>
      </section>
    </template>
    <div v-else class="tft-notice" role="alert">Cette unité est introuvable.</div>
  </TftLayout>
</template>

<style scoped>
.tft-unit { display: flex; align-items: center; gap: 24px; max-width: 980px; margin-top: 30px; padding: 28px; border: 1px solid #c8aa6e33; border-radius: 6px; background: linear-gradient(120deg, #1c203b, #091521); }
.tft-unit img { width: 88px; height: 88px; flex: 0 0 88px; border-radius: 6px; }
.tft-unit h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.tft-unit p:not(.tft-kicker) { margin: 0; color: #c5d0d8; }
.tft-unit span { display: block; margin-top: 14px; color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
.tft-details { max-width: 980px; margin-top: 18px; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; }
.tft-details h2 { margin: 0 0 16px; color: #f1f1ee; font: 700 25px 'Rajdhani', sans-serif; }
.tft-details dl { display: flex; flex-wrap: wrap; gap: 14px 36px; margin: 0; }
.tft-details dt { color: #aebbc8; font-size: 12px; }
.tft-details dd { margin: 5px 0 0; color: #e3c78d; font-weight: 700; }
.tft-details p { margin: 24px 0 0; color: #c6d0d9; line-height: 1.6; }
.tft-ability h3 { margin: 0; color: #e3c78d; font: 700 20px 'Rajdhani', sans-serif; }
.tft-ability p { margin-top: 12px; }
.tft-ability-description { white-space: pre-line; }
.tft-ability .tft-ability-source { color: #aebbc8; font-size: 13px; }
.tft-ability button { margin-top: 14px; }
@media (max-width: 600px) { .tft-unit { padding: 20px; gap: 16px; } .tft-unit img { width: 64px; height: 64px; flex-basis: 64px; } }
</style>
