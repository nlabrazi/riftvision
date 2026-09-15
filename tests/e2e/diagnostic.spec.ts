import { expect, test } from '@playwright/test'

test.describe('Connection controls and diagnostics', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/riot/mock', { data: { enabled: false } })
    const initialStatus = page.waitForResponse((response) =>
      response.url().includes('/api/riot/status'),
    )
    await page.goto('/')
    await initialStatus
  })

  test('preserves the brand and Riot disclaimer', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('RiftVision')
    const footer = page.locator('footer').filter({ hasText: "RiftVision isn't endorsed" })
    await expect(footer).toContainText("RiftVision isn't endorsed by Riot Games")
    await expect(footer).toContainText(
      'Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
    )
  })

  test('opens diagnostics from standby and returns to either main view', async ({ page }) => {
    await expect(page.getByTestId('view-tactical-btn')).toBeVisible()
    await expect(page.getByTestId('view-map-btn')).toBeVisible()
    await page.getByTestId('view-diagnostic-btn').click()
    await expect(page.getByTestId('tab-overview')).toBeVisible()
    await expect(page.getByTestId('tab-raw')).toBeVisible()

    await page.getByTestId('view-map-btn').click()
    await expect(page.getByTestId('tab-overview')).toBeHidden()
    await expect(page.getByTestId('status-banner')).toContainText(
      'En attente du client League of Legends',
    )

    await page.getByTestId('view-tactical-btn').click()
    await expect(page.getByTestId('mock-toggle-button')).toBeVisible()
  })

  test('retains simulated players and events in diagnostic tabs', async ({ page }) => {
    const mockButton = page.getByTestId('mock-toggle-button')
    const banner = page.getByTestId('status-banner')
    await mockButton.click()
    await expect(banner).toContainText('Mode Simulation / Mock actif')
    await page.getByTestId('view-diagnostic-btn').click()

    await page.getByTestId('tab-players').click()
    await expect(page.getByText('Darius', { exact: true })).toBeVisible()
    await expect(page.getByText('Ahri', { exact: true })).toBeVisible()
    await expect(page.getByText('Garen', { exact: true })).toBeVisible()

    await page.getByTestId('tab-events').click()
    await expect(page.getByText('FirstBlood', { exact: true })).toBeVisible()
    await expect(page.getByText('Chemtech')).toBeVisible()

    await mockButton.click()
    await expect(banner).toContainText('En attente du client League of Legends')
    await page.getByTestId('view-tactical-btn').click()
    await expect(page.getByTestId('scoreboard-header')).toBeHidden()
  })

  test('starts in standby and enables live listening explicitly', async ({ page }) => {
    const banner = page.getByTestId('status-banner')
    const liveButton = page.getByTestId('live-toggle-button')
    await expect(banner).toContainText('En attente du client League of Legends')
    await expect(page.getByText('Dernière erreur de connexion', { exact: false })).toHaveCount(0)

    await liveButton.click()
    await expect(liveButton).toContainText('Live')
    await expect(banner).toContainText('Recherche de partie en cours')

    await liveButton.click()
    await expect(banner).toContainText('En attente du client League of Legends')
  })
})
