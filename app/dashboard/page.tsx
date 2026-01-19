"use client";

import React, { useCallback, useMemo, useState } from "react";
import TopNav from "../../components/TopNav";
import FiltersBar from "../../components/FiltersBar";
import ProjectCard from "../../components/ProjectCard";
import ActivityList from "../../components/ActivityList";
import { useAppStore } from "../_state/store";
import { verifyDashboard } from "../_lib/auth";
import { daysSince } from "../_lib/dates";
import { exportPdfTabular, exportPdfEditorial, getFilteredActivities } from "../../components/exportPdf";

export default function DashboardPage() {
  const { state, dispatch } = useAppStore();
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  const collabById = useMemo(() => new Map(state.collaborators.map(c => [c.id, c])), [state.collaborators]);

  const doLogin = useCallback(async () => {
    setError(null);
    const ok = await verifyDashboard(pass);
    if (!ok) {
      setError("Password errata.");
      return;
    }
    dispatch({ type: "DASH_AUTH_SET", value: true });
    setPass("");
  }, [pass, dispatch]);

  const filters = state.dashboard.filters;

  const filteredActivities = useMemo(() => getFilteredActivities(state.activities, filters), [state.activities, filters]);

  const projects = useMemo(() => {
    const arr = state.projects.slice().sort((a, b) => a.title.localeCompare(b.title));
    if (filters.projectId && filters.projectId !== "all") return arr.filter(p => p.id === filters.projectId);
    return arr;
  }, [state.projects, filters.projectId]);

  const recency = useMemo(() => {
    // For each collaborator: last activity date across ALL activities (not filtered), per requisito "recency status"
    const m = new Map<string, string | null>();
    for (const c of state.collaborators) m.set(c.id, null);
    for (const a of state.activities) {
      const cur = m.get(a.collaboratorId);
      if (!cur || a.createdAt > cur) m.set(a.collaboratorId, a.createdAt);
    }
    return m;
  }, [state.activities, state.collaborators]);

  const statusColor = useCallback((lastISO: string | null) => {
    if (!lastISO) return "var(--danger)";
    const d = daysSince(lastISO);
    if (d <= 7) return "var(--ok)";
    if (d <= 10) return "var(--warn)";
    return "var(--danger)";
  }, []);

  if (!state.dashboard.isAuthed) {
    return (
      <div className="container">
        <TopNav title="DASHBOARD" subtitle="Accesso" />
        <div className="card">
          <h2>Login Dashboard</h2>
          <p className="muted">Inserisci la password Dashboard. (Non viene mostrata in chiaro.)</p>
          <label>Password</label>
          <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          {error ? <div style={{ color: "var(--danger)", marginTop: 10 }}>{error}</div> : null}
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
            <button className="btn primary" onClick={doLogin}>Entra</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <TopNav title="DASHBOARD" subtitle="Vista totale" />

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span className="badge">✅ Autenticato</span>
        <button className="btn" onClick={() => dispatch({ type: "DASH_AUTH_SET", value: false })}>Esci</button>
      </div>

      {/* Recency status */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Collaboratori — Recency status</h3>
        {state.collaborators.length === 0 ? <div className="muted">Nessun collaboratore.</div> : null}

        <div className="kv" style={{ marginTop: 10 }}>
          {state.collaborators
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => {
              const last = recency.get(c.id) ?? null;
              const col = statusColor(last);
              return (
                <div key={c.id}>
                  <span className="dot" style={{ background: col, marginRight: 8 }} />
                  <b style={{ color: c.color }}>{c.name}</b>
                  <span className="small" style={{ marginLeft: 8 }}>
                    {last ? `ultima: ${new Date(last).toLocaleString("it-IT")}` : "nessuna attività"}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <FiltersBar
        filters={filters}
        setFilters={(f) => dispatch({ type: "DASH_FILTERS_SET", value: f })}
        projects={state.projects}
        collaborators={state.collaborators}
      />

      <div className="card" style={{ marginBottom: 12 }}>
        <h3>Export PDF</h3>
        <p className="muted">Gli export rispettano i filtri attivi.</p>
        <div className="row">
          <button
            className="btn primary"
            onClick={() => exportPdfTabular({ projects: state.projects, collaborators: state.collaborators, activities: state.activities, filters })}
          >
            Export PDF tabellare
          </button>
          <button
            className="btn"
            onClick={() => exportPdfEditorial({ projects: state.projects, collaborators: state.collaborators, activities: state.activities, filters })}
          >
            Export PDF editoriale
          </button>
        </div>
      </div>

      <div className="grid-2">
        {projects.map((p) => {
          // per dashboard: attività filtrate (e poi raggruppate)
          const actsForProject = filteredActivities.filter(a => a.projectId === p.id);

          // Risorse interessate (in base alle attività filtrate o totali?)
          // Requisito: "hanno inserito attività in quel progetto" -> considero TUTTE (non filtrate), così non “spariscono” con filtri.
          const allActsForProject = state.activities.filter(a => a.projectId === p.id);
          const ids = Array.from(new Set(allActsForProject.map(a => a.collaboratorId)));
          const names = ids
            .map(id => collabById.get(id))
            .filter(Boolean)
            .map(c => c!.name)
            .sort((a, b) => a.localeCompare(b));

          // raggruppo per collaboratore per render
          const byCollab = new Map<string, any[]>();
          for (const a of actsForProject) {
            if (!byCollab.has(a.collaboratorId)) byCollab.set(a.collaboratorId, []);
            byCollab.get(a.collaboratorId)!.push(a);
          }

          const collabIds = Array.from(byCollab.keys()).sort((a, b) => {
            const A = collabById.get(a)?.name ?? "";
            const B = collabById.get(b)?.name ?? "";
            return A.localeCompare(B);
          });

          return (
            <ProjectCard
              key={p.id}
              project={p}
              rightTop={
                <div style={{ maxWidth: 240 }}>
                  <div style={{ fontWeight: 800 }}>
                    Risorse interessate:{" "}
                    {names.length === 0 ? <span className="muted">—</span> : names.map((n) => <span key={n}><b>{n}</b>{" "}</span>)}
                  </div>
                </div>
              }
            >
              {actsForProject.length === 0 ? (
                <div className="muted">Nessuna attività con i filtri attivi.</div>
              ) : (
                <div>
                  {collabIds.map((cid) => {
                    const c = collabById.get(cid);
                    if (!c) return null;
                    const list = byCollab.get(cid) ?? [];
                    return (
                      <div key={cid} style={{ marginBottom: 12 }}>
                        <div className="badge" style={{ marginBottom: 8 }}>
                          <span className="dot" style={{ background: c.color }} />
                          <b>{c.name}</b>
                        </div>
                        <ActivityList
                          activities={list}
                          collaborator={c}
                          // Dashboard: non serve edit, ma teniamo le funzioni per coerenza (potresti volerle)
                          onUpdate={(id, text) => dispatch({ type: "ACT_UPDATE", id, patch: { text, updatedAt: new Date().toISOString() } })}
                          onDelete={(id) => dispatch({ type: "ACT_DELETE", id })}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </ProjectCard>
          );
        })}
      </div>

      {state.projects.length === 0 ? (
        <div className="card" style={{ marginTop: 12 }}>
          <b>Nessun progetto.</b>
          <div className="muted">Crea i progetti dalla sezione Admin.</div>
        </div>
      ) : null}
    </div>
  );
}
