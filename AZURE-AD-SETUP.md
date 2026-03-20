# Azure AD App Registration Setup

Deze handleiding beschrijft stap voor stap hoe je een Azure AD app registreert voor de Microsoft 365 integratie van Stadsgezicht Vastgoedbeheer.

## Vereisten

- Een Microsoft 365 tenant (werk/school account)
- Toegang tot Azure Portal (admin rechten voor app registratie)
- Het domein van je tenant (bijv. stadsgezicht.onmicrosoft.com)

---

## Stap 1: App Registreren in Azure Portal

1. **Ga naar Azure Portal**: https://portal.azure.com
2. **Navigeer naar Azure Active Directory**:
   - Klik op het menu (☰) links boven
   - Selecteer "Azure Active Directory"
3. **Open App Registrations**:
   - Klik in het linkermenu op "App registrations"
   - Klik op "+ New registration"

---

## Stap 2: Basis Configuratie

Vul de volgende gegevens in:

**Name**: `Stadsgezicht Vastgoedbeheer`

**Supported account types**: Selecteer één van:

- **Single tenant** (aanbevolen): Alleen accounts uit jouw organisatie
- **Multi-tenant**: Als je meerdere organisaties moet ondersteunen

**Redirect URI**:

- Platform: **Single-page application (SPA)**
- URL: `http://localhost:5500` (voor lokale ontwikkeling)

Later voeg je productie URLs toe zoals `https://jouwdomein.nl`

Klik op **Register**.

---

## Stap 3: Kopieer Application (client) ID

Na registratie zie je de **Overview** pagina:

1. **Kopieer de Application (client) ID** (GUID format)
2. **Kopieer de Directory (tenant) ID** (GUID format)

Voorbeeld:

```
Application (client) ID: 12345678-1234-1234-1234-123456789abc
Directory (tenant) ID: 87654321-4321-4321-4321-cba987654321
```

Deze waarden heb je nodig voor `js/microsoft-auth.js`.

---

## Stap 4: API Permissions Instellen

1. Klik in het linkermenu op **API permissions**
2. Klik op **+ Add a permission**
3. Selecteer **Microsoft Graph**
4. Selecteer **Delegated permissions**

Voeg de volgende permissions toe:

### Voor SharePoint/OneDrive:

- ✅ **Files.ReadWrite.All** - Lezen en schrijven van alle bestanden
- ✅ **Sites.ReadWrite.All** - Lezen en schrijven van alle SharePoint sites

### Voor Email:

- ✅ **Mail.Send** - Email versturen namens de gebruiker
- ✅ **Mail.ReadWrite** - Email lezen en schrijven

### Basis:

- ✅ **User.Read** - Gebruikersprofiel lezen

5. Klik na elke permission op **Add permissions**
6. **Belangrijk**: Klik op **Grant admin consent for [Organization]**
   - Dit voorkomt dat elke gebruiker individueel moet instemmen
   - Je hebt admin rechten nodig voor deze stap

Na consent zie je groene vinkjes bij alle permissions.

---

## Stap 5: Authentication Configuratie

1. Klik in het linkermenu op **Authentication**
2. Bij **Single-page application** zie je je redirect URI

### Voeg extra redirect URIs toe:

**Voor productie**:

```
https://jouwdomein.nl
https://www.jouwdomein.nl
```

**Voor lokale development**:

```
http://localhost:5500
http://localhost:8080
http://127.0.0.1:5500
```

### Implicit grant and hybrid flows:

Zorg dat de volgende **NIET** zijn aangevinkt (MSAL.js 2.0 gebruikt Auth Code Flow):

- ❌ Access tokens
- ❌ ID tokens

### Advanced settings:

- **Allow public client flows**: ❌ Nee (blijf op "No")

Klik op **Save**.

---

## Stap 6: Configureer de Code

Open `js/microsoft-auth.js` en update de configuratie:

