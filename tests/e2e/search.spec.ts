import { expect, test } from '@playwright/test'

const version = '16.21.1'
const champions = {
  version,
  locale: 'fr_FR',
  data: {
    Ahri: {
      id: 'Ahri',
      key: '103',
      name: 'Ahri',
      title: 'Renarde à neuf queues',
      image: { full: 'Ahri.png' },
      tags: ['Mage'],
    },
  },
}
const items = {
  version,
  locale: 'fr_FR',
  data: [
    {
      id: '1001',
      name: 'Bottes',
      summary: 'Déplacement',
      description: 'Vitesse',
      icon: '1001.png',
      totalGold: 300,
      sellGold: 210,
      tags: ['Boots'],
      from: [],
      into: [],
    },
  ],
}
const runes = {
  version,
  locale: 'fr_FR',
  data: [
    {
      id: 8100,
      name: 'Domination',
      icon: 'perk-images/Styles/7200_Domination.png',
      runes: [
        {
          id: 8112,
          name: 'Électrocution',
          icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
          shortDescription: 'Dégâts',
          longDescription: 'Dégâts',
          keystone: true,
        },
      ],
    },
  ],
}

const tftChampions = {
  version,
  locale: 'fr_FR',
  data: [
    { id: 'DA_Ahri', name: 'Ahri', tier: 3, cost: 3, icon: 'DA_Ahri.png', setNumber: 18 },
    { id: 'TFT17_Ahri', name: 'Ahri', tier: 4, cost: 4, icon: 'TFT17_Ahri.png', setNumber: 17 },
  ],
}
const tftTraits = {
  version,
  locale: 'fr_FR',
  data: [
    { id: 'DA_18_Solar', name: 'Solaire', icon: 'solar.png' },
    { id: 'DA_18_SolarPlus', name: 'Solaire', icon: 'solar.png' },
  ],
}
const tftItems = {
  version,
  locale: 'fr_FR',
  data: [
    { id: 'TFT_Item_BFSword', name: 'BF Glaive', icon: 'sword.png' },
    { id: 'TFT_Item_BFSwordPlus', name: 'BF Glaive', icon: 'sword.png' },
  ],
}

async function mockTft(page: import('@playwright/test').Page) {
  await page.route('**/api/ddragon/tft/champions', (route) => route.fulfill({ json: tftChampions }))
  await page.route('**/api/ddragon/tft/traits', (route) => route.fulfill({ json: tftTraits }))
  await page.route('**/api/ddragon/tft/items', (route) => route.fulfill({ json: tftItems }))
}

const valorantAgents = {
  locale: 'fr-FR',
  data: [
    {
      id: 'e370fa57-4757-3604-3648-499e1f642d3f',
      name: 'Gekko',
      role: 'Initiateur',
      description: 'Un agent.',
      icon: 'https://media.valorant-api.com/gekko.png',
      portrait: null,
      abilities: [],
    },
  ],
}
const valorantWeapons = {
  locale: 'fr-FR',
  data: [
    {
      id: '9c82e19d-4575-0200-1a81-3eacf00cf872',
      name: 'Vandal',
      category: 'Rifle',
      icon: 'https://media.valorant-api.com/vandal.png',
      cost: 2900,
      magazine: 25,
      fireRate: 9.75,
      reloadSeconds: 2.5,
      pelletCount: 1,
      damageRanges: [],
    },
  ],
}
const valorantMaps = {
  locale: 'fr-FR',
  data: [
    {
      id: 'ee613ee9-28b7-4beb-9666-08db13bb2244',
      name: 'Entraînement',
      splash: null,
      minimap: null,
      tacticalDescription: null,
      narrativeDescription: null,
      callouts: [],
    },
    {
      id: 'ee613ee9-28b7-4beb-9666-08db13bb2245',
      name: 'Entraînement',
      splash: null,
      minimap: null,
      tacticalDescription: null,
      narrativeDescription: null,
      callouts: [],
    },
  ],
}

async function mockValorant(page: import('@playwright/test').Page) {
  await page.route('**/api/valorant/agents', (route) => route.fulfill({ json: valorantAgents }))
  await page.route('**/api/valorant/weapons', (route) => route.fulfill({ json: valorantWeapons }))
  await page.route('**/api/valorant/maps', (route) => route.fulfill({ json: valorantMaps }))
}

