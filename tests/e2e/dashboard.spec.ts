import { expect, test } from '@playwright/test'

test.describe('Tactical Dashboard & Team Economy View', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/riot/mock', {
      data: { enabled: false },
    })
  })

  test('renders tactical dashboard with side-by-side teams and scoreboard', async ({ page }) => {
    // Wait for the client-side initial fetchStatus to guarantee Vue hydration
    const initialStatusPromise = page.waitForResponse((res) =>
      res.url().includes('/api/riot/status'),
    )
    await page.goto('/')
    await initialStatusPromise

    // Toggle mock mode to activate game data
    const mockBtn = page.locator('[data-testid="mock-toggle-button"]')
    await expect(mockBtn).toBeVisible()
    await mockBtn.click()

    // Verify mock mode is active
    const banner = page.locator('[data-testid="status-banner"]')
    await expect(banner).toContainText('Mode Simulation / Mock actif')

    // Verify Scoreboard Header is displayed
    const scoreboard = page.locator('[data-testid="scoreboard-header"]')
    await expect(scoreboard).toBeVisible()
    await expect(scoreboard).toContainText('Équipe Bleue')
    await expect(scoreboard).toContainText('Équipe Rouge')

    // Verify Blue Team column & champions
    const blueTeam = page.locator('[data-testid="blue-team-column"]')
    await expect(blueTeam).toBeVisible()
    await expect(blueTeam.getByText('Darius', { exact: true })).toBeVisible()
    await expect(blueTeam.getByText('Ahri', { exact: true })).toBeVisible()
    await expect(blueTeam.getByText('Jinx', { exact: true })).toBeVisible()

    // Verify Red Team column & champions
    const redTeam = page.locator('[data-testid="red-team-column"]')
    await expect(redTeam).toBeVisible()
    await expect(redTeam.getByText('Garen', { exact: true })).toBeVisible()
    await expect(redTeam.getByText('Zed', { exact: true })).toBeVisible()
    await expect(redTeam.getByText('Nautilus', { exact: true })).toBeVisible()

    // Verify Live Diff Event Feed is rendered
    const diffFeed = page.locator('[data-testid="live-diff-feed"]')
    await expect(diffFeed).toBeVisible()
    await expect(diffFeed).toContainText('Journal des Détections en Direct')
  })

  test('switches smoothly between Tactical Dashboard and Diagnostic Console', async ({ page }) => {
    // Wait for the client-side initial fetchStatus to guarantee Vue hydration
    const initialStatusPromise = page.waitForResponse((res) =>
      res.url().includes('/api/riot/status'),
    )
    await page.goto('/')
    await initialStatusPromise

    // Toggle mock mode
    const mockBtn = page.locator('[data-testid="mock-toggle-button"]')
    await expect(mockBtn).toBeVisible()
    await mockBtn.click()

    // Verify mock mode is active
    const banner = page.locator('[data-testid="status-banner"]')
    await expect(banner).toContainText('Mode Simulation / Mock actif')

    // Switch to Diagnostic API view
    await page.locator('[data-testid="view-diagnostic-btn"]').click()

    // Verify diagnostic tabs are rendered
    await expect(page.locator('[data-testid="tab-overview"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-raw"]')).toBeVisible()

    // Switch back to Tactical view
    await page.locator('[data-testid="view-tactical-btn"]').click()
    await expect(page.locator('[data-testid="scoreboard-header"]')).toBeVisible()
  })

  test('displays and toggles the interactive tactical minimap with champions and objectives', async ({ page }) => {
    const initialStatusPromise = page.waitForResponse((res) =>
      res.url().includes('/api/riot/status'),
    )
    await page.goto('/')
    await initialStatusPromise

    // Map view button in header should not be visible when disconnected in standby
    const headerMapBtn = page.locator('[data-testid="view-map-btn"]')
    await expect(headerMapBtn).toHaveCount(0)

    // Activate mock simulation mode
    await page.locator('[data-testid="mock-toggle-button"]').click()
    await expect(page.locator('[data-testid="status-banner"]')).toContainText('Mode Simulation / Mock actif')

    // Header map button is now visible once connected
    await expect(headerMapBtn).toBeVisible()

    // Dashboard in-page map toggle button is visible
    const mapToggleBtn = page.locator('[data-testid="map-toggle-btn"]')
    await expect(mapToggleBtn).toBeVisible()
    await expect(mapToggleBtn).toContainText('Afficher la Carte')

    // Click to display minimap
    await mapToggleBtn.click()
    const minimap = page.locator('[data-testid="tactical-minimap"]')
    await expect(minimap).toBeVisible()
    await expect(minimap).toContainText("Faille de l'Invocateur")

    // Verify 10 champion pins and objective markers
    await expect(page.locator('[data-testid="champion-map-pin"]')).toHaveCount(10)
    await expect(page.locator('[data-testid="baron-pit-marker"]')).toBeVisible()
    await expect(page.locator('[data-testid="dragon-pit-marker"]')).toBeVisible()
    await expect(page.locator('[data-testid="turret-pin"]').first()).toBeVisible()

    // Close minimap via close button
    await page.locator('[data-testid="close-map-btn"]').click()
    await expect(minimap).toHaveCount(0)

    // Switch to dedicated map view via header button
    await headerMapBtn.click()
    await expect(minimap).toBeVisible()

    // Return to tactical view
    await page.locator('[data-testid="view-tactical-btn"]').click()
    await expect(page.locator('[data-testid="scoreboard-header"]')).toBeVisible()
  })
})
