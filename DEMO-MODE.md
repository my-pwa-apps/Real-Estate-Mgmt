# Demo Mode Handleiding

## Wat is Demo Mode?

Demo Mode stelt u in staat om de Stadsgezicht Vastgoedbeheer applicatie volledig te verkennen **zonder enige configuratie**:

- ❌ Geen Azure AD / Entra ID setup nodig
- ❌ Geen Firebase configuratie vereist
- ❌ Geen Microsoft 365 integratie nodig
- ✅ Volledig functionele applicatie met realistische dummy data
- ✅ Alle features beschikbaar voor testen
- ✅ Data wordt lokaal opgeslagen in browser

---

## Wanneer Demo Mode Gebruiken?

### ✅ Geschikt voor:
- **Product demonstraties** aan klanten of stakeholders
- **Training** van nieuwe gebruikers
- **Testen** van nieuwe features zonder productie data te beïnvloeden
- **Ontwikkeling** zonder backend configuratie
- **Quick preview** voor besluitvormers

### ❌ Niet geschikt voor:
- Productie gebruik
- Opslaan van echte data
- Multiple gebruikers (data is lokaal per browser)
- Lange termijn data opslag

---

## Demo Mode Activeren

### Via Login Scherm

1. Open de applicatie in browser
2. Klik op **"Demo Modus (Geen inlog vereist)"**
3. U wordt automatisch doorgestuurd naar het dashboard
4. **🎭 DEMO MODUS** indicator verschijnt in sidebar

### Direct URL (Bookmark)

```
http://localhost:5500/index.html#demo
```

Demo mode wordt automatisch geactiveerd.

---

## Wat zit er in Demo Data?

### 🏢 Panden (5 stuks)
- Keizersgracht 123 - Bedrijfspand (verhuurd, €3.500/maand)
- Prinsengracht 456 - Woning (verhuurd, €2.100/maand)
- Herengracht 789 - Bedrijfspand (verhuurd, €2.800/maand)
- Jordaanstraat 12 - Woning (beschikbaar, €1.650/maand)
- Nieuwezijds Voorburgwal 234 - Bedrijfspand (onderhoud, €4.200/maand)

### 👥 Huurders (3 stuks)
- Jan de Vries - Huurder van Herengracht 789
- Maria Jansen - Huurder van Prinsengracht 456
- Tech Solutions B.V. - Zakelijke huurder van Keizersgracht 123

### 📄 Contracten (3 actief)
- Tech Solutions B.V. - 5-jarig contract
- Maria Jansen - 2-jarig contract
- Jan de Vries - 1-jarig contract

### 🔧 Onderhoud (5 meldingen)
- CV ketel onderhoudsbeurt (gepland)
- Lekkage badkamer (in behandeling, hoog prioriteit)
- Renovatie elektrische bedrading (in behandeling)
- Schilderwerk gevel (afgerond)
- Kapotte ruit (nieuw, urgent)

### 💰 Financieel (2024 data)
- Maandelijkse huurinkomsten: ~€9.200
- Onderhoudskosten: €17.790 (YTD)
- Overige kosten: €6.575 (verzekering, administratie, belasting)
- Netto resultaat: Realistisch positief

---

## Demo Mode Features

### Volledig Functioneel

In demo mode kunt u:

✅ **Panden toevoegen/bewerken/verwijderen**  
✅ **Huurders beheren**  
✅ **Contracten aanmaken**  
✅ **Onderhoudsmeldingen registreren**  
✅ **Financiële transacties toevoegen**  
✅ **Alle filters en zoekfuncties gebruiken**  
✅ **Dashboard statistieken bekijken**  
✅ **Alle CRUD operaties uitvoeren**

### Beperkt/Gesimuleerd

❌ **Email verzenden**: Wordt gesimuleerd (geen echte emails)  
❌ **Document opslag**: SharePoint integratie niet beschikbaar  
❌ **Microsoft 365 features**: Enkel demo mode zonder M365 backend  
❌ **Multi-user**: Data is lokaal, niet gedeeld tussen gebruikers  

---

## Data Beheer in Demo Mode

### Data Opslag

- Data wordt opgeslagen in **browser localStorage**
- Blijft beschikbaar na sluiten browser (zelfde computer/browser)
- **Niet** gesynchroniseerd met server
- **Niet** gedeeld tussen browsers/computers

### Data Resetten

**Optie 1: Via Admin Interface**

1. Ga naar **Admin** pagina (in sidebar)
2. Klik op **"Demo Modus"** tab
3. Klik **"Reset Demo Data"**
4. Bevestig actie
5. Pagina wordt herladen met originele demo data

**Optie 2: Via Browser**

1. Open Developer Tools (F12)
2. Console tab
3. Run:
```javascript
getDemoDatabase().reset();
location.reload();
```

### Data Exporteren

Demo data kan worden geëxporteerd als JSON backup:

1. Ga naar **Admin** > **Demo Modus** tab
2. Klik **"Exporteer Demo Data"**
3. JSON bestand wordt gedownload
4. Opslaan als backup

### Data Importeren

Eerder geëxporteerde data kan worden geïmporteerd:

1. Ga naar **Admin** > **Demo Modus** tab
2. Klik **"Importeer Demo Data"**
3. Selecteer JSON bestand
4. Data wordt overschreven met import

---

## Demo Mode Verlaten

