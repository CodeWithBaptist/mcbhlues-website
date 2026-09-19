import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  detectMimeType,
  validateUploadBuffer,
  MAX_UPLOAD_BYTES,
} from "@/lib/media/upload-service";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  hashToken,
  generateToken,
} from "@/lib/auth/password";
import { canManageLevel } from "@/lib/rbac/permissions";
import { hasPermission } from "@/lib/rbac/can";
import { rateLimit } from "@/lib/security/rate-limit";
import { safeHref, parseLegalBody } from "@/lib/legal/legal-format";
import { toJsonLd } from "@/lib/schema";

describe("File upload magic-byte verification", () => {
  test("identifies JPEG magic bytes", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    assert.equal(detectMimeType(buf), "image/jpeg");
    const check = validateUploadBuffer(buf);
    assert.equal(check.valid, true);
    if (check.valid) {
      assert.equal(check.type, "image/jpeg");
    }
  });

  test("identifies PNG magic bytes", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    assert.equal(detectMimeType(buf), "image/png");
    const check = validateUploadBuffer(buf);
    assert.equal(check.valid, true);
    if (check.valid) {
      assert.equal(check.type, "image/png");
    }
  });

  test("identifies GIF magic bytes (GIF87a and GIF89a)", () => {
    const gif87 = Buffer.from("GIF87a\x01\x00\x01\x00");
    const gif89 = Buffer.from("GIF89a\x01\x00\x01\x00");
    assert.equal(detectMimeType(gif87), "image/gif");
    assert.equal(detectMimeType(gif89), "image/gif");
  });

  test("identifies WebP magic bytes", () => {
    const webp = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.from([0x20, 0x00, 0x00, 0x00]),
      Buffer.from("WEBPVP8 "),
    ]);
    assert.equal(detectMimeType(webp), "image/webp");
  });

  test("identifies AVIF magic bytes", () => {
    const avif = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x1c]),
      Buffer.from("ftypavif"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
    ]);
    assert.equal(detectMimeType(avif), "image/avif");
  });

  test("identifies PDF magic bytes", () => {
    const pdf = Buffer.from("%PDF-1.7\n%some content");
    assert.equal(detectMimeType(pdf), "application/pdf");
    const check = validateUploadBuffer(pdf);
    assert.equal(check.valid, true);
  });

  test("rejects executable or script files masquerading as images", () => {
    const php = Buffer.from("<?php phpinfo(); ?>");
    const shell = Buffer.from("#!/bin/bash\necho hello");
    const html = Buffer.from("<html><script>alert(1)</script></html>");
    const exe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00");

    assert.equal(detectMimeType(php), null);
    assert.equal(detectMimeType(shell), null);
    assert.equal(detectMimeType(html), null);
    assert.equal(detectMimeType(exe), null);

    const checkPhp = validateUploadBuffer(php);
    assert.equal(checkPhp.valid, false);
    if (!checkPhp.valid) {
      assert.match(checkPhp.error, /does not match/i);
    }
  });

  test("rejects empty and oversized buffers", () => {
    const empty = Buffer.alloc(0);
    const checkEmpty = validateUploadBuffer(empty);
    assert.equal(checkEmpty.valid, false);

    const oversized = Buffer.alloc(MAX_UPLOAD_BYTES + 10);
    const checkOver = validateUploadBuffer(oversized);
    assert.equal(checkOver.valid, false);
    if (!checkOver.valid) {
      assert.match(checkOver.error, /limit is/i);
    }
  });
});

