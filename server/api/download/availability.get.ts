import path from 'node:path'
import { findSetupInstaller } from '../../utils/overlayInstaller'

export default defineEventHandler(() => ({
  available: findSetupInstaller(path.resolve(process.cwd(), 'dist-overlay')) !== null,
}))
