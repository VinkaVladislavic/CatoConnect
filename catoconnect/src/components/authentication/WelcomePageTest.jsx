
import { useState } from 'react'
import { logOut } from '../../services/authService'

function Bienvenida({ user }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setError('')
    setLoading(true)

    try {
      await logOut()
    } catch (err) {
      setError(err.message || 'No se pudo cerrar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bienvenida">
      <div className="bienvenida__card">
        <h1 className="bienvenida__title">
          ¡Bienvenido a CatoConnect!
        </h1>

        <p className="bienvenida__text">
          Has iniciado sesión correctamente.
        </p>

        <p className="bienvenida__email">
          {user.email}
        </p>

        {error && <p role="alert">{error}</p>}

        <button
          className="bienvenida__button"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? 'Cerrando...' : 'Cerrar sesión'}
        </button>
      </div>
    </main>
  )
}

export default Bienvenida
