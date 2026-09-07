/**
 * The formatting language for staff-editable legal documents (Privacy Policy,
 * Terms & Conditions, Cookie Policy).
 *
 * Deliberately small — legal text needs headings, paragraphs, bullet lists,
 * the occasional table and a little inline emphasis, nothing more:
 *
 *   ## Section heading        → a numbered section (drives the table of contents)
 *   blank line                → paragraph break (single line breaks join up)
 *   - bullet item             → bulleted list (`-`, `*` and `•` all work)
 *   | H1 | H2 | / | --- | --- | + | a | b | → a table
 *   **bold**  *italic*  `code`  [text](url)  [[PLACEHOLDER]]
 *
 * Pure functions, no dependencies: the portal preview and the unit tests use
 * the exact same parser as the public pages. Raw HTML is never interpreted —
 * everything renders as React text nodes (see `LegalDocument`), so stored
 * content cannot inject markup or scripts. Link targets are restricted to safe
 * schemes for the same reason.
 */

export type LegalInline =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; href: string }
  | { kind: "placeholder"; text: string };

export type LegalBlock =
  | { type: "paragraph"; inlines: LegalInline[] }
  | { type: "list"; items: LegalInline[][] }
  | { type: "table"; head: LegalInline[][]; rows: LegalInline[][][] };

export interface LegalSection {
  /** Anchor id, slugified from the heading and de-duplicated. Empty when the
   *  document has content before its first heading (rendered without a title). */
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

/** "Cookies & analytics" → "cookies-analytics". */
export function slugifyHeading(heading: string): string {
  return (
    heading
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

/** Absolute http(s) links open in a new tab; everything else stays in-page. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Only these link targets survive: site paths, page anchors, web URLs and
 * contact schemes. Anything else (notably `javascript:`) is rejected and the
 * link renders as plain text.
 */
export function safeHref(href: string): string | null {
  const value = href.trim();
  if (!value || /[\s<>]/.test(value)) return null;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  const lower = value.toLowerCase();
  if (
    lower.startsWith("https://") ||
    lower.startsWith("http://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  ) {
    return value;
  }
  return null;
}

const INLINE_PATTERN = /\[\[[^\][\n]+?\]\]|`[^`\n]+?`|\[[^\][\n]+?\]\([^)\s]+?\)|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*/g;

function classifyInline(token: string): LegalInline {
  if (token.startsWith("[[")) {
    return { kind: "placeholder", text: token.slice(2, -2).trim() };
  }
  if (token.startsWith("`")) {
    return { kind: "code", text: token.slice(1, -1) };
  }
  if (token.startsWith("[")) {
    const match = /^\[([^\][\n]+?)\]\(([^)\s]+?)\)$/.exec(token);
    if (match) {
      const href = safeHref(match[2]);
      if (href) return { kind: "link", text: match[1], href };
      // Unsafe target: keep the readable text, drop the link.
      return { kind: "text", text: match[1] };
    }
    return { kind: "text", text: token };
  }
  if (token.startsWith("**")) {
    return { kind: "bold", text: token.slice(2, -2) };
  }
  return { kind: "italic", text: token.slice(1, -1) };
}

/** Splits a line into styled spans. Unmatched markers stay literal text. */
export function parseInline(text: string): LegalInline[] {
  const inlines: LegalInline[] = [];
  const pattern = new RegExp(INLINE_PATTERN.source, "g");
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) inlines.push({ kind: "text", text: text.slice(cursor, index) });
    inlines.push(classifyInline(match[0]));
    cursor = index + match[0].length;
  }
  if (cursor < text.length) inlines.push({ kind: "text", text: text.slice(cursor) });
  return inlines;
}

const HEADING_PATTERN = /^#{1,3}\s+(.*)$/;
const BULLET_PATTERN = /^[-*•]\s+(.*)$/;
const TABLE_DELIMITER_PATTERN = /^[\s|:-]+$/;

function tableCells(line: string): string[] {
  const cells = line.split("|").map((cell) => cell.trim());
  if (cells.length > 0 && cells[0] === "") cells.shift();
  if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

/**
 * Turns accumulated `| … |` lines into a table. Malformed tables (no header
 * separator) fall back to plain paragraphs so no content is ever lost.
 */
function tableBlock(lines: string[]): LegalBlock {
  if (
    lines.length >= 2 &&
    TABLE_DELIMITER_PATTERN.test(lines[1]) &&
    lines[1].includes("-") &&
    lines[1].includes("|")
  ) {
    return {
      type: "table",
      head: tableCells(lines[0]).map(parseInline),
      rows: lines.slice(2).map((line) => tableCells(line).map(parseInline)),
    };
  }
  // Not a valid table — keep every line readable instead of dropping it.
  return { type: "paragraph", inlines: parseInline(lines.join(" ")) };
}

function newSection(heading: string, usedIds: Set<string>): LegalSection {
  let id = heading ? slugifyHeading(heading) : "";
  if (id) {
    let candidate = id;
    let counter = 2;
    while (usedIds.has(candidate)) candidate = `${id}-${counter++}`;
    id = candidate;
    usedIds.add(id);
  }
  return { id, heading, blocks: [] };
}

/** Parses a full document body into sections of blocks. Never throws. */
export function parseLegalBody(body: string): LegalSection[] {
  const sections: LegalSection[] = [];
  const usedIds = new Set<string>();
  let current: LegalSection | null = null;
  let paragraph: string[] = [];
  let list: string[] | null = null;
  let table: string[] | null = null;

  const ensureSection = (): LegalSection => {
    if (!current) {
      current = newSection("", usedIds);
      sections.push(current);
    }
    return current;
  };
  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (text) ensureSection().blocks.push({ type: "paragraph", inlines: parseInline(text) });
  };
  const flushList = () => {
    if (list && list.length > 0) {
      ensureSection().blocks.push({ type: "list", items: list.map(parseInline) });
    }
    list = null;
  };
  const flushTable = () => {
    if (table && table.length > 0) ensureSection().blocks.push(tableBlock(table));
    table = null;
  };

  for (const rawLine of body.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    const heading = HEADING_PATTERN.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      flushTable();
      const title = heading[1].trim();
      if (title) {
        current = newSection(title, usedIds);
        sections.push(current);
      }
      continue;
    }

    if (line.startsWith("|")) {
      flushParagraph();
      flushList();
      (table ??= []).push(line);
      continue;
    }

    const bullet = BULLET_PATTERN.exec(line);
    if (bullet) {
      flushParagraph();
      flushTable();
      (list ??= []).push(bullet[1].trim());
      continue;
    }

    flushList();
    flushTable();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushTable();
  return sections.filter((section) => section.blocks.length > 0);
}
