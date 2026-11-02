import { expect, test } from '@playwright/test'

async function openHome(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('explore les héros, les compétences et les talents du Nexus', async ({ page, request }) => {
  const catalog = await request.get('/api/hots/heroes')
  expect(catalog.ok()).toBe(true)
  const payload = await catalog.json()
  expect(payload.data.length).toBeGreaterThan(80)
  expect(payload.data.some((hero: { id: string }) => hero.id === 'Xalatath')).toBe(true)
  expect((await request.get('/api/hots/heroes/inconnu')).status()).toBe(404)

  await openHome(page)
  await page.locator('.game-card--hots').click()
  await page.getByTestId('encyclopedia-action').click()
  await expect(page).toHaveURL(/\/hots\/heroes$/)
  await expect(page.getByRole('heading', { name: 'Les héros du Nexus.' })).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Rôle', exact: true })
    .selectOption('Assassin à distance')
  await page.getByRole('combobox', { name: 'Univers', exact: true }).selectOption('Warcraft')
  await page.getByLabel('Rechercher un héros').fill('xalatath')
  const card = page.getByRole('link', { name: /Xal’atath/ })
  await expect(card).toBeVisible()
  await expect(card.locator('img')).toHaveAttribute(
    'src',
    /heroes-images\/main\/heroesimages\/heroportraits/,
  )
  await card.click()
  await expect(page).toHaveURL(/\/hots\/heroes\/Xalatath$/)
  await expect(page.getByRole('heading', { name: 'Xal’atath', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Marque de l’ombre' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Adepte du Vide' })).toBeVisible()
  await expect(page.getByText(/version 2\.57\.0\.98348/)).toBeVisible()
  await page.locator('summary').filter({ hasText: 'Niveau 4' }).click()
  await expect(page.locator('details[open]')).toHaveCount(2)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour aux héros du Nexus' }).click()
  await page.getByLabel('Rechercher un héros').fill('inexistant')
  await expect(page.getByText('Aucun héros ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(page.locator('.hero-card').first()).toBeVisible()
})

test('trouve un héros HotS dans la recherche commune', async ({ page }) => {
  for (const pattern of ['**/api/ddragon/**', '**/api/valorant/**', '**/api/wow/**']) {
    await page.route(pattern, (route) => route.fulfill({ json: { version: 'test', data: [] } }))
  }
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  await dialog.getByRole('searchbox').fill('xalatath')
  const group = dialog.getByRole('region', { name: 'Héros · Heroes of the Storm' })
  const result = group.getByRole('link', { name: /Xal’atath/ })
  await expect(result).toBeVisible()
  await result.click()
  await expect(page).toHaveURL(/\/hots\/heroes\/Xalatath$/)
  await expect(page.getByRole('heading', { name: 'Xal’atath', exact: true })).toBeVisible()
})
