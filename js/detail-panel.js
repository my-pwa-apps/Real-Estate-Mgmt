// Detail Panel - Universal detail viewer for all entities
// Provides a slide-in panel with comprehensive information

let currentDetailPanel = null;
let detailPanelAbortController = null;

/**
 * Show detail panel with entity information
 * @param {string} entityType - Type of entity (pand, huurder, contract, etc.)
 * @param {object} data - Entity data to display
 */
function showDetailPanel(entityType, data) {
	// Remove existing panel if any
	closeDetailPanel();

	// Create overlay
	const overlay = document.createElement("div");
	overlay.className = "detail-panel-overlay";
	overlay.id = "detailPanelOverlay";
	overlay.onclick = closeDetailPanel;

	// Create panel
	const panel = document.createElement("div");
	panel.className = "detail-panel";
	panel.id = "detailPanel";

	// Generate content based on entity type
	let content = "";
	switch (entityType) {
		case "pand":
			content = generatePandDetail(data);
			break;
		case "huurder":
			content = generateHuurderDetail(data);
			break;
		case "contract":
			content = generateContractDetail(data);
			break;
		case "onderhoud":
			content = generateOnderhoudDetail(data);
			break;
		case "transactie":
			content = generateTransactieDetail(data);
			break;
		case "werkbon":
			content = generateWerkbonDetail(data);
			break;
		default:
			content = generateGenericDetail(data);
	}

	panel.innerHTML = content;

	// Add to DOM
	document.body.appendChild(overlay);
	document.body.appendChild(panel);

	// Trigger animation
	setTimeout(() => {
		overlay.classList.add("show");
		panel.classList.add("show");
	}, 10);

	// Store reference
	currentDetailPanel = { panel, overlay, entityType, data };

	// Single AbortController owns all listeners attached for this panel
	// instance, so closeDetailPanel() can detach them in one call and
	// re-opening the panel never accumulates duplicate handlers.
	detailPanelAbortController = new AbortController();
	const { signal } = detailPanelAbortController;

	const closeBtn = document.getElementById("closePanelBtn");
	if (closeBtn) {
		closeBtn.addEventListener("click", closeDetailPanel, { signal });
	}

	// Trap focus inside the detail panel for accessibility
	if (typeof trapFocus === "function") {
		trapFocus(panel);
	}

	// Close on Escape key
	document.addEventListener(
		"keydown",
		(e) => {
			if (e.key === "Escape") closeDetailPanel();
		},
		{ signal },
	);
}

/**
 * Close detail panel
 */
function closeDetailPanel() {
	// Detach any listeners registered for the current panel instance
	if (detailPanelAbortController) {
		detailPanelAbortController.abort();
		detailPanelAbortController = null;
	}

	const panel = document.getElementById("detailPanel");
	const overlay = document.getElementById("detailPanelOverlay");

	if (panel) {
		panel.classList.remove("show");
		if (overlay) overlay.classList.remove("show");

		setTimeout(() => {
			panel.remove();
			if (overlay) overlay.remove();
		}, 300);
	}

	currentDetailPanel = null;
}

/**
 * Generate Pand detail view
 */
