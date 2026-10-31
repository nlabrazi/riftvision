export const valorantWeaponCategories: Record<string, string> = {
  Sidearm: 'Armes de poing',
  SMG: 'Mitraillettes',
  Shotgun: 'Fusils à pompe',
  Rifle: 'Fusils',
  Sniper: 'Fusils de sniper',
  Heavy: 'Armes lourdes',
  Melee: 'Mêlée',
}

export function valorantWeaponCategory(category: string): string {
  return valorantWeaponCategories[category] ?? 'Autre catégorie'
}

export function valorantNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
}