const wowClasses = {
  locale: 'fr_FR',
  edition: 'retail',
  data: [
    { id: 8, name: 'Mage', icon: null },
    { id: 11, name: 'Druide', icon: null },
  ],
}
const wowRaces = {
  locale: 'fr_FR',
  edition: 'retail',
  data: [
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
const wowSpecializations = {
  locale: 'fr_FR',
  edition: 'retail',
  data: [
    { id: 62, name: 'Arcanes', class: { id: 8, name: 'Mage' }, icon: null },
    { id: 102, name: 'Équilibre', class: { id: 11, name: 'Druide' }, icon: null },
  ],
}

async function mockWow(page: import('@playwright/test').Page) {
  await page.route('**/api/wow/classes', (route) => route.fulfill({ json: wowClasses }))
  await page.route('**/api/wow/races', (route) => route.fulfill({ json: wowRaces }))
  await page.route('**/api/wow/specializations', (route) =>
    route.fulfill({ json: wowSpecializations }),
  )
}

async function openHome(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('recherche les contenus et ouvre leur fiche au clavier', async ({ page }) => {
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) => route.fulfill({ json: items }))
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await mockTft(page)
  await mockValorant(page)
  await mockWow(page)
  await openHome(page)

  const open = page.getByRole('button', { name: 'Rechercher', exact: true })
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  const field = dialog.getByRole('searchbox', { name: 'Rechercher dans les encyclopédies' })
  await expect(field).toBeFocused()
  await field.fill('renarde')
  await expect(
    dialog.getByRole('region', { name: 'Champions · LoL' }).getByRole('link', { name: /Ahri/ }),
  ).toBeVisible()
  await field.fill('bottes')
  await expect(dialog.getByRole('link', { name: /Bottes/ })).toBeVisible()
  await field.fill('electrocution')
  await expect(dialog.getByRole('link', { name: /Électrocution/ })).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Fermer la recherche' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('link', { name: /Électrocution/ })).toBeFocused()
  await field.focus()
  await field.fill('introuvable')
  await expect(dialog.getByText('Aucun résultat. Essayez un autre terme.')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
  await open.click()
  await page.setViewportSize({ width: 390, height: 844 })
  await dialog.getByRole('searchbox').fill('bottes')
  await dialog.getByRole('link', { name: /Bottes/ }).focus()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/league\/items\/1001$/)
  await expect(page.getByRole('heading', { name: 'Bottes', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rechercher', exact: true })).toBeVisible()
})

test('conserve les résultats disponibles et permet de réessayer une source en erreur', async ({
  page,
}) => {
  let itemsAvailable = false
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) =>
    itemsAvailable
      ? route.fulfill({ json: items })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await mockTft(page)
  await mockValorant(page)
  await mockWow(page)
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  const field = dialog.getByRole('searchbox')
  await field.fill('ahri')
  await expect(dialog.getByRole('alert')).toContainText('objets')
  await expect(
    dialog.getByRole('region', { name: 'Champions · LoL' }).getByRole('link', { name: /Ahri/ }),
  ).toBeVisible()
  itemsAvailable = true
  await dialog.getByRole('button', { name: 'Réessayer' }).click()
  await field.fill('bottes')
  await expect(dialog.getByRole('link', { name: /Bottes/ })).toBeVisible()
  await expect(dialog.getByRole('alert')).toHaveCount(0)
})

test('recherche des contenus TFT et ouvre le catalogue filtré sur le bon identifiant', async ({
  page,
}) => {
  await page.route('**/api/tft/champions/*/ability', (route) =>
    route.fulfill({ json: { ability: null, sourceVersion: '16.21' } }),
  )
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) => route.fulfill({ json: items }))
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await mockTft(page)
  await mockValorant(page)
  await mockWow(page)
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  const field = dialog.getByRole('searchbox')
  await field.fill('ahri')
  await expect(
    dialog.getByRole('region', { name: 'Champions · LoL' }).getByRole('link', { name: /Ahri/ }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('region', { name: 'Unités · TFT' }).getByRole('link', { name: /Ahri/ }),
  ).toHaveCount(2)
  await dialog
    .getByRole('region', { name: 'Unités · TFT' })
    .getByRole('link', { name: /Ahri.*Set 18/ })
    .click()
  await expect(page).toHaveURL(/\/tft\/champions\/DA_Ahri$/)
  await expect(page.getByRole('heading', { name: 'Ahri' })).toBeVisible()
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  await dialog.getByRole('searchbox').fill('solaire')
  await dialog.getByRole('link', { name: 'Solaire DA_18_Solar', exact: true }).click()
  await expect(page).toHaveURL(/\/tft\/traits\?id=DA_18_Solar$/)
  await expect(page.getByLabel('Rechercher un trait')).toHaveValue('DA_18_Solar')
  await expect(page.getByText('1 trait', { exact: true })).toBeVisible()
  await expect(page.getByText('DA_18_SolarPlus', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  await dialog.getByRole('searchbox').fill('glaive')
  await dialog.getByRole('link', { name: 'BF Glaive TFT_Item_BFSword', exact: true }).click()
  await expect(page).toHaveURL(/\/tft\/items\?id=TFT_Item_BFSword$/)
  await expect(page.getByText('1 objet', { exact: true })).toBeVisible()
  await expect(page.getByText('TFT_Item_BFSwordPlus', { exact: true })).toHaveCount(0)
  await page.getByLabel('Rechercher un objet').fill('glaive')
  await expect(page.getByText('2 objets', { exact: true })).toBeVisible()
})

test('préserve les résultats LoL et TFT lorsque le catalogue de traits TFT échoue', async ({
  page,
}) => {
  let available = false
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) => route.fulfill({ json: items }))
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await page.route('**/api/ddragon/tft/champions', (route) => route.fulfill({ json: tftChampions }))
  await page.route('**/api/ddragon/tft/items', (route) => route.fulfill({ json: tftItems }))
  await page.route('**/api/ddragon/tft/traits', (route) =>
    available
      ? route.fulfill({ json: tftTraits })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await mockValorant(page)
  await mockWow(page)
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  await dialog.getByRole('searchbox').fill('ahri')
  await expect(dialog.getByRole('alert')).toContainText('traits TFT')
  await expect(
    dialog.getByRole('region', { name: 'Champions · LoL' }).getByRole('link', { name: /Ahri/ }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('region', { name: 'Unités · TFT' }).getByRole('link', { name: /Ahri/ }),
  ).toHaveCount(2)
  available = true
  await dialog.getByRole('button', { name: 'Réessayer' }).click()
  await dialog.getByRole('searchbox').fill('solaire')
  await expect(dialog.getByRole('link', { name: 'Solaire DA_18_Solar', exact: true })).toBeVisible()
  await expect(dialog.getByRole('alert')).toHaveCount(0)
})

test('recherche agents, armes et cartes Valorant puis ouvre les bonnes fiches', async ({
  page,
}) => {
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) => route.fulfill({ json: items }))
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await mockTft(page)
  await mockValorant(page)
  await mockWow(page)
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  await dialog.getByRole('searchbox').fill('gekko')
  await dialog
    .getByRole('region', { name: 'Agents · Valorant' })
    .getByRole('link', { name: /Gekko.*Initiateur/ })
    .click()
  await expect(page).toHaveURL(/\/valorant\/agents\/e370fa57-4757-3604-3648-499e1f642d3f$/)
  await expect(page.getByRole('heading', { name: 'Gekko' })).toBeVisible()
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  await dialog.getByRole('searchbox').fill('vandal')
  await dialog
    .getByRole('region', { name: 'Armes · Valorant' })
    .getByRole('link', { name: /Vandal.*Fusils/ })
    .click()
  await expect(page).toHaveURL(/\/valorant\/weapons\/9c82e19d-4575-0200-1a81-3eacf00cf872$/)
  await expect(page.getByRole('heading', { name: 'Vandal' })).toBeVisible()
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  await dialog.getByRole('searchbox').fill('entrainement')
  await expect(
    dialog.getByRole('region', { name: 'Cartes · Valorant' }).getByRole('link'),
  ).toHaveCount(2)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await dialog
    .getByRole('link', { name: /Entraînement.*ee613ee9-28b7-4beb-9666-08db13bb2244/ })
    .click()
  await expect(page).toHaveURL(/\/valorant\/maps\/ee613ee9-28b7-4beb-9666-08db13bb2244$/)
  await expect(page.getByRole('heading', { name: 'Entraînement' })).toBeVisible()
})

test('garde les autres résultats accessibles si les cartes Valorant échouent', async ({ page }) => {
  let available = false
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) => route.fulfill({ json: items }))
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await mockTft(page)
  await mockValorant(page)
  await page.route('**/api/valorant/maps', (route) =>
    available
      ? route.fulfill({ json: valorantMaps })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await mockWow(page)
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  await dialog.getByRole('searchbox').fill('gekko')
  await expect(dialog.getByRole('alert')).toContainText('cartes Valorant')
  await expect(
    dialog.getByRole('region', { name: 'Agents · Valorant' }).getByRole('link', { name: /Gekko/ }),
  ).toBeVisible()
  available = true
  await dialog.getByRole('button', { name: 'Réessayer' }).click()
  await dialog.getByRole('searchbox').fill('entrainement')
  await expect(
    dialog.getByRole('region', { name: 'Cartes · Valorant' }).getByRole('link'),
  ).toHaveCount(2)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
})

test('recherche les classes, races et spécialisations WoW depuis les encyclopédies', async ({
  page,
}) => {
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) => route.fulfill({ json: items }))
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await mockTft(page)
  await mockValorant(page)
  await mockWow(page)
  await page.route('**/api/wow/classes/8', (route) =>
    route.fulfill({
      json: {
        locale: 'fr_FR',
        edition: 'retail',
        data: {
          id: 8,
          name: 'Mage',
          icon: null,
          powerType: 'Mana',
          specializations: [{ id: 62, name: 'Arcanes' }],
        },
      },
    }),
  )
  await page.route('**/api/wow/specializations/62', (route) =>
    route.fulfill({
      json: {
        locale: 'fr_FR',
        edition: 'retail',
        data: {
          id: 62,
          name: 'Arcanes',
          class: { id: 8, name: 'Mage' },
          role: 'Dégâts',
          powerType: 'Mana',
          primaryStat: 'Intelligence',
          descriptionMale: 'Magie.',
          descriptionFemale: 'Magie.',
          icon: null,
        },
      },
    }),
  )
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  await dialog.getByRole('searchbox').fill('mage')
  await expect(
    dialog
      .getByRole('region', { name: 'Spécialisations · WoW' })
      .getByRole('link', { name: /Arcanes.*Mage/ }),
  ).toBeVisible()
  await dialog
    .getByRole('region', { name: 'Classes · WoW' })
    .getByRole('link', { name: /Mage/ })
    .click()
  await expect(page).toHaveURL(/\/wow\/classes\/8$/)
  await expect(page.getByRole('heading', { name: 'Mage' })).toBeVisible()
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  await dialog.getByRole('searchbox').fill('pandaren')
  await expect(dialog.getByRole('region', { name: 'Races · WoW' }).getByRole('link')).toHaveCount(2)
  await dialog.getByRole('link', { name: /Pandaren.*Horde/ }).click()
  await expect(page).toHaveURL(/\/wow\/races\/26$/)
  await expect(page.getByRole('heading', { name: 'Pandaren' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  await dialog.getByRole('searchbox').fill('arcanes')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await dialog.getByRole('link', { name: /Arcanes.*Mage/ }).click()
  await expect(page).toHaveURL(/\/wow\/specializations\/62$/)
  await expect(page.getByRole('heading', { name: 'Arcanes' })).toBeVisible()
})

test('les autres contenus restent accessibles si l’index des spécialisations WoW échoue', async ({
  page,
}) => {
  let available = false
  let classesRequests = 0
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) => route.fulfill({ json: items }))
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await mockTft(page)
  await mockValorant(page)
  await mockWow(page)
  await page.route('**/api/wow/classes', (route) => {
    classesRequests++
    return route.fulfill({ json: wowClasses })
  })
  await page.route('**/api/wow/specializations', (route) =>
    available
      ? route.fulfill({ json: wowSpecializations })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  await dialog.getByRole('searchbox').fill('mage')
  await expect(dialog.getByRole('alert')).toContainText('spécialisations WoW')
  await expect(
    dialog.getByRole('region', { name: 'Classes · WoW' }).getByRole('link', { name: /Mage/ }),
  ).toBeVisible()
  await dialog.getByRole('searchbox').fill('ahri')
  await expect(
    dialog.getByRole('region', { name: 'Champions · LoL' }).getByRole('link', { name: /Ahri/ }),
  ).toBeVisible()
  available = true
  await dialog.getByRole('button', { name: 'Réessayer' }).click()
  await dialog.getByRole('searchbox').fill('arcanes')
  await expect(dialog.getByRole('link', { name: /Arcanes.*Mage/ })).toBeVisible()
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  expect(classesRequests).toBe(1)
})
