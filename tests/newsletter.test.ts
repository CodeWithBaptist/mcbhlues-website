import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import {
  normaliseSubscriberEmail,
  validateSubscriptionEmail,
} from "../src/lib/newsletter/subscription";
import {
  NEWSLETTER_PROMPT_KEY,
  hasAnsweredNewsletterPrompt,
  readNewsletterPrompt,
  recordNewsletterPrompt,
  resetNewsletterPrompt,
} from "../src/lib/newsletter/prompt-store";

/**
 * The newsletter prompt's isomorphic validation and its browser-local
 * "already answered" store. Both back the popup and both must never throw in a
 * hostile environment (see `tests/browser-stores.test.ts` for the invariant).
 */

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  failWrites = false;
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error("quota exceeded");
    this.map.set(key, value);
  }
}

const storage = new MemoryStorage();
const target = new EventTarget();
Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: storage,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  },
  configurable: true,
  writable: true,
});

describe("subscriber email validation", () => {
  test("normalises case and whitespace", () => {
    assert.equal(normaliseSubscriberEmail("  Ada@Example.COM "), "ada@example.com");
    assert.equal(normaliseSubscriberEmail("ada @ example.com"), "ada@example.com");
    assert.equal(normaliseSubscriberEmail(42), "");
    assert.equal(normaliseSubscriberEmail(undefined), "");
  });

  test("accepts ordinary addresses and rejects the broken ones", () => {
    assert.equal(validateSubscriptionEmail("ada@example.com"), null);
    assert.equal(validateSubscriptionEmail("a.b+c@sub.domain.co"), null);

    for (const bad of ["", "   ", "not-an-email", "ada@", "@example.com", "ada@com", "ada @x"]) {
      assert.notEqual(validateSubscriptionEmail(bad), null, `should reject: ${bad}`);
    }
  });
});

describe("newsletter prompt store", () => {
  beforeEach(() => {
    storage.failWrites = false;
    storage.clear();
  });

  test("starts unanswered and records both outcomes", () => {
    assert.equal(hasAnsweredNewsletterPrompt(), false);

    recordNewsletterPrompt("dismissed");
    assert.equal(readNewsletterPrompt()?.outcome, "dismissed");
    assert.equal(hasAnsweredNewsletterPrompt(), true);

    recordNewsletterPrompt("subscribed");
    assert.equal(readNewsletterPrompt()?.outcome, "subscribed");
  });

  test("ignores corrupt and foreign-version payloads", () => {
    for (const payload of [
      "not json",
      "{}",
      '{"version":1,"outcome":"maybe"}',
      '{"version":999,"outcome":"subscribed"}',
      '"a string"',
    ]) {
      storage.setItem(NEWSLETTER_PROMPT_KEY, payload);
      assert.equal(readNewsletterPrompt(), null, `payload: ${payload}`);
      assert.equal(hasAnsweredNewsletterPrompt(), false);
    }
  });

  test("a failed write never throws", () => {
    storage.failWrites = true;
    assert.doesNotThrow(() => recordNewsletterPrompt("dismissed"));
    assert.doesNotThrow(() => resetNewsletterPrompt());
    assert.equal(hasAnsweredNewsletterPrompt(), false);
  });
});
