"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useCaptureModal } from "@/lib/capture-modal-context";
import { logout } from "@/app/auth/actions";
import { PAGE_COLORS, resolvePageColor } from "@/lib/page-colors";

interface PinnedPage {
  id: string;
  tag: string;
  title: string;
  color: string;
}

function RailIcon({ children }: { children: ReactNode }) {
  return <span className="grid h-5 w-5 shrink-0 place-items-center" aria-hidden>{children}</span>;
}

function PagesIcon() {
  return <RailIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]"><path d="M4 5.8A2.8 2.8 0 0 1 6.8 3H20v15.2A2.8 2.8 0 0 0 17.2 15H4z"/><path d="M4 5.8V21h13.2A2.8 2.8 0 0 1 20 18.2"/></svg></RailIcon>;
}

function TaskIcon() {
  return <RailIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]"><path d="m5 12 4 4L19 6"/></svg></RailIcon>;
}

function InboxIcon() {
  return <RailIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]"><path d="M4 5h16v14H4z"/><path d="M4 13h4l1.6 2h4.8l1.6-2h4"/></svg></RailIcon>;
}

function PlusIcon() {
  return <RailIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]"><path d="M12 5v14M5 12h14"/></svg></RailIcon>;
}

function RailLink({ href, active, expanded, label, icon, badge }: { href: string; active: boolean; expanded: boolean; label: string; icon: ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      title={expanded ? undefined : label}
      className={`relative flex h-10 items-center rounded-xl px-[11px] text-[13px] transition-colors ${active ? "bg-white/10 text-white" : "text-rail-muted hover:bg-white/[0.06] hover:text-white"}`}
    >
      {icon}
      {expanded && <span className="ml-3 truncate">{label}</span>}
      {badge && badge > 0 ? (
        <span className={`ml-auto grid min-w-5 place-items-center rounded-full bg-amber px-1.5 py-0.5 font-mono text-[10px] text-on-amber ${expanded ? "" : "absolute -right-1 -top-1"}`}>{badge}</span>
      ) : null}
    </Link>
  );
}

export function TopBar({ untriagedCount, pinnedPages }: { untriagedCount: number; pinnedPages: PinnedPage[] }) {
  const pathname = usePathname();
  const { openCreate } = useCaptureModal();
  const [expanded, setExpanded] = useState(false);

  const isPages = pathname.startsWith("/pages");
  const isTasks = pathname.startsWith("/tasks");
  const isInbox = pathname.startsWith("/inbox");

  return (
    <aside className={`sticky top-0 z-20 flex h-dvh shrink-0 flex-col border-r border-rail-line bg-rail p-3 transition-[width] duration-200 ${expanded ? "w-[232px]" : "w-[76px]"}`}>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" title="ThoughtDrop" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber text-[17px] font-bold text-on-amber">
          T
        </Link>
        {expanded && <span className="mr-auto ml-3 text-[14px] font-semibold tracking-[-0.02em] text-white">ThoughtDrop</span>}
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Collapse navigation" : "Expand navigation"} title={expanded ? "Collapse navigation" : "Expand navigation"} className="grid h-8 w-8 place-items-center rounded-lg text-rail-muted hover:bg-white/[0.06] hover:text-white">
          <span aria-hidden className="text-base leading-none">{expanded ? "‹" : "›"}</span>
        </button>
      </div>

      <button type="button" onClick={openCreate} title={expanded ? undefined : "Capture a thought"} className={`mb-5 flex h-11 items-center rounded-xl bg-amber text-[13px] font-semibold text-on-amber shadow-[0_8px_20px_rgb(217_93_33_/_0.18)] transition-colors hover:bg-amber-hover ${expanded ? "px-[11px]" : "justify-center"}`}>
        <PlusIcon />
        {expanded && <><span className="ml-3">Capture</span><span className="ml-auto font-mono text-[10px] font-normal opacity-75">⌘K</span></>}
      </button>

      <nav className="space-y-1" aria-label="Primary navigation">
        <RailLink href="/pages" active={isPages} expanded={expanded} label="Pages" icon={<PagesIcon />} />
        <RailLink href="/tasks" active={isTasks} expanded={expanded} label="Tasks" icon={<TaskIcon />} />
        <RailLink href="/inbox" active={isInbox} expanded={expanded} label="Inbox" icon={<InboxIcon />} badge={untriagedCount} />
      </nav>

      {pinnedPages.length > 0 && (
        <div className="mt-7 border-t border-rail-line pt-4">
          {expanded && <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-rail-muted">Pinned</p>}
          <div className="space-y-1">
            {pinnedPages.map((page) => {
              const palette = PAGE_COLORS[resolvePageColor(page.color)];
              const active = pathname === `/pages/${page.tag}`;
              return (
                <Link key={page.id} href={`/pages/${page.tag}`} title={expanded ? undefined : page.title} className={`flex h-9 items-center rounded-lg px-[11px] text-[12.5px] ${active ? "bg-white/10 text-white" : "text-rail-muted hover:bg-white/[0.06] hover:text-white"}`}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: palette.ink }} />
                  {expanded && <span className="ml-3 truncate">{page.title}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-rail-line pt-3">
        <form action={logout}>
          <button type="submit" title={expanded ? undefined : "Sign out"} className={`flex h-9 w-full items-center rounded-lg px-[11px] text-[12px] text-rail-muted hover:bg-white/[0.06] hover:text-white ${expanded ? "" : "justify-center"}`}>
            <span aria-hidden className="text-base">↗</span>{expanded && <span className="ml-3">Sign out</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
