// Onderhoud Management

let meldingen = [];
let panden = [];
let filteredMeldingen = [];

function getProbleemCategorieLabel(categorie) {
	const labels = {
		bouwkundig: "Bouwkundig",
		elektra: "Elektra",
		installatie: "Installatie",
		sanitair: "Sanitair",
		veiligheid: "Veiligheid",
		overig: "Overig",
	};
	return labels[categorie] || capitalizeFirst(categorie || "onbekend");
}

const modal = document.getElementById("meldingModal");
const addMeldingBtn = document.getElementById("addMeldingBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const meldingForm = document.getElementById("meldingForm");

// Load all data
async function loadAllData() {
	try {
		showLoading("Gegevens laden...");
		const [meldingenData, pandenData] = await Promise.all([
			dbGetAll("onderhoud"),
			dbGetAll("panden"),
		]);

		meldingen = meldingenData;
		// Sort by creation date descending
		meldingen.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

		panden = pandenData;

		filteredMeldingen = [...meldingen];
		populateDropdowns();
		renderMeldingen();
		hideLoading();
	} catch (error) {
		console.error("Error loading data:", error);
		hideLoading();
		showToast("Fout bij het laden van gegevens", "error");
	}
}

// Populate dropdown lists
function populateDropdowns() {
	const pandSelect = document.getElementById("pandId");
	pandSelect.innerHTML = `<option value="">Selecteer pand</option>${panden
		.map((p) => `<option value="${p.id}">${p.adres}, ${p.plaats}</option>`)
		.join("")}`;
}

// Render meldingen as cards
function renderMeldingen() {
	const container = document.getElementById("meldingenGrid");

	if (filteredMeldingen.length === 0) {
		container.innerHTML =
			'<p class="empty-state">Geen onderhoudsmeldingen gevonden</p>';
		return;
	}

	container.innerHTML = filteredMeldingen
		.map((melding) => {
			const pand = panden.find((p) => p.id === melding.pandId);
			const priorityClass = melding.prioriteit || "normaal";
			const statusClass = melding.status || "nieuw";
			const s = sanitizeHTML;

			return `
            <div class="item-card" onclick="viewOnderhoudDetail('${melding.id}')">
                <div class="item-card-header">
                    <h3>${s(melding.titel)}</h3>
                    <div class="item-card-actions" onclick="event.stopPropagation();">
                        ${
													!isViewerRole()
														? `${!melding.werkbonId ? `<span class="action-icon" onclick="createWerkbon('${melding.id}')" title="Werkbon Aanmaken"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg></span>` : `<span class="action-icon" style="opacity: 0.5;" title="Werkbon aangemaakt"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg></span>`}
                        <span class="action-icon" onclick="editMelding('${melding.id}')" title="Bewerken"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg></span>
                        <span class="action-icon" onclick="deleteMelding('${melding.id}')" title="Verwijderen"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></span>`
														: `${melding.werkbonId ? `<span class="action-icon" style="opacity: 0.5;" title="Werkbon aangemaakt"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg></span>` : ""}`
												}
                    </div>
                </div>
                <div class="item-card-body">
                    <p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg> ${pand ? s(pand.adres) : "Onbekend pand"}</p>
                    ${melding.probleemCategorie ? `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"></path></svg> ${s(getProbleemCategorieLabel(melding.probleemCategorie))}</p>` : ""}
                    <p style="margin-top: 8px;">${s(melding.beschrijving)}</p>
                    ${melding.geplande_datum ? `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg> Gepland: ${new Date(melding.geplande_datum).toLocaleDateString("nl-NL")}</p>` : ""}
					${melding.kosten ? `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg> Kosten: €${Number.parseFloat(melding.kosten).toLocaleString("nl-NL")}</p>` : ""}
                    ${melding.uitvoerderNaam ? `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"></path><path d="m18 15 4-4"></path><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"></path></svg> Uitvoerder: ${s(melding.uitvoerderNaam)}</p>` : ""}
                </div>
                <div class="item-card-footer">
                    <span class="priority-badge ${s(priorityClass)}">${capitalizeFirst(s(melding.prioriteit || "normaal"))}</span>
                    <span class="status-badge ${s(statusClass)}">${capitalizeFirst(s(melding.status || "nieuw"))}</span>
                </div>
            </div>
        `;
		})
		.join("");
}

// Open modal for new melding
addMeldingBtn.addEventListener("click", () => {
	document.getElementById("modalTitle").textContent = "Nieuwe Melding";
	meldingForm.reset();
	document.getElementById("meldingId").value = "";
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

// Save melding
meldingForm.addEventListener("submit", async (e) => {
	e.preventDefault();

	const meldingData = {
		pandId: document.getElementById("pandId").value,
		titel: document.getElementById("titel").value.trim(),
		beschrijving: document.getElementById("beschrijving").value.trim(),
		probleemCategorie:
			document.getElementById("probleemCategorie").value || null,
		prioriteit: document.getElementById("prioriteit").value,
		status: document.getElementById("status").value,
		kostenCategorie: document.getElementById("kostenCategorie").value || null,
		uitvoerderNaam:
			document.getElementById("uitvoerderNaam").value.trim() || null,
		geplande_datum: document.getElementById("geplanddatum").value || null,
		kosten: Number.parseFloat(document.getElementById("kosten").value) || null,
		melderNaam: document.getElementById("melderNaam").value.trim() || null,
		melderContact:
			document.getElementById("melderContact").value.trim() || null,
		externeReferentie:
			document.getElementById("externeReferentie").value.trim() || null,
		notities: document.getElementById("notities").value.trim(),
	};

	// Validate prioriteit against allowed values
	const validPrioriteiten = ["laag", "normaal", "hoog", "urgent"];
	if (!validPrioriteiten.includes(meldingData.prioriteit)) {
		showToast("Ongeldige prioriteit geselecteerd", "error");
		return;
	}

	// Validate status against allowed values
	const validStatuses = ["nieuw", "in-behandeling", "gepland", "afgerond"];
	if (!validStatuses.includes(meldingData.status)) {
		showToast("Ongeldige status geselecteerd", "error");
		return;
	}

	// Validate kosten is not negative
	if (meldingData.kosten !== null && meldingData.kosten < 0) {
		showToast("Kosten kunnen niet negatief zijn", "error");
		return;
	}

	const meldingId = document.getElementById("meldingId").value;

	try {
		showLoading(meldingId ? "Melding bijwerken..." : "Melding opslaan...");
		if (meldingId) {
			// Build activity log entry for update
			const oldMelding = meldingen.find((m) => m.id === meldingId);
			const logEntry = {
				datum: new Date().toISOString(),
				gebruiker:
					window.currentUser?.name || window.currentUser?.email || "Systeem",
				actie: "bijgewerkt",
			};
			const changes = [];
			if (oldMelding && oldMelding.status !== meldingData.status) {
				changes.push(`Status: ${oldMelding.status} → ${meldingData.status}`);
			}
			if (oldMelding && oldMelding.prioriteit !== meldingData.prioriteit) {
				changes.push(
					`Prioriteit: ${oldMelding.prioriteit} → ${meldingData.prioriteit}`,
				);
			}
			if (
				oldMelding &&
				oldMelding.uitvoerderNaam !== meldingData.uitvoerderNaam
			) {
				changes.push(`Uitvoerder: ${meldingData.uitvoerderNaam || "(leeg)"}`);
			}
			if (changes.length > 0) {
				logEntry.details = changes.join("; ");

				// Append to existing log only for material changes
				const existingLog =
					oldMelding && Array.isArray(oldMelding.activiteitenLog)
						? oldMelding.activiteitenLog
						: [];
				meldingData.activiteitenLog = [...existingLog, logEntry];
			}

			await dbUpdate("onderhoud", meldingId, meldingData);
			showToast("Melding succesvol bijgewerkt", "success");
		} else {
			// New melding: create initial log entry
			meldingData.activiteitenLog = [
				{
					datum: new Date().toISOString(),
					gebruiker:
						window.currentUser?.name || window.currentUser?.email || "Systeem",
					actie: "aangemaakt",
					details: `Prioriteit: ${meldingData.prioriteit}`,
				},
			];
			await dbAdd("onderhoud", meldingData);
			showToast("Melding succesvol toegevoegd", "success");
		}

		closeModalWindow();
		await loadAllData();
	} catch (error) {
		console.error("Error saving melding:", error);
		hideLoading();
		showToast("Fout bij het opslaan van de melding", "error");
	}
});

// Edit melding
async function editMelding(id) {
	const melding = meldingen.find((m) => m.id === id);
	if (!melding) return;

	document.getElementById("modalTitle").textContent = "Melding Bewerken";
	document.getElementById("meldingId").value = melding.id;
	document.getElementById("pandId").value = melding.pandId;
	document.getElementById("titel").value = melding.titel;
	document.getElementById("beschrijving").value = melding.beschrijving;
	document.getElementById("probleemCategorie").value =
		melding.probleemCategorie || "";
	document.getElementById("prioriteit").value = melding.prioriteit || "normaal";
	document.getElementById("status").value = melding.status || "nieuw";
	document.getElementById("kostenCategorie").value =
		melding.kostenCategorie || "";
	document.getElementById("uitvoerderNaam").value =
		melding.uitvoerderNaam || "";
	document.getElementById("geplanddatum").value = melding.geplande_datum || "";
	document.getElementById("kosten").value = melding.kosten || "";
	document.getElementById("melderNaam").value = melding.melderNaam || "";
	document.getElementById("melderContact").value = melding.melderContact || "";
	document.getElementById("externeReferentie").value =
		melding.externeReferentie || "";
	document.getElementById("notities").value = melding.notities || "";

	modal.classList.add("show");
}

// Delete melding
async function deleteMelding(id) {
	const confirmed = await showConfirm(
		"Weet u zeker dat u deze melding wilt verwijderen?",
		"Melding verwijderen",
	);
	if (!confirmed) return;

	try {
		showLoading("Melding verwijderen...");
		await dbDelete("onderhoud", id);
		showToast("Melding succesvol verwijderd", "success");
		await loadAllData();
	} catch (error) {
		console.error("Error deleting melding:", error);
		hideLoading();
		showToast("Fout bij het verwijderen van de melding", "error");
	}
}

// Filters
document
	.getElementById("statusFilter")
	.addEventListener("change", applyFilters);
document
	.getElementById("prioriteitFilter")
	.addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);

function applyFilters() {
	const statusFilter = document.getElementById("statusFilter").value;
	const prioriteitFilter = document.getElementById("prioriteitFilter").value;
	const searchTerm = document.getElementById("searchInput").value.toLowerCase();

	filteredMeldingen = meldingen.filter((melding) => {
		const matchesStatus = !statusFilter || melding.status === statusFilter;
		const matchesPrioriteit =
			!prioriteitFilter || melding.prioriteit === prioriteitFilter;

		const pand = panden.find((p) => p.id === melding.pandId);
		const matchesSearch =
			!searchTerm ||
			melding.titel.toLowerCase().includes(searchTerm) ||
			melding.beschrijving.toLowerCase().includes(searchTerm) ||
			pand?.adres.toLowerCase().includes(searchTerm);

		return matchesStatus && matchesPrioriteit && matchesSearch;
	});

	renderMeldingen();
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
	try {
		await ensureAuthenticated();
		await loadAllData();
	} catch (error) {
		console.error("Initialization error:", error);
	}
});

// Send confirmation email to huurder
async function sendConfirmationEmail(meldingId) {
	try {
		// Check if Microsoft signed in
		if (!isMicrosoftSignedIn()) {
			const signIn = await showConfirm(
				"U moet eerst inloggen met Microsoft 365 om emails te versturen. Nu inloggen?",
				"Microsoft 365 vereist",
			);
			if (signIn) {
				await signInToMicrosoft();
			}
			return;
		}

		const melding = meldingen.find((m) => m.id === meldingId);
		if (!melding) return;

		const pand = panden.find((p) => p.id === melding.pandId);
		if (!pand) return;

		// Get huurder from active contract
		const contracten = await dbGetAll("contracten");
		const contract = contracten.find((c) => c.pandId === pand.id);

		if (!contract) {
			showToast("Geen actief contract gevonden voor dit pand", "warning");
			return;
		}

		const huurders = await dbGetAll("huurders");
		const huurder = huurders.find((h) => h.id === contract.huurderId);

		if (!huurder) {
			showToast("Huurder gegevens niet gevonden", "error");
			return;
		}

		// Fill template with data
		const emailData = fillEmailTemplate("onderhoud_bevestiging", {
			huurder: huurder,
			pand: pand,
			melding: melding,
		});

		emailData.to = [huurder.email];
		emailData.saveToSharePoint = true;

		await sendEmail(emailData);

		showToast(`Bevestiging verstuurd naar ${huurder.email}`, "success");

		// Save email to SharePoint
		const folderPath = `Onderhoud/${new Date().getFullYear()}/${pand.adres.replace(/[^a-z0-9]/gi, "_")}`;
		await saveEmailToSharePoint(emailData, folderPath);

		// Update melding status
		await dbUpdate("onderhoud", meldingId, { status: "in-behandeling" });
		await loadAllData();
	} catch (error) {
		console.error("Error sending email:", error);
		showToast(`Fout bij versturen email: ${error.message}`, "error");
	}
}

// View onderhoud detail in side panel
function viewOnderhoudDetail(meldingId) {
	const melding = meldingen.find((m) => m.id === meldingId);
	if (!melding) return;

	const pand = panden.find((p) => p.id === melding.pandId);

	const enrichedMelding = {
		...melding,
		pandAdres: pand ? `${pand.adres}, ${pand.plaats}` : "Onbekend",
		pandType: pand?.type || "",
	};

	if (typeof showDetailPanel === "function") {
		showDetailPanel("onderhoud", enrichedMelding);
	}
}

// Create and send werkbon
async function createWerkbon(meldingId) {
	try {
		// Get melding details for preview
		const melding = meldingen.find((m) => m.id === meldingId);
		if (!melding) return;

		const pand = panden.find((p) => p.id === melding.pandId);

		// Show preview/confirm modal FIRST
		showWerkbonPreviewModal(meldingId, melding, pand);
	} catch (error) {
		console.error("Error showing werkbon preview:", error);
		showToast(`Fout bij voorbereiden werkbon: ${error.message}`, "error");
	}
}

// Show werkbon preview modal before creating
function showWerkbonPreviewModal(meldingId, melding, pand) {
	const modalHTML = `
        <div id="werkbonPreviewModal" class="modal show" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> Werkbon Aanmaken</h2>
                    <button class="close-btn" onclick="closeWerkbonPreviewModal()">&times;</button>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-bottom: 20px;">U staat op het punt een werkbon aan te maken voor:</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg> Pand:</strong> ${pand ? pand.adres : "Onbekend"}<br>
                        <strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> Werkzaamheden:</strong> ${melding.titel}<br>
                        <strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg> Prioriteit:</strong> ${melding.prioriteit}<br>
						${melding.kosten ? `<strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg> Geschatte kosten:</strong> €${Number.parseFloat(melding.kosten).toLocaleString("nl-NL")}<br>` : ""}
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Na het aanmaken kunt u de werkbon versturen, downloaden of printen.
                    </p>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeWerkbonPreviewModal()">
                        Annuleren
                    </button>
                    <button type="button" class="btn-primary" onclick="confirmCreateWerkbon('${sanitizeAttr(meldingId)}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M20 6 9 17l-5-5"/></svg> Werkbon Aanmaken
                    </button>
                </div>
            </div>
        </div>
    `;

	document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// Close preview modal
function closeWerkbonPreviewModal() {
	const modal = document.getElementById("werkbonPreviewModal");
	if (modal) modal.remove();
}

// Confirm and actually create werkbon
async function confirmCreateWerkbon(meldingId) {
	closeWerkbonPreviewModal();

	try {
		showLoading("Werkbon aanmaken...");

		// NOW generate werkbon
		const werkbon = await generateWerkbon(meldingId);

		hideLoading();

		// Show send options modal
		showWerkbonSendModal(werkbon);
	} catch (error) {
		hideLoading();
		console.error("Error creating werkbon:", error);
		showToast(`Fout bij aanmaken werkbon: ${error.message}`, "error");
	}
}

// View existing werkbon
async function viewExistingWerkbon(werkbonId) {
	try {
		// Redirect to werkbonnen page with hash to open detail
		window.location.href = `werkbonnen.html#${werkbonId}`;
	} catch (error) {
		console.error("Error viewing werkbon:", error);
		showToast("Fout bij openen werkbon", "error");
	}
}

// Show werkbon send options modal
function showWerkbonSendModal(werkbon) {
	const modalHTML = `
        <div id="werkbonSendModal" class="modal show" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> Werkbon ${werkbon.werkbonNummer}</h2>
                    <button class="close-btn" onclick="closeWerkbonSendModal()">&times;</button>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-bottom: 20px;">Werkbon succesvol aangemaakt. Selecteer de ontvangers:</p>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="sendToHuurder" ${werkbon.huurderEmail ? "checked" : "disabled"}>
							<span>Verstuur naar huurder ${werkbon.huurderEmail ? `(${werkbon.huurderEmail})` : "(geen email)"}</span>
                        </label>
                        ${
													werkbon.huurderId
														? `
                        <div style="margin-left: 30px; margin-top: 8px;">
                            <a href="huurders.html#${werkbon.huurderId}" target="_blank" style="color: var(--primary-color); font-size: 13px; text-decoration: none;">
                                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Bekijk huurder informatie <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </a>
                        </div>
                        `
														: werkbon.huurderNaam
															? `
                        <div style="margin-left: 30px; margin-top: 8px; color: #999; font-size: 13px;">
                            Huurder: ${werkbon.huurderNaam} (geen email beschikbaar)
                        </div>
                        `
															: `
                        <div style="margin-left: 30px; margin-top: 8px; color: #999; font-size: 13px;">
                            <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg> Geen huurder gekoppeld aan dit pand
                        </div>
                        `
												}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="sendToOnderhoudsBedrijf">
                            <span>Verstuur naar onderhoudsbedrijf</span>
                        </label>
                        <div id="onderhoudsBedrijfFields" style="margin-top: 10px; padding-left: 30px; display: none;">
                            <div class="form-group">
                                <label>Bedrijfsnaam *</label>
                                <input type="text" id="onderhoudsBedrijf" placeholder="Naam onderhoudsbedrijf">
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="onderhoudsBedrijfEmail" placeholder="email@onderhoudsbedrijf.nl">
                            </div>
                            <div class="form-group">
                                <label>Contactpersoon</label>
                                <input type="text" id="contactPersoon" placeholder="Naam contactpersoon">
                            </div>
                            <div class="form-group">
                                <label>Telefoon</label>
                                <input type="tel" id="contactTelefoon" placeholder="06-12345678">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="downloadWerkbon('${sanitizeAttr(werkbon.id)}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg> Download
                    </button>
                    <button type="button" class="btn-secondary" onclick="printWerkbon('${sanitizeAttr(werkbon.id)}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Print
                    </button>
                    <button type="button" class="btn-primary" onclick="sendWerkbonFromModal('${sanitizeAttr(werkbon.id)}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg> Verstuur
                    </button>
                </div>
            </div>
        </div>
    `;

	// Add modal to page
	const existingModal = document.getElementById("werkbonSendModal");
	if (existingModal) {
		existingModal.remove();
	}

	document.body.insertAdjacentHTML("beforeend", modalHTML);

	// Toggle onderhoudsbedrijf fields
	document
		.getElementById("sendToOnderhoudsBedrijf")
		.addEventListener("change", (e) => {
			document.getElementById("onderhoudsBedrijfFields").style.display = e
				.target.checked
				? "block"
				: "none";
		});
}

// Close werkbon send modal
function closeWerkbonSendModal() {
	const modal = document.getElementById("werkbonSendModal");
	if (modal) {
		modal.remove();
	}
	// Reload data to show updated status
	loadAllData();
	showToast("Werkbon succesvol aangemaakt", "success");
}

// Send werkbon from modal
async function sendWerkbonFromModal(werkbonId) {
	try {
		const sendToHuurder = document.getElementById("sendToHuurder").checked;
		const sendToOnderhoudsBedrijf = document.getElementById(
			"sendToOnderhoudsBedrijf",
		).checked;

		if (!sendToHuurder && !sendToOnderhoudsBedrijf) {
			showToast("Selecteer minimaal één ontvanger", "error");
			return;
		}

		const options = {
			sendToHuurder,
			sendToOnderhoudsBedrijf,
			saveToSharePoint: true,
		};

		if (sendToOnderhoudsBedrijf) {
			const bedrijfNaam = document
				.getElementById("onderhoudsBedrijf")
				.value.trim();
			const bedrijfEmail = document
				.getElementById("onderhoudsBedrijfEmail")
				.value.trim();

			if (!bedrijfNaam || !bedrijfEmail) {
				showToast("Vul bedrijfsnaam en email in", "error");
				return;
			}

			options.onderhoudsBedrijfEmail = bedrijfEmail;

			// Update werkbon with company info
			await dbUpdate("werkbonnen", werkbonId, {
				onderhoudsBedrijf: bedrijfNaam,
				contactPersoon:
					document.getElementById("contactPersoon").value.trim() || null,
				contactTelefoon:
					document.getElementById("contactTelefoon").value.trim() || null,
			});
		}

		showLoading("Werkbon versturen...");

		await sendWerkbon(werkbonId, options);

		hideLoading();
		closeWerkbonSendModal();
	} catch (error) {
		hideLoading();
		console.error("Error sending werkbon:", error);
		showToast(`Fout bij versturen werkbon: ${error.message}`, "error");
	}
}

window.editMelding = editMelding;
window.deleteMelding = deleteMelding;
window.sendConfirmationEmail = sendConfirmationEmail;
window.viewOnderhoudDetail = viewOnderhoudDetail;
window.createWerkbon = createWerkbon;
window.closeWerkbonPreviewModal = closeWerkbonPreviewModal;
window.confirmCreateWerkbon = confirmCreateWerkbon;
window.viewExistingWerkbon = viewExistingWerkbon;
window.closeWerkbonSendModal = closeWerkbonSendModal;
window.sendWerkbonFromModal = sendWerkbonFromModal;
