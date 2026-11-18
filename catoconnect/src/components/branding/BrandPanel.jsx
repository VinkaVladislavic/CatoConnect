import './BrandPanel.css'

function BrandPanel() {
  return (
    <section className="brand">
      <div className="brand__content">
        <div className="brand__identity">
          <img className="brand__icon" src="/images/CatoConnectIconDark.png"/>
          <div className="brand__wordmark">
            <span className="brand__wordmark--first">Cato</span><span className="brand__wordmark--second">Connect</span>
          </div>
        </div>
        <h1 className="brand__heading">
          Tu universidad.<br />
          <span className="brand__heading--accent">Tu comunidad.</span>
        </h1>
        <p className="brand__description">
          Un espacio para conectar, compartir y vivir todo lo que sucede en tu universidad.
        </p>
      </div>
    </section>
  )
}

export default BrandPanel
