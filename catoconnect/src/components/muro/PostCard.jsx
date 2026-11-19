import { useEffect, useState } from 'react'
import { deletePost, updatePost } from '../../services/postsService'
import { likePost, unlikePost } from '../../services/reactionsService'
import { initials, timeAgo } from '../../utils/time'
import { CATEGORIES, categoryOf, commentCount, withCommentDelta } from './postUtils'
import Comments from './Comments'

const LONG_TEXT = 280

// Convierte los enlaces del texto en links clicables
function linkify(text) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  )
}

export default function PostCard({ post, user, onPatch, onDeleted }) {
  const [showComments, setShowComments] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const [draftCategory, setDraftCategory] = useState(post.category)
  const [saving, setSaving] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [error, setError] = useState('')

  const likes = post.likes.map((l) => l.user_id)
  const liked = likes.includes(user.id)
  const isOwner = post.user_id === user.id
  const authorName = post.author?.full_name ?? 'Usuario'
  const cat = categoryOf(post.category)
  const isLong = post.content.length > LONG_TEXT
  const comments = commentCount(post)

  // Cerrar la imagen ampliada con Escape
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => e.key === 'Escape' && setLightbox(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  // Me gusta con actualización optimista
  async function toggleLike() {
    const apply = (add) => (p) => ({
      ...p,
      likes: add
        ? p.likes.some((l) => l.user_id === user.id)
          ? p.likes
          : [...p.likes, { user_id: user.id }]
        : p.likes.filter((l) => l.user_id !== user.id),
    })

    onPatch(post.id, apply(!liked))
    try {
      await (liked ? unlikePost(post.id, user.id) : likePost(post.id, user.id))
    } catch (err) {
      onPatch(post.id, apply(liked)) // revierte si falla
      setError(err.message)
    }
  }

  function startEdit() {
    setDraft(post.content)
    setDraftCategory(post.category)
    setEditing(true)
    setError('')
  }

  async function saveEdit() {
    const content = draft.trim()
    if (!content) return
    if (content === post.content && draftCategory === post.category) return setEditing(false)

    setSaving(true)
    try {
      const updated = await updatePost(post.id, { content, category: draftCategory })
      onPatch(post.id, (p) => ({ ...p, ...updated }))
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    try {
      await deletePost(post)
      onDeleted(post.id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <article className="muro-card muro-post">
      <header className="muro-post-header">
        <div className="muro-avatar">
          {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" /> : initials(authorName)}
        </div>
        <div className="muro-post-meta">
          <strong>{authorName}</strong>
          <span className="muro-muted">
            {post.author?.career ? `${post.author.career} · ` : ''}
            {timeAgo(post.created_at)}
            {post.updated_at && <span title={new Date(post.updated_at).toLocaleString('es')}> · editado</span>}
          </span>
        </div>
        <span className="muro-badge">
          {cat.emoji} {cat.label}
        </span>
        {isOwner && !editing && (
          <>
            <button type="button" className="muro-btn muro-btn--ghost muro-btn--sm" onClick={startEdit}>
              Editar
            </button>
            <button type="button" className="muro-btn muro-btn--ghost muro-btn--sm" onClick={handleDelete}>
              Eliminar
            </button>
          </>
        )}
      </header>

      {editing ? (
        <div className="muro-edit">
          <textarea
            className="muro-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={4}
            autoFocus
          />
          <div className="muro-edit-actions">
            <select className="muro-select" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
            <button type="button" className="muro-btn muro-btn--ghost muro-btn--sm" onClick={() => setEditing(false)}>
              Cancelar
            </button>
            <button type="button" className="muro-btn muro-btn--sm" onClick={saveEdit} disabled={saving || !draft.trim()}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <p className="muro-post-content">
          {linkify(isLong && !expanded ? post.content.slice(0, LONG_TEXT) + '…' : post.content)}
          {isLong && (
            <button type="button" className="muro-link" onClick={() => setExpanded((v) => !v)}>
              {expanded ? ' Ver menos' : ' Ver más'}
            </button>
          )}
        </p>
      )}

      {post.image_url && (
        <img
          className="muro-post-image"
          src={post.image_url}
          alt=""
          loading="lazy"
          onClick={() => setLightbox(true)}
        />
      )}

      <div className="muro-post-stats muro-muted">
        <span>{likes.length} me gusta</span>
        <button type="button" className="muro-link muro-muted" onClick={() => setShowComments((v) => !v)}>
          {comments} {comments === 1 ? 'comentario' : 'comentarios'}
        </button>
      </div>

      <div className="muro-post-actions">
        <button type="button" className={`muro-btn muro-btn--ghost ${liked ? 'is-liked' : ''}`} onClick={toggleLike}>
          {liked ? '❤️ Te gusta' : '🤍 Me gusta'}
        </button>
        <button type="button" className="muro-btn muro-btn--ghost" onClick={() => setShowComments((v) => !v)}>
          💬 Comentar
        </button>
      </div>

      {error && <p className="muro-error">{error}</p>}

      {showComments && (
        <Comments
          postId={post.id}
          user={user}
          onCountChange={(delta) => onPatch(post.id, (p) => withCommentDelta(p, delta))}
        />
      )}

      {lightbox && (
        <div className="muro-lightbox" onClick={() => setLightbox(false)}>
          <img src={post.image_url} alt="" />
          <button type="button" className="muro-lightbox-close" aria-label="Cerrar">
            ×
          </button>
        </div>
      )}
    </article>
  )
}
