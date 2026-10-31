import { patchNotes } from '../utils/patchNotes'

export default defineEventHandler(async () => {
  try {
    return await patchNotes.getPatchNotes()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Notes de patch indisponibles' })
  }
})
