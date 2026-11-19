import { useEffect, useRef, useState } from 'react'
import { createPost } from '../../services/postsService'
import { CATEGORIES } from './postUtils'

const MAX_IMAGE_MB = 5
const MAX_CHARS = 2000

export default function PostComposer({ user, onCreated }) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef(null)

  // Libera la URL temporal de la vista previa
  useEffect(() => {
    return () => preview && URL.revokeObjectURL(preview)
  }, [preview])

  function pickFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return setError('Solo se permiten imágenes')
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) return setError(`La imagen supera ${MAX_IMAGE_MB} MB`)
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const text = content.trim()
    if (!text || busy) return

    setBusy(true)
    setError('')
    try {
      const post = await createPost({ userId: user.id, content: text, category, file })
      onCreated(post)
      setContent('')
      setCategory('general')
      clearFile()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const left = MAX_CHARS - content.length

  return (
    <form className="muro-card muro-composer" onSubmit={handleSubmit}>
      <textarea
        className="muro-input"
        placeholder="¿Qué quieres compartir con la comunidad?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && handleSubmit(e)}
        maxLength={MAX_CHARS}
        rows={3}
      />

      {preview && (
        <div className="muro-preview">
          <img src={preview} alt="Vista previa" />
          <button type="button" className="muro-preview-remove" onClick={clearFile} aria-label="Quitar imagen">
            ×
          </button>
        </div>
      )}

      {error && <p className="muro-error">{error}</p>}

      <div className="muro-composer-actions">
        <label className="muro-btn muro-btn--ghost">
          📷 Foto
          <input ref={fileInput} type="file" accept="image/*" onChange={pickFile} hidden />
        </label>

        <select
          className="muro-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Categoría"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>

        <span className={`muro-muted ${left < 100 ? 'muro-warn' : ''}`}>{left}</span>

        <button type="submit" className="muro-btn" disabled={busy || !content.trim()}>
          {busy ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
      <p className="muro-muted muro-hint">Ctrl + Enter para publicar</p>
    </form>
  )
}
