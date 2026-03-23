// Demo Data for Vastgoedbeheer App
// Provides realistic dummy data for testing and demonstration

const DEMO_DATA = {
	panden: [
		{
			id: "demo-pand-1",
			objectSoort: "gebouw",
			objectNummer: "OBJ-001",
			adres: "Keizersgracht 123",
			postcode: "1015 CJ",
			plaats: "Amsterdam",
			type: "bedrijfspand",
			status: "verhuurd",
			oppervlakte: 250,
			kamers: 8,
			bouwjaar: 1890,
			huurprijs: 3500,
			streefhuur: 3650,
			energielabel: "B",
			bagId: "0363100012345678",
			ownerNaam: "Stadsgezicht Vastgoed B.V.",
			beheerderNaam: "Bloxs-pariteit beheerteam",
			beschrijving:
				"Prachtig kantoorpand aan de Keizersgracht met authentieke details",
			createdAt: new Date("2024-01-15").toISOString(),
		},
		{
			id: "demo-pand-2",
			objectSoort: "unit",
			objectNummer: "UNIT-201",
			parentObjectId: "demo-pand-6",
			adres: "Prinsengracht 456",
			postcode: "1016 HK",
			plaats: "Amsterdam",
			type: "woning",
			status: "verhuurd",
			oppervlakte: 120,
			kamers: 4,
			bouwjaar: 1910,
			huurprijs: 2100,
			streefhuur: 2200,
			energielabel: "C",
			bagId: "0363100099991001",
			ownerNaam: "Stadsgezicht Wonen C.V.",
			beschrijving: "Sfeervolle bovenwoning met balkon en vrij uitzicht",
			createdAt: new Date("2024-02-10").toISOString(),
		},
		{
			id: "demo-pand-3",
			objectSoort: "gebouw",
			objectNummer: "OBJ-003",
			adres: "Herengracht 789",
			postcode: "1017 BX",
			plaats: "Amsterdam",
			type: "bedrijfspand",
			status: "beschikbaar",
			oppervlakte: 180,
			kamers: 6,
			bouwjaar: 1880,
			huurprijs: 2800,
			energielabel: "B",
			beschrijving: "Modern gerenoveerd kantoorpand in hartje centrum",
			createdAt: new Date("2024-03-05").toISOString(),
		},
		{
			id: "demo-pand-4",
			objectSoort: "unit",
			objectNummer: "UNIT-102",
			parentObjectId: "demo-pand-6",
			adres: "Jordaanstraat 12",
			postcode: "1015 GH",
			plaats: "Amsterdam",
			type: "woning",
			status: "beschikbaar",
			oppervlakte: 85,
			kamers: 3,
			bouwjaar: 1920,
			huurprijs: 1650,
			energielabel: "D",
			beschrijving: "Gezellige woning in de Jordaan",
			createdAt: new Date("2024-04-01").toISOString(),
		},
		{
			id: "demo-pand-5",
			objectSoort: "gebouw",
			objectNummer: "OBJ-005",
			adres: "Nieuwezijds Voorburgwal 234",
			postcode: "1012 RV",
			plaats: "Amsterdam",
			type: "bedrijfspand",
			status: "onderhoud",
			oppervlakte: 320,
			kamers: 10,
			bouwjaar: 1905,
			huurprijs: 4200,
			energielabel: "C",
			beschrijving: "Groot kantoorpand, momenteel in renovatie",
			createdAt: new Date("2023-11-20").toISOString(),
		},
		{
			id: "demo-pand-6",
			objectSoort: "complex",
			objectNummer: "CMP-010",
			adres: "Prinsengracht 450-460",
			postcode: "1016 HK",
			plaats: "Amsterdam",
			type: "woning",
			status: "verhuurd",
			oppervlakte: 540,
			kamers: 18,
			bouwjaar: 1908,
			huurprijs: 0,
			streefhuur: 0,
			energielabel: "B",
			ownerNaam: "Stadsgezicht Wonen C.V.",
			beschrijving:
				"Complex met meerdere verhuurbare units aan de Prinsengracht",
			createdAt: new Date("2023-10-05").toISOString(),
		},
	],

	huurders: [
		{
			id: "demo-huurder-1",
			relatieType: "Huurder",
			voornaam: "Jan",
			achternaam: "de Vries",
			email: "jan.devries@example.com",
			telefoon: "06-12345678",
			geboortedatum: "1985-03-15",
			notities: "Uitstekende huurder, altijd op tijd met betalingen",
			createdAt: new Date("2024-01-15").toISOString(),
		},
		{
			id: "demo-huurder-2",
			relatieType: "Huurder",
			voornaam: "Maria",
			achternaam: "Jansen",
			email: "maria.jansen@example.com",
			telefoon: "06-23456789",
			geboortedatum: "1990-07-22",
			notities: "Jonge professional, werkt in IT sector",
			createdAt: new Date("2024-02-10").toISOString(),
		},
		{
			id: "demo-huurder-3",
			relatieType: "Huurder",
			bedrijfsnaam: "Tech Solutions B.V.",
			voornaam: "Pieter",
			achternaam: "Bakker",
			email: "info@techsolutions.nl",
			telefoon: "020-1234567",
			kvkNummer: "12345678",
			iban: "NL91 ABNA 0417 1643 00",
			notities: "Zakelijke huurder, 5-jarig contract",
			createdAt: new Date("2024-03-05").toISOString(),
		},
		{
			id: "demo-huurder-4",
			relatieType: "Leverancier",
			bedrijfsnaam: "Warmtebeheer Amsterdam",
			voornaam: "Klaas",
			achternaam: "Mulder",
			email: "info@warmtebeheer.nl",
			telefoon: "020-9876543",
			kvkNummer: "87654321",
			iban: "NL20 INGB 0001 2345 67",
			notities: "CV en verwarmingsonderhoud, vaste leverancier",
			createdAt: new Date("2024-01-01").toISOString(),
		},
		{
			id: "demo-huurder-5",
			relatieType: "Eigenaar",
			bedrijfsnaam: "Stadsgezicht Vastgoed B.V.",
			voornaam: "Willem",
			achternaam: "van den Berg",
			email: "willem@stadsgezicht.nl",
			telefoon: "06-98765432",
			kvkNummer: "11223344",
			notities: "Directeur-eigenaar, hoofdaandeelhouder",
			createdAt: new Date("2023-06-01").toISOString(),
		},
	],

	contracten: [
		{
			id: "demo-contract-1",
			contractType: "commercieel",
			contractFase: "actief",
			huurderId: "demo-huurder-3",
			pandId: "demo-pand-1",
			startdatum: "2024-02-01",
			einddatum: "2029-01-31",
			huurprijs: 3500,
			borg: 7000,
			betalingsdatum: 1,
			indexatieMethode: "cbs",
			waarborgType: "borg",
			contractReferentie: "COM-2024-001",
			status: "actief",
			voorwaarden:
				"5-jarig contract met bedrijf. Jaarlijkse indexatie conform CBS.",
			createdAt: new Date("2024-01-15").toISOString(),
		},
		{
			id: "demo-contract-2",
			contractType: "residentieel",
			contractFase: "actief",
			huurderId: "demo-huurder-2",
			pandId: "demo-pand-2",
			startdatum: "2024-03-01",
			einddatum: "2027-02-28",
			huurprijs: 2100,
			borg: 4200,
			betalingsdatum: 1,
			indexatieMethode: "cpi",
			waarborgType: "borg",
			contractReferentie: "RES-2024-014",
			status: "actief",
			voorwaarden:
				"2-jarig contract met optie tot verlenging. Servicekosten €75 per maand.",
			createdAt: new Date("2024-02-10").toISOString(),
		},
		{
			id: "demo-contract-3",
			contractType: "residentieel",
			contractFase: "concept",
			huurderId: "demo-huurder-1",
			pandId: "demo-pand-3",
			startdatum: "2024-04-01",
			einddatum: "2025-03-31",
			huurprijs: 2800,
			borg: 5600,
			betalingsdatum: 5,
			indexatieMethode: "vast-percentage",
			waarborgType: "bankgarantie",
			contractReferentie: "RES-2024-027",
			status: "actief",
			voorwaarden:
				"1-jarig contract. Huismeester regeling met reductie van €200 per maand.",
			createdAt: new Date("2024-03-05").toISOString(),
		},
	],

	onderhoud: [
		{
			id: "demo-onderhoud-1",
			pandId: "demo-pand-1",
			titel: "CV ketel onderhoudsbeurt",
			beschrijving:
				"Jaarlijkse onderhoudsbeurt CV ketel. Afspraak gemaakt met installateur.",
			probleemCategorie: "installatie",
			status: "gepland",
			prioriteit: "normaal",
			kostenCategorie: "preventief",
			uitvoerderNaam: "Warmtebeheer Amsterdam",
			geplande_datum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0], // Over 1 week
			kosten: 185,
			melderNaam: "Technisch beheer",
			externeReferentie: "SVT-1001",
			activiteitenLog: [
				{
					datum: new Date("2024-10-15T09:00:00").toISOString(),
					gebruiker: "Technisch beheer",
					actie: "aangemaakt",
					details: "Prioriteit: normaal",
				},
				{
					datum: new Date("2024-10-16T14:30:00").toISOString(),
					gebruiker: "Beheerder",
					actie: "bijgewerkt",
					details: "Status: nieuw → in-behandeling",
				},
				{
					datum: new Date("2024-10-18T10:15:00").toISOString(),
					gebruiker: "Beheerder",
					actie: "bijgewerkt",
					details:
						"Status: in-behandeling → gepland; Uitvoerder: Warmtebeheer Amsterdam",
				},
			],
			createdAt: new Date("2024-10-15").toISOString(),
		},
		{
			id: "demo-onderhoud-2",
			pandId: "demo-pand-2",
			titel: "Lekkage badkamer",
			beschrijving:
				"Huurder meldt lekkage bij douche. Loodgieter ingepland voor spoedklus.",
			probleemCategorie: "sanitair",
			status: "in-behandeling",
			prioriteit: "hoog",
			kostenCategorie: "reparatie",
			uitvoerderNaam: "Loodgietersbedrijf De Pijp",
			geplande_datum: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0], // Over 2 dagen
			kosten: 450,
			melderNaam: "Maria Jansen",
			melderContact: "maria.jansen@example.com",
			externeReferentie: "SVT-1002",
			createdAt: new Date("2024-11-10").toISOString(),
		},
		{
			id: "demo-onderhoud-3",
			pandId: "demo-pand-5",
			titel: "Renovatie elektrische bedrading",
			beschrijving:
				"Complete vervanging elektrische installatie in kader van renovatie.",
			probleemCategorie: "elektra",
			status: "in-behandeling",
			prioriteit: "hoog",
			kostenCategorie: "vervanging",
			uitvoerderNaam: "Elektro Noord-Holland",
			geplande_datum: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0],
			kosten: 12500,
			externeReferentie: "SVT-1003",
			createdAt: new Date("2024-09-01").toISOString(),
		},
		{
			id: "demo-onderhoud-4",
			pandId: "demo-pand-3",
			titel: "Schilderwerk gevel",
			beschrijving: "Onderhoud buitenschilderwerk voorgevel en kozijnen.",
			probleemCategorie: "bouwkundig",
			status: "afgerond",
			prioriteit: "laag",
			kostenCategorie: "preventief",
			uitvoerderNaam: "Schilders Collectief Amsterdam",
			geplande_datum: "2024-09-15",
			kosten: 3200,
			externeReferentie: "SVT-1004",
			createdAt: new Date("2024-08-01").toISOString(),
		},
		{
			id: "demo-onderhoud-5",
			pandId: "demo-pand-1",
			titel: "Kapotte ruit verdieping 2",
			beschrijving:
				"Ruit vervangen na stormschade. Glazenier heeft ruit besteld.",
			probleemCategorie: "veiligheid",
			status: "nieuw",
			prioriteit: "urgent",
			kostenCategorie: "schade",
			uitvoerderNaam: "Glas Express",
			geplande_datum: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0],
			kosten: 320,
			melderNaam: "Facilitair meldpunt",
			externeReferentie: "SVT-1005",
			createdAt: new Date("2024-11-16").toISOString(),
		},
	],

	transacties: [
		// Huurinkomsten 2024
		{
			id: "demo-trans-1",
			datum: "2024-01-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 3500,
			omschrijving: "Huur januari - Keizersgracht 123",
			createdAt: new Date("2024-01-01").toISOString(),
		},
		{
			id: "demo-trans-2",
			datum: "2024-02-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 3500,
			omschrijving: "Huur februari - Keizersgracht 123",
			createdAt: new Date("2024-02-01").toISOString(),
		},
		{
			id: "demo-trans-3",
			datum: "2024-03-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 6400,
			omschrijving: "Huur maart - Keizersgracht 123 + Prinsengracht 456",
			createdAt: new Date("2024-03-01").toISOString(),
		},
		{
			id: "demo-trans-4",
			datum: "2024-04-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur april - Alle panden",
			createdAt: new Date("2024-04-01").toISOString(),
		},
		{
			id: "demo-trans-5",
			datum: "2024-05-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur mei - Alle panden",
			createdAt: new Date("2024-05-01").toISOString(),
		},
		{
			id: "demo-trans-6",
			datum: "2024-06-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur juni - Alle panden",
			createdAt: new Date("2024-06-01").toISOString(),
		},
		{
			id: "demo-trans-7",
			datum: "2024-07-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur juli - Alle panden",
			createdAt: new Date("2024-07-01").toISOString(),
		},
		{
			id: "demo-trans-8",
			datum: "2024-08-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur augustus - Alle panden",
			createdAt: new Date("2024-08-01").toISOString(),
		},
		{
			id: "demo-trans-9",
			datum: "2024-09-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur september - Alle panden",
			createdAt: new Date("2024-09-01").toISOString(),
		},
		{
			id: "demo-trans-10",
			datum: "2024-10-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur oktober - Alle panden",
			createdAt: new Date("2024-10-01").toISOString(),
		},
		{
			id: "demo-trans-11",
			datum: "2024-11-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur november - Alle panden",
			createdAt: new Date("2024-11-01").toISOString(),
		},
		{
			id: "demo-trans-12",
			datum: "2024-12-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9200,
			omschrijving: "Huur december - Alle panden",
			createdAt: new Date("2024-12-01").toISOString(),
		},

		// Huurinkomsten 2025
		{
			id: "demo-trans-40",
			datum: "2025-01-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur januari 2025 - Alle panden",
			createdAt: new Date("2025-01-01").toISOString(),
		},
		{
			id: "demo-trans-41",
			datum: "2025-02-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur februari 2025 - Alle panden",
			createdAt: new Date("2025-02-01").toISOString(),
		},
		{
			id: "demo-trans-42",
			datum: "2025-03-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur maart 2025 - Alle panden",
			createdAt: new Date("2025-03-01").toISOString(),
		},
		{
			id: "demo-trans-43",
			datum: "2025-04-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur april 2025 - Alle panden",
			createdAt: new Date("2025-04-01").toISOString(),
		},
		{
			id: "demo-trans-44",
			datum: "2025-05-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur mei 2025 - Alle panden",
			createdAt: new Date("2025-05-01").toISOString(),
		},
		{
			id: "demo-trans-45",
			datum: "2025-06-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur juni 2025 - Alle panden",
			createdAt: new Date("2025-06-01").toISOString(),
		},
		{
			id: "demo-trans-46",
			datum: "2025-07-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur juli 2025 - Alle panden",
			createdAt: new Date("2025-07-01").toISOString(),
		},
		{
			id: "demo-trans-47",
			datum: "2025-08-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur augustus 2025 - Alle panden",
			createdAt: new Date("2025-08-01").toISOString(),
		},
		{
			id: "demo-trans-48",
			datum: "2025-09-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur september 2025 - Alle panden",
			createdAt: new Date("2025-09-01").toISOString(),
		},
		{
			id: "demo-trans-49",
			datum: "2025-10-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur oktober 2025 - Alle panden",
			createdAt: new Date("2025-10-01").toISOString(),
		},
		{
			id: "demo-trans-50",
			datum: "2025-11-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur november 2025 - Alle panden",
			createdAt: new Date("2025-11-01").toISOString(),
		},
		{
			id: "demo-trans-51",
			datum: "2025-12-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9400,
			omschrijving: "Huur december 2025 - Alle panden",
			createdAt: new Date("2025-12-01").toISOString(),
		},

		// Huurinkomsten 2026
		{
			id: "demo-trans-60",
			datum: "2026-01-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9600,
			omschrijving: "Huur januari 2026 - Alle panden",
			createdAt: new Date("2026-01-01").toISOString(),
		},
		{
			id: "demo-trans-61",
			datum: "2026-02-01",
			type: "inkomst",
			categorie: "huur",
			bedrag: 9600,
			omschrijving: "Huur februari 2026 - Alle panden",
			createdAt: new Date("2026-02-01").toISOString(),
		},

		// Onderhoudskosten 2024
		{
			id: "demo-trans-20",
			datum: "2024-03-15",
			type: "uitgave",
			categorie: "onderhoud",
			bedrag: 850,
			omschrijving: "CV onderhoud Keizersgracht 123",
			createdAt: new Date("2024-03-15").toISOString(),
		},
		{
			id: "demo-trans-21",
			datum: "2024-05-20",
			type: "uitgave",
			categorie: "onderhoud",
			bedrag: 1240,
			omschrijving: "Loodgieter werkzaamheden Prinsengracht 456",
			createdAt: new Date("2024-05-20").toISOString(),
		},
		{
			id: "demo-trans-22",
			datum: "2024-09-15",
			type: "uitgave",
			categorie: "onderhoud",
			bedrag: 3200,
			omschrijving: "Schilderwerk gevel Herengracht 789",
			createdAt: new Date("2024-09-15").toISOString(),
		},
		{
			id: "demo-trans-23",
			datum: "2024-09-10",
			type: "uitgave",
			categorie: "onderhoud",
			bedrag: 4500,
			omschrijving: "Renovatie elektrische bedrading (deel 1)",
			createdAt: new Date("2024-09-10").toISOString(),
		},
		{
			id: "demo-trans-24",
			datum: "2024-10-15",
			type: "uitgave",
			categorie: "onderhoud",
			bedrag: 8000,
			omschrijving: "Renovatie elektrische bedrading (deel 2)",
			createdAt: new Date("2024-10-15").toISOString(),
		},

		// Onderhoudskosten 2025
		{
			id: "demo-trans-70",
			datum: "2025-02-10",
			type: "uitgave",
			categorie: "onderhoud",
			bedrag: 195,
			omschrijving: "CV ketel jaarlijks onderhoud Keizersgracht 123",
			createdAt: new Date("2025-02-10").toISOString(),
		},
		{
			id: "demo-trans-71",
			datum: "2025-04-22",
			type: "uitgave",
			categorie: "onderhoud",
			bedrag: 680,
			omschrijving: "Dakgoot reparatie Prinsengracht 456",
			createdAt: new Date("2025-04-22").toISOString(),
		},
		{
			id: "demo-trans-72",
			datum: "2025-08-05",
			type: "uitgave",
			categorie: "onderhoud",
			bedrag: 2800,
			omschrijving: "Schilderwerk binnenzijde Herengracht 789",
			createdAt: new Date("2025-08-05").toISOString(),
		},

		// Overige kosten 2024
		{
			id: "demo-trans-30",
			datum: "2024-01-10",
			type: "uitgave",
			categorie: "verzekering",
			bedrag: 2400,
			omschrijving: "WA verzekering alle panden (jaar)",
			createdAt: new Date("2024-01-10").toISOString(),
		},
		{
			id: "demo-trans-31",
			datum: "2024-02-01",
			type: "uitgave",
			categorie: "administratie",
			bedrag: 125,
			omschrijving: "Accountant - maandelijkse administratie",
			createdAt: new Date("2024-02-01").toISOString(),
		},
		{
			id: "demo-trans-32",
			datum: "2024-03-01",
			type: "uitgave",
			categorie: "administratie",
			bedrag: 125,
			omschrijving: "Accountant - maandelijkse administratie",
			createdAt: new Date("2024-03-01").toISOString(),
		},
		{
			id: "demo-trans-33",
			datum: "2024-04-01",
			type: "uitgave",
			categorie: "administratie",
			bedrag: 125,
			omschrijving: "Accountant - maandelijkse administratie",
			createdAt: new Date("2024-04-01").toISOString(),
		},
		{
			id: "demo-trans-34",
			datum: "2024-06-15",
			type: "uitgave",
			categorie: "belasting",
			bedrag: 3800,
			omschrijving: "OZB alle panden",
			createdAt: new Date("2024-06-15").toISOString(),
		},

		// Overige kosten 2025
		{
			id: "demo-trans-80",
			datum: "2025-01-10",
			type: "uitgave",
			categorie: "verzekering",
			bedrag: 2520,
			omschrijving: "WA verzekering alle panden (jaar 2025)",
			createdAt: new Date("2025-01-10").toISOString(),
		},
		{
			id: "demo-trans-81",
			datum: "2025-01-01",
			type: "uitgave",
			categorie: "administratie",
			bedrag: 135,
			omschrijving: "Accountant - maandelijkse administratie",
			createdAt: new Date("2025-01-01").toISOString(),
		},
		{
			id: "demo-trans-82",
			datum: "2025-02-01",
			type: "uitgave",
			categorie: "administratie",
			bedrag: 135,
			omschrijving: "Accountant - maandelijkse administratie",
			createdAt: new Date("2025-02-01").toISOString(),
		},
		{
			id: "demo-trans-83",
			datum: "2025-03-01",
			type: "uitgave",
			categorie: "administratie",
			bedrag: 135,
			omschrijving: "Accountant - maandelijkse administratie",
			createdAt: new Date("2025-03-01").toISOString(),
		},
		{
			id: "demo-trans-84",
			datum: "2025-06-15",
			type: "uitgave",
			categorie: "belasting",
			bedrag: 3950,
			omschrijving: "OZB alle panden 2025",
			createdAt: new Date("2025-06-15").toISOString(),
		},

		// Overige kosten 2026
		{
			id: "demo-trans-90",
			datum: "2026-01-10",
			type: "uitgave",
			categorie: "verzekering",
			bedrag: 2645,
			omschrijving: "WA verzekering alle panden (jaar 2026)",
			createdAt: new Date("2026-01-10").toISOString(),
		},
		{
			id: "demo-trans-91",
			datum: "2026-01-01",
			type: "uitgave",
			categorie: "administratie",
			bedrag: 145,
			omschrijving: "Accountant - maandelijkse administratie",
			createdAt: new Date("2026-01-01").toISOString(),
		},
		{
			id: "demo-trans-92",
			datum: "2026-02-01",
			type: "uitgave",
			categorie: "administratie",
			bedrag: 145,
			omschrijving: "Accountant - maandelijkse administratie",
			createdAt: new Date("2026-02-01").toISOString(),
		},
	],

	werkbonnen: [],
	auditLog: [],
	betalingen: [],
	invoices: [],
	settings: {},
};

