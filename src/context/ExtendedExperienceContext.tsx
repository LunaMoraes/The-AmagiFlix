import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { EXTENDED_EXPERIENCE_STORAGE_KEY } from "../config/app";

interface ExtendedExperienceContextValue {
  extendedExperience: boolean;
  setExtendedExperience(enabled: boolean): void;
  toggleExtendedExperience(): void;
}

const ExtendedExperienceContext = createContext<ExtendedExperienceContextValue | null>(null);

const loadInitialState = (): boolean => {
  if (typeof localStorage === "undefined") return false;
  try {
    const raw = localStorage.getItem(EXTENDED_EXPERIENCE_STORAGE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
};

export function ExtendedExperienceProvider({ children }: PropsWithChildren) {
  const [extendedExperience, setExtended] = useState<boolean>(loadInitialState);

  const setExtendedExperience = (enabled: boolean) => {
    setExtended(enabled);
    try {
      localStorage.setItem(EXTENDED_EXPERIENCE_STORAGE_KEY, String(enabled));
    } catch {
      // ignore storage errors
    }
  };

  const toggleExtendedExperience = () => {
    setExtendedExperience(!extendedExperience);
  };

  return (
    <ExtendedExperienceContext.Provider
      value={{
        extendedExperience,
        setExtendedExperience,
        toggleExtendedExperience,
      }}
    >
      {children}
    </ExtendedExperienceContext.Provider>
  );
}

export function useExtendedExperience(): ExtendedExperienceContextValue {
  const value = useContext(ExtendedExperienceContext);
  if (!value) throw new Error("useExtendedExperience must be used inside ExtendedExperienceProvider.");
  return value;
}
