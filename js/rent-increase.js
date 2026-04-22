// Auto Rent Increase - Handles annual rent increase processing
// Based on the configured percentage in admin settings

/**
 * Check and apply annual rent increases for all active contracts
 * Should be triggered once per year (typically January)
 */
async function processRentIncrease() {
	try {
		const settings = storage.get("appSettings", {});
		const increasePercent = Number.parseFloat(
			settings.financial?.rentIncreasePercent || 2.5,
		);

		if (increasePercent <= 0) {
			showToast("Geen huurverhogingspercentage ingesteld", "info");
			return { processed: 0 };
		}

		const [contracten, panden, huurders] = await Promise.all([
			dbGetAll("contracten"),
			dbGetAll("panden"),
			dbGetAll("huurders"),
		]);

		const now = new Date();
		const currentYear = now.getFullYear();

		// Find active contracts eligible for increase (not already increased this year)
		// Use strict equality on the year to avoid substring matches (e.g. "2026" vs "12026")
		const eligible = contracten.filter((c) => {
			const end = new Date(c.einddatum);
			return end > now && Number(c.lastIncreaseYear) !== currentYear;
		});

		if (eligible.length === 0) {
			showToast("Geen contracten gevonden voor huurverhoging", "info");
			return { processed: 0 };
		}

		const confirmed = await showConfirm(
			`${eligible.length} contracten gevonden voor huurverhoging van ${increasePercent}%. Wilt u doorgaan?`,
			"Jaarlijkse Huurverhoging",
		);

		if (!confirmed) return { processed: 0 };

		showLoading("Huurverhoging verwerken...");

		// Index lookups so we don't do an O(n) .find() per contract
		const huurderById = new Map(huurders.map((h) => [h.id, h]));
		const pandById = new Map(panden.map((p) => [p.id, p]));

		let processed = 0;
		const failures = [];

		for (const contract of eligible) {
			const oldPrice = Number.parseFloat(contract.huurprijs);
			const newPrice =
				Math.round(oldPrice * (1 + increasePercent / 100) * 100) / 100;

			try {
				await dbUpdate("contracten", contract.id, {
					huurprijs: newPrice,
					lastIncreaseYear: currentYear,
					lastIncreasePercent: increasePercent,
					lastIncreaseOldPrice: oldPrice,
				});

				// Also update the pand huurprijs - on failure, roll back the contract
				// so the contract+pand pair stays consistent.
				if (contract.pandId) {
					try {
						await dbUpdate("panden", contract.pandId, {
							huurprijs: newPrice,
						});
					} catch (pandErr) {
						try {
							await dbUpdate("contracten", contract.id, {
								huurprijs: oldPrice,
								lastIncreaseYear: contract.lastIncreaseYear ?? null,
								lastIncreasePercent: contract.lastIncreasePercent ?? null,
								lastIncreaseOldPrice: contract.lastIncreaseOldPrice ?? null,
							});
						} catch (rollbackErr) {
							console.error(
								"Rollback failed for contract",
								contract.id,
								rollbackErr,
							);
						}
						throw pandErr;
					}
				}

				// Log the increase
				if (typeof logAuditEvent === "function") {
					const huurder = huurderById.get(contract.huurderId);
					const pand = pandById.get(contract.pandId);
					logAuditEvent("update", "contracten", contract.id, {
						description: `Huurverhoging ${increasePercent}%: €${oldPrice} -> €${newPrice} (${huurder ? `${huurder.voornaam} ${huurder.achternaam}` : ""}, ${pand ? pand.adres : ""})`,
					});
				}

				processed++;
			} catch (err) {
				console.error(
					"Rent increase failed for contract",
					contract.id,
					err,
				);
				failures.push({ contractId: contract.id, error: err.message });
				// Continue with the rest of the batch instead of aborting
			}
		}

		hideLoading();
		if (failures.length > 0) {
			showToast(
				`${processed} contracten bijgewerkt; ${failures.length} mislukt. Zie console voor details.`,
				"warning",
			);
		} else {
			showToast(
				`${processed} contracten bijgewerkt met ${increasePercent}% huurverhoging`,
				"success",
			);
		}

		return { processed, failures, increasePercent };
	} catch (error) {
		hideLoading();
		console.error("Error processing rent increase:", error);
		showToast("Fout bij verwerken huurverhoging: " + error.message, "error");
		return { processed: 0 };
	}
}

/**
 * Preview rent increases without applying
 */
async function previewRentIncrease() {
	const settings = storage.get("appSettings", {});
	const increasePercent = Number.parseFloat(
		settings.financial?.rentIncreasePercent || 2.5,
	);

	const [contracten, panden, huurders] = await Promise.all([
		dbGetAll("contracten"),
		dbGetAll("panden"),
		dbGetAll("huurders"),
	]);

	const now = new Date();
	const currentYear = now.getFullYear();

	const eligible = contracten.filter((c) => {
		const end = new Date(c.einddatum);
		return end > now && Number(c.lastIncreaseYear) !== currentYear;
	});

	return eligible.map((c) => {
		const huurder = huurders.find((h) => h.id === c.huurderId);
		const pand = panden.find((p) => p.id === c.pandId);
		const oldPrice = Number.parseFloat(c.huurprijs);
		const newPrice =
			Math.round(oldPrice * (1 + increasePercent / 100) * 100) / 100;

		return {
			contractId: c.id,
			huurder: huurder
				? `${huurder.voornaam} ${huurder.achternaam}`
				: "Onbekend",
			pand: pand ? pand.adres : "Onbekend",
			oldPrice,
			newPrice,
			increase: newPrice - oldPrice,
		};
	});
}

// Export
window.processRentIncrease = processRentIncrease;
window.previewRentIncrease = previewRentIncrease;
