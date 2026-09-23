import { expect, test } from '@playwright/test'

test.describe('AlertTester sound and alert triggers', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/riot/mock', { data: { enabled: false } })
    const initialStatus = page.waitForResponse((res) => res.url().includes('/api/riot/status'))
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatus

    // Start demo to activate game state
    await page.getByTestId('mock-toggle-button').click()
    await expect(page.getByTestId('status-banner')).toContainText(
      'Démo · exemple de partie à 16:45',
    )

    // Open diagnostic drawer
    await page.getByTestId('view-diagnostic-btn').click()
    await expect(page.getByRole('heading', { name: 'Connecter votre partie' })).toBeVisible()

    // Expand technical diagnostic details to reveal AlertTester
    await page.getByText('Diagnostic technique', { exact: false }).click()
    await expect(page.locator('#demo-alert-type')).toBeVisible()
  })

  test('triggers and dismisses First Blood alert from tester dropdown', async ({ page }) => {
    await page.locator('#demo-alert-type').selectOption('firstblood')
    await page.getByRole('button', { name: 'Lancer le test' }).click()

    const overlay = page.getByTestId('flash-alert-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('PREMIER SANG')

    await overlay.getByTestId('dismiss-alert-btn').click()
    await expect(overlay).toBeHidden()
  })

  test('triggers and dismisses Multikill alert from tester dropdown', async ({ page }) => {
    await page.locator('#demo-alert-type').selectOption('doublekill')
    await page.getByRole('button', { name: 'Lancer le test' }).click()

    const overlay = page.getByTestId('flash-alert-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('MULTIKILL')
    await expect(overlay).toContainText('DOUBLE KILL')

    await overlay.getByTestId('dismiss-alert-btn').click()
    await expect(overlay).toBeHidden()
  })

  test('triggers and dismisses Ace alert from tester dropdown', async ({ page }) => {
    await page.locator('#demo-alert-type').selectOption('ace')
    await page.getByRole('button', { name: 'Lancer le test' }).click()

    const overlay = page.getByTestId('flash-alert-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('ACE')

    await overlay.getByTestId('dismiss-alert-btn').click()
    await expect(overlay).toBeHidden()
  })

  test('triggers and dismisses Game End victory alert from tester dropdown', async ({ page }) => {
    await page.locator('#demo-alert-type').selectOption('blue_winner')
    await page.getByRole('button', { name: 'Lancer le test' }).click()

    const overlay = page.getByTestId('flash-alert-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('FIN DE PARTIE')
    await expect(overlay).toContainText('VICTOIRE')

    await overlay.getByTestId('dismiss-alert-btn').click()
    await expect(overlay).toBeHidden()
  })

  test('triggers and dismisses Execute alert from tester dropdown', async ({ page }) => {
    await page.locator('#demo-alert-type').selectOption('humiliating')
    await page.getByRole('button', { name: 'Lancer le test' }).click()

    const overlay = page.getByTestId('flash-alert-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText('MORT HUMILIANTE')

    await overlay.getByTestId('dismiss-alert-btn').click()
    await expect(overlay).toBeHidden()
  })
})
