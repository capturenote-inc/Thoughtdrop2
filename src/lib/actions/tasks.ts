"use server";

import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/actions/authenticated-action";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { isTaskDate, isTaskPriority, isTaskStatus, type TaskPriority, type TaskStatus } from "@/lib/tasks";

export type TaskActionResult = { ok: true } | { ok: false; error: string };

export interface CreateTaskInput {
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  dueDate?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

function validateDueDate(value: string | null | undefined): string | null | undefined {
  if (value === undefined || value === null || value === "") return value;
  return isTaskDate(value) ? value : undefined;
}

export const createTask = authenticatedAction(async ({ supabase }, input: CreateTaskInput): Promise<TaskActionResult> => {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "A task needs a title." };
  if (!isTaskPriority(input.priority)) return { ok: false, error: "Choose a valid priority." };

  const dueDate = validateDueDate(input.dueDate);
  if (dueDate === undefined) return { ok: false, error: "Choose a valid due date." };

  const workspaceId = await getCurrentWorkspaceId(supabase);
  const { error } = await supabase.from("tasks").insert({
    workspace_id: workspaceId,
    title,
    due_date: dueDate || null,
    priority: input.priority,
    status: "todo",
  });
  if (error) throw error;

  revalidatePath("/", "layout");
  return { ok: true };
});

export const updateTask = authenticatedAction(async ({ supabase }, taskId: string, input: UpdateTaskInput): Promise<TaskActionResult> => {
  const update: { title?: string; due_date?: string | null; priority?: TaskPriority; status?: TaskStatus } = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) return { ok: false, error: "A task needs a title." };
    update.title = title;
  }
  if (input.priority !== undefined) {
    if (!isTaskPriority(input.priority)) return { ok: false, error: "Choose a valid priority." };
    update.priority = input.priority;
  }
  if (input.status !== undefined) {
    if (!isTaskStatus(input.status)) return { ok: false, error: "Choose a valid status." };
    update.status = input.status;
  }
  if (input.dueDate !== undefined) {
    const dueDate = validateDueDate(input.dueDate);
    if (dueDate === undefined) return { ok: false, error: "Choose a valid due date." };
    update.due_date = dueDate || null;
  }
  if (Object.keys(update).length === 0) return { ok: true };

  const { data, error } = await supabase.from("tasks").update(update).eq("id", taskId).is("deleted_at", null).select("id").maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, error: "Task not found." };

  revalidatePath("/", "layout");
  return { ok: true };
});

export const deleteTask = authenticatedAction(async ({ supabase }, taskId: string): Promise<TaskActionResult> => {
  const { data, error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, error: "Task not found." };

  revalidatePath("/", "layout");
  return { ok: true };
});

export const restoreTask = authenticatedAction(async ({ supabase }, taskId: string): Promise<TaskActionResult> => {
  const { data, error } = await supabase
    .from("tasks")
    .update({ deleted_at: null })
    .eq("id", taskId)
    .not("deleted_at", "is", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, error: "Task could not be restored." };

  revalidatePath("/", "layout");
  return { ok: true };
});
