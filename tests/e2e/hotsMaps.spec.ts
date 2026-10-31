import { expect, test } from '@playwright/test'

test('explore les cartes, leurs objectifs et les données manquantes', async ({ page, request }) => {
  const catalog = await request.get('/api/hots/maps')
  expect(catalog.ok()).toBe(true)
  const payload = await catalog.json()
  expect(payload.data.length).toBeGreaterThan(20)
  expect((await request.get('/api/hots/maps/inconnu')).status()).toBe(404)

  await page.goto('/hots')
  await page.getByRole('link', { name: 'Champs de bataille', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Champs de bataille.' })).toBeVisible()
  await expect(page.getByText(/ne représente pas la rotation actuelle/)).toBeVisible()
  await expect(page.locator('.map-card')).toHaveCount(payload.data.length)
  await page.getByLabel('Rechercher un champ de bataille').fill('passe dalterac')
  const card = page.getByRole('link', { name: /La passe d’Alterac/ })
  await expect(card).toBeVisible()
  await expect(card.locator('img')).toHaveAttribute('src', /replaypreviews/)
  await card.click()
  await expect(page).toHaveURL(/\/hots\/maps\/alterac_pass$/)
  await expect(page.getByRole('heading', { name: 'La passe d’Alterac' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Camps d’emprisonnement' })).toBeVisible()
  await expect(page.getByText(/Capturez le camp d’emprisonnement/)).toBeVisible()
  await expect(page.locator('.objective-art img').first()).toHaveAttribute('src', /mapobjectives/)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.goto('/hots/maps/deadmans_stand')
  await expect(
    page.getByText('Les objectifs ne sont pas disponibles dans les données de cette carte.'),
  ).toBeVisible()
  await page.goto('/hots/maps/inconnu')
  await expect(page.getByText('Ce champ de bataille est introuvable.')).toBeVisible()
})

test('trouve un champ de bataille dans la recherche commune', async ({ page }) => {
  for (const pattern of ['**/api/ddragon/**', '**/api/valorant/**', '**/api/wow/**']) {
    await page.route(pattern, (route) => route.fulfill({ json: { version: 'test', data: [] } }))
  }
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  await dialog.getByRole('searchbox').fill('alterac')
  const group = dialog.getByRole('region', { name: 'Champs de bataille · Heroes of the Storm' })
  await group.getByRole('link', { name: /La passe d’Alterac/ }).click()
  await expect(page).toHaveURL(/\/hots\/maps\/alterac_pass$/)
})
