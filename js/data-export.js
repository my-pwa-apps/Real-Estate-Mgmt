// Data Export - CSV and Excel export functionality for all entities

/**
 * Export data to CSV and trigger download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Filename without extension
 * @param {Array} columns - Column definitions [{key, label}]
 */
function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) {
    showToast("Geen gegevens om te exporteren", "warning");
    return;
  }

  // BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";

  // Header row
  const header = columns.map((c) => `"${c.label}"`).join(";");

  // Data rows
  const rows = data.map((item) => {
    return columns
      .map((c) => {
        let val = c.formatter ? c.formatter(item) : (item[c.key] ?? "");
        // Escape quotes and wrap in quotes
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(";");
  });

  const csv = BOM + header + "\n" + rows.join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`${data.length} rijen geëxporteerd naar CSV`, "success");

  // Audit log
  if (typeof logAuditEvent === "function") {
    logAuditEvent("export", filename, null, {
      description: `${data.length} rijen geëxporteerd als CSV`,
    });
  }
}

/**
 * Export panden to CSV
 */
async function exportPandenCSV() {
  const data = await dbGetAll("panden");
  exportToCSV(data, "panden", [
    { key: "objectSoort", label: "Objectsoort" },
    { key: "objectNummer", label: "Objectnummer" },
    { key: "type", label: "Type" },
    { key: "adres", label: "Adres" },
    { key: "postcode", label: "Postcode" },
    { key: "plaats", label: "Plaats" },
    { key: "status", label: "Status" },
    { key: "oppervlakte", label: "Oppervlakte (m²)" },
    { key: "kamers", label: "Kamers" },
    { key: "bouwjaar", label: "Bouwjaar" },
    { key: "energielabel", label: "Energielabel" },
    { key: "bagId", label: "BAG ID" },
    { key: "streefhuur", label: "Streefhuur (€/maand)" },
    { key: "ownerNaam", label: "Eigenaar" },
    { key: "beheerderNaam", label: "Beheerder" },
    { key: "huurprijs", label: "Huurprijs (€/maand)" },
    { key: "beschrijving", label: "Beschrijving" },
  ]);
}

/**
 * Export huurders to CSV
 */
async function exportHuurdersCSV() {
  const data = await dbGetAll("huurders");
  exportToCSV(data, "huurders", [
    { key: "voornaam", label: "Voornaam" },
    { key: "achternaam", label: "Achternaam" },
    { key: "email", label: "Email" },
    { key: "telefoon", label: "Telefoon" },
    { key: "geboortedatum", label: "Geboortedatum" },
    { key: "notities", label: "Notities" },
  ]);
}

/**
 * Export contracten to CSV
 */
async function exportContractenCSV() {
  const [contracten, huurders, panden] = await Promise.all([
    dbGetAll("contracten"),
    dbGetAll("huurders"),
    dbGetAll("panden"),
  ]);

  exportToCSV(contracten, "contracten", [
    { key: "contractType", label: "Contracttype" },
    { key: "contractFase", label: "Fase" },
    {
      key: "huurderId",
      label: "Huurder",
      formatter: (c) => {
        const h = huurders.find((h) => h.id === c.huurderId);
        return h ? `${h.voornaam} ${h.achternaam}` : "Onbekend";
      },
    },
    {
      key: "pandId",
      label: "Pand",
      formatter: (c) => {
        const p = panden.find((p) => p.id === c.pandId);
        return p ? p.adres : "Onbekend";
      },
    },
    { key: "startdatum", label: "Startdatum" },
    { key: "einddatum", label: "Einddatum" },
    { key: "huurprijs", label: "Huurprijs (€/maand)" },
    { key: "borg", label: "Borgsom (€)" },
    { key: "betalingsdatum", label: "Betalingsdag" },
    { key: "indexatieMethode", label: "Indexatiemethode" },
    { key: "waarborgType", label: "Waarborgtype" },
    { key: "contractReferentie", label: "Externe referentie" },
    { key: "voorwaarden", label: "Voorwaarden" },
  ]);
}

/**
 * Export transacties to CSV (for a given year)
 */
async function exportTransactiesCSV(year) {
  let data = await dbGetAll("transacties");
  if (year) {
    data = data.filter((t) => t.datum && t.datum.startsWith(year.toString()));
  }
  data.sort((a, b) => (a.datum || "").localeCompare(b.datum || ""));

  exportToCSV(data, `transacties_${year || "alle"}`, [
    { key: "datum", label: "Datum" },
    { key: "type", label: "Type" },
    { key: "categorie", label: "Categorie" },
    { key: "beschrijving", label: "Beschrijving" },
    { key: "bedrag", label: "Bedrag (€)" },
    { key: "notities", label: "Notities" },
  ]);
}

/**
 * Export onderhoud to CSV
 */
async function exportOnderhoudCSV() {
  const [onderhoud, panden] = await Promise.all([
    dbGetAll("onderhoud"),
    dbGetAll("panden"),
  ]);

  exportToCSV(onderhoud, "onderhoud", [
    {
      key: "pandId",
      label: "Pand",
      formatter: (m) => {
        const p = panden.find((p) => p.id === m.pandId);
        return p ? p.adres : "Onbekend";
      },
    },
    { key: "titel", label: "Titel" },
    { key: "beschrijving", label: "Beschrijving" },
    { key: "probleemCategorie", label: "Probleemcategorie" },
    { key: "prioriteit", label: "Prioriteit" },
    { key: "status", label: "Status" },
    { key: "kostenCategorie", label: "Kosten categorie" },
    { key: "uitvoerderNaam", label: "Uitvoerder" },
    { key: "geplande_datum", label: "Geplande datum" },
    { key: "kosten", label: "Kosten (€)" },
    { key: "melderNaam", label: "Melder" },
    { key: "melderContact", label: "Melder contact" },
    { key: "externeReferentie", label: "Externe referentie" },
    { key: "notities", label: "Notities" },
  ]);
}

/**
 * Export werkbonnen to CSV
 */
async function exportWerkbonnenCSV() {
  const data = await dbGetAll("werkbonnen");
  exportToCSV(data, "werkbonnen", [
    { key: "werkbonNummer", label: "Werkbonnummer" },
    { key: "pandAdres", label: "Adres" },
    { key: "titel", label: "Titel" },
    { key: "prioriteit", label: "Prioriteit" },
    { key: "status", label: "Status" },
    { key: "aanmaakDatum", label: "Aangemaakt" },
    { key: "geschatteKosten", label: "Geschatte kosten (€)" },
    { key: "werkelijkeKosten", label: "Werkelijke kosten (€)" },
    { key: "onderhoudsBedrijf", label: "Onderhoudsbedrijf" },
    { key: "huurderNaam", label: "Huurder" },
  ]);
}

// Export functions
window.exportToCSV = exportToCSV;
window.exportPandenCSV = exportPandenCSV;
window.exportHuurdersCSV = exportHuurdersCSV;
window.exportContractenCSV = exportContractenCSV;
window.exportTransactiesCSV = exportTransactiesCSV;
window.exportOnderhoudCSV = exportOnderhoudCSV;
window.exportWerkbonnenCSV = exportWerkbonnenCSV;
