// Global Search - Search across all entities from any page

/**
 * Perform a global search across all entity types
 * @param {string} query - Search term
 * @returns {Array} - Array of results with entityType, entity data, and match description
 */
async function globalSearch(query) {
	if (!query || query.trim().length < 2) return [];

	const searchTerm = query.toLowerCase().trim();
	const results = [];

	try {
		const [
			pandenData,
			huurdersData,
			contractenData,
			onderhoudData,
			transactiesData,
			werkbonnenData,
		] = await Promise.all([
			dbGetAll("panden"),
			dbGetAll("huurders"),
			dbGetAll("contracten"),
			dbGetAll("onderhoud"),
			dbGetAll("transacties"),
			dbGetAll("werkbonnen"),
		]);

		// Search panden
		pandenData.forEach((p) => {
			const fields = [
				p.adres,
				p.postcode,
				p.plaats,
				p.type,
				p.objectSoort,
				p.objectNummer,
				p.ownerNaam,
				p.beheerderNaam,
				p.beschrijving,
			].filter(Boolean);
			const match = fields.find((f) => f.toLowerCase().includes(searchTerm));
			if (match) {
				results.push({
					entityType: "pand",
					id: p.id,
					title: p.adres,
					subtitle: `${p.postcode} ${p.plaats}`,
					icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg>',
					badge: p.status,
					badgeClass: p.status,
					page: "panden.html",
					data: p,
				});
			}
		});

		// Search huurders
		huurdersData.forEach((h) => {
			const fields = [
				h.voornaam,
				h.achternaam,
				h.email,
				h.telefoon,
				h.notities,
			].filter(Boolean);
			const match = fields.find((f) => f.toLowerCase().includes(searchTerm));
			if (match) {
				results.push({
					entityType: "huurder",
					id: h.id,
					title: `${h.voornaam} ${h.achternaam}`,
					subtitle: h.email,
					icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
					badge: null,
					page: "huurders.html",
					data: h,
				});
			}
		});

		// Search contracten (by linked names)
		contractenData.forEach((c) => {
			const huurder = huurdersData.find((h) => h.id === c.huurderId);
			const pand = pandenData.find((p) => p.id === c.pandId);
			const huurderNaam = huurder
				? `${huurder.voornaam} ${huurder.achternaam}`
				: "";
			const pandAdres = pand ? pand.adres : "";
			const fields = [
				huurderNaam,
				pandAdres,
				c.contractType,
				c.contractFase,
				c.contractReferentie,
				c.voorwaarden,
			].filter(Boolean);
			const match = fields.find((f) => f.toLowerCase().includes(searchTerm));
			if (match) {
				results.push({
					entityType: "contract",
					id: c.id,
					title: `Contract: ${huurderNaam}`,
					subtitle: pandAdres,
					icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>',
					badge: null,
					page: "contracten.html",
					data: c,
				});
			}
		});

		// Search onderhoud
		onderhoudData.forEach((m) => {
			const pand = pandenData.find((p) => p.id === m.pandId);
			const pandAdres = pand ? pand.adres : "";
			const fields = [
				m.titel,
				m.beschrijving,
				pandAdres,
				m.probleemCategorie,
				m.kostenCategorie,
				m.uitvoerderNaam,
				m.externeReferentie,
				m.notities,
			].filter(Boolean);
			const match = fields.find((f) => f.toLowerCase().includes(searchTerm));
			if (match) {
				results.push({
					entityType: "onderhoud",
					id: m.id,
					title: m.titel,
					subtitle: pandAdres,
					icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg>',
					badge: m.prioriteit,
					badgeClass: m.prioriteit,
					page: "onderhoud.html",
					data: m,
				});
			}
		});

		// Search transacties
		transactiesData.forEach((t) => {
			const fields = [
				t.beschrijving,
				t.omschrijving,
				t.categorie,
				t.notities,
			].filter(Boolean);
			const match = fields.find((f) => f.toLowerCase().includes(searchTerm));
			if (match) {
				results.push({
					entityType: "transactie",
					id: t.id,
					title: t.beschrijving || t.omschrijving,
					subtitle: `€${Number.parseFloat(t.bedrag).toLocaleString("nl-NL")} - ${t.datum}`,
					icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg>',
					badge: t.type,
					badgeClass: t.type,
					page: "financieel.html",
					data: t,
				});
			}
		});

		// Search werkbonnen
		werkbonnenData.forEach((w) => {
			const fields = [
				w.werkbonNummer,
				w.pandAdres,
				w.titel,
				w.beschrijving,
				w.huurderNaam,
				w.onderhoudsBedrijf,
			].filter(Boolean);
			const match = fields.find((f) => f.toLowerCase().includes(searchTerm));
			if (match) {
				results.push({
					entityType: "werkbon",
					id: w.id,
					title: w.werkbonNummer,
					subtitle: `${w.pandAdres} - ${w.titel}`,
					icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>',
					badge: w.status,
					badgeClass: w.status,
					page: "werkbonnen.html",
					data: w,
				});
			}
		});
	} catch (error) {
		console.error("Global search error:", error);
	}

	return results;
}

