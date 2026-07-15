import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { formatRelativeTime } from "@/lib/format";
import { PAGE_COLORS, resolvePageColor } from "@/lib/page-colors";
import { TodayCapture } from "@/components/TodayCapture";

function notePreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length > 110 ? `${normalized.slice(0, 107)}…` : normalized;
}

function dueLabel(dueDate: string | null) {
  if (!dueDate) return "No due date";
  const due = new Date(`${dueDate}T00:00:00`);
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function Today() {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const [{ data: pages }, { data: recentNotes }, { data: openTasks }, { count: inboxCount }] = await Promise.all([
    supabase.from("pages").select("id, tag, title, color, pinned_at").eq("workspace_id", workspaceId).order("title"),
    supabase.from("notes").select("id, body, created_at, page_id").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(5),
    supabase.from("tasks").select("id, title, due_date, priority").eq("workspace_id", workspaceId).neq("status", "done").order("due_date", { ascending: true, nullsFirst: false }).limit(4),
    supabase.from("notes").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("page_id", null),
  ]);

  const pageById = new Map((pages ?? []).map((page) => [page.id, page]));
  const pinnedPages = (pages ?? []).filter((page) => page.pinned_at).sort((a, b) => (a.pinned_at as string).localeCompare(b.pinned_at as string));
  const date = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="mx-auto max-w-[1240px] px-8 pb-20 pt-12 lg:px-12">
      <div className="mb-8 flex items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-ink">{date}</p>
          <h1 className="m-0 text-[42px] font-semibold tracking-[-0.05em] text-ink">Today</h1>
        </div>
        <p className="hidden max-w-64 text-right text-[13px] leading-5 text-ink-faint md:block">A quiet place to capture what matters and see what needs your attention.</p>
      </div>

      <TodayCapture />

      <div className="mt-11 grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-ink">Momentum</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-ink">Recently captured</h2></div>
            {recentNotes && recentNotes.length > 0 && <span className="font-mono text-[11px] text-ink-faint">latest 5</span>}
          </div>
          <div>
            {recentNotes?.length ? recentNotes.map((note) => {
              const page = note.page_id ? pageById.get(note.page_id) : undefined;
              const palette = page ? PAGE_COLORS[resolvePageColor(page.color)] : null;
              return (
                <Link key={note.id} href={page ? `/pages/${page.tag}` : "/inbox"} className="group flex gap-4 border-t border-border py-4 last:border-b hover:border-ink-ghost">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: palette?.ink ?? "var(--color-amber)" }} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[14px] leading-6 text-ink-body group-hover:text-ink">{notePreview(note.body)}</span><span className="mt-1 block text-[11px] text-ink-faint">{page ? `#${page.tag} · ${page.title}` : "Inbox"}</span></span>
                  <span className="mt-1 shrink-0 font-mono text-[10.5px] text-ink-faint">{formatRelativeTime(note.created_at)}</span>
                </Link>
              );
            }) : <div className="border-y border-border py-9"><p className="text-[15px] font-medium text-ink">Your first thought starts here.</p><p className="mt-1 text-[13px] text-ink-faint">Capture freely. A matching hashtag handles the filing.</p></div>}
          </div>
        </section>

        <div className="space-y-11">
          <section>
            <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-ink">Now</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-ink">Needs attention</h2></div><Link href="/inbox" className="text-[12px] text-ink-secondary hover:text-ink">Open Inbox</Link></div>
            <Link href="/inbox" className="flex items-center gap-3 border-y border-border py-4 hover:border-ink-ghost"><span className="grid h-8 min-w-8 place-items-center rounded-full bg-amber-tint font-mono text-[11px] text-amber-ink">{inboxCount ?? 0}</span><span><span className="block text-[13px] font-medium text-ink">Inbox to triage</span><span className="text-[12px] text-ink-faint">Unmatched and untagged thoughts</span></span></Link>
            <div className="pt-2">
              {openTasks?.length ? openTasks.map((task) => <div key={task.id} className="flex items-center gap-3 border-b border-border-soft py-3 text-[13px]"><span className="h-3.5 w-3.5 rounded-full border border-ink-ghost"/><span className="min-w-0 flex-1 truncate text-ink-body">{task.title}</span><span className="shrink-0 text-[11px] text-ink-faint">{dueLabel(task.due_date)}</span></div>) : <p className="py-3 text-[12px] text-ink-faint">No open tasks yet.</p>}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-ink">Your places</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-ink">Pinned pages</h2></div><Link href="/pages" className="text-[12px] text-ink-secondary hover:text-ink">All pages</Link></div>
            <div className="border-t border-border">
              {pinnedPages.length ? pinnedPages.map((page) => { const palette = PAGE_COLORS[resolvePageColor(page.color)]; return <Link key={page.id} href={`/pages/${page.tag}`} className="flex items-center gap-3 border-b border-border py-3.5 hover:border-ink-ghost"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette.ink }} /><span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{page.title}</span><span className="font-mono text-[10px]" style={{ color: palette.ink }}>#{page.tag}</span></Link>; }) : <p className="border-b border-border py-5 text-[12px] text-ink-faint">Pin the pages you return to most.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
