import { hotsPatchNotes } from '../../utils/hotsPatchNotes'

export default defineEventHandler(async () => {
  try {
    return await hotsPatchNotes.getPatchNotes()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Notes de patch HotS indisponibles' })
  }
})
