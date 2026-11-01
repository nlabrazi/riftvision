<script setup lang="ts">
definePageMeta({
  middleware(to) {
    const id = typeof to.params.id === 'string' ? to.params.id : ''
    return navigateTo(
      { path: `/tft/units/${encodeURIComponent(id)}`, query: to.query, hash: to.hash },
      { redirectCode: 302, replace: true },
    )
  },
})
</script>

<template><div /></template>
