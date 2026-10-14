import fs from 'node:fs'
import path from 'node:path'
import { createError, defineEventHandler, sendStream, setHeader } from 'h3'
import { findSetupInstaller } from '../../utils/overlayInstaller'

export default defineEventHandler((event) => {
  const distDir = path.resolve(process.cwd(), 'dist-overlay')
  const setupFile = findSetupInstaller(distDir)

  if (!setupFile) {
    throw createError({
      statusCode: 404,
      statusMessage:
        'L’exécutable d’installation est introuvable. Veuillez exécuter "npm run overlay:build".',
    })
  }

  const filePath = path.join(distDir, setupFile)
  const stat = fs.statSync(filePath)

  setHeader(event, 'Content-Type', 'application/vnd.microsoft.portable-executable')
  setHeader(event, 'Content-Disposition', `attachment; filename="${setupFile}"`)
  setHeader(event, 'Content-Length', stat.size)

  return sendStream(event, fs.createReadStream(filePath))
})
