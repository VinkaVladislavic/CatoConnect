export const CATEGORIES = [
  { id: 'general', label: 'General', emoji: '💬' },
  { id: 'anuncio', label: 'Anuncio', emoji: '📢' },
  { id: 'evento', label: 'Evento', emoji: '🎉' },
  { id: 'pregunta', label: 'Pregunta', emoji: '❓' },
  { id: 'estudio', label: 'Estudio', emoji: '📚' },
  { id: 'venta', label: 'Compra/Venta', emoji: '🛒' },
]

export const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]

export const commentCount = (post) => post.comments?.[0]?.count ?? 0

export const withCommentDelta = (post, delta) => ({
  ...post,
  comments: [{ count: Math.max(0, commentCount(post) + delta) }],
})

// ¿Esta publicación entra en los filtros actuales del muro?
export function matchesFilters(post, { category, search }) {
  if (category && category !== 'todas' && post.category !== category) return false
  if (search && !post.content.toLowerCase().includes(search.toLowerCase())) return false
  return true
}
