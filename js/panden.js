// Panden Management

let panden = [];
let filteredPanden = [];

function getObjectSoortLabel(objectSoort) {
	const labels = {
		gebouw: "Gebouw",
		complex: "Complex",
		sectie: "Sectie",
		unit: "Unit",
	};
	return labels[objectSoort] || capitalizeFirst(objectSoort || "onbekend");
}

// Modal elements
const modal = document.getElementById("pandModal");
const addPandBtn = document.getElementById("addPandBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const pandForm = document.getElementById("pandForm");

// Load all panden
async function loadPanden() {
	try {
		showLoading("Panden laden...");
		panden = await dbGetAll("panden");
		// Sort by address
		panden.sort((a, b) => (a.adres || "").localeCompare(b.adres || ""));
		filteredPanden = [...panden];
		populateParentObjectOptions();
		renderPanden();
		hideLoading();
	} catch (error) {
		console.error("Error loading panden:", error);
		hideLoading();
		showToast("Fout bij het laden van panden", "error");
	}
}

// Render panden table
function renderPanden() {
	const tbody = document.getElementById("pandenTableBody");

	if (filteredPanden.length === 0) {
		tbody.innerHTML =
			'<tr><td colspan="8" class="empty-state">Geen panden gevonden</td></tr>';
		return;
	}

	tbody.innerHTML = filteredPanden
		.map((pand) => {
			const s = sanitizeHTML;
			const objectLabel = getObjectSoortLabel(pand.objectSoort || "gebouw");
			return `
        <tr onclick="viewPandDetail('${pand.id}')" style="cursor: pointer;">
            <td>
                <div><strong>${s(objectLabel)}</strong></div>
                <div style="font-size: 12px; color: var(--text-secondary);">${s(pand.objectNummer || "-")}</div>
            </td>
            <td><span class="status-badge ${s(pand.type)}">${pand.type === "bedrijfspand" ? "Bedrijfspand" : "Woning"}</span></td>
            <td>${s(pand.adres)}</td>
            <td>${s(pand.postcode)}</td>
            <td>${s(pand.plaats)}</td>
            <td><span class="status-badge ${s(pand.status)}">${capitalizeFirst(s(pand.status))}</span></td>
            <td>€${Number.parseFloat(pand.huurprijs).toLocaleString("nl-NL")}</td>
            <td class="actions" onclick="event.stopPropagation();">
                ${
									!isViewerRole()
										? `<span class="action-icon" onclick="editPand('${pand.id}')" title="Bewerken"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg></span>
                <span class="action-icon" onclick="deletePand('${pand.id}')" title="Verwijderen"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></span>`
										: ""
								}
            </td>
        </tr>
    `;
		})
		.join("");
}

function populateParentObjectOptions(selectedId = "") {
	const parentSelect = document.getElementById("parentObjectId");
	if (!parentSelect) return;

	const currentPandId = document.getElementById("pandId").value;
	const options = panden
		.filter((pand) => pand.id !== currentPandId)
		.map(
			(pand) =>
				`<option value="${pand.id}" ${pand.id === selectedId ? "selected" : ""}>${sanitizeHTML(pand.adres)} (${sanitizeHTML(getObjectSoortLabel(pand.objectSoort || "gebouw"))})</option>`,
		)
		.join("");

	parentSelect.innerHTML = `<option value="">Geen</option>${options}`;
}

// Open modal for new pand
addPandBtn.addEventListener("click", () => {
	if (isViewerRole()) {
		showToast("U heeft geen rechten om panden toe te voegen", "error");
		return;
	}
	document.getElementById("modalTitle").textContent = "Nieuw Pand";
	pandForm.reset();
	document.getElementById("pandId").value = "";
	populateParentObjectOptions();
	modal.classList.add("show");
});

// Close modal
function closeModalWindow() {
	modal.classList.remove("show");
}

closeModal.addEventListener("click", closeModalWindow);
cancelBtn.addEventListener("click", closeModalWindow);

// Close modal when clicking outside
modal.addEventListener("click", (e) => {
	if (e.target === modal) {
		closeModalWindow();
	}
});

// Save pand (create or update)
pandForm.addEventListener("submit", async (e) => {
	e.preventDefault();

	const pandData = {
		objectSoort: document.getElementById("objectSoort").value,
		type: document.getElementById("type").value,
		status: document.getElementById("status").value,
		objectNummer: document.getElementById("objectNummer").value.trim(),
		parentObjectId: document.getElementById("parentObjectId").value || null,
		adres: document.getElementById("adres").value.trim(),
		postcode: document.getElementById("postcode").value.trim(),
		plaats: document.getElementById("plaats").value.trim(),
		oppervlakte:
			Number.parseInt(document.getElementById("oppervlakte").value) || null,
		kamers: Number.parseInt(document.getElementById("kamers").value) || null,
		bouwjaar:
			Number.parseInt(document.getElementById("bouwjaar").value) || null,
		energielabel: document.getElementById("energielabel").value || null,
		bagId: document.getElementById("bagId").value.trim() || null,
		streefhuur:
			Number.parseFloat(document.getElementById("streefhuur").value) || null,
		ownerNaam: document.getElementById("ownerNaam").value.trim() || null,
		beheerderNaam:
			document.getElementById("beheerderNaam").value.trim() || null,
		huurprijs: Number.parseFloat(document.getElementById("huurprijs").value),
		beschrijving: document.getElementById("beschrijving").value.trim(),
	};

	// Validate postcode (Dutch format: 1234 AB)
	const postcodeRegex = /^[1-9]\d{3}\s?[A-Za-z]{2}$/;
	if (!postcodeRegex.test(pandData.postcode)) {
		showToast("Voer een geldige postcode in (bijv. 1234 AB)", "error");
		return;
	}

	// Validate huurprijs is positive
	if (pandData.huurprijs <= 0) {
		showToast("Huurprijs moet een positief bedrag zijn", "error");
		return;
	}

	if (pandData.streefhuur !== null && pandData.streefhuur < 0) {
		showToast("Streefhuur kan niet negatief zijn", "error");
		return;
	}

	// Validate type and status against allowed values
	const validTypes = ["bedrijfspand", "woning"];
	const validObjectSoorten = ["gebouw", "complex", "sectie", "unit"];
	const validStatuses = ["verhuurd", "beschikbaar", "onderhoud"];
	if (!validObjectSoorten.includes(pandData.objectSoort)) {
		showToast("Ongeldige objectsoort geselecteerd", "error");
		return;
	}
	if (!validTypes.includes(pandData.type)) {
		showToast("Ongeldig type geselecteerd", "error");
		return;
	}
	if (!validStatuses.includes(pandData.status)) {
		showToast("Ongeldige status geselecteerd", "error");
		return;
	}

	const pandId = document.getElementById("pandId").value;

	try {
		showLoading(pandId ? "Pand bijwerken..." : "Pand opslaan...");

		if (pandId) {
			// Update existing pand
			await dbUpdate("panden", pandId, pandData);
			showToast("Pand succesvol bijgewerkt", "success");
		} else {
			// Create new pand
			await dbAdd("panden", pandData);
			showToast("Pand succesvol toegevoegd", "success");
		}

		closeModalWindow();
		await loadPanden();
	} catch (error) {
		console.error("Error saving pand:", error);
		hideLoading();
		showToast("Fout bij het opslaan van het pand", "error");
	}
});

// Edit pand
async function editPand(id) {
	const pand = panden.find((p) => p.id === id);
	if (!pand) return;

	document.getElementById("modalTitle").textContent = "Pand Bewerken";
	document.getElementById("pandId").value = pand.id;
	document.getElementById("objectSoort").value = pand.objectSoort || "gebouw";
	document.getElementById("type").value = pand.type;
	document.getElementById("status").value = pand.status;
	document.getElementById("objectNummer").value = pand.objectNummer || "";
	populateParentObjectOptions(pand.parentObjectId || "");
	document.getElementById("adres").value = pand.adres;
	document.getElementById("postcode").value = pand.postcode;
	document.getElementById("plaats").value = pand.plaats;
	document.getElementById("oppervlakte").value = pand.oppervlakte || "";
	document.getElementById("kamers").value = pand.kamers || "";
	document.getElementById("bouwjaar").value = pand.bouwjaar || "";
	document.getElementById("energielabel").value = pand.energielabel || "";
	document.getElementById("bagId").value = pand.bagId || "";
	document.getElementById("streefhuur").value = pand.streefhuur || "";
	document.getElementById("ownerNaam").value = pand.ownerNaam || "";
	document.getElementById("beheerderNaam").value = pand.beheerderNaam || "";
	document.getElementById("huurprijs").value = pand.huurprijs;
	document.getElementById("beschrijving").value = pand.beschrijving || "";

	modal.classList.add("show");
}

// Delete pand (with cascading delete protection)
async function deletePand(id) {
	try {
		// Check for active contracts linked to this pand
		const contracten = await dbGetAll("contracten");
		const activeContracts = contracten.filter((c) => c.pandId === id);
		if (activeContracts.length > 0) {
			showToast(
				"Dit pand kan niet worden verwijderd omdat er nog contracten aan gekoppeld zijn. Verwijder eerst de contracten.",
				"error",
			);
			return;
		}

		// Check for maintenance requests
		const onderhoudItems = await dbGetAll("onderhoud");
		const linkedOnderhoud = onderhoudItems.filter(
			(o) => o.pandId === id && o.status !== "afgerond",
		);
		if (linkedOnderhoud.length > 0) {
			const proceed = await showConfirm(
				`Er zijn nog ${linkedOnderhoud.length} openstaande onderhoudsmeldingen voor dit pand. Wilt u toch doorgaan met verwijderen?`,
				"Waarschuwing",
			);
			if (!proceed) return;
		}

		const confirmed = await showConfirm(
			"Weet u zeker dat u dit pand wilt verwijderen?",
			"Pand verwijderen",
		);
		if (!confirmed) return;

		showLoading("Pand verwijderen...");
		await dbDelete("panden", id);
		showToast("Pand succesvol verwijderd", "success");
		await loadPanden();
	} catch (error) {
		console.error("Error deleting pand:", error);
		hideLoading();
		showToast("Fout bij het verwijderen van het pand", "error");
	}
}

// Filters
document
	.getElementById("objectSoortFilter")
	.addEventListener("change", applyFilters);
document.getElementById("typeFilter").addEventListener("change", applyFilters);
document
	.getElementById("statusFilter")
	.addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);

