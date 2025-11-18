# 🚀 SNELSTART GIDS - Stadsgezicht Vastgoedbeheer

## ⚡ In 5 minuten aan de slag

### Stap 1: Firebase Realtime Database Rules (2 minuten) ⚠️ VERPLICHT

1. Open: https://console.firebase.google.com/
2. Login en selecteer project: **stadsgezicht-8af8b**
3. Klik links op **Realtime Database**
4. Als database niet bestaat → **Create Database** (locatie: europe-west1)
5. Klik op tabblad **Rules**
6. Kopieer dit en plak in het rules venster:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "panden": { ".indexOn": ["adres", "type", "status"] },
    "huurders": { ".indexOn": ["achternaam", "email"] },
    "contracten": { ".indexOn": ["startdatum", "einddatum", "huurderId", "pandId"] },
    "onderhoud": { ".indexOn": ["status", "prioriteit", "pandId", "createdAt"] },
    "transacties": { ".indexOn": ["datum", "type", "categorie"] }
  }
}
```

7. Klik op **Publish** 🎉

### Stap 2: Gebruiker Aanmaken (1 minuut)

1. In Firebase Console, klik links op **Authentication**
2. Klik op **Get started** (als je het ziet)
3. Klik op **Email/Password** → Schakel in → **Save**
4. Ga naar tabblad **Users**
5. Klik op **Add user**
   - Email: `admin@stadsgezicht.nl`
   - Wachtwoord: (kies een sterk wachtwoord)
   - Klik op **Add user**

### Stap 3: Applicatie Starten (1 minuut)

#### Optie A: VS Code Live Server (Aanbevolen)
1. Installeer extensie "Live Server" in VS Code
2. Rechtermuisklik op `index.html`
3. Selecteer "Open with Live Server"
4. Browser opent automatisch! 🎉

#### Optie B: PowerShell
```powershell
cd "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Real Estate Mgmt"
python -m http.server 8000
```
Open: http://localhost:8000

### Stap 4: Inloggen en Gebruiken! (1 minuut)

1. Login met het aangemaakte account
2. Klik op "Dashboard" voor overzicht
3. Begin met het toevoegen van:
   - **Panden** → Bedrijfspanden en woningen
   - **Huurders** → Contact informatie
   - **Contracten** → Koppel huurders aan panden
   - **Onderhoud** → Registreer meldingen
   - **Financieel** → Track inkomsten en uitgaven

---

## 🎯 Snelle Tips

### Dashboard
- Zie direct alle belangrijke statistieken
- Verlopende contracten worden automatisch getoond
- Open onderhoudsmeldingen met prioriteit

### Panden Beheer
- Filter op type (bedrijfspand/woning) en status
- Zoek snel op adres of plaats
- Status update automatisch bij contract

### Huurders
- Bewaar alle contactgegevens
- Zoek op naam, email of telefoon
- Voeg notities toe per huurder

### Contracten
- Automatische status: actief, verloopt, verlopen
- Waarschuwing bij contracten die binnen 3 maanden aflopen
- Borg en betalingsdatum tracking

### Onderhoud
- 4 prioriteiten: laag, normaal, hoog, urgent
- 4 statussen: nieuw, in behandeling, gepland, afgerond
- Koppel aan specifiek pand

### Financieel
- Automatische berekening netto resultaat
- Maandoverzicht per jaar
- Track huurinkomsten en kosten

---

## 📱 Gebruik op Mobiel/Tablet

De applicatie is volledig responsive en werkt perfect op:
- 📱 Smartphones
- 📲 Tablets
- 💻 Laptops
- 🖥️ Desktops

---

## 🆘 Problemen?

### Kan niet inloggen?
✅ Controleer of je een gebruiker hebt aangemaakt in Firebase Authentication

### "Permission denied" error?
✅ Controleer of de Rules zijn ingesteld in Realtime Database

### Data wordt niet opgeslagen?
✅ Controleer of je bent ingelogd
✅ Controleer Firebase Console → Realtime Database → Data

### Logo wordt niet getoond?
✅ Geen probleem! De tekst "Stadsgezicht" wordt dan getoond

---

## 📚 Meer Informatie

- **README.md** - Complete documentatie
- **FIREBASE-SETUP.md** - Gedetailleerde Firebase instructies
- **SECURITY-RULES.md** - Uitleg over security rules
- **firebase-database-rules.json** - Rules bestand

---

**Succes met het beheren van uw vastgoedportefeuille! 🏢**

*Stadsgezicht Ontwikkelingen en Beleggingen B.V.*
