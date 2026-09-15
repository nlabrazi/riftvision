import { expect, test } from '@playwright/test'

test.describe('Live alerts and map feedback', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/riot/mock', { data: { enabled: false } })
    const initialStatus = page.waitForResponse((response) =>
      response.url().includes('/api/riot/status'),
    )
    await page.goto('/')
    await initialStatus
    await page.getByTestId('mock-toggle-button').click()
    await expect(page.getByTestId('status-banner')).toContainText('Mode Simulation / Mock actif')
    await page.getByTestId('view-map-btn').click()
    await expect(page.getByTestId('radar-large-map')).toBeVisible()
  })

  test('shows objective alerts on the map and allows dismissing them', async ({ page }) => {
    const radar = page.getByTestId('focus-radar-view')
    const simulator = radar.locator('summary').filter({ hasText: 'Tester une alerte' })

    await expect(radar.getByTestId('test-alert-baron')).toBeHidden()
    await simulator.click()
    await radar.getByTestId('test-alert-baron').click()

    const overlay = radar.getByTestId('flash-alert-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('BARON NASHOR')
    await expect(overlay).toContainText('ALERTE ÉVÉNEMENT MAJEUR')
    await expect(radar.getByTestId('map-event-ping').first()).toBeVisible()

    await overlay.getByTestId('dismiss-alert-btn').click()
    await expect(overlay).toBeHidden()

    await radar.getByTestId('test-alert-dragon').click()
    await expect(overlay).toContainText('DRAGON')
    await expect(
      radar.locator('[data-testid="map-event-ping"][aria-label*="dragon" i]'),
    ).toBeVisible()

    // An active alert must leave the navigation usable.
    await page.getByTestId('view-tactical-btn').click()
    await expect(page.getByTestId('scoreboard-header')).toBeVisible()
    const dashboardAlert = page.getByTestId('flash-alert-overlay')
    await expect(dashboardAlert).toContainText('DRAGON')
    await dashboardAlert.getByTestId('dismiss-alert-btn').click()
    await expect(dashboardAlert).toBeHidden()
  })

  test('keeps the audio setting while switching between the two views', async ({ page }) => {
    const audioButton = page.getByTestId('audio-toggle-btn')
    await expect(audioButton).toContainText('Audio')
    await audioButton.click()
    await expect(audioButton).toContainText('Muet')

    await page.getByTestId('view-tactical-btn').click()
    await expect(audioButton).toContainText('Muet')
    await audioButton.click()
    await expect(audioButton).toContainText('Audio')
  })
})
