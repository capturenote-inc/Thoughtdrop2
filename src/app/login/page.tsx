"use client";

import { useActionState } from "react";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-6">
      <div aria-hidden className="absolute -left-32 top-[-120px] h-80 w-80 rounded-full bg-amber-tint blur-3xl" />
      <form
        action={action}
        className="relative flex w-full max-w-md flex-col gap-5 rounded-xl border border-border-modal bg-bg-modal p-9 shadow-2xl"
      >
        <div className="mb-2">
          <span className="mb-6 grid h-10 w-10 place-items-center rounded-xl bg-amber text-[17px] font-bold text-on-amber">T</span>
          <h1 className="text-[29px] font-semibold tracking-[-0.04em] text-ink">Welcome back.</h1>
          <p className="mt-2 text-[14px] text-ink-secondary">Your thoughts are waiting in their places.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[12px] font-medium text-ink-secondary">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="h-10 rounded-lg border border-border bg-bg px-3 text-[14px] text-ink outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[12px] font-medium text-ink-secondary">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="h-10 rounded-lg border border-border bg-bg px-3 text-[14px] text-ink outline-none"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-10 rounded-lg bg-ink px-3 text-[13px] font-semibold text-bg hover:bg-ink-body disabled:opacity-50"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
