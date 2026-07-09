import { describe, expect, it } from "vitest";
import { decideRouting, getLeftmostTag, parseTags } from "@/lib/routing";

describe("parseTags", () => {
  it("matches a tag at position 0", () => {
    expect(parseTags("#foo bar")).toEqual([{ tag: "foo", index: 0 }]);
  });

  it("matches a tag preceded by whitespace", () => {
    expect(parseTags("hello #foo")).toEqual([{ tag: "foo", index: 6 }]);
  });

  it("matches a tag preceded by a newline or tab", () => {
    expect(parseTags("hello\n#foo")).toEqual([{ tag: "foo", index: 6 }]);
    expect(parseTags("hello\t#bar")).toEqual([{ tag: "bar", index: 6 }]);
  });

  it("does not match a mid-word occurrence", () => {
    expect(parseTags("foo#bar")).toEqual([]);
  });

  it("does not match a URL fragment", () => {
    expect(parseTags("see https://example.com#section for details")).toEqual([]);
  });

  it("does not match a tag immediately preceded by punctuation", () => {
    expect(parseTags("hello.#tag")).toEqual([]);
    expect(parseTags("hello,#tag")).toEqual([]);
    expect(parseTags("(#tag)")).toEqual([]);
  });

  it("is case-insensitive and stores tags lowercase", () => {
    expect(parseTags("#FooBar")).toEqual([{ tag: "foobar", index: 0 }]);
  });

  it("requires the tag to start with a letter", () => {
    expect(parseTags("#1abc")).toEqual([]);
    expect(parseTags("#-abc")).toEqual([]);
    expect(parseTags("#_abc")).toEqual([]);
  });

  it("allows letters, digits, underscores, and hyphens after the first letter", () => {
    expect(parseTags("#foo-bar_baz9")).toEqual([{ tag: "foo-bar_baz9", index: 0 }]);
  });

  it("matches a single-letter tag (minimum length)", () => {
    expect(parseTags("#a")).toEqual([{ tag: "a", index: 0 }]);
  });

  it("matches a full 64-character tag (maximum length)", () => {
    const tag = "a" + "b".repeat(63);
    expect(tag).toHaveLength(64);
    expect(parseTags(`#${tag}`)).toEqual([{ tag, index: 0 }]);
  });

  it("truncates at 64 characters, leaving the rest as trailing text", () => {
    const overlong = "a" + "b".repeat(64);
    expect(overlong).toHaveLength(65);
    const result = parseTags(`#${overlong}`);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toHaveLength(64);
    expect(result[0].tag).toBe(overlong.slice(0, 64));
  });

  it("matches a tag followed immediately by punctuation", () => {
    expect(parseTags("#foo!")).toEqual([{ tag: "foo", index: 0 }]);
  });

  it("finds multiple tags in order", () => {
    expect(parseTags("#foo and #bar")).toEqual([
      { tag: "foo", index: 0 },
      { tag: "bar", index: 9 },
    ]);
  });

  it("returns an empty array when there are no tags", () => {
    expect(parseTags("just some text")).toEqual([]);
  });
});

describe("getLeftmostTag", () => {
  it("returns the leftmost tag when multiple are present (first-tag-wins)", () => {
    expect(getLeftmostTag("some text #bar then #foo")).toBe("bar");
  });

  it("returns null when there is no tag", () => {
    expect(getLeftmostTag("no tags here")).toBeNull();
  });

  it("ignores mid-word and URL-fragment occurrences when picking the leftmost tag", () => {
    expect(getLeftmostTag("visit https://x.com#nope then #real")).toBe("real");
  });
});