describe("Password and token security", () => {
  test("hashPassword generates salted unique scrypt hashes", async () => {
    const password = "StrongPassword@123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    assert.notEqual(hash1, hash2);
    assert.match(hash1, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    assert.match(hash2, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);

    assert.equal(await verifyPassword(password, hash1), true);
    assert.equal(await verifyPassword(password, hash2), true);
    assert.equal(await verifyPassword("WrongPassword@123", hash1), false);
    assert.equal(await verifyPassword("", hash1), false);
    assert.equal(await verifyPassword(password, null), false);
    assert.equal(await verifyPassword(password, "invalid_hash_format"), false);
  });

  test("validatePasswordStrength enforces length and character classes", () => {
    const weak1 = validatePasswordStrength("short", 10);
    assert.equal(weak1.valid, false);
    assert.ok(weak1.errors.some((e) => e.includes("at least 10 characters")));

    const weakNoUpper = validatePasswordStrength("alllowercase123!", 10);
    assert.equal(weakNoUpper.valid, false);
    assert.ok(weakNoUpper.errors.some((e) => e.includes("uppercase letter")));

    const weakNoLower = validatePasswordStrength("ALLUPPERCASE123!", 10);
    assert.equal(weakNoLower.valid, false);
    assert.ok(weakNoLower.errors.some((e) => e.includes("lowercase letter")));

    const weakNoNumber = validatePasswordStrength("NoNumbersInThisPass!", 10);
    assert.equal(weakNoNumber.valid, false);
    assert.ok(weakNoNumber.errors.some((e) => e.includes("number")));

    const weakNoSymbol = validatePasswordStrength("NoSymbolsInThis1234", 10);
    assert.equal(weakNoSymbol.valid, false);
    assert.ok(weakNoSymbol.errors.some((e) => e.includes("symbol")));

    const strong = validatePasswordStrength("Compl!antP@ssw0rd2026", 10);
    assert.equal(strong.valid, true);
    assert.equal(strong.errors.length, 0);
  });

  test("hashToken creates deterministic SHA-256 digest", () => {
    const token = generateToken();
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
    assert.match(hash1, /^[0-9a-f]{64}$/);
  });
});

describe("RBAC permission checks & role hierarchy", () => {
  test("canManageLevel allows Super Admin to manage peers and prevents non-super admin from managing equal/higher level roles", () => {
    const superAdmin = { level: 100 };
    const admin = { level: 80 };
    const manager = { level: 50 };

    // Super Admin (level >= 100) can manage any level, including level 100
    assert.equal(canManageLevel(superAdmin, 80), true);
    assert.equal(canManageLevel(superAdmin, 100), true);

    // Admin (level 80) can only manage levels strictly below 80
    assert.equal(canManageLevel(admin, 50), true);
    assert.equal(canManageLevel(admin, 80), false);
    assert.equal(canManageLevel(admin, 100), false);

    // Manager (level 50) cannot manage level 50 or above
    assert.equal(canManageLevel(manager, 50), false);
    assert.equal(canManageLevel(manager, 80), false);
  });

  test("hasPermission handles all and any modes correctly", () => {
    const held = ["property:read", "property:create", "customer:read"];

    assert.equal(hasPermission(held, ["property:read"], "any"), true);
    assert.equal(hasPermission(held, ["property:delete"], "any"), false);

    // mode: any
    assert.equal(hasPermission(held, ["property:delete", "property:read"], "any"), true);
    assert.equal(hasPermission(held, ["property:delete", "booking:read"], "any"), false);

    // mode: all
    assert.equal(hasPermission(held, ["property:read", "customer:read"], "all"), true);
    assert.equal(hasPermission(held, ["property:read", "property:delete"], "all"), false);

    // empty required list allows
    assert.equal(hasPermission(held, [], "all"), true);
    assert.equal(hasPermission(held, [], "any"), true);
  });
});

describe("Rate limiting sliding window", () => {
  test("enforces burst limit and reports retry-after", () => {
    const key = `test:burst:${Date.now()}`;
    const opts = { limit: 3, windowMs: 1000 };

    const r1 = rateLimit(key, opts);
    assert.equal(r1.ok, true);
    assert.equal(r1.remaining, 2);

    const r2 = rateLimit(key, opts);
    assert.equal(r2.ok, true);
    assert.equal(r2.remaining, 1);

    const r3 = rateLimit(key, opts);
    assert.equal(r3.ok, true);
    assert.equal(r3.remaining, 0);

    const r4 = rateLimit(key, opts);
    assert.equal(r4.ok, false);
    assert.equal(r4.remaining, 0);
    assert.ok(r4.retryAfter > 0);
  });
});

describe("XSS Prevention and Input Sanitization", () => {
  test("safeHref neutralizes dangerous URL schemes", () => {
    assert.equal(safeHref("javascript:alert(1)"), null);
    assert.equal(safeHref("JAVASCRIPT:alert(1)"), null);
    assert.equal(safeHref("vbscript:msgbox(1)"), null);
    assert.equal(safeHref("data:text/html,<script>alert(1)</script>"), null);
    assert.equal(safeHref("   "), null);

    assert.equal(safeHref("https://example.com"), "https://example.com");
    assert.equal(safeHref("/properties/123"), "/properties/123");
    assert.equal(safeHref("#section-1"), "#section-1");
    assert.equal(safeHref("mailto:info@mcbhlues.com"), "mailto:info@mcbhlues.com");
    assert.equal(safeHref("tel:+2348001000001"), "tel:+2348001000001");
  });

  test("parseLegalBody downgrades unsafe links without losing label text", () => {
    const body = "Click [here](javascript:alert(1)) to continue.";
    const sections = parseLegalBody(body);
    assert.equal(sections.length, 1);
    const p = sections[0].blocks[0];
    assert.equal(p.type, "paragraph");
    if (p.type === "paragraph") {
      // The unsafe target should render as kind: text with "here", not a link
      const hasUnsafeLink = p.inlines.some((i) => i.kind === "link");
      assert.equal(hasUnsafeLink, false);
      const textItem = p.inlines.find((i) => i.kind === "text" && i.text === "here");
      assert.ok(textItem);
    }
  });

  test("toJsonLd escapes script tag characters for safe JSON-LD injection", () => {
    const maliciousPayload = {
      name: "Acme </script><script>alert('xss')</script>",
      tagline: "A & B < C > D",
    };
    const jsonStr = toJsonLd(maliciousPayload);

    assert.equal(jsonStr.includes("</script>"), false);
    assert.equal(jsonStr.includes("<"), false);
    assert.equal(jsonStr.includes(">"), false);
    assert.equal(jsonStr.includes("&"), false);

    // Parses back cleanly to identical data
    const parsed = JSON.parse(jsonStr);
    assert.deepEqual(parsed, maliciousPayload);
  });
});