### Via Sidebar

1. Klik op **🎭 DEMO MODUS** indicator in sidebar
2. Bevestig "Demo modus verlaten?"
3. U keert terug naar login scherm

### Via Admin Pagina

1. Ga naar **Admin** > **Demo Modus** tab
2. Klik **"Verlaat Demo Modus"**
3. Bevestig actie
4. U keert terug naar login scherm

### Via Logout

1. Klik **"Uitloggen"** knop
2. Demo mode wordt automatisch uitgeschakeld
3. U keert terug naar login scherm

---

## Demo Mode voor Presentaties

### Tips voor Effectieve Demo's

**1. Prep Work**
- Open applicatie vooraf en laat demo data laden
- Maak browser fullscreen (F11)
- Sluit onnodige tabs
- Gebruik grote font size indien presenteren op beamer

**2. Demo Flow Suggestie**

```
1. Dashboard → Toon overzicht statistieken
2. Panden → Filter op type, toon details
3. Huurders → Zoek functie demonstreren
4. Contracten → Status tracking, verlopende contracten
5. Onderhoud → Prioriteit levels, status workflow
6. Financieel → Maandoverzicht, transacties
7. (Admin → Settings en configuratie opties)
```

**3. Talking Points**

- **Real-time updates**: "Alle wijzigingen worden direct zichtbaar"
- **User-friendly**: "Geen technische kennis nodig"
- **Complete workflow**: "Van pand tot huurder tot contract"
- **Overzichtelijk**: "Dashboard geeft direct inzicht"
- **Flexibel**: "Eenvoudig filters en zoeken"

---

## Demo Mode vs Productie

| Feature | Demo Mode | Productie (Entra ID) |
|---------|-----------|----------------------|
| Login vereist | ❌ Nee | ✅ Ja (Microsoft 365) |
| Azure AD configuratie | ❌ Niet nodig | ✅ Vereist |
| Firebase setup | ❌ Niet nodig | ✅ Vereist |
| M365 integratie | ❌ Gesimuleerd | ✅ Volledig functioneel |
| Data persistence | 📱 Lokaal (browser) | ☁️ Cloud (Firebase) |
| Multi-user | ❌ Nee | ✅ Ja |
| Email verzenden | ❌ Gesimuleerd | ✅ Echt (Exchange) |
| SharePoint docs | ❌ Niet beschikbaar | ✅ Volledig |
| Copilot indexing | ❌ Niet beschikbaar | ✅ Ja |
| Rol-based access | 🎭 Altijd admin | ✅ Via Azure AD groups |
| Data backup | ❌ Handmatig export | ✅ Automatisch |

---

## Veelgestelde Vragen

**Q: Kan ik demo data aanpassen en opslaan?**  
A: Ja! Alle wijzigingen worden opgeslagen in browser localStorage. Bij volgende bezoek (zelfde browser/computer) is je data er nog.

**Q: Verdwijnt mijn demo data als ik de browser sluit?**  
A: Nee, data blijft opgeslagen in localStorage totdat je browser cache leegt of demo data reset.

**Q: Kan ik demo mode gebruiken voor training?**  
A: Absoluut! Demo mode is perfect voor training. Elke gebruiker kan op eigen computer demo mode gebruiken met eigen data.

**Q: Hoe weet ik dat ik in demo mode zit?**  
A: De **🎭 DEMO MODUS** indicator is altijd zichtbaar in de sidebar (links onderaan).

**Q: Kan ik van demo mode naar productie switchen zonder data te verliezen?**  
A: Demo data kan worden geëxporteerd en handmatig worden overgezet, maar er is geen automatische migratie. Start productie met lege database of migreer handmatig.

**Q: Is demo mode veilig voor gevoelige data?**  
A: ❌ Nee! Gebruik demo mode ALLEEN met dummy data. Demo data is opgeslagen in plain text in browser en is niet beveiligd.

---

## Technische Details

### Implementatie

Demo mode gebruikt een in-memory database wrapper:

```javascript
// Check if demo mode
if (isDemoMode()) {
    // Use demo database
    const data = await getDemoDatabase().getAll('panden');
} else {
    // Use Firebase
    const data = await dbGetAll('panden');
}
```

### Data Structuur

Demo data is gedefinieerd in `js/demo-data.js`:

```javascript
const DEMO_DATA = {
    panden: [...],
    huurders: [...],
    contracten: [...],
    onderhoud: [...],
    transacties: [...]
};
```

### localStorage Keys

Demo mode gebruikt:
- `demoMode`: 'true' wanneer actief
- Demo data wordt opgeslagen in DemoDatabase class instance

---

## Troubleshooting

**Probleem: Demo data laadt niet**

Oplossing:
1. Check browser console (F12) voor errors
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)
4. Controleer of `js/demo-data.js` is geladen

**Probleem: Kan demo mode niet verlaten**

Oplossing:
1. Open browser console
2. Run: `localStorage.removeItem('demoMode')`
3. Herlaad pagina
4. Ga naar index.html

**Probleem: Demo data is corrupt**

Oplossing:
1. Reset demo data via Admin pagina
2. Of via console: `getDemoDatabase().reset()`
3. Of clear localStorage: `localStorage.clear()`

---

**Demo Mode maakt het mogelijk om de applicatie direct te ervaren zonder configuratie!** 🎭

