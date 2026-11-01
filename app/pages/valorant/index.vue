<script setup lang="ts">
definePageMeta({
  middleware(to) {
    return navigateTo(
      { path: '/valorant/agents', query: to.query, hash: to.hash },
      { redirectCode: 302, replace: true },
    )
  },
})
</script>

<template><div /></template>
