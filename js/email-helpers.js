// Microsoft Graph API - Exchange Online Email Functions

// ============================================
// EMAIL SENDING
// ============================================

// Send email via Exchange Online
async function sendEmail(emailData) {
    try {
        const message = {
            message: {
                subject: emailData.subject,
                body: {
                    contentType: emailData.isHtml ? "HTML" : "Text",
                    content: emailData.body
                },
                toRecipients: emailData.to.map(email => ({
                    emailAddress: { address: email }
                })),
                ccRecipients: emailData.cc ? emailData.cc.map(email => ({
                    emailAddress: { address: email }
                })) : [],
                bccRecipients: emailData.bcc ? emailData.bcc.map(email => ({
                    emailAddress: { address: email }
                })) : [],
                attachments: emailData.attachments || []
            },
            saveToSentItems: true
        };

        await callMicrosoftGraph('/me/sendMail', 'POST', message);
        
        // Save copy to SharePoint if needed
        if (emailData.saveToSharePoint) {
            await saveEmailToSharePoint(emailData);
        }
        
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Send email with file attachment from SharePoint
async function sendEmailWithSharePointAttachment(emailData, fileId) {
    try {
        // Download file from SharePoint
        const fileData = await downloadFileFromSharePoint(fileId);
        
        // Convert blob to base64
        const base64 = await blobToBase64(fileData.blob);
        
        // Add attachment to email
        emailData.attachments = emailData.attachments || [];
        emailData.attachments.push({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: fileData.fileName,
            contentType: fileData.blob.type,
            contentBytes: base64.split(',')[1] // Remove data:... prefix
        });
        
        return await sendEmail(emailData);
    } catch (error) {
        console.error('Error sending email with attachment:', error);
        throw error;
    }
}

// Helper: Convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ============================================
// EMAIL TEMPLATES
// ============================================

// Email templates for common scenarios
const emailTemplates = {
    huurcontract: {
        subject: "Huurcontract {{pand.adres}}",
        body: `
            <p>Beste {{huurder.voornaam}},</p>
            
            <p>Hierbij ontvangt u het huurcontract voor <strong>{{pand.adres}}, {{pand.postcode}} {{pand.plaats}}</strong>.</p>
            
            <p><strong>Details:</strong></p>
            <ul>
                <li>Adres: {{pand.adres}}</li>
                <li>Huurprijs: €{{contract.huurprijs}} per maand</li>
                <li>Startdatum: {{contract.startdatum}}</li>
                <li>Einddatum: {{contract.einddatum}}</li>
            </ul>
            
            <p>Graag het contract ondertekend retourneren.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>Stadsgezicht Ontwikkelingen en Beheer</strong><br>
            Stadionkade 94, 1076 BL Amsterdam<br>
            T: 020 47 00 965<br>
            E: info@stadsgezicht.nl</p>
        `,
        isHtml: true
    },
    
    huurverhoging: {
        subject: "Huurverhoging {{pand.adres}} per {{datum}}",
        body: `
            <p>Beste {{huurder.voornaam}},</p>
            
            <p>Hierbij informeren wij u dat de huurprijs van <strong>{{pand.adres}}</strong> per <strong>{{datum}}</strong> wordt verhoogd.</p>
            
            <p><strong>Nieuwe huurprijs:</strong> €{{nieuweHuur}} per maand<br>
            <strong>Huidige huurprijs:</strong> €{{oudeHuur}} per maand<br>
            <strong>Verhoging:</strong> €{{verschil}} ({{percentage}}%)</p>
            
            <p>Deze verhoging is conform de wettelijke regelgeving en het huurcontract.</p>
            
            <p>Voor vragen kunt u contact met ons opnemen.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>Stadsgezicht Ontwikkelingen en Beheer</strong></p>
        `,
        isHtml: true
    },
    
    onderhoud_bevestiging: {
        subject: "Bevestiging onderhoudsmelding {{pand.adres}}",
        body: `
            <p>Beste {{huurder.voornaam}},</p>
            
            <p>We hebben uw onderhoudsmelding ontvangen.</p>
            
            <p><strong>Melding:</strong> {{melding.titel}}<br>
            <strong>Prioriteit:</strong> {{melding.prioriteit}}<br>
            <strong>Adres:</strong> {{pand.adres}}</p>
            
            <p>We nemen zo spoedig mogelijk contact met u op om een afspraak te maken.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>Stadsgezicht Ontwikkelingen en Beheer</strong></p>
        `,
        isHtml: true
    },
    
    onderhoud_gepland: {
        subject: "Afspraak onderhoud {{pand.adres}} - {{datum}}",
        body: `
            <p>Beste {{huurder.voornaam}},</p>
            
            <p>Hierbij bevestigen wij de afspraak voor het onderhoud aan <strong>{{pand.adres}}</strong>.</p>
            
            <p><strong>Datum:</strong> {{datum}}<br>
            <strong>Tijd:</strong> {{tijd}}<br>
            <strong>Werkzaamheden:</strong> {{melding.beschrijving}}</p>
            
            <p>Zorg ervoor dat u aanwezig bent of dat iemand anders thuis is.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>Stadsgezicht Ontwikkelingen en Beheer</strong></p>
        `,
        isHtml: true
    },
    
    huur_herinnering: {
        subject: "Herinnering huurbetaling {{pand.adres}}",
        body: `
            <p>Beste {{huurder.voornaam}},</p>
            
            <p>Dit is een vriendelijke herinnering dat de huur voor <strong>{{pand.adres}}</strong> nog niet is ontvangen.</p>
            
            <p><strong>Te betalen bedrag:</strong> €{{contract.huurprijs}}<br>
            <strong>Betalingstermijn:</strong> {{maand}}</p>
            
            <p>Graag de betaling zo spoedig mogelijk overmaken naar:<br>
            IBAN: NL00 BANK 0000 0000 00<br>
            T.n.v.: Stadsgezicht Ontwikkelingen en Beheer B.V.<br>
            O.v.v.: Huur {{pand.adres}} - {{maand}}</p>
            
            <p>Heeft u al betaald? Dan kunt u deze herinnering negeren.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>Stadsgezicht Ontwikkelingen en Beheer</strong></p>
        `,
        isHtml: true
    },
    
    welkom_nieuwe_huurder: {
        subject: "Welkom bij Stadsgezicht - {{pand.adres}}",
        body: `
            <p>Beste {{huurder.voornaam}},</p>
            
            <p>Van harte welkom als nieuwe huurder bij Stadsgezicht!</p>
            
            <p>U huurt vanaf <strong>{{contract.startdatum}}</strong> het pand aan <strong>{{pand.adres}}, {{pand.postcode}} {{pand.plaats}}</strong>.</p>
            
            <p><strong>Belangrijke informatie:</strong></p>
            <ul>
                <li><strong>Huurprijs:</strong> €{{contract.huurprijs}} per maand</li>
                <li><strong>Betalingsdatum:</strong> {{contract.betalingsdatum}}e van de maand</li>
                <li><strong>Contact voor vragen:</strong> info@stadsgezicht.nl of 020 47 00 965</li>
                <li><strong>Spoed (buiten kantooruren):</strong> 06 XX XX XX XX</li>
            </ul>
            
            <p><strong>Bij problemen of onderhoud:</strong><br>
            Meld problemen via het vastgoedbeheer portaal of per email. Bij spoed kunt u altijd bellen.</p>
            
            <p>Wij wensen u veel woonplezier toe!</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>Stadsgezicht Ontwikkelingen en Beheer</strong><br>
            Stadionkade 94, 1076 BL Amsterdam<br>
            T: 020 47 00 965<br>
            E: info@stadsgezicht.nl<br>
            W: www.stadsgezicht.nl</p>
        `,
        isHtml: true
    }
};

// Fill email template with data
function fillEmailTemplate(templateName, data) {
    const template = emailTemplates[templateName];
    if (!template) {
        throw new Error(`Template ${templateName} not found`);
    }
    
    let subject = template.subject;
    let body = template.body;
    
    // Replace all placeholders with data
    const replacePlaceholders = (text, data) => {
        return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const keys = path.trim().split('.');
            let value = data;
            
            for (const key of keys) {
                value = value?.[key];
            }
            
            return value !== undefined ? value : match;
        });
    };
    
    subject = replacePlaceholders(subject, data);
    body = replacePlaceholders(body, data);
    
    return {
        subject: subject,
        body: body,
        isHtml: template.isHtml
    };
}

