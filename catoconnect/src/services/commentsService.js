import { supabase } from '../lib/supabase'

const COMMENT_SELECT = `
  id, content, created_at, user_id,
  author:profiles!comments_user_id_fkey ( full_name )
`

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addComment({ postId, userId, content }) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(COMMENT_SELECT)
    .single()
  if (error) throw error
  return data
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

export function subscribeToComments(postId, { onInsert, onDelete }) {
  const channel = supabase
    .channel(`comentarios-${postId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
      async (payload) => {
        const { data } = await supabase.from('comments').select(COMMENT_SELECT).eq('id', payload.new.id).single()
        if (data) onInsert(data)
      }
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (payload) =>
      onDelete(payload.old.id)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
