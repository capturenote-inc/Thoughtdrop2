import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { TaskList } from "@/components/TaskList";

export default async function Tasks() {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, status")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  const openCount = (tasks ?? []).filter((task) => task.status !== "done").length;

  return (
    <div className="pt-12">
      <div className="mx-auto flex max-w-[1240px] items-end gap-4 px-8 lg:px-12">
        <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-ink">Focus</p><h1 className="m-0 text-[40px] font-semibold tracking-[-0.045em] text-ink">Tasks</h1></div>
        <span className="mb-1.5 font-mono text-[12px] text-ink-faint">{openCount} open</span>
      </div>
      <TaskList tasks={tasks ?? []} />
    </div>
  );
}
