export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "analyst";
  teamId: string | null;
}
export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
}
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved";
  assigned_user_id?: string | null;
  created_by?: string | null;
  created_at?: string;
}
