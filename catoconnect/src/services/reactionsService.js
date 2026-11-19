import { supabase } from '../lib/supabase'

export async function likePost(postId, userId) {
  const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId })
  if (error) throw error
}

export async function unlikePost(postId, userId) {
  const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
  if (error) throw error
}
