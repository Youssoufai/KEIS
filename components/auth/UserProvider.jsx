"use client";

import { createContext, useContext, useEffect } from "react";
import { setActivityActor } from "@/lib/store/store";

const UserContext = createContext(null);

/** Makes the server-verified user available to client components. */
export function UserProvider({ user, children }) {
  useEffect(() => {
    setActivityActor(user);
    return () => setActivityActor(null);
  }, [user]);
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** The signed-in user: { id, name, email, role, lgaId }. */
export function useCurrentUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useCurrentUser must be used inside the authenticated app shell.");
  return user;
}

/** Role of the signed-in user (assigned to the account, not user-selectable). */
export function useRole() {
  return useCurrentUser().role;
}
