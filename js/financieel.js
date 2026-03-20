// Financieel Management

let transacties = [];
let contracten = [];
let onderhoud = [];
let currentYear = new Date().getFullYear();

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
    transacties = transactiesData.filter(
      (t) => t.datum && t.datum.startsWith(currentYear.toString()),
    );
    contracten = contractenData;
    onderhoud = onderhoudData;

    calculateStatistics();
    renderMaandelijksOverzicht();
    renderRecenteTransacties();
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
    return t.datum && t.datum.startsWith(currentYear.toString());
  });

  const inkomsten = yearTransacties
    .filter((t) => t.type === "inkomst")
    .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

  const uitgaven = yearTransacties
    .filter((t) => t.type === "uitgave")
    .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

  const netto = inkomsten - uitgaven;

  // Maandelijkse huur from active contracts
  const now = new Date();
  const maandelijks = contracten
    .filter((c) => {
      const eindDatum = new Date(c.einddatum);
      return eindDatum > now;
    })
    .reduce((sum, c) => sum + parseFloat(c.huurprijs || 0), 0);

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

  document.getElementById("maandelijks").textContent =
    `€${maandelijks.toLocaleString("nl-NL")}`;
  document.getElementById("maandDetail").textContent = `Actieve contracten`;
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
      const maandTransacties = transacties.filter(
        (t) => t.datum && t.datum.startsWith(`${currentYear}-${maandNummer}`),
      );

      const huurInkomsten = maandTransacties
        .filter((t) => t.type === "inkomst" && t.categorie === "huur")
        .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

      const onderhoudsKosten = maandTransacties
        .filter((t) => t.type === "uitgave" && t.categorie === "onderhoud")
        .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

      const overigeKosten = maandTransacties
        .filter((t) => t.type === "uitgave" && t.categorie !== "onderhoud")
        .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

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
                    <strong style="color: var(--success-color);">€${parseFloat(t.bedrag).toLocaleString("nl-NL")}</strong>
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
                    <strong style="color: var(--danger-color);">€${parseFloat(t.bedrag).toLocaleString("nl-NL")}</strong>
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
    bedrag: parseFloat(document.getElementById("bedrag").value),
    datum: document.getElementById("datum").value,
    categorie: document.getElementById("categorie").value,
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
  currentYear = parseInt(e.target.value);
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
    const maandTransacties = transacties.filter(
      (t) => t.datum && t.datum.startsWith(`${currentYear}-${maandNummer}`),
    );

    const inkomsten = maandTransacties
      .filter((t) => t.type === "inkomst")
      .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);
    const uitgaven = maandTransacties
      .filter((t) => t.type === "uitgave")
      .reduce((sum, t) => sum + parseFloat(t.bedrag || 0), 0);

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
            label: function (context) {
              return `${context.dataset.label}: €${context.parsed.y.toLocaleString("nl-NL")}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "€" + value.toLocaleString("nl-NL");
            },
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
