// Invoice Helpers - Factuur generatie en verzending
// Ondersteunt zowel geautomatiseerde als handmatige facturering

/**
 * Genereert een factuur PDF en stuurt deze via email
 * @param {Object} invoiceData - Factuur gegevens
 * @param {boolean} autoSend - Automatisch versturen via email
 */
async function generateInvoice(invoiceData, autoSend = false) {
  try {
    // Validatie
    if (!invoiceData.contractId && !invoiceData.huurderId) {
      throw new Error("Contract ID of Huurder ID is verplicht");
    }

    // Haal contract en huurder gegevens op
    const contract = invoiceData.contractId
      ? await dbGetAll("contracten").then((contracts) =>
          contracts.find((c) => c.id === invoiceData.contractId),
        )
      : null;

    const huurder = contract
      ? await dbGetAll("huurders").then((huurders) =>
          huurders.find((h) => h.id === contract.huurderId),
        )
      : await dbGetAll("huurders").then((huurders) =>
          huurders.find((h) => h.id === invoiceData.huurderId),
        );

    const pand = contract
      ? await dbGetAll("panden").then((panden) =>
          panden.find((p) => p.id === contract.pandId),
        )
      : null;

    if (!huurder) {
      throw new Error("Huurder niet gevonden");
    }

    // Factuur nummer genereren
    const invoiceNumber = await generateInvoiceNumber();

    // Factuur data samenstellen
    const invoice = {
      invoiceNumber: invoiceNumber,
      invoiceDate:
        invoiceData.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: invoiceData.dueDate || calculateDueDate(14), // 14 dagen betaaltermijn

      // Bedrijfsgegevens (uit settings)
      company: await getCompanySettings(),

      // Klantgegevens
      customer: {
        name: `${huurder.voornaam} ${huurder.achternaam}`,
        email: huurder.email,
        phone: huurder.telefoon,
        address: contract ? pand.adres : huurder.adres || "",
        postalCode: contract ? pand.postcode : huurder.postcode || "",
        city: contract ? pand.plaats : huurder.plaats || "",
      },

      // Factuurregels
      items: invoiceData.items || [
        {
          description: `Huur ${pand ? pand.adres : "Vastgoed"} - ${getMonthName(new Date())}`,
          quantity: 1,
          unitPrice: contract ? contract.huurprijs : invoiceData.amount || 0,
          vatRate: 0, // Huur is meestal vrijgesteld van BTW
          total: contract ? contract.huurprijs : invoiceData.amount || 0,
        },
      ],

      // Notities
      notes: invoiceData.notes || "",

      // Betalingsgegevens
      paymentDetails: await getPaymentDetails(),
    };

    // Bereken totalen
    invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    invoice.vatAmount = invoice.items.reduce(
      (sum, item) => sum + (item.total * item.vatRate) / 100,
      0,
    );
    invoice.total = invoice.subtotal + invoice.vatAmount;

    // Genereer PDF
    const pdfBlob = await generateInvoicePDF(invoice);

    // Sla factuur op in Firebase
    const savedInvoice = await saveInvoiceToDatabase(
      invoice,
      contract?.id,
      huurder.id,
    );

    // Upload PDF naar SharePoint/OneDrive (als M365 geïntegreerd is)
    let documentUrl = null;
    if (typeof uploadToSharePoint === "function") {
      try {
        documentUrl = await uploadToSharePoint(
          pdfBlob,
          `Factuur_${invoiceNumber}.pdf`,
          "Facturen",
        );

        // Update factuur met document URL
        await dbUpdate("invoices", savedInvoice.id, { documentUrl });
      } catch (error) {
        console.warn("SharePoint upload mislukt:", error);
      }
    }

    // Verstuur email (indien autoSend of handmatig aangevraagd)
    if (autoSend || invoiceData.sendEmail) {
      await sendInvoiceEmail(invoice, pdfBlob, huurder.email);
    }

    return {
      success: true,
      invoiceId: savedInvoice.id,
      invoiceNumber: invoiceNumber,
      documentUrl: documentUrl,
      message: autoSend
        ? "Factuur gegenereerd en verzonden"
        : "Factuur gegenereerd",
    };
  } catch (error) {
    console.error("Factuur generatie fout:", error);
    throw error;
  }
}

