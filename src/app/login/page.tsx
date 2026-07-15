"use client";

import { useActionState } from "react";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50">
      <form
        action={action}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-8"
      >
        <h1 className="text-xl font-semibold text-zinc-900">
          Log in to ThoughtDrop
        </h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-zinc-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-zinc-600">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
