import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { InboxList } from "@/components/InboxList";

export default async function Inbox() {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { data: notes } = await supabase
    .from("notes")
    .select("id, body, created_at, pinned_at, routing_tag, routing_unmatched")
    .eq("workspace_id", workspaceId)
    .is("page_id", null)
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const count = notes?.length ?? 0;

  return (
    <div className="pt-10">
      <div className="mx-auto flex max-w-[1080px] items-end gap-4 px-6 lg:px-10">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-ink">Triage</p>
          <h1 className="m-0 text-[40px] font-semibold tracking-[-0.04em] text-ink">Inbox</h1>
        </div>
        <span className="mb-1.5 font-mono text-[12px] text-ink-faint">{count} untriaged</span>
      </div>
      <InboxList notes={notes ?? []} />
    </div>
  );
}
