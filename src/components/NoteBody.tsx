import { segmentNoteBody } from "@/lib/note-body";
import { TagPill } from "@/components/TagPill";

export function NoteBody({ body, unmatched = false }: { body: string; unmatched?: boolean }) {
  const segments = segmentNoteBody(body);

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === "text") {
          return <span key={i}>{segment.value}</span>;
        }
        if (segment.type === "routing-tag") {
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
