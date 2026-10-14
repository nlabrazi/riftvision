import fs from 'node:fs'

/**
 * Recherche l'exécutable d'installation Windows dans le répertoire cible
 */
export function findSetupInstaller(distDir: string): string | null {
  try {
    if (!fs.existsSync(distDir)) return null
    const files = fs.readdirSync(distDir)
    return (
      files.find((f) => f.startsWith('RiftVision-Overlay-Setup') && f.endsWith('.exe')) ||
      files.find((f) => f.endsWith('.exe')) ||
      null
    )
  } catch {
    return null
  }
}
