# Arbejde – projektaftale

Dette dokument beskriver de faste rammer for samarbejdet mellem Bendix og ChatGPT i arbejdsprojektet.

## Formål

Projektet skal hjælpe med roligt og praktisk overblik over arbejdsopgaver, dokumentation, møder, børn/unge, opfølgninger og rutiner.

Fokus er næste konkrete handling frem for store systemer.

## Grundmodel

ChatGPT er input- og bearbejdningslaget. Google Sheet er den fælles sandhedskilde. Webappen er et rent overblikslag.

```text
Samtaler i projektet Arbejde
→ ChatGPT udleder notater, opgaver, status og næste handlinger
→ ChatGPT gemmer det vigtige i Google Sheet
→ Webappen læser fra Google Sheet
→ Bendix bruger webappen til overblik og enkelte status-handlinger
```

Webappen skal som hovedregel ikke bruges til fritekst-input. Den skal vise data, viden og overblik, som kommer fra ChatGPT og Google Sheet.

## Arbejdsmåde

- Svar kort, konkret og på dansk.
- Tag én ting ad gangen, når noget virker uoverskueligt.
- Stil kun opklarende spørgsmål, når det er nødvendigt for næste handling.
- Skeln tydeligt mellem opgave, information, dokumentation, møde, rutine, parkeret og lukket.
- Store opgaver deles i små trin på 3-10 minutter.
- Når noget reelt ændrer status, afsluttes, parkeres eller får ny næste handling, skal Google Sheet opdateres.

## Dagbogsnotater

Når ChatGPT hjælper med dagbogsnotater, skal notaterne være:

- konkrete og observerbare
- faglige og neutrale
- uden unødige vurderinger eller dømmende formuleringer
- opdelt efter relevante Sensum-kategorier, når det giver mening
- klar til at kopiere direkte ind i Sensum
- gemt som kladde i Google Sheet-fanen `SensumKladder`, når brugeren har bedt om eller etableret automatisk kladdeopsamling

Når der skrives notat på ét barn/én ung, må andre børn/unge ikke nævnes ved navn.

Fast anonymiseringsregel:

- Andrea = A1
- Magnus = A2
- Lucas = A3
- Mille = A4
- Derya = A5

I barnets eget notat bruges barnets navn. I andre børns notater bruges A-nummer.

## Fælles lager for Sensum-kladder

Konkrete dagbogsnotater må ikke gemmes i det offentlige GitHub-repo.

Fælles lager er Google Sheet `ChatGPT Arbejde-hukommelse`, fanen `SensumKladder`.

Når ChatGPT formulerer dagbogsnotater, skal kladderne gemmes dér med disse felter:

- ID
- Oprettet
- Barn/ung
- Kategori
- Titel
- Notattekst
- Status
- Ført i Sensum
- Ført dato
- Kilde
- Oprettet af
- Kommentar

Standardstatus ved oprettelse:

- Status: `Kladde`
- Ført i Sensum: `Nej`
- Kilde: `ChatGPT`

## Webapp

Webappen er et dashboard. Den skal ikke være det primære sted, hvor Bendix indtaster viden, dokumentation eller opgaver.

Webappen må gerne have tekniske felter, fx API-endpoint, og enkle status-handlinger, fx:

- Synkronisér
- Kopiér notattekst
- Markér ført i Sensum
- Luk/markér færdig, når status skal sendes tilbage til Google Sheet

Webappen skal ikke som hovedregel have:

- manuel oprettelse af dagbogsnotater
- manuel fritekst-registrering af arbejdsopgaver
- parallel lokal hukommelse, som konkurrerer med Google Sheet

## Webapp og Sensum-notater

Webappens Sensum-modul skal bruge `SensumKladder` som fælles kladdelager, ikke GitHub.

Målet er dette flow:

```text
Live-samtale med ChatGPT
→ ChatGPT skriver dagbogsnotater
→ ChatGPT gemmer kladder i SensumKladder
→ Webappen henter aktive kladder fra Google Sheet via et sikkert mellemled
→ Bendix kopierer/overfører notatet til Sensum
→ Bendix markerer notatet som ført
→ Google Sheet opdateres
→ Notatet forsvinder fra webappens aktive liste
```

Førte notater vises ikke i webappens aktive overblik, men bevares som status i Google Sheet.

GitHub må kun indeholde:

- webapp-kode
- skabeloner
- projektregler
- teknisk dokumentation

GitHub må ikke indeholde konkrete Sensum-notater om børn/unge.

## Arbejdshukommelse

Google Sheet `ChatGPT Arbejde-hukommelse` er den eksterne sandhedskilde for arbejdsopgaver, opfølgninger, regler og Sensum-kladdestatus.

Webappen bruges som praktisk arbejdsbord ovenpå arket.
