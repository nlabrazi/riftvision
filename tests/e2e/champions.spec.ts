import { expect, test } from '@playwright/test'

const version = '16.21.1'
const ahri = {
  id: 'Ahri',
  key: '103',
  name: 'Ahri',
  title: 'Renarde à neuf queues',
  image: { full: 'Ahri.png' },
  tags: ['Mage', 'Assassin'],
}
const garen = {
  id: 'Garen',
  key: '86',
  name: 'Garen',
  title: 'La Force de Demacia',
  image: { full: 'Garen.png' },
  tags: ['Fighter', 'Tank'],
}
const details = {
  ...ahri,
  lore: 'Une voyageuse du royaume spirituel.',
  stats: { hp: 590, attackdamage: 53, armor: 21, spellblock: 30, movespeed: 330, attackrange: 550 },
  passive: {
    name: 'Vol essentiel',
    description: 'Ahri récupère des PV.<br>Après une élimination.',
    image: { full: 'Ahri_SoulEater2.png' },
  },
  spells: [
    { name: 'Orbe d’illusion', description: 'Ahri lance son orbe.', image: { full: 'AhriQ.png' } },
    { name: 'Luciole', description: 'Ahri libère des lucioles.', image: { full: 'AhriW.png' } },
    { name: 'Charme', description: 'Ahri charme sa cible.', image: { full: 'AhriE.png' } },
    { name: 'Assaut spirituel', description: 'Ahri bondit.', image: { full: 'AhriR.png' } },
  ],
}

async function openLeague(page: import('@playwright/test').Page) {
  const initialStatus = page.waitForResponse((response) =>
    response.url().includes('/api/riot/status'),
  )
  await page.goto('/')
  await initialStatus
  await page.locator('.game-card--league').click()
  await page.getByTestId('encyclopedia-action').click()
}

test('recherche, filtre et ouvre une fiche de champion', async ({ page }) => {
  const video = (slot: string) => ({
    videoMp4: `https://lol.dyn.riotcdn.net/x/videos/champion-abilities/0103/ability_0103_${slot}1.mp4`,
    videoWebm: `https://lol.dyn.riotcdn.net/x/videos/champion-abilities/0103/ability_0103_${slot}1.webm`,
    poster: `https://lol.dyn.riotcdn.net/x/videos/champion-abilities/0103/ability_0103_${slot}1.jpg`,
  })
  await page.route('**/api/league/champion-abilities/**', (route) =>
    route.fulfill({ json: { abilities: { P: video('P'), Q: video('Q') } } }),
  )
  await page.route('**/x/videos/champion-abilities/**/*.mp4', (route) =>
    route.fulfill({ path: 'public/assets/videos/tft.mp4', contentType: 'video/mp4' }),
  )
  await page.route('**/api/ddragon/champions**', (route) => {
    const path = new URL(route.request().url()).pathname
    return route.fulfill({
      json: path.endsWith('/Ahri')
        ? { version, locale: 'fr_FR', data: details }
        : { version, locale: 'fr_FR', data: { Ahri: ahri, Garen: garen } },
    })
  })
  await openLeague(page)
  await expect(page).toHaveURL(/\/league\/champions$/)
  await expect(page.getByText('2 champions', { exact: true })).toBeVisible()
  await expect(page.getByText(`Données Data Dragon · ${version}`)).toBeVisible()

  await page.getByLabel('Rechercher un champion').fill('renarde')
  await expect(page.getByRole('link', { name: /Ahri/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Garen/ })).toHaveCount(0)
  await page.getByLabel('Rechercher un champion').fill('')
  await page.getByLabel('Classe').selectOption('Fighter')
  await expect(page.getByRole('link', { name: /Garen/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ahri/ })).toHaveCount(0)
  await page.getByLabel('Rechercher un champion').fill('introuvable')
  await expect(page.getByText('Aucun champion ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await page.getByRole('link', { name: /Ahri/ }).click()

  await expect(page).toHaveURL(/\/league\/champions\/Ahri$/)
  await expect(page.getByRole('heading', { name: 'Ahri', exact: true })).toBeVisible()
  await expect(page.getByText('Une voyageuse du royaume spirituel.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Vol essentiel' })).toBeVisible()
  await expect(page.getByText('Ahri récupère des PV. Après une élimination.')).toBeVisible()
  const abilityVideo = page.locator('.ability-view video')
  await expect(abilityVideo.locator('source[type="video/mp4"]')).toHaveAttribute(
    'src',
    /0103_P1\.mp4$/,
  )
  await expect
    .poll(() => abilityVideo.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(false)
  await page.getByRole('button', { name: 'A : Orbe d’illusion' }).click()
  await expect(page.getByRole('heading', { name: 'Orbe d’illusion' })).toBeVisible()
  await expect(abilityVideo.locator('source[type="video/mp4"]')).toHaveAttribute(
    'src',
    /0103_Q1\.mp4$/,
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(abilityVideo).not.toHaveAttribute('autoplay', '')
  await expect(abilityVideo).toHaveAttribute('controls', '')
  await expect
    .poll(() => abilityVideo.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true)
  await page.getByRole('button', { name: 'Z : Luciole' }).click()
  await expect(page.getByText('Aperçu vidéo indisponible.')).toBeVisible()
  await expect(page.getByText('Points de vie')).toBeVisible()
  await expect(page.locator('dd').filter({ hasText: '590' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour aux champions' }).click()
  await expect(page.getByRole('heading', { name: 'Les champions.' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})

test('permet de réessayer après une erreur du catalogue', async ({ page }) => {
  let available = false
  await page.route('**/api/ddragon/champions', (route) => {
    return available
      ? route.fulfill({ json: { version, locale: 'fr_FR', data: { Ahri: ahri } } })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } })
  })
  await openLeague(page)
  await expect(page.locator('.encyclopedia-notice[role="alert"]')).toContainText(
    'Le catalogue est momentanément indisponible.',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByRole('link', { name: /Ahri/ })).toBeVisible()
})

test('affiche une fiche introuvable et permet de revenir au catalogue', async ({ page }) => {
  const ghost = { ...ahri, id: 'Unknown', name: 'Inconnu' }
  await page.route('**/api/ddragon/champions**', (route) =>
    new URL(route.request().url()).pathname.endsWith('/Unknown')
      ? route.fulfill({
          status: 404,
          json: { statusCode: 404, statusMessage: 'Champion introuvable' },
        })
      : route.fulfill({ json: { version, locale: 'fr_FR', data: { Unknown: ghost } } }),
  )
  await openLeague(page)
  await page.getByRole('link', { name: /Inconnu/ }).click()
  await expect(page.locator('.encyclopedia-notice[role="alert"]')).toContainText(
    'Ce champion est introuvable.',
  )
  await page.getByRole('link', { name: '← Retour aux champions' }).click()
  await expect(page.getByRole('heading', { name: 'Les champions.' })).toBeVisible()
})
