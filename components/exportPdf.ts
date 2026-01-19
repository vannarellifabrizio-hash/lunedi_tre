"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Activity, Collaborator, Project, DashboardFilters, ID } from "../app/_lib/types";
import { formatShort, parseYMD, toYMD } from "../app/_lib/dates";

function withinDateRange(iso: string, filters: DashboardFilters): boolean {
  if (filters.datePreset === "all") return true;

  const d = new Date(iso);
  const ymd = toYMD(d);

  if (filters.datePreset === "last7") {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return d >= new Date(from.getFullYear(), from.getMonth(), from.getDate());
  }

  // custom
  const from = filters.dateFrom ? parseYMD(filters.dateFrom) : null;
  const to = filters.dateTo ? parseYMD(filters.dateTo) : null;
  const cur = parseYMD(ymd);

  if (from && cur < from) return false;
  if (to) {
    // include end date
    const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59);
    if (d > toEnd) return false;
  }
  return true;
}

export function getFilteredActivities(
  activities: Activity[],
  filters: DashboardFilters
): Activity[] {
  return activities.filter((a) => {
    if (!withinDateRange(a.createdAt, filters)) return false;
    if (filters.projectId && filters.projectId !== "all" && a.projectId !== filters.projectId) return false;
    if (filters.collaboratorId && filters.collaboratorId !== "all" && a.collaboratorId !== filters.collaboratorId) return false;
    return true;
  });
}

