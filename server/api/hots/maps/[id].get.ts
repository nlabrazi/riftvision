import { getHotsMap } from '../../../utils/hotsMaps'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const map = /^[a-z0-9_]+$/.test(id) ? getHotsMap(id) : null
  if (!map) throw createError({ statusCode: 404, statusMessage: 'Champ de bataille introuvable' })
  return map
})
