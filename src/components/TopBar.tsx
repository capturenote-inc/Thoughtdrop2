"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
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
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

      <div className="flex h-7 w-[260px] items-center gap-2 rounded-md border border-border px-2.5 text-[12.5px] text-ink-faint">
        <input
          ref={searchRef}
          type="text"
          placeholder="Search"
          readOnly
          className="w-full bg-transparent outline-none placeholder:text-ink-faint"
        />
        <span className="font-mono text-[10px] text-ink-ghost">/</span>
      </div>

      <button
        type="button"
        onClick={openCreate}
        className="flex h-[30px] items-center gap-2 rounded-md bg-amber px-3.5 text-[13px] font-semibold text-on-amber hover:bg-amber-hover"
      >
        Create Note
        <span className="font-mono text-[10px] font-normal opacity-75">⌘N</span>
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
