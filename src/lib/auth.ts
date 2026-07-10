import { useSyncExternalStore } from "react";

type AuthState = { user: { email: string; name: string } | null };

let state: AuthState = { user: null };
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

export const auth = {
  login(email: string, _password: string) {
    state = { user: { email, name: "Fatima Zahra Abbadi" } };
    emit();
  },
  logout() {
    state = { user: null };
    emit();
  },
  get() { return state; },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function useAuth() {
  return useSyncExternalStore(
    (cb) => auth.subscribe(cb),
    () => state,
    () => state,
  );
}

export const DEMO_EMAIL = "admin@beone-consulting.com";
export const DEMO_PASSWORD = "Demo1234!";
export const LOGO_URL =
  "https://beone-consulting.com/wp-content/uploads/2026/01/LOGO-BEONE-1-Photoroom.png";
