"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCaptureModal } from "@/lib/capture-modal-context";
import { logout } from "@/app/auth/actions";

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={active ? "font-medium text-ink" : "text-ink-secondary hover:text-ink"}
    >
      {children}
    </Link>
  );
}

export function TopBar({ untriagedCount }: { untriagedCount: number }) {
  const pathname = usePathname();
  const { openCreate } = useCaptureModal();

  const isPages = pathname === "/" || pathname.startsWith("/pages");
  const isTasks = pathname.startsWith("/tasks");
  const isInbox = pathname.startsWith("/inbox");

  return (
    <div className="flex h-12 items-center gap-6 border-b border-border px-6 text-[13px]">
      <Link href="/" className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-[3px] bg-amber" />
        <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-ink">ThoughtDrop</span>
      </Link>

      <div className="flex items-center gap-5">
        <NavLink href="/pages" active={isPages}>
          Pages
        </NavLink>
        <NavLink href="/tasks" active={isTasks}>
          Tasks
        </NavLink>
        <Link
          href="/inbox"
          className={`flex items-center gap-1.5 ${isInbox ? "font-medium text-ink" : "text-ink-secondary hover:text-ink"}`}
        >
          Inbox
          {untriagedCount > 0 && (
            <span className="rounded-full bg-amber-tint px-1.5 py-px font-mono text-[10.5px] text-amber-ink">
              {untriagedCount}
            </span>
          )}
        </Link>
      </div>

      <div className="flex-1" />

      {/* Visibly inactive, not just unresponsive: Phase 5 builds real
          search. A styled-but-dead input (previously readOnly, with a "/"
          hint that focused it into nowhere) reads as broken, not
          unfinished -- disabled + reduced opacity + a tooltip reads as
          "not yet". The "/" focus shortcut is gone with it: a shortcut
          that focuses a dead input is the same lie twice. */}
      <div
        title="Search coming soon"
        className="flex h-7 w-[260px] cursor-not-allowed items-center gap-2 rounded-md border border-border px-2.5 text-[12.5px] text-ink-faint opacity-50"
      >
        <input
          type="text"
          placeholder="Search"
          disabled
          className="w-full cursor-not-allowed bg-transparent outline-none placeholder:text-ink-faint"
        />
      </div>

      <button
        type="button"
        onClick={openCreate}
        className="flex h-[30px] items-center gap-2 rounded-md bg-amber px-3.5 text-[13px] font-semibold text-on-amber hover:bg-amber-hover"
      >
        Create Note
        <span className="font-mono text-[10px] font-normal opacity-75">⌘K</span>
      </button>

      {/* Not part of the approved design (2b has no account/session
          control) -- kept minimal so it doesn't compete with Create Note
          as the bar's one filled element. */}
      <form action={logout}>
        <button type="submit" className="text-[11px] text-ink-faint hover:text-ink-secondary">
          Sign out
        </button>
      </form>
    </div>
  );
}
