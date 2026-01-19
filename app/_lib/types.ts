export type ID = string;

export type Collaborator = {
  id: ID;
  name: string;
  color: string; // hex
  passwordSalt: string; // base64
  passwordHash: string; // base64 (sha-256(salt+password))
  createdAt: string; // ISO
};

export type Project = {
  id: ID;
  title: string;
  subtitle: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  createdAt: string; // ISO
};

export type Activity = {
  id: ID;
  projectId: ID;
  collaboratorId: ID;
  text: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type DashboardFilters = {
  datePreset: "all" | "last7" | "custom";
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  projectId?: ID | "all";
  collaboratorId?: ID | "all";
};

export type AppState = {
  version: number;
  admin: {
    isAuthed: boolean;
  };
  dashboard: {
    isAuthed: boolean;
    filters: DashboardFilters;
  };
  collaborators: Collaborator[];
  projects: Project[];
  activities: Activity[];
  ui: {
    projectSortByName: boolean;
  };
};
