import { describe, expect, it, vi } from 'vitest'
import { createTftAbilitiesClient } from '../../server/utils/tftAbilities'
import { DataDragonUnavailableError } from '../../server/utils/dataDragon'

const ability = {
  name: 'Éclair',
  desc: '<spellActive>Actif :</spellActive> inflige @ModifiedDamage@&nbsp;pts de dégâts.\r\\n\r\\nBonus %i:scaleAP%.',
  icon: 'ASSETS/Characters/Ahri/HUD/Icons2D/Ahri_Q.tex',
}
const source = {
  setData: [
    { number: 18, champions: [{ apiName: 'DA_Ahri', ability }] },
    { number: 18, champions: [{ apiName: 'DA_Ahri', ability }] },
    {
      number: 17,
      champions: [{ apiName: 'DA_Ahri', ability: { name: 'Autre', desc: 'Autre effet' } }],
    },
    { number: 18, champions: [{ apiName: 'TFT_Broken', ability: { name: '', desc: '' } }] },
  ],
}

describe('compétences TFT CommunityDragon', () => {
  it('associe une unité à son set et rend les variables lisibles sans HTML', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createTftAbilitiesClient(fetcher)
    expect(await client.getAbility('DA_Ahri', 18, '16.21.1')).toEqual({
      name: 'Éclair',
      description: 'Actif : inflige valeur variable pts de dégâts.\n\nBonus .',
      icon: 'https://raw.communitydragon.org/16.21/game/assets/characters/ahri/hud/icons2d/ahri_q.png',
    })
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://raw.communitydragon.org/16.21/cdragon/tft/fr_fr.json',
    )
    expect(await client.getAbility('DA_Ahri', null, '16.21.1')).toBeNull()
    expect(await client.getAbility('DA_Ahri', 15, '16.21.1')).toBeNull()
    expect(await client.getAbility('TFT_Broken', 18, '16.21.1')).toBeNull()
  })

  it('ne choisit pas arbitrairement entre deux compétences différentes du même set', async () => {
    const ambiguous = {
      setData: [
        {
          number: 18,
          champions: [
            { apiName: 'DA_Ahri', ability },
            { apiName: 'DA_Ahri', ability: { name: 'Autre', desc: 'Autre effet' } },
          ],
        },
      ],
    }
    const client = createTftAbilitiesClient(async () => new Response(JSON.stringify(ambiguous)))
    expect(await client.getAbility('DA_Ahri', 18, '16.21.1')).toBeNull()
  })

  it('partage les données du set principal avec les compétences sans mélanger les modes', async () => {
    const sets = {
      setData: [
        {
          number: 18,
          mutator: 'TFTSet18',
          champions: [{ apiName: 'DA_Ahri', ability }],
          traits: [{ apiName: 'DA_Solar18' }],
          items: ['TFT_Item_BFSword', 'DA_18_Item'],
        },
        {
          number: 18,
          mutator: 'TFTSet18_PVEMODE',
          champions: [{ apiName: 'DA_Other', ability }],
          traits: [{ apiName: 'Other' }],
          items: ['Other'],
        },
      ],
    }
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(sets)))
    const client = createTftAbilitiesClient(fetcher)
    const [set, detail] = await Promise.all([
      client.getSet(18, '16.21.1'),
      client.getAbility('DA_Ahri', 18, '16.21.1'),
    ])
    expect(set).toEqual({
      units: ['DA_Ahri'],
      traits: ['DA_Solar18'],
      items: ['TFT_Item_BFSword', 'DA_18_Item'],
    })
    expect(detail?.name).toBe('Éclair')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('ne choisit pas arbitrairement entre deux définitions du set principal', async () => {
    const set = {
      number: 18,
      mutator: 'TFTSet18',
      champions: [{ apiName: 'DA_Ahri', ability }],
      traits: [{ apiName: 'T' }],
      items: ['I'],
    }
    const client = createTftAbilitiesClient(
      async () => new Response(JSON.stringify({ setData: [set, set] })),
    )
    expect(await client.getSet(18, '16.21.1')).toBeNull()
  })

  it('ignore les icônes invalides ou ambiguës sans masquer la compétence', async () => {
    const sourceWithIcons = {
      setData: [
        {
          number: 18,
          champions: [
            { apiName: 'Bad', ability: { ...ability, icon: 'assets/../../malicious.tex' } },
            { apiName: 'Ambiguous', ability },
            {
              apiName: 'Ambiguous',
              ability: { ...ability, icon: 'assets/characters/ahri/other.tex' },
            },
          ],
        },
      ],
    }
    const client = createTftAbilitiesClient(
      async () => new Response(JSON.stringify(sourceWithIcons)),
    )
    expect((await client.getAbility('Bad', 18, '16.21.1'))?.icon).toBeNull()
    expect((await client.getAbility('Ambiguous', 18, '16.21.1'))?.icon).toBeNull()
  })

  it('partage les requêtes et recharge après expiration ou changement de patch', async () => {
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createTftAbilitiesClient(fetcher, () => clock)
    await Promise.all([
      client.getAbility('DA_Ahri', 18, '16.21.1'),
      client.getAbility('DA_Ahri', 18, '16.21.1'),
    ])
    await client.getAbility('DA_Ahri', 18, '16.21.2')
    expect(fetcher).toHaveBeenCalledTimes(1)
    clock += 24 * 60 * 60 * 1000 + 1
    await client.getAbility('DA_Ahri', 18, '16.21.1')
    await client.getAbility('DA_Ahri', 18, '16.22.1')
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('ne conserve pas les erreurs et refuse les versions et données invalides', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{}'))
      .mockResolvedValueOnce(new Response(JSON.stringify(source)))
    const client = createTftAbilitiesClient(fetcher)
    await expect(client.getAbility('DA_Ahri', 18, '../bad')).rejects.toBeInstanceOf(
      DataDragonUnavailableError,
    )
    expect(fetcher).not.toHaveBeenCalled()
    await expect(client.getAbility('DA_Ahri', 18, '16.21.1')).rejects.toBeInstanceOf(
      DataDragonUnavailableError,
    )
    expect(await client.getAbility('DA_Ahri', 18, '16.21.1')).not.toBeNull()
  })
})