function applyFilters() {
	const objectSoortFilter = document.getElementById("objectSoortFilter").value;
	const typeFilter = document.getElementById("typeFilter").value;
	const statusFilter = document.getElementById("statusFilter").value;
	const searchTerm = document.getElementById("searchInput").value.toLowerCase();

	filteredPanden = panden.filter((pand) => {
		const matchesObjectSoort =
			!objectSoortFilter ||
			(pand.objectSoort || "gebouw") === objectSoortFilter;
		const matchesType = !typeFilter || pand.type === typeFilter;
		const matchesStatus = !statusFilter || pand.status === statusFilter;
		const matchesSearch =
			!searchTerm ||
			pand.adres.toLowerCase().includes(searchTerm) ||
			pand.plaats.toLowerCase().includes(searchTerm) ||
			pand.postcode.toLowerCase().includes(searchTerm) ||
			(pand.objectNummer || "").toLowerCase().includes(searchTerm) ||
			(pand.ownerNaam || "").toLowerCase().includes(searchTerm) ||
			(pand.beheerderNaam || "").toLowerCase().includes(searchTerm) ||
			(pand.bagId || "").toLowerCase().includes(searchTerm);

		return matchesObjectSoort && matchesType && matchesStatus && matchesSearch;
	});

	renderPanden();
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
	try {
		await ensureAuthenticated();
		await loadPanden();
	} catch (error) {
		console.error("Initialization error:", error);
	}
});

// View pand detail
function viewPandDetail(pandId) {
	const pand = panden.find((p) => p.id === pandId);
	if (pand) {
		const parentObject = pand.parentObjectId
			? panden.find((item) => item.id === pand.parentObjectId)
			: null;
		showDetailPanel("pand", {
			...pand,
			parentObjectAdres: parentObject
				? `${parentObject.adres}, ${parentObject.plaats}`
				: "",
		});
	}
}

// Make functions global for onclick handlers
window.editPand = editPand;
window.deletePand = deletePand;
window.viewPandDetail = viewPandDetail;
