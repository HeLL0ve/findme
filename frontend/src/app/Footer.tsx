export default function Footer(){
  return (
    <footer style={{ padding: 24, marginTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="muted">© {new Date().getFullYear()} FindMe</div>
        <div className="muted">Проект для дипломной работы</div>
      </div>
    </footer>
  )
}