describe("decideRouting: re-route trigger rule", () => {
  it("skips re-evaluation when the leftmost tag is unchanged", () => {
    const action = decideRouting({
      newLeftmostTag: "marketing",
      storedRoutingTag: "marketing",
      matchedPageId: "should-be-ignored",
    });
    expect(action).toEqual({ type: "unchanged" });
  });

  it("skips re-evaluation when both are null (no tag, unchanged)", () => {
    const action = decideRouting({
      newLeftmostTag: null,
      storedRoutingTag: null,
      matchedPageId: null,
    });
    expect(action).toEqual({ type: "unchanged" });
  });

  it("re-evaluates when the leftmost tag changes to a different tag", () => {
    const action = decideRouting({
      newLeftmostTag: "sales",
      storedRoutingTag: "marketing",
      matchedPageId: "page-sales",
    });
    expect(action).toEqual({ type: "route_to_page", pageId: "page-sales", routingTag: "sales" });
  });

  it("re-evaluates when the tag is removed entirely", () => {
    const action = decideRouting({
      newLeftmostTag: null,
      storedRoutingTag: "marketing",
      matchedPageId: null,
    });
    expect(action).toEqual({ type: "route_to_inbox_no_tag" });
  });

  it("re-evaluates when a tag is added where there was none", () => {
    const action = decideRouting({
      newLeftmostTag: "marketing",
      storedRoutingTag: null,
      matchedPageId: "page-marketing",
    });
    expect(action).toEqual({
      type: "route_to_page",
      pageId: "page-marketing",
      routingTag: "marketing",
    });
  });

  it("routes to inbox unmatched when the new tag matches no page", () => {
    const action = decideRouting({
      newLeftmostTag: "nonexistent",
      storedRoutingTag: "marketing",
      matchedPageId: null,
    });
    expect(action).toEqual({ type: "route_to_inbox_unmatched", routingTag: "nonexistent" });
  });
});

describe("decideRouting: rename", () => {
  it("does not reroute when only the owning page's tag was renamed", () => {
    // A page rename never touches a note's body, so the note's stored
    // routing tag and the freshly parsed leftmost tag are identical --
    // decideRouting sees no change and never even looks at matchedPageId.
    const action = decideRouting({
      newLeftmostTag: "marketing",
      storedRoutingTag: "marketing",
      matchedPageId: null, // the page no longer has this tag after rename
    });
    expect(action).toEqual({ type: "unchanged" });
  });
});

describe("decideRouting: delete-during-edit", () => {
  it("leaves the note's assignment intact when its page was deleted mid-edit", () => {
    // The page delete already moved the note to the Inbox (page_id null,
    // routing_unmatched true) via the DB trigger. The note's own leftmost
    // tag string is unchanged, so this save must not re-evaluate --
    // an eager implementation that re-resolves matchedPageId on every
    // save would incorrectly leave it unmatched=false or attempt to
    // "fix" it, contradicting the stored assignment the delete produced.
    const action = decideRouting({
      newLeftmostTag: "marketing",
      storedRoutingTag: "marketing",
      matchedPageId: null,
    });
    expect(action).toEqual({ type: "unchanged" });
  });
});

describe("decideRouting: freed-tag reuse", () => {
  it("does not auto-reroute a previously unmatched note when its tag is reused by a new page", () => {
    // Note was flagged unmatched under routing_tag "marketing" after its
    // page was deleted. A new page later claims the freed "marketing" tag.
    // If the note is saved again with the SAME leftmost tag string, the
    // re-route trigger rule must skip re-evaluation entirely -- it must
    // NOT auto-adopt the new page just because matchedPageId is now
    // non-null. This is the exact case an eager "reroute on every save"
    // implementation gets wrong: it would look correct on every other
    // test while silently violating "no auto-re-route on tag reuse".
    const action = decideRouting({
      newLeftmostTag: "marketing",
      storedRoutingTag: "marketing",
      matchedPageId: "new-page-that-reused-the-tag",
    });
    expect(action).toEqual({ type: "unchanged" });
  });

  it("does reroute once the user explicitly changes the note's leftmost tag", () => {
    // Only an actual change to the leftmost tag string re-triggers
    // routing -- here the user edits the note so its leftmost tag is now
    // a different string, which does resolve to the newly created page.
    const action = decideRouting({
      newLeftmostTag: "marketing-v2",
      storedRoutingTag: "marketing",
      matchedPageId: "new-page-marketing-v2",
    });
    expect(action).toEqual({
      type: "route_to_page",
      pageId: "new-page-marketing-v2",
      routingTag: "marketing-v2",
    });
  });
});
