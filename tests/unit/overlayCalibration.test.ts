import { beforeEach, describe, expect, it } from 'vitest'

describe('Overlay calibration & positioning', () => {
  const STORAGE_KEY = 'riftvision_hud_coords'
  let store: Record<string, string> = {}

  beforeEach(() => {
    store = {}
    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: 0,
    } as unknown as Storage
  })

  it('saves and retrieves custom coordinates from localStorage', () => {
    const coords = { x: 350, y: 120 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords))

    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    expect(loaded.x).toBe(350)
    expect(loaded.y).toBe(120)
  })

  it('resets coordinates when removed from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: 500, y: 100 }))
    localStorage.removeItem(STORAGE_KEY)

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('clamps coordinates within viewport boundaries', () => {
    const clampCoords = (
      rawX: number,
      rawY: number,
      viewportWidth: number,
      viewportHeight: number,
      cardWidth = 520,
    ) => {
      const x = Math.max(16, Math.min(viewportWidth - cardWidth - 16, rawX))
      const y = Math.max(16, Math.min(viewportHeight - 150, rawY))
      return { x, y }
    }

    // Attempting to drag offscreen left/top
    const offTopLeft = clampCoords(-100, -50, 1920, 1080)
    expect(offTopLeft.x).toBe(16)
    expect(offTopLeft.y).toBe(16)

    // Attempting to drag offscreen right/bottom
    const offBottomRight = clampCoords(2500, 1500, 1920, 1080)
    expect(offBottomRight.x).toBe(1920 - 520 - 16) // 1384
    expect(offBottomRight.y).toBe(1080 - 150) // 930

    // Within normal bounds
    const normal = clampCoords(700, 90, 1920, 1080)
    expect(normal.x).toBe(700)
    expect(normal.y).toBe(90)
  })
})
