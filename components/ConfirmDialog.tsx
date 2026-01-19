"use client";

import React from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50
      }}
      onMouseDown={onCancel}
    >
      <div className="card" style={{ maxWidth: 520, width: "100%" }} onMouseDown={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="muted">{message}</p>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn" onClick={onCancel}>Annulla</button>
          <button className="btn danger" onClick={onConfirm}>Conferma</button>
        </div>
      </div>
    </div>
  );
}
