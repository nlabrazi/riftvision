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
  await page.goto('/league')
  await status
}

test('recherche des objets, filtre et suit les composants', async ({ page }) => {
  await page.route('**/api/ddragon/items', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: items } }),
  )
  await openLeague(page)
  await page.getByRole('link', { name: 'Objets →' }).click()
  await expect(page.getByRole('heading', { name: 'Les objets.' })).toBeVisible()
  await expect(page.getByText('3 objet(s)')).toBeVisible()
  await page.getByLabel('Catégorie').selectOption('magic')
  await expect(page.getByRole('link', { name: /Baguette explosive/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Bottes/ })).toHaveCount(0)
  await page.getByLabel('Catégorie').selectOption('all')
  await page.getByLabel('Rechercher un objet').fill('berserker')
  await page.getByRole('link', { name: /Jambières du berserker/ }).click()
  await expect(page.getByRole('heading', { name: 'Jambières du berserker' })).toBeVisible()
  await expect(page.getByText('1100 PO')).toBeVisible()
  await expect(page.getByText('Vitesse d’attaque\nVitesse de déplacement')).toBeVisible()
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
  await page.getByRole('link', { name: 'Runes →' }).click()
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
