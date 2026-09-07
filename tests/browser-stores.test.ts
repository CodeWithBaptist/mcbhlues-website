import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
// Safe to import statically: neither module touches `window` at load time —
// only inside the functions under test, which run after the stub is installed.
import {
  FAVORITES_STORAGE_KEY,
  clearFavorites,
  readFavorites,
  toggleFavorite,
} from "../src/lib/favorites";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  readConsent,
  resetConsent,
  writeConsent,
} from "../src/lib/consent";

/**
 * Unit tests for the browser-local stores that back the cookie banner and the
 * saved-properties list.
 *
 * Both are `useSyncExternalStore` sources, which means two invariants matter a
 * great deal and are easy to break by accident:
 *
 *   1. `getSnapshot()` must return a **referentially stable** value when the
 *      underlying storage has not changed — otherwise React re-renders forever.
 *   2. Nothing may throw when `localStorage` is unavailable (private mode,
 *      storage disabled, quota exceeded) — the UI has to degrade, not crash.
 */

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  /** Set to make every write throw, the way Safari private mode does. */
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
    if (this.failWrites) throw new Error("storage disabled");
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error("quota exceeded");
    this.map.set(key, value);
  }
}

const storage = new MemoryStorage();

// A DOM stub that is just enough for the stores: localStorage + event target.
const target = new EventTarget();
const windowStub = {
  localStorage: storage,
  addEventListener: target.addEventListener.bind(target),
  removeEventListener: target.removeEventListener.bind(target),
  dispatchEvent: target.dispatchEvent.bind(target),
};
Object.defineProperty(globalThis, "window", {
  value: windowStub,
  configurable: true,
  writable: true,
});


describe("saved properties store", () => {
  beforeEach(() => {
    storage.failWrites = false;
    storage.clear();
    clearFavorites();
  });

  test("starts empty and toggles ids on and off", () => {
    assert.deepEqual([...readFavorites()], []);

    assert.equal(toggleFavorite("prop-a"), true);
    assert.deepEqual([...readFavorites()], ["prop-a"]);

    assert.equal(toggleFavorite("prop-b"), true);
    // Newest first, so the page reads like a recent-activity list.
    assert.deepEqual([...readFavorites()], ["prop-b", "prop-a"]);

    assert.equal(toggleFavorite("prop-a"), false);
    assert.deepEqual([...readFavorites()], ["prop-b"]);
  });

  test("getSnapshot is referentially stable between writes", () => {
    toggleFavorite("prop-a");
    const first = readFavorites();
    assert.equal(readFavorites(), first, "repeated reads must return the same array");

    toggleFavorite("prop-b");
    assert.notEqual(readFavorites(), first, "a write must produce a new snapshot");
  });

  test("an empty list is the same frozen array every time", () => {
    const a = readFavorites();
    clearFavorites();
    assert.equal(readFavorites(), a);
    assert.equal(readFavorites().length, 0);
  });

  test("ignores corrupt, non-array and non-string payloads", () => {
    for (const payload of ["not json", "{}", '"a string"', "[1,2,3]", '[null,""]', "42"]) {
      storage.setItem(FAVORITES_STORAGE_KEY, payload);
      assert.deepEqual([...readFavorites()], [], `payload: ${payload}`);
    }
    storage.setItem(FAVORITES_STORAGE_KEY, '["ok-1", 7, null, "ok-2"]');
    assert.deepEqual([...readFavorites()], ["ok-1", "ok-2"]);
  });

  test("caps the list so localStorage cannot grow without bound", () => {
    storage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(Array.from({ length: 250 }, (_, i) => `p-${i}`))
    );
    assert.equal(readFavorites().length, 100);
    toggleFavorite("brand-new");
    assert.equal(readFavorites().length, 100);
    assert.equal(readFavorites()[0], "brand-new");
  });

  test("never throws when storage is unavailable", () => {
    storage.failWrites = true;
    assert.doesNotThrow(() => toggleFavorite("prop-a"));
    assert.doesNotThrow(() => clearFavorites());
  });

  test("notifies subscribers so the navbar counter stays in sync", () => {
    let notified = 0;
    const listener = () => {
      notified += 1;
    };
    windowStub.addEventListener("mcbhlues:favorites-change", listener);
    toggleFavorite("prop-a");
    toggleFavorite("prop-a");
    windowStub.removeEventListener("mcbhlues:favorites-change", listener);
    assert.equal(notified, 2);
  });
});

describe("cookie consent store", () => {
  beforeEach(() => {
    storage.failWrites = false;
    storage.clear();
    resetConsent();
  });

  test("is undecided until the visitor chooses", () => {
    assert.equal(readConsent(), null);
  });

  test("records and reads back both decisions", () => {
    writeConsent("accepted");
    assert.equal(readConsent()?.analytics, true);

    writeConsent("rejected");
    assert.equal(readConsent()?.analytics, false);

    resetConsent();
    assert.equal(readConsent(), null);
  });

  test("getSnapshot is referentially stable between writes", () => {
    writeConsent("accepted");
    const first = readConsent();
    assert.equal(readConsent(), first);
  });

  test("a stale schema version is treated as undecided so the banner re-asks", () => {
    storage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ version: CONSENT_VERSION + 1, analytics: true, decidedAt: "" })
    );
    assert.equal(readConsent(), null);
  });

  test("ignores corrupt payloads", () => {
    for (const payload of ["not json", "{}", "[]", '{"analytics":"yes"}']) {
      storage.setItem(CONSENT_STORAGE_KEY, payload);
      assert.equal(readConsent(), null, `payload: ${payload}`);
    }
  });

  test("never throws when storage is unavailable", () => {
    storage.failWrites = true;
    assert.doesNotThrow(() => writeConsent("accepted"));
    assert.doesNotThrow(() => resetConsent());
  });
});
