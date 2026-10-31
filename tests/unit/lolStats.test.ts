import { describe, expect, it } from 'vitest'
import { itemStatLines, lolStatIcon } from '../../app/utils/lolStats'

describe('présentation des statistiques des objets', () => {
  it('lit les statistiques affichées par Riot sans déduire les effets passifs', () => {
    const result = itemStatLines(
      '<mainText><stats><attention>+20</attention> puissance<br><attention>+100</attention> PV<br>+30 armure</stats><br><passive>+5 puissance</passive></mainText>',
    )
    expect(result.map((item) => item.text)).toEqual(['+20 puissance', '+100 PV', '+30 armure'])
    expect(
      result.every((item) => item.icon?.startsWith('https://ddragon.leagueoflegends.com/')),
    ).toBe(true)
  })
  it('conserve les statistiques inconnues sans leur attribuer une icône trompeuse', () => {
    expect(itemStatLines('<stats>+5 portée</stats>')).toEqual([{ text: '+5 portée', icon: null }])
    expect(itemStatLines('<p>Sans bloc de statistiques</p>')).toEqual([])
    expect(lolStatIcon('unknown')).toBeNull()
  })
})
