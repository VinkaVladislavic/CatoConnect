
import { useState } from 'react'
import { logOut } from '../../services/authService'
import './Navbar.css'

function Navbar({ user, page, onNavigate }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const name = user?.user_metadata?.nombre || 'Usuario'
  const words = name.trim().split(/\s+/)
  const initials = (
    words[0][0] + (words[1]?.[0] || '')
  ).toUpperCase()

  // Cerrar sesión
  const handleLogout = async () => {
    setError('')
    setLoading(true)
    try {
      await logOut()
    } catch (err) {
      setError(err.message || 'No se pudo cerrar sesión')
      setLoading(false)
    }
  }

  return (
    <header className="navbar">
      <div className="navbar__content">
        {/* Logo */}
        <button
          type="button"
          className="navbar__brand"
          onClick={() => onNavigate('inicio')}
        >
          <img
            className="navbar__logo"
            src="/images/CatoConnectIconDark.png"
            alt=""
          />
          <span>CatoConnect</span>
        </button>

        <nav className="navbar__links" aria-label="Navegación principal">
          <button
            type="button"
            className={`navbar__link ${page === 'inicio' ? 'navbar__link--active' : ''}`}
            onClick={() => onNavigate('inicio')}
          >
            Inicio
          </button>

          <button
            type="button"
            className={`navbar__link ${page === 'espacios' ? 'navbar__link--active' : ''}`}
            onClick={() => onNavigate('espacios')}
          >
            Espacios
          </button>

          <button
            type="button"
            className={`navbar__link ${page === 'perfil' ? 'navbar__link--active' : ''}`}
            onClick={() => onNavigate('perfil')}
          >
            Mi perfil
          </button>
        </nav>

        {/* Usuario */}
        <div className="navbar__account">
          <button
            type="button"
            className="navbar__avatar"
            onClick={() => onNavigate('perfil')}
          >
            {initials}
          </button>

          <button
            type="button"
            className="navbar__logout"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>

      {error && (
        <p className="navbar__error" role="alert">
          {error}
        </p>
      )}
    </header>
  )
}

export default Navbar
