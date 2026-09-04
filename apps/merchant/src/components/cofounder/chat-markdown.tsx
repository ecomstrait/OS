/**
 * Small, dependency-free renderer for the markdown subset the model
 * actually produces in chat replies — bold, bullet/numbered lists,
 * paragraphs, inline code. Not a full CommonMark parser; just enough that
 * `**bold**` and `- item` render properly instead of showing up as literal
 * asterisks and dashes. No `dangerouslySetInnerHTML` anywhere — everything
 * is built as plain React elements, so there's no HTML-injection surface
 * even though this text comes from an LLM.
 */

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] } | { type: "ol"; items: string[] };

const BULLET = /^\s*[-*]\s+/;
const NUMBERED = /^\s*\d+\.\s+/;

function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === "") {
      i++;
      continue;
    }
    if (BULLET.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && BULLET.test(lines[i])) {
        items.push(lines[i].replace(BULLET, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
    } else if (NUMBERED.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && NUMBERED.test(lines[i])) {
        items.push(lines[i].replace(NUMBERED, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
    } else {
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !BULLET.test(lines[i]) && !NUMBERED.test(lines[i])) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "p", text: paraLines.join("\n") });
    }
  }
  return blocks;
}

/**
 * Inline formatting within one line/paragraph: **bold**, `code`, and
 * [text](url) links — the last one added once Co-Founder became an
 * orchestrator that can hand back a real link (e.g. "open it in
 * /builder?draft=..." after building a store); before that, nothing this
 * chat produced ever contained one, so it was never missed.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-${key++}`} className="rounded bg-ink-100 px-1 py-0.5 text-[0.85em]">
          {match[2]}
        </code>,
      );
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const external = /^https?:\/\//.test(match[4]);
      nodes.push(
        <a
          key={`${keyPrefix}-${key++}`}
          href={match[4]}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
        >
          {match[3]}
        </a>,
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        if (b.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-4">
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-4">
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {renderInline(b.text, `${i}`)}
          </p>
        );
      })}
    </div>
  );
}
