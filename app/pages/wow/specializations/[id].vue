<script setup lang="ts">
import { computed } from 'vue'
import type { WowSpecializationResponse } from '#shared/types/wow'
import { wowClassArt } from '~/utils/wowClassArt'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const endpoint = computed(() => `/api/wow/specializations/${encodeURIComponent(id.value)}`)
const { data, status, error, refresh } = await useFetch<WowSpecializationResponse>(endpoint)
const spec = computed(() => data.value?.data)
const differentDescriptions = computed(() =>
  Boolean(
    spec.value?.descriptionMale &&
      spec.value?.descriptionFemale &&
      spec.value.descriptionMale !== spec.value.descriptionFemale,
  ),
)
useHead({ title: computed(() => `${spec.value?.name ?? 'Spécialisation WoW'} — RiftVision`) })
</script>

<template>
  <WowLayout>
    <NuxtLink v-if="spec" :to="`/wow/classes/${spec.class.id}`" class="wow-back">← Retour à {{ spec.class.name }}</NuxtLink>
    <NuxtLink v-else to="/wow" class="wow-back">← Retour aux classes WoW</NuxtLink>
    <div v-if="status === 'pending'" class="wow-notice" role="status">Chargement de la spécialisation…</div>
    <div v-else-if="error || !spec" class="wow-notice" role="alert"><p>{{ error?.statusCode === 404 ? 'Cette spécialisation est introuvable.' : 'La fiche est momentanément indisponible.' }}</p><button v-if="error?.statusCode !== 404" type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <section class="spec-hero"><img v-if="wowClassArt(spec.class.id)" class="spec-art" :src="wowClassArt(spec.class.id)!" alt="" /><img v-if="spec.icon" :src="spec.icon" alt="" /><span v-else class="spec-placeholder" aria-hidden="true">✦</span><div><p class="wow-kicker">SPÉCIALISATION · WORLD OF WARCRAFT RETAIL</p><h1>{{ spec.name }}</h1><p>{{ spec.class.name }}<template v-if="spec.role"> · {{ spec.role }}</template></p></div></section>
      <div class="spec-detail-grid"><section class="spec-details" aria-labelledby="spec-info-title"><p class="wow-kicker">EN JEU</p><h2 id="spec-info-title">Informations</h2><dl v-if="spec.role || spec.powerType || spec.primaryStat" class="spec-stats"><div v-if="spec.role"><dt>Rôle</dt><dd>{{ spec.role }}</dd></div><div v-if="spec.powerType"><dt>Ressource</dt><dd>{{ spec.powerType }}</dd></div><div v-if="spec.primaryStat"><dt>Caractéristique principale</dt><dd>{{ spec.primaryStat }}</dd></div></dl><p v-else>Les informations ne sont pas disponibles pour cette spécialisation.</p></section>
      <section class="spec-details" aria-labelledby="spec-description-title"><h2 id="spec-description-title">Présentation</h2><template v-if="differentDescriptions"><p class="spec-label">Description au masculin</p><p class="spec-description">{{ spec.descriptionMale }}</p><p class="spec-label">Description au féminin</p><p class="spec-description">{{ spec.descriptionFemale }}</p></template><p v-else-if="spec.descriptionMale || spec.descriptionFemale" class="spec-description">{{ spec.descriptionMale ?? spec.descriptionFemale }}</p><p v-else>La description n’est pas disponible pour cette spécialisation.</p></section></div>
      <WowSpecializationTalents :specialization-id="spec.id" />
      <p class="spec-source">Données : Blizzard · World of Warcraft Retail · Europe · Français</p>
    </template>
  </WowLayout>
</template>

<style scoped>
.spec-hero { position: relative; overflow: hidden; display: flex; align-items: center; gap: 24px; min-height: 190px; margin-top: 30px; padding: 28px; border: 1px solid #c8aa6e44; border-radius: 6px; background: linear-gradient(120deg, #302841, #091521 70%); }
.spec-hero > div { position: relative; z-index: 1; }
.spec-hero .spec-art { position: absolute; z-index: 0; top: 0; right: 0; width: min(45%, 420px); height: 100%; object-fit: cover; object-position: center 25%; opacity: .72; mask-image: linear-gradient(to right, transparent, #000 38%); }
.spec-hero img:not(.spec-art), .spec-placeholder { width: 88px; height: 88px; flex: 0 0 88px; border-radius: 6px; }
.spec-placeholder { display: grid; place-items: center; color: #d6bb83; background: #28313b; font-size: 34px; }
.spec-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.spec-hero p:not(.wow-kicker) { color: #d0d9df; line-height: 1.6; }
.spec-detail-grid { display: grid; grid-template-columns: minmax(250px, .8fr) minmax(0, 1.2fr); gap: 16px; margin-top: 18px; }
.spec-details { min-width: 0; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.spec-details h2 { margin: 8px 0 20px; color: #f1f1ee; font: 700 28px 'Rajdhani', sans-serif; }
.spec-stats { display: flex; flex-wrap: wrap; gap: 16px 36px; margin: 0; }
.spec-stats dt { color: #aebbc8; font-size: 12px; }
.spec-stats dd { margin: 5px 0 0; color: #e8d6b0; font-weight: 700; }
.spec-description { white-space: pre-line; line-height: 1.7; }
.spec-label { margin: 20px 0 0; color: #dfc58d; font: 700 14px 'Rajdhani', sans-serif; }
.spec-source { margin-top: 24px; color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 700px) { .spec-detail-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .spec-hero { gap: 16px; min-height: 150px; padding: 20px; } .spec-hero img:not(.spec-art), .spec-placeholder { width: 64px; height: 64px; flex-basis: 64px; } .spec-details { padding: 20px; } }
</style>
