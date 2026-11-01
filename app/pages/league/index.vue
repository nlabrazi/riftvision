<script setup lang="ts">
definePageMeta({
  middleware(to) {
    const path = to.hash === '#league-of-legends' ? '/league/compagnon' : '/league/champions'
    return navigateTo(
      { path, query: to.query, hash: to.hash },
      { redirectCode: 302, replace: true },
    )
  },
})
</script>

<template>
  <div />
</template>