/**
 * Genereert een uniek factuurnummer
 */
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const invoices = await dbGetAll("invoices");
  const yearInvoices = invoices.filter(
    (inv) => inv.invoiceNumber && inv.invoiceNumber.startsWith(`${year}-`),
  );

  const nextNumber = yearInvoices.length + 1;
  return `${year}-${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Berekent vervaldatum
 */
function calculateDueDate(days = 14) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Haalt bedrijfsgegevens op uit settings
 */
async function getCompanySettings() {
  try {
    const settings = await dbGetAll("settings");
    const companySettings = settings.find((s) => s.type === "company") || {};

    return {
      name: companySettings.companyName || "Stadsgezicht Ontwikkelingen",
      address: companySettings.companyAddress || "Bedrijfsstraat 123",
      postalCode: companySettings.companyPostalCode || "1234 AB",
      city: companySettings.companyCity || "Amsterdam",
      phone: companySettings.companyPhone || "+31 20 123 4567",
      email: companySettings.companyEmail || "info@stadsgezicht.nl",
      kvk: companySettings.kvkNumber || "12345678",
      btw: companySettings.btwNumber || "NL123456789B01",
    };
  } catch (error) {
    // Fallback gegevens
    return {
      name: "Stadsgezicht Ontwikkelingen",
      address: "Bedrijfsstraat 123",
      postalCode: "1234 AB",
      city: "Amsterdam",
      phone: "+31 20 123 4567",
      email: "info@stadsgezicht.nl",
      kvk: "12345678",
      btw: "NL123456789B01",
    };
  }
}

/**
 * Haalt betalingsgegevens op
 */
async function getPaymentDetails() {
  try {
    const settings = await dbGetAll("settings");
    const paymentSettings = settings.find((s) => s.type === "payment") || {};

    return {
      iban: paymentSettings.iban || "NL12 BANK 0123 4567 89",
      bic: paymentSettings.bic || "BANKNL2A",
      bankName: paymentSettings.bankName || "Bank Nederland",
    };
  } catch (error) {
    return {
      iban: "NL12 BANK 0123 4567 89",
      bic: "BANKNL2A",
      bankName: "Bank Nederland",
    };
  }
}

/**
 * Genereert factuur PDF
 */
async function generateInvoicePDF(invoice) {
  // HTML template voor factuur
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; color: #1e3a5f; font-weight: bold; margin-bottom: 10px; }
        .company-details { font-size: 12px; color: #666; }
        .invoice-title { font-size: 32px; color: #1e3a5f; margin: 30px 0; }
        .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .customer-details, .invoice-details { width: 48%; }
        .section-title { font-weight: bold; color: #1e3a5f; margin-bottom: 10px; border-bottom: 2px solid #c69c6d; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { background: #1e3a5f; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        .amount { text-align: right; }
        .totals { margin-left: auto; width: 300px; margin-top: 20px; }
        .totals tr td { padding: 8px; }
        .total-row { font-weight: bold; font-size: 18px; color: #1e3a5f; border-top: 2px solid #1e3a5f; }
        .payment-info { background: #f8f9fa; padding: 20px; margin-top: 30px; border-left: 4px solid #c69c6d; }
        .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${invoice.company.name}</div>
        <div class="company-details">
            ${invoice.company.address} | ${invoice.company.postalCode} ${invoice.company.city}<br>
            Tel: ${invoice.company.phone} | Email: ${invoice.company.email}<br>
            KvK: ${invoice.company.kvk} | BTW: ${invoice.company.btw}
        </div>
    </div>

    <div class="invoice-title">FACTUUR</div>

    <div class="invoice-meta">
        <div class="customer-details">
            <div class="section-title">Klantgegevens</div>
            <strong>${invoice.customer.name}</strong><br>
            ${invoice.customer.address}<br>
            ${invoice.customer.postalCode} ${invoice.customer.city}<br>
            ${invoice.customer.email}<br>
            ${invoice.customer.phone}
        </div>
        <div class="invoice-details">
            <div class="section-title">Factuurgegevens</div>
            <strong>Factuurnummer:</strong> ${invoice.invoiceNumber}<br>
            <strong>Factuurdatum:</strong> ${formatDate(invoice.invoiceDate)}<br>
            <strong>Vervaldatum:</strong> ${formatDate(invoice.dueDate)}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Omschrijving</th>
                <th style="text-align: center;">Aantal</th>
                <th style="text-align: right;">Prijs</th>
                <th style="text-align: right;">BTW</th>
                <th style="text-align: right;">Totaal</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.items
              .map(
                (item) => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td class="amount">€ ${item.unitPrice.toFixed(2)}</td>
                    <td class="amount">${item.vatRate}%</td>
                    <td class="amount">€ ${item.total.toFixed(2)}</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Subtotaal:</td>
            <td class="amount">€ ${invoice.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
            <td>BTW:</td>
            <td class="amount">€ ${invoice.vatAmount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
            <td>TOTAAL:</td>
            <td class="amount">€ ${invoice.total.toFixed(2)}</td>
        </tr>
    </table>

    <div class="payment-info">
        <div class="section-title">Betalingsgegevens</div>
        <strong>IBAN:</strong> ${invoice.paymentDetails.iban}<br>
        <strong>BIC:</strong> ${invoice.paymentDetails.bic}<br>
        <strong>Bank:</strong> ${invoice.paymentDetails.bankName}<br>
        <strong>Onder vermelding van:</strong> ${invoice.invoiceNumber}
        ${invoice.notes ? `<br><br><strong>Notitie:</strong> ${invoice.notes}` : ""}
    </div>

    <div class="footer">
        ${invoice.company.name} | ${invoice.company.kvk} | ${invoice.company.btw}
    </div>
</body>
</html>
    `;

  // Converteer HTML naar PDF (via browser print of externe service)
  const blob = await htmlToPdfBlob(
    html,
    `Factuur_${invoice.invoiceNumber}.pdf`,
  );
  return blob;
}