/**
 * Initialize global search UI on the page
 */
function initGlobalSearch() {
	// Create search overlay
	const overlay = document.createElement("div");
	overlay.id = "globalSearchOverlay";
	overlay.className = "global-search-overlay";
	overlay.innerHTML = `
        <div class="global-search-modal">
            <div class="global-search-header">
                <span class="global-search-icon"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg></span>
                <input type="text" id="globalSearchInput" placeholder="Zoek in alles... (panden, huurders, contracten, etc.)" autocomplete="off">
                <button class="global-search-close" onclick="closeGlobalSearch()"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            </div>
            <div id="globalSearchResults" class="global-search-results">
                <p class="global-search-hint">Typ minimaal 2 tekens om te zoeken</p>
            </div>
        </div>
    `;
	document.body.appendChild(overlay);

	// Close on overlay click
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) closeGlobalSearch();
	});

	// Search input handler
	const input = document.getElementById("globalSearchInput");
	let searchTimeout;
	input.addEventListener("input", (e) => {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			performGlobalSearch(e.target.value);
		}, 300);
	});

	// Keyboard shortcut: Ctrl+K or Cmd+K to open search
	document.addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "k") {
			e.preventDefault();
			openGlobalSearch();
		}
		if (e.key === "Escape" && overlay.classList.contains("show")) {
			closeGlobalSearch();
		}
	});
}

function openGlobalSearch() {
	const overlay = document.getElementById("globalSearchOverlay");
	overlay.classList.add("show");
	document.getElementById("globalSearchInput").focus();
	document.getElementById("globalSearchInput").value = "";
	document.getElementById("globalSearchResults").innerHTML =
		'<p class="global-search-hint">Typ minimaal 2 tekens om te zoeken</p>';
}

function closeGlobalSearch() {
	const overlay = document.getElementById("globalSearchOverlay");
	overlay.classList.remove("show");
}

async function performGlobalSearch(query) {
	const resultsContainer = document.getElementById("globalSearchResults");

	if (!query || query.trim().length < 2) {
		resultsContainer.innerHTML =
			'<p class="global-search-hint">Typ minimaal 2 tekens om te zoeken</p>';
		return;
	}

	resultsContainer.innerHTML = '<p class="global-search-hint">Zoeken...</p>';

	const results = await globalSearch(query);

	if (results.length === 0) {
		resultsContainer.innerHTML = `<p class="global-search-hint">Geen resultaten gevonden voor "${sanitizeHTML(query)}"</p>`;
		return;
	}

	const s = sanitizeHTML;
	resultsContainer.innerHTML = results
		.map(
			(r) => `
        <a href="${r.page}#${r.id}" class="global-search-result" onclick="closeGlobalSearch()">
            <span class="result-icon">${r.icon}</span>
            <div class="result-content">
                <div class="result-title">${s(r.title)}</div>
                <div class="result-subtitle">${s(r.subtitle || "")}</div>
            </div>
            ${r.badge ? `<span class="status-badge ${s(r.badgeClass || "")}">${s(r.badge)}</span>` : ""}
        </a>
    `,
		)
		.join("");
}

// Init on page load
document.addEventListener("DOMContentLoaded", () => {
	initGlobalSearch();
});

// Export
window.globalSearch = globalSearch;
window.openGlobalSearch = openGlobalSearch;
window.closeGlobalSearch = closeGlobalSearch;
