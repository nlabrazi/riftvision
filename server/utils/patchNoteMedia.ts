/** Extraits textuels destinés à être affichés comme texte, sans HTML exécutable. */
export function patchNoteDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value
    .replace(/<br\s*\/?\s*>|<\/p\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}

/** N'accepte que les domaines d'images officiels effectivement utilisés par les archives. */
export function patchNoteImage(value: unknown, allowedHost: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value)
    return url.protocol === 'https:' &&
      url.hostname === allowedHost &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.hash
      ? url.href
      : null
  } catch {
    return null
  }
}