/**
 * Converteert HTML naar PDF Blob
 */
async function htmlToPdfBlob(html, filename) {
  // Optie 1: Gebruik browser print API (simpel maar beperkt)
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();

  // Return een mock blob voor nu (in productie zou je een PDF library gebruiken)
  const htmlBlob = new Blob([html], { type: "text/html" });

  // TODO: Integreer met PDF library zoals jsPDF of gebruik server-side PDF generatie
  console.log("PDF generatie - gebruik print dialog of integreer PDF library");

  return htmlBlob;
}

/**
 * Slaat factuur op in database
 */
async function saveInvoiceToDatabase(invoice, contractId, huurderId) {
  const invoiceRecord = {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    contractId: contractId,
    huurderId: huurderId,
    amount: invoice.total,
    subtotal: invoice.subtotal,
    vatAmount: invoice.vatAmount,
    status: "outstanding", // outstanding, paid, overdue, cancelled
    items: invoice.items,
    customer: invoice.customer,
    notes: invoice.notes,
    createdAt: new Date().toISOString(),
    createdBy: firebase.auth().currentUser?.email || "system",
  };

  const id = await dbAdd("invoices", invoiceRecord);
  return { id, ...invoiceRecord };
}

/**
 * Verstuurt factuur via email
 */
async function sendInvoiceEmail(invoice, pdfBlob, recipientEmail) {
  if (typeof sendEmailWithAttachment !== "function") {
    console.warn("Email functionaliteit niet beschikbaar");
    return;
  }

  const emailContent = `
Beste ${invoice.customer.name},

Hierbij ontvangt u factuur ${invoice.invoiceNumber} voor de huur van ${invoice.items[0].description}.

Factuurbedrag: € ${invoice.total.toFixed(2)}
Vervaldatum: ${formatDate(invoice.dueDate)}

Gelieve het bedrag voor de vervaldatum over te maken naar:
IBAN: ${invoice.paymentDetails.iban}
Onder vermelding van: ${invoice.invoiceNumber}

Met vriendelijke groet,
${invoice.company.name}
    `.trim();

  await sendEmailWithAttachment({
    to: recipientEmail,
    subject: `Factuur ${invoice.invoiceNumber} - ${invoice.company.name}`,
    body: emailContent,
    attachments: [
      {
        filename: `Factuur_${invoice.invoiceNumber}.pdf`,
        content: pdfBlob,
      },
    ],
  });
}

/**
 * Automatische factuur generatie voor alle actieve contracten
 */
async function generateMonthlyInvoices() {
  try {
    const contracten = await dbGetAll("contracten");
    const activeContracts = contracten.filter((c) => c.status === "actief");

    const results = [];
    for (const contract of activeContracts) {
      try {
        const result = await generateInvoice(
          {
            contractId: contract.id,
            invoiceDate: new Date().toISOString().split("T")[0],
            sendEmail: true,
          },
          true,
        );

        results.push({ contract: contract.id, success: true, ...result });
      } catch (error) {
        results.push({
          contract: contract.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Bulk factuur generatie fout:", error);
    throw error;
  }
}

// Helper functies
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getMonthName(date) {
  return date.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}
