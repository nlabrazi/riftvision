import { expect, test } from '@playwright/test'

test('présente les jeux et mène aux actions League of Legends', async ({ page, request }) => {
  await request.post('/api/riot/mock', { data: { enabled: false } })
  const initialStatus = page.waitForResponse((response) =>
    response.url().includes('/api/riot/status'),
  )
  await page.goto('/')
  await initialStatus

  await expect(page.getByRole('heading', { name: 'Tous les jeux.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Teamfight Tactics' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Valorant' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'World of Warcraft' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Counter-Strike 2' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Heroes of the Storm' })).toBeVisible()
  await expect(page.locator('article.game-card').filter({ hasText: 'À venir' })).toHaveCount(5)

  await page.getByRole('link', { name: /Accéder à League of Legends/ }).click()
  await expect(page).toHaveURL(/\/league$/)
  await expect(page.getByRole('heading', { name: 'Bienvenue dans la Faille.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Champions', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connecter ma partie', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Explorer la démo' }).click()
  await expect(page.getByTestId('status-banner')).toContainText('Démo')
  await expect(page.getByTestId('scoreboard-header')).toBeVisible()
})

test('ouvre directement l’espace League of Legends et revient au portail', async ({
  page,
  request,
}) => {
  await request.post('/api/riot/mock', { data: { enabled: false } })
  await page.goto('/league')

  await expect(page.getByRole('heading', { name: 'Bienvenue dans la Faille.' })).toBeVisible()
  await expect(page.locator('.league-section').filter({ hasText: 'À venir' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Explorer la démo' })).toBeVisible()
  await page.getByRole('link', { name: 'Tous les jeux', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Tous les jeux.' })).toBeVisible()
})

test('affiche la galerie sur mobile sans débordement horizontal', async ({ page, request }) => {
  await request.post('/api/riot/mock', { data: { enabled: false } })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'World of Warcraft' })).toBeVisible()
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(hasOverflow).toBe(false)
})

test('anime la carte disponible au clavier et respecte la réduction des mouvements', async ({
  page,
  request,
}) => {
  await request.post('/api/riot/mock', { data: { enabled: false } })
  await page.goto('/')
  const leagueCard = page.getByRole('link', { name: /Accéder à League of Legends/ })

  await leagueCard.focus()
  await expect(leagueCard).toBeFocused()
  await expect
    .poll(() => leagueCard.evaluate((card) => getComputedStyle(card).transform))
    .not.toBe('none')

  const tftCard = page.locator('.game-card--tft')
  await tftCard.hover()
  await expect
    .poll(() => tftCard.evaluate((card) => getComputedStyle(card).transform))
    .not.toBe('none')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() => leagueCard.evaluate((card) => getComputedStyle(card).transform))
    .toBe('none')
  await expect.poll(() => tftCard.evaluate((card) => getComputedStyle(card).transform)).toBe('none')
  await expect(leagueCard).toBeFocused()
})

test('charge les illustrations des jeux', async ({ page }) => {
  await page.goto('/')
  for (const game of ['league', 'tft', 'valorant', 'cs2', 'hots', 'wow']) {
    const art = page.locator(`.game-card--${game} .game-card__art`)
    const imageUrl = await art.evaluate((element) => {
      const background = getComputedStyle(element, '::before').backgroundImage
      return background.match(/url\("?([^"\)]+)"?\)/)?.[1]
    })
    expect(imageUrl, `Image manquante pour ${game}`).toBeTruthy()
    const response = await page.request.get(imageUrl as string)
    expect(response.ok(), `Image inaccessible pour ${game}`).toBe(true)
    expect(response.headers()['content-type']).toMatch(/^image\//)
  }
})

test('lit les vidéos au survol et les retire à la sortie', async ({ page }) => {
  const initialStatus = page.waitForResponse((response) =>
    response.url().includes('/api/riot/status'),
  )
  await page.goto('/')
  await initialStatus
  for (const game of ['league', 'tft', 'valorant', 'cs2', 'hots', 'wow']) {
    const card = page.locator(`.game-card--${game}`)
    const video = card.locator('video')
    await expect(video).toHaveCount(0)
    await card.hover()
    await expect(video).toBeAttached()
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => !element.paused && element.readyState >= 2),
      )
      .toBe(true)
    await page.locator('#portal-title').hover()
    await expect(video).toHaveCount(0)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('.game-card--tft').hover()
  await expect(page.locator('.game-card--tft video')).toHaveCount(0)
})

test('filtre la galerie par genre et revient à tous les jeux', async ({ page }) => {
  const initialStatus = page.waitForResponse((response) =>
    response.url().includes('/api/riot/status'),
  )
  await page.goto('/')
  await initialStatus

  const filters = page.getByRole('group', { name: 'Filtrer les jeux par genre' })
  await expect(filters.getByRole('button', { name: 'Tous' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.game-card')).toHaveCount(7)
  await filters.getByRole('button', { name: 'FPS' }).click()
  await expect(filters.getByRole('button', { name: 'FPS' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.game-card')).toHaveCount(2)
  await expect(page.getByRole('heading', { name: 'Valorant' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Counter-Strike 2' })).toBeVisible()
  await filters.getByRole('button', { name: 'MOBA' }).click()
  await expect(page.getByRole('heading', { name: 'Heroes of the Storm' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'League of Legends' })).toBeVisible()
  await filters.getByRole('button', { name: 'MMO' }).click()
  await expect(page.locator('.game-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'World of Warcraft' })).toBeVisible()
  await filters.getByRole('button', { name: 'Stratégie' }).click()
  await expect(page.locator('.game-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Teamfight Tactics' })).toBeVisible()
  await filters.getByRole('button', { name: 'Tous' }).click()
  await expect(page.locator('.game-card')).toHaveCount(7)
})
