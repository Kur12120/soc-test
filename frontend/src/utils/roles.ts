import { UserRole } from "../types";
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
export function isAdmin(role?: UserRole | string) {
  return role === "admin";
}
export function isCISO(role?: UserRole | string) {
  return role === "ciso";
}
export function isUser(role?: UserRole | string) {
  return role === "user";
}
export function canWrite(role?: UserRole | string) {
  return role === "admin";
}
export function canViewAll(role?: UserRole | string) {
  return role === "admin" || role === "ciso";
}
export function isRestrictedUser(role?: UserRole | string) {
  return role === "user";
}
