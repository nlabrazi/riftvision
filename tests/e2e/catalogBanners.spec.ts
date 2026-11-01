import { expect, test } from '@playwright/test'

const games = [
  {
    card: 'league',
    pages: [
      ['/league/champions', 'Les champions.'],
      ['/league/items', 'Les objets.'],
      ['/league/runes', 'Les runes.'],
      ['/league/patch-notes', 'Notes de patch.'],
    ],
  },
  {
    card: 'tft',
    pages: [
      ['/tft/units', 'Les unités TFT.'],
      ['/tft/traits', 'Les traits TFT.'],
      ['/tft/items', 'Les objets TFT.'],
      ['/tft/patch-notes', 'Notes de patch.'],
    ],
  },
  {
    card: 'valorant',
    pages: [
      ['/valorant/agents', 'Les agents Valorant.'],
      ['/valorant/weapons', 'Les armes Valorant.'],
      ['/valorant/maps', 'Les cartes Valorant.'],
      ['/valorant/patch-notes', 'Notes de patch.'],
    ],
  },
  {
    card: 'wow',
    pages: [
      ['/wow/classes', 'Les classes WoW.'],
      ['/wow/races', 'Les races WoW.'],
      ['/wow/patch-notes', 'Notes de patch.'],
    ],
  },
  {
    card: 'hots',
    pages: [
      ['/hots/heroes', 'Les héros du Nexus.'],
      ['/hots/maps', 'Champs de bataille.'],
      ['/hots/patch-notes', 'Notes de patch.'],
    ],
  },
]

for (const game of games) {
  test(`présente les bannières des catalogues ${game.card}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(
      (url) => url.pathname.startsWith('/api/'),
      (route) => {
        const pathname = new URL(route.request().url()).pathname
        if (pathname === '/api/riot/status') {
          return route.fulfill({ json: { status: 'DISCONNECTED', isMock: false } })
        }
        if (pathname === '/api/download/availability') {
          return route.fulfill({ json: { available: false } })
        }
        if (pathname.includes('patch-notes')) {
          return route.fulfill({ json: { sourceUrl: '', articles: [], truncated: false } })
        }
        return route.fulfill({ json: { version: '1.0.0', locale: 'fr_FR', data: [] } })
      },
    )
    const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
    await page.goto('/')
    await status
    await page.locator(`.game-card--${game.card}`).click()

    for (const [path, heading] of game.pages) {
      if (new URL(page.url()).pathname !== path) {
        await page.locator(`a[href="${path}"]`).first().click()
      }
      const banner = page.locator(`.catalog-banner--${game.card}`)
      await expect(banner.getByRole('heading', { name: heading, exact: true })).toBeVisible()
      const background = await banner.evaluate(
        (element) => getComputedStyle(element).backgroundImage,
      )
      expect(background).toContain('url(')
      if (path.endsWith('/patch-notes')) {
        await expect(banner.getByRole('link', { name: /Archive officielle/ })).toHaveAttribute(
          'target',
          '_blank',
        )
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
    }
  })
}
