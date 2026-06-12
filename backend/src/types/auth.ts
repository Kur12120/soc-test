export type UserRole = "admin" | "analyst" | "super_admin";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}