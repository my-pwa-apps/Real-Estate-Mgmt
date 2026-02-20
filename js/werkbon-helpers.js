// Werkbon Helper Functions
// Generates work orders for maintenance activities

/**
 * Generate a werkbon (work order) for maintenance
 * @param {string} meldingId - Maintenance report ID
 * @returns {Promise<object>} Generated werkbon data
 */
async function generateWerkbon(meldingId) {
    try {
        // Get melding details
        const melding = await dbGet('onderhoud', meldingId);
        if (!melding) {
            throw new Error('Onderhoudsmelding niet gevonden');
        }

        // Get related data
        const pand = await dbGet('panden', melding.pandId);
        if (!pand) {
            throw new Error('Pand niet gevonden');
        }

        // Get active contract and huurder
        const contracten = await dbGetAll('contracten');
        // Find most recent contract for this pand (check status if present, otherwise accept any)
        const contract = contracten
            .filter(c => c.pandId === melding.pandId)
            .sort((a, b) => new Date(b.startdatum) - new Date(a.startdatum))[0];

        let huurder = null;
        if (contract) {
            huurder = await dbGet('huurders', contract.huurderId);
        }

        // Generate werkbon number
        const werkbonNummer = await generateWerkbonNummer();

        // Create werkbon data
        const werkbonData = {
            werkbonNummer: werkbonNummer,
            meldingId: meldingId,
            pandId: melding.pandId,
            huurderId: huurder?.id || null,
            titel: melding.titel,
            beschrijving: melding.beschrijving,
            prioriteit: melding.prioriteit,
            status: 'aangemaakt',
            aanmaakDatum: new Date().toISOString(),
            geplanddatum: melding.geplanddatum || null,
            geschatteKosten: melding.kosten || 0,
            werkelijkeKosten: null,
            onderhoudsBedrijf: null,
            contactPersoon: null,
            contactTelefoon: null,
            notities: melding.notities || '',
            uitgevoerdDoor: null,
            uitgevoerdDatum: null,
            goedgekeurd: false,
            goedgekeurdDoor: null,
            goedgekeurdDatum: null,
            // Related info for reference
            pandAdres: pand.adres,
            pandPostcode: pand.postcode,
            pandPlaats: pand.plaats,
            huurderNaam: huurder ? `${huurder.voornaam} ${huurder.achternaam}` : null,
            huurderEmail: huurder?.email || null,
            huurderTelefoon: huurder?.telefoon || null
        };

        // Save werkbon to Firebase
        const werkbonId = await dbAdd('werkbonnen', werkbonData);
        werkbonData.id = werkbonId;

        // Update melding with werkbon reference
        await dbUpdate('onderhoud', meldingId, {
            werkbonId: werkbonId,
            status: 'gepland'
        });

        return werkbonData;

    } catch (error) {
        console.error('Error generating werkbon:', error);
        throw error;
    }
}

/**
 * Generate unique werkbon number
 * Format: WB-YYYY-NNNN
 */
