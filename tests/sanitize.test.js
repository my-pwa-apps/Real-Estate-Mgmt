import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { sanitizeAttr, sanitizeHTML } = require("../js/ui-utilities.js");

describe("sanitizeHTML", () => {
	it("escapes HTML tags", () => {
		expect(sanitizeHTML("<script>alert('xss')</script>")).not.toContain(
			"<script>",
		);
	});

	it("escapes angle brackets", () => {
		const result = sanitizeHTML("<img src=x onerror=alert(1)>");
		expect(result).not.toContain("<img");
		expect(result).toContain("&lt;");
	});

	it("handles null and undefined", () => {
		expect(sanitizeHTML(null)).toBe("");
		expect(sanitizeHTML(undefined)).toBe("");
	});

	it("handles plain text without modification", () => {
		expect(sanitizeHTML("Hello World")).toBe("Hello World");
	});

	it("handles numbers by converting to string", () => {
		expect(sanitizeHTML(42)).toBe("42");
	});

	it("escapes ampersands", () => {
		expect(sanitizeHTML("A & B")).toContain("&amp;");
	});

	it("handles nested XSS attempts", () => {
		const result = sanitizeHTML(
			'<div onload="alert(1)"><script>alert(2)</script></div>',
		);
		expect(result).not.toContain("<div");
		expect(result).not.toContain("<script");
	});

	it("handles empty string", () => {
		expect(sanitizeHTML("")).toBe("");
	});
});

describe("sanitizeAttr", () => {
	it("removes special characters from attributes", () => {
		expect(sanitizeAttr("abc-123_def")).toBe("abc-123_def");
	});

	it("strips dangerous characters", () => {
		expect(sanitizeAttr("test' onclick='alert(1)")).toBe("testonclickalert1");
	});

	it("handles null and undefined", () => {
		expect(sanitizeAttr(null)).toBe("");
		expect(sanitizeAttr(undefined)).toBe("");
	});

	it("handles path traversal characters", () => {
		expect(sanitizeAttr("../../etc/passwd")).toBe("etcpasswd");
	});
});
