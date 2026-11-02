import { expect, test } from '@playwright/test'

const classes = {
  locale: 'fr_FR',
  edition: 'retail',
  data: [{ id: 8, name: 'Mage', icon: 'https://render.worldofwarcraft.com/mage.png' }],
}
const races = {
  locale: 'fr_FR',
  edition: 'retail',
  data: [
    {
      id: 1,
      name: 'Humain',
      faction: { type: 'ALLIANCE', name: 'Alliance' },
      allied: false,
      classes: [
        { id: 8, name: 'Mage' },
        { id: 14, name: 'Aventurier' },
      ],
    },
    {
      id: 25,
      name: 'Pandaren',
      faction: { type: 'ALLIANCE', name: 'Alliance' },
      allied: false,
      classes: [{ id: 8, name: 'Mage' }],
    },
    {
      id: 26,
      name: 'Pandaren',
      faction: { type: 'HORDE', name: 'Horde' },
      allied: false,
      classes: [{ id: 8, name: 'Mage' }],
    },
  ],
}
async function openHome(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('filtre les races par faction puis consulte les classes disponibles', async ({ page }) => {
  await page.route('**/api/wow/classes', (route) => route.fulfill({ json: classes }))
  await page.route('**/api/wow/races', (route) => route.fulfill({ json: races }))
  await openHome(page)
  await page.locator('.game-card--wow').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Races WoW', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Les races WoW.' })).toBeVisible()
  await expect(page.getByText('3 races', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Humain.*Alliance/ }).locator('img')).toHaveAttribute(
    'src',
    /blz-contentstack-images.*Human.png/,
  )
  await page.getByRole('combobox', { name: 'Faction', exact: true }).selectOption('ALLIANCE')
  await page.getByLabel('Rechercher une race').fill('humain')
  await expect(page.getByText('1 race', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Humain.*Alliance/ }).click()
  await expect(page.getByRole('heading', { name: 'Humain' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Mage/ })).toHaveAttribute('href', '/wow/classes/8')
  await expect(page.getByRole('link', { name: /Mage/ }).locator('img')).toHaveAttribute(
    'src',
    'https://render.worldofwarcraft.com/mage.png',
  )
  await expect(page.locator('.race-portrait')).toHaveAttribute(
    'src',
    /blz-contentstack-images.*Human.png/,
  )
  await expect(page.getByText('Aventurier')).toBeVisible()
  await expect(page.getByRole('link', { name: /Aventurier/ })).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour aux races WoW' }).click()
  await page.getByRole('combobox', { name: 'Faction', exact: true }).selectOption('HORDE')
  await expect(page.getByRole('link', { name: /Pandaren.*Horde/ })).toBeVisible()
  await page.getByLabel('Rechercher une race').fill('inconnue')
  await expect(page.getByText('Aucune race ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(page.getByText('3 races', { exact: true })).toBeVisible()
})

test('propose de réessayer si les races sont indisponibles', async ({ page }) => {
  let available = false
  await page.route('**/api/wow/classes', (route) => route.fulfill({ json: classes }))
  await page.route('**/api/wow/races', (route) =>
    available
      ? route.fulfill({ json: races })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--wow').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Races WoW', exact: true }).click()
  await expect(page.locator('.wow-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('3 races', { exact: true })).toBeVisible()
})
