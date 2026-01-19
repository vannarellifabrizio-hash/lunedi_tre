"use client";

import React, { useMemo } from "react";
import { Collaborator, DashboardFilters, Project } from "../app/_lib/types";

export default function FiltersBar({
  filters,
  setFilters,
  projects,
  collaborators
}: {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  projects: Project[];
  collaborators: Collaborator[];
}) {
  const projOptions = useMemo(() => projects.slice().sort((a, b) => a.title.localeCompare(b.title)), [projects]);
  const collabOptions = useMemo(() => collaborators.slice().sort((a, b) => a.name.localeCompare(b.name)), [collaborators]);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <h3>Filtri</h3>

      <div className="grid-3">
        <div>
          <label>Periodo</label>
          <select
            value={filters.datePreset}
            onChange={(e) => setFilters({ ...filters, datePreset: e.target.value as any })}
            className="input"
          >
            <option value="all">Tutto</option>
            <option value="last7">Ultimi 7 giorni</option>
            <option value="custom">Intervallo personalizzato</option>
          </select>
        </div>

        <div>
          <label>Progetto</label>
          <select
            value={filters.projectId ?? "all"}
            onChange={(e) => setFilters({ ...filters, projectId: e.target.value as any })}
            className="input"
          >
            <option value="all">Tutti</option>
            {projOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Collaboratore</label>
          <select
            value={filters.collaboratorId ?? "all"}
            onChange={(e) => setFilters({ ...filters, collaboratorId: e.target.value as any })}
            className="input"
          >
            <option value="all">Tutti</option>
            {collabOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filters.datePreset === "custom" ? (
        <div className="grid-2" style={{ marginTop: 10 }}>
          <div>
            <label>Da</label>
            <input
              className="input"
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label>A</label>
            <input
              className="input"
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
        <button
          className="btn"
          onClick={() => setFilters({ datePreset: "all", projectId: "all", collaboratorId: "all" })}
        >
          Resetta filtri
        </button>
      </div>
    </div>
  );
}
