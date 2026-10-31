import { valorantPatchNotes } from '../../utils/patchNotes'

export default defineEventHandler(async () => {
  try {
    return await valorantPatchNotes.getPatchNotes()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Notes de patch Valorant indisponibles' })
  }
})
