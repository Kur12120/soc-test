export type UserRole = "admin" | "user" | "ciso";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
