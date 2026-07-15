import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/PageHeader";
import { NotesDrawer } from "@/components/NotesDrawer";
import { resolvePageColor } from "@/lib/page-colors";

export default async function PageView({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { data: page } = await supabase
    .from("pages")
    .select("id, tag, title, parent_id, color, pinned_at")
    .eq("workspace_id", workspaceId)
    .eq("tag", tag)
    .maybeSingle();

  if (!page) notFound();

  const [{ data: parent }, { data: notes }] = await Promise.all([
    page.parent_id
      ? supabase.from("pages").select("title").eq("id", page.parent_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("notes")
      .select("id, body, created_at")
      .eq("page_id", page.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader
        pageId={page.id}
        tag={page.tag}
        title={page.title}
        color={page.color}
        pinned={Boolean(page.pinned_at)}
        parentTitle={parent?.title ?? null}
      />

      <NotesDrawer notes={notes ?? []} pageTag={page.tag} pageColor={resolvePageColor(page.color)} />

      <div className="px-10 pb-12 pt-7 text-[11.5px] text-ink-faint">Columns and blocks — Phase 3.</div>
    </div>
  );
}
