"use client";

import React, { useMemo } from "react";
import { Collaborator, ID } from "../app/_lib/types";

export default function CollaboratorPicker({
  collaborators,
  value,
  onChange
}: {
  collaborators: Collaborator[];
  value: ID | "";
  onChange: (id: ID | "") => void;
}) {
  const options = useMemo(() => collaborators.slice().sort((a, b) => a.name.localeCompare(b.name)), [collaborators]);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value as ID)} className="input">
      <option value="">Seleziona collaboratore…</option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
