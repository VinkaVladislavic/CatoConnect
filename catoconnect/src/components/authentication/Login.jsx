import { useState } from 'react';
import { loginUser } from '../../services/authService';
import './Login.css';
 
function Login({ onRegister }) {
    const[email, setEmail] = useState('');
    const[password, setPassword] = useState('');
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        console.log('Email:', email);
        console.log('Sent successfully');
        try {
            await loginUser(email.trim(), password)
        } catch (err) {
        setError(
            err.message || 'No se pudo iniciar sesión'
        )
    } finally {
      setLoading(false)
    }
    }

    return (
        <section className="login">
            <div className="login__card">
                <h2 className="login__title">
                    Bienvenido de nuevo!
                </h2>
                <p className="login__description">
                    Inicia sesión para continuar en CatoConnect.
                </p>
                <form className="login__form" onSubmit={handleSubmit}>
                    <div className="login__field">
                        <label className="login__label" htmlFor="email">
                            Correo institucional
                        </label>
                        <input
                            className="login__input"
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="login__field">
                        <label className="login__label" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            className="login__input"
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && (
                        <p className="login__error" role="alert">
                        {error}
                        </p>
                    )}
                    <button className="login__button login__button--primary" type="submit" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>
                <button className="login__forgot" type="button">
                    ¿Olvidaste tu contraseña?
                </button>
                <div className="login__divider">
                    <span>Aun no tienes cuenta?</span>
                </div>
                <button className="login__button login__button--secondary" type="button" onClick={onRegister}>
                    Crear nueva cuenta
                </button>
            </div>
        </section>
    )
}

export default Login;