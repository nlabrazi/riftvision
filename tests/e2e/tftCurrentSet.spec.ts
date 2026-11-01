import { expect, test, type Page } from '@playwright/test'

const version = '16.21.1'
const units = [
  { id: 'DA_Ahri', name: 'Ahri', tier: 3, cost: 3, icon: 'Ahri.png', setNumber: 18 },
  { id: 'TFT17_Ahri', name: 'Ahri', tier: 4, cost: 4, icon: 'Ahri17.png', setNumber: 17 },
  { id: 'TFTTutorial_Zed', name: 'Zed', tier: 2, cost: 2, icon: 'Zed.png', setNumber: null },
]
const traits = [
  { id: 'DA_Solar18', name: 'Solaire', icon: 'solar.png' },
  { id: 'TFT17_Ancient', name: 'Ancien', icon: 'old.png' },
]
const items = [
  { id: 'TFT_Item_BFSword', name: 'BF Glaive', icon: 'sword.png' },
  { id: 'DA_18_Magic', name: 'Objet actuel', icon: 'new.png' },
  { id: 'TFT17_Old', name: 'Ancien objet', icon: 'old.png' },
]
const season = {
  number: 18,
  patch: '18.5',
  dataDragonVersion: version,
  units: ['DA_Ahri'],
  traits: ['DA_Solar18'],
  items: ['TFT_Item_BFSword', 'DA_18_Magic'],
}

async function openHome(page: Page, options: { available?: boolean; stale?: boolean } = {}) {
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/riot/status')
        return route.fulfill({
          json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false },
        })
      if (path === '/api/download/availability')
        return route.fulfill({ json: { available: false } })
      if (path === '/api/ddragon/tft/champions')
        return route.fulfill({ json: { version, locale: 'fr_FR', data: units } })
      if (path === '/api/ddragon/tft/traits')
        return route.fulfill({ json: { version, locale: 'fr_FR', data: traits } })
      if (path === '/api/ddragon/tft/items')
        return route.fulfill({ json: { version, locale: 'fr_FR', data: items } })
      if (path === '/api/tft/current-set')
        return options.available === false
          ? route.fulfill({ status: 503 })
          : route.fulfill({
              json: { ...season, dataDragonVersion: options.stale ? '16.20.1' : version },
            })
      return route.fulfill({ status: 503 })
    },
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
  await page.locator('.game-card--tft').click()
  await expect(page.getByRole('heading', { name: 'Les unités TFT.' })).toBeVisible()
}

test('sélectionne le set actuel pour les unités, traits et objets, y compris les objets communs', async ({
  page,
}) => {
  await openHome(page)
  await expect(page.getByText('Set 18 · Saison en cours', { exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Set', exact: true })).toHaveValue('current')
  await expect(page.locator('.tft-card')).toHaveCount(1)
  await expect(page.locator('.tft-card .tft-current-badge')).toHaveCount(1)
  await page.getByRole('combobox', { name: 'Set', exact: true }).selectOption('all')
  await expect(page.locator('.tft-card')).toHaveCount(3)
  await expect(page.locator('.tft-card .tft-current-badge')).toHaveCount(1)
  await page.getByRole('combobox', { name: 'Set', exact: true }).selectOption('17')
  await expect(page.getByRole('link', { name: /Ahri.*Set 17/ })).toBeVisible()
  await page.getByRole('link', { name: 'Traits', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Set identifié' })).toHaveValue('current')
  await expect(page.locator('.traits-card')).toHaveCount(1)
  await expect(page.locator('.traits-card')).toContainText('DA_Solar18')
  await expect(page.locator('.traits-card .tft-current-badge')).toHaveCount(1)
  await page.getByRole('link', { name: 'Objets', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Set identifié' })).toHaveValue('current')
  await expect(page.locator('.objets-card')).toHaveCount(2)
  await expect(
    page.locator('.objets-card').filter({ hasText: 'BF Glaive' }).locator('.tft-current-badge'),
  ).toBeVisible()
  await page.getByLabel('Rechercher un objet').fill('introuvable')
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(page.getByRole('combobox', { name: 'Set identifié' })).toHaveValue('current')
  await expect(page.locator('.objets-card')).toHaveCount(2)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('une recherche globale d’un ancien objet reste accessible malgré le filtre par défaut', async ({
  page,
}) => {
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  await dialog.getByRole('searchbox').fill('Ancien objet')
  await dialog.getByRole('link', { name: /Ancien objet TFT17_Old/ }).click()
  await expect(page).toHaveURL(/\/tft\/items\?id=TFT17_Old$/)
  await expect(page.getByRole('combobox', { name: 'Set identifié' })).toHaveValue('all')
  await expect(page.locator('.objets-card')).toContainText('Ancien objet')
})

for (const [label, options] of [
  ['indisponible', { available: false }],
  ['version différente', { stale: true }],
] as const) {
  test(`ne filtre pas silencieusement si le set actuel est ${label}`, async ({ page }) => {
    await openHome(page, options)
    await expect(page.getByText(/Saison en cours indisponible/)).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Set', exact: true })).toHaveValue('all')
    await expect(page.locator('.tft-card')).toHaveCount(3)
    await expect(page.locator('.tft-current-badge')).toHaveCount(0)
  })
}
