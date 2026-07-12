import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { TagPill } from "@/components/TagPill";
import { NotesDrawer } from "@/components/NotesDrawer";

export default async function PageView({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { data: page } = await supabase
    .from("pages")
    .select("id, tag, title, parent_id")
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
      <div className="flex items-baseline gap-3.5 px-10 pt-9">
        {parent && <span className="text-[12px] text-ink-faint">{parent.title} /</span>}
        <h1 className="m-0 text-[26px] font-semibold tracking-[-0.02em] text-ink">{page.title}</h1>
        <TagPill tag={page.tag} className="px-[9px] py-[2px] text-[12px]" />
      </div>

      <NotesDrawer notes={notes ?? []} />

      <div className="px-10 pb-12 pt-7 text-[11.5px] text-ink-faint">Columns and blocks — Phase 3.</div>
    </div>
  );
}
