// Contracten Management

let contracten = [];
let huurders = [];
let panden = [];
let filteredContracten = [];

function getContractTypeLabel(contractType) {
  const labels = {
    residentieel: "Residentieel",
    commercieel: "Commercieel",
    algemeen: "Algemeen",
  };
  return labels[contractType] || capitalizeFirst(contractType || "onbekend");
}

function getContractFaseLabel(contractFase) {
  const labels = {
    concept: "Concept",
    actief: "Actief",
    opgezegd: "Opgezegd",
    beeindigd: "Beeindigd",
  };
  return labels[contractFase] || capitalizeFirst(contractFase || "onbekend");
}

const modal = document.getElementById("contractModal");
const addContractBtn = document.getElementById("addContractBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const contractForm = document.getElementById("contractForm");

// Load all data
async function loadAllData() {
  try {
    showLoading("Gegevens laden...");
    const [contractenData, huurdersData, pandenData] = await Promise.all([
      dbGetAll("contracten"),
      dbGetAll("huurders"),
      dbGetAll("panden"),
    ]);

    contracten = contractenData;
    // Sort by start date descending
    contracten.sort((a, b) =>
      (b.startdatum || "").localeCompare(a.startdatum || ""),
    );

    huurders = huurdersData;
    panden = pandenData;

    filteredContracten = [...contracten];
    populateDropdowns();
    renderContracten();
    hideLoading();
  } catch (error) {
    console.error("Error loading data:", error);
    hideLoading();
    showToast("Fout bij het laden van gegevens", "error");
  }
}

// Populate dropdown lists
function populateDropdowns() {
  const huurderSelect = document.getElementById("huurderId");
  const pandSelect = document.getElementById("pandId");

  huurderSelect.innerHTML =
    '<option value="">Selecteer huurder</option>' +
    huurders
      .map(
        (h) => `<option value="${h.id}">${h.voornaam} ${h.achternaam}</option>`,
      )
      .join("");

  pandSelect.innerHTML =
    '<option value="">Selecteer pand</option>' +
    panden
      .map((p) => `<option value="${p.id}">${p.adres}, ${p.plaats}</option>`)
      .join("");
}

// Render contracten table
function renderContracten() {
  const tbody = document.getElementById("contractenTableBody");

  if (filteredContracten.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty-state">Geen contracten gevonden</td></tr>';
    return;
  }

  tbody.innerHTML = filteredContracten
    .map((contract) => {
      const huurder = huurders.find((h) => h.id === contract.huurderId);
      const pand = panden.find((p) => p.id === contract.pandId);
      const status = getContractStatus(contract);
      const s = sanitizeHTML;

      return `
            <tr onclick="viewContractDetail('${contract.id}')" style="cursor: pointer;">
                <td>
                    <div><strong>${s(getContractTypeLabel(contract.contractType || "residentieel"))}</strong></div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${s(getContractFaseLabel(contract.contractFase || "concept"))}</div>
                </td>
                <td>${huurder ? `${s(huurder.voornaam)} ${s(huurder.achternaam)}` : "Onbekend"}</td>
                <td>${pand ? s(pand.adres) : "Onbekend"}</td>
                <td>${new Date(contract.startdatum).toLocaleDateString("nl-NL")}</td>
                <td>${new Date(contract.einddatum).toLocaleDateString("nl-NL")}</td>
                <td>€${parseFloat(contract.huurprijs).toLocaleString("nl-NL")}</td>
                <td><span class="status-badge ${s(status)}">${capitalizeFirst(s(status))}</span></td>
                <td>
                    ${
                      contract.documentUrl
                        ? `<a href="${s(contract.documentUrl)}" target="_blank" rel="noopener noreferrer" title="Document openen"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg></a>`
                        : '<span style="color: #999;" title="Geen document">-</span>'
                    }
                </td>
                <td class="actions" onclick="event.stopPropagation();">
                    ${
                      !isViewerRole()
                        ? `<span class="action-icon" onclick="emailContract('${contract.id}')" title="Email versturen"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></span>
                    <span class="action-icon" onclick="editContract('${contract.id}')" title="Bewerken"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg></span>
                    <span class="action-icon" onclick="deleteContract('${contract.id}')" title="Verwijderen"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></span>`
                        : ""
                    }
                </td>
            </tr>
        `;
    })
    .join("");
}

// Get contract status
function getContractStatus(contract) {
  const now = new Date();
  const eindDatum = new Date(contract.einddatum);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  if (eindDatum < now) return "verlopen";
  if (eindDatum <= threeMonthsFromNow) return "verloopt";
  return "actief";
}

// Open modal for new contract
addContractBtn.addEventListener("click", () => {
  document.getElementById("modalTitle").textContent = "Nieuw Contract";
  contractForm.reset();
  document.getElementById("contractId").value = "";
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

// Auto-fill huurprijs from pand
document.getElementById("pandId").addEventListener("change", (e) => {
  const pandId = e.target.value;
  const pand = panden.find((p) => p.id === pandId);
  if (pand && pand.huurprijs) {
    document.getElementById("huurprijs").value = pand.huurprijs;
  }
});

// Save contract
contractForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const contractData = {
    contractType: document.getElementById("contractType").value,
    contractFase: document.getElementById("contractFase").value,
    huurderId: document.getElementById("huurderId").value,
    pandId: document.getElementById("pandId").value,
    startdatum: document.getElementById("startdatum").value,
    einddatum: document.getElementById("einddatum").value,
    huurprijs: parseFloat(document.getElementById("huurprijs").value),
    borg: parseFloat(document.getElementById("borg").value) || 0,
    betalingsdatum:
      parseInt(document.getElementById("betalingsdatum").value) || 1,
    indexatieMethode: document.getElementById("indexatieMethode").value || null,
    waarborgType: document.getElementById("waarborgType").value || null,
    contractReferentie:
      document.getElementById("contractReferentie").value.trim() || null,
    voorwaarden: document.getElementById("voorwaarden").value.trim(),
  };

  const validContractTypes = ["residentieel", "commercieel", "algemeen"];
  const validContractFasen = ["concept", "actief", "opgezegd", "beeindigd"];
  if (!validContractTypes.includes(contractData.contractType)) {
    showToast("Kies een geldig contracttype", "error");
    return;
  }
  if (!validContractFasen.includes(contractData.contractFase)) {
    showToast("Kies een geldige contractfase", "error");
    return;
  }

  // Validate einddatum is after startdatum
  if (new Date(contractData.einddatum) <= new Date(contractData.startdatum)) {
    showToast("Einddatum moet na de startdatum liggen", "error");
    return;
  }

  // Validate huurprijs is positive
  if (contractData.huurprijs <= 0) {
    showToast("Huurprijs moet een positief bedrag zijn", "error");
    return;
  }

  // Validate borg is not negative
  if (contractData.borg < 0) {
    showToast("Borgsom kan niet negatief zijn", "error");
    return;
  }

  // Validate betalingsdatum (1-28)
  if (contractData.betalingsdatum < 1 || contractData.betalingsdatum > 28) {
    showToast("Betalingsdatum moet tussen 1 en 28 liggen", "error");
    return;
  }

  const contractId = document.getElementById("contractId").value;

  try {
    showLoading(contractId ? "Contract bijwerken..." : "Contract opslaan...");
    if (contractId) {
      await dbUpdate("contracten", contractId, contractData);
      showToast("Contract succesvol bijgewerkt", "success");
    } else {
      await dbAdd("contracten", contractData);
      // Update pand status to 'verhuurd'
      await dbUpdate("panden", contractData.pandId, { status: "verhuurd" });
      showToast("Contract succesvol toegevoegd", "success");
    }

    closeModalWindow();
    await loadAllData();
  } catch (error) {
    console.error("Error saving contract:", error);
    hideLoading();
    showToast("Fout bij het opslaan van het contract", "error");
  }
});

// Edit contract
async function editContract(id) {
  const contract = contracten.find((c) => c.id === id);
  if (!contract) return;

  document.getElementById("modalTitle").textContent = "Contract Bewerken";
  document.getElementById("contractId").value = contract.id;
  document.getElementById("contractType").value =
    contract.contractType || "residentieel";
  document.getElementById("contractFase").value =
    contract.contractFase || "concept";
  document.getElementById("huurderId").value = contract.huurderId;
  document.getElementById("pandId").value = contract.pandId;
  document.getElementById("startdatum").value = contract.startdatum;
  document.getElementById("einddatum").value = contract.einddatum;
  document.getElementById("huurprijs").value = contract.huurprijs;
  document.getElementById("borg").value = contract.borg || "";
  document.getElementById("betalingsdatum").value =
    contract.betalingsdatum || 1;
  document.getElementById("indexatieMethode").value =
    contract.indexatieMethode || "";
  document.getElementById("waarborgType").value = contract.waarborgType || "";
  document.getElementById("contractReferentie").value =
    contract.contractReferentie || "";
  document.getElementById("voorwaarden").value = contract.voorwaarden || "";

  modal.classList.add("show");
}

// Delete contract
async function deleteContract(id) {
  const confirmed = await showConfirm(
    "Weet u zeker dat u dit contract wilt verwijderen?",
    "Contract verwijderen",
  );
  if (!confirmed) return;

  try {
    showLoading("Contract verwijderen...");
    const contract = contracten.find((c) => c.id === id);
    await dbDelete("contracten", id);

    // Update pand status to 'beschikbaar' if needed
    if (contract) {
      await dbUpdate("panden", contract.pandId, { status: "beschikbaar" });
    }

    showToast("Contract succesvol verwijderd", "success");
    await loadAllData();
  } catch (error) {
    console.error("Error deleting contract:", error);
    hideLoading();
    showToast("Fout bij het verwijderen van het contract", "error");
  }
}

// Filters
document
  .getElementById("contractFaseFilter")
  .addEventListener("change", applyFilters);
document
  .getElementById("statusFilter")
  .addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);