// Demo mode database operations
class DemoDatabase {
	constructor() {
		this.data = JSON.parse(JSON.stringify(DEMO_DATA)); // Deep clone
		this.listeners = {};
	}

	// Get all items from collection
	getAll(collection) {
		return Promise.resolve([...(this.data[collection] || [])]);
	}

	// Get single item
	getById(collection, id) {
		const item = this.data[collection]?.find((item) => item.id === id);
		return Promise.resolve(item ? { ...item } : null);
	}

	// Add new item
	add(collection, data) {
		const newItem = {
			...data,
			id: `demo-${collection}-${Date.now()}`,
			createdAt: new Date().toISOString(),
		};

		if (!this.data[collection]) {
			this.data[collection] = [];
		}

		this.data[collection].push(newItem);
		this.notifyListeners(collection);

		return Promise.resolve(newItem.id);
	}

	// Update item
	update(collection, id, data) {
		const index = this.data[collection]?.findIndex((item) => item.id === id);

		if (index !== -1) {
			this.data[collection][index] = {
				...this.data[collection][index],
				...data,
				updatedAt: new Date().toISOString(),
			};
			this.notifyListeners(collection);
		}

		return Promise.resolve();
	}

	// Delete item
	delete(collection, id) {
		if (this.data[collection]) {
			this.data[collection] = this.data[collection].filter(
				(item) => item.id !== id,
			);
			this.notifyListeners(collection);
		}

		return Promise.resolve();
	}

