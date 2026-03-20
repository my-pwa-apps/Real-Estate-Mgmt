# Bloxs Parity Review

Deze applicatie is vergeleken met de publiek beschikbare Bloxs API-domeinen voor relaties, vastgoedobjecten, contracten, onderhoud en financieel.

## Wat nu is verbeterd

- Vastgoed ondersteunt nu objecthiërarchie met `gebouw`, `complex`, `sectie` en `unit`.
- Vastgoed ondersteunt nu aanvullende productievelden zoals objectnummer, BAG ID, streefhuur, eigenaar en beheerder.
- Contracten ondersteunen nu contracttype, contractfase, indexatiemethode, waarborgtype en externe referentie.
- Onderhoud ondersteunt nu probleemcategorie, kostencategorie, uitvoerder, melder en externe referentie.
- Zoekresultaten, export en detailpanelen tonen deze extra domeinvelden mee.

## Hoogste resterende gaten voor productie

1. Relaties ontbreken nog als afzonderlijk domein.
   Deze app kent huurders, maar geen volwaardige organisaties, leveranciers, makelaars, eigenaren en bankrekeningen als eerste-klas entiteiten.

2. Contracten zijn nog niet procesgestuurd genoeg.
   Bloxs maakt een duidelijk onderscheid tussen conceptcontracten en niet-conceptcontracten. In deze app is die fase nu zichtbaar, maar nog niet functioneel afgedwongen met read-only gedrag buiten conceptstatus.

3. Vastgoedpublicatieproces ontbreekt.
   Bloxs ondersteunt publicatie-eigenschappen, beelden en publicatiestatus per object. Deze app heeft daarvoor nog geen dedicated workflow.

4. Onderhoudsnotities en bijlagen zijn niet als ticketonderdelen gemodelleerd.
   SharePoint-documenten bestaan, maar niet als expliciete ticket-notes/bijlagen met tijdlijn per serviceticket.

5. Financieel is nog operationeel, niet boekhoudkundig.
   Budgetten, verkoopfactuurdiensten, verkoopfacturen, inkooporders, inkoopfacturen, herinneringen, dagboeken, grootboekrekeningen en journaalposten ontbreken als domeinmodules.

6. Bulkprocessen en validaties ontbreken.
   Voor productie zijn batch-acties, strengere server-side validatie en consistente dossiernummers nodig.

## Aanbevolen volgorde voor verdere bouw

1. Voeg een aparte leveranciers- en eigenarenmodule toe.
2. Dwing contractregels af op basis van contractfase.
3. Voeg objectpublicatie en documenttijdlijn toe.
4. Introduceer financiële submodules voor facturen, inkoop en herinneringen.
5. Verplaats gevoelige configuratie uit browseropslag naar een beveiligde backend of serverless proxy.

## Productieadvies

De app is functioneel sterker geworden en sluit inhoudelijk beter aan op een Bloxs-achtig vastgoedproces, maar is nog niet op volledig enterprise-niveau voor financiële administratie en relatiebeheer. Voor productiegebruik met beperkt aantal gebruikers en operationeel beheer is de app bruikbaar. Voor bredere uitrol met compliance-, audit- en financiële eisen is een volgende bouwfase nodig.
