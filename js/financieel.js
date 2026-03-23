// Financieel Management

let transacties = [];
let contracten = [];
let onderhoud = [];
let currentYear = new Date().getFullYear();

function getAppSettings() {
	try {
		return JSON.parse(localStorage.getItem("appSettings") || "null") || {};
	} catch (error) {
		console.warn("Failed to parse appSettings from localStorage", error);
		return {};
	}
}

async function getReminderRecipient(transactie) {
	if (transactie.huurderEmail) {
		return {
			email: transactie.huurderEmail,
			naam: transactie.huurderNaam || transactie.debiteurNaam || "Relatie",
			huurder: {
				voornaam:
					transactie.huurderNaam || transactie.debiteurNaam || "Relatie",
			},
		};
	}

	if (!transactie.contractId) {
		return null;
	}

	const contract = contracten.find((item) => item.id === transactie.contractId);
	if (!contract?.huurderId) {
		return null;
	}

	const huurder = await dbGet("huurders", contract.huurderId);
	if (!huurder?.email) {
		return null;
	}

	return {
		email: huurder.email,
		naam:
			huurder.voornaam ||
			huurder.bedrijfsnaam ||
			huurder.achternaam ||
			"Relatie",
		huurder,
		contract,
	};
}

const modal = document.getElementById("transactieModal");
const addInkomstBtn = document.getElementById("addInkomstBtn");
const addUitgaveBtn = document.getElementById("addUitgaveBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const transactieForm = document.getElementById("transactieForm");
const jaarFilter = document.getElementById("jaarFilter");

// Load all data
async function loadAllData() {
	try {
		showLoading("Financiële gegevens laden...");
		const [transactiesData, contractenData, onderhoudData] = await Promise.all([
			dbGetAll("transacties"),
			dbGetAll("contracten"),
			dbGetAll("onderhoud"),
		]);

		// Filter transacties for current year
		transacties = transactiesData.filter((t) =>
			t.datum?.startsWith(currentYear.toString()),
		);
		contracten = contractenData;
		onderhoud = onderhoudData;

		calculateStatistics();
		renderMaandelijksOverzicht();
		renderRecenteTransacties();
		renderBudgets();
		renderFacturen();
		renderHerinneringen();
		renderFinancialChart();
		hideLoading();
	} catch (error) {
		console.error("Error loading data:", error);
		hideLoading();
		showToast("Fout bij het laden van financiële gegevens", "error");
	}
}

// Calculate statistics
function calculateStatistics() {
	// Filter transacties for current year
	const yearTransacties = transacties.filter((t) => {
		return t.datum?.startsWith(currentYear.toString());
	});

	const inkomsten = yearTransacties
		.filter((t) => t.type === "inkomst")
		.reduce((sum, t) => sum + Number.parseFloat(t.bedrag || 0), 0);

	const uitgaven = yearTransacties
		.filter((t) => t.type === "uitgave")
		.reduce((sum, t) => sum + Number.parseFloat(t.bedrag || 0), 0);

	const netto = inkomsten - uitgaven;

	// Maandelijkse huur from active contracts
	const now = new Date();
	const actieveContracten = contracten.filter((c) => {
		const eindDatum = new Date(c.einddatum);
		return eindDatum > now;
	});
	const maandelijks = actieveContracten.reduce(
		(sum, c) => sum + Number.parseFloat(c.huurprijs || 0),
		0,
	);

	document.getElementById("totaalInkomsten").textContent =
		`€${inkomsten.toLocaleString("nl-NL")}`;
	document.getElementById("inkomstenDetail").textContent = `${currentYear}`;

	document.getElementById("totaalUitgaven").textContent =
		`€${uitgaven.toLocaleString("nl-NL")}`;
	document.getElementById("uitgavenDetail").textContent = `${currentYear}`;

	document.getElementById("nettoResultaat").textContent =
		`€${netto.toLocaleString("nl-NL")}`;
	document.getElementById("resultaatDetail").textContent =
		netto >= 0 ? "Positief" : "Negatief";

	// Dynamically color the Netto icon: green = profit, red = loss
	const nettoIconEl = document.querySelector(
		".stat-card:nth-child(3) .stat-icon",
	);
	if (nettoIconEl) {
		nettoIconEl.classList.remove("blue", "green", "red");
		nettoIconEl.classList.add(netto >= 0 ? "green" : "red");
	}

	document.getElementById("maandelijks").textContent =
		`€${maandelijks.toLocaleString("nl-NL")}`;
	document.getElementById("maandDetail").textContent =
		`${actieveContracten.length} actieve contracten`;
}

// Render monthly overview
function renderMaandelijksOverzicht() {
	const tbody = document.getElementById("maandelijksTableBody");
	const maanden = [
		"Januari",
		"Februari",
		"Maart",
		"April",
		"Mei",
		"Juni",
		"Juli",
		"Augustus",
		"September",
		"Oktober",
		"November",
		"December",
	];

	document.getElementById("currentYear").textContent = currentYear;

	const rows = maanden
		.map((maand, index) => {
			const maandNummer = (index + 1).toString().padStart(2, "0");
			const maandTransacties = transacties.filter((t) =>
				t.datum?.startsWith(`${currentYear}-${maandNummer}`),
			);

			const huurInkomsten = maandTransacties
				.filter((t) => t.type === "inkomst" && t.categorie === "huur")
				.reduce((sum, t) => sum + Number.parseFloat(t.bedrag || 0), 0);

			const onderhoudsKosten = maandTransacties
				.filter((t) => t.type === "uitgave" && t.categorie === "onderhoud")
				.reduce((sum, t) => sum + Number.parseFloat(t.bedrag || 0), 0);

			const overigeKosten = maandTransacties
				.filter((t) => t.type === "uitgave" && t.categorie !== "onderhoud")
				.reduce((sum, t) => sum + Number.parseFloat(t.bedrag || 0), 0);

			const netto = huurInkomsten - onderhoudsKosten - overigeKosten;

			return `
            <tr>
                <td>${maand}</td>
                <td>€${huurInkomsten.toLocaleString("nl-NL")}</td>
                <td>€${onderhoudsKosten.toLocaleString("nl-NL")}</td>
                <td>€${overigeKosten.toLocaleString("nl-NL")}</td>
                <td style="font-weight: 600; color: ${netto >= 0 ? "var(--success-color)" : "var(--danger-color)"}">
                    €${netto.toLocaleString("nl-NL")}
                </td>
            </tr>
        `;
		})
		.join("");

	tbody.innerHTML = rows;
}

// Render recent transactions
function renderRecenteTransacties() {
	const recenteInkomsten = transacties
		.filter((t) => t.type === "inkomst")
		.sort((a, b) => new Date(b.datum) - new Date(a.datum))
		.slice(0, 5);

	const recenteUitgaven = transacties
		.filter((t) => t.type === "uitgave")
		.sort((a, b) => new Date(b.datum) - new Date(a.datum))
		.slice(0, 5);

	// Render inkomsten
	const inkomstenContainer = document.getElementById("recenteInkomsten");
	if (recenteInkomsten.length === 0) {
		inkomstenContainer.innerHTML =
			'<p class="empty-state">Geen recente inkomsten</p>';
	} else {
		inkomstenContainer.innerHTML = recenteInkomsten
			.map((t) => {
				const s = sanitizeHTML;
				return `
            <div class="list-item" onclick="viewTransactieDetail('${t.id}')" style="padding: 12px 0; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>${s(t.omschrijving || t.beschrijving)}</strong>
                        <p style="font-size: 12px; color: var(--text-muted);">
                            ${new Date(t.datum).toLocaleDateString("nl-NL")}
                        </p>
                    </div>
                    <strong style="color: var(--success-color);">€${Number.parseFloat(t.bedrag).toLocaleString("nl-NL")}</strong>
                </div>
            </div>
        `;
			})
			.join("");
	}

	// Render uitgaven
	const uitgavenContainer = document.getElementById("recenteUitgaven");
	if (recenteUitgaven.length === 0) {
		uitgavenContainer.innerHTML =
			'<p class="empty-state">Geen recente uitgaven</p>';
	} else {
		uitgavenContainer.innerHTML = recenteUitgaven
			.map((t) => {
				const s = sanitizeHTML;
				return `
            <div class="list-item" onclick="viewTransactieDetail('${t.id}')" style="padding: 12px 0; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>${s(t.omschrijving || t.beschrijving)}</strong>
                        <p style="font-size: 12px; color: var(--text-muted);">
                            ${new Date(t.datum).toLocaleDateString("nl-NL")}
                        </p>
                    </div>
                    <strong style="color: var(--danger-color);">€${Number.parseFloat(t.bedrag).toLocaleString("nl-NL")}</strong>
                </div>
            </div>
        `;
			})
			.join("");
	}
}

// Open modal for new transaction
addInkomstBtn.addEventListener("click", () => {
	openTransactieModal("inkomst");
});

addUitgaveBtn.addEventListener("click", () => {
	openTransactieModal("uitgave");
});

function openTransactieModal(type) {
	document.getElementById("modalTitle").textContent =
		type === "inkomst" ? "Nieuwe Inkomst" : "Nieuwe Uitgave";
	transactieForm.reset();
	document.getElementById("transactieId").value = "";
	document.getElementById("transactieType").value = type;
	document.getElementById("datum").value = new Date()
		.toISOString()
		.split("T")[0];
	modal.classList.add("show");
}

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

// Save transaction
transactieForm.addEventListener("submit", async (e) => {
	e.preventDefault();

	const transactieData = {
		type: document.getElementById("transactieType").value,
		beschrijving: document.getElementById("beschrijving").value.trim(),
		bedrag: Number.parseFloat(document.getElementById("bedrag").value),
		datum: document.getElementById("datum").value,
		categorie: document.getElementById("categorie").value,
		budgetType: document.getElementById("budgetType").value || "regulier",
		betalingstermijn:
			Number.parseInt(document.getElementById("betalingstermijn").value) || 30,
		factuurStatus: document.getElementById("factuurStatus").value || "open",
		notities: document.getElementById("notities").value.trim(),
	};

	// Validate bedrag is positive
	if (transactieData.bedrag <= 0) {
		showToast("Bedrag moet een positief getal zijn", "error");
		return;
	}

	// Validate type
	if (!["inkomst", "uitgave"].includes(transactieData.type)) {
		showToast("Ongeldig transactietype", "error");
		return;
	}

	// Validate categorie
	const validCategories = [
		"huur",
		"onderhoud",
		"verzekering",
		"administratie",
		"belasting",
		"overig",
	];
	if (
		transactieData.categorie &&
		!validCategories.includes(transactieData.categorie)
	) {
		showToast("Ongeldige categorie geselecteerd", "error");
		return;
	}

	const transactieId = document.getElementById("transactieId").value;

	try {
		if (transactieId) {
			await dbUpdate("transacties", transactieId, transactieData);
			showToast("Transactie succesvol bijgewerkt", "success");
		} else {
			await dbAdd("transacties", transactieData);
			showToast("Transactie succesvol toegevoegd", "success");
		}

		closeModalWindow();
		await loadAllData();
	} catch (error) {
		console.error("Error saving transaction:", error);
		hideLoading();
		showToast("Fout bij het opslaan van de transactie", "error");
	}
});

// Year filter
jaarFilter.addEventListener("change", async (e) => {
	currentYear = Number.parseInt(e.target.value);
	await loadAllData();
});

// View transactie detail in side panel
function viewTransactieDetail(transactieId) {
	const transactie = transacties.find((t) => t.id === transactieId);
	if (!transactie) return;

	if (typeof showDetailPanel === "function") {
		showDetailPanel("transactie", transactie);
	}
}

window.viewTransactieDetail = viewTransactieDetail;

// Edit transactie (open modal with pre-filled data)
function editTransactie(id) {
	const transactie = transacties.find((t) => t.id === id);
	if (!transactie) return;

	document.getElementById("modalTitle").textContent =
		transactie.type === "inkomst" ? "Inkomst Bewerken" : "Uitgave Bewerken";
	document.getElementById("transactieId").value = transactie.id;
	document.getElementById("transactieType").value = transactie.type;
	document.getElementById("beschrijving").value =
		transactie.beschrijving || transactie.omschrijving || "";
	document.getElementById("bedrag").value = transactie.bedrag;
	document.getElementById("datum").value = transactie.datum;
	document.getElementById("categorie").value = transactie.categorie || "";
	document.getElementById("budgetType").value =
		transactie.budgetType || "regulier";
	document.getElementById("betalingstermijn").value =
		transactie.betalingstermijn || "30";
	document.getElementById("factuurStatus").value =
		transactie.factuurStatus || "open";
	document.getElementById("notities").value = transactie.notities || "";
	modal.classList.add("show");
}

// Delete transactie
async function deleteTransactie(id) {
	const confirmed = await showConfirm(
		"Weet u zeker dat u deze transactie wilt verwijderen?",
		"Transactie verwijderen",
	);
	if (!confirmed) return;

	try {
		showLoading("Transactie verwijderen...");
		await dbDelete("transacties", id);
		showToast("Transactie succesvol verwijderd", "success");
		await loadAllData();
	} catch (error) {
		console.error("Error deleting transactie:", error);
		hideLoading();
		showToast("Fout bij het verwijderen van de transactie", "error");
	}
}

window.editTransactie = editTransactie;
window.deleteTransactie = deleteTransactie;

// Chart.js financial visualization
let financialChartInstance = null;

function renderFinancialChart() {
	const canvas = document.getElementById("financialChart");
	if (!canvas || typeof Chart === "undefined") return;

	const maanden = [
		"Jan",
		"Feb",
		"Mrt",
		"Apr",
		"Mei",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Okt",
		"Nov",
		"Dec",
	];

	const inkomstenData = [];
	const uitgavenData = [];
	const nettoData = [];

	maanden.forEach((_, index) => {
		const maandNummer = (index + 1).toString().padStart(2, "0");
		const maandTransacties = transacties.filter((t) =>
			t.datum?.startsWith(`${currentYear}-${maandNummer}`),
		);

		const inkomsten = maandTransacties
			.filter((t) => t.type === "inkomst")
			.reduce((sum, t) => sum + Number.parseFloat(t.bedrag || 0), 0);
		const uitgaven = maandTransacties
			.filter((t) => t.type === "uitgave")
			.reduce((sum, t) => sum + Number.parseFloat(t.bedrag || 0), 0);

		inkomstenData.push(inkomsten);
		uitgavenData.push(uitgaven);
		nettoData.push(inkomsten - uitgaven);
	});

	if (financialChartInstance) {
		financialChartInstance.destroy();
	}

	financialChartInstance = new Chart(canvas, {
		type: "bar",
		data: {
			labels: maanden,
			datasets: [
				{
					label: "Inkomsten",
					data: inkomstenData,
					backgroundColor: "rgba(34, 139, 34, 0.7)",
					borderColor: "rgba(34, 139, 34, 1)",
					borderWidth: 1,
					borderRadius: 4,
				},
				{
					label: "Uitgaven",
					data: uitgavenData,
					backgroundColor: "rgba(220, 53, 69, 0.7)",
					borderColor: "rgba(220, 53, 69, 1)",
					borderWidth: 1,
					borderRadius: 4,
				},
				{
					label: "Netto",
					data: nettoData,
					type: "line",
					borderColor: "rgba(30, 58, 95, 1)",
					backgroundColor: "rgba(30, 58, 95, 0.1)",
					borderWidth: 2,
					pointBackgroundColor: "rgba(30, 58, 95, 1)",
					pointRadius: 4,
					fill: true,
					tension: 0.3,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: "top",
					labels: { usePointStyle: true, padding: 20 },
				},
				tooltip: {
					callbacks: {
						label: (context) =>
							`${context.dataset.label}: €${context.parsed.y.toLocaleString("nl-NL")}`,
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						callback: (value) => `€${value.toLocaleString("nl-NL")}`,
					},
				},
			},
		},
	});
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
	try {
		await ensureAuthenticated();
		jaarFilter.value = currentYear;
		await loadAllData();
	} catch (error) {
		console.error("Initialization error:", error);
	}
});

