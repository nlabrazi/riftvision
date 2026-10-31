export interface PatchNoteLink {
  title: string
  publishedAt: string
  url: string
  description: string | null
  imageUrl: string | null
}

export interface PatchNotesResponse {
  sourceUrl: string
  articles: PatchNoteLink[]
}