```javascript
const msalConfig = {
  auth: {
    clientId: "12345678-1234-1234-1234-123456789abc", // Jouw Application (client) ID
    authority:
      "https://login.microsoftonline.com/87654321-4321-4321-4321-cba987654321", // Jouw Tenant ID
    redirectUri: window.location.origin, // Of specifieke URL
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

**Let op**:

- Vervang `clientId` met jouw Application (client) ID uit stap 3
- Vervang de GUID in `authority` met jouw Directory (tenant) ID uit stap 3

---

## Stap 7: Test de Integratie

1. **Open de webapp** in een browser
2. **Klik op "Aanmelden met Microsoft"**
3. **Accepteer de permissions** (eerste keer)
4. **Check of je naam verschijnt** in de UI

### Mogelijke problemen:

**"AADSTS50011: The redirect URI ... does not match"**

- ✅ Check of de URL exact overeenkomt in Azure AD Authentication settings
- ✅ Let op http vs https
- ✅ Let op trailing slashes

**"AADSTS65001: The user or administrator has not consented"**

- ✅ Ga naar Azure AD > App registrations > API permissions
- ✅ Klik op "Grant admin consent"

**"Access token invalid"**

- ✅ Check of alle scopes zijn toegevoegd in API permissions
- ✅ Check of admin consent is gegeven

---

## Stap 8: SharePoint Site Configuratie

Voor document opslag heb je een SharePoint site nodig:

### Optie A: Bestaande Site Gebruiken

1. Ga naar je SharePoint site (bijv. https://tenant.sharepoint.com/sites/vastgoedbeheer)
2. Kopieer de **site naam** (het deel na /sites/)
3. Update in `js/sharepoint-helpers.js`:

```javascript
const SHAREPOINT_SITE_NAME = "vastgoedbeheer"; // Jouw site naam
```

### Optie B: Nieuwe Site Aanmaken

1. Ga naar https://admin.microsoft.com
2. Klik op **SharePoint** in het admin menu
3. Klik op **Active sites** > **+ Create**
4. Kies **Team site**
5. Naam: `Stadsgezicht Vastgoedbeheer`
6. URL: `/sites/vastgoedbeheer`
7. Klik op **Finish**

Wacht tot de site is aangemaakt en update dan `sharepoint-helpers.js` zoals hierboven.

---

## Stap 9: Folder Structuur Aanmaken (Optioneel)

De app maakt automatisch folders aan, maar je kunt ze ook handmatig voorbereiden:

Ga naar de **Documents** bibliotheek in SharePoint en maak aan:

```
📁 Panden/
📁 Huurders/
📁 Contracten/
📁 Onderhoud/
📁 Financieel/
```

De app zal automatisch subfolders aanmaken per pand en huurder.

---

## Stap 10: Email Testing

Test email functionaliteit:

1. Open **contracten.html**
2. Selecteer een contract
3. Klik op **Email Contract**
4. Check of email wordt verstuurd via Exchange Online
5. Check of kopie wordt opgeslagen in SharePoint Correspondentie folder

---

## Productie Deployment Checklist

Voordat je live gaat:

- [ ] Productie redirect URIs toegevoegd in Azure AD
- [ ] Admin consent gegeven voor alle permissions
- [ ] SharePoint site geconfigureerd en toegankelijk
- [ ] HTTPS configuratie getest
- [ ] Email templates aangepast met juiste bedrijfsgegevens
- [ ] IBAN nummer toegevoegd in huur_herinnering template
- [ ] Spoed telefoonnummer toegevoegd in welkom_nieuwe_huurder template
- [ ] Folder permissions ingesteld in SharePoint (wie mag wat zien?)

---

## Beveiliging & Best Practices

### Access Tokens

- Tokens worden opgeslagen in sessionStorage (niet localStorage)
- Tokens verlopen na 1 uur (automatische refresh)
- Log uit bij beëindigen sessie

### Permissions

- Gebruik **minste privileges principe**: vraag alleen permissions die echt nodig zijn
- Delegated permissions: gebruiker moet zelf ingelogd zijn
- Application permissions: alleen als achtergrond processen nodig zijn (niet voor deze app)

### SharePoint

- Stel folder permissions in per huurder als privacy vereist is
- Gebruik versioning voor documenten (ingeschakeld standaard)
- Backup strategie: SharePoint heeft ingebouwde backup (30 dagen recycle bin)

### Compliance

- Alle documenten en emails worden gearchiveerd in M365 voor Copilot
- AVG compliant door gebruik van Microsoft 365 (DPA agreements)
- Audit logs beschikbaar via Microsoft 365 Compliance Center

---

## Troubleshooting

### CORS Errors

Als je CORS errors krijgt bij Graph API calls:

- Check of redirect URI correct is ingesteld
- Check of je MSAL.js versie 2.x gebruikt (niet 1.x)
- Single-page application (SPA) flow moet zijn ingesteld, niet "Web"

### Token Acquisition Fails

```javascript
// Check in browser console:
console.log(await msalInstance.getAllAccounts());
```

Als leeg: gebruiker is niet ingelogd, roep `signInToMicrosoft()` aan.

### SharePoint Access Denied

- Check of user toegang heeft tot de SharePoint site
- Check of Sites.ReadWrite.All permission is granted
- Check of admin consent is gegeven

### Email Sending Fails

- Check of Mail.Send permission is granted
- Check of user een mailbox heeft in Exchange Online
- Test met een eenvoudige email zonder bijlagen eerst

---

## Support & Documentatie

- **Microsoft Graph API**: https://learn.microsoft.com/graph/api/overview
- **MSAL.js Docs**: https://learn.microsoft.com/azure/active-directory/develop/msal-overview
- **SharePoint Graph API**: https://learn.microsoft.com/graph/api/resources/sharepoint
- **Exchange Graph API**: https://learn.microsoft.com/graph/api/resources/mail-api-overview

Bij vragen: raadpleeg M365-INTEGRATION-ARCHITECTURE.md voor architectuur details.
