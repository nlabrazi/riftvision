<script setup lang="ts">
import { computed } from 'vue'
import type { ValorantWeaponsResponse } from '#shared/types/valorant'
import { valorantNumber, valorantWeaponCategory } from '~/utils/valorantWeapons'

const route = useRoute()
const id = computed(() => String(route.params.id ?? '').toLowerCase())
const { data, status, error, refresh } =
  await useFetch<ValorantWeaponsResponse>('/api/valorant/weapons')
const weapon = computed(() => data.value?.data.find((entry) => entry.id === id.value))
useHead({ title: computed(() => `${weapon.value?.name ?? 'Arme Valorant'} — RiftVision`) })
</script>

<template>
  <ValorantLayout>
    <NuxtLink to="/valorant/weapons" class="val-back">← Retour aux armes Valorant</NuxtLink>
    <div v-if="status === 'pending'" class="val-notice" role="status">Chargement de l’arme…</div>
    <div v-else-if="error || !data" class="val-notice" role="alert"><p>La fiche est momentanément indisponible.</p><button type="button" class="rv-button" @click="refresh()">Réessayer</button></div>
    <template v-else-if="weapon">
      <section class="weapon-hero"><div><p class="val-kicker">ARME · VALORANT</p><h1>{{ weapon.name }}</h1><p>{{ valorantWeaponCategory(weapon.category) }}</p></div><img :src="weapon.icon" alt="" /></section>
      <section class="weapon-details" aria-labelledby="weapon-stats-title">
        <p class="val-kicker">EN JEU</p><h2 id="weapon-stats-title">Caractéristiques</h2>
        <dl class="weapon-stats">
          <div v-if="weapon.cost !== null"><dt>Prix</dt><dd>{{ valorantNumber(weapon.cost) }} crédits</dd></div>
          <div v-if="weapon.magazine !== null"><dt>Chargeur</dt><dd>{{ valorantNumber(weapon.magazine) }}</dd></div>
          <div v-if="weapon.fireRate !== null"><dt>Cadence</dt><dd>{{ valorantNumber(weapon.fireRate) }} tirs/s</dd></div>
          <div v-if="weapon.reloadSeconds !== null"><dt>Rechargement</dt><dd>{{ valorantNumber(weapon.reloadSeconds) }} s</dd></div>
          <div v-if="weapon.pelletCount !== null && weapon.pelletCount > 1"><dt>Projectiles par tir</dt><dd>{{ valorantNumber(weapon.pelletCount) }}</dd></div>
        </dl>
        <p v-if="weapon.cost === null && weapon.magazine === null && weapon.fireRate === null && weapon.reloadSeconds === null">Les caractéristiques ne sont pas disponibles pour cette arme.</p>
      </section>
      <section v-if="weapon.damageRanges.length" class="weapon-details" aria-labelledby="weapon-damage-title">
        <h2 id="weapon-damage-title">Dégâts par distance</h2>
        <p class="weapon-note">Valeurs indiquées par la source pour le tir principal<template v-if="weapon.pelletCount !== null && weapon.pelletCount > 1"> ; les armes à plusieurs projectiles peuvent infliger ces dégâts plusieurs fois par tir</template>.</p>
        <div class="table-scroll"><table><thead><tr><th>Distance</th><th>Tête</th><th>Corps</th><th>Jambes</th></tr></thead><tbody><tr v-for="(range, index) in weapon.damageRanges" :key="index"><th scope="row">{{ valorantNumber(range.start) }}–{{ valorantNumber(range.end) }} m</th><td>{{ valorantNumber(range.head) }}</td><td>{{ valorantNumber(range.body) }}</td><td>{{ valorantNumber(range.leg) }}</td></tr></tbody></table></div>
      </section>
      <p class="weapon-source">Données et visuels : Valorant-API, source communautaire non officielle.</p>
    </template>
    <div v-else class="val-notice" role="alert">Cette arme est introuvable.</div>
  </ValorantLayout>
</template>

<style scoped>
.weapon-hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 220px; margin-top: 30px; padding: 28px; border: 1px solid #ed727c44; border-radius: 6px; background: linear-gradient(120deg, #3a1f32, #091521 70%); }
.weapon-hero h1 { margin: 9px 0; color: #f1f1ee; font: 700 clamp(38px, 4vw, 58px)/1.05 'Rajdhani', sans-serif; }
.weapon-hero p:not(.val-kicker) { color: #f5a4aa; font: 700 17px 'Rajdhani', sans-serif; }
.weapon-hero img { width: min(55%, 500px); max-height: 160px; object-fit: contain; }
.weapon-details { margin-top: 18px; padding: 24px; border: 1px solid #ffffff1a; border-radius: 6px; background: #0c1824; color: #c6d0d9; }
.weapon-details h2 { margin: 8px 0 20px; color: #f1f1ee; font: 700 28px 'Rajdhani', sans-serif; }
.weapon-stats { display: flex; flex-wrap: wrap; gap: 16px 36px; margin: 0; }
.weapon-stats dt { color: #aebbc8; font-size: 12px; }
.weapon-stats dd { margin: 5px 0 0; color: #f5a4aa; font-weight: 700; }
.weapon-note { line-height: 1.5; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { padding: 12px; border-bottom: 1px solid #ffffff1a; white-space: nowrap; }
th { color: #d8e0e6; font: 700 14px 'Rajdhani', sans-serif; }
.weapon-source { color: #aebbc8; font: 600 13px 'Rajdhani', sans-serif; }
@media (max-width: 600px) { .weapon-hero { gap: 12px; min-height: 170px; padding: 20px; } .weapon-hero img { width: 48%; } .weapon-details { padding: 20px; } }
</style>
