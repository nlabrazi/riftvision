import { wowPatchNotes } from '../../utils/wowPatchNotes'

export default defineEventHandler(async () => {
  try {
    return await wowPatchNotes.getPatchNotes()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Notes de mise à jour WoW indisponibles' })
  }
})
