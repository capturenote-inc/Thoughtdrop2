import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { CaptureModalProvider } from "@/components/CaptureModalProvider";
import { TopBar } from "@/components/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const [{ data: pages }, { count: untriagedCount }] = await Promise.all([
    supabase
      .from("pages")
      .select("id, tag, title, parent_id, depth, color, pinned_at")
      .eq("workspace_id", workspaceId)
      .order("title"),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("page_id", null),
  ]);

  const pinnedPages = (pages ?? [])
    .filter((p) => p.pinned_at)
    .sort((a, b) => (a.pinned_at as string).localeCompare(b.pinned_at as string));

  return (
    <CaptureModalProvider pages={pages ?? []}>
      <TopBar untriagedCount={untriagedCount ?? 0} pinnedPages={pinnedPages} />
      <main className="flex flex-1 flex-col">{children}</main>
    </CaptureModalProvider>
  );
}
