import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { InboxList } from "@/components/InboxList";

export default async function Inbox() {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { data: notes } = await supabase
    .from("notes")
    .select("id, body, created_at, routing_tag, routing_unmatched")
    .eq("workspace_id", workspaceId)
    .is("page_id", null)
    .order("created_at", { ascending: false });

  const count = notes?.length ?? 0;

  return (
    <div>
      <div className="flex items-baseline gap-3 px-10 pb-2 pt-9">
        <h1 className="m-0 text-[26px] font-semibold tracking-[-0.02em] text-ink">Inbox</h1>
        <span className="font-mono text-[12px] text-ink-faint">{count} untriaged</span>
      </div>
      <InboxList notes={notes ?? []} />
    </div>
  );
}
