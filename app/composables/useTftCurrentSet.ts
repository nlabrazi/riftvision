import { computed, ref, watch, type Ref } from 'vue'
import type { TftCurrentSetResponse } from '#shared/types/tft'

export function useTftCurrentSet(
  source: Ref<TftCurrentSetResponse | null>,
  version: Ref<string | undefined>,
  catalogIds: Ref<string[]>,
  kind: 'units' | 'traits' | 'items',
) {
  const current = computed(() => {
    const set = source.value
    if (
      !set ||
      !Number.isSafeInteger(set.number) ||
      set.number <= 0 ||
      typeof set.patch !== 'string' ||
      set.dataDragonVersion !== version.value ||
      !Array.isArray(set.units) ||
      !Array.isArray(set.traits) ||
      !Array.isArray(set.items)
    )
      return null
    const ids = new Set(set[kind])
    return catalogIds.value.some((id) => ids.has(id)) ? set : null
  })
  const currentIds = computed(() => new Set(current.value?.[kind] ?? []))
  const defaultSelection = computed(() => (current.value ? 'current' : 'all'))
  const selectedSet = ref('all')
  const userSelected = ref(false)
  watch(
    defaultSelection,
    (selection) => {
      if (!userSelected.value || (selectedSet.value === 'current' && selection === 'all'))
        selectedSet.value = selection
    },
    { immediate: true },
  )

  function markSetChosen() {
    userSelected.value = true
  }
  function showAllForDeepLink() {
    userSelected.value = true
    selectedSet.value = 'all'
  }
  function resetSet() {
    userSelected.value = false
    selectedSet.value = defaultSelection.value
  }
  return { current, currentIds, selectedSet, markSetChosen, showAllForDeepLink, resetSet }
}
