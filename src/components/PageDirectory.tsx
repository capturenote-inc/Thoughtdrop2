"use client";

import { useState } from "react";
import Link from "next/link";
import { buildPageTree, type PageRow, type PageTreeNode } from "@/lib/page-tree";
import { createPage, type CreatePageFieldErrors } from "@/lib/actions/pages";
import { isValidTag, normalizeTagInput, TAG_DUPLICATE_ERROR, TAG_FORMAT_ERROR, TAG_FORMAT_HELP } from "@/lib/tag-normalize";
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
  const [tagInput, setTagInput] = useState("");
  const [parentId, setParentId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CreatePageFieldErrors>({});
  const [saving, setSaving] = useState(false);

  const tree = buildPageTree(pages);
  const eligibleParents = pages.filter((p) => p.depth < 2);

  const normalizedTag = normalizeTagInput(tagInput);
  const tagFormatValid = normalizedTag.length > 0 && isValidTag(normalizedTag);
  const tagTaken = tagFormatValid && pages.some((p) => p.tag === normalizedTag);
  const clientTagError = tagInput.trim()
    ? !tagFormatValid
      ? TAG_FORMAT_ERROR
      : tagTaken
        ? TAG_DUPLICATE_ERROR
        : undefined
    : undefined;
  const tagError = fieldErrors.tag ?? clientTagError;

  const canSubmit = title.trim().length > 0 && tagFormatValid && !tagTaken && !saving;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setFieldErrors({});
    setSaving(true);
    try {
      const result = await createPage({ tag: tagInput, title, parentId: parentId || null });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors);
        return;
      }
      setTitle("");
      setTagInput("");
      setParentId("");
      setCreating(false);
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
            <label className="text-[11.5px] text-ink-faint">Title *</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              required
              className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-ink outline-none"
            />
            {fieldErrors.title && <p className="text-[11.5px] text-red-600">{fieldErrors.title}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11.5px] text-ink-faint">Tag *</label>
            <div className="flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, tag: undefined }));
                }}
                required
                placeholder="marketing"
                className="flex-1 rounded-md border border-border bg-bg px-2.5 py-1.5 font-mono text-ink outline-none"
              />
              {normalizedTag && (
                <TagPill tag={normalizedTag} unmatched={!tagFormatValid} className="px-[7px] py-[1px] text-[11px]" />
              )}
            </div>
            <p className={`text-[11.5px] ${tagError ? "text-red-600" : "text-ink-faint"}`}>
              {tagError ?? TAG_FORMAT_HELP}
            </p>
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
              disabled={!canSubmit}
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
