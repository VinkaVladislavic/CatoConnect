
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import BrandPanel from './components/branding/BrandPanel'
import Login from './components/authentication/Login'
import Registro from './components/authentication/Register'
import Bienvenida from './components/authentication/WelcomePageTest'

import './App.css'

function App() {
  const [vista, setVista] = useState('login')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Consultar sesión al cargar la aplicación
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error al consultar la sesión:', error)
      } else {
        setUser(data.session?.user ?? null)
      }

      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <p className="auth-page__loading">
      Cargando CatoConnect...
    </p>
  }

  if (user) {
    return <Bienvenida user={user} />
  }

  return (
    <main className="auth-page">
      <BrandPanel />

      {vista === 'login' ? (
        <Login
          onRegister={() => setVista('registro')}
        />
      ) : (
        <Registro
          onLogin={() => setVista('login')}
        />
      )}
    </main>
  )
}

export default App
