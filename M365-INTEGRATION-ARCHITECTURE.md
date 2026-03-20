# Microsoft 365 Integratie - Architectuur & Strategie

## 🎯 Hybride Architectuur: Firebase + Microsoft 365

### Filosofie: "Best of Both Worlds"

**Firebase Realtime Database** → Snelle, real-time operationele data  
**Microsoft 365** → Documenten, communicatie, en Copilot integratie

---

## 📊 Data Strategie

### Firebase (Real-time Operationele Data)

```
✅ Panden (metadata, status, prijzen)
✅ Huurders (contactgegevens, notities)
✅ Contracten (actieve data, termijnen)
✅ Onderhoud (meldingen, status tracking)
✅ Financieel (transacties, overzichten)
✅ Configuratie (gebruikersinstellingen, app config)
```

**Waarom Firebase hier?**

- Real-time updates voor dashboard
- Snelle queries en filters
- Offline support
- Geen file size limits voor metadata

### Microsoft 365 SharePoint (Documenten & Archief)

```
📁 Stadsgezicht Vastgoedbeheer/
   ├── 📁 Panden/
   │   ├── 📁 [Adres - Postcode]/
   │   │   ├── 📄 Aankoopcontract.pdf
   │   │   ├── 📄 Taxatierapport.pdf
   │   │   ├── 📄 Bouwkundige_Inspectie.pdf
   │   │   ├── 📁 Foto's/
   │   │   ├── 📁 Technische_Documenten/
   │   │   └── 📁 Verbouwing/
   │   └── ...
   │
   ├── 📁 Huurders/
   │   ├── 📁 [Achternaam_Voornaam]/
   │   │   ├── 📄 Huurcontract_[datum].pdf
   │   │   ├── 📄 ID_Kopie.pdf
   │   │   ├── 📄 Inkomensverklaring.pdf
   │   │   ├── 📁 Correspondentie/
   │   │   └── 📁 Opzegging/
   │   └── ...
   │
   ├── 📁 Contracten/
   │   ├── 📁 [Jaar]/
   │   │   ├── 📄 Contract_[Adres]_[Huurder].pdf
   │   │   └── 📄 Bijlage_Contract.pdf
   │   └── ...
   │
   ├── 📁 Onderhoud/
   │   ├── 📁 [Jaar]/
   │   │   ├── 📁 [Adres]/
   │   │   │   ├── 📄 Onderhoud_[datum]_[beschrijving].pdf
   │   │   │   ├── 📄 Offertes/
   │   │   │   ├── 📄 Facturen/
   │   │   │   └── 📄 Foto's_voor_na/
   │   │   └── ...
   │   └── ...
   │
   ├── 📁 Financieel/
   │   ├── 📁 [Jaar]/
   │   │   ├── 📄 Jaaroverzicht.xlsx
   │   │   ├── 📁 Facturen_Inkoop/
   │   │   ├── 📁 Facturen_Verkoop/
   │   │   ├── 📁 Belastingaangifte/
   │   │   └── 📁 Accountant/
   │   └── ...
   │
   ├── 📁 Templates/
   │   ├── 📄 Huurcontract_Template.docx
   │   ├── 📄 Opzegging_Template.docx
   │   ├── 📄 Huuropzegging_Huurder.docx
   │   └── 📄 Brief_Huurverhoging.docx
   │
   └── 📁 Archief/
       └── 📁 [Jaar]/
```

**Waarom SharePoint hier?**

- Copilot kan alle documenten doorzoeken
- Versiehistorie van documenten
- Compliance en audit trails
- Centrale documentopslag
- Gestructureerde metadata voor AI

### Exchange Online (Communicatie)

```
📧 Alle emails met huurders → Geindexeerd voor Copilot
📧 Email templates voor standaard communicatie
📧 Automatische herinneringen (huur, onderhoud)
📧 Correspondentie archief
```

---

## 🔗 Integratie Flows

### 1️⃣ Nieuw Huurcontract Flow

```
Gebruiker → WebApp (Firebase)
   ↓
1. Contract data opslaan in Firebase
2. Contract PDF genereren (browser)
3. Upload naar SharePoint: /Contracten/[Jaar]/
4. Maak huurder folder: /Huurders/[Naam]/
5. Copy contract naar huurder folder
6. Stuur email via Graph API met contract attachment
7. Update Firebase met SharePoint links
   ↓
Copilot kan contract vinden en inhoud lezen
```

### 2️⃣ Onderhoud Melding Flow

```
Huurder meldt probleem → WebApp
   ↓
1. Melding opslaan in Firebase (real-time tracking)
2. Email naar beheerder via Exchange
3. Foto's uploaden naar SharePoint: /Onderhoud/[Jaar]/[Adres]/
4. Offerte ontvangen → Upload naar SharePoint
5. Status updates in Firebase
6. Afronding → Factuur naar SharePoint
   ↓
Copilot kan hele onderhoud historie traceren
```

### 3️⃣ Document Opvragen via Copilot

```
Manager vraagt Copilot:
"Wat was de inhoud van het huurcontract van [Naam]?"
   ↓
Copilot zoekt in SharePoint
Vindt contract met metadata:
- Huurder: [Naam]
- Adres: [Adres]
- Type: Huurcontract
- Huurprijs: €X
- Startdatum: [Datum]
   ↓
Copilot geeft samenvatting + link naar document
```

---

## 🔐 Microsoft Graph API Setup

### App Registratie (Azure AD)

**Benodigde Permissions:**

**Delegated (Gebruiker aanwezig):**

```
Files.ReadWrite.All          → OneDrive/SharePoint
Sites.ReadWrite.All          → SharePoint sites
Mail.Send                    → Emails versturen
Mail.ReadWrite              → Emails lezen/archiveren
User.Read                   → Gebruiker info
```

