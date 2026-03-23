// Huurders Management

let huurders = [];
let filteredHuurders = [];

const modal = document.getElementById("huurderModal");
const addHuurderBtn = document.getElementById("addHuurderBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const huurderForm = document.getElementById("huurderForm");

// Load all huurders
async function loadHuurders() {
	try {
		showLoading("Huurders laden...");
		huurders = await dbGetAll("huurders");
		// Sort by last name
		huurders.sort((a, b) =>
			(a.achternaam || "").localeCompare(b.achternaam || ""),
		);
		filteredHuurders = [...huurders];
		renderHuurders();
		hideLoading();
	} catch (error) {
		console.error("Error loading huurders:", error);
		hideLoading();
		showToast("Fout bij het laden van huurders", "error");
	}
}

// Render huurders as cards
// Render relaties as cards
function renderHuurders() {
	const container = document.getElementById("huurdersGrid");

	if (filteredHuurders.length === 0) {
		container.innerHTML = '<p class="empty-state">Geen relaties gevonden</p>';
		return;
	}

	container.innerHTML = filteredHuurders
		.map((huurder) => {
			const s = sanitizeHTML;
			const displayName = huurder.bedrijfsnaam
				? `${s(huurder.bedrijfsnaam)} <span style="font-size: 0.8em; color: var(--text-muted);">(${s(huurder.voornaam)} ${s(huurder.achternaam)})</span>`
				: `${s(huurder.voornaam)} ${s(huurder.achternaam)}`;

			const typeBadge = `<span class="status-badge ${s((huurder.relatieType || "Huurder").toLowerCase())}">${s(huurder.relatieType || "Huurder")}</span>`;

			return `
        <div class="item-card" onclick="viewHuurderDetail('${huurder.id}')">
            <div class="item-card-header">
                <h3>${displayName}</h3>
                <div class="item-card-actions" onclick="event.stopPropagation();">
                    ${
											!isViewerRole()
												? `<span class="action-icon" onclick="editHuurder('${huurder.id}')" title="Bewerken"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg></span>
                    <span class="action-icon" onclick="deleteHuurder('${huurder.id}')" title="Verwijderen"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></span>`
												: ""
										}
                </div>
            </div>
            <div class="item-card-body">
                <div style="margin-bottom: 8px;">${typeBadge}</div>
                <p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg> ${s(huurder.email)}</p>
                <p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg> ${s(huurder.telefoon)}</p>
                ${huurder.iban ? `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg> IBAN: ${s(huurder.iban)}</p>` : ""}
                ${huurder.kvkNummer ? `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> KVK: ${s(huurder.kvkNummer)}</p>` : ""}
                ${huurder.geboortedatum ? `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"></path><path d="M2 21h20"></path><path d="M7 8v3"></path><path d="M12 8v3"></path><path d="M17 8v3"></path><path d="M7 4h.01"></path><path d="M12 4h.01"></path><path d="M17 4h.01"></path></svg> ${new Date(huurder.geboortedatum).toLocaleDateString("nl-NL")}</p>` : ""}
                ${huurder.notities ? `<p style="margin-top: 8px; font-style: italic; color: var(--text-muted);">${s(huurder.notities)}</p>` : ""}
            </div>
        </div>
    `;
		})
		.join("");
}

// Open modal for new huurder
addHuurderBtn.addEventListener("click", () => {
	document.getElementById("modalTitle").textContent = "Nieuwe Huurder";
	huurderForm.reset();
	document.getElementById("huurderId").value = "";
	modal.classList.add("show");
});

// Close modal
function closeModalWindow() {
	modal.classList.remove("show");
}

closeModal.addEventListener("click", closeModalWindow);
cancelBtn.addEventListener("click", closeModalWindow);

modal.addEventListener("click", (e) => {
	if (e.target === modal) {
		closeModalWindow();
	}
});

// Save huurder/relatie
huurderForm.addEventListener("submit", async (e) => {
	e.preventDefault();

	const huurderData = {
		relatieType: document.getElementById("relatieType")
			? document.getElementById("relatieType").value
			: "Huurder",
		bedrijfsnaam: document.getElementById("bedrijfsnaam")
			? document.getElementById("bedrijfsnaam").value.trim()
			: "",
		voornaam: document.getElementById("voornaam").value.trim(),
		achternaam: document.getElementById("achternaam").value.trim(),
		email: document.getElementById("email").value.trim(),
		telefoon: document.getElementById("telefoon").value.trim(),
		iban: document.getElementById("iban")
			? document.getElementById("iban").value.trim()
			: "",
		kvkNummer: document.getElementById("kvkNummer")
			? document.getElementById("kvkNummer").value.trim()
			: "",
		geboortedatum: document.getElementById("geboortedatum").value || null,
		notities: document.getElementById("notities").value.trim(),
	};

	// Validate email format
	if (!isValidEmail(huurderData.email)) {
		showToast("Voer een geldig emailadres in", "error");
		return;
	}

	// Validate phone number (Dutch format)
	if (!isValidPhone(huurderData.telefoon)) {
		showToast(
			"Voer een geldig telefoonnummer in (bijv. 06-12345678 of +31612345678)",
			"error",
		);
		return;
	}

	try {
		const huurderId = document.getElementById("huurderId").value;
		showLoading(huurderId ? "Relatie bijwerken..." : "Relatie opslaan...");

		if (huurderId) {
			await dbUpdate("huurders", huurderId, huurderData);
			showToast("Relatie succesvol bijgewerkt", "success");
		} else {
			await dbAdd("huurders", huurderData);
			showToast("Relatie succesvol toegevoegd", "success");
		}

		closeModalWindow();
		await loadHuurders();
	} catch (error) {
		console.error("Error saving relatie:", error);
		hideLoading();
		showToast("Fout bij het opslaan van de relatie", "error");
	}
});

// Edit huurder
async function editHuurder(id) {
	const huurder = huurders.find((h) => h.id === id);
	if (!huurder) return;

	document.getElementById("modalTitle").textContent = "Relatie Bewerken";
	document.getElementById("huurderId").value = huurder.id;
	if (document.getElementById("relatieType"))
		document.getElementById("relatieType").value =
			huurder.relatieType || "Huurder";
	if (document.getElementById("bedrijfsnaam"))
		document.getElementById("bedrijfsnaam").value = huurder.bedrijfsnaam || "";
	document.getElementById("voornaam").value = huurder.voornaam || "";
	document.getElementById("achternaam").value = huurder.achternaam || "";
	document.getElementById("email").value = huurder.email || "";
	document.getElementById("telefoon").value = huurder.telefoon || "";
	if (document.getElementById("iban"))
		document.getElementById("iban").value = huurder.iban || "";
	if (document.getElementById("kvkNummer"))
		document.getElementById("kvkNummer").value = huurder.kvkNummer || "";
	document.getElementById("geboortedatum").value = huurder.geboortedatum || "";
	document.getElementById("notities").value = huurder.notities || "";

	modal.classList.add("show");
}

// Delete huurder (with cascading delete protection)
async function deleteHuurder(id) {
	try {
		// Check for active contracts linked to this huurder
		const contracten = await dbGetAll("contracten");
		const activeContracts = contracten.filter((c) => c.huurderId === id);
		if (activeContracts.length > 0) {
			showToast(
				"Deze huurder kan niet worden verwijderd omdat er nog contracten aan gekoppeld zijn. Verwijder eerst de contracten.",
				"error",
			);
			return;
		}

		const confirmed = await showConfirm(
			"Weet u zeker dat u deze huurder wilt verwijderen?",
			"Huurder verwijderen",
		);
		if (!confirmed) return;

		showLoading("Huurder verwijderen...");
		await dbDelete("huurders", id);
		showToast("Huurder succesvol verwijderd", "success");
		await loadHuurders();
	} catch (error) {
		console.error("Error deleting huurder:", error);
		hideLoading();
		showToast("Fout bij het verwijderen van de huurder", "error");
	}
}

// Search and Filter
function applyFilters() {
	const searchTerm = document.getElementById("searchInput").value.toLowerCase();
	const relatieType = document.getElementById("relatieTypeFilter")
		? document.getElementById("relatieTypeFilter").value
		: "";

	filteredHuurders = huurders.filter((huurder) => {
		const matchesSearch =
			(huurder.voornaam || "").toLowerCase().includes(searchTerm) ||
			(huurder.achternaam || "").toLowerCase().includes(searchTerm) ||
			(huurder.bedrijfsnaam || "").toLowerCase().includes(searchTerm) ||
			(huurder.email || "").toLowerCase().includes(searchTerm) ||
			(huurder.telefoon || "").includes(searchTerm);

		const matchesType =
			relatieType === "" || huurder.relatieType === relatieType;

		return matchesSearch && matchesType;
	});

	renderHuurders();
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
if (document.getElementById("relatieTypeFilter")) {
	document
		.getElementById("relatieTypeFilter")
		.addEventListener("change", applyFilters);
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
	try {
		await ensureAuthenticated();
		await loadHuurders();

		// Check if there's a huurder ID in the hash
		const hash = window.location.hash.substring(1);
		if (hash) {
			// Give it a moment for data to load
			setTimeout(() => {
				const huurder = huurders.find((h) => h.id === hash);
				if (huurder) {
					viewHuurderDetail(hash);
				} else {
					showToast("Huurder niet gevonden", "error");
				}
				// Clear hash
				history.replaceState(null, null, "huurders.html");
			}, 500);
		}
	} catch (error) {
		console.error("Initialization error:", error);
	}
});

// View huurder detail
function viewHuurderDetail(huurderId) {
	const huurder = huurders.find((h) => h.id === huurderId);
	if (huurder) {
		showDetailPanel("huurder", huurder);
	}
}

window.editHuurder = editHuurder;
window.deleteHuurder = deleteHuurder;
window.viewHuurderDetail = viewHuurderDetail;
