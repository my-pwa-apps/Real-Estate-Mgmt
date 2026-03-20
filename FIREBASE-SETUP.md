# Firebase Realtime Database Security Rules

## Instructies voor het instellen van de Security Rules

Deze rules zorgen ervoor dat alleen ingelogde gebruikers toegang hebben tot de database.

### Stap 1: Open Firebase Console

1. Ga naar https://console.firebase.google.com/
2. Selecteer je project: **stadsgezicht-8af8b**

### Stap 2: Navigeer naar Realtime Database

1. Klik in het linker menu op **Realtime Database**
2. Als de database nog niet bestaat, klik dan op **Create Database**
   - Kies locatie: **europe-west1**
   - Start in **locked mode** (we gaan de rules aanpassen)

### Stap 3: Rules Instellen

1. Klik op het tabblad **Rules**
2. Vervang de inhoud met onderstaande rules:

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

3. Klik op **Publish**

### Wat doen deze rules?

- **`.read` en `.write`**: Alleen ingelogde gebruikers (auth != null) kunnen data lezen en schrijven
- **`.indexOn`**: Optimaliseert queries op deze velden voor betere performance

### Stap 4: Authentication Inschakelen

1. Ga naar **Authentication** in het linker menu
2. Klik op **Get started**
3. Kies **Email/Password** als sign-in methode
4. Schakel deze in
5. Voeg een gebruiker toe:
   - Ga naar het **Users** tabblad
   - Klik op **Add user**
   - Voer een email en wachtwoord in (bijv. admin@stadsgezicht.nl)
   - Dit wordt je beheerder account

### Stap 5: Test de Applicatie

1. Open de applicatie in je browser
2. Log in met het aangemaakte account
3. Begin met het toevoegen van panden, huurders, etc.

### Database Structuur

De applicatie gebruikt de volgende collecties in de Realtime Database:

- **panden** - Alle vastgoed objecten (bedrijfspanden en woningen)
- **huurders** - Huurder informatie en contactgegevens
- **contracten** - Huurcontracten met koppelingen naar panden en huurders
- **onderhoud** - Onderhoudsmeldingen en reparaties
- **transacties** - Financiële inkomsten en uitgaven

### Belangrijk!

⚠️ Deze rules zijn geschikt voor een intern beheersysteem met beperkt aantal gebruikers.
Voor een productieomgeving met meer complexe toegangsrechten, overweeg meer gedetailleerde rules.

### Extra Beveiliging (Optioneel)

Voor extra beveiliging kun je de rules aanpassen zodat alleen specifieke email adressen toegang hebben:

```json
{
  "rules": {
    ".read": "auth != null && (
      auth.token.email == 'admin@stadsgezicht.nl' ||
      auth.token.email == 'beheer@stadsgezicht.nl'
    )",
    ".write": "auth != null && (
      auth.token.email == 'admin@stadsgezicht.nl' ||
      auth.token.email == 'beheer@stadsgezicht.nl'
    )"
  }
}
```
