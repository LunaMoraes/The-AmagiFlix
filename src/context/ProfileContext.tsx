import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { loadLocalProfile, saveLocalProfile } from "../lib/profile-storage";
import type { LocalProfile } from "../types/profile";

interface ProfileContextValue {
  profile: LocalProfile;
  updateName(name: string): LocalProfile;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState(loadLocalProfile);
  const updateName = (name: string) => {
    const next: LocalProfile = {
      schemaVersion: 1,
      name: name.trim().slice(0, 40) || "Guest",
      avatarUrl: null,
    };
    saveLocalProfile(next);
    setProfile(next);
    return next;
  };
  return <ProfileContext.Provider value={{ profile, updateName }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside ProfileProvider.");
  return value;
}
