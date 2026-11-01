import { expect, test } from '@playwright/test'

const catalog = {
  locale: 'fr_FR',
  edition: 'retail',
  data: [
    { id: 8, name: 'Mage', icon: null },
    { id: 11, name: 'Druide', icon: null },
  ],
}
const detail = {
  locale: 'fr_FR',
  edition: 'retail',
  data: {
    id: 8,
    name: 'Mage',
    icon: null,
    powerType: 'Mana',
    specializations: [
      { id: 62, name: 'Arcanes' },
      { id: 63, name: 'Feu' },
    ],
  },
}
async function openHome(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('explore les classes Retail et les spécialisations', async ({ page }) => {
  await page.route('**/api/wow/classes', (route) => route.fulfill({ json: catalog }))
  await page.route('**/api/wow/classes/8', (route) => route.fulfill({ json: detail }))
  await page.route('**/api/wow/specializations/*', (route) =>
    route.fulfill({
      json: {
        locale: 'fr_FR',
        edition: 'retail',
        data: {
          id: Number(new URL(route.request().url()).pathname.split('/').pop()),
          name: 'Spécialisation',
          icon: 'https://render.worldofwarcraft.com/spec.png',
          role: 'Dégâts',
          descriptionMale: 'Une spécialisation magique.',
        },
      },
    }),
  )
  await openHome(page)
  await page.locator('.game-card--wow').click()
  await expect(page).toHaveURL(/\/wow$/)
  await expect(page.getByRole('heading', { name: 'Les classes WoW.' })).toBeVisible()
  await expect(page.getByText('2 classes', { exact: true })).toBeVisible()
  await page.getByLabel('Rechercher une classe').fill('mage')
  await expect(page.getByText('1 classe', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Mage' }).click()
  await expect(page.getByRole('heading', { name: 'Mage' })).toBeVisible()
  await expect(page.getByText('Ressource principale : Mana')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Caractéristiques', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Téléportation', exact: true })).toBeVisible()
  await expect(page.locator('.class-features img')).toHaveCount(4)
  await expect(
    page.locator('.spec-list').getByRole('listitem').filter({ hasText: 'Arcanes' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /Arcanes/ }).locator('img')).toHaveAttribute(
    'src',
    'https://render.worldofwarcraft.com/spec.png',
  )
  await expect(page.getByRole('link', { name: /Arcanes/ })).toContainText('Dégâts')
  await expect(
    page.locator('.spec-list').getByRole('listitem').filter({ hasText: 'Feu' }),
  ).toBeVisible()
  await expect(page.locator('.spec-list')).toHaveCSS('grid-template-columns', /\S+ \S+ \S+/)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.spec-list')).toHaveCSS('grid-template-columns', /^\S+$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour aux classes WoW' }).click()
  await page.getByLabel('Rechercher une classe').fill('absente')
  await expect(page.getByText('Aucune classe ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer la recherche' }).click()
  await expect(page.getByText('2 classes', { exact: true })).toBeVisible()
})

test('propose de réessayer si le catalogue est indisponible', async ({ page }) => {
  let available = false
  await page.route('**/api/wow/classes', (route) =>
    available
      ? route.fulfill({ json: catalog })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--wow').click()
  await expect(page.locator('.wow-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('2 classes', { exact: true })).toBeVisible()
})
