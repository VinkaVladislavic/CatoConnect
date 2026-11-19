import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Muro from './components/muro/Muro'

import BrandPanel from './components/branding/BrandPanel'
import Login from './components/authentication/Login'
import Registro from './components/authentication/Register'
import Bienvenida from './components/authentication/WelcomePageTest'
import Navbar from './components/layout/Navbar'

import './index.css'
import './App.css'

function App() {
  const [vista, setVista] = useState('login')
  const [pagina, setPagina] = useState('inicio')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error al consultar la sesión:', error)
      } else {
        setUser(data.session?.user ?? null)
      }
      setLoading(false)
    })

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <p className="auth-page__loading">Cargando CatoConnect...</p>

  if (user) {
    return (
      <div className="app-shell">
        <Navbar user={user} page={pagina} onNavigate={setPagina} />
        {pagina === 'inicio' && <Muro user={user}/>}
        {pagina === 'espacios' && (
          <main className="app-shell__page">
            <h1>Espacios</h1>
            <p>En desarrollo.</p>
          </main>
        )}
        {pagina === 'perfil' && (
          <main className="app-shell__page">
            <h1>Mi perfil</h1>
            <p><strong>Nombre:</strong> {user.user_metadata?.nombre || 'Sin registrar'}</p>
            <p><strong>Correo:</strong> {user.email}</p>
            <p>En desarrollo.</p>
          </main>
        )}
      </div>
    )
  }

  return (
    <main className="auth-page">
      <BrandPanel />
      {vista === 'login' ? (
        <Login onRegister={() => setVista('registro')} />
      ) : (
        <Registro onLogin={() => setVista('login')} />
      )}
    </main>
  )
}

export default App
