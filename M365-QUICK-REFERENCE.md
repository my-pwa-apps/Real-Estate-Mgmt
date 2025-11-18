# Microsoft 365 Integratie - Snelle Referentie

## 📧 Email Versturen

### Vanuit Contracten Pagina

1. Ga naar **Contracten**
2. Klik op het **📧 icoon** bij een contract
3. Bij eerste gebruik: klik "Ja" om in te loggen met Microsoft 365
4. Email wordt automatisch verstuurd met contract template
5. Kopie wordt opgeslagen in SharePoint onder Huurders/[Naam]/Correspondentie

### Vanuit Onderhoud Pagina

1. Ga naar **Onderhoud**
2. Bij een nieuwe melding, gebruik de bevestiging functie
3. Bevestigingsemail wordt verstuurd naar huurder
4. Melding status wordt automatisch geüpdatet naar "in behandeling"

## 📁 Documenten Beheren

### Automatische Folder Structuur

Wanneer je een nieuw pand of huurder aanmaakt, wordt automatisch een folder structuur aangemaakt in SharePoint:

**Voor Panden:**
```
Panden/
  └── [Adres-Postcode]/
      ├── Foto's/
      ├── Documenten/
      ├── Technisch/
      └── Verbouwing/
```

**Voor Huurders:**
```
Huurders/
  └── [Achternaam_Voornaam]/
      ├── Contracten/
      ├── Correspondentie/
      └── Documenten/
```

### Document Uploaden (Binnenkort)

Functionaliteit om documenten direct vanuit de app te uploaden komt binnenkort beschikbaar.

## 🔐 Microsoft 365 Inloggen

### Eerste Keer Inloggen

1. Open het **Dashboard**
2. Klik op de knop **"🔐 Microsoft 365 Inloggen"** onderaan de sidebar
3. Microsoft login popup verschijnt
4. Log in met uw werk/school account
5. Accepteer de gevraagde permissions (eerste keer):
   - **Files.ReadWrite.All** - Voor document beheer
   - **Sites.ReadWrite.All** - Voor SharePoint toegang
   - **Mail.Send** - Voor email versturen
   - **Mail.ReadWrite** - Voor email beheer
6. Na succesvolle login toont de knop: **"✅ Microsoft 365"**

### Permissions Geaccepteerd?

De volgende permissions zijn nodig:
- ✅ Bestanden lezen en schrijven in SharePoint/OneDrive
- ✅ SharePoint sites lezen en schrijven
- ✅ Emails versturen namens u
- ✅ Emails lezen en schrijven

Deze permissions zijn nodig om:
- Contracten en documenten op te slaan
- Correspondentie te archiveren
- Emails te versturen naar huurders
- Alle content beschikbaar te maken voor Copilot

## 📧 Beschikbare Email Templates

### 1. Huurcontract
- **Wanneer:** Contract emailen naar huurder
- **Bevat:** Adres, huurprijs, start/einddatum
- **Trigger:** 📧 icoon in contracten lijst

### 2. Huurverhoging
- **Wanneer:** Huurprijs verhogen
- **Bevat:** Oude/nieuwe huur, verschil, percentage
- **Gebruik:** Via code (binnenkort in UI)

### 3. Onderhoud Bevestiging
- **Wanneer:** Nieuwe onderhoudsmelding ontvangen
- **Bevat:** Melding details, prioriteit, adres
- **Trigger:** Bevestig knop bij melding

### 4. Onderhoud Gepland
- **Wanneer:** Afspraak inplannen voor onderhoud
- **Bevat:** Datum, tijd, werkzaamheden
- **Gebruik:** Via code (binnenkort in UI)

### 5. Huur Herinnering
- **Wanneer:** Huur niet ontvangen
- **Bevat:** Bedrag, maand, betaalinstructies
- **Gebruik:** Via code (binnenkort in UI)

### 6. Welkom Nieuwe Huurder
- **Wanneer:** Nieuw contract start
- **Bevat:** Welkomstbericht, contact info, belangrijke zaken
- **Gebruik:** Via code (binnenkort in UI)

## 🔍 Zoeken met Copilot

Na het archiveren van documenten en emails in SharePoint, kun je Copilot gebruiken voor natural language queries:

### Voorbeeld Queries (in Microsoft 365 Copilot):

**"Wat waren de laatste emails naar huurders over onderhoud?"**
→ Copilot zoekt in Correspondentie folders

**"Toon alle contracten uit 2024"**
→ Copilot zoekt in Contracten/2024 folder

