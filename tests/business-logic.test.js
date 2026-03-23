import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
	countOccupiedPanden,
	getContractStatus,
} = require("../js/business-logic.js");

describe("getContractStatus", () => {
	it("returns 'actief' for contracts ending far in the future", () => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 2);
		const contract = {
			einddatum: futureDate.toISOString().split("T")[0],
			contractFase: "actief",
		};
		expect(getContractStatus(contract)).toBe("actief");
	});

	it("returns 'verlopen' for contracts that have ended", () => {
		const contract = {
			einddatum: "2020-01-01",
			contractFase: "actief",
		};
		expect(getContractStatus(contract)).toBe("verlopen");
	});

	it("returns 'verloopt' for contracts ending within 3 months", () => {
		const soonDate = new Date();
		soonDate.setMonth(soonDate.getMonth() + 1);
		const contract = {
			einddatum: soonDate.toISOString().split("T")[0],
			contractFase: "actief",
		};
		expect(getContractStatus(contract)).toBe("verloopt");
	});

	it("respects contractFase 'beeindigd' regardless of date", () => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 2);
		const contract = {
			einddatum: futureDate.toISOString().split("T")[0],
			contractFase: "beeindigd",
		};
		expect(getContractStatus(contract)).toBe("beeindigd");
	});

	it("respects contractFase 'opgezegd' regardless of date", () => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 2);
		const contract = {
			einddatum: futureDate.toISOString().split("T")[0],
			contractFase: "opgezegd",
		};
		expect(getContractStatus(contract)).toBe("opgezegd");
	});
});

describe("countOccupiedPanden", () => {
	it("counts unique occupied pandIds", () => {
		const contracts = [
			{ pandId: "p1", einddatum: "2030-01-01", contractFase: "actief" },
			{ pandId: "p1", einddatum: "2030-01-01", contractFase: "actief" },
			{ pandId: "p2", einddatum: "2030-01-01", contractFase: "actief" },
			{ pandId: "p3", einddatum: "2030-01-01", contractFase: "opgezegd" },
		];

		expect(countOccupiedPanden(contracts)).toBe(2);
	});
});
