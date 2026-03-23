import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
	formatCurrency,
	formatDate,
	isValidEmail,
	isValidPhone,
} = require("../js/ui-utilities.js");

describe("formatCurrency", () => {
	it("formats positive amounts", () => {
		const result = formatCurrency(1234.56);
		expect(result).toContain("1.234,56");
	});

	it("formats zero", () => {
		const result = formatCurrency(0);
		expect(result).toContain("0,00");
	});
});

describe("formatDate", () => {
	it("formats short dates", () => {
		const result = formatDate("2025-01-15", "short");
		expect(result).toContain("15");
		expect(result).toContain("2025");
	});

	it("formats relative dates", () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		expect(formatDate(yesterday.toISOString(), "relative")).toBe("Gisteren");
	});
});

describe("validators", () => {
	it("accepts valid emails", () => {
		expect(isValidEmail("user@example.com")).toBe(true);
	});

	it("rejects invalid emails", () => {
		expect(isValidEmail("not-an-email")).toBe(false);
	});

	it("accepts valid Dutch phone numbers", () => {
		expect(isValidPhone("0612345678")).toBe(true);
		expect(isValidPhone("+31612345678")).toBe(true);
	});

	it("rejects invalid phone numbers", () => {
		expect(isValidPhone("12345")).toBe(false);
	});
});
