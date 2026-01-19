"use client";

import React, { memo, useMemo, useState, useCallback } from "react";
import { Activity, Collaborator } from "../app/_lib/types";
import { formatShort } from "../app/_lib/dates";
import ActivityEditor from "./ActivityEditor";

type RowProps = {
  activity: Activity;
  collaborator: Collaborator;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
};

const ActivityRow = memo(function ActivityRow({ activity, collaborator, onUpdate, onDelete }: RowProps) {
  const [editing, setEditing] = useState(false);

  const startEdit = useCallback(() => setEditing(true), []);
  const cancel = useCallback(() => setEditing(false), []);

  const save = useCallback(
    (text: string) => {
      onUpdate(activity.id, text);
      setEditing(false);
    },
    [activity.id, onUpdate]
  );

  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      {!editing ? (
        <div className="row" style={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontWeight: 800, color: collaborator.color }}>{collaborator.name}</span>
              <span className="small">{formatShort(activity.createdAt)}</span>
            </div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>• {activity.text}</div>
          </div>

          <div className="row" style={{ alignItems: "center" }}>
            <button className="btn" onClick={startEdit}>Modifica</button>
            <button className="btn danger" onClick={() => onDelete(activity.id)}>Elimina</button>
          </div>
        </div>
      ) : (
        <ActivityEditor
          initialText={activity.text}
          onCancel={cancel}
          onSave={save}
          saveLabel="Salva modifiche"
        />
      )}
    </div>
  );
});

export default function ActivityList({
  activities,
  collaborator,
  onUpdate,
  onDelete
}: {
  activities: Activity[];
  collaborator: Collaborator;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    return activities.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [activities]);

  const visible = expanded ? sorted : sorted.slice(0, 10);

  return (
    <div>
      {visible.length === 0 ? <div className="muted">Nessuna attività.</div> : null}

      {visible.map((a) => (
        <ActivityRow
          key={a.id} // key stabile = niente re-mount = cursore ok
          activity={a}
          collaborator={collaborator}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}

      {sorted.length > 10 ? (
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Comprimi" : "Mostra tutte"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
