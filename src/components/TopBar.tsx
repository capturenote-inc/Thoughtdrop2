"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCaptureModal } from "@/lib/capture-modal-context";
import { logout } from "@/app/auth/actions";
import { PAGE_COLORS, resolvePageColor } from "@/lib/page-colors";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThoughtdropMark } from "@/components/ThoughtdropMark";
import { buildPageTree, type PageTreeNode } from "@/lib/page-tree";

interface SidebarPage {
  id: string;
  tag: string;
  title: string;
  parent_id: string | null;
  color: string;
  depth: number;
  pinned_at: string | null;
}

function RailIcon({ children }: { children: ReactNode }) {
  return <span className="grid h-5 w-5 shrink-0 place-items-center" aria-hidden>{children}</span>;
}

function TodayIcon() {
  return <RailIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]"><path d="M5 4v16h14V4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></RailIcon>;
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
    <Link href={href} title={expanded ? undefined : label} className={`relative flex h-9 items-center rounded-lg px-[11px] text-[13px] transition-colors ${active ? "bg-rail-active text-rail-ink" : "text-rail-muted hover:bg-rail-active hover:text-rail-ink"}`}>
      {icon}
      {expanded && <span className="ml-3 truncate">{label}</span>}
      {badge && badge > 0 ? <span aria-hidden className={`ml-auto grid min-w-5 place-items-center rounded-full bg-amber px-1.5 py-0.5 font-mono text-[10px] text-on-amber ${expanded ? "" : "absolute -right-1 -top-1"}`}>{badge}</span> : null}
    </Link>
  );
}

function expandableIds(nodes: PageTreeNode[]): string[] {
  return nodes.flatMap((node) => node.children.length ? [node.id, ...expandableIds(node.children)] : []);
}