function renderBudgets() {
	const tbody = document.getElementById("budgetsTableBody");
	if (!tbody) return;

	const budgets = {
		opex: { naam: "Reguliere exploitatie (OPEX)", totaal: 50000, verbruikt: 0 },
		capex: { naam: "Investeringen (CAPEX)", totaal: 120000, verbruikt: 0 },
		regulier: { naam: "Regulier Beheer", totaal: 30000, verbruikt: 0 },
	};

	// Calculate consumed based on transacties type
	for (const t of transacties.filter(
		(transactie) => transactie.type === "uitgave",
	)) {
		const bt = t.budgetType || "regulier";
		if (budgets[bt]) {
			budgets[bt].verbruikt += Number.parseFloat(t.bedrag || 0);
		}
	}

	const rows = Object.keys(budgets).map((key) => {
		const b = budgets[key];
		const status = b.verbruikt > b.totaal ? "Overschreden" : "Binnen Budget";
		const statusColor =
			b.verbruikt > b.totaal ? "var(--danger-color)" : "var(--success-color)";
		return `
      <tr>
        <td>${sanitizeHTML(b.naam)}</td>
        <td>\u20AC${b.totaal.toLocaleString("nl-NL")}</td>
        <td>\u20AC${b.verbruikt.toLocaleString("nl-NL")}</td>
        <td style="color: ${statusColor}; font-weight: 600;">${status}</td>
      </tr>
    `;
	});

	tbody.innerHTML = rows.join("");
}

