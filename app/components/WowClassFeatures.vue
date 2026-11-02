<script setup lang="ts">
import { computed } from 'vue'
import { wowClassFeatures, wowClassSource } from '~/utils/wowClassFeatures'

const props = defineProps<{ classId: number }>()
const features = computed(() => wowClassFeatures(props.classId))
const source = computed(() => wowClassSource(props.classId))
</script>

<template>
  <aside v-if="features.length" class="class-features" aria-labelledby="class-features-title">
    <p class="wow-kicker">STYLE DE JEU</p>
    <h2 id="class-features-title">Caractéristiques</h2>
    <p class="class-features__intro">Les possibilités varient selon la spécialisation et les talents choisis.</p>
    <ul>
      <li v-for="feature in features" :key="feature.name"><img :src="feature.icon" alt="" loading="lazy" decoding="async" /><div><h3>{{ feature.name }}</h3><p>{{ feature.description }}</p></div></li>
    </ul>
    <a v-if="source" :href="source" target="_blank" rel="noopener noreferrer">Découvrir la classe sur Blizzard ↗</a>
  </aside>
</template>

<style scoped>
.class-features { min-width: 0; padding: 22px; border: 1px solid #c8aa6e38; border-radius: 6px; background: linear-gradient(145deg, #15283a, #0a1723); }
.class-features h2 { margin: 8px 0 12px; color: #f1f1ee; font: 700 26px 'Rajdhani', sans-serif; }
.class-features__intro { margin: 0; color: #aebfc9; font-size: 13px; line-height: 1.5; }
.class-features ul { display: grid; gap: 17px; margin: 20px 0; padding: 0; list-style: none; }
.class-features li { display: flex; align-items: start; gap: 12px; }
.class-features img { flex: 0 0 46px; width: 46px; height: 46px; border: 1px solid #c8aa6e77; border-radius: 5px; object-fit: cover; background: #182a38; }
.class-features h3 { margin: 0 0 4px; color: #ecd8ad; font: 700 18px/1.15 'Rajdhani', sans-serif; }
.class-features li p { margin: 0; color: #c1cdd5; font-size: 13px; line-height: 1.5; }
.class-features a { color: #e0c18a; font: 700 14px 'Rajdhani', sans-serif; text-decoration: none; }
.class-features a:hover { text-decoration: underline; }
</style>
