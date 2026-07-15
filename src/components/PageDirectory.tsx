"use client";

import { useState } from "react";
import { buildPageTree, type PageRow, type PageTreeNode } from "@/lib/page-tree";
import { createPage, type CreatePageFieldErrors } from "@/lib/actions/pages";
import { isValidTag, normalizeTagInput, TAG_DUPLICATE_ERROR, TAG_FORMAT_ERROR, TAG_FORMAT_HELP } from "@/lib/tag-normalize";
import { DEFAULT_PAGE_COLOR, PAGE_COLORS, resolvePageColor, type PageColorKey } from "@/lib/page-colors";
import { TagPill } from "@/components/TagPill";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import Link from "next/link";

function ShelfRow({ node, noteCounts }: { node: PageTreeNode; noteCounts: Record<string, number> }) {
  return (
    <>
      <Link
        href={`/pages/${node.tag}`}
        className="flex items-center gap-2.5 border-b border-border-soft py-[7px] text-[13px] text-ink hover:text-ink"
        style={{ paddingLeft: `${(node.depth - 1) * 16}px` }}
      >
        <span className={node.depth > 1 ? "text-ink-body" : undefined}>{node.title}</span>
        <div className="flex-1" />
        <span className="font-mono text-[10.5px] text-ink-faint">{noteCounts[node.id] ?? 0}</span>
      </Link>
      {node.children.map((child) => (
        <ShelfRow key={child.id} node={child} noteCounts={noteCounts} />
      ))}
    </>
  );
}

function Shelf({ node, noteCounts }: { node: PageTreeNode; noteCounts: Record<string, number> }) {
  const palette = PAGE_COLORS[resolvePageColor(node.color)];
  return (
    <div className="overflow-hidden rounded-[10px] border border-border">
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5"
        style={{ backgroundColor: palette.tint, color: palette.ink }}
      >
        <Link href={`/pages/${node.tag}`} className="text-[13.5px] font-semibold">
          {node.title}
        </Link>
        <span className="font-mono text-[11px] opacity-75">#{node.tag}</span>
        <div className="flex-1" />
        <span className="font-mono text-[10.5px] opacity-75">{noteCounts[node.id] ?? 0}</span>
      </div>
      <div className="px-3.5 pb-2.5 pt-1">
        {node.children.length === 0 ? (
          <p className="py-[7px] text-[13px] text-ink-faint">No sub-pages.</p>
        ) : (
          node.children.map((child) => <ShelfRow key={child.id} node={child} noteCounts={noteCounts} />)
        )}
      </div>
    </div>
  );
}

export function PageDirectory({ pages, noteCounts }: { pages: PageRow[]; noteCounts: Record<string, number> }) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [parentId, setParentId] = useState("");
  const [color, setColor] = useState<PageColorKey>(DEFAULT_PAGE_COLOR);
  const [fieldErrors, setFieldErrors] = useState<CreatePageFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
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
    setFormError(null);
    setSaving(true);
    try {
      const result = await createPage({ tag: tagInput, title, parentId: parentId || null, color });
      if (!result.ok) {
        if ("fieldErrors" in result) {
          setFieldErrors(result.fieldErrors);
        } else {
          setFormError(result.error);
        }
        return;
      }
      setTitle("");
      setTagInput("");
      setParentId("");
      setColor(DEFAULT_PAGE_COLOR);
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-10 pb-16 pt-9">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="m-0 text-[26px] font-semibold tracking-[-0.02em] text-ink">Pages</h1>
          <span className="font-mono text-[12px] text-ink-faint">{pages.length} pages</span>
        </div>
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
                <TagPill tag={normalizedTag} unmatched={!tagFormatValid} color={color} className="px-[7px] py-[1px] text-[11px]" />
              )}
            </div>
            <p className={`text-[11.5px] ${tagError ? "text-red-600" : "text-ink-faint"}`}>
              {tagError ?? TAG_FORMAT_HELP}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11.5px] text-ink-faint">Color</label>
            <ColorSwatchPicker value={color} onChange={setColor} />
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
          {formError && <p className="text-[11.5px] text-red-600">{formError}</p>}
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

      <div className="mt-5 grid grid-cols-2 items-start gap-4 min-[1280px]:grid-cols-3">
        {tree.length === 0 ? (
          <p className="text-[13px] text-ink-faint">No pages yet.</p>
        ) : (
          tree.map((node) => <Shelf key={node.id} node={node} noteCounts={noteCounts} />)
        )}
      </div>
    </div>
  );
}
