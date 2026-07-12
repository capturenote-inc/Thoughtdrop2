"use client";

import { createContext, useContext } from "react";

export interface CaptureModalNote {
  id: string;
  body: string;
}

interface CaptureModalContextValue {
  openCreate: () => void;
  openEdit: (note: CaptureModalNote, focusTagIndex?: number, focusTagLength?: number) => void;
}

export const CaptureModalContext = createContext<CaptureModalContextValue | null>(null);

export function useCaptureModal(): CaptureModalContextValue {
  const ctx = useContext(CaptureModalContext);
  if (!ctx) throw new Error("useCaptureModal must be used within CaptureModalProvider");
  return ctx;
}
