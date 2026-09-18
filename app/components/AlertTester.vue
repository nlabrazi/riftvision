<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SoundEffectKey } from '#shared/types/diff'
import { type FlashAlertType, useFlashAlerts } from '../composables/useFlashAlerts'

const { triggerDemoAlert } = useFlashAlerts()
const demoTypes: Array<{
  type: FlashAlertType
  id: string
  label: string
  soundKey?: SoundEffectKey
}> = [
  { type: 'FIRST_BLOOD', id: 'firstblood', label: 'First Blood', soundKey: 'firstblood' },
  { type: 'MULTIKILL', id: 'doublekill', label: 'Double Kill', soundKey: 'doublekill' },
  { type: 'MULTIKILL', id: 'triplekill', label: 'Triple Kill', soundKey: 'triplekill' },
  { type: 'MULTIKILL', id: 'megakill', label: 'Quadra (Mega)', soundKey: 'megakill' },
  { type: 'MULTIKILL', id: 'ultrakill', label: 'Penta (Ultra)', soundKey: 'ultrakill' },
  { type: 'MULTIKILL', id: 'monsterkill', label: 'Monster Kill', soundKey: 'monsterkill' },
  { type: 'KILL_STREAK', id: 'killingspree', label: 'Killing Spree', soundKey: 'killingspree' },
  { type: 'KILL_STREAK', id: 'godlike', label: 'Godlike', soundKey: 'godlike' },
  { type: 'KILL_STREAK', id: 'ludicrouskill', label: 'Ludicrous Kill', soundKey: 'ludicrouskill' },
  { type: 'KILL', id: 'headshot', label: 'Solo Kill (Headshot)', soundKey: 'headshot' },
  {
    type: 'DOMINATING',
    id: 'blue_dominating',
    label: 'Blue Dominating',
    soundKey: 'blue_team_dominating',
  },
  {
    type: 'DOMINATING',
    id: 'red_dominating',
    label: 'Red Dominating',
    soundKey: 'red_team_dominating',
  },
  {
    type: 'GAME_END',
    id: 'blue_winner',
    label: 'Victoire Bleue',
    soundKey: 'blue_team_is_the_winner',
  },
  {
    type: 'GAME_END',
    id: 'red_winner',
    label: 'Victoire Rouge',
    soundKey: 'red_team_is_the_winner',
  },
  { type: 'EXECUTE', id: 'humiliating', label: 'Mort humiliante', soundKey: 'humiliating_defeat' },
  { type: 'KILL', id: 'kill', label: 'Combat standard' },
  { type: 'DRAGON', id: 'dragon', label: 'Dragon' },
  { type: 'BARON', id: 'baron', label: 'Baron' },
  { type: 'ITEM', id: 'item', label: 'Power spike' },
  { type: 'ACE', id: 'ace', label: 'Ace' },
]

const selectedId = ref('dragon')
const selectedDemo = computed(() => demoTypes.find((demo) => demo.id === selectedId.value))
</script>

<template>
  <div class="alert-tester">
    <label for="demo-alert-type">Tester un son ou une alerte</label>
    <select id="demo-alert-type" v-model="selectedId">
      <option v-for="demo in demoTypes" :key="demo.id" :value="demo.id">{{ demo.label }}</option>
    </select>
    <button v-if="selectedDemo" type="button" class="rv-button" @click="triggerDemoAlert(selectedDemo.type, selectedDemo.soundKey)">Lancer le test</button>
  </div>
</template>

<style scoped>
.alert-tester { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px 0; }
label { color: #b6c0cb; font-size: 13px; }
select { max-width: 100%; padding: 8px 12px; border: 1px solid #26333f; border-radius: 4px; background: #101a25; color: #e4e8ed; }
</style>
