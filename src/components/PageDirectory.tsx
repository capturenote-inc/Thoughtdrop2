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
        className="group flex items-center gap-3 border-t border-border-soft py-3 text-[13.5px] text-ink-body hover:text-ink"
        style={{ paddingLeft: `${Math.max(node.depth - 1, 0) * 20}px` }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ink-ghost transition-colors group-hover:bg-amber" />
        <span>{node.title}</span>
        <TagPill tag={node.tag} color={node.color} className="px-1.5 py-0.5 text-[9.5px]" />
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
    <section className="border-t border-border pt-5">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.ink }} />
        <Link href={`/pages/${node.tag}`} className="text-[18px] font-semibold tracking-[-0.02em] text-ink hover:text-amber-ink">
          {node.title}
        </Link>
        <TagPill tag={node.tag} color={node.color} className="px-2 py-0.5 text-[10px]" />
        <div className="flex-1" />
        <span className="font-mono text-[11px] text-ink-faint">{noteCounts[node.id] ?? 0} notes</span>
      </div>
      {node.children.length > 0 && (
        <div className="ml-1 mt-4 border-l border-border pl-5">
          {node.children.map((child) => <ShelfRow key={child.id} node={child} noteCounts={noteCounts} />)}
        </div>
      )}
    </section>
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
    <div className="mx-auto max-w-[1240px] px-8 pb-20 pt-12 lg:px-12">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-ink">Your spaces</p>
          <div className="flex items-baseline gap-3">
            <h1 className="m-0 text-[40px] font-semibold tracking-[-0.045em] text-ink">Pages</h1>
            <span className="font-mono text-[12px] text-ink-faint">{pages.length}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="flex h-9 items-center rounded-xl bg-ink px-4 text-[12.5px] font-medium text-bg hover:bg-ink-body"
        >
          <span className="mr-2 text-lg font-normal leading-none">+</span> New page
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="mt-8 max-w-2xl border-y border-border-modal bg-bg-modal px-5 py-6 text-[13px] shadow-[0_12px_30px_rgb(23_23_19_/_0.04)]"
        >
          <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Title</label>
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Routing tag</label>
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
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Color</label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Parent</label>
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
          </div>
          {formError && <p className="text-[11.5px] text-red-600">{formError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex h-8 items-center rounded-lg border border-border px-3 text-[12px] text-ink-secondary hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-8 items-center rounded-lg bg-amber px-3.5 text-[12px] font-semibold text-on-amber hover:bg-amber-hover disabled:opacity-60"
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div className="mt-10 max-w-4xl">
        {tree.length === 0 ? (
          <div className="border-y border-border py-12"><p className="text-[17px] font-medium text-ink">Start with a space you return to.</p><p className="mt-1 text-[14px] text-ink-faint">A page owns a hashtag. Thoughts route there automatically.</p></div>
        ) : (
          tree.map((node) => <Shelf key={node.id} node={node} noteCounts={noteCounts} />)
        )}
      </div>
    </div>
  );
}
