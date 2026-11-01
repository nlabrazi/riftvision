<script setup lang="ts">
definePageMeta({
  middleware(to) {
    return navigateTo(
      { path: '/wow/classes', query: to.query, hash: to.hash },
      { redirectCode: 302, replace: true },
    )
  },
})
</script>

<template><div /></template>
