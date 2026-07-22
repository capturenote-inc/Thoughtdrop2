import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageDirectory } from "@/components/PageDirectory";

export default async function PagesDirectory({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: createNew } = await searchParams;
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const [{ data: pages }, { data: notes }] = await Promise.all([
    supabase
      .from("pages")
      .select("id, tag, title, parent_id, depth, color, pinned_at, archived_at")
      .eq("workspace_id", workspaceId),
    supabase.from("notes").select("page_id").eq("workspace_id", workspaceId).is("deleted_at", null).not("page_id", "is", null),
  ]);

  const noteCounts: Record<string, number> = {};
  for (const note of notes ?? []) {
    if (note.page_id) noteCounts[note.page_id] = (noteCounts[note.page_id] ?? 0) + 1;
  }

  const activePages = (pages ?? []).filter((page) => !page.archived_at);
  const archivedPages = (pages ?? []).filter((page) => page.archived_at);

  return <PageDirectory pages={activePages} archivedPages={archivedPages} noteCounts={noteCounts} autoOpenCreate={createNew === "1"} />;
}
