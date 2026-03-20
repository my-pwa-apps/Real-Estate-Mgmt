# Stadsgezicht Ontwikkelingen - Vastgoedbeheer Systeem

Een complete webapplicatie voor het beheren van vastgoed, huurders, contracten, onderhoud en financiën.

## 🚀 Nieuwe Features

### 🔐 Microsoft Entra ID Single Sign-On

- **Enterprise SSO**: Eén login voor webapp én Microsoft 365
- **Edge for Business**: Optimale integratie met Edge for Business browser
- **Rol-gebaseerd**: Automatische rol toewijzing via Azure AD groups (Admin/Manager/Viewer)
- **Veilig**: MFA en Conditional Access ondersteuning

### 🎭 Demo Modus

- **Geen configuratie**: Verken de app zonder Azure AD of Firebase setup
- **Realistische data**: Volledige dummy dataset voor demonstraties
- **Volledig functioneel**: Alle features beschikbaar voor testen
- **Perfect voor**: Training, presentaties en quick previews

### ⚙️ Administrator Module

- **Gebruikersbeheer**: Overzicht van ingelogde gebruikers en rollen
- **Instellingen**: Bedrijfsgegevens, email templates, notificaties
- **Azure configuratie**: Client ID, Tenant ID en SharePoint instellingen
- **Demo data beheer**: Reset, export en import van demo data

## 🏢 Functionaliteiten

### 📊 Dashboard

- Overzicht van alle panden (bedrijfspanden en woningen)
- Actieve huurders en bezettingsgraad
- Open onderhoudsmeldingen
- Maandelijkse en jaarlijkse huurinkomsten
- Recente activiteiten
- Verlopende contracten (binnen 3 maanden)

### 🏢 Panden Beheer

- Toevoegen, bewerken en verwijderen van panden
- Onderscheid tussen bedrijfspanden en woningen
- Status tracking (verhuurd, beschikbaar, onderhoud)
- Adresgegevens, oppervlakte, aantal kamers
- Huurprijzen per pand
- Filteren op type en status
- Zoeken op adres, plaats of postcode

### 👥 Huurders Beheer

- Complete huurdersdatabase
- Contactgegevens (email, telefoon)
- Persoonlijke gegevens (geboortedatum)
- Notities per huurder
- Zoekfunctie op naam, email of telefoon

### 📄 Huurcontracten

- Contract aanmaken en beheren
- Koppeling tussen huurder en pand
- Start- en einddatum
- Huurprijs en borgbedrag
- Betalingsdatum per maand
- Status: actief, verloopt binnenkort, verlopen
- Voorwaarden en bijzonderheden
- **📧 Email contract naar huurder** (M365 integratie)
- **📄 Contract documenten** opslaan in SharePoint

### 🔧 Onderhoud & Reparaties

- Onderhoudsmeldingen registreren
- Prioriteit instellen (laag, normaal, hoog, urgent)
- Status tracking (nieuw, in behandeling, gepland, afgerond)
- Geplande datum
- Kostenschatting
- Koppeling aan specifiek pand
- Filteren op status en prioriteit
- **📧 Bevestiging email** naar huurder bij nieuwe melding
- **📁 Documentatie opslaan** in SharePoint per pand

### 💰 Financieel Overzicht

- Totaaloverzicht inkomsten en uitgaven per jaar
- Netto resultaat berekening
- Maandoverzicht met details
- Huurinkomsten tracking
- Onderhoudskosten
- Overige kosten
- Recente transacties
- Transacties toevoegen (inkomsten/uitgaven)

## 🚀 Installatie & Setup

### ✅ Firebase Configuratie (Al Ingesteld!)

De applicatie is al geconfigureerd met de Stadsgezicht Firebase Realtime Database.

**Belangrijke stappen die u nog moet doen:**

### 1. Firebase Realtime Database Rules Instellen

⚠️ **BELANGRIJK**: Kopieer de security rules naar Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Selecteer project: **stadsgezicht-8af8b**
3. Ga naar **Realtime Database** in het linker menu
4. Als de database nog niet bestaat:
   - Klik op **Create Database**
   - Kies locatie: **europe-west1**
   - Start in **locked mode**
5. Klik op het tabblad **Rules**
6. Kopieer de volgende rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",

    "panden": {
      ".indexOn": ["adres", "type", "status"]
    },
    "huurders": {
      ".indexOn": ["achternaam", "email"]
    },
    "contracten": {
      ".indexOn": ["startdatum", "einddatum", "huurderId", "pandId"]
    },
    "onderhoud": {
      ".indexOn": ["status", "prioriteit", "pandId", "createdAt"]
    },
    "transacties": {
      ".indexOn": ["datum", "type", "categorie"]
    }
  }
}
```

7. Klik op **Publish**

📄 Zie ook: `FIREBASE-SETUP.md` voor gedetailleerde instructies en `firebase-database-rules.json` voor de rules

### 2. Firebase Authentication - Gebruiker Aanmaken

1. In Firebase Console, ga naar **Authentication**
2. Klik op "Get started" (als nog niet gedaan)
3. Schakel **Email/Password** in als sign-in method
4. Voeg een beheerder toe:
   - Ga naar het **Users** tabblad
   - Klik op **Add user**
   - Email: **admin@stadsgezicht.nl** (of uw gewenste email)
   - Kies een sterk wachtwoord
   - Klik op **Add user**

Dit wordt uw login voor het systeem!

## 📂 Project Structuur

```
Real Estate Mgmt/
├── index.html              # Login pagina
├── dashboard.html          # Dashboard overzicht
├── panden.html            # Panden beheer
├── huurders.html          # Huurders beheer
├── contracten.html        # Contracten beheer
├── onderhoud.html         # Onderhoud & reparaties
├── financieel.html        # Financieel overzicht
├── css/
│   └── styles.css         # Alle styling
├── js/
│   ├── config.js          # Firebase configuratie
│   ├── auth.js            # Authenticatie logica
│   ├── dashboard.js       # Dashboard functionaliteit
│   ├── panden.js          # Panden beheer
│   ├── huurders.js        # Huurders beheer
│   ├── contracten.js      # Contracten beheer
│   ├── onderhoud.js       # Onderhoud beheer
│   └── financieel.js      # Financieel beheer
└── images/                # Afbeeldingen (optioneel)
```

## 🌐 De Applicatie Starten

### Optie 1: Live Server (Aanbevolen)

1. Installeer de "Live Server" extensie in VS Code
2. Rechtermuisklik op `index.html`
3. Selecteer "Open with Live Server"

### Optie 2: Python HTTP Server

```bash
# In de project map
python -m http.server 8000
```

Navigeer naar: `http://localhost:8000`

