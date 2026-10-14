import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findSetupInstaller } from '../../server/utils/overlayInstaller'

describe('download overlay endpoint logic', () => {
  const tempDir = path.resolve(process.cwd(), 'tests', 'fixtures', 'temp-dist')

  beforeEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('returns null when directory does not exist', () => {
    expect(findSetupInstaller('/non/existent/path/for/installer')).toBeNull()
  })

  it('returns null when directory contains no .exe file', () => {
    fs.mkdirSync(tempDir, { recursive: true })
    fs.writeFileSync(path.join(tempDir, 'readme.txt'), 'hello')
    fs.writeFileSync(path.join(tempDir, 'config.yaml'), 'foo: bar')

    expect(findSetupInstaller(tempDir)).toBeNull()
  })

  it('locates the setup installer matching prefix and extension', () => {
    fs.mkdirSync(tempDir, { recursive: true })
    fs.writeFileSync(path.join(tempDir, 'other.exe'), 'exe1')
    fs.writeFileSync(path.join(tempDir, 'RiftVision-Overlay-Setup-1.3.0.exe'), 'installer')

    const file = findSetupInstaller(tempDir)
    expect(file).toBe('RiftVision-Overlay-Setup-1.3.0.exe')
  })

  it('falls back to generic .exe if RiftVision-Overlay-Setup prefix is not present', () => {
    fs.mkdirSync(tempDir, { recursive: true })
    fs.writeFileSync(path.join(tempDir, 'custom-overlay.exe'), 'custom')

    const file = findSetupInstaller(tempDir)
    expect(file).toBe('custom-overlay.exe')
  })
})
