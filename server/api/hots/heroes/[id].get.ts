import { getHotsHero } from '../../../utils/hotsHeroes'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const hero = /^[A-Za-z0-9]+$/.test(id) ? getHotsHero(id) : null
  if (!hero) throw createError({ statusCode: 404, statusMessage: 'Héros introuvable' })
  return hero
})
