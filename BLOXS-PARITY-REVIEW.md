# Bloxs Parity Review

Deze applicatie is vergeleken met de publiek beschikbare Bloxs API-domeinen voor relaties, vastgoedobjecten, contracten, onderhoud en financieel.

## Wat nu is verbeterd

- Vastgoed ondersteunt nu objecthiërarchie met `gebouw`, `complex`, `sectie` en `unit`.
- Vastgoed ondersteunt nu aanvullende productievelden zoals objectnummer, BAG ID, streefhuur, eigenaar en beheerder.
- Contracten ondersteunen nu contracttype, contractfase, indexatiemethode, waarborgtype en externe referentie.
- Contracten buiten conceptstatus hebben nu vergrendelde kernvelden (huurder, pand, huurprijs, borg, startdatum, type) — alleen fase, einddatum, voorwaarden en referentie blijven bewerkbaar.
- Onderhoud ondersteunt nu probleemcategorie, kostencategorie, uitvoerder, melder en externe referentie.
- Onderhoud heeft nu een activiteitenlog (tijdlijn) per ticket dat statuswijzigingen, prioriteitsaanpassingen en uitvoerdertoewijzingen met tijdstempel en gebruiker vastlegt.
- Relatiebeheer is hernoemd en ondersteunt nu Huurders, Leveranciers, Eigenaren, Prospects en Beheerders als relatietypes met IBAN en KVK-registratie.
- Financieel heeft nu een betalingsherinneringensectie die automatisch openstaande facturen met verlopen termijnen detecteert.
- AI-assistent ondersteunt nu een proxy-modus waarbij de API-sleutel niet in de browser hoeft te worden opgeslagen.
- Zoekresultaten, export en detailpanelen tonen deze extra domeinvelden mee.

## Hoogste resterende gaten voor productie

1. ~~Relaties ontbreken nog als afzonderlijk domein.~~
   ✅ **Opgelost** — Huurders-module hernoemd naar "Relaties" en ondersteunt nu huurders, leveranciers, eigenaren, prospects en beheerders als eersteklas relatietypes met bankrekening- en KVK-gegevens.

2. ~~Contracten zijn nog niet procesgestuurd genoeg.~~
   ✅ **Opgelost** — Niet-conceptcontracten hebben nu vergrendelde kernvelden. Alleen fase, einddatum, voorwaarden en referentie zijn bewerkbaar buiten conceptstatus. Visuele waarschuwing bij het bewerken.

3. Vastgoedpublicatieproces ontbreekt.
   Bloxs ondersteunt publicatie-eigenschappen, beelden en publicatiestatus per object. Deze app heeft daarvoor nog geen dedicated workflow.

4. ~~Onderhoudsnotities en bijlagen zijn niet als ticketonderdelen gemodelleerd.~~
   ✅ **Opgelost** — Activiteitenlog per onderhoudsticket bijhoudt statusovergangen, prioriteitswijzigingen en uitvoerdertoewijzingen met datum en gebruiker. Wordt getoond als tijdlijn in het detailpaneel.

5. ~~Financieel is nog operationeel, niet boekhoudkundig.~~
   ✅ **Gedeeltelijk opgelost** — Betalingsherinneringen worden nu automatisch gegenereerd voor verlopen facturen. Factuurstatus kan worden bijgewerkt naar 'te laat'. Volledige boekhoudkundige modules (dagboeken, grootboek, journaalposten) vereisen een volgende bouwfase.

6. Bulkprocessen en validaties ontbreken.
   Voor productie zijn batch-acties, strengere server-side validatie en consistente dossiernummers nodig.

## Aanbevolen volgorde voor verdere bouw

1. ~~Voeg een aparte leveranciers- en eigenarenmodule toe.~~ ✅ Geïntegreerd in Relaties-module.
2. ~~Dwing contractregels af op basis van contractfase.~~ ✅ Vergrendelde velden buiten concept.
3. Voeg objectpublicatie en documenttijdlijn toe.
4. ~~Introduceer financiële submodules voor facturen, inkoop en herinneringen.~~ ✅ Herinneringen geïntegreerd.
5. ~~Verplaats gevoelige configuratie uit browseropslag naar een beveiligde backend of serverless proxy.~~ ✅ Proxy-modus beschikbaar voor Azure OpenAI.

## Productieadvies

De app is functioneel sterker geworden en sluit inhoudelijk beter aan op een Bloxs-achtig vastgoedproces. Relatiebeheer, contractfase-enforcement, onderhoudstijdlijn en betalingsherinneringen zijn nu geïmplementeerd. Voor productiegebruik met beperkt aantal gebruikers en operationeel beheer is de app bruikbaar. Voor bredere uitrol met compliance-, audit- en financiële eisen is een volgende bouwfase nodig voor publicatieworkflows, volledige boekhouding en batch-operaties.