function generatePandDetail(pand) {
	const s = sanitizeHTML;
	const objectSoortLabel = pand.objectSoort
		? capitalizeFirst(s(pand.objectSoort))
		: "Gebouw";
	return `
        <div class="detail-panel-header">
            <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg> Pand Details</h2>
            <button class="detail-panel-close" id="closePanelBtn"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg> Locatie</div>
                <div class="detail-row">
                    <div class="detail-label">Adres</div>
                    <div class="detail-value"><strong>${s(pand.adres)}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Postcode</div>
                    <div class="detail-value">${s(pand.postcode)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Plaats</div>
                    <div class="detail-value">${s(pand.plaats)}</div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"></path><path d="m18 15 4-4"></path><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"></path></svg> Eigenschappen</div>
                <div class="detail-row">
                    <div class="detail-label">Objectsoort</div>
                    <div class="detail-value"><strong>${objectSoortLabel}</strong></div>
                </div>
                ${
									pand.objectNummer
										? `
                <div class="detail-row">
                    <div class="detail-label">Objectnummer</div>
                    <div class="detail-value">${s(pand.objectNummer)}</div>
                </div>
                `
										: ""
								}
                ${
									pand.parentObjectAdres
										? `
                <div class="detail-row">
                    <div class="detail-label">Bovenliggend object</div>
                    <div class="detail-value">${s(pand.parentObjectAdres)}</div>
                </div>
                `
										: ""
								}
                <div class="detail-row">
                    <div class="detail-label">Type</div>
                    <div class="detail-value"><span class="status-badge ${s(pand.type)}">${pand.type === "bedrijfspand" ? "Bedrijfspand" : "Woning"}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${s(pand.status)}">${capitalizeFirst(s(pand.status))}</span></div>
                </div>
                ${
									pand.oppervlakte
										? `
                <div class="detail-row">
                    <div class="detail-label">Oppervlakte</div>
                    <div class="detail-value">${pand.oppervlakte} m²</div>
                </div>
                `
										: ""
								}
                ${
									pand.kamers
										? `
                <div class="detail-row">
                    <div class="detail-label">Kamers</div>
                    <div class="detail-value">${pand.kamers}</div>
                </div>
                `
										: ""
								}
                ${
									pand.bouwjaar
										? `
                <div class="detail-row">
                    <div class="detail-label">Bouwjaar</div>
                    <div class="detail-value">${pand.bouwjaar}</div>
                </div>
                `
										: ""
								}
                ${
									pand.energielabel
										? `
                <div class="detail-row">
                    <div class="detail-label">Energielabel</div>
                    <div class="detail-value"><strong>${s(pand.energielabel)}</strong></div>
                </div>
                `
										: ""
								}
                ${
									pand.bagId
										? `
                <div class="detail-row">
                    <div class="detail-label">BAG ID</div>
                    <div class="detail-value">${s(pand.bagId)}</div>
                </div>
                `
										: ""
								}
            </div>

            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg> Financieel</div>
                <div class="detail-row">
                    <div class="detail-label">Huurprijs</div>
                    <div class="detail-value"><strong style="font-size: 18px; color: var(--primary-color);">€${Number.parseFloat(pand.huurprijs).toLocaleString("nl-NL")}</strong> / maand</div>
                </div>
                ${
									pand.streefhuur
										? `
                <div class="detail-row">
                    <div class="detail-label">Streefhuur</div>
                    <div class="detail-value">€${Number.parseFloat(pand.streefhuur).toLocaleString("nl-NL")} / maand</div>
                </div>
                `
										: ""
								}
            </div>

            ${
							pand.ownerNaam || pand.beheerderNaam
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m11 17 2 2a1 1 0 1 0 3-3"></path><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path><path d="m21 3 1 11h-2"></path><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"></path><path d="M3 4h8"></path></svg> Relaties</div>
                ${
									pand.ownerNaam
										? `
                <div class="detail-row">
                    <div class="detail-label">Eigenaar</div>
                    <div class="detail-value">${s(pand.ownerNaam)}</div>
                </div>
                `
										: ""
								}
                ${
									pand.beheerderNaam
										? `
                <div class="detail-row">
                    <div class="detail-label">Beheerder</div>
                    <div class="detail-value">${s(pand.beheerderNaam)}</div>
                </div>
                `
										: ""
								}
            </div>
            `
								: ""
						}

            ${
							pand.beschrijving
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"></path></svg> Beschrijving</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(pand.beschrijving)}</p>
            </div>
            `
								: ""
						}

            ${
							pand.createdAt
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg> Metadata</div>
                <div class="detail-row">
                    <div class="detail-label">Toegevoegd</div>
                    <div class="detail-value">${new Date(
											pand.createdAt,
										).toLocaleDateString("nl-NL", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}</div>
                </div>
            </div>
            `
								: ""
						}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" onclick="editPand('${pand.id}'); closeDetailPanel();">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg> Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Huurder detail view
 */
