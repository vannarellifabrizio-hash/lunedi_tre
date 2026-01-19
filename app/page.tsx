import TopNav from "../components/TopNav";

export default function HomePage() {
  return (
    <div className="container">
      <TopNav title="Internal Tool" subtitle="Home" />

      <div className="card">
        <h2>Accessi</h2>
        <p className="muted">
          Seleziona dove entrare. Nella fase preview i dati restano nel tuo browser (localStorage).
        </p>

        <div className="grid-3" style={{ marginTop: 12 }}>
          <a className="card" href="/admin">
            <h3>ADMIN</h3>
            <p className="muted">Gestisci collaboratori e progetti</p>
          </a>

          <a className="card" href="/collaborator">
            <h3>COLLABORATORE</h3>
            <p className="muted">Inserisci e gestisci le tue attività</p>
          </a>

          <a className="card" href="/dashboard">
            <h3>DASHBOARD</h3>
            <p className="muted">Vista totale + filtri + export PDF</p>
          </a>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Nota importante</h3>
        <p className="muted">
          Le password non vengono mostrate nella UI e non sono salvate in chiaro: uso hash.
          Quando andrai online, le sposteremo in variabili d’ambiente.
        </p>
      </div>
    </div>
  );
}