async function generateWerkbonNummer() {
    const year = new Date().getFullYear();
    const prefix = `WB-${year}-`;
    
    try {
        const werkbonnen = await dbGetAll('werkbonnen');
        const thisYearWerkbonnen = werkbonnen.filter(w => 
            w.werkbonNummer && w.werkbonNummer.startsWith(prefix)
        );
        
        const nextNumber = thisYearWerkbonnen.length + 1;
        return `${prefix}${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
        console.error('Error generating werkbon nummer:', error);
        return `${prefix}0001`;
    }
}

/**
 * Generate HTML for werkbon
 * @param {object} werkbon - Werkbon data
 * @returns {string} HTML content
 */
function generateWerkbonHTML(werkbon) {
    return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Werkbon ${werkbon.werkbonNummer}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e3a5f;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a5f;
        }
        .werkbon-info {
            text-align: right;
        }
        .werkbon-nummer {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 5px;
        }
        .datum {
            color: #666;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #c69c6d;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        .info-label {
            font-weight: 600;
            color: #4a5568;
        }
        .info-value {
            color: #1a1a1a;
        }
        .description-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #c69c6d;
            margin: 15px 0;
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .priority-laag { background: #e0f2fe; color: #0369a1; }
        .priority-normaal { background: #dbeafe; color: #1e40af; }
        .priority-hoog { background: #fed7aa; color: #c2410c; }
        .priority-urgent { background: #fecaca; color: #b91c1c; }
        .signature-section {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        .signature-box {
            border-top: 2px solid #1a1a1a;
            padding-top: 10px;
        }
        .signature-label {
            font-weight: 600;
            color: #4a5568;
            font-size: 14px;
        }
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            Stadsgezicht Ontwikkelingen
        </div>
        <div class="werkbon-info">
            <div class="werkbon-nummer">WERKBON</div>
            <div class="werkbon-nummer">${werkbon.werkbonNummer}</div>
            <div class="datum">${new Date(werkbon.aanmaakDatum).toLocaleDateString('nl-NL', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            })}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">📍 Locatie</div>
        <div class="info-grid">
            <div class="info-label">Adres:</div>
            <div class="info-value"><strong>${werkbon.pandAdres}</strong></div>
            <div class="info-label">Postcode:</div>
            <div class="info-value">${werkbon.pandPostcode}</div>
            <div class="info-label">Plaats:</div>
            <div class="info-value">${werkbon.pandPlaats}</div>
        </div>
    </div>

    ${werkbon.huurderNaam ? `
    <div class="section">
        <div class="section-title">👤 Huurder</div>
        <div class="info-grid">
            <div class="info-label">Naam:</div>
            <div class="info-value">${werkbon.huurderNaam}</div>
            ${werkbon.huurderTelefoon ? `
            <div class="info-label">Telefoon:</div>
            <div class="info-value">${werkbon.huurderTelefoon}</div>
            ` : ''}
            ${werkbon.huurderEmail ? `
            <div class="info-label">Email:</div>
            <div class="info-value">${werkbon.huurderEmail}</div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">🔧 Werkzaamheden</div>
        <div class="info-grid">
            <div class="info-label">Titel:</div>
            <div class="info-value"><strong>${werkbon.titel}</strong></div>
            <div class="info-label">Prioriteit:</div>
            <div class="info-value">
                <span class="priority-badge priority-${werkbon.prioriteit}">
                    ${werkbon.prioriteit.charAt(0).toUpperCase() + werkbon.prioriteit.slice(1)}
                </span>
            </div>
            ${werkbon.geplanddatum ? `
            <div class="info-label">Geplande datum:</div>
            <div class="info-value">${new Date(werkbon.geplanddatum).toLocaleDateString('nl-NL')}</div>
            ` : ''}
            ${werkbon.geschatteKosten ? `
            <div class="info-label">Geschatte kosten:</div>
            <div class="info-value"><strong>€${parseFloat(werkbon.geschatteKosten).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</strong></div>
            ` : ''}
        </div>
        <div class="description-box">
            <strong>Beschrijving:</strong><br>
            ${werkbon.beschrijving}
        </div>
        ${werkbon.notities ? `
        <div class="description-box">
            <strong>Notities:</strong><br>
            ${werkbon.notities}
        </div>
        ` : ''}
    </div>

    ${werkbon.onderhoudsBedrijf ? `
    <div class="section">
        <div class="section-title">🏢 Onderhoudsbedrijf</div>
        <div class="info-grid">
            <div class="info-label">Bedrijf:</div>
            <div class="info-value">${werkbon.onderhoudsBedrijf}</div>
            ${werkbon.contactPersoon ? `
            <div class="info-label">Contactpersoon:</div>
            <div class="info-value">${werkbon.contactPersoon}</div>
            ` : ''}
            ${werkbon.contactTelefoon ? `
            <div class="info-label">Telefoon:</div>
            <div class="info-value">${werkbon.contactTelefoon}</div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-label">Handtekening Huurder</div>
            <div style="height: 60px;"></div>
            <div style="font-size: 12px; color: #666;">Datum: _________________</div>
        </div>
        <div class="signature-box">
            <div class="signature-label">Handtekening Uitvoerder</div>
            <div style="height: 60px;"></div>
            <div style="font-size: 12px; color: #666;">Datum: _________________</div>
        </div>
    </div>

    <div class="footer">
        Stadsgezicht Ontwikkelingen | Real Estate Management<br>
        Deze werkbon is automatisch gegenereerd op ${new Date().toLocaleDateString('nl-NL')}
    </div>
</body>
</html>
    `.trim();
}

/**
 * Send werkbon to huurder and onderhoudsbedrijf
 * @param {string} werkbonId - Werkbon ID
 * @param {object} options - Send options
 */
async function sendWerkbon(werkbonId, options = {}) {
    try {
        // Check if Microsoft signed in
        if (!isMicrosoftSignedIn()) {
            const signIn = await showConfirm('U moet eerst inloggen met Microsoft 365 om werkbonnen te versturen. Nu inloggen?', 'Microsoft 365 vereist');
            if (signIn) {
                await signInToMicrosoft();
            }
            return;
        }

        // Get werkbon
        const werkbon = await dbGet('werkbonnen', werkbonId);
        if (!werkbon) {
            throw new Error('Werkbon niet gevonden');
        }

        // Generate HTML content
        const htmlContent = generateWerkbonHTML(werkbon);

        // Prepare recipients
        const recipients = [];
        
        if (options.sendToHuurder && werkbon.huurderEmail) {
            recipients.push({
                email: werkbon.huurderEmail,
                name: werkbon.huurderNaam,
                type: 'huurder'
            });
        }

        if (options.sendToOnderhoudsBedrijf && options.onderhoudsBedrijfEmail) {
            recipients.push({
                email: options.onderhoudsBedrijfEmail,
                name: werkbon.onderhoudsBedrijf || 'Onderhoudsbedrijf',
                type: 'onderhoudsbedrijf'
            });
        }

        if (recipients.length === 0) {
            throw new Error('Geen ontvangers geselecteerd');
        }

        // Send emails
        const sendPromises = recipients.map(async (recipient) => {
            const emailData = {
                to: [recipient.email],
                subject: `Werkbon ${werkbon.werkbonNummer} - ${werkbon.titel}`,
                body: recipient.type === 'huurder' 
                    ? `Beste ${recipient.name},\n\nBijgaand ontvangt u de werkbon voor de onderhouds­werkzaamheden op het adres ${werkbon.pandAdres}.\n\nDe werkzaamheden zijn gepland voor ${werkbon.geplanddatum ? new Date(werkbon.geplanddatum).toLocaleDateString('nl-NL') : 'nog niet gepland'}.\n\nMet vriendelijke groet,\nStadsgezicht Ontwikkelingen`
                    : `Geachte ${recipient.name},\n\nBijgaand ontvangt u de werkbon voor uit te voeren onderhouds­werkzaamheden.\n\nLocatie: ${werkbon.pandAdres}, ${werkbon.pandPostcode} ${werkbon.pandPlaats}\nWerkzaamheden: ${werkbon.titel}\n\nGraag vernemen wij uw bevestiging.\n\nMet vriendelijke groet,\nStadsgezicht Ontwikkelingen`,
                contentType: 'Text',
                attachments: [
                    {
                        name: `Werkbon_${werkbon.werkbonNummer}.html`,
                        contentBytes: btoa(unescape(encodeURIComponent(htmlContent))),
                        contentType: 'text/html'
                    }
                ],
                saveToSent: true
            };

            await sendEmail(emailData);
            return recipient;
        });

        await Promise.all(sendPromises);

        // Save to SharePoint
        if (options.saveToSharePoint !== false) {
            const folderPath = `Werkbonnen/${new Date().getFullYear()}/${werkbon.pandAdres.replace(/[^a-z0-9]/gi, '_')}`;
            await saveFileToSharePoint(
                `Werkbon_${werkbon.werkbonNummer}.html`,
                htmlContent,
                folderPath,
                'text/html'
            );
        }

        // Update werkbon status
        await dbUpdate('werkbonnen', werkbonId, {
            verstuurdDatum: new Date().toISOString(),
            verstuurdNaar: recipients.map(r => r.email),
            status: 'verstuurd'
        });

        showToast(`Werkbon verstuurd naar ${recipients.length} ontvanger(s)`, 'success');

        return { success: true, recipients };

    } catch (error) {
        console.error('Error sending werkbon:', error);
        showToast('Fout bij versturen werkbon: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Download werkbon as HTML file
 * @param {string} werkbonId - Werkbon ID
 */
async function downloadWerkbon(werkbonId) {
    try {
        const werkbon = await dbGet('werkbonnen', werkbonId);
        if (!werkbon) {
            throw new Error('Werkbon niet gevonden');
        }

        const htmlContent = generateWerkbonHTML(werkbon);
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Werkbon_${werkbon.werkbonNummer}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Werkbon gedownload', 'success');

    } catch (error) {
        console.error('Error downloading werkbon:', error);
        showToast('Fout bij downloaden werkbon', 'error');
        throw error;
    }
}

/**
 * Print werkbon
 * @param {string} werkbonId - Werkbon ID
 */
async function printWerkbon(werkbonId) {
    try {
        const werkbon = await dbGet('werkbonnen', werkbonId);
        if (!werkbon) {
            throw new Error('Werkbon niet gevonden');
        }

        const htmlContent = generateWerkbonHTML(werkbon);
        
        // Open in new window and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.print();
        };

    } catch (error) {
        console.error('Error printing werkbon:', error);
        showToast('Fout bij printen werkbon', 'error');
        throw error;
    }
}

// Make functions globally available
window.generateWerkbon = generateWerkbon;
window.sendWerkbon = sendWerkbon;
window.downloadWerkbon = downloadWerkbon;
window.printWerkbon = printWerkbon;
