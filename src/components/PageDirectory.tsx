"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildPageTree, type PageRow, type PageTreeNode } from "@/lib/page-tree";
import { createPage, restorePage, type CreatePageFieldErrors } from "@/lib/actions/pages";
import { isValidTag, normalizeTagInput, suggestTagFromTitle, TAG_DUPLICATE_ERROR, TAG_FORMAT_ERROR, TAG_FORMAT_HELP } from "@/lib/tag-normalize";
import { DEFAULT_PAGE_COLOR, PAGE_COLORS, resolvePageColor, type PageColorKey } from "@/lib/page-colors";
import { TagPill } from "@/components/TagPill";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import Link from "next/link";
import { actionErrorMessage } from "@/lib/action-error";
import { useMutationFeedback } from "@/lib/mutation-feedback-context";

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

export function PageDirectory({ pages, archivedPages, noteCounts, autoOpenCreate = false }: { pages: PageRow[]; archivedPages: PageRow[]; noteCounts: Record<string, number>; autoOpenCreate?: boolean }) {
  const router = useRouter();
  const { showFeedback } = useMutationFeedback();
  const [creating, setCreating] = useState(autoOpenCreate);
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagTouched, setTagTouched] = useState(false);
  const [parentId, setParentId] = useState("");
  const [color, setColor] = useState<PageColorKey>(DEFAULT_PAGE_COLOR);
  const [fieldErrors, setFieldErrors] = useState<CreatePageFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLSelectElement>(null);

  const tree = buildPageTree(pages);
  const eligibleParents = pages.filter((p) => p.depth < 2);
  const allPages = [...pages, ...archivedPages];
  const allById = new Map(allPages.map((page) => [page.id, page]));
  const archivedRoots = archivedPages.filter((page) => {
    const parent = page.parent_id ? allById.get(page.parent_id) : undefined;
    return !parent?.archived_at || parent.archived_at !== page.archived_at;
  });

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors: CreatePageFieldErrors = {};
    if (!title.trim()) clientErrors.title = "Add a page title.";
    if (!tagInput.trim()) clientErrors.tag = "Add a routing tag. A suggestion appears when you enter a title.";
    else if (!tagFormatValid) clientErrors.tag = TAG_FORMAT_ERROR;
    else if (tagTaken) clientErrors.tag = TAG_DUPLICATE_ERROR;
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      requestAnimationFrame(() => {
        if (clientErrors.title) titleRef.current?.focus();
        else if (clientErrors.tag) tagRef.current?.focus();
      });
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSaving(true);
    try {
      const result = await createPage({ tag: tagInput, title, parentId: parentId || null, color });
      if (!result.ok) {
        if ("fieldErrors" in result) {
          setFieldErrors(result.fieldErrors);
          requestAnimationFrame(() => {
            if (result.fieldErrors.title) titleRef.current?.focus();
            else if (result.fieldErrors.tag) tagRef.current?.focus();
            else if (result.fieldErrors.parent) parentRef.current?.focus();
          });
        } else {
          setFormError(result.error);
        }
        return;
      }
      setTitle("");
      setTagInput("");
      setTagTouched(false);
      setParentId("");
      setColor(DEFAULT_PAGE_COLOR);
      setCreating(false);
      router.replace("/pages");
    } catch (error) {
      setFormError(actionErrorMessage(error, "Couldn’t create this page. Your entries are still here."));
    } finally {
      setSaving(false);
    }
  }

  function closeCreate() {
    setCreating(false);
    if (autoOpenCreate) router.replace("/pages");
  }

  async function handleRestore(page: PageRow) {
    setRestoringId(page.id);
    try {
      const result = await restorePage(page.id);
      if (!result.ok) {
        showFeedback({ message: result.error, tone: "error" });
        return;
      }
      showFeedback({ message: result.affected > 1 ? `${page.title} and ${result.affected - 1} nested pages restored.` : `${page.title} restored.`, tone: "success" });
    } catch (error) {
      showFeedback({ message: actionErrorMessage(error, "Couldn’t restore this page. Try again."), tone: "error" });
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-20 pt-10 lg:px-10">
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
          className="flex h-9 items-center rounded-lg bg-ink px-4 text-[12.5px] font-medium text-bg hover:bg-ink-body"
        >
          <span className="mr-2 text-lg font-normal leading-none">+</span> New page
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          noValidate
          className="mt-8 max-w-2xl rounded-lg border border-border-modal bg-bg-modal px-5 py-6 text-[13px]"
        >
          <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="page-title" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Title</label>
            <input
              ref={titleRef}
              id="page-title"
              value={title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);
                if (!tagTouched) setTagInput(suggestTagFromTitle(nextTitle));
                setFieldErrors((prev) => ({ ...prev, title: undefined, tag: tagTouched ? prev.tag : undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "page-title-error" : undefined}
              className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-ink outline-none"
            />
            {fieldErrors.title && <p id="page-title-error" className="text-[11.5px] text-red-600">{fieldErrors.title}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="page-tag" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Routing tag</label>
            <div className="flex items-center gap-2">
              <input
                ref={tagRef}
                id="page-tag"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setTagTouched(true);
                  setFieldErrors((prev) => ({ ...prev, tag: undefined }));
                }}
                placeholder="project-notes"
                aria-invalid={Boolean(tagError)}
                aria-describedby="page-tag-help"
                className="flex-1 rounded-md border border-border bg-bg px-2.5 py-1.5 font-mono text-ink outline-none"
              />
              {normalizedTag && (
                <TagPill tag={normalizedTag} unmatched={!tagFormatValid} color={color} className="px-[7px] py-[1px] text-[11px]" />
              )}
            </div>
            <p id="page-tag-help" className={`text-[11.5px] ${tagError ? "text-red-600" : "text-ink-faint"}`}>
              {tagError ?? (!tagTouched && normalizedTag ? "Suggested from the title. You can edit it." : TAG_FORMAT_HELP)}
            </p>
          </div>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Color</label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="page-parent" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Parent</label>
            <select
              ref={parentRef}
              id="page-parent"
              value={parentId}
              onChange={(e) => {
                setParentId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, parent: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.parent)}
              aria-describedby={fieldErrors.parent ? "page-parent-error" : undefined}
              className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-ink outline-none"
            >
              <option value="">None (top level)</option>
              {eligibleParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            {fieldErrors.parent && <p id="page-parent-error" className="text-[11.5px] text-red-600">{fieldErrors.parent}</p>}
          </div>
          </div>
          {formError && <p role="alert" className="text-[11.5px] text-red-600">{formError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeCreate}
              className="flex h-8 items-center rounded-lg border border-border px-3 text-[12px] text-ink-secondary hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-8 items-center rounded-lg bg-amber px-3.5 text-[12px] font-semibold text-on-amber hover:bg-amber-hover disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create page"}
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

      {archivedRoots.length > 0 && (
        <section className="mt-12 max-w-4xl border-t border-border pt-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Archived</p><p className="mt-1 text-[12px] text-ink-faint">Notes and nested pages stay intact until you restore their page.</p></div>
            <span className="font-mono text-[10.5px] text-ink-faint">{archivedRoots.length}</span>
          </div>
          <div className="divide-y divide-border-soft rounded-lg border border-border bg-bg-card px-4">
            {archivedRoots.map((page) => {
              const batchSize = archivedPages.filter((candidate) => candidate.archived_at === page.archived_at && (candidate.id === page.id || candidate.depth > page.depth)).length;
              return (
                <div key={page.id} className="flex flex-wrap items-center gap-3 py-3 text-[13px]">
                  <span className="min-w-0 flex-1 truncate text-ink-secondary">{page.title}</span>
                  {batchSize > 1 && <span className="text-[11px] text-ink-faint">{batchSize - 1} nested</span>}
                  <button type="button" onClick={() => void handleRestore(page)} disabled={restoringId !== null} className="rounded-md border border-border px-2.5 py-1 text-[11.5px] text-ink-secondary hover:text-ink disabled:opacity-50">
                    {restoringId === page.id ? "Restoring…" : "Restore"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