function PageTreeLink({ node, pathname, openIds, onToggle, level }: { node: PageTreeNode; pathname: string; openIds: Set<string>; onToggle: (id: string) => void; level: number }) {
  const palette = PAGE_COLORS[resolvePageColor(node.color)];
  const pageActive = pathname === `/pages/${node.tag}`;
  const hasChildren = node.children.length > 0;
  const isOpen = openIds.has(node.id);

  return (
    <div>
      <div className={`flex h-8 items-center rounded-md pr-1 text-[12px] ${pageActive ? "bg-rail-active text-rail-ink" : "text-rail-muted hover:bg-rail-active hover:text-rail-ink"}`} style={{ paddingLeft: `${7 + level * 12}px` }}>
        {hasChildren ? (
          <button type="button" onClick={() => onToggle(node.id)} aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.title}`} aria-expanded={isOpen} className="grid h-6 w-5 shrink-0 place-items-center rounded text-[13px] hover:bg-rail-active">
            <span aria-hidden>{isOpen ? "⌄" : "›"}</span>
          </button>
        ) : <span className="w-5 shrink-0" />}
        <Link href={`/pages/${node.tag}`} title={node.title} className="flex min-w-0 flex-1 items-center">
          <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: palette.ink }} />
          <span className="truncate">{node.title}</span>
        </Link>
      </div>
      {hasChildren && isOpen && <div>{node.children.map((child) => <PageTreeLink key={child.id} node={child} pathname={pathname} openIds={openIds} onToggle={onToggle} level={level + 1} />)}</div>}
    </div>
  );
}

function PagesSection({ pages, pathname, expanded, open, onToggle }: { pages: SidebarPage[]; pathname: string; expanded: boolean; open: boolean; onToggle: () => void }) {
  const active = pathname.startsWith("/pages");
  const tree = useMemo(() => buildPageTree(pages), [pages]);
  const pinnedPages = useMemo(() => pages.filter((page) => page.pinned_at).sort((a, b) => (a.pinned_at as string).localeCompare(b.pinned_at as string)), [pages]);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(expandableIds(tree)));

  function toggleNode(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (!expanded) return <RailLink href="/pages" active={active} expanded={false} label="Pages" icon={<PagesIcon />} />;

  return (
    <div>
      <div className={`flex h-9 items-center rounded-lg ${active ? "bg-rail-active text-rail-ink" : "text-rail-muted hover:bg-rail-active hover:text-rail-ink"}`}>
        <Link href="/pages" className="flex min-w-0 flex-1 items-center px-[11px] text-[13px]" onClick={() => { if (!open) onToggle(); }}>
          <PagesIcon /><span className="ml-3 truncate">Pages</span>
        </Link>
        <button type="button" onClick={onToggle} aria-label={open ? "Collapse pages" : "Expand pages"} aria-expanded={open} className="mr-1 grid h-8 w-8 place-items-center rounded-md hover:bg-rail-active">
          <span aria-hidden className="text-base leading-none">{open ? "−" : "+"}</span>
        </button>
      </div>
      {open && (
        <>
          {pinnedPages.length > 0 && (
            <div className="mb-2 px-1">
              <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-rail-muted">Pinned</p>
              <div className="space-y-0.5">
                {pinnedPages.map((page) => {
                  const palette = PAGE_COLORS[resolvePageColor(page.color)];
                  const pageActive = pathname === `/pages/${page.tag}`;
                  return <Link key={page.id} href={`/pages/${page.tag}`} className={`flex h-8 items-center rounded-md px-2 text-[12px] ${pageActive ? "bg-rail-active text-rail-ink" : "text-rail-muted hover:bg-rail-active hover:text-rail-ink"}`}><span className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette.ink }} /><span className="truncate">{page.title}</span><span className="ml-auto text-[10px] text-amber-ink">●</span></Link>;
                })}
              </div>
            </div>
          )}
          <div className="mt-1 max-h-[min(38vh,400px)] overflow-y-auto border-l border-rail-line py-1 pl-1.5">
            {tree.length === 0 ? (
              <p className="px-2 py-2 text-[11px] text-rail-muted">No pages yet.</p>
            ) : tree.map((node) => <PageTreeLink key={node.id} node={node} pathname={pathname} openIds={openIds} onToggle={toggleNode} level={0} />)}
          </div>
          <div className="mt-2 px-1">
            <Link href="/pages?new=1" className="flex h-8 items-center justify-center rounded-md bg-rail-active text-[11px] font-medium text-rail-ink hover:bg-rail-line">+ New page</Link>
          </div>
        </>
      )}
    </div>
  );
}

export function TopBar({ untriagedCount, pages }: { untriagedCount: number; pages: SidebarPage[] }) {
  const pathname = usePathname();
  const { openCreate } = useCaptureModal();
  const [expanded, setExpanded] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openMobile = useCallback(() => {
    setExpanded(true);
    setMobileOpen(true);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, []);

  const closeMobile = useCallback((restoreFocus = true) => {
    setMobileOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobile();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center gap-2 border-b border-rail-line bg-rail px-3 md:hidden">
        <button ref={menuButtonRef} type="button" onClick={openMobile} aria-label="Open navigation" aria-expanded={mobileOpen} className="grid h-10 w-10 place-items-center rounded-xl text-rail-ink hover:bg-rail-active">
          <span aria-hidden className="space-y-1"><span className="block h-px w-4 bg-current"/><span className="block h-px w-4 bg-current"/><span className="block h-px w-4 bg-current"/></span>
        </button>
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="ThoughtDrop home">
          <ThoughtdropMark className="h-8 w-8 shrink-0 text-rail-ink" />
          <span className="truncate text-[14px] font-semibold tracking-[-0.02em] text-rail-ink">ThoughtDrop</span>
        </Link>
        <button type="button" onClick={openCreate} className="ml-auto flex h-9 items-center gap-2 rounded-xl bg-amber px-3 text-[12px] font-semibold text-on-amber shadow-sm">
          <PlusIcon />Capture
        </button>
      </header>

      {mobileOpen && <button type="button" aria-label="Dismiss navigation" onClick={() => closeMobile()} className="fixed inset-0 z-40 bg-scrim md:hidden" />}

      <aside aria-label="Application navigation" className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(86vw,300px)] shrink-0 flex-col border-r border-rail-line bg-rail p-3 transition-[transform,width] duration-200 md:sticky md:top-0 md:z-20 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${expanded ? "md:w-[240px]" : "md:w-[68px]"}`}>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" onClick={() => closeMobile(false)} title="ThoughtDrop home" aria-label="ThoughtDrop home" className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-rail-line bg-rail-active text-rail-ink shadow-sm transition-transform hover:scale-[1.03]">
          <ThoughtdropMark className="h-[34px] w-[34px]" />
        </Link>
        {expanded && <span className="mr-auto ml-3 text-[14px] font-semibold tracking-[-0.02em] text-rail-ink">ThoughtDrop</span>}
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Collapse navigation" : "Expand navigation"} title={expanded ? "Collapse navigation" : "Expand navigation"} className="hidden h-8 w-8 place-items-center rounded-md text-rail-muted hover:bg-rail-active hover:text-rail-ink md:grid"><span aria-hidden className="text-base leading-none">{expanded ? "‹" : "›"}</span></button>
        <button ref={closeButtonRef} type="button" onClick={() => closeMobile()} aria-label="Close navigation" className="grid h-9 w-9 place-items-center rounded-lg text-xl text-rail-muted hover:bg-rail-active hover:text-rail-ink md:hidden"><span aria-hidden>×</span></button>
      </div>

      <button type="button" onClick={() => { closeMobile(false); openCreate(); }} aria-label="Capture" title={expanded ? undefined : "Capture a thought"} className={`mb-5 flex h-10 items-center rounded-lg border border-amber bg-amber text-[13px] font-semibold text-on-amber transition-colors hover:bg-amber-hover ${expanded ? "px-[11px]" : "justify-center"}`}>
        <PlusIcon />
        {expanded && <><span className="ml-3">Capture</span><span className="ml-auto font-mono text-[10px] font-normal opacity-75">⌘K</span></>}
      </button>

      <nav className="space-y-1" aria-label="Primary navigation" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) closeMobile(false); }}>
        <RailLink href="/" active={pathname === "/"} expanded={expanded} label="Today" icon={<TodayIcon />} />
        <RailLink href="/inbox" active={pathname.startsWith("/inbox")} expanded={expanded} label="Inbox" icon={<InboxIcon />} badge={untriagedCount} />
        <RailLink href="/tasks" active={pathname.startsWith("/tasks")} expanded={expanded} label="Tasks" icon={<TaskIcon />} />
        <PagesSection pages={pages} pathname={pathname} expanded={expanded} open={pagesOpen} onToggle={() => setPagesOpen((value) => !value)} />
      </nav>

      <div className="mt-auto space-y-1 border-t border-rail-line pt-3">
        <ThemeToggle compact={!expanded} />
        <form action={logout}>
          <button type="submit" title={expanded ? undefined : "Sign out"} className={`flex h-9 w-full items-center rounded-lg px-[11px] text-[12px] text-rail-muted hover:bg-rail-active hover:text-rail-ink ${expanded ? "" : "justify-center"}`}><span aria-hidden className="text-base">↗</span>{expanded && <span className="ml-3">Sign out</span>}</button>
        </form>
      </div>
      </aside>
    </>
  );
}
