import { expect, test } from '@playwright/test'

const weapons = {
  locale: 'fr-FR',
  data: [
    {
      id: '9c82e19d-4575-0200-1a81-3eacf00cf872',
      name: 'Vandal',
      category: 'Rifle',
      icon: 'https://media.valorant-api.com/weapons/vandal.png',
      cost: 2900,
      magazine: 25,
      fireRate: 9.75,
      reloadSeconds: 2.5,
      pelletCount: 1,
      damageRanges: [{ start: 0, end: 50, head: 160, body: 40, leg: 34 }],
    },
    {
      id: '2f59173c-4bed-b6c3-2191-dea9b58be9c7',
      name: 'Mêlée',
      category: 'Melee',
      icon: 'https://media.valorant-api.com/weapons/melee.png',
      cost: null,
      magazine: null,
      fireRate: null,
      reloadSeconds: null,
      pelletCount: null,
      damageRanges: [],
    },
  ],
}
const agents = {
  locale: 'fr-FR',
  data: [
    {
      id: 'e370fa57-4757-3604-3648-499e1f642d3f',
      name: 'Gekko',
      description: '',
      role: 'Initiateur',
      icon: 'https://media.valorant-api.com/gekko.png',
      portrait: null,
      abilities: [],
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

test('recherche une arme par nom et catégorie puis consulte ses caractéristiques', async ({
  page,
}) => {
  await page.route('**/api/valorant/agents', (route) => route.fulfill({ json: agents }))
  await page.route('**/api/valorant/weapons', (route) => route.fulfill({ json: weapons }))
  await openHome(page)
  await page.locator('.game-card--valorant').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Armes Valorant', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Les armes Valorant.' })).toBeVisible()
  await expect(page.getByText('2 armes', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Catégorie', exact: true }).selectOption('Rifle')
  await page.getByLabel('Rechercher une arme').fill('vandal')
  await expect(page.getByText('1 arme', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Vandal.*Fusils/ }).click()
  await expect(page.getByRole('heading', { name: 'Vandal' })).toBeVisible()
  await expect(page.getByText('9,75 tirs/s')).toBeVisible()
  await expect(page.getByRole('cell', { name: '160', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour aux armes Valorant' }).click()
  await page.getByLabel('Rechercher une arme').fill('melee')
  await page.getByRole('link', { name: /Mêlée/ }).click()
  await expect(
    page.getByText('Les caractéristiques ne sont pas disponibles pour cette arme.'),
  ).toBeVisible()
})

test('gère les résultats vides et une indisponibilité du catalogue des armes', async ({ page }) => {
  let available = false
  await page.route('**/api/valorant/agents', (route) => route.fulfill({ json: agents }))
  await page.route('**/api/valorant/weapons', (route) =>
    available
      ? route.fulfill({ json: weapons })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--valorant').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Armes Valorant', exact: true }).click()
  await expect(page.locator('.val-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await page.getByLabel('Rechercher une arme').fill('introuvable')
  await expect(page.getByText('Aucune arme ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(page.getByText('2 armes', { exact: true })).toBeVisible()
})
