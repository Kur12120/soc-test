export type UserRole = "admin" | "user" | "ciso";
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  teamId: string | null;
}
export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
}
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_role?: string;
}
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved";
  assigned_user_id?: string | null;
  assigned_user_name?: string | null;
  created_by?: string | null;
  created_at?: string;
}
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  assigned_user_id?: string | null;
  assigned_user_name?: string | null;
  due_date?: string | null;
  created_at?: string;
}
