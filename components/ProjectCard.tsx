"use client";

import React, { useMemo } from "react";
import { Activity, Collaborator, Project } from "../app/_lib/types";
import { isPastEndDate } from "../app/_lib/dates";

export default function ProjectCard({
  project,
  rightTop,
  children
}: {
  project: Project;
  rightTop?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isDone = useMemo(() => isPastEndDate(project.endDate), [project.endDate]);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>{project.title}</h3>
            <span className="badge">
              <span
                className="dot"
                style={{ background: isDone ? "var(--danger)" : "var(--ok)" }}
              />
              <b>{isDone ? "terminato" : "in corso"}</b>
            </span>
          </div>
          <div className="muted">{project.subtitle}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div className="small"><b>Inizio:</b> {project.startDate}</div>
          <div className="small"><b>Fine:</b> {project.endDate}</div>
          {rightTop ? <div style={{ marginTop: 8 }}>{rightTop}</div> : null}
        </div>
      </div>

      <div className="hr" />
      {children}
    </div>
  );
}
