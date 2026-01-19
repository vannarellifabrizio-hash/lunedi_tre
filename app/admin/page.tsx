"use client";

import React, { useMemo, useState, useCallback } from "react";
import TopNav from "../../components/TopNav";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAppStore } from "../_state/store";
import { uuid } from "../_lib/uuid";
import { nowISO } from "../_lib/dates";
import { randomSaltBase64, hashWithSaltBase64, verifyAdmin } from "../_lib/auth";

export default function AdminPage() {
  const { state, dispatch } = useAppStore();
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newCName, setNewCName] = useState("");
  const [newCPass, setNewCPass] = useState("");
  const [newCColor, setNewCColor] = useState("#22c55e");

  const [newPTitle, setNewPTitle] = useState("");
  const [newPSub, setNewPSub] = useState("");
  const [newPStart, setNewPStart] = useState("");
  const [newPEnd, setNewPEnd] = useState("");

  const [confirm, setConfirm] = useState<{ open: boolean; kind: "collab" | "project"; id: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const collaborators = useMemo(() => state.collaborators.slice().sort((a, b) => a.name.localeCompare(b.name)), [state.collaborators]);

  const projects = useMemo(() => {
    const arr = state.projects.slice();
    if (state.ui.projectSortByName) arr.sort((a, b) => a.title.localeCompare(b.title));
    else arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return arr;
  }, [state.projects, state.ui.projectSortByName]);

  const doLogin = useCallback(async () => {
    setError(null);
    const ok = await verifyAdmin(pass);
    if (!ok) {
      setError("Password errata.");
      return;
    }
    dispatch({ type: "ADMIN_AUTH_SET", value: true });
    setPass("");
  }, [pass, dispatch]);

  const addCollaborator = useCallback(async () => {
    setError(null);
    const name = newCName.trim();
    const pw = newCPass.trim();
    if (!name || !pw) {
      setError("Inserisci nome e password del collaboratore.");
      return;
    }
    const salt = randomSaltBase64();
    const hash = await hashWithSaltBase64(salt, pw);
    dispatch({
      type: "COLLAB_ADD",
      value: {
        id: uuid(),
        name,
        color: newCColor,
        passwordSalt: salt,
        passwordHash: hash,
        createdAt: nowISO()
      }
    });
    setNewCName("");
    setNewCPass("");
  }, [newCName, newCPass, newCColor, dispatch]);

  const addProject = useCallback(() => {
    setError(null);
    const title = newPTitle.trim();
    if (!title || !newPStart || !newPEnd) {
      setError("Inserisci titolo, data inizio e data fine.");
      return;
    }
    dispatch({
      type: "PROJECT_ADD",
      value: {
        id: uuid(),
        title,
        subtitle: newPSub.trim(),
        startDate: newPStart,
        endDate: newPEnd,
        createdAt: nowISO()
      }
    });
    setNewPTitle("");
    setNewPSub("");
    setNewPStart("");
    setNewPEnd("");
  }, [newPTitle, newPSub, newPStart, newPEnd, dispatch]);

  if (!state.admin.isAuthed) {
    return (
      <div className="container">
        <TopNav title="ADMIN" subtitle="Accesso" />
        <div className="card">
          <h2>Login Admin</h2>
          <p className="muted">Inserisci la password Admin. (Non viene mostrata in chiaro.)</p>
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
      <TopNav title="ADMIN" subtitle="Gestione" />

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span className="badge">✅ Autenticato</span>
        <div className="row">
          <button className="btn" onClick={() => dispatch({ type: "UI_PROJECT_SORT_TOGGLE" })}>
            Ordinamento progetti: {state.ui.projectSortByName ? "Nome (A→Z)" : "Creazione (recenti)"}
          </button>
          <button className="btn danger" onClick={() => dispatch({ type: "RESET_ALL" })}>
            Reset totale dati
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <h2>Collaboratori</h2>

          <label>Nome</label>
          <input className="input" value={newCName} onChange={(e) => setNewCName(e.target.value)} />

          <label>Password</label>
          <input className="input" type="password" value={newCPass} onChange={(e) => setNewCPass(e.target.value)} />

          <label>Colore</label>
          <input className="input" type="color" value={newCColor} onChange={(e) => setNewCColor(e.target.value)} />

          <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
            <button className="btn primary" onClick={addCollaborator}>Crea collaboratore</button>
          </div>

          <div className="hr" />

          {collaborators.length === 0 ? <div className="muted">Nessun collaboratore.</div> : null}

          {collaborators.map((c) => (
            <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, color: c.color }}>{c.name}</div>
                  <div className="small">ID: {c.id}</div>
                </div>
                <div className="row">
                  <button
                    className="btn"
                    onClick={() => {
                      const name = prompt("Nuovo nome:", c.name);
                      if (!name) return;
                      dispatch({ type: "COLLAB_UPDATE", id: c.id, patch: { name } });
                    }}
                  >
                    Rinomina
                  </button>

                  <button
                    className="btn"
                    onClick={async () => {
                      const pw = prompt("Nuova password (non verrà mostrata):");
                      if (!pw) return;
                      const salt = randomSaltBase64();
                      const hash = await hashWithSaltBase64(salt, pw);
                      dispatch({ type: "COLLAB_UPDATE", id: c.id, patch: { passwordSalt: salt, passwordHash: hash } });
                    }}
                  >
                    Cambia password
                  </button>

                  <button
                    className="btn"
                    onClick={() => {
                      const color = prompt("Nuovo colore (es. #ff0000):", c.color);
                      if (!color) return;
                      dispatch({ type: "COLLAB_UPDATE", id: c.id, patch: { color } });
                    }}
                  >
                    Colore
                  </button>

                  <button className="btn danger" onClick={() => setConfirm({ open: true, kind: "collab", id: c.id })}>
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Progetti</h2>

          <label>Titolo</label>
          <input className="input" value={newPTitle} onChange={(e) => setNewPTitle(e.target.value)} />

          <label>Sottotitolo</label>
          <input className="input" value={newPSub} onChange={(e) => setNewPSub(e.target.value)} />

          <div className="grid-2" style={{ marginTop: 10 }}>
            <div>
              <label>Data inizio</label>
              <input className="input" type="date" value={newPStart} onChange={(e) => setNewPStart(e.target.value)} />
            </div>
            <div>
              <label>Data fine</label>
              <input className="input" type="date" value={newPEnd} onChange={(e) => setNewPEnd(e.target.value)} />
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
            <button className="btn primary" onClick={addProject}>Crea progetto</button>
          </div>

          <div className="hr" />

          {projects.length === 0 ? <div className="muted">Nessun progetto.</div> : null}

          {projects.map((p) => (
            <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{p.title}</div>
                  <div className="small">{p.subtitle}</div>
                  <div className="small">{p.startDate} → {p.endDate}</div>
                </div>
                <div className="row">
                  <button
                    className="btn"
                    onClick={() => {
                      const title = prompt("Nuovo titolo:", p.title);
                      if (!title) return;
                      dispatch({ type: "PROJECT_UPDATE", id: p.id, patch: { title } });
                    }}
                  >
                    Rinomina
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      const subtitle = prompt("Nuovo sottotitolo:", p.subtitle);
                      if (subtitle === null) return;
                      dispatch({ type: "PROJECT_UPDATE", id: p.id, patch: { subtitle } });
                    }}
                  >
                    Sottotitolo
                  </button>
                  <button className="btn danger" onClick={() => setConfirm({ open: true, kind: "project", id: p.id })}>
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error ? <div className="card" style={{ marginTop: 12, borderColor: "rgba(239,68,68,0.6)" }}>{error}</div> : null}

      <ConfirmDialog
        open={!!confirm?.open}
        title="Conferma eliminazione"
        message="Questa azione rimuove anche le attività collegate. Vuoi continuare?"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "collab") dispatch({ type: "COLLAB_DELETE", id: confirm.id });
          if (confirm.kind === "project") dispatch({ type: "PROJECT_DELETE", id: confirm.id });
          setConfirm(null);
        }}
      />
    </div>
  );
}
