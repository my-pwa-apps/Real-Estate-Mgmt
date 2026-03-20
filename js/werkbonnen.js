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
            <tr onclick="viewWerkbonDetail('${werkbon.id}')" style="cursor: pointer;">
                <td><strong>${s(werkbon.werkbonNummer)}</strong></td>
                <td>${s(werkbon.pandAdres)}</td>
                <td>${s(werkbon.titel)}</td>
                <td><span class="priority-badge ${s(priorityClass)}">${capitalizeFirst(s(werkbon.prioriteit || "normaal"))}</span></td>
                <td><span class="status-badge ${s(statusClass)}">${capitalizeFirst(s(werkbon.status || "aangemaakt"))}</span></td>
                <td>${new Date(werkbon.aanmaakDatum).toLocaleDateString("nl-NL")}</td>
                <td>€${parseFloat(werkbon.werkelijkeKosten || werkbon.geschatteKosten || 0).toLocaleString("nl-NL")}</td>
                <td onclick="event.stopPropagation();">
                    <button class="action-btn" onclick="downloadWerkbon('${werkbon.id}')" title="Download">💾</button>
                    <button class="action-btn" onclick="printWerkbon('${werkbon.id}')" title="Print">🖨️</button>
                    <button class="action-btn" onclick="resendWerkbon('${werkbon.id}')" title="Opnieuw versturen"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// View werkbon detail
