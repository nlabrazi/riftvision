import { computed, ref, watch, type Ref, type WatchSource } from 'vue'

export function usePagination(total: Ref<number>, filters: WatchSource[], targetPageSize: number) {
  const page = ref(1)
  // Tolère jusqu'à un quart de page supplémentaire pour éviter une page presque vide.
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / (targetPageSize * 1.25))))
  const pageSize = computed(() => Math.ceil(total.value / pageCount.value))
  const start = computed(() => (page.value - 1) * pageSize.value)
  const end = computed(() => start.value + pageSize.value)

  watch(
    filters,
    () => {
      page.value = 1
    },
    { flush: 'sync' },
  )
  watch(
    pageCount,
    (count) => {
      page.value = Math.min(page.value, count)
    },
    { flush: 'sync' },
  )

  return { page, pageCount, start, end }
}
