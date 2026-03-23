// Werkbonnen Management

let werkbonnen = [];
let filteredWerkbonnen = [];

// Load all werkbonnen
async function loadWerkbonnen() {
  try {
    showLoading("Werkbonnen laden...");
    const data = await dbGetAll("werkbonnen");
    werkbonnen = data;

    // Sort by creation date descending
    werkbonnen.sort(
      (a, b) => new Date(b.aanmaakDatum) - new Date(a.aanmaakDatum),
    );

    filteredWerkbonnen = [...werkbonnen];
    populateYearFilter();
    renderWerkbonnen();
    hideLoading();
  } catch (error) {
    console.error("Error loading werkbonnen:", error);
    hideLoading();
    showToast("Fout bij het laden van werkbonnen", "error");
  }
}

// Populate year filter
function populateYearFilter() {
  const jaarFilter = document.getElementById("jaarFilter");
  const years = [
    ...new Set(werkbonnen.map((w) => new Date(w.aanmaakDatum).getFullYear())),
  ];
  years.sort((a, b) => b - a);

  const currentOptions = jaarFilter.innerHTML;
  jaarFilter.innerHTML =
    '<option value="">Alle jaren</option>' +
    years.map((year) => `<option value="${year}">${year}</option>`).join("");
}

// Render werkbonnen table
function renderWerkbonnen() {
  const tbody = document.getElementById("werkbonnenTableBody");

  if (filteredWerkbonnen.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty-state">Geen werkbonnen gevonden</td></tr>';
    return;
  }

  tbody.innerHTML = filteredWerkbonnen
    .map((werkbon) => {
      const priorityClass = werkbon.prioriteit || "normaal";
      const statusClass = werkbon.status || "aangemaakt";
      const s = sanitizeHTML;

      return `
            <tr onclick="viewWerkbonDetail('${sanitizeAttr(werkbon.id)}')" style="cursor: pointer;">
                <td><strong>${s(werkbon.werkbonNummer)}</strong></td>
                <td>${s(werkbon.pandAdres)}</td>
                <td>${s(werkbon.titel)}</td>
                <td><span class="priority-badge ${s(priorityClass)}">${capitalizeFirst(s(werkbon.prioriteit || "normaal"))}</span></td>
                <td><span class="status-badge ${s(statusClass)}">${capitalizeFirst(s(werkbon.status || "aangemaakt"))}</span></td>
                <td>${new Date(werkbon.aanmaakDatum).toLocaleDateString("nl-NL")}</td>
                <td>€${parseFloat(werkbon.werkelijkeKosten || werkbon.geschatteKosten || 0).toLocaleString("nl-NL")}</td>
                <td onclick="event.stopPropagation();">
                    <button class="action-btn" onclick="downloadWerkbon('${sanitizeAttr(werkbon.id)}')" title="Download"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg></button>
                    <button class="action-btn" onclick="printWerkbon('${sanitizeAttr(werkbon.id)}')" title="Print"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg></button>
                    <button class="action-btn" onclick="resendWerkbon('${sanitizeAttr(werkbon.id)}')" title="Opnieuw versturen"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// View werkbon detail - delegates to shared detail panel
function viewWerkbonDetail(werkbonId) {
  const werkbon = werkbonnen.find((w) => w.id === werkbonId);
  if (!werkbon) return;

  showDetailPanel("werkbon", werkbon);
}

// Close werkbon detail - delegates to shared detail panel
function closeWerkbonDetail() {
  closeDetailPanel();
}

// Resend werkbon
async function resendWerkbon(werkbonId) {
  const werkbon = werkbonnen.find((w) => w.id === werkbonId);
  if (!werkbon) return;

  // Show send modal similar to onderhoud.js
  const modalHTML = `
        <div id="resendWerkbonModal" class="modal show" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg> Werkbon Versturen</h2>
                    <button class="close-btn" onclick="closeResendModal()">&times;</button>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-bottom: 20px;">Selecteer de ontvangers voor werkbon ${werkbon.werkbonNummer}:</p>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="resendToHuurder" ${werkbon.huurderEmail ? "checked" : "disabled"}>
                            <span>Verstuur naar huurder ${werkbon.huurderEmail ? "(" + werkbon.huurderEmail + ")" : "(geen email)"}</span>
                        </label>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="resendToOnderhoudsBedrijf" ${werkbon.onderhoudsBedrijf ? "checked" : ""}>
                            <span>Verstuur naar onderhoudsbedrijf</span>
                        </label>
                        <div id="resendOnderhoudsBedrijfFields" style="margin-top: 10px; padding-left: 30px; ${werkbon.onderhoudsBedrijf ? "display: block;" : "display: none;"}">
                            <div class="form-group">
                                <label>Bedrijfsnaam</label>
                                <input type="text" id="resendOnderhoudsBedrijf" value="${werkbon.onderhoudsBedrijf || ""}" placeholder="Naam onderhoudsbedrijf">
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="resendOnderhoudsBedrijfEmail" placeholder="email@onderhoudsbedrijf.nl">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeResendModal()">
                        Annuleren
                    </button>
                    <button type="button" class="btn-primary" onclick="sendResendWerkbon('${sanitizeAttr(werkbon.id)}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg> Verstuur
                    </button>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document
    .getElementById("resendToOnderhoudsBedrijf")
    .addEventListener("change", (e) => {
      document.getElementById("resendOnderhoudsBedrijfFields").style.display = e
        .target.checked
        ? "block"
        : "none";
    });
}

// Close resend modal
function closeResendModal() {
  const modal = document.getElementById("resendWerkbonModal");
  if (modal) modal.remove();
}

// Send resend werkbon
async function sendResendWerkbon(werkbonId) {
  try {
    const sendToHuurder = document.getElementById("resendToHuurder").checked;
    const sendToOnderhoudsBedrijf = document.getElementById(
      "resendToOnderhoudsBedrijf",
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
      const bedrijfEmail = document
        .getElementById("resendOnderhoudsBedrijfEmail")
        .value.trim();

      if (!bedrijfEmail) {
        showToast("Vul email in", "error");
        return;
      }

      options.onderhoudsBedrijfEmail = bedrijfEmail;
    }

    showLoading("Werkbon versturen...");

    await sendWerkbon(werkbonId, options);

    hideLoading();
    closeResendModal();
    closeWerkbonDetail();
    loadWerkbonnen();
  } catch (error) {
    hideLoading();
    console.error("Error resending werkbon:", error);
  }
}

// Filters
document
  .getElementById("statusFilter")
  .addEventListener("change", applyFilters);
document.getElementById("jaarFilter").addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);

function applyFilters() {
  const statusFilter = document.getElementById("statusFilter").value;
  const jaarFilter = document.getElementById("jaarFilter").value;
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  filteredWerkbonnen = werkbonnen.filter((werkbon) => {
    const matchesStatus = !statusFilter || werkbon.status === statusFilter;
    const matchesYear =
      !jaarFilter ||
      new Date(werkbon.aanmaakDatum).getFullYear().toString() === jaarFilter;
    const matchesSearch =
      !searchTerm ||
      werkbon.werkbonNummer.toLowerCase().includes(searchTerm) ||
      werkbon.pandAdres.toLowerCase().includes(searchTerm) ||
      werkbon.titel.toLowerCase().includes(searchTerm);

    return matchesStatus && matchesYear && matchesSearch;
  });

  renderWerkbonnen();
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await ensureAuthenticated();
    await loadWerkbonnen();

    // Check if there's a werkbon ID in the hash
    const hash = window.location.hash.substring(1);
    if (hash) {
      // Give it a moment for data to load
      setTimeout(() => {
        const werkbon = werkbonnen.find((w) => w.id === hash);
        if (werkbon) {
          viewWerkbonDetail(hash);
        } else {
          showToast("Werkbon niet gevonden", "error");
        }
        // Clear hash
        history.replaceState(null, null, "werkbonnen.html");
      }, 500);
    }
  } catch (error) {
    console.error("Initialization error:", error);
  }
});

// Export functions
window.viewWerkbonDetail = viewWerkbonDetail;
window.closeWerkbonDetail = closeWerkbonDetail;
window.resendWerkbon = resendWerkbon;
window.closeResendModal = closeResendModal;
window.sendResendWerkbon = sendResendWerkbon;
