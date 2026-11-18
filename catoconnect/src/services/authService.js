import { supabase } from '../lib/supabase';

export async function registerUser(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name
            }
        }
    })
    if (error) throw error;
    return data;
}

export async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    if (error) throw error;
    return data;
}

export async function logOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

export async function obtainSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  return data.session
}

