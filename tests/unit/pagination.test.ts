import { effectScope, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { usePagination } from '../../app/composables/usePagination'

describe('pagination des listes longues', () => {
  it('évite une page supplémentaire pour quelques résultats et répartit les grandes listes', () => {
    const scope = effectScope()
    scope.run(() => {
      const total = ref(60)
      const search = ref('')
      const pagination = usePagination(total, [search], 48)
      expect(pagination.pageCount.value).toBe(1)
      expect(pagination.end.value).toBe(60)
      total.value = 61
      expect(pagination.pageCount.value).toBe(2)
      expect(pagination.end.value).toBe(31)
      pagination.page.value = 2
      expect(pagination.start.value).toBe(31)
      expect(pagination.end.value).toBe(62)
      search.value = 'objet'
      expect(pagination.page.value).toBe(1)
      pagination.page.value = 2
      total.value = 10
      expect(pagination.page.value).toBe(1)
    })
    scope.stop()
  })
})