**"Welke onderhoudskosten hadden we vorig jaar voor Keizersgracht 123?"**
→ Copilot zoekt in Onderhoud/2023/Keizersgracht_123

**"Zijn er open vragen van huurders?"**
→ Copilot analyseert recente email correspondentie

## 🛠️ Troubleshooting

### "U moet eerst inloggen met Microsoft 365"

**Oplossing:**
- Klik op "🔐 Microsoft 365 Inloggen" in het dashboard
- Volg de login stappen
- Probeer opnieuw

### "Access token invalid"

**Oplossing:**
- Token is verlopen (geldig voor 1 uur)
- Log opnieuw in met Microsoft 365
- Als probleem blijft: check Azure AD app permissions

### "Fout bij versturen email"

**Mogelijke oorzaken:**
1. Niet ingelogd → Log in met Microsoft 365
2. Geen mailbox → Controleer of gebruiker Exchange Online heeft
3. Huurder email ontbreekt → Voeg email toe aan huurder gegevens

**Oplossing:**
- Check browser console (F12) voor details
- Controleer of Mail.Send permission is granted in Azure AD

### "SharePoint folder aanmaken mislukt"

**Mogelijke oorzaken:**
1. SharePoint site bestaat niet
2. Geen toegang tot site
3. Sites.ReadWrite.All permission niet granted

**Oplossing:**
- Check `js/sharepoint-helpers.js` → SHAREPOINT_SITE_NAME moet juist zijn
- Controleer site toegang in SharePoint
- Controleer Azure AD permissions

### Popup Blocker

Als de Microsoft login popup niet verschijnt:
1. Sta popups toe voor deze site
2. Browser settings → Popups toestaan voor localhost/jouw domein
3. Probeer opnieuw

## 📊 Data Flow Overzicht

```
┌─────────────────┐
│   Applicatie    │
│   (Browser)     │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│    Firebase     │   │  Microsoft 365   │
│ Realtime DB     │   │   (Graph API)    │
├─────────────────┤   ├──────────────────┤
│ • Panden        │   │ • SharePoint     │
│ • Huurders      │   │ • OneDrive       │
│ • Contracten    │   │ • Exchange       │
│ • Onderhoud     │   │ • Copilot        │
│ • Transacties   │   │                  │
└─────────────────┘   └──────────────────┘

Firebase = Real-time metadata en operationele data
Microsoft 365 = Documenten, emails, en Copilot indexering
```

## ✅ Quick Checklist

Voordat je begint met M365 integratie:

- [ ] Azure AD app geregistreerd (zie AZURE-AD-SETUP.md)
- [ ] API permissions granted en admin consent gegeven
- [ ] SharePoint site aangemaakt en geconfigureerd
- [ ] `js/microsoft-auth.js` → clientId en tenantId ingevuld
- [ ] `js/sharepoint-helpers.js` → SHAREPOINT_SITE_NAME ingevuld
- [ ] MSAL.js CDN link toegevoegd aan HTML pagina's
- [ ] Eerste keer ingelogd met Microsoft 365 in dashboard
- [ ] Test email verzonden naar testaccount

## 🎯 Best Practices

### Naamgeving Conventies

**Folders:**
- Panden: `[Adres-Postcode]` bijv. `Keizersgracht_123-1015_CJ`
- Huurders: `[Achternaam_Voornaam]` bijv. `Jansen_Piet`
- Jaren: `[YYYY]` bijv. `2024`

**Bestanden:**
- Contracten: `Contract_[Adres]_[Startdatum].pdf`
- Emails: `Email_[Datum]_[Onderwerp].html`
- Onderhoud: `Melding_[Datum]_[Adres]_[Beschrijving].pdf`

### Metadata

Voeg altijd metadata toe aan documenten voor betere Copilot indexering:
- **description**: Korte omschrijving van document
- **keywords**: Relevante zoektermen
- Custom properties (zie `updateFileMetadata()` in sharepoint-helpers.js)

### Security

- **Folders zijn organisatie-breed zichtbaar** → gebruik geen gevoelige persoonlijke info in bestandsnamen
- **Email archivering** → emails worden opgeslagen als HTML in SharePoint
- **Access control** → configureer SharePoint folder permissions indien nodig
- **Audit logs** → alle M365 activiteiten worden gelogd in Microsoft 365 Compliance Center

---

**Vragen?** Check `M365-INTEGRATION-ARCHITECTURE.md` voor technische details.
