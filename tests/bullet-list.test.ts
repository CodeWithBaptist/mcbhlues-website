import { strict as assert } from "node:assert";
import test from "node:test";
import { bulletListKeydown } from "../src/lib/bullet-list";

const at = (text: string) => {
  const caret = text.indexOf("|");
  return { value: text.replace("|", ""), selectionStart: caret, selectionEnd: caret };
};
const show = (edit: { value: string; selection: number }) =>
  edit.value.slice(0, edit.selection) + "|" + edit.value.slice(edit.selection);

test("`* ` at line start becomes a bullet", () => {
  const edit = bulletListKeydown({ key: " ", ...at("*|") });
  assert.equal(show(edit!), "• |");
});

test("`* ` mid-line is left alone", () => {
  assert.equal(bulletListKeydown({ key: " ", ...at("rate 5*|") }), null);
});

test("Enter continues a bulleted line", () => {
  const edit = bulletListKeydown({ key: "Enter", ...at("• Pool|") });
  assert.equal(show(edit!), "• Pool\n• |");
});

test("Enter on an empty bullet exits the list", () => {
  const edit = bulletListKeydown({ key: "Enter", ...at("• Pool\n• |") });
  assert.equal(show(edit!), "• Pool\n|");
});

test("Enter on a plain line is untouched", () => {
  assert.equal(bulletListKeydown({ key: "Enter", ...at("A quiet 3-bed flat|") }), null);
});

test("existing text with literal asterisks is not reformatted", () => {
  const legacy = "* Pool\n* Gym";
  const caret = legacy.length;
  assert.equal(
    bulletListKeydown({ key: "Enter", value: legacy, selectionStart: caret, selectionEnd: caret }),
    null
  );
});

test("selections are left to the browser", () => {
  assert.equal(bulletListKeydown({ key: "Enter", value: "• Pool", selectionStart: 2, selectionEnd: 6 }), null);
});
