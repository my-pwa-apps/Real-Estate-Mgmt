import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { fillEmailTemplate } = require("../js/email-helpers.js");

describe("fillEmailTemplate", () => {
	it("replaces simple placeholders", () => {
		const result = fillEmailTemplate("huurcontract", {
			huurder: { voornaam: "Jan" },
			pand: {
				adres: "Keizersgracht 1",
				postcode: "1015 CJ",
				plaats: "Amsterdam",
			},
			contract: {
				huurprijs: 1500,
				startdatum: "2026-01-01",
				einddatum: "2027-01-01",
			},
		});
		expect(result.subject).toContain("Keizersgracht 1");
		expect(result.body).toContain("Jan");
	});

	it("keeps placeholder if data is missing", () => {
		const result = fillEmailTemplate("huurcontract", {});
		expect(result.subject).toContain("{{pand.adres}}");
	});

	it("throws for unknown template", () => {
		expect(() => fillEmailTemplate("nonexistent", {})).toThrow(
			"Template nonexistent not found",
		);
	});

	it("converts non-string values to strings", () => {
		const result = fillEmailTemplate("huurcontract", {
			huurder: { voornaam: "Jan" },
			pand: {
				adres: "Keizersgracht 1",
				postcode: "1015 CJ",
				plaats: "Amsterdam",
			},
			contract: {
				huurprijs: 42,
				startdatum: "2026-01-01",
				einddatum: "2027-01-01",
			},
		});
		expect(result.body).toContain("42");
	});
});
