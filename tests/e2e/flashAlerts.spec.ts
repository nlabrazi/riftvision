import { expect, test } from '@playwright/test'

test.describe('Focus Radar View & High-Impact Flash Alerts', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/riot/mock', {
      data: { enabled: false },
    })
  })

  test('switches to Focus Radar view, renders large map and triggers high-impact flash alerts', async ({
    page,
  }) => {
    // Wait for hydration
    const initialStatusPromise = page.waitForResponse((res) =>
      res.url().includes('/api/riot/status'),
    )
    await page.goto('/')
    await initialStatusPromise

    // Activate mock mode
    await page.locator('[data-testid="mock-toggle-button"]').click()
    await expect(page.locator('[data-testid="status-banner"]')).toContainText('Mode Simulation / Mock actif')

    // Switch to Radar & Flash Alert view
    const radarBtn = page.locator('[data-testid="view-map-btn"]')
    await expect(radarBtn).toBeVisible()
    await radarBtn.click()

    // Focus Radar view should be displayed
    const radarView = page.locator('[data-testid="focus-radar-view"]')
    await expect(radarView).toBeVisible()

    // Large map should be visible
    const largeMap = page.locator('[data-testid="radar-large-map"]')
    await expect(largeMap).toBeVisible()

    // Trigger Baron Flash Alert via simulator
    await page.locator('[data-testid="test-alert-baron"]').click()

    const overlay = page.locator('[data-testid="flash-alert-overlay"]')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('BARON NASHOR')
    await expect(overlay).toContainText('ALERTE ÉVÉNEMENT MAJEUR')

    // Dismiss alert manually
    await page.locator('[data-testid="dismiss-alert-btn"]').click()
    await expect(overlay).toHaveCount(0)

    // Trigger Dragon Flash Alert
    await page.locator('[data-testid="test-alert-dragon"]').click()
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('DRAGON')

    // Dismiss again
    await page.locator('[data-testid="dismiss-alert-btn"]').click()
    await expect(overlay).toHaveCount(0)

    // Test Audio Mute Button in Header
    const audioBtn = page.locator('[data-testid="audio-toggle-btn"]')
    await expect(audioBtn).toBeVisible()
    await expect(audioBtn).toContainText('Audio')
    await audioBtn.click()
    await expect(audioBtn).toContainText('Muet')
  })
})