### Optie 3: Firebase Hosting

```bash
# Installeer Firebase CLI
npm install -g firebase-tools

# Login bij Firebase
firebase login

# Initialiseer hosting
firebase init hosting

# Deploy
firebase deploy
```

## 🔐 Inloggen

1. Open de applicatie in je browser
2. Gebruik het email en wachtwoord dat je in Firebase Authentication hebt aangemaakt
3. Na succesvol inloggen wordt je doorgestuurd naar het dashboard

## 📊 Firebase Realtime Database Structuur

De applicatie gebruikt de volgende database paths:

- **panden/** - Alle vastgoed objecten (bedrijfspanden en woningen)
- **huurders/** - Huurder informatie en contactgegevens
- **contracten/** - Huurcontracten met koppelingen
- **onderhoud/** - Onderhoudsmeldingen en reparaties
- **transacties/** - Financiële inkomsten en uitgaven

Data wordt automatisch aangemaakt wanneer u items toevoegt via de applicatie.

## 🎨 Design Kenmerken

- **Stadsgezicht Branding** - Logo en huisstijl kleuren geïntegreerd
- **Professionele uitstraling** - Zakelijke kleuren (donkerblauw, goud accent)
- Modern en schoon interface
- Responsive design (werkt op desktop, tablet en mobiel)
- Intuïtieve navigatie met iconen
- Kleurcodering voor statussen en prioriteiten
- Smooth animaties en transitions
- Eenvoudige filters en zoekfuncties

## 🔗 Microsoft 365 Integratie

### 📧 Email Functionaliteit

- **Email versturen** via Exchange Online
- **Email templates** voor veelvoorkomende scenario's:
  - Huurcontract verzenden
  - Huurverhoging notificatie
  - Onderhoud bevestigingen
  - Huur herinneringen
  - Welkomstmail nieuwe huurders
- **Automatisch archiveren** van emails naar SharePoint

### 📁 Document Management (SharePoint/OneDrive)

- **Automatische folder structuur**:
  - `Panden/[Adres-Postcode]/` (Foto's, Documenten, Technisch, Verbouwing)
  - `Huurders/[Naam]/` (Contracten, Correspondentie, Documenten)
  - `Contracten/[Jaar]/`
  - `Onderhoud/[Jaar]/[Adres]/`
  - `Financieel/[Jaar]/`
- **Document upload/download** vanuit de applicatie
- **Metadata tagging** voor Copilot indexering
- **Zoeken** in SharePoint documenten

### 🤖 Microsoft Copilot Ready

- Alle documenten en emails worden geïndexeerd door Copilot
- Vind informatie met natural language queries
- Automatische insights in documenten en correspondentie
- Context-aware suggesties

### ⚙️ Setup Microsoft 365 Integratie

**Zie:** `AZURE-AD-SETUP.md` voor complete setup instructies

**Stappen:**

1. Azure AD app registreren
2. API permissions instellen (Files, Sites, Mail)
3. Admin consent geven
4. SharePoint site configureren
5. Configuratie updaten in `js/microsoft-auth.js`

## 🛠️ Technologieën

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase
  - Authentication (Email/Password)
  - **Realtime Database** (Real-time synchronisatie)
- **Microsoft 365 Integratie**:
  - MSAL.js (Microsoft Authentication Library)
  - Microsoft Graph API
  - SharePoint/OneDrive voor document storage
  - Exchange Online voor email
- **Branding**: Stadsgezicht logo en huisstijl
- **Hosting**: Firebase Hosting (optioneel)

## 📱 Responsive Design

De applicatie is volledig responsive:

- **Desktop**: Volledige sidebar met labels
- **Tablet**: Compacte sidebar
- **Mobiel**: Geoptimaliseerde layouts en touch-friendly controls

## 🔒 Beveiliging

- Alleen geauthenticeerde gebruikers hebben toegang
- Automatische redirect naar login bij unauthorized access
- Firebase Security Rules beschermen de database
- Server-side validatie via Firebase

## 🆘 Support & Contact

Voor vragen of problemen:

- Controleer of Firebase correct is geconfigureerd
- Controleer de browser console voor error messages
- Zorg dat je bent ingelogd met een geldig account

## 📝 Licentie

Copyright © 2025 Stadsgezicht Ontwikkelingen en Beheer

---

**Gemaakt met ❤️ voor professioneel vastgoedbeheer**
