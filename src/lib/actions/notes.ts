"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { routeNote } from "@/lib/routing-service";

export async function createNote(body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const { data: note, error } = await supabase
    .from("notes")
    .insert({ workspace_id: workspaceId, body: trimmed })
    .select("id, workspace_id, body, page_id, routing_tag, routing_unmatched")
    .single();

  if (error) throw error;

  await routeNote(supabase, note);
  revalidatePath("/", "layout");
}

export async function updateNote(noteId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("notes")
    .select("id, workspace_id, page_id, routing_tag, routing_unmatched")
    .eq("id", noteId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase.from("notes").update({ body: trimmed }).eq("id", noteId);
  if (updateError) throw updateError;

  await routeNote(supabase, { ...current, body: trimmed });
  revalidatePath("/", "layout");
}

export async function deleteNote(noteId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", noteId);
  if (error) throw error;
  revalidatePath("/", "layout");
}
