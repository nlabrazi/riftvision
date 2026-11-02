/** Le préfixe indique parfois un set, mais pas nécessairement tous les sets où l'entrée apparaît. */
export function tftSetFromId(id: string): number | null {
  const match = /^(?:TFT(\d+)|DA_(\d+))_/i.exec(id)
  return match ? Number(match[1] ?? match[2]) : null
}