	// Query with filters
	query(collection, filters) {
		let results = [...(this.data[collection] || [])];

		if (filters.orderBy) {
			results.sort((a, b) => {
				const aVal = a[filters.orderBy];
				const bVal = b[filters.orderBy];
				return aVal > bVal ? 1 : -1;
			});
		}

		if (filters.where) {
			const [field, operator, value] = filters.where;
			results = results.filter((item) => {
				switch (operator) {
					case "==":
						return item[field] === value;
					case "!=":
						return item[field] !== value;
					case ">":
						return item[field] > value;
					case "<":
						return item[field] < value;
					case ">=":
						return item[field] >= value;
					case "<=":
						return item[field] <= value;
					default:
						return true;
				}
			});
		}

		if (filters.limit) {
			results = results.slice(0, filters.limit);
		}

		return Promise.resolve(results);
	}

	// Add listener for changes
	onValue(collection, callback) {
		if (!this.listeners[collection]) {
			this.listeners[collection] = [];
		}
		this.listeners[collection].push(callback);

		// Call immediately with current data
		callback([...this.data[collection]]);

		// Return unsubscribe function
		return () => {
			this.listeners[collection] = this.listeners[collection].filter(
				(cb) => cb !== callback,
			);
		};
	}

	// Notify listeners of changes
	notifyListeners(collection) {
		if (this.listeners[collection]) {
			this.listeners[collection].forEach((callback) => {
				callback([...this.data[collection]]);
			});
		}
	}

