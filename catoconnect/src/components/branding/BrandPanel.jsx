import './BrandPanel.css'

function BrandPanel() {
    return (
        <section className="brand">
            <div className="brand__content">
                <div className="brand__logo">
                    <span className="brand__logo-text">CC</span>
                </div>    
            </div>

            <h1 className="brand__title">CatoConnect</h1>
        <p className="brand__description">
          Conecta, comparte y crece con
          tu comunidad universitaria.
        </p>

        <p className="brand__subtitle">
          Tu universidad, más conectada.
        </p>
        </section>
    )
}

export default BrandPanel