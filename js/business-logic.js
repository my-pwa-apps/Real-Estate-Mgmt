((globalScope) => {
	const LOCKED_CONTRACT_FIELDS = [
		"huurderId",
		"pandId",
		"startdatum",
		"huurprijs",
		"borg",
		"contractType",
	];

	function getContractStatus(contract, referenceDate = new Date()) {
		if (!contract) return "onbekend";
		if (contract.contractFase === "beeindigd") return "beeindigd";
		if (contract.contractFase === "opgezegd") return "opgezegd";

		const eindDatum = new Date(contract.einddatum);
		if (Number.isNaN(eindDatum.getTime())) {
			return contract.contractFase || "onbekend";
		}

		const threeMonthsFromNow = new Date(referenceDate);
		threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

		if (eindDatum < referenceDate) return "verlopen";
		if (eindDatum <= threeMonthsFromNow) return "verloopt";
		return "actief";
	}

	function countOccupiedPanden(contracts = [], referenceDate = new Date()) {
		return new Set(
			contracts
				.filter(
					(contract) => getContractStatus(contract, referenceDate) === "actief",
				)
				.map((contract) => contract.pandId)
				.filter(Boolean),
		).size;
	}

	function isContractMutable(contract) {
		return !contract?.contractFase || contract.contractFase === "concept";
	}

	const exportsObject = {
		LOCKED_CONTRACT_FIELDS,
		getContractStatus,
		countOccupiedPanden,
		isContractMutable,
	};

	if (typeof module !== "undefined" && module.exports) {
		module.exports = exportsObject;
	}

	Object.assign(globalScope, exportsObject);
})(typeof window !== "undefined" ? window : globalThis);
