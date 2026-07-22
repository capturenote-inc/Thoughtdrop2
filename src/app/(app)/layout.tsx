import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { CaptureModalProvider } from "@/components/CaptureModalProvider";
import { TopBar } from "@/components/TopBar";
import { MutationFeedbackProvider } from "@/components/MutationFeedbackProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const [{ data: pages }, { count: untriagedCount }] = await Promise.all([
    supabase
      .from("pages")
      .select("id, tag, title, parent_id, depth, color, pinned_at")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("title"),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .is("page_id", null),
  ]);

  return (
    <MutationFeedbackProvider>
      <CaptureModalProvider pages={pages ?? []}>
        <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-bg md:flex-row">
          <TopBar untriagedCount={untriagedCount ?? 0} pages={pages ?? []} />
          <main className="w-full min-w-0 flex-1 bg-bg">{children}</main>
        </div>
      </CaptureModalProvider>
    </MutationFeedbackProvider>
  );
}
