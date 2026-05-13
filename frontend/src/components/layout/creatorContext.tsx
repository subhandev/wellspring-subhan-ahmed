"use client";

import { createContext, useContext } from "react";

type CreatorContextValue = {
  email: string | null;
};

const CreatorContext = createContext<CreatorContextValue>({ email: null });

export function CreatorProvider({
  email,
  children
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  return <CreatorContext.Provider value={{ email }}>{children}</CreatorContext.Provider>;
}

export function useCreatorEmail() {
  return useContext(CreatorContext).email;
}
