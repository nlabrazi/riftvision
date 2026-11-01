import { expect, test } from '@playwright/test'

const version = '16.21.1'
const items = [
  {
    id: '1001',
    name: 'Bottes',
    description: '<stats>+25 vitesse de déplacement</stats>',
    summary: 'Déplacement',
    icon: '1001.png',
    totalGold: 300,
    sellGold: 210,
    tags: ['Boots'],
    from: [],
    into: ['3006'],
  },
  {
    id: '3006',
    name: 'Jambières du berserker',
    description: '<stats>Vitesse d’attaque<br>Vitesse de déplacement</stats>',
    summary: 'Vitesse d’attaque',
    icon: '3006.png',
    totalGold: 1100,
    sellGold: 770,
    tags: ['Boots', 'AttackSpeed'],
    from: ['1001', '99999'],
    into: [],
  },
  {
    id: '1026',
    name: 'Baguette explosive',
    description: 'Puissance',
    summary: 'Puissance',
    icon: '1026.png',
    totalGold: 850,
    sellGold: 595,
    tags: ['SpellDamage'],
    from: [],
    into: [],
  },
]
const paths = [
  {
    id: 8100,
    name: 'Domination',
    icon: 'perk-images/Styles/7200_Domination.png',
    runes: [
      {
        id: 8112,
        name: 'Électrocution',
        icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
        shortDescription: 'Dégâts <b>adaptatifs</b>.',
        longDescription: 'Inflige des dégâts.<br>Délai : 20 sec. @Variable@',
        keystone: true,
      },
    ],
  },
  {
    id: 8000,
    name: 'Précision',
    icon: 'perk-images/Styles/7201_Precision.png',
    runes: [
      {
        id: 8005,
        name: 'Attaque soutenue',
        icon: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
        shortDescription: 'Attaques.',
        longDescription: 'Des attaques.',
        keystone: true,
      },
    ],
  },
]

async function openLeague(page: import('@playwright/test').Page) {
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
  await page.locator('.game-card--league').click()
}

test('conserve la bannière des objets si les données sont indisponibles', async ({ page }) => {
  await page.route('**/api/ddragon/items', (route) =>
    route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openLeague(page)
  await page.getByRole('link', { name: 'Objets', exact: true }).click()
  await expect(
    page.locator('.catalog-banner--league').getByRole('heading', { name: 'Les objets.' }),
  ).toBeVisible()
  await expect(page.locator('.encyclopedia-notice[role="alert"]')).toBeVisible()
})

test('recherche des objets, filtre et suit les composants', async ({ page }) => {
  await page.route('**/api/ddragon/items', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: items } }),
  )
  await openLeague(page)
  await page.getByRole('link', { name: 'Objets', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Les objets.' })).toBeVisible()
  await expect(page.getByText('3 objet(s)')).toBeVisible()
  await page.getByLabel('Catégorie').selectOption('magic')
  await expect(page.getByRole('link', { name: /Baguette explosive/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Bottes/ })).toHaveCount(0)
  await page.getByLabel('Catégorie').selectOption('all')
  await page.getByLabel('Rechercher un objet').fill('berserker')
  await page.getByRole('link', { name: /Jambières du berserker/ }).click()
  await expect(page.getByRole('heading', { name: 'Jambières du berserker' })).toBeVisible()
  await expect(page.getByRole('complementary').getByText('1100 PO')).toBeVisible()
  await expect(page.locator('.item-stat-list')).toContainText('Vitesse d’attaque')
  await expect(page.locator('.item-stat-list')).toContainText('Vitesse de déplacement')
  await expect(
    page.getByText(/Certains composants ou améliorations ne sont pas affichés/),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Bottes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bottes', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})

test('filtre les runes par voie et affiche leur description', async ({ page }) => {
  await page.route('**/api/ddragon/runes', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: paths } }),
  )
  await openLeague(page)
  await page.getByRole('link', { name: 'Runes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Les runes.' })).toBeVisible()
  await page.getByLabel('Voie').selectOption('8100')
  await expect(page.getByRole('link', { name: /Électrocution/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Attaque soutenue/ })).toHaveCount(0)
  await page.getByLabel('Rechercher une rune').fill('electrocution')
  await page.getByRole('link', { name: /Électrocution/ }).click()
  await expect(page.getByRole('heading', { name: 'Électrocution' })).toBeVisible()
  await expect(page.getByText('DOMINATION · RUNE FONDAMENTALE')).toBeVisible()
  await expect(
    page.getByText('Inflige des dégâts.\nDélai : 20 sec. [valeur indisponible]'),
  ).toBeVisible()
  await page.getByRole('link', { name: '← Retour aux runes' }).click()
  await expect(page.getByRole('heading', { name: 'Les runes.' })).toBeVisible()
})

test('présente les statistiques et la fabrication avec les visuels officiels', async ({ page }) => {
  const mejai = {
    id: '3041',
    name: 'Voleur d’âmes de Mejai',
    icon: '3041.png',
    summary: 'Puissance',
    description:
      '<mainText><stats><attention>+20</attention> puissance<br><attention>+100</attention> PV</stats><br><passive>Gloire</passive><br>Participer à une élimination.</mainText>',
    totalGold: 1500,
    sellGold: 1050,
    tags: ['SpellDamage'],
    from: ['1082'],
    into: [],
  }
  const seal = { ...items[0], id: '1082', name: 'Sceau noir', icon: '1082.png', into: ['3041'] }
  await page.route('**/api/ddragon/items', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: [mejai, seal] } }),
  )
  await openLeague(page)
  await page.getByRole('link', { name: 'Objets', exact: true }).click()
  await page.getByRole('link', { name: /Voleur d’âmes de Mejai/ }).click()
  await expect(page.getByText('+20 puissance')).toBeVisible()
  await expect(page.getByText('+100 PV')).toBeVisible()
  await expect(page.locator('.item-stat-list img')).toHaveCount(2)
  await expect(page.getByText('Participer à une élimination.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sceau noir' }).locator('img')).toHaveAttribute(
    'src',
    /1082\.png$/,
  )
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})