**Application (Background tasks):**

```
Sites.ReadWrite.All          → Automatische folder aanmaken
Files.ReadWrite.All          → Document management
Mail.Send                    → Automatische emails
```

### Authentication Flow

**MSAL.js (Microsoft Authentication Library)**

```javascript
// Single Sign-On met Microsoft 365
// Gebruikers loggen in met @stadsgezicht.nl account
// Automatische toegang tot SharePoint + Exchange
```

---

## 💡 Slimme Features

### 1. Intelligente Document Categorisatie

**Automatische metadata bij upload:**

```javascript
{
  "Type": "Huurcontract",
  "Huurder": "Jan Jansen",
  "Adres": "Stadionkade 94",
  "Startdatum": "2025-01-01",
  "Einddatum": "2026-01-01",
  "Huurprijs": "1500",
  "Status": "Actief",
  "Tags": ["Contract", "Woning", "Amsterdam"]
}
```

### 2. Email Templates met Merge Fields

**Template: Huurverhoging.docx**

```
Beste {{Huurder.Voornaam}},

Hierbij informeren wij u dat de huurprijs van {{Pand.Adres}}
per {{Contract.Wijzigingsdatum}} wordt verhoogd naar €{{Contract.NieuweHuur}}.

Dit is een verhoging van {{Berekening.Percentage}}% conform...
```

### 3. Copilot Prompts in SharePoint

**Metadata voor betere AI resultaten:**

```json
{
  "ContentType": "Huurcontract",
  "Subject": "Huurovereenkomst [Adres] - [Huurder]",
  "Category": "Contracten",
  "Keywords": "huurcontract, woning, amsterdam, stadsgezicht",
  "Description": "Huurcontract voor [Adres] met [Huurder] vanaf [Datum]",
  "RelatedTo": ["PandID: 123", "HuurderID: 456"],
  "BusinessProcess": "Verhuur"
}
```

---

## 🏗️ Implementatie Architectuur

### Frontend (Browser)

```
HTML/CSS/JS WebApp
   ↓
┌──────────┬──────────────┐
│ Firebase │ MS Graph API │
└──────────┴──────────────┘
     ↓              ↓
 Real-time    Documents &
   Data         Emails
```

### Data Flow Strategie

**CREATE (Nieuw item):**

```
1. Save to Firebase (instant, real-time)
2. Generate document (if needed)
3. Upload to SharePoint (async)
4. Send email (if needed)
5. Update Firebase with links
```

**READ (Data ophalen):**

```
1. Firebase → Snelle metadata
2. SharePoint → Document links
3. Lazy load documents on demand
```

**UPDATE (Wijzigen):**

```
1. Update Firebase (instant UI update)
2. Version document in SharePoint
3. Send notification email
```

**DELETE (Verwijderen):**

```
1. Soft delete in Firebase
2. Move to Archief in SharePoint
3. Retain for compliance (7 jaar)
```

---

## 📱 User Experience

### Document Upload

```
[Upload Knop] → Browser file picker
   ↓
• Show upload progress
• Extract metadata from filename
• Auto-categorize based on context
• Upload to correct SharePoint folder
• Link in Firebase
   ↓
✅ Document beschikbaar voor Copilot
```

### Email Verzenden

```
[Email Knop] → Template selector
   ↓
• Pre-fill met huurder gegevens
• Attachment keuze (docs van SharePoint)
• Preview voor versturen
• Send via Graph API
• Copy naar SharePoint /Correspondentie/
   ↓
✅ Email beschikbaar in Exchange + SharePoint
```

---

## 🎯 Copilot Optimalisatie

### 1. Rijke Metadata

Elk document krijgt uitgebreide properties zodat Copilot context begrijpt

### 2. Naamgevingsconventies

```
[Type]_[Adres]_[Huurder]_[Datum].pdf
Contract_Stadionkade94_JanJansen_2025-01-01.pdf
```

### 3. Taxonomy & Tags

Gebruik SharePoint managed metadata voor consistente categorisatie

### 4. Content Types

Custom SharePoint content types voor elk document type

---

## 🔄 Migratie & Synchronisatie

### Firebase ↔ SharePoint Link

```javascript
// Firebase document
{
  "contractId": "abc123",
  "sharePointUrl": "https://stadsgezicht.sharepoint.com/.../Contract.pdf",
  "sharePointId": "unique-file-id",
  "lastSync": "2025-11-18T10:30:00Z"
}
```

### Sync Strategy

- Firebase = "source of truth" voor operationele data
- SharePoint = "source of truth" voor documenten
- Bidirectional links, maar geen duplicate data

---

## 🚀 Voordelen

✅ **Copilot kan alles vinden** - Documenten, emails, context  
✅ **Compliance ready** - Alle documenten centraal en versioned  
✅ **Real-time updates** - Dashboard blijft snel via Firebase  
✅ **Professional communicatie** - Via Exchange met bedrijfsidentiteit  
✅ **Schaalbaarheid** - Beide systemen groeien mee  
✅ **Disaster recovery** - Microsoft 365 backup + Firebase backup  
✅ **Mobile ready** - Beide hebben mobiele toegang  
✅ **Audit trail** - Alle acties traceerbaar

---

## 📋 Volgende Stappen

1. Azure AD App registreren
2. Microsoft Graph API credentials
3. MSAL.js authenticatie implementeren
4. SharePoint site structure aanmaken
5. Document upload/download flows
6. Email sending implementeren
7. Template system bouwen
8. Copilot metadata optimaliseren

Deze hybride aanpak geeft u het beste van beide werelden! 🎉
