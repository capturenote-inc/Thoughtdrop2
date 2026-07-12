"use client";

import { useState } from "react";
import Link from "next/link";
import { buildPageTree, type PageRow, type PageTreeNode } from "@/lib/page-tree";
import { createPage } from "@/lib/actions/pages";
import { TagPill } from "@/components/TagPill";

function TreeRow({ node }: { node: PageTreeNode }) {
  return (
    <div>
      <Link
        href={`/pages/${node.tag}`}
        className="flex items-center gap-2.5 border-t border-border-soft py-2 text-[13px] text-ink hover:bg-bg-suggestion"
        style={{ paddingLeft: `${19 + node.depth * 20}px` }}
      >
        <span>{node.title}</span>
        <TagPill tag={node.tag} className="px-[7px] py-[1px] text-[11px]" />
      </Link>
      {node.children.map((child) => (
        <TreeRow key={child.id} node={child} />
      ))}
    </div>
  );
}

export function PageDirectory({ pages }: { pages: PageRow[] }) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tree = buildPageTree(pages);
  const eligibleParents = pages.filter((p) => p.depth < 2);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createPage({ tag, title, parentId: parentId || null });
      setTitle("");
      setTag("");
      setParentId("");
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create page");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-10 pb-16 pt-9">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="m-0 text-[26px] font-semibold tracking-[-0.02em] text-ink">Pages</h1>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="flex h-7 items-center rounded-md border border-border px-3 text-[12px] text-ink-secondary hover:border-ink-ghost hover:text-ink"
        >
          + New page
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="mt-4 flex flex-col gap-3 rounded-[10px] border border-border-modal bg-bg-modal p-4 text-[13px]"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[11.5px] text-ink-faint">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-ink outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11.5px] text-ink-faint">Tag</label>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value.toLowerCase())}
              required
              placeholder="marketing"
              pattern="[a-z][a-z0-9_-]{0,63}"
              className="rounded-md border border-border bg-bg px-2.5 py-1.5 font-mono text-ink outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11.5px] text-ink-faint">Parent (optional, 3-level limit)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-ink outline-none"
            >
              <option value="">None (top level)</option>
              {eligibleParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-[11.5px] text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex h-7 items-center rounded-md border border-border px-3 text-[12px] text-ink-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-7 items-center rounded-md bg-amber px-3 text-[12px] font-semibold text-on-amber disabled:opacity-60"
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 border-t border-border">
        {tree.length === 0 ? (
          <p className="border-t border-border-soft py-4 text-[13px] text-ink-faint">No pages yet.</p>
        ) : (
          tree.map((node) => <TreeRow key={node.id} node={node} />)
        )}
      </div>
    </div>
  );
}
