function Bienvenida({ user }) {
  return (
    <main className="app-shell__page">
      <h1>¡Bienvenido a CatoConnect!</h1>
      <p>Has iniciado sesión correctamente.</p>
      <p>{user.email}</p>
    </main>
  )
}

export default Bienvenida
