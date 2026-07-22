"use client";

import { createContext, useContext } from "react";

export interface FeedbackInput {
  message: string;
  tone?: "success" | "error";
  actionLabel?: string;
  action?: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  duration?: number;
}

interface MutationFeedbackContextValue {
  showFeedback: (input: FeedbackInput) => void;
}

export const MutationFeedbackContext = createContext<MutationFeedbackContextValue | null>(null);

export function useMutationFeedback(): MutationFeedbackContextValue {
  const context = useContext(MutationFeedbackContext);
  if (!context) throw new Error("useMutationFeedback must be used within MutationFeedbackProvider");
  return context;
}
