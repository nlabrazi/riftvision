import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('download overlay endpoint logic', () => {
  it('locates the setup installer in dist-overlay', () => {
    const distDir = path.resolve(process.cwd(), 'dist-overlay')
    expect(fs.existsSync(distDir)).toBe(true)

    const files = fs.readdirSync(distDir)
    const setupFile =
      files.find((f) => f.startsWith('RiftVision-Overlay-Setup') && f.endsWith('.exe')) ||
      files.find((f) => f.endsWith('.exe'))

    expect(setupFile).toBeDefined()
    expect(setupFile?.endsWith('.exe')).toBe(true)
  })
})
