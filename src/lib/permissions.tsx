import { useSyncExternalStore } from "react";
import { currentUser, usersStore, type ModuleKey, type AppUser, type CrudPerm } from "@/lib/mock-data";

export function useCurrentUser(): AppUser {
  const id = useSyncExternalStore(currentUser.subscribe, currentUser.get, currentUser.get);
  const users = useSyncExternalStore(usersStore.subscribe, usersStore.all, usersStore.all);
  return users.find((u) => u.id === id) ?? users[0];
}

export function useCan() {
  const user = useCurrentUser();
  return (module: ModuleKey, action: keyof CrudPerm = "read"): boolean => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    return !!user.permissions?.[module]?.[action];
  };
}
