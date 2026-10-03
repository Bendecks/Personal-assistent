# Android life assistant

## Retning

Android-telefonen er hovedmotoren for den personlige assistent. iPhone bruges senere som input-kanal, når data kun findes dér.

## Første fungerende version

Første modul er kommunikation, sager og opfølgning.

Hver sag har:

- fortløbende sagsnummer
- titel/emne
- modpart
- kanal
- status
- seneste udvikling
- næste handling
- evt. opfølgningsdato
- noter

Statusmodellen er:

1. Aktiv
2. Venter på svar
3. Parkeret
4. Lukket

Startdata:

- Sag #1: Strøm i køkkenet / Lasse-Hybel
- Sag #2: Stænkplade, fuger og greb / Bent-Hybel

Data gemmes lokalt i første version.

## Arkitektur fremad

Udvidelser bygges på i denne rækkefølge, når kernen er stabil:

1. Gmail-integration
2. Android Notification Listener
3. Deling/kopiering ind i appen
4. Accessibility Service, kun hvor det er stabilt
5. Screenshots/OCR
6. Browserbaseret import, hvor det er praktisk
7. iPhone-genvej "Send til Personlig Assistent" til tekst, links og screenshots

Messenger, SMS/iMessage og Aula må ikke afhænge af scraping alene. Datakilder kombineres efter robusthed: API først, derefter notifikationer/deling og kun derefter Accessibility/OCR/browserimport.

## Autoopdatering

Appen kontrollerer GitHub Releases for nyere versioner og kan hente APK-opdateringen direkte.

Alle release-APK'er signeres med samme private signing key via GitHub Actions secrets.