function renderFacturen() {
	const tbody = document.getElementById("facturenTableBody");
	if (!tbody) return;

	if (transacties.length === 0) {
		tbody.innerHTML =
			'<tr><td colspan="6" class="empty-state">Geen facturen geregistreerd</td></tr>';
		return;
	}

	// Sort on date desc
	const sorted = [...transacties].sort(
		(a, b) => new Date(b.datum) - new Date(a.datum),
	);

	tbody.innerHTML = sorted
		.map((t) => {
			const s = sanitizeHTML;
			const status = t.factuurStatus || "open";
			const statusColors = {
				open: "#f59e0b",
				betaald: "var(--success-color)",
				te_laat: "var(--danger-color)",
				geannuleerd: "#9ca3af",
			};
			const sColor = statusColors[status] || "var(--text-color)";
			const term = t.betalingstermijn || 30;

			return `
      <tr onclick="viewTransactieDetail('${sanitizeAttr(t.id)}')" style="cursor: pointer;">
        <td>${s(t.factuurNummer || "-")}</td>
        <td>${s(t.beschrijving)}</td>
        <td>${new Date(t.datum).toLocaleDateString("nl-NL")}</td>
        <td style="font-weight: 600; color: ${sColor};">\u20AC${Number.parseFloat(t.bedrag || 0).toLocaleString("nl-NL")}</td>
        <td>${term} dagen</td>
        <td><span style="background: ${sColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; text-transform: capitalize;">${s(status)}</span></td>
      </tr>
    `;
		})
		.join("");
}