// ============================================
// EMAIL ARCHIVING TO SHAREPOINT
// ============================================

// Save email copy to SharePoint
async function saveEmailToSharePoint(emailData, folderPath = "Correspondentie") {
    try {
        // Create email HTML content
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${emailData.subject}</title>
</head>
<body>
    <h2>${emailData.subject}</h2>
    <p><strong>Aan:</strong> ${emailData.to.join(', ')}</p>
    ${emailData.cc ? `<p><strong>CC:</strong> ${emailData.cc.join(', ')}</p>` : ''}
    <p><strong>Datum:</strong> ${new Date().toLocaleString('nl-NL')}</p>
    <hr>
    <div>${emailData.body}</div>
</body>
</html>`;

        // Create file name
        const fileName = `Email_${new Date().toISOString().split('T')[0]}_${emailData.subject.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.html`;
        
        // Convert to blob
        const blob = new Blob([emailHtml], { type: 'text/html' });
        const file = new File([blob], fileName, { type: 'text/html' });
        
        // Upload to SharePoint
        const uploadedFile = await uploadFileToSharePoint(file, folderPath, {
            description: `Email verstuurd op ${new Date().toLocaleString('nl-NL')} - ${emailData.subject}`
        });
        
        return uploadedFile;
    } catch (error) {
        console.error('Error saving email to SharePoint:', error);
        // Don't throw error, just log it - email was sent successfully
        return null;
    }
}

// ============================================
// EMAIL READING (for future features)
// ============================================

// Get user's emails
async function getEmails(folderId = 'inbox', top = 10) {
    try {
        const emails = await callMicrosoftGraph(
            `/me/mailFolders/${folderId}/messages?$top=${top}&$select=subject,from,receivedDateTime,isRead,hasAttachments`
        );
        
        return emails.value;
    } catch (error) {
        console.error('Error getting emails:', error);
        throw error;
    }
}

// Search emails
async function searchEmails(query) {
    try {
        const results = await callMicrosoftGraph(
            `/me/messages?$search="${encodeURIComponent(query)}"&$top=25`
        );
        
        return results.value;
    } catch (error) {
        console.error('Error searching emails:', error);
        throw error;
    }
}

// Export functions
window.sendEmail = sendEmail;
window.sendEmailWithSharePointAttachment = sendEmailWithSharePointAttachment;
window.emailTemplates = emailTemplates;
window.fillEmailTemplate = fillEmailTemplate;
window.saveEmailToSharePoint = saveEmailToSharePoint;
window.getEmails = getEmails;
window.searchEmails = searchEmails;
