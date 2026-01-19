export default function TopNav({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="row" style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{title}</div>
        {subtitle ? <div className="muted">{subtitle}</div> : null}
      </div>
      <a className="btn" href="/">Home</a>
    </div>
  );
}
