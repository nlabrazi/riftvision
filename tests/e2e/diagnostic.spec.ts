import { expect, test } from '@playwright/test'

test.describe('Diagnostic Page & Riot Client Interface', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/riot/mock', {
      data: { enabled: false },
    })
  })
  test('renders header, title, and mandatory Riot disclaimer', async ({ page }) => {
    await page.goto('/')

    // Verify brand
    await expect(page.locator('h1')).toContainText('RiftVision')

    // Verify legal disclaimer footer mandated by Riot Developer Policy
    const footer = page.locator('footer')
    await expect(footer).toContainText("RiftVision isn't endorsed by Riot Games")
    await expect(footer).toContainText(
      'Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
    )
  })

  test('toggles mock mode and displays simulated game data', async ({ page }) => {
    // Wait for the client-side initial fetchStatus to know Vue is mounted
    const initialStatusPromise = page.waitForResponse((res) =>
      res.url().includes('/api/riot/status'),
    )
    await page.goto('/')
    await initialStatusPromise

    const mockBtn = page.locator('[data-testid="mock-toggle-button"]')
    await expect(mockBtn).toBeVisible()

    // Click to enable mock mode
    await mockBtn.click()

    // Banner should indicate mock mode
    const banner = page.locator('[data-testid="status-banner"]')
    await expect(banner).toContainText('Mode Simulation / Mock actif')

    // Switch to diagnostic view to inspect tabs
    await page.locator('[data-testid="view-diagnostic-btn"]').click()

    // Navigate to Players tab using explicit test id
    await page.locator('[data-testid="tab-players"]').click()

    // Verify champions from mock dataset are rendered
    await expect(page.getByText('Darius', { exact: true })).toBeVisible()
    await expect(page.getByText('Ahri', { exact: true })).toBeVisible()
    await expect(page.getByText('Garen', { exact: true })).toBeVisible()

    // Navigate to Events tab using explicit test id
    await page.locator('[data-testid="tab-events"]').click()
    await expect(page.getByText('FirstBlood', { exact: true })).toBeVisible()
    await expect(page.getByText('Chemtech')).toBeVisible()
  })
})
