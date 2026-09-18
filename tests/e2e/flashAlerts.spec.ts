import { expect, test } from '@playwright/test'

test.describe('Live alerts and map feedback', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/riot/mock', { data: { enabled: false } })
    const initialStatus = page.waitForResponse((response) =>
      response.url().includes('/api/riot/status'),
    )
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatus
    await page.getByTestId('mock-toggle-button').click()
    await expect(page.getByTestId('status-banner')).toContainText(
      'Démo · exemple de partie à 16:45',
    )
    await page.getByTestId('view-map-btn').click()
    await expect(page.getByTestId('radar-large-map')).toBeVisible()
  })

  test('shows objective alerts on the map and allows dismissing them', async ({ page }) => {
    const radar = page.getByTestId('focus-radar-view')
    await page.getByTestId('test-alert-dragon').click()
    const overlay = radar.getByTestId('flash-alert-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('DRAGON')
    await expect(overlay).toContainText('OBJECTIF STRATÉGIQUE')
    await expect(
      radar.locator('[data-testid="map-event-ping"][aria-label*="dragon" i]'),
    ).toBeVisible()

    await overlay.getByTestId('dismiss-alert-btn').click()
    await expect(overlay).toBeHidden()
    await page.getByTestId('test-alert-dragon').click()
    await expect(overlay).toContainText('DRAGON')

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
    await expect(audioButton).toContainText('Son activé')
    await audioButton.click()
    await expect(audioButton).toContainText('Son coupé')

    await page.getByTestId('view-tactical-btn').click()
    await expect(audioButton).toContainText('Son coupé')
    await audioButton.click()
    await expect(audioButton).toContainText('Son activé')
  })
})
