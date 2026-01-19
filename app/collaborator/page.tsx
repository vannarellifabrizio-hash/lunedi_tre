"use client";

import React, { useMemo, useState, useCallback } from "react";
import TopNav from "../../components/TopNav";
import CollaboratorPicker from "../../components/CollaboratorPicker";
import ProjectCard from "../../components/ProjectCard";
import ActivityEditor from "../../components/ActivityEditor";
import ActivityList from "../../components/ActivityList";
import { useAppStore } from "../_state/store";
import { verifyPassword } from "../_lib/auth";
import { uuid } from "../_lib/uuid";
import { nowISO } from "../_lib/dates";

export default function CollaboratorPage() {
  const { state, dispatch } = useAppStore();

  const [selectedId, setSelectedId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [authedId, setAuthedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const collab = useMemo(() => state.collaborators.find((c) => c.id === authedId) ?? null, [state.collaborators, authedId]);

  const projects = useMemo(() => {
    const arr = state.projects.slice();
    arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return arr;
  }, [state.projects]);

  const login = useCallback(async () => {
    setError(null);
    const c = state.collaborators.find((x) => x.id === selectedId);
    if (!c) {
      setError("Seleziona un collaboratore.");
      return;
    }
    const ok = await verifyPassword(c.passwordSalt, c.passwordHash, password);
    if (!ok) {
      setError("Password errata.");
      return;
    }
    setAuthedId(c.id);
    setPassword("");
  }, [state.collaborators, selectedId, password]);

  const myActivitiesByProject = useMemo(() => {
    if (!collab) return new Map<string, any[]>();
    const m = new Map<string, any[]>();
    for (const a of state.activities) {
      if (a.collaboratorId !== collab.id) continue;
      if (!m.has(a.projectId)) m.set(a.projectId, []);
      m.get(a.projectId)!.push(a);
    }
    return m;
  }, [state.activities, collab]);

  if (!authedId) {
    return (
      <div className="container">
        <TopNav title="COLLABORATORE" subtitle="Accesso" />
        <div className="card">
          <h2>Login Collaboratore</h2>
          <label>Collaboratore</label>
          <CollaboratorPicker collaborators={state.collaborators} value={selectedId} onChange={setSelectedId} />

          <label>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error ? <div style={{ color: "var(--danger)", marginTop: 10 }}>{error}</div> : null}

          <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
            <button className="btn primary" onClick={login}>Entra</button>
          </div>

          {state.collaborators.length === 0 ? (
            <div className="card" style={{ marginTop: 12 }}>
              <b>Nessun collaboratore trovato.</b>
              <div className="muted">Crea i collaboratori dalla sezione Admin.</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!collab) {
    return (
      <div className="container">
        <TopNav title="COLLABORATORE" subtitle="Errore" />
        <div className="card">
          <b>Collaboratore non trovato.</b>
          <div className="muted">Probabilmente è stato eliminato dall’Admin.</div>
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
            <button className="btn" onClick={() => setAuthedId(null)}>Torna indietro</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <TopNav title="COLLABORATORE" subtitle={`Ciao, ${collab.name}`} />

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span className="badge">
          <span className="dot" style={{ background: collab.color }} /> <b>{collab.name}</b>
        </span>
        <button className="btn" onClick={() => setAuthedId(null)}>Esci</button>
      </div>

      <div style={{ marginTop: 12 }} className="grid-2">
        {projects.map((p) => {
          const myActs = myActivitiesByProject.get(p.id) ?? [];
          return (
            <ProjectCard key={p.id} project={p}>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3 style={{ marginTop: 0 }}>Nuova attività</h3>
                <ActivityEditor
                  initialText=""
                  onCancel={() => {}}
                  onSave={(text) => {
                    dispatch({
                      type: "ACT_ADD",
                      value: {
                        id: uuid(),
                        projectId: p.id,
                        collaboratorId: collab.id,
                        text,
                        createdAt: nowISO(),
                        updatedAt: nowISO()
                      }
                    });
                  }}
                  saveLabel="Salva attività"
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <h3>Le tue attività</h3>
                <ActivityList
                  activities={myActs}
                  collaborator={collab}
                  onUpdate={(id, text) => dispatch({ type: "ACT_UPDATE", id, patch: { text, updatedAt: nowISO() } })}
                  onDelete={(id) => dispatch({ type: "ACT_DELETE", id })}
                />
              </div>
            </ProjectCard>
          );
        })}
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ marginTop: 12 }}>
          <b>Nessun progetto.</b>
          <div className="muted">Crea i progetti dalla sezione Admin.</div>
        </div>
      ) : null}
    </div>
  );
}
