// Icônes de fragments de statistiques fournies par Riot via Data Dragon.
const base = 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/StatMods/'
export const goldIcon = 'https://ddragon.leagueoflegends.com/cdn/5.5.1/img/ui/gold.png'
const icons: Record<string, string> = {
  hp: 'StatModsHealthScalingIcon.png',
  attackdamage: 'StatModsAdaptiveForceIcon.png',
  abilitypower: 'StatModsAdaptiveForceIcon.png',
  armor: 'StatModsArmorIcon.png',
  spellblock: 'StatModsMagicResIcon.png',
  attackspeed: 'StatModsAttackSpeedIcon.png',
  movespeed: 'StatModsMovementSpeedIcon.png',
  haste: 'StatModsCDRScalingIcon.png',
}
export function lolStatIcon(key: string): string | null {
  return icons[key] ? `${base}${icons[key]}` : null
}

export function itemStatLines(description: string): { text: string; icon: string | null }[] {
  const section = description.match(/<stats\b[^>]*>([\s\S]*?)<\/stats>/i)?.[1]
  if (!section) return []
  return section.split(/<br\s*\/?\s*>/i).flatMap((line) => {
    const text = line
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) return []
    const lower = text.toLocaleLowerCase('fr-FR')
    const key = /résistance magique/.test(lower)
      ? 'spellblock'
      : /armure/.test(lower)
        ? 'armor'
        : /vitesse d.attaque/.test(lower)
          ? 'attackspeed'
          : /dégâts d.attaque/.test(lower)
            ? 'attackdamage'
            : /puissance/.test(lower)
              ? 'abilitypower'
              : /(?:^|\s)pv(?:\s|$)/.test(lower)
                ? 'hp'
                : /vitesse de déplacement/.test(lower)
                  ? 'movespeed'
                  : /accélération de compétence/.test(lower)
                    ? 'haste'
                    : ''
    return [{ text, icon: lolStatIcon(key) }]
  })
}
