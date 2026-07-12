import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageDirectory } from "@/components/PageDirectory";

export default async function PagesDirectory() {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { data: pages } = await supabase
    .from("pages")
    .select("id, tag, title, parent_id, depth")
    .eq("workspace_id", workspaceId);

  return <PageDirectory pages={pages ?? []} />;
}
