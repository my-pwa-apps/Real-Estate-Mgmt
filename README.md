# Stadsgezicht Ontwikkelingen - Vastgoedbeheer Systeem

Een complete webapplicatie voor het beheren van vastgoed, huurders, contracten, onderhoud en financiën.

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

### 🔧 Onderhoud & Reparaties
- Onderhoudsmeldingen registreren
- Prioriteit instellen (laag, normaal, hoog, urgent)
- Status tracking (nieuw, in behandeling, gepland, afgerond)
- Geplande datum
- Kostenschatting
- Koppeling aan specifiek pand
- Filteren op status en prioriteit

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

### 1. Firebase Project Aanmaken

1. Ga naar [Firebase Console](https://console.firebase.google.com/)
2. Klik op "Add project" of "Project toevoegen"
3. Geef je project een naam (bijv. "Stadsgezicht Vastgoed")
4. Volg de stappen om het project aan te maken

### 2. Firebase Authentication Inschakelen

1. In je Firebase project, ga naar **Authentication**
2. Klik op "Get started"
3. Kies **Email/Password** als sign-in method
4. Schakel deze in
5. Voeg een gebruiker toe:
   - Klik op "Users" tab
   - Klik op "Add user"
   - Voer email en wachtwoord in
   - Dit wordt je beheerder account

### 3. Firestore Database Aanmaken

1. In je Firebase project, ga naar **Firestore Database**
2. Klik op "Create database"
3. Kies **Start in production mode** (we stellen regels in bij stap 4)
4. Selecteer een locatie (bijv. europe-west)

### 4. Security Rules Instellen

In Firestore Database → Rules, vervang de inhoud met:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Alleen geauthenticeerde gebruikers
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Klik op "Publish"

### 5. Firebase Configuratie Toevoegen

1. In Firebase Console, ga naar **Project Settings** (tandwiel icoon)
2. Scroll naar beneden naar "Your apps"
3. Klik op het **Web icon** (</>)
4. Registreer je app (geef een naam)
5. Kopieer de Firebase configuration code

### 6. Configuratie in de Applicatie

Open het bestand `js/config.js` en vervang de waarden:

```javascript
const firebaseConfig = {
    apiKey: "jouw-api-key",
    authDomain: "jouw-project.firebaseapp.com",
    projectId: "jouw-project-id",
    storageBucket: "jouw-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "jouw-app-id"
};
```

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

## 📊 Firestore Database Collecties

De applicatie maakt automatisch de volgende collecties aan:

- **panden** - Alle vastgoed objecten
- **huurders** - Huurder informatie
- **contracten** - Huurcontracten
- **onderhoud** - Onderhoudsmeldingen
- **transacties** - Financiële transacties

## 🎨 Design Kenmerken

- Modern en schoon interface
- Responsive design (werkt op desktop, tablet en mobiel)
- Intuïtieve navigatie
- Kleurcodering voor statussen en prioriteiten
- Smooth animaties en transitions
- Eenvoudige filters en zoekfuncties

## 🛠️ Technologieën

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase
  - Authentication (Email/Password)
  - Firestore Database (NoSQL)
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
