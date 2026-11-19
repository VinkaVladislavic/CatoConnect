import { useEffect, useState } from 'react'
import {
  addComment,
  deleteComment,
  fetchComments,
  subscribeToComments,
} from '../../services/commentsService'
import { initials, timeAgo } from '../../utils/time'

export default function Comments({ postId, user, onCountChange }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchComments(postId)
      .then((data) => active && setComments(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [postId])

  // Tiempo real: comentarios que otros escriben o borran mientras tienes esto abierto
  useEffect(() => {
    return subscribeToComments(postId, {
      onInsert: (c) => setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c])),
      onDelete: (id) => setComments((prev) => prev.filter((c) => c.id !== id)),
    })
  }, [postId])

  async function handleSubmit(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return

    try {
      const created = await addComment({ postId, userId: user.id, content })
      setComments((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]))
      onCountChange(1)
      setText('')
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteComment(id)
      setComments((prev) => prev.filter((c) => c.id !== id))
      onCountChange(-1)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="muro-comments">
      {loading && <p className="muro-muted">Cargando comentarios…</p>}

      {comments.map((c) => (
        <div key={c.id} className="muro-comment">
          <div className="muro-avatar muro-avatar--sm">{initials(c.author?.full_name)}</div>
          <div className="muro-comment-body">
            <strong>{c.author?.full_name ?? 'Usuario'}</strong>{' '}
            <span className="muro-muted">{timeAgo(c.created_at)}</span>
            <p>{c.content}</p>
          </div>
          {c.user_id === user.id && (
            <button type="button" className="muro-link" onClick={() => handleDelete(c.id)}>
              Borrar
            </button>
          )}
        </div>
      ))}

      <form className="muro-comment-form" onSubmit={handleSubmit}>
        <input
          className="muro-input"
          placeholder="Escribe un comentario…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
        <button type="submit" className="muro-btn muro-btn--sm" disabled={!text.trim()}>
          Enviar
        </button>
      </form>

      {error && <p className="muro-error">{error}</p>}
    </div>
  )
}
