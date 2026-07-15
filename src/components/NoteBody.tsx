import { segmentNoteBody } from "@/lib/note-body";
import { TagPill } from "@/components/TagPill";

export function NoteBody({
  body,
  unmatched = false,
  hideRoutingTagPill = false,
}: {
  body: string;
  unmatched?: boolean;
  // Note card v2 (4c) shows the routing tag as a pill in the card's header
  // band, so re-pilling it inline in the body would show the same tag
  // twice -- render it as plain text there instead.
  hideRoutingTagPill?: boolean;
}) {
  const segments = segmentNoteBody(body);

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === "text") {
          return <span key={i}>{segment.value}</span>;
        }
        if (segment.type === "routing-tag") {
          if (hideRoutingTagPill) {
            return <span key={i}>{segment.value}</span>;
          }
          return (
            <TagPill
              key={i}
              tag={segment.value.slice(1)}
              unmatched={unmatched}
              className="text-[11px] px-[7px] py-[1px]"
            />
          );
        }
        return (
          <span key={i} className="font-mono text-[11px] text-ink-faint">
            {segment.value}
          </span>
        );
      })}
    </>
  );
}
