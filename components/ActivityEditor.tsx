"use client";

import React, { useCallback, useState } from "react";

// Editor con stato LOCALE -> evita re-render globali mentre scrivi (cursore stabile)
export default function ActivityEditor({
  initialText,
  onSave,
  onCancel,
  saveLabel = "Salva"
}: {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  const [text, setText] = useState(initialText);

  const handleSave = useCallback(() => {
    const cleaned = text.trim();
    if (!cleaned) return;
    onSave(cleaned);
  }, [text, onSave]);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Scrivi attività…"
      />
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
        <button className="btn" onClick={onCancel}>Annulla</button>
        <button className="btn primary" onClick={handleSave}>{saveLabel}</button>
      </div>
    </div>
  );
}