function applyFilters() {
  const contractFaseFilter =
    document.getElementById("contractFaseFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  filteredContracten = contracten.filter((contract) => {
    const status = getContractStatus(contract);
    const matchesFase =
      !contractFaseFilter ||
      (contract.contractFase || "concept") === contractFaseFilter;
    const matchesStatus = !statusFilter || status === statusFilter;

    const huurder = huurders.find((h) => h.id === contract.huurderId);
    const pand = panden.find((p) => p.id === contract.pandId);

    const matchesSearch =
      !searchTerm ||
      (huurder &&
        `${huurder.voornaam} ${huurder.achternaam}`
          .toLowerCase()
          .includes(searchTerm)) ||
      (pand && pand.adres.toLowerCase().includes(searchTerm)) ||
      (contract.contractReferentie || "").toLowerCase().includes(searchTerm) ||
      getContractTypeLabel(contract.contractType || "")
        .toLowerCase()
        .includes(searchTerm);

    return matchesFase && matchesStatus && matchesSearch;
  });

  renderContracten();
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

// Email contract to huurder
async function emailContract(contractId) {
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

    const contract = contracten.find((c) => c.id === contractId);
    if (!contract) return;

    const huurder = huurders.find((h) => h.id === contract.huurderId);
    const pand = panden.find((p) => p.id === contract.pandId);

    if (!huurder || !pand) {
      showToast("Huurder of pand gegevens ontbreken", "error");
      return;
    }

    // Fill template with data
    const emailData = fillEmailTemplate("huurcontract", {
      huurder: huurder,
      pand: pand,
      contract: contract,
    });

    emailData.to = [huurder.email];
    emailData.saveToSharePoint = true;

    // Send email with attachment if document exists
    if (contract.documentUrl) {
      const fileId = contract.sharepointFileId;
      if (fileId) {
        await sendEmailWithSharePointAttachment(emailData, fileId);
      } else {
        await sendEmail(emailData);
      }
    } else {
      await sendEmail(emailData);
    }

    showToast("Email succesvol verstuurd naar " + huurder.email, "success");

    // Save email to SharePoint Correspondentie folder
    const folderPath = `Huurders/${huurder.achternaam}_${huurder.voornaam}/Correspondentie`;
    await saveEmailToSharePoint(emailData, folderPath);
  } catch (error) {
    console.error("Error sending email:", error);
    showToast("Fout bij versturen email: " + error.message, "error");
  }
}

// View contract detail in side panel
function viewContractDetail(contractId) {
  const contract = contracten.find((c) => c.id === contractId);
  if (!contract) return;

  const huurder = huurders.find((h) => h.id === contract.huurderId);
  const pand = panden.find((p) => p.id === contract.pandId);

  const enrichedContract = {
    ...contract,
    huurderNaam: huurder
      ? `${huurder.voornaam} ${huurder.achternaam}`
      : "Onbekend",
    huurderEmail: huurder?.email || "",
    huurderTelefoon: huurder?.telefoon || "",
    pandAdres: pand ? `${pand.adres}, ${pand.plaats}` : "Onbekend",
    pandType: pand?.type || "",
    status: getContractStatus(contract),
    contractTypeLabel: getContractTypeLabel(
      contract.contractType || "residentieel",
    ),
    contractFaseLabel: getContractFaseLabel(contract.contractFase || "concept"),
  };

  if (typeof showDetailPanel === "function") {
    showDetailPanel("contract", enrichedContract);
  }
}

window.editContract = editContract;
window.deleteContract = deleteContract;
window.emailContract = emailContract;
window.viewContractDetail = viewContractDetail;
