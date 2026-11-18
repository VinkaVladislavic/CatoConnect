
import { useState } from 'react'
import { registerUser } from '../../services/authService'
import './Register.css'

function Registro({ onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)

    try {
      const data = await registerUser(
        email.trim(),
        password,
        name.trim()
      )

      if (data.session) {
        setMessage('Cuenta creada correctamente')
      } else {
        setMessage(
          'Revisa tu correo para confirmar tu cuenta.'
        )
      }
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="registro">
      <div className="registro__card">
        <h2 className="registro__title">
          Crear cuenta
        </h2>

        <p className="registro__description">
          Únete a la comunidad de CatoConnect.
        </p>

        <form className="registro__form" onSubmit={handleSubmit}>
          <div className="registro__field">
            <label className="registro__label" htmlFor="registro-nombre">
              Nombre completo
            </label>
            <input
              className="registro__input"
              id="registro-nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="registro__field">
            <label className="registro__label" htmlFor="registro-email">
              Correo institucional
            </label>
            <input
              className="registro__input"
              id="registro-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="registro__field">
            <label className="registro__label" htmlFor="registro-password">
              Contraseña
            </label>
            <input
              className="registro__input"
              id="registro-password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="registro__field">
            <label className="registro__label" htmlFor="registro-confirm">
              Confirmar contraseña
            </label>
            <input
              className="registro__input"
              id="registro-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="registro__message registro__message--error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="registro__message registro__message--success" role="status">
              {message}
            </p>
          )}

          <button
            className="registro__button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <button
          className="registro__login-link"
          type="button"
          onClick={onLogin}
        >
          ¿Ya tienes cuenta? Inicia sesión
        </button>
      </div>
    </section>
  )
}

export default Registro
