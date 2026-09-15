/**
 * Auto-continuing bullet lists for plain <textarea> fields.
 *
 * Pure text transforms so the behaviour can be unit tested without a DOM, and
 * shared by every textarea that opts in (see `<Textarea bulletList />`).
 *
 * Rules:
 *   • typing `*` + space at the start of a line turns it into `• `
 *   • Enter on a bulleted line starts the next line with `• `
 *   • Enter on an empty bullet (`• ` and nothing else) clears that bullet and
 *     drops the caret onto a plain, non-bulleted line — exiting the list
 *
 * Nothing here ever reformats text that is merely loaded into the field: the
 * transforms only run in response to a keystroke, so existing descriptions
 * containing literal `*` characters (or no bullets at all) load untouched.
 */

export const BULLET = "\u2022";
const BULLET_PREFIX = `${BULLET} `;

export type BulletEdit = {
  /** Full replacement value for the textarea. */
  value: string;
  /** Where the caret should sit afterwards (collapsed selection). */
  selection: number;
};

type Keystroke = {
  key: string;
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

/** Index of the first character on the line containing `index`. */
function lineStart(value: string, index: number): number {
  return value.lastIndexOf("\n", index - 1) + 1;
}

/**
 * Returns the edit to apply for this keystroke, or `null` to let the browser
 * handle the key normally.
 */
export function bulletListKeydown({ key, value, selectionStart, selectionEnd }: Keystroke): BulletEdit | null {
  // Only act on a collapsed caret — leave range replacements to the browser.
  if (selectionStart !== selectionEnd) return null;

  const start = lineStart(value, selectionStart);
  const beforeCaret = value.slice(start, selectionStart);

  if (key === " ") {
    // `*` + space at the very start of a line becomes a bullet.
    if (beforeCaret !== "*") return null;
    return {
      value: value.slice(0, start) + BULLET_PREFIX + value.slice(selectionStart),
      selection: start + BULLET_PREFIX.length,
    };
  }

  if (key === "Enter") {
    if (!beforeCaret.startsWith(BULLET_PREFIX) && beforeCaret.trimEnd() !== BULLET) return null;

    const lineEnd = value.indexOf("\n", selectionStart);
    const restOfLine = value.slice(selectionStart, lineEnd === -1 ? value.length : lineEnd);
    const content = (beforeCaret.slice(BULLET_PREFIX.length) + restOfLine).trim();

    if (content === "") {
      // Empty bullet: drop it and leave the caret on a plain line.
      // The line itself already sits after a newline, so clearing it leaves the
      // caret on a blank, non-bulleted line.
      const tail = value.slice(lineEnd === -1 ? value.length : lineEnd);
      return { value: value.slice(0, start) + tail, selection: start };
    }

    return {
      value: value.slice(0, selectionStart) + "\n" + BULLET_PREFIX + value.slice(selectionStart),
      selection: selectionStart + 1 + BULLET_PREFIX.length,
    };
  }

  return null;
}