function generateHuurderDetail(huurder) {
	const s = sanitizeHTML;
	const title = huurder.bedrijfsnaam
		? `${s(huurder.bedrijfsnaam)} (${s(huurder.voornaam)} ${s(huurder.achternaam)})`
		: `${s(huurder.voornaam)} ${s(huurder.achternaam)}`;
	return `
        <div class="detail-panel-header">
            <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Relatie Details</h2>
            <button class="detail-panel-close" id="closePanelBtn"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Relatie Gegevens</div>
                <div class="detail-row">
                    <div class="detail-label">Naam</div>
                    <div class="detail-value"><strong>${title}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Type</div>
                    <div class="detail-value"><span class="status-badge">${s(huurder.relatieType || "Huurder")}</span></div>
                </div>
                ${
									huurder.iban
										? `
                <div class="detail-row">
                    <div class="detail-label">IBAN</div>
                    <div class="detail-value">${s(huurder.iban)}</div>
                </div>`
										: ""
								}
                ${
									huurder.kvkNummer
										? `
                <div class="detail-row">
                    <div class="detail-label">KVK Nummer</div>
                    <div class="detail-value">${s(huurder.kvkNummer)}</div>
                </div>`
										: ""
								}
                ${
									huurder.geboortedatum
										? `
                <div class="detail-row">
                    <div class="detail-label">Geboortedatum</div>
                    <div class="detail-value">${new Date(
											huurder.geboortedatum,
										).toLocaleDateString("nl-NL", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}</div>
                </div>
                `
										: ""
								}
            </div>

            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg> Contactgegevens</div>
                <div class="detail-row">
                    <div class="detail-label">Email</div>
                    <div class="detail-value"><a href="mailto:${s(huurder.email)}" style="color: var(--primary-color);">${s(huurder.email)}</a></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Telefoon</div>
                    <div class="detail-value"><a href="tel:${s(huurder.telefoon)}" style="color: var(--primary-color);">${s(huurder.telefoon)}</a></div>
                </div>
            </div>

            ${
							huurder.notities
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"></path></svg> Notities</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(huurder.notities)}</p>
            </div>
            `
								: ""
						}

            ${
							huurder.createdAt
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg> Metadata</div>
                <div class="detail-row">
                    <div class="detail-label">Toegevoegd</div>
                    <div class="detail-value">${new Date(
											huurder.createdAt,
										).toLocaleDateString("nl-NL", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}</div>
                </div>
            </div>
            `
								: ""
						}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" onclick="editHuurder('${huurder.id}'); closeDetailPanel();">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg> Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Contract detail view
 */
function generateContractDetail(contract) {
	const s = sanitizeHTML;
	return `
        <div class="detail-panel-header">
            <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> Contract Details</h2>
            <button class="detail-panel-close" id="closePanelBtn"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg> Contract Informatie</div>
                ${
									contract.contractTypeLabel
										? `
                <div class="detail-row">
                    <div class="detail-label">Contracttype</div>
                    <div class="detail-value">${s(contract.contractTypeLabel)}</div>
                </div>
                `
										: ""
								}
                ${
									contract.contractFaseLabel
										? `
                <div class="detail-row">
                    <div class="detail-label">Fase</div>
                    <div class="detail-value">${s(contract.contractFaseLabel)}</div>
                </div>
                `
										: ""
								}
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${s(contract.status)}">${capitalizeFirst(s(contract.status))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Startdatum</div>
                    <div class="detail-value">${new Date(contract.startdatum).toLocaleDateString("nl-NL")}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Einddatum</div>
                    <div class="detail-value">${new Date(contract.einddatum).toLocaleDateString("nl-NL")}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Huurprijs</div>
                    <div class="detail-value"><strong style="font-size: 18px; color: var(--primary-color);">€${Number.parseFloat(contract.huurprijs).toLocaleString("nl-NL")}</strong> / maand</div>
                </div>
                ${
									contract.borg || contract.borgsom
										? `
                <div class="detail-row">
                    <div class="detail-label">Borgsom</div>
                    <div class="detail-value">€${Number.parseFloat(contract.borg || contract.borgsom).toLocaleString("nl-NL")}</div>
                </div>
                `
										: ""
								}
                ${
									contract.indexatieMethode
										? `
                <div class="detail-row">
                    <div class="detail-label">Indexatiemethode</div>
                    <div class="detail-value">${s(contract.indexatieMethode)}</div>
                </div>
                `
										: ""
								}
                ${
									contract.waarborgType
										? `
                <div class="detail-row">
                    <div class="detail-label">Waarborgtype</div>
                    <div class="detail-value">${s(contract.waarborgType)}</div>
                </div>
                `
										: ""
								}
                ${
									contract.contractReferentie
										? `
                <div class="detail-row">
                    <div class="detail-label">Externe referentie</div>
                    <div class="detail-value">${s(contract.contractReferentie)}</div>
                </div>
                `
										: ""
								}
            </div>

            ${
							contract.voorwaarden || contract.opmerkingen
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"></path></svg> Voorwaarden</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(contract.voorwaarden || contract.opmerkingen)}</p>
            </div>
            `
								: ""
						}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" onclick="editContract('${contract.id}'); closeDetailPanel();">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg> Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Onderhoud detail view
 */
function generateOnderhoudDetail(onderhoud) {
	const s = sanitizeHTML;
	return `
        <div class="detail-panel-header">
            <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> Onderhoud Details</h2>
            <button class="detail-panel-close" id="closePanelBtn"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> Melding Informatie</div>
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${s(onderhoud.status)}">${capitalizeFirst(s(onderhoud.status))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Prioriteit</div>
                    <div class="detail-value"><span class="priority-badge ${s(onderhoud.prioriteit)}">${capitalizeFirst(s(onderhoud.prioriteit))}</span></div>
                </div>
                ${
									onderhoud.categorie
										? `
                <div class="detail-row">
                    <div class="detail-label">Categorie</div>
                    <div class="detail-value">${s(onderhoud.categorie)}</div>
                </div>
                `
										: ""
								}
                ${
									onderhoud.probleemCategorie
										? `
                <div class="detail-row">
                    <div class="detail-label">Probleemcategorie</div>
                    <div class="detail-value">${s(onderhoud.probleemCategorie)}</div>
                </div>
                `
										: ""
								}
                ${
									onderhoud.kostenCategorie
										? `
                <div class="detail-row">
                    <div class="detail-label">Kosten categorie</div>
                    <div class="detail-value">${s(onderhoud.kostenCategorie)}</div>
                </div>
                `
										: ""
								}
                ${
									onderhoud.datum
										? `
                <div class="detail-row">
                    <div class="detail-label">Datum</div>
                    <div class="detail-value">${new Date(onderhoud.datum).toLocaleDateString("nl-NL")}</div>
                </div>
                `
										: ""
								}
            </div>

            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"></path></svg> Beschrijving</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(onderhoud.beschrijving || "Geen beschrijving")}</p>
            </div>

            ${
							onderhoud.kosten
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg> Kosten</div>
                <div class="detail-row">
                    <div class="detail-label">Bedrag</div>
                    <div class="detail-value"><strong style="font-size: 18px; color: var(--primary-color);">€${Number.parseFloat(onderhoud.kosten).toLocaleString("nl-NL")}</strong></div>
                </div>
            </div>
            `
								: ""
						}

            ${
							onderhoud.uitvoerderNaam ||
							onderhoud.melderNaam ||
							onderhoud.externeReferentie
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg> Verwerking</div>
                ${
									onderhoud.uitvoerderNaam
										? `
                <div class="detail-row">
                    <div class="detail-label">Uitvoerder</div>
                    <div class="detail-value">${s(onderhoud.uitvoerderNaam)}</div>
                </div>
                `
										: ""
								}
                ${
									onderhoud.melderNaam
										? `
                <div class="detail-row">
                    <div class="detail-label">Melder</div>
                    <div class="detail-value">${s(onderhoud.melderNaam)}${onderhoud.melderContact ? ` (${s(onderhoud.melderContact)})` : ""}</div>
                </div>
                `
										: ""
								}
                ${
									onderhoud.externeReferentie
										? `
                <div class="detail-row">
                    <div class="detail-label">Externe referentie</div>
                    <div class="detail-value">${s(onderhoud.externeReferentie)}</div>
                </div>
                `
										: ""
								}
            </div>
            `
								: ""
						}

            ${
							Array.isArray(onderhoud.activiteitenLog) &&
							onderhoud.activiteitenLog.length > 0
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg> Activiteitenlog</div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                ${onderhoud.activiteitenLog
									.slice()
									.reverse()
									.map(
										(entry) => `
                    <div style="padding: 8px 12px; background: rgba(30,58,95,0.04); border-radius: 8px; border-left: 3px solid var(--primary-color); font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <strong>${s(entry.actie || "")}</strong>
                            <span style="color: var(--text-secondary); font-size: 12px;">${entry.datum ? new Date(entry.datum).toLocaleString("nl-NL") : ""}</span>
                        </div>
                        <div style="color: var(--text-secondary);">${s(entry.gebruiker || "")}</div>
                        ${entry.details ? `<div style="margin-top: 4px;">${s(entry.details)}</div>` : ""}
                    </div>`,
									)
									.join("")}
                </div>
            </div>
            `
								: ""
						}
        </div>
        <div class="detail-actions">
            ${
							!onderhoud.werkbonId
								? `
            <button class="btn-primary" onclick="createWerkbon('${onderhoud.id}'); closeDetailPanel();" style="background: var(--success-color);">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> Werkbon Aanmaken
            </button>
            `
								: `
            <button class="btn-primary" onclick="viewExistingWerkbon('${onderhoud.werkbonId}'); closeDetailPanel();" style="background: var(--info-color);">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg> Bekijk Werkbon
            </button>
            `
						}
            <button class="btn-primary" onclick="editMelding('${onderhoud.id}'); closeDetailPanel();">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg> Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Transactie detail view
 */
function generateTransactieDetail(transactie) {
	const s = sanitizeHTML;
	return `
        <div class="detail-panel-header">
            <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg> Transactie Details</h2>
            <button class="detail-panel-close" id="closePanelBtn"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg> Transactie Informatie</div>
                <div class="detail-row">
                    <div class="detail-label">Type</div>
                    <div class="detail-value"><span class="status-badge ${s(transactie.type)}">${capitalizeFirst(s(transactie.type))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Bedrag</div>
                    <div class="detail-value"><strong style="font-size: 20px; color: ${transactie.type === "inkomsten" ? "var(--success-color)" : "var(--danger-color)"};">${transactie.type === "inkomsten" ? "+" : "-"} €${Math.abs(Number.parseFloat(transactie.bedrag)).toLocaleString("nl-NL")}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Datum</div>
                    <div class="detail-value">${new Date(
											transactie.datum,
										).toLocaleDateString("nl-NL", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}</div>
                </div>
                ${
									transactie.categorie
										? `
                <div class="detail-row">
                    <div class="detail-label">Categorie</div>
                    <div class="detail-value">${s(transactie.categorie)}</div>
                </div>
                `
										: ""
								}
            </div>

            ${
							transactie.beschrijving
								? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"></path></svg> Beschrijving</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${s(transactie.beschrijving)}</p>
            </div>
            `
								: ""
						}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" onclick="editTransactie('${transactie.id}'); closeDetailPanel();">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg> Bewerken
            </button>
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

/**
 * Generate Werkbon detail view
 */
function generateWerkbonDetail(werkbon) {
	const s = sanitizeHTML;
	return `
        <div class="detail-panel-header">
            <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg> Werkbon ${s(werkbon.werkbonNummer)}</h2>
            <button class="detail-panel-close" id="closePanelBtn" aria-label="Sluiten"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title">Locatie</div>
                <div class="detail-row">
                    <div class="detail-label">Adres</div>
                    <div class="detail-value"><strong>${s(werkbon.pandAdres || "")}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Postcode</div>
                    <div class="detail-value">${s(werkbon.pandPostcode || "")}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Plaats</div>
                    <div class="detail-value">${s(werkbon.pandPlaats || "")}</div>
                </div>
            </div>
            ${
							werkbon.huurderNaam
								? `
            <div class="detail-section">
                <div class="detail-section-title">Huurder</div>
                <div class="detail-row">
                    <div class="detail-label">Naam</div>
                    <div class="detail-value">${s(werkbon.huurderNaam)}</div>
                </div>
                ${werkbon.huurderTelefoon ? `<div class="detail-row"><div class="detail-label">Telefoon</div><div class="detail-value">${s(werkbon.huurderTelefoon)}</div></div>` : ""}
                ${werkbon.huurderEmail ? `<div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">${s(werkbon.huurderEmail)}</div></div>` : ""}
            </div>`
								: ""
						}
            <div class="detail-section">
                <div class="detail-section-title">Werkzaamheden</div>
                <div class="detail-row">
                    <div class="detail-label">Titel</div>
                    <div class="detail-value"><strong>${s(werkbon.titel || "")}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Prioriteit</div>
                    <div class="detail-value"><span class="priority-badge ${s(werkbon.prioriteit || "")}">${capitalizeFirst(s(werkbon.prioriteit || ""))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${s(werkbon.status || "")}">${capitalizeFirst(s(werkbon.status || ""))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Beschrijving</div>
                    <div class="detail-value">${s(werkbon.beschrijving || "")}</div>
                </div>
            </div>
            ${
							werkbon.onderhoudsBedrijf
								? `
            <div class="detail-section">
                <div class="detail-section-title">Onderhoudsbedrijf</div>
                <div class="detail-row">
                    <div class="detail-label">Bedrijf</div>
                    <div class="detail-value">${s(werkbon.onderhoudsBedrijf)}</div>
                </div>
                ${werkbon.contactPersoon ? `<div class="detail-row"><div class="detail-label">Contact</div><div class="detail-value">${s(werkbon.contactPersoon)}</div></div>` : ""}
                ${werkbon.contactTelefoon ? `<div class="detail-row"><div class="detail-label">Telefoon</div><div class="detail-value">${s(werkbon.contactTelefoon)}</div></div>` : ""}
            </div>`
								: ""
						}
            <div class="detail-section">
                <div class="detail-section-title">Financieel</div>
                <div class="detail-row">
                    <div class="detail-label">Geschatte kosten</div>
                    <div class="detail-value">${formatCurrency(Number.parseFloat(werkbon.geschatteKosten || 0))}</div>
                </div>
                ${
									werkbon.werkelijkeKosten
										? `
                <div class="detail-row">
                    <div class="detail-label">Werkelijke kosten</div>
                    <div class="detail-value"><strong>${formatCurrency(Number.parseFloat(werkbon.werkelijkeKosten))}</strong></div>
                </div>`
										: ""
								}
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Data</div>
                <div class="detail-row">
                    <div class="detail-label">Aangemaakt</div>
                    <div class="detail-value">${werkbon.aanmaakDatum ? new Date(werkbon.aanmaakDatum).toLocaleDateString("nl-NL") : "-"}</div>
                </div>
                ${werkbon.verstuurdDatum ? `<div class="detail-row"><div class="detail-label">Verstuurd</div><div class="detail-value">${new Date(werkbon.verstuurdDatum).toLocaleDateString("nl-NL")}</div></div>` : ""}
                ${werkbon.geplanddatum ? `<div class="detail-row"><div class="detail-label">Gepland</div><div class="detail-value">${new Date(werkbon.geplanddatum).toLocaleDateString("nl-NL")}</div></div>` : ""}
                ${werkbon.uitgevoerdDatum ? `<div class="detail-row"><div class="detail-label">Uitgevoerd</div><div class="detail-value">${new Date(werkbon.uitgevoerdDatum).toLocaleDateString("nl-NL")}</div></div>` : ""}
            </div>
        </div>
        <div class="detail-actions">
            <button class="btn-secondary" onclick="downloadWerkbon('${sanitizeAttr(werkbon.id)}')">Download</button>
            <button class="btn-secondary" onclick="printWerkbon('${sanitizeAttr(werkbon.id)}')">Print</button>
            <button class="btn-primary" onclick="resendWerkbon('${sanitizeAttr(werkbon.id)}')">Opnieuw Versturen</button>
            <button class="btn-secondary" onclick="closeDetailPanel()">Sluiten</button>
        </div>
    `;
}

/**
 * Generate generic detail view
 */
function generateGenericDetail(data) {
	const s = sanitizeHTML;
	const rows = Object.entries(data)
		.filter(([key]) => key !== "id")
		.map(
			([key, value]) => `
            <div class="detail-row">
                <div class="detail-label">${capitalizeFirst(s(key))}</div>
                <div class="detail-value">${s(String(value))}</div>
            </div>
        `,
		)
		.join("");

	return `
        <div class="detail-panel-header">
            <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg> Details</h2>
            <button class="detail-panel-close" id="closePanelBtn"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                ${rows}
            </div>
        </div>
        <div class="detail-actions">
            <button class="btn-secondary" onclick="closeDetailPanel()">
                Sluiten
            </button>
        </div>
    `;
}

// Close panel on ESC key (legacy fallback removed - handled in showDetailPanel)