function viewWerkbonDetail(werkbonId) {
  const werkbon = werkbonnen.find((w) => w.id === werkbonId);
  if (!werkbon) return;

  const s = sanitizeHTML;
  // Create detail panel with werkbon info
  const detailHTML = `
        <div class="detail-panel-header">
            <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg> Werkbon ${s(werkbon.werkbonNummer)}</h2>
            <button class="detail-panel-close" onclick="closeWerkbonDetail()">×</button>
        </div>
        <div class="detail-panel-body">
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg> Locatie</div>
                <div class="detail-row">
                    <div class="detail-label">Adres</div>
                    <div class="detail-value"><strong>${s(werkbon.pandAdres)}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Postcode</div>
                    <div class="detail-value">${s(werkbon.pandPostcode)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Plaats</div>
                    <div class="detail-value">${s(werkbon.pandPlaats)}</div>
                </div>
            </div>

            ${
              werkbon.huurderNaam
                ? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Huurder</div>
                <div class="detail-row">
                    <div class="detail-label">Naam</div>
                    <div class="detail-value">${s(werkbon.huurderNaam)}</div>
                </div>
                ${
                  werkbon.huurderTelefoon
                    ? `
                <div class="detail-row">
                    <div class="detail-label">Telefoon</div>
                    <div class="detail-value">${s(werkbon.huurderTelefoon)}</div>
                </div>
                `
                    : ""
                }
                ${
                  werkbon.huurderEmail
                    ? `
                <div class="detail-row">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${s(werkbon.huurderEmail)}</div>
                </div>
                `
                    : ""
                }
            </div>
            `
                : ""
            }

            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> Werkzaamheden</div>
                <div class="detail-row">
                    <div class="detail-label">Titel</div>
                    <div class="detail-value"><strong>${s(werkbon.titel)}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Prioriteit</div>
                    <div class="detail-value"><span class="priority-badge ${s(werkbon.prioriteit)}">${capitalizeFirst(s(werkbon.prioriteit))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-badge ${s(werkbon.status)}">${capitalizeFirst(s(werkbon.status))}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Beschrijving</div>
                    <div class="detail-value">${s(werkbon.beschrijving)}</div>
                </div>
            </div>

            ${
              werkbon.onderhoudsBedrijf
                ? `
            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg> Onderhoudsbedrijf</div>
                <div class="detail-row">
                    <div class="detail-label">Bedrijf</div>
                    <div class="detail-value">${s(werkbon.onderhoudsBedrijf)}</div>
                </div>
                ${
                  werkbon.contactPersoon
                    ? `
                <div class="detail-row">
                    <div class="detail-label">Contact</div>
                    <div class="detail-value">${s(werkbon.contactPersoon)}</div>
                </div>
                `
                    : ""
                }
                ${
                  werkbon.contactTelefoon
                    ? `
                <div class="detail-row">
                    <div class="detail-label">Telefoon</div>
                    <div class="detail-value">${s(werkbon.contactTelefoon)}</div>
                </div>
                `
                    : ""
                }
            </div>
            `
                : ""
            }

            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg> Financieel</div>
                <div class="detail-row">
                    <div class="detail-label">Geschatte kosten</div>
                    <div class="detail-value">€${parseFloat(werkbon.geschatteKosten || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</div>
                </div>
                ${
                  werkbon.werkelijkeKosten
                    ? `
                <div class="detail-row">
                    <div class="detail-label">Werkelijke kosten</div>
                    <div class="detail-value"><strong style="font-size: 18px; color: var(--primary-color);">€${parseFloat(werkbon.werkelijkeKosten).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</strong></div>
                </div>
                `
                    : ""
                }
            </div>

            <div class="detail-section">
                <div class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg> Data</div>
                <div class="detail-row">
                    <div class="detail-label">Aangemaakt</div>
                    <div class="detail-value">${new Date(werkbon.aanmaakDatum).toLocaleDateString("nl-NL")}</div>
                </div>
                ${
                  werkbon.verstuurdDatum
                    ? `
                <div class="detail-row">
                    <div class="detail-label">Verstuurd</div>
                    <div class="detail-value">${new Date(werkbon.verstuurdDatum).toLocaleDateString("nl-NL")}</div>
                </div>
                `
                    : ""
                }
                ${
                  werkbon.geplanddatum
                    ? `
                <div class="detail-row">
                    <div class="detail-label">Gepland</div>
                    <div class="detail-value">${new Date(werkbon.geplanddatum).toLocaleDateString("nl-NL")}</div>
                </div>
                `
                    : ""
                }
                ${
                  werkbon.uitgevoerdDatum
                    ? `
                <div class="detail-row">
                    <div class="detail-label">Uitgevoerd</div>
                    <div class="detail-value">${new Date(werkbon.uitgevoerdDatum).toLocaleDateString("nl-NL")}</div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        <div class="detail-actions">
            <button class="btn-secondary" onclick="downloadWerkbon('${werkbon.id}')">
                💾 Download
            </button>
            <button class="btn-secondary" onclick="printWerkbon('${werkbon.id}')">
                🖨️ Print
            </button>
            <button class="btn-primary" onclick="resendWerkbon('${werkbon.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg> Opnieuw Versturen
            </button>
            <button class="btn-secondary" onclick="closeWerkbonDetail()">
                Sluiten
            </button>
        </div>
    `;

  // Show in panel
  const existingPanel = document.getElementById("werkbonDetailPanel");
  if (existingPanel) existingPanel.remove();

  const existingOverlay = document.getElementById("werkbonDetailOverlay");
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement("div");
  overlay.className = "detail-panel-overlay";
  overlay.id = "werkbonDetailOverlay";
  overlay.onclick = closeWerkbonDetail;

  const panel = document.createElement("div");
  panel.className = "detail-panel";
  panel.id = "werkbonDetailPanel";
  panel.innerHTML = detailHTML;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  setTimeout(() => {
    overlay.classList.add("show");
    panel.classList.add("show");
  }, 10);
}

// Close werkbon detail
function closeWerkbonDetail() {
  const panel = document.getElementById("werkbonDetailPanel");
  const overlay = document.getElementById("werkbonDetailOverlay");

  if (panel) {
    panel.classList.remove("show");
    overlay.classList.remove("show");

    setTimeout(() => {
      panel.remove();
      overlay.remove();
    }, 300);
  }
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
                    <h2><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg> Werkbon Versturen</h2>
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
                    <button type="button" class="btn-primary" onclick="sendResendWerkbon('${werkbon.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg> Verstuur
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