	// Reset to initial demo data
	reset() {
		this.data = JSON.parse(JSON.stringify(DEMO_DATA));
		Object.keys(this.listeners).forEach((collection) => {
			this.notifyListeners(collection);
		});
	}
}

// Create demo database instance
let demoDb = null;

// Get demo database instance
function getDemoDatabase() {
	if (!demoDb) {
		demoDb = new DemoDatabase();
	}
	return demoDb;
}

// Demo mode wrappers for existing db-helpers functions
function getDemoDbHelpers() {
	const db = getDemoDatabase();

	return {
		dbGetAll: (collection) => db.getAll(collection),
		dbGet: (collection, id) => db.getById(collection, id),
		dbGetById: (collection, id) => db.getById(collection, id),
		dbAdd: (collection, data) => db.add(collection, data),
		dbUpdate: (collection, id, data) => db.update(collection, id, data),
		dbDelete: (collection, id) => db.delete(collection, id),
		dbQuery: (collection, filters) => db.query(collection, filters),
		dbOnValue: (collection, callback) => db.onValue(collection, callback),
	};
}

// Export
window.DEMO_DATA = DEMO_DATA;
window.DemoDatabase = DemoDatabase;
window.getDemoDatabase = getDemoDatabase;
window.getDemoDbHelpers = getDemoDbHelpers;
