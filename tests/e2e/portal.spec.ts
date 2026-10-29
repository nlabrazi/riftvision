import { expect, test } from '@playwright/test'

test('présente les jeux et mène aux actions League of Legends', async ({ page, request }) => {
  await request.post('/api/riot/mock', { data: { enabled: false } })
  const initialStatus = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await initialStatus

  await expect(page.getByRole('heading', { name: 'Jeux compétitifs.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'D’autres univers.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Teamfight Tactics' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Valorant' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'World of Warcraft' })).toBeVisible()
  await expect(page.locator('article.game-card').filter({ hasText: 'À venir' })).toHaveCount(4)

  await page.getByRole('link', { name: /Accéder à League of Legends/ }).click()
  await expect(page).toHaveURL(/#league-of-legends$/)
  await expect(page.getByRole('button', { name: 'Connecter ma partie', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Explorer la démo' }).click()
  await expect(page.getByTestId('status-banner')).toContainText('Démo')
  await expect(page.getByTestId('scoreboard-header')).toBeVisible()
})

test('affiche la galerie sur mobile sans débordement horizontal', async ({ page, request }) => {
  await request.post('/api/riot/mock', { data: { enabled: false } })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'World of Warcraft' })).toBeVisible()
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasOverflow).toBe(false)
})
