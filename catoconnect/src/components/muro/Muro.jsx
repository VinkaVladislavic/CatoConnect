import { useCallback, useEffect, useRef, useState } from 'react'
import { PAGE_SIZE, fetchPostById, fetchPosts, subscribeToWall } from '../../services/postsService'
import { CATEGORIES, matchesFilters, withCommentDelta } from './postUtils'
import PostComposer from './PostComposer'
import PostCard from './PostCard'
import PostSkeleton from './PostSkeleton'
import './Muro.css'

export default function Muro({ user }) {
  const [posts, setPosts] = useState([])
  const [pending, setPending] = useState([]) // publicaciones nuevas de otros, aún no mostradas
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')

  const [category, setCategory] = useState('todas')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Refs para que los callbacks de tiempo real y el scroll infinito vean siempre el valor actual
  const filtersRef = useRef({ category, search })
  const postsRef = useRef(posts)
  const busyRef = useRef(false)
  const sentinelRef = useRef(null)

  useEffect(() => {
    filtersRef.current = { category, search }
  }, [category, search])

  useEffect(() => {
    postsRef.current = posts
  }, [posts])

  // Espera 350 ms después de dejar de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Carga inicial y cada vez que cambian los filtros
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setPending([])

    fetchPosts({ category, search })
      .then((data) => {
        if (!active) return
        setPosts(data)
        setHasMore(data.length === PAGE_SIZE)
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [category, search])

  const patchPost = useCallback((id, fn) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? fn(p) : p)))
  }, [])

  const removePost = useCallback((id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
    setPending((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Scroll infinito
  const loadMore = useCallback(async () => {
    const current = postsRef.current
    if (busyRef.current || current.length === 0) return

    busyRef.current = true
    setLoadingMore(true)
    const filtersKey = JSON.stringify(filtersRef.current)

    try {
      const data = await fetchPosts({
        ...filtersRef.current,
        before: current[current.length - 1].created_at,
      })
      // Si el usuario cambió el filtro mientras cargaba, descartamos el resultado
      if (filtersKey !== JSON.stringify(filtersRef.current)) return
      setPosts((prev) => [...prev, ...data.filter((d) => !prev.some((p) => p.id === d.id))])
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingMore(false)
      busyRef.current = false
    }
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || loading || !hasMore) return
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), {
      rootMargin: '300px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, hasMore, loadMore, posts.length])

  // Tiempo real: publicaciones, likes y comentarios de todos los usuarios
  useEffect(() => {
    return subscribeToWall({
      onPostInserted: async (row) => {
        if (row.user_id === user.id) return // las propias ya se agregan al publicar
        try {
          const post = await fetchPostById(row.id)
          if (!matchesFilters(post, filtersRef.current)) return
          setPending((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]))
        } catch {
          /* si falla, el usuario la verá al recargar */
        }
      },
      onPostUpdated: (row) =>
        patchPost(row.id, (p) => ({
          ...p,
          content: row.content,
          category: row.category,
          image_url: row.image_url,
          updated_at: row.updated_at,
        })),
      onPostDeleted: (row) => removePost(row.id),
      onLikeAdded: ({ post_id, user_id }) =>
        patchPost(post_id, (p) =>
          p.likes.some((l) => l.user_id === user_id) ? p : { ...p, likes: [...p.likes, { user_id }] }
        ),
      onLikeRemoved: ({ post_id, user_id }) =>
        patchPost(post_id, (p) => ({ ...p, likes: p.likes.filter((l) => l.user_id !== user_id) })),
      onCommentAdded: (row) => row.user_id !== user.id && patchPost(row.post_id, (p) => withCommentDelta(p, 1)),
      onCommentRemoved: (row) => row.user_id !== user.id && patchPost(row.post_id, (p) => withCommentDelta(p, -1)),
    })
  }, [user.id, patchPost, removePost])

  function handleCreated(post) {
    if (matchesFilters(post, filtersRef.current)) {
      setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]))
    } else {
      // La publicación no entra en el filtro actual: volvemos a "Todas"
      setCategory('todas')
      setSearchInput('')
    }
  }

  function showPending() {
    setPosts((prev) => [...pending.filter((n) => !prev.some((p) => p.id === n.id)), ...prev])
    setPending([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtering = category !== 'todas' || search !== ''

  return (
    <section className="muro">
      <PostComposer user={user} onCreated={handleCreated} />

      <div className="muro-card muro-filters">
        <input
          className="muro-input"
          type="search"
          placeholder="🔍 Buscar en el muro…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="muro-chips">
          <button
            type="button"
            className={`muro-chip ${category === 'todas' ? 'is-active' : ''}`}
            onClick={() => setCategory('todas')}
          >
            Todas
          </button>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`muro-chip ${category === c.id ? 'is-active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <button type="button" className="muro-new-posts" onClick={showPending}>
          ↑ {pending.length} {pending.length === 1 ? 'publicación nueva' : 'publicaciones nuevas'}
        </button>
      )}

      {error && <p className="muro-error">{error}</p>}

      {loading && (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      )}

      {!loading && posts.length === 0 && (
        <p className="muro-muted muro-center">
          {filtering
            ? 'No hay publicaciones que coincidan con tu búsqueda.'
            : 'Aún no hay publicaciones. ¡Sé el primero!'}
        </p>
      )}

      {!loading &&
        posts.map((post) => (
          <PostCard key={post.id} post={post} user={user} onPatch={patchPost} onDeleted={removePost} />
        ))}

      {loadingMore && <PostSkeleton />}

      {hasMore && !loading && <div ref={sentinelRef} className="muro-sentinel" />}
      {!hasMore && !loading && posts.length > 0 && (
        <p className="muro-muted muro-center muro-end">Llegaste al final del muro 🎓</p>
      )}
    </section>
  )
}
