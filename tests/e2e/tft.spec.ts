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
  await page.route('**/api/tft/current-set', (route) => route.fulfill({ status: 503 }))
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('explore les unités TFT par set et coût puis ouvre une fiche', async ({ page }) => {
  await page.route('**/api/ddragon/tft/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data } }),
  )
  await page.route('**/api/tft/champions/*/ability', (route) =>
    route.fulfill({
      json: {
        ability: {
          name: 'Éclair',
          description: 'Inflige valeur variable points de dégâts.',
          icon: 'https://raw.communitydragon.org/16.21/game/assets/ahri_q.png',
        },
        sourceVersion: '16.21',
      },
    }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await page.getByTestId('encyclopedia-action').click()
  await expect(page).toHaveURL(/\/tft\/units$/)
  await expect(page.getByRole('heading', { name: 'Les unités TFT.' })).toBeVisible()
  await expect(page.getByText(/ne désigne pas nécessairement le set actuel/)).toBeVisible()
  await expect(page.getByText('3 unités', { exact: true })).toBeVisible()
  await expect(page.locator('.tft-card__art img').first()).toHaveCSS('object-fit', 'contain')
  await page.getByRole('combobox', { name: 'Set', exact: true }).selectOption('18')
  await page.getByRole('combobox', { name: 'Coût', exact: true }).selectOption('3')
  await page.getByLabel('Rechercher une unité').fill('ahri')
  await expect(page.getByText('1 unité', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Ahri.*Set 18/ }).click()
  await expect(page).toHaveURL(/\/tft\/units\/DA_Ahri$/)
  await expect(page.getByRole('heading', { name: 'Ahri' })).toBeVisible()
  await expect(page.locator('.tft-unit img')).toHaveCSS('object-fit', 'contain')
  await expect(page.getByText('3 PO', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Éclair' })).toBeVisible()
  await expect(page.locator('.tft-ability-heading img')).toHaveAttribute('src', /ahri_q\.png$/)
  await expect(page.getByText(/Inflige valeur variable/)).toBeVisible()
  await expect(page.getByText(/Données CommunityDragon/)).toBeVisible()
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
  await page.getByTestId('encyclopedia-action').click()
  await expect(page.locator('.tft-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('3 unités', { exact: true })).toBeVisible()
})

test('consulte et recherche les traits TFT depuis la navigation', async ({ page }) => {
  const traits = [
    { id: 'DA_18_Solar', name: 'Solaire', icon: 'solar.png' },
    { id: 'TFT17_Solar', name: 'Solaire', icon: 'solar.png' },
    { id: 'TFTTutorial_Blademaster', name: 'Maître des lames', icon: 'blade.png' },
  ]
  await page.route('**/api/ddragon/tft/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data } }),
  )
  await page.route('**/api/ddragon/tft/traits', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: traits } }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Traits', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Les traits TFT.' })).toBeVisible()
  await expect(page.getByText('3 traits', { exact: true })).toBeVisible()
  await page.getByLabel('Set identifié').selectOption('18')
  await expect(page.getByText('1 trait', { exact: true })).toBeVisible()
  await expect(page.getByText('DA_18_Solar')).toBeVisible()
  await page.getByLabel('Set identifié').selectOption('other')
  await expect(page.getByText('Maître des lames')).toBeVisible()
  await page.getByLabel('Set identifié').selectOption('all')
  await page.getByRole('combobox', { name: 'Tri', exact: true }).selectOption('desc')
  await expect(page.locator('.traits-card').first()).toContainText('Solaire')
  await page.getByLabel('Rechercher un trait').fill('maitre')
  await expect(page.getByText('Maître des lames')).toBeVisible()
  await expect(page.getByText('1 trait', { exact: true })).toBeVisible()
  await page.getByLabel('Rechercher un trait').fill('DA_18')
  await expect(page.getByText('DA_18_Solar')).toBeVisible()
  await page.getByLabel('Rechercher un trait').fill('introuvable')
  await expect(page.getByText('Aucun trait ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(page.getByText('3 traits', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})

test('permet de réessayer si les traits TFT sont indisponibles', async ({ page }) => {
  let available = false
  await page.route('**/api/ddragon/tft/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data } }),
  )
  await page.route('**/api/ddragon/tft/traits', (route) =>
    available
      ? route.fulfill({
          json: {
            version,
            locale: 'fr_FR',
            data: [{ id: 'DA_18_Solar', name: 'Solaire', icon: 'solar.png' }],
          },
        })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Traits', exact: true }).click()
  await expect(page.locator('.tft-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('Solaire')).toBeVisible()
})

test('consulte et recherche les objets TFT depuis la navigation', async ({ page }) => {
  const items = [
    { id: 'TFT_Item_BFSword', name: 'BF Glaive', icon: 'sword.png' },
    { id: 'TFTTutorial_Item_BFSword', name: 'BF Glaive', icon: 'sword.png' },
    { id: 'TFT17_Item_GuinsoosRageblade', name: 'Lame enragée de Guinsoo', icon: 'blade.png' },
  ]
  await page.route('**/api/ddragon/tft/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data } }),
  )
  await page.route('**/api/ddragon/tft/items', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: items } }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Objets', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Les objets TFT.' })).toBeVisible()
  await expect(page.getByText('3 objets', { exact: true })).toBeVisible()
  await expect(page.getByText(/Les entrées sans nom ne sont pas affichées/)).toBeVisible()
  await page.getByLabel('Set identifié').selectOption('17')
  await expect(page.getByText('1 objet', { exact: true })).toBeVisible()
  await expect(page.getByText('Lame enragée de Guinsoo')).toBeVisible()
  await page.getByLabel('Set identifié').selectOption('other')
  await expect(page.getByText('2 objets', { exact: true })).toBeVisible()
  await page.getByLabel('Set identifié').selectOption('all')
  await page.getByRole('combobox', { name: 'Tri', exact: true }).selectOption('desc')
  await expect(page.locator('.objets-card').first()).toContainText('Lame enragée de Guinsoo')
  await page.getByLabel('Rechercher un objet').fill('enragee')
  await expect(page.getByText('Lame enragée de Guinsoo')).toBeVisible()
  await expect(page.getByText('1 objet', { exact: true })).toBeVisible()
  await page.getByLabel('Rechercher un objet').fill('TFTTutorial_Item')
  await expect(page.getByText('TFTTutorial_Item_BFSword')).toBeVisible()
  await page.getByLabel('Rechercher un objet').fill('introuvable')
  await expect(page.getByText('Aucun objet ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(page.getByText('3 objets', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})

test('permet de réessayer si les objets TFT sont indisponibles', async ({ page }) => {
  let available = false
  await page.route('**/api/ddragon/tft/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data } }),
  )
  await page.route('**/api/ddragon/tft/items', (route) =>
    available
      ? route.fulfill({
          json: {
            version,
            locale: 'fr_FR',
            data: [{ id: 'TFT_Item_BFSword', name: 'BF Glaive', icon: 'sword.png' }],
          },
        })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Objets', exact: true }).click()
  await expect(page.locator('.tft-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('BF Glaive')).toBeVisible()
})

test('la fiche reste utilisable si la compétence est indisponible puis permet de réessayer', async ({
  page,
}) => {
  let available = false
  await page.route('**/api/ddragon/tft/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data } }),
  )
  await page.route('**/api/tft/champions/*/ability', (route) =>
    available
      ? route.fulfill({ json: { ability: null, sourceVersion: '16.21' } })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: /Ahri.*Set 18/ }).click()
  await expect(page.getByRole('heading', { name: 'Ahri' })).toBeVisible()
  await expect(page.getByText('3 PO', { exact: true })).toBeVisible()
  await expect(page.locator('.tft-ability [role="alert"]')).toContainText(
    'La compétence est momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(
    page.getByText('La compétence de cette unité n’est pas disponible pour cette version.'),
  ).toBeVisible()
})
