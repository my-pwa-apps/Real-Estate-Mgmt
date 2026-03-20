# Entra ID Single Sign-On Setup Guide

## Overzicht

Deze applicatie gebruikt **Microsoft Entra ID (voorheen Azure AD)** voor authenticatie via Single Sign-On (SSO). Dit betekent:

✅ **Eén login voor alles**: Inloggen met uw werk account geeft automatisch toegang tot zowel de webapp als Microsoft 365 features  
✅ **Veilige authenticatie**: Enterprise-grade beveiliging via Microsoft identity platform  
✅ **Geen aparte wachtwoorden**: Geen extra credentials om te onthouden  
✅ **Rol-gebaseerde toegang**: Automatische rol toewijzing via Azure AD groups  
✅ **Edge for Business optimaal**: Naadloze SSO ervaring in Edge for Business browser

---

## Architectuur

```
Gebruiker (Edge) → Entra ID SSO → WebApp + Microsoft 365
```

---

## Setup Stappen

1. Azure AD app registreren (zie AZURE-AD-SETUP.md)
2. Client ID en Tenant ID invullen in `js/entra-auth.js`
3. Groups configureren voor rol-toewijzing (optioneel)
4. Testen met Microsoft 365 account

---

## Voordelen vs Firebase Auth

- ✅ Single Sign-On met werk account
- ✅ Geen aparte wachtwoorden
- ✅ Multi-factor authentication via Azure AD
- ✅ Conditional Access policies
- ✅ Automatische rol toewijzing
- ✅ Centraal gebruikersbeheer
- ✅ Edge for Business integratie

---

Zie **AZURE-AD-SETUP.md** voor gedetailleerde configuratie instructies.
