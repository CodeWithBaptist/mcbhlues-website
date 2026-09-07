import assert from "node:assert/strict";
import { describe, test } from "node:test";
// Pure module: no database, no `window`, safe to import statically.
import {
  isExternalHref,
  parseInline,
  parseLegalBody,
  safeHref,
  slugifyHeading,
} from "../src/lib/legal/legal-format";

describe("slugifyHeading", () => {
  test("turns headings into anchor ids", () => {
    assert.equal(slugifyHeading("Who we are"), "who-we-are");
    assert.equal(slugifyHeading("Cookies & analytics"), "cookies-analytics");
    assert.equal(slugifyHeading("  Fees & payments! "), "fees-payments");
    assert.equal(slugifyHeading("---"), "section");
  });
});

describe("safeHref", () => {
  test("allows site paths, anchors, web and contact schemes", () => {
    assert.equal(safeHref("/privacy"), "/privacy");
    assert.equal(safeHref("#cookies"), "#cookies");
    assert.equal(safeHref("https://ndpc.gov.ng"), "https://ndpc.gov.ng");
    assert.equal(safeHref("http://example.com/x"), "http://example.com/x");
    assert.equal(safeHref("mailto:info@mcbhlues.com"), "mailto:info@mcbhlues.com");
    assert.equal(safeHref("tel:+2348000000000"), "tel:+2348000000000");
  });

  test("rejects dangerous and malformed targets", () => {
    assert.equal(safeHref("javascript:alert(1)"), null);
    assert.equal(safeHref("JaVaScRiPt:alert(1)"), null);
    assert.equal(safeHref("data:text/html,<h1>x</h1>"), null);
    assert.equal(safeHref(""), null);
    assert.equal(safeHref("not a url"), null);
    assert.equal(safeHref("https://exa<mple.com"), null);
  });

  test("flags absolute links as external", () => {
    assert.equal(isExternalHref("https://ndpc.gov.ng"), true);
    assert.equal(isExternalHref("http://example.com"), true);
    assert.equal(isExternalHref("/privacy"), false);
    assert.equal(isExternalHref("#cookies"), false);
    assert.equal(isExternalHref("mailto:a@b.com"), false);
  });
});

describe("parseInline", () => {
  test("parses emphasis, code, links and placeholders", () => {
    assert.deepEqual(parseInline("We are the **data controller** here."), [
      { kind: "text", text: "We are the " },
      { kind: "bold", text: "data controller" },
      { kind: "text", text: " here." },
    ]);
    assert.deepEqual(parseInline("use of the *website* only"), [
      { kind: "text", text: "use of the " },
      { kind: "italic", text: "website" },
      { kind: "text", text: " only" },
    ]);
    assert.deepEqual(parseInline("stored as `localStorage`"), [
      { kind: "text", text: "stored as " },
      { kind: "code", text: "localStorage" },
    ]);
    assert.deepEqual(parseInline("see our [Privacy Policy](/privacy) today"), [
      { kind: "text", text: "see our " },
      { kind: "link", text: "Privacy Policy", href: "/privacy" },
      { kind: "text", text: " today" },
    ]);
    assert.deepEqual(parseInline("RC [[RC NUMBER]] here"), [
      { kind: "text", text: "RC " },
      { kind: "placeholder", text: "RC NUMBER" },
      { kind: "text", text: " here" },
    ]);
  });

  test("downgrades unsafe links to plain text", () => {
    assert.deepEqual(parseInline("click [here](javascript:alert(1)) now"), [
      { kind: "text", text: "click " },
      { kind: "text", text: "here" },
      // No link is created; the orphaned ")" stays harmless literal text.
      { kind: "text", text: ") now" },
    ]);
  });

  test("leaves unmatched markers literal", () => {
    assert.deepEqual(parseInline("a **bold start with no end"), [
      { kind: "text", text: "a **bold start with no end" },
    ]);
    assert.deepEqual(parseInline("a trailing star* stays literal"), [
      { kind: "text", text: "a trailing star* stays literal" },
    ]);
    assert.deepEqual(parseInline("[no target] and [[unclosed"), [
      { kind: "text", text: "[no target] and [[unclosed" },
    ]);
  });
});

describe("parseLegalBody", () => {
  test("splits sections, paragraphs and lists", () => {
    const sections = parseLegalBody(
      `## Who we are\n\nFirst paragraph\ncontinued here.\n\nSecond paragraph.\n\n## Why we use it\n\n- One\n* Two\n• Three\n`
    );
    assert.equal(sections.length, 2);
    assert.deepEqual(
      sections.map((section) => ({ id: section.id, heading: section.heading })),
      [
        { id: "who-we-are", heading: "Who we are" },
        { id: "why-we-use-it", heading: "Why we use it" },
      ]
    );
    assert.equal(sections[0].blocks.length, 2);
    assert.deepEqual(sections[0].blocks[0], {
      type: "paragraph",
      inlines: [{ kind: "text", text: "First paragraph continued here." }],
    });
    assert.equal(sections[1].blocks.length, 1);
    assert.equal(sections[1].blocks[0].type, "list");
    if (sections[1].blocks[0].type === "list") {
      assert.deepEqual(
        sections[1].blocks[0].items.map((item) => item.map((node) => ("text" in node ? node.text : ""))),
        [["One"], ["Two"], ["Three"]]
      );
    }
  });

  test("parses tables and keeps malformed ones readable", () => {
    const sections = parseLegalBody(
      `## Inventory\n\n| Name | Type |\n| ---- | ---- |\n| \`a\` | Essential |\n| b | Optional |\n`
    );
    assert.equal(sections.length, 1);
    assert.equal(sections[0].blocks.length, 1);
    const block = sections[0].blocks[0];
    assert.equal(block.type, "table");
    if (block.type === "table") {
      assert.equal(block.head.length, 2);
      assert.equal(block.rows.length, 2);
      assert.deepEqual(block.rows[0][0], [{ kind: "code", text: "a" }]);
    }

    const broken = parseLegalBody(`## Oops\n\n| Name | Type |\n| a | b |\n`);
    assert.equal(broken[0].blocks.length, 1);
    assert.equal(broken[0].blocks[0].type, "paragraph");
  });

  test("de-duplicates section ids and keeps preamble content", () => {
    const sections = parseLegalBody(
      `Intro line before any heading.\n\n## Contact us\n\nBody one.\n\n## Contact us\n\nBody two.\n`
    );
    assert.deepEqual(
      sections.map((section) => section.id),
      ["", "contact-us", "contact-us-2"]
    );
    assert.equal(sections[0].blocks.length, 1);
  });

  test("tolerates CRLF, empty headings and empty bodies", () => {
    const sections = parseLegalBody("## Real\r\n\r\nLine one\r\nline two.\r\n\r\n##   \r\n\r\n");
    assert.equal(sections.length, 1);
    assert.equal(sections[0].id, "real");
    assert.deepEqual(parseLegalBody(""), []);
    assert.deepEqual(parseLegalBody("   \n\n  "), []);
  });
});
