import { expect, test } from '@playwright/test'

const version = '16.21.1'
const data = [
  { id: 'DA_Ahri', name: 'Ahri', tier: 3, cost: 3, icon: 'DA_Ahri.png', setNumber: 18 },
  { id: 'TFT17_Ahri', name: 'Ahri', tier: 4, cost: 4, icon: 'TFT17_Ahri.png', setNumber: 17 },
  {
    id: 'TFTTutorial_Zed',
    name: 'Zed',
    tier: 2,
    cost: 0,
    icon: 'TFTTutorial_Zed.png',
    setNumber: null,
  },
]

async function openHome(page: import('@playwright/test').Page) {
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('explore les unités TFT par set et coût puis ouvre une fiche', async ({ page }) => {
  await page.route('**/api/ddragon/tft/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data } }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await expect(page).toHaveURL(/\/tft$/)
  await expect(page.getByRole('heading', { name: 'Les unités TFT.' })).toBeVisible()
  await expect(page.getByText(/ne désigne pas nécessairement le set actuel/)).toBeVisible()
  await expect(page.getByText('3 unités', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Set', exact: true }).selectOption('18')
  await page.getByRole('combobox', { name: 'Coût', exact: true }).selectOption('3')
  await page.getByLabel('Rechercher une unité').fill('ahri')
  await expect(page.getByText('1 unité', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Ahri.*Set 18/ }).click()
  await expect(page).toHaveURL(/\/tft\/champions\/DA_Ahri$/)
  await expect(page.getByRole('heading', { name: 'Ahri' })).toBeVisible()
  await expect(page.getByText('3 PO', { exact: true })).toBeVisible()
  await expect(page.getByText(/traits et compétences ne sont pas encore disponibles/)).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour aux unités TFT' }).click()
  await page.getByRole('combobox', { name: 'Set', exact: true }).selectOption('other')
  await expect(page.getByRole('link', { name: /Zed.*Set non identifié/ })).toBeVisible()
  await page.getByLabel('Rechercher une unité').fill('inconnu')
  await expect(page.getByText('Aucune unité ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(page.getByText('3 unités', { exact: true })).toBeVisible()
})

test('permet de réessayer si le catalogue TFT est indisponible', async ({ page }) => {
  let available = false
  await page.route('**/api/ddragon/tft/champions', (route) =>
    available
      ? route.fulfill({ json: { version, locale: 'fr_FR', data } })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await expect(page.locator('.tft-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('3 unités', { exact: true })).toBeVisible()
})