export function exportPdfTabular({
  projects,
  collaborators,
  activities,
  filters
}: {
  projects: Project[];
  collaborators: Collaborator[];
  activities: Activity[];
  filters: DashboardFilters;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Export attività (Tabellare)", 40, 40);
  doc.setFontSize(10);
  doc.text(`Filtri: periodo=${filters.datePreset}, progetto=${filters.projectId ?? "all"}, collaboratore=${filters.collaboratorId ?? "all"}`, 40, 58);

  const collabById = new Map(collaborators.map(c => [c.id, c]));
  const projById = new Map(projects.map(p => [p.id, p]));

  const filtered = getFilteredActivities(activities, filters)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // Raggruppa: progetto -> collaboratore -> attività
  const byProject = new Map<ID, Map<ID, Activity[]>>();
  for (const a of filtered) {
    if (!byProject.has(a.projectId)) byProject.set(a.projectId, new Map());
    const byCollab = byProject.get(a.projectId)!;
    if (!byCollab.has(a.collaboratorId)) byCollab.set(a.collaboratorId, []);
    byCollab.get(a.collaboratorId)!.push(a);
  }

  // Costruisci righe con "merge-like"
  const body: any[] = [];
  const sortedProjectIds = Array.from(byProject.keys()).sort((pa, pb) => {
    const A = projById.get(pa)?.title ?? "";
    const B = projById.get(pb)?.title ?? "";
    return A.localeCompare(B);
  });

  for (const pid of sortedProjectIds) {
    const p = projById.get(pid);
    const collabMap = byProject.get(pid)!;

    // ordine collaboratori per nome
    const collabIds = Array.from(collabMap.keys()).sort((a, b) => {
      const A = collabById.get(a)?.name ?? "";
      const B = collabById.get(b)?.name ?? "";
      return A.localeCompare(B);
    });

    // calcola quante righe totali per questo progetto
    let projectRowsTotal = 0;
    const collabRowCounts = new Map<ID, number>();

    for (const cid of collabIds) {
      const list = collabMap.get(cid)!.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      collabRowCounts.set(cid, list.length);
      projectRowsTotal += list.length;
    }

    let projectRowCursor = 0;

    for (const cid of collabIds) {
      const c = collabById.get(cid);
      const list = collabMap.get(cid)!.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      const n = list.length;
      const shouldMergeCollaborator = n > 2; // regola richiesta
      for (let i = 0; i < n; i++) {
        const a = list[i];
        const projectCell =
          projectRowCursor === 0
            ? { content: p?.title ?? "—", rowSpan: projectRowsTotal }
            : { content: "" };

        const activityCell = `${formatShort(a.createdAt)} — ${a.text}`;

        const collaboratorCell = shouldMergeCollaborator
          ? (i === 0 ? { content: c?.name ?? "—", rowSpan: n } : { content: "" })
          : { content: c?.name ?? "—" };

        body.push([projectCell, activityCell, collaboratorCell]);
        projectRowCursor++;
      }
    }
  }

  autoTable(doc, {
    startY: 80,
    head: [["NOME PROGETTI", "ATTIVITÀ SVOLTE", "COLLABORATORI"]],
    body,
    styles: { fontSize: 9, cellPadding: 6, valign: "top" },
    headStyles: { fillColor: [30, 41, 59] }
  });

  doc.save("export-tabellare.pdf");
}

export function exportPdfEditorial({
  projects,
  collaborators,
  activities,
  filters
}: {
  projects: Project[];
  collaborators: Collaborator[];
  activities: Activity[];
  filters: DashboardFilters;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  let y = 40;

  doc.setFontSize(14);
  doc.text("Export attività (Editoriale)", 40, y);
  y += 18;

  doc.setFontSize(10);
  doc.text(`Filtri: periodo=${filters.datePreset}, progetto=${filters.projectId ?? "all"}, collaboratore=${filters.collaboratorId ?? "all"}`, 40, y);
  y += 18;

  const collabById = new Map(collaborators.map(c => [c.id, c]));
  const projById = new Map(projects.map(p => [p.id, p]));

  const filtered = getFilteredActivities(activities, filters)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // progetto -> collaboratore -> attività
  const byProject = new Map<ID, Map<ID, Activity[]>>();
  for (const a of filtered) {
    if (!byProject.has(a.projectId)) byProject.set(a.projectId, new Map());
    const byCollab = byProject.get(a.projectId)!;
    if (!byCollab.has(a.collaboratorId)) byCollab.set(a.collaboratorId, []);
    byCollab.get(a.collaboratorId)!.push(a);
  }

  const projectIds = Array.from(byProject.keys()).sort((a, b) => {
    const A = projById.get(a)?.title ?? "";
    const B = projById.get(b)?.title ?? "";
    return A.localeCompare(B);
  });

  doc.setFontSize(11);

  for (const pid of projectIds) {
    const p = projById.get(pid);
    const title = p ? `${p.title} — ${p.subtitle}` : "Progetto";
    const block = byProject.get(pid)!;

    // page break basic
    if (y > 740) {
      doc.addPage();
      y = 40;
    }

    doc.setFontSize(12);
    doc.text(title, 40, y);
    y += 14;

    doc.setFontSize(10);
    doc.text(`Periodo progetto: ${p?.startDate ?? "—"} → ${p?.endDate ?? "—"}`, 40, y);
    y += 14;

    const collabIds = Array.from(block.keys()).sort((a, b) => {
      const A = collabById.get(a)?.name ?? "";
      const B = collabById.get(b)?.name ?? "";
      return A.localeCompare(B);
    });

    for (const cid of collabIds) {
      const c = collabById.get(cid);
      const list = block.get(cid)!.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      if (y > 740) {
        doc.addPage();
        y = 40;
      }

      doc.setFontSize(11);
      doc.text(`${c?.name ?? "—"}`, 50, y);
      y += 12;

      doc.setFontSize(10);
      for (const a of list) {
        const line = `• ${formatShort(a.createdAt)} — ${a.text}`;
        const lines = doc.splitTextToSize(line, 500);
        for (const l of lines) {
          if (y > 760) {
            doc.addPage();
            y = 40;
          }
          doc.text(l, 60, y);
          y += 12;
        }
      }
      y += 8;
    }

    y += 10;
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(40, y, 555, y);
    y += 14;
  }

  doc.save("export-editoriale.pdf");
}