// ============================================
// PAYMENT REMINDERS (Herinneringen)
// ============================================

function renderHerinneringen() {
	const container = document.getElementById("herinneringenContainer");
	if (!container) return;

	const now = new Date();

	// Find overdue invoices: open status, past payment term
	const overdue = transacties
		.filter((t) => {
			if (t.factuurStatus !== "open") return false;
			const term = t.betalingstermijn || 30;
			const dueDate = new Date(t.datum);
			dueDate.setDate(dueDate.getDate() + term);
			return dueDate < now;
		})
		.map((t) => {
			const term = t.betalingstermijn || 30;
			const dueDate = new Date(t.datum);
			dueDate.setDate(dueDate.getDate() + term);
			const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
			return { ...t, dueDate, daysOverdue };
		})
		.sort((a, b) => b.daysOverdue - a.daysOverdue);

	if (overdue.length === 0) {
		container.innerHTML =
			'<p class="empty-state">Geen openstaande herinneringen — alle facturen zijn op tijd.</p>';
		return;
	}

	const s = sanitizeHTML;
	container.innerHTML = overdue
		.map(
			(t) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(239,68,68,0.06); border-left: 3px solid var(--danger-color); border-radius: 8px; margin-bottom: 8px;">
      <div>
        <strong>${s(t.beschrijving)}</strong>
        <div style="font-size: 13px; color: var(--text-secondary);">
          ${s(t.factuurNummer || "Geen factuurnr.")} · Vervaldatum: ${t.dueDate.toLocaleDateString("nl-NL")} · <span style="color: var(--danger-color); font-weight: 600;">${t.daysOverdue} dagen te laat</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <strong style="font-size: 16px;">€${Number.parseFloat(t.bedrag).toLocaleString("nl-NL")}</strong>
        ${
					typeof sendEmail === "function"
						? `<button class="btn-secondary" onclick="sendPaymentReminder('${sanitizeAttr(t.id)}')" style="font-size: 12px; padding: 4px 12px;">Herinnering</button>`
						: ""
				}
      </div>
    </div>
  `,
		)
		.join("");
}

// Send payment reminder email
async function sendPaymentReminder(transactieId) {
	const t = transacties.find((x) => x.id === transactieId);
	if (!t) return;

	if (typeof isMicrosoftSignedIn === "function" && !isMicrosoftSignedIn()) {
		showToast(
			"Meld u aan bij Microsoft 365 om herinneringen te versturen",
			"warning",
		);
		return;
	}

	try {
		const term = t.betalingstermijn || 30;
		const dueDate = new Date(t.datum);
		dueDate.setDate(dueDate.getDate() + term);
		const recipient = await getReminderRecipient(t);

		if (!recipient) {
			showToast(
				"Geen ontvanger gevonden. Koppel deze factuur aan een contract of voeg een huurder-email toe.",
				"warning",
			);
			return;
		}

		const settings = getAppSettings();
		const monthLabel = dueDate.toLocaleDateString("nl-NL", {
			month: "long",
			year: "numeric",
		});
		const reminderEmail = fillEmailTemplate("huur_herinnering", {
			huurder: {
				voornaam: recipient.huurder?.voornaam || recipient.naam,
			},
			pand: {
				adres: t.adres || t.omschrijving || t.beschrijving || "uw pand",
			},
			contract: {
				huurprijs: Number.parseFloat(t.bedrag || 0).toLocaleString("nl-NL", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}),
			},
			maand: monthLabel,
		});

		showToast("Betalingsherinnering wordt verzonden...", "info");

		await sendEmail({
			to: [recipient.email],
			subject: reminderEmail.subject,
			body: reminderEmail.body,
			isHtml: reminderEmail.isHtml,
			saveToSharePoint: settings.email?.autoArchive !== false,
		});

		await dbUpdate("transacties", transactieId, {
			factuurStatus: "te_laat",
			reminderSentAt: new Date().toISOString(),
			reminderRecipient: recipient.email,
		});
		await loadAllData();
		showToast("Betalingsherinnering succesvol verstuurd", "success");
	} catch (error) {
		console.error("Error sending payment reminder:", error);
		showToast("Fout bij het versturen van de herinnering", "error");
	}
}

window.sendPaymentReminder = sendPaymentReminder;
