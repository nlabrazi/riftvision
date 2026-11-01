<script setup lang="ts">
import { computed } from 'vue'
import type { WowClassResponse, WowSpecializationResponse } from '#shared/types/wow'
import WowClassFeatures from '~/components/WowClassFeatures.vue'
import { wowClassArt } from '~/utils/wowClassArt'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const endpoint = computed(() => `/api/wow/classes/${encodeURIComponent(id.value)}`)
const { data, status, error, refresh } = await useFetch<WowClassResponse>(endpoint)
const { data: specializationDetails } = await useLazyAsyncData(
  () => `wow-class-specializations-${id.value}`,
  async () => {
    const entries = data.value?.data.specializations ?? []
    const results = await Promise.all(
      entries.map((spec) =>
        $fetch<WowSpecializationResponse>(`/api/wow/specializations/${spec.id}`).catch(() => null),
      ),
    )
    return results.flatMap((result) => (result ? [result.data] : []))
  },
  { server: false, watch: [data] },
)
const specById = computed(
  () => new Map((specializationDetails.value ?? []).map((spec) => [spec.id, spec])),
)
useHead({ title: computed(() => `${data.value?.data.name ?? 'Classe WoW'} — RiftVision`) })
</script>

<template>
  <WowLayout>
    <NuxtLink to="/wow" class="wow-back">← Retour aux classes WoW</NuxtLink>
    <div v-if="status === 'pending'" class="wow-notice" role="status">Chargement de la classe…</div>
    <div v-else-if="error || !data" class="wow-notice" role="alert"><p>{{ error?.statusCode === 404 ? 'Cette classe est introuvable.' : 'La fiche est momentanément indisponible.' }}</p><button v-if="error?.statusCode !== 404" type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else>
      <section class="class-hero"><img v-if="wowClassArt(data.data.id)" class="class-art" :src="wowClassArt(data.data.id)!" alt="" /><img v-if="data.data.icon" :src="data.data.icon" alt="" /><span v-else class="class-icon-placeholder" aria-hidden="true">✦</span><div><p class="wow-kicker">CLASSE · WORLD OF WARCRAFT RETAIL</p><h1>{{ data.data.name }}</h1><p v-if="data.data.powerType">Ressource principale : {{ data.data.powerType }}</p></div></section>
      <div class="class-detail-grid"><section class="class-details" aria-labelledby="specializations-title"><p class="wow-kicker">EN JEU</p><h2 id="specializations-title">Spécialisations</h2><ul v-if="data.data.specializations.length" class="spec-list"><li v-for="spec in data.data.specializations" :key="spec.id"><NuxtLink :to="`/wow/specializations/${spec.id}`"><img v-if="specById.get(spec.id)?.icon" :src="specById.get(spec.id)?.icon ?? undefined" alt="" /><span v-else class="spec-icon-placeholder" aria-hidden="true">✦</span><span class="spec-copy"><strong>{{ spec.name }}</strong><small v-if="specById.get(spec.id)?.role">{{ specById.get(spec.id)?.role }}</small><small v-if="specById.get(spec.id)?.descriptionMale" class="spec-description">{{ specById.get(spec.id)?.descriptionMale }}</small></span><span class="spec-arrow" aria-hidden="true">↗</span></NuxtLink></li></ul><p v-else>Les spécialisations ne sont pas disponibles pour cette classe.</p></section>
      <WowClassFeatures :class-id="data.data.id" /></div>
      <p class="class-source">Données : Blizzard · World of Warcraft Retail · Europe · Français</p>
    </template>
  </WowLayout>
</template>

<style scoped>
.class-hero { position: relative; overflow: hidden; display: flex; align-items: center; gap: 24px; min-height: 190px; margin-top: 30px; padding: 28px; border: 1px solid #c8aa6e44; border-radius: 6px; background: linear-gradient(120deg, #302841, #091521 70%); }
.class-hero > div { position: relative; z-index: 1; }
.class-hero .class-art { position: absolute; z-index: 0; top: 0; right: 0; width: min(45%, 420px); height: 100%; object-fit: cover; object-position: center 25%; opacity: .72; mask-image: linear-gradient(to right, transparent, #000 38%); }
.class-hero img:not(.class-art), .class-icon-placeholder { width: 88px; height: 88px; flex: 0 0 88px; border-radius: 6px; }
.class-icon-placeholder { display: grid; place-items: center; color: #d6bb83; background: #28313b; font-size: 34px; }
.class-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.class-hero p:not(.wow-kicker) { color: #d0d9df; line-height: 1.6; }
.class-detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 320px); align-items: start; gap: 16px; margin-top: 18px; }
.class-details { min-width: 0; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.class-details h2 { margin: 8px 0 20px; color: #f1f1ee; font: 700 28px 'Rajdhani', sans-serif; }
.spec-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; padding: 0; margin: 0; list-style: none; }
.spec-list li { min-width: 0; }
.spec-list a { display: flex; align-items: flex-start; gap: 14px; height: 100%; min-height: 136px; padding: 18px; border: 1px solid #c8aa6e44; border-radius: 6px; background: linear-gradient(135deg, #1d2b3a, #0a1622); color: #e8d6b0; text-decoration: none; }
.spec-list a:hover, .spec-list a:focus-visible { border-color: #d6bb83; background: #1b3041; }
.spec-list img, .spec-icon-placeholder { width: 56px; height: 56px; flex: 0 0 56px; border-radius: 5px; }
.spec-icon-placeholder { display: grid; place-items: center; background: #283b4b; color: #d6bb83; font-size: 24px; }
.spec-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 6px; }
.spec-copy strong { color: #f5e7c7; font: 700 21px 'Rajdhani', sans-serif; }
.spec-copy small { color: #d2b680; font: 600 13px 'Rajdhani', sans-serif; }
.spec-copy .spec-description { display: -webkit-box; overflow: hidden; color: #b9c7d0; font: 13px/1.5 'Segoe UI', sans-serif; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
.spec-arrow { color: #d6bb83; }
.class-source { margin-top: 24px; color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 1150px) { .spec-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 800px) { .class-detail-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .spec-list { grid-template-columns: 1fr; } .class-hero { gap: 16px; min-height: 150px; padding: 20px; } .class-hero img:not(.class-art), .class-icon-placeholder { width: 64px; height: 64px; flex-basis: 64px; } .class-details { padding: 20px; } }
</style>
