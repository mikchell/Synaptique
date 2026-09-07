import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useMindmapStore } from '../mindmap/store/mindmapStore'

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://synaptique-dun.vercel.app'
const STORAGE_KEY = 'ore-no-mindmap-storage'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: APP_URL },
    })

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY)
    useMindmapStore.persist.clearStorage()
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithGoogle, signOut }
}
