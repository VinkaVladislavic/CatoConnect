import { supabase } from '../lib/supabase'

export const PAGE_SIZE = 10
const BUCKET = 'post-images'

export const POST_SELECT = `
  id, content, image_url, category, created_at, updated_at, user_id,
  author:profiles!posts_user_id_fkey ( full_name, career, avatar_url ),
  likes ( user_id ),
  comments ( count )
`

const escapeLike = (s) => s.replace(/[\\%_]/g, (m) => '\\' + m)

function storagePathFromUrl(url) {
  const marker = `/${BUCKET}/`
  const i = url ? url.indexOf(marker) : -1
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}

export async function fetchPosts({ category, search, before } = {}) {
  let query = supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (category && category !== 'todas') query = query.eq('category', category)
  if (search) query = query.ilike('content', `%${escapeLike(search)}%`)
  if (before) query = query.lt('created_at', before)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchPostById(id) {
  const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

export async function createPost({ userId, content, category, file }) {
  let imageUrl = null
  let uploadedPath = null

  if (file) {
    const ext = file.name.split('.').pop()
    uploadedPath = `${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadedPath, file)
    if (uploadError) throw uploadError
    imageUrl = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath).data.publicUrl
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, content, category, image_url: imageUrl })
    .select(POST_SELECT)
    .single()

  if (error) {
    if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath])
    throw error
  }
  return data
}

export async function updatePost(id, { content, category }) {
  const { data, error } = await supabase
    .from('posts')
    .update({ content, category })
    .eq('id', id)
    .select('content, category, updated_at')
    .single()
  if (error) throw error
  return data
}

export async function deletePost(post) {
  const { error } = await supabase.from('posts').delete().eq('id', post.id)
  if (error) throw error

  const path = storagePathFromUrl(post.image_url)
  if (path) await supabase.storage.from(BUCKET).remove([path])
}

export function subscribeToWall(handlers) {
  const on = (event, table, callback) => ({ event, table, callback })
  const listeners = [
    on('INSERT', 'posts', (p) => handlers.onPostInserted?.(p.new)),
    on('UPDATE', 'posts', (p) => handlers.onPostUpdated?.(p.new)),
    on('DELETE', 'posts', (p) => handlers.onPostDeleted?.(p.old)),
    on('INSERT', 'likes', (p) => handlers.onLikeAdded?.(p.new)),
    on('DELETE', 'likes', (p) => handlers.onLikeRemoved?.(p.old)),
    on('INSERT', 'comments', (p) => handlers.onCommentAdded?.(p.new)),
    on('DELETE', 'comments', (p) => handlers.onCommentRemoved?.(p.old)),
  ]

  let channel = supabase.channel('muro-global')
  for (const l of listeners) {
    channel = channel.on('postgres_changes', { event: l.event, schema: 'public', table: l.table }, l.callback)
  }
  channel.subscribe()

  return () => supabase.removeChannel(channel)
}
