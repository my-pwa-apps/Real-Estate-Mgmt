# 🔥 FIREBASE REALTIME DATABASE - SECURITY RULES

## ⚠️ BELANGRIJK - KOPIEER DEZE RULES NAAR FIREBASE CONSOLE

### Waar te plakken:
1. Open: https://console.firebase.google.com/
2. Selecteer project: **stadsgezicht-8af8b**
3. Ga naar: **Realtime Database** → **Rules** tabblad
4. Vervang de inhoud met onderstaande JSON
5. Klik op **Publish**

---

## 📋 RULES VOOR FIREBASE REALTIME DATABASE

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

---

## 📖 Uitleg van de Rules

### Basis Beveiliging
```json
".read": "auth != null",
".write": "auth != null"
```
- Alleen **ingelogde gebruikers** kunnen data lezen en schrijven
- Niet-ingelogde bezoekers hebben **geen toegang**

### Index Optimalisatie
De `.indexOn` secties optimaliseren queries voor betere performance:

- **panden**: Zoeken op adres, type (bedrijfspand/woning), status
- **huurders**: Zoeken op achternaam en email
- **contracten**: Filteren op data en koppelingen
- **onderhoud**: Filteren op status, prioriteit en pand
- **transacties**: Filteren op datum, type en categorie

---

## 🔐 Extra Beveiliging (Optioneel)

Als u de toegang wilt beperken tot specifieke email adressen:

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
    )",
    
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

---

## ✅ Checklist na het instellen

- [ ] Rules gekopieerd naar Firebase Console
- [ ] Rules gepubliceerd (Publish button)
- [ ] Realtime Database aangemaakt (locatie: europe-west1)
- [ ] Authentication ingeschakeld (Email/Password)
- [ ] Beheerder account aangemaakt
- [ ] Applicatie getest met login

---

## 🆘 Troubleshooting

### "Permission denied" error?
- Controleer of de rules correct zijn gekopieerd
- Controleer of u bent ingelogd in de applicatie
- Controleer of Authentication is ingeschakeld

### Data wordt niet opgeslagen?
- Open Firebase Console → Realtime Database → Data
- Controleer of de database bestaat
- Test de rules met de "Rules Playground" in Firebase

### Kan niet inloggen?
- Controleer of Authentication is ingeschakeld
- Controleer of er een gebruiker is aangemaakt
- Controleer het email adres en wachtwoord

---

**📞 Support**: Bij vragen, controleer de README.md en FIREBASE-SETUP.md
