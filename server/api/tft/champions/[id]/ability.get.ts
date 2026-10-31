import { tftAbilities } from '../../../../utils/tftAbilities'
import { tftDataDragon } from '../../../../utils/tftDataDragon'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[A-Za-z0-9_]+$/.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Unité TFT introuvable' })
  let catalog: Awaited<ReturnType<typeof tftDataDragon.getChampions>>
  try {
    catalog = await tftDataDragon.getChampions()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Catalogue TFT indisponible' })
  }
  const champion = catalog.data.find((entry) => entry.id === id)
  if (!champion) throw createError({ statusCode: 404, statusMessage: 'Unité TFT introuvable' })
  try {
    const ability = await tftAbilities.getAbility(champion.id, champion.setNumber, catalog.version)
    return { ability, sourceVersion: catalog.version.split('.').slice(0, 2).join('.') }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Compétence TFT indisponible' })
  }
})
