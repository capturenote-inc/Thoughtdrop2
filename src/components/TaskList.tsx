"use client";

import { useState, useTransition } from "react";
import { createTask, deleteTask, updateTask } from "@/lib/actions/tasks";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/lib/tasks";

export interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

const STATUS_LABELS: Record<TaskStatus, string> = { todo: "To do", doing: "In progress", done: "Done" };
const PRIORITY_LABELS: Record<TaskPriority, string> = { low: "Low", medium: "Medium", high: "High" };

function TaskItem({ task, onError }: { task: TaskRow; onError: (message: string) => void }) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(task.title);

  function save(input: Parameters<typeof updateTask>[1]) {
    startTransition(async () => {
      const result = await updateTask(task.id, input);
      if (!result.ok) onError(result.error);
    });
  }

  function saveTitle() {
    if (title === task.title) return;
    save({ title });
  }

  return (
    <div className="group flex items-start gap-3 border-b border-border-soft py-3.5 last:border-b-0">
      <button type="button" onClick={() => save({ status: task.status === "done" ? "todo" : "done" })} disabled={pending} title={task.status === "done" ? "Mark to do" : "Mark done"} aria-label={task.status === "done" ? "Mark task to do" : "Mark task done"} className={`mt-1 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition ${task.status === "done" ? "border-amber bg-amber text-on-amber" : "border-ink-ghost hover:border-amber"}`}>
        {task.status === "done" && <span aria-hidden className="text-[11px]">✓</span>}
      </button>
      <div className="min-w-0 flex-1">
        <input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} aria-label="Task title" disabled={pending} className={`w-full bg-transparent text-[14px] outline-none ${task.status === "done" ? "text-ink-faint line-through" : "text-ink-body"}`} />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
          <select value={task.status} onChange={(event) => save({ status: event.target.value as TaskStatus })} disabled={pending} aria-label="Task status" className="cursor-pointer appearance-none bg-transparent pr-1 text-[11px] text-ink-secondary outline-none">
            {TASK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
          <span className="text-border-modal">·</span>
          <select value={task.priority} onChange={(event) => save({ priority: event.target.value as TaskPriority })} disabled={pending} aria-label="Task priority" className="cursor-pointer appearance-none bg-transparent pr-1 text-[11px] text-ink-secondary outline-none">
            {TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}
          </select>
          <span className="text-border-modal">·</span>
          <input type="date" value={task.due_date ?? ""} onChange={(event) => save({ dueDate: event.target.value || null })} disabled={pending} aria-label="Task due date" className="bg-transparent text-[11px] text-ink-secondary outline-none" />
        </div>
      </div>
      <button type="button" onClick={() => startTransition(async () => { const result = await deleteTask(task.id); if (!result.ok) onError(result.error); })} disabled={pending} className="mt-0.5 text-[12px] text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-red-600 focus:opacity-100 disabled:opacity-50">Delete</button>
    </div>
  );
}

export function TaskList({ tasks }: { tasks: TaskRow[] }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [creating, startCreating] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    startCreating(async () => {
      setError(null);
      const result = await createTask({ title, priority, dueDate: dueDate || null });
      if (!result.ok) { setError(result.error); return; }
      setTitle("");
      setDueDate("");
      setPriority("medium");
    });
  }

  const groups = TASK_STATUSES.map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) }));

  return (
    <div className="mx-auto max-w-[1240px] px-8 pb-20 lg:px-12">
      <div className="rounded-[18px] border border-border-modal bg-bg-modal p-4 shadow-[0_12px_32px_rgb(23_23_19_/_0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") create(); }} placeholder="Add a task…" aria-label="New task title" disabled={creating} className="h-10 min-w-0 flex-1 bg-transparent px-2 text-[15px] text-ink outline-none placeholder:text-ink-ghost" />
          <div className="flex items-center gap-2">
            <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} aria-label="New task priority" className="h-8 rounded-lg border border-border bg-bg px-2 text-[11px] text-ink-secondary outline-none"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="New task due date" className="h-8 rounded-lg border border-border bg-bg px-2 text-[11px] text-ink-secondary outline-none" />
            <button type="button" onClick={create} disabled={!title.trim() || creating} className="h-8 rounded-lg bg-ink px-3 text-[12px] font-semibold text-bg hover:bg-ink-body disabled:opacity-50">Add</button>
          </div>
        </div>
        {error && <p className="px-2 pt-2 text-[11.5px] text-red-600">{error}</p>}
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-3">
        {groups.map(({ status, tasks: groupedTasks }) => (
          <section key={status}>
            <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber"/><h2 className="text-[13px] font-semibold text-ink">{STATUS_LABELS[status]}</h2><span className="font-mono text-[10.5px] text-ink-faint">{groupedTasks.length}</span></div>
            <div className="border-t border-border">
              {groupedTasks.length ? groupedTasks.map((task) => <TaskItem key={task.id} task={task} onError={setError} />) : <p className="border-b border-border py-5 text-[12px] text-ink-faint">Nothing here yet.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
