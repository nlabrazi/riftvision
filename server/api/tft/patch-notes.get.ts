import { tftPatchNotes } from '../../utils/patchNotes'

export default defineEventHandler(async () => {
  try {
    return await tftPatchNotes.getPatchNotes()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Notes de patch TFT indisponibles' })
  }
})
