// Synthèses des pages de classes Blizzard ; les icônes sont celles présentées sur ces pages.
// https://worldofwarcraft.blizzard.com/fr-fr/game/classes
export interface WowClassFeature {
  name: string
  description: string
  icon: string
}

const icon = (name: string) => `https://blzmedia-a.akamaihd.net/wow/icons/56/${name}.jpg`
const evokerIcon = (asset: string) =>
  `https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/${asset}`
const features: Record<number, WowClassFeature[]> = {
  1: [
    {
      name: 'Défense',
      description: 'Protège ses alliés en attirant les attaques et en utilisant son armure.',
      icon: icon('ability_defend'),
    },
    {
      name: 'Dégâts de mêlée',
      description: 'Combat au contact avec une ou plusieurs armes.',
      icon: icon('ability_meleedamage'),
    },
    {
      name: 'Rage',
      description: 'Utilise la rage générée au combat pour alimenter ses techniques.',
      icon: icon('spell_nature_ancestralguardian'),
    },
  ],
  2: [
    {
      name: 'Défense',
      description: 'Protège son groupe en attirant les ennemis et en utilisant un bouclier.',
      icon: icon('spell_holy_avengersshield'),
    },
    {
      name: 'Dégâts de mêlée',
      description: 'Canalise la puissance sacrée dans ses attaques.',
      icon: icon('spell_holy_crusaderstrike'),
    },
    {
      name: 'Bénédictions et auras',
      description: 'Apporte des améliorations et de la protection à ses alliés.',
      icon: icon('spell_holy_devotionaura'),
    },
    {
      name: 'Soins',
      description: 'Rend des points de vie à ses compagnons.',
      icon: icon('spell_holy_layonhands'),
    },
  ],
  3: [
    {
      name: 'Combat au corps à corps',
      description: 'Peut combattre au contact avec des pièges et des explosifs.',
      icon: icon('spell_frost_chainsofice'),
    },
    {
      name: 'Dégâts à distance',
      description: 'Utilise des armes à distance pour atteindre ses adversaires.',
      icon: icon('inv_weapon_bow_02'),
    },
    {
      name: 'Familiers',
      description: 'Dompte des créatures qui combattent à ses côtés.',
      icon: icon('ability_hunter_beasttaming'),
    },
    {
      name: 'Aventures en solo',
      description: 'Progresse en solitaire avec le soutien de son familier.',
      icon: icon('ability_upgrademoonglaive'),
    },
  ],
  4: [
    {
      name: 'Camouflage',
      description: 'Se dissimule pour préparer ses attaques.',
      icon: icon('ability_stealth'),
    },
    {
      name: 'Dégâts de mêlée',
      description: 'Affronte ses adversaires au contact avec ses armes.',
      icon: icon('inv_weapon_shortblade_15'),
    },
    {
      name: 'Poisons',
      description: 'Enduit ses armes pour affaiblir ses ennemis.',
      icon: icon('ability_rogue_dualweild'),
    },
    {
      name: 'Points de combo',
      description: 'Accumule des points avant de déclencher une technique de finition.',
      icon: icon('ability_rogue_eviscerate'),
    },
  ],
  5: [
    {
      name: 'Soins',
      description: 'Soigne ses alliés grâce à la magie sacrée.',
      icon: icon('spell_holy_greaterheal'),
    },
    {
      name: 'Dégâts à distance',
      description: 'Utilise la magie de l’Ombre contre ses adversaires.',
      icon: icon('spell_shadow_shadowform'),
    },
    {
      name: 'Mots de pouvoir',
      description: 'Protège ses alliés avec des effets défensifs.',
      icon: icon('spell_holy_powerwordshield'),
    },
    {
      name: 'Contrôle mental',
      description: 'Peut prendre le contrôle de certaines créatures.',
      icon: icon('spell_shadow_shadowworddominate'),
    },
  ],
  6: [
    {
      name: 'Défense',
      description: 'Protège ses alliés grâce à son armure et à ses armes.',
      icon: icon('spell_nature_shamanrage'),
    },
    {
      name: 'Dégâts de mêlée',
      description: 'Combine armes runiques et magie noire au corps à corps.',
      icon: icon('spell_deathknight_empowerruneblade'),
    },
    {
      name: 'Runeforge',
      description: 'Renforce ses armes en y gravant des runes.',
      icon: icon('spell_deathknight_frozenruneweapon'),
    },
  ],
  7: [
    {
      name: 'Soins',
      description: 'Canalise les esprits pour aider ses alliés.',
      icon: icon('spell_nature_healingwavegreater'),
    },
    {
      name: 'Dégâts de mêlée',
      description: 'Imprègne ses armes de puissance élémentaire.',
      icon: icon('spell_shaman_unleashweapon_wind'),
    },
    {
      name: 'Dégâts à distance',
      description: 'Invoque notamment la foudre et la lave contre ses ennemis.',
      icon: icon('spell_nature_lightning'),
    },
    {
      name: 'Totems',
      description: 'Déploie des totems aux effets variés pour son groupe.',
      icon: icon('spell_shaman_dropall_02'),
    },
  ],
  8: [
    {
      name: 'Dégâts à distance',
      description: 'Dépense son mana pour lancer des sorts offensifs.',
      icon: icon('spell_fire_flamebolt'),
    },
    {
      name: 'Sorts de zone',
      description: 'Utilise le feu, le givre ou les arcanes contre plusieurs ennemis.',
      icon: icon('spell_frost_icestorm'),
    },
    {
      name: 'Contrôle',
      description: 'Peut ralentir, immobiliser ou métamorphoser ses adversaires.',
      icon: icon('spell_nature_polymorph'),
    },
    {
      name: 'Téléportation',
      description: 'Ouvre des portails et crée des provisions pour ses alliés.',
      icon: icon('spell_arcane_portaldalaran'),
    },
  ],
  9: [
    {
      name: 'Dégâts à distance',
      description: 'Inflige des dégâts de Feu ou d’Ombre, immédiats ou sur la durée.',
      icon: icon('spell_shadow_shadowbolt'),
    },
    {
      name: 'Invocation',
      description: 'Peut invoquer des alliés auprès de lui.',
      icon: icon('spell_shadow_twilight'),
    },
    {
      name: 'Démons',
      description: 'Commande des démons pour combattre ou se défendre.',
      icon: icon('spell_shadow_summonfelhunter'),
    },
    {
      name: 'Malédictions',
      description: 'Affaiblit ses adversaires avec des malédictions.',
      icon: icon('spell_shadow_curseoftounges'),
    },
  ],
  10: [
    {
      name: 'Défense',
      description: 'Utilise des breuvages et sa mobilité pour protéger le groupe.',
      icon: icon('ability_monk_expelharm'),
    },
    {
      name: 'Soins',
      description: 'Associe arts martiaux et médecine pour soigner ses alliés.',
      icon: icon('ability_monk_standingkick'),
    },
    {
      name: 'Dégâts de mêlée',
      description: 'Pratique les arts martiaux au corps à corps.',
      icon: icon('ability_monk_clashingoxcharge'),
    },
    {
      name: 'Astres vénérables',
      description: 'Fait appel à la puissance des protecteurs de la Pandarie.',
      icon: icon('inv_pet_cranegod'),
    },
  ],
  11: [
    {
      name: 'Changeforme',
      description: 'Adopte différentes formes selon son rôle et ses déplacements.',
      icon: icon('ability_druid_mastershapeshifter'),
    },
    {
      name: 'Soins',
      description: 'Fait appel à la nature pour soigner ses alliés.',
      icon: icon('spell_nature_resistnature'),
    },
    {
      name: 'Défense',
      description: 'Peut protéger le groupe sous forme d’ours.',
      icon: icon('ability_druid_demoralizingroar'),
    },
    {
      name: 'Dégâts de mêlée ou à distance',
      description: 'Combat au contact ou à distance selon sa forme.',
      icon: icon('inv_misc_monsterclaw_03'),
    },
  ],
  12: [
    {
      name: 'Mobilité',
      description: 'Utilise les sauts et ses ailes pour se déplacer rapidement.',
      icon: icon('ability_demonhunter_felrush'),
    },
    {
      name: 'Métamorphose',
      description: 'Prend une forme démoniaque adaptée à son rôle.',
      icon: icon('ability_demonhunter_metamorphosis'),
    },
    {
      name: 'Dégâts',
      description: 'Associe énergie chaotique et attaques physiques.',
      icon: icon('ability_demonhunter_melee'),
    },
    {
      name: 'Vision spectrale',
      description: 'Détecte des ennemis cachés grâce à sa perception magique.',
      icon: icon('ability_demonhunter_spectralsight'),
    },
  ],
  13: [
    {
      name: 'Soins',
      description: 'Canalise les pouvoirs draconiques pour soutenir ses alliés.',
      icon: evokerIcon('blt9bc7326188850e02/634e16b7791b1444d8d1d111/ability_evoker_echo.jpeg'),
    },
    {
      name: 'Dégâts à distance',
      description: 'Utilise notamment des souffles draconiques offensifs.',
      icon: evokerIcon('blt6445099398455b1e/634e16b6bf416852dd931da3/ability_evoker_pyre.jpeg'),
    },
    {
      name: 'Mobilité',
      description: 'Se déplace dans les airs grâce à ses pouvoirs draconiques.',
      icon: evokerIcon('bltebe6b1eff0e6717d/634e16b65e1b6d519cb60b09/ability_racial_soar.jpeg'),
    },
    {
      name: 'Techniques renforcées',
      description: 'Charge certaines techniques pour en renforcer les effets.',
      icon: evokerIcon(
        'bltcb6a94e6589edbda/634e16b76f39e752dc3935bd/ability_evoker_eternitysurge.jpeg',
      ),
    },
  ],
}

export function wowClassFeatures(id: number): WowClassFeature[] {
  return features[id] ?? []
}

const classSlugs: Record<number, string> = {
  1: 'warrior',
  2: 'paladin',
  3: 'hunter',
  4: 'rogue',
  5: 'priest',
  6: 'death-knight',
  7: 'shaman',
  8: 'mage',
  9: 'warlock',
  10: 'monk',
  11: 'druid',
  12: 'demon-hunter',
  13: 'evoker',
}
export function wowClassSource(id: number): string | null {
  return classSlugs[id]
    ? `https://worldofwarcraft.blizzard.com/fr-fr/game/classes/${classSlugs[id]}`
    : null
}
