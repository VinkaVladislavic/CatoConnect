export default function PostSkeleton() {
  return (
    <div className="muro-card">
      <div className="muro-sk-row">
        <div className="muro-sk muro-sk-circle" />
        <div className="muro-sk-col">
          <div className="muro-sk muro-sk-line" style={{ width: '40%' }} />
          <div className="muro-sk muro-sk-line" style={{ width: '25%' }} />
        </div>
      </div>
      <div className="muro-sk muro-sk-line" style={{ width: '90%' }} />
      <div className="muro-sk muro-sk-line" style={{ width: '70%' }} />
    </div>
  )
}
