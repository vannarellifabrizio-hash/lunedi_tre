"use client";

import React, { createContext, useContext, useMemo, useReducer, useRef, useEffect } from "react";
import { AppState, Activity, Collaborator, DashboardFilters, Project, ID } from "../_lib/types";
import { loadState, saveState } from "../_lib/storage";
import { nowISO, toYMD } from "../_lib/dates";
import { uuid } from "../_lib/uuid";

type Action =
  | { type: "ADMIN_AUTH_SET"; value: boolean }
  | { type: "DASH_AUTH_SET"; value: boolean }
  | { type: "COLLAB_ADD"; value: Collaborator }
  | { type: "COLLAB_UPDATE"; id: ID; patch: Partial<Pick<Collaborator, "name" | "color" | "passwordSalt" | "passwordHash">> }
  | { type: "COLLAB_DELETE"; id: ID }
  | { type: "PROJECT_ADD"; value: Project }
  | { type: "PROJECT_UPDATE"; id: ID; patch: Partial<Pick<Project, "title" | "subtitle" | "startDate" | "endDate">> }
  | { type: "PROJECT_DELETE"; id: ID }
  | { type: "ACT_ADD"; value: Activity }
  | { type: "ACT_UPDATE"; id: ID; patch: Partial<Pick<Activity, "text" | "updatedAt">> }
  | { type: "ACT_DELETE"; id: ID }
  | { type: "UI_PROJECT_SORT_TOGGLE" }
  | { type: "DASH_FILTERS_SET"; value: DashboardFilters }
  | { type: "RESET_ALL" }
  | { type: "IMPORT_STATE"; value: AppState };

const defaultState: AppState = {
  version: 1,
  admin: { isAuthed: false },
  dashboard: {
    isAuthed: false,
    filters: { datePreset: "all", projectId: "all", collaboratorId: "all" }
  },
  collaborators: [],
  projects: [],
  activities: [],
  ui: { projectSortByName: false }
};

// Seed minimale: crea 1 progetto di esempio se vuoi (puoi eliminarlo in admin)
function withOptionalSeed(s: AppState): AppState {
  if (s.projects.length > 0) return s;
  const today = new Date();
  const start = toYMD(today);
  const end = toYMD(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30));
  return {
    ...s,
    projects: [
      {
        id: uuid(),
        title: "Progetto demo",
        subtitle: "Puoi rinominarlo o eliminarlo dall’Admin",
        startDate: start,
        endDate: end,
        createdAt: nowISO()
      }
    ]
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADMIN_AUTH_SET":
      return { ...state, admin: { isAuthed: action.value } };
    case "DASH_AUTH_SET":
      return { ...state, dashboard: { ...state.dashboard, isAuthed: action.value } };

    case "COLLAB_ADD":
      return { ...state, collaborators: [...state.collaborators, action.value] };
    case "COLLAB_UPDATE":
      return {
        ...state,
        collaborators: state.collaborators.map(c => (c.id === action.id ? { ...c, ...action.patch } : c))
      };
    case "COLLAB_DELETE":
      return {
        ...state,
        collaborators: state.collaborators.filter(c => c.id !== action.id),
        activities: state.activities.filter(a => a.collaboratorId !== action.id)
      };

    case "PROJECT_ADD":
      return { ...state, projects: [...state.projects, action.value] };
    case "PROJECT_UPDATE":
      return {
        ...state,
        projects: state.projects.map(p => (p.id === action.id ? { ...p, ...action.patch } : p))
      };
    case "PROJECT_DELETE":
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.id),
        activities: state.activities.filter(a => a.projectId !== action.id)
      };

    case "ACT_ADD":
      return { ...state, activities: [...state.activities, action.value] };
    case "ACT_UPDATE":
      return {
        ...state,
        activities: state.activities.map(a => (a.id === action.id ? { ...a, ...action.patch } : a))
      };
    case "ACT_DELETE":
      return { ...state, activities: state.activities.filter(a => a.id !== action.id) };

    case "UI_PROJECT_SORT_TOGGLE":
      return { ...state, ui: { ...state.ui, projectSortByName: !state.ui.projectSortByName } };

    case "DASH_FILTERS_SET":
      return { ...state, dashboard: { ...state.dashboard, filters: action.value } };

    case "RESET_ALL":
      return withOptionalSeed({ ...defaultState });
      case "IMPORT_STATE": {
  // Per sicurezza: quando importi, ti disautentico (così non rimani “loggato” con dati cambiati)
  const incoming = action.value;

  // Mini-sanitizzazione: se manca qualcosa, ripiega sui default
  const safe: AppState = {
    ...defaultState,
    version: incoming.version ?? 1,
    collaborators: Array.isArray(incoming.collaborators) ? incoming.collaborators : [],
    projects: Array.isArray(incoming.projects) ? incoming.projects : [],
    activities: Array.isArray(incoming.activities) ? incoming.activities : [],
    ui: {
      projectSortByName: !!incoming.ui?.projectSortByName
    },
    admin: { isAuthed: false },
    dashboard: {
      isAuthed: false,
      filters: incoming.dashboard?.filters ?? { datePreset: "all", projectId: "all", collaboratorId: "all" }
    }
  };

  return withOptionalSeed(safe);
}
    default:
      return state;
  }
}

type Ctx = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const StoreCtx = createContext<Ctx | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const loadedRef = useRef(false);
  const [state, dispatch] = useReducer(reducer, defaultState, (s) => {
    if (typeof window === "undefined") return s;
    const loaded = loadState();
    return withOptionalSeed(loaded ?? s);
  });

  // Persistence: salva SOLO quando cambia lo stato globale (non ad ogni singolo tasto in un input locale)
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      return;
    }
    saveState(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("Store missing");
  return ctx;
}
