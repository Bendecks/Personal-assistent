# Arbejdscentral

Formålet er en rolig, praktisk webapp til arbejdsdagen.

## Første version

Webappen er statisk og kører direkte i browseren.

Den kan:

- fange løse arbejdsnoter hurtigt
- skelne mellem aktive opgaver, ventepunkter, møder/aftaler, rutiner, dokumentation og parkeret
- fremhæve én næste handling
- holde vagtstart-rutinen synlig
- generere en AI-prompt, der kan kopieres til ChatGPT
- linke direkte til Google Sheet `ChatGPT Arbejde-hukommelse`
- gemme lokalt i browserens `localStorage`

## Bevidste fravalg i v1

- Ingen login.
- Ingen database.
- Ingen direkte Google Sheets-skrivning.
- Ingen OpenAI/Gemini API-kald fra klienten.
- Ingen tung projektstyring.

Det gør v1 hurtig at teste og svær at ødelægge.

## Næste praktiske trin

1. Deploy statisk på Vercel eller GitHub Pages.
2. Test på telefon og computer.
3. Justér felter og ordvalg ud fra faktisk brug på en vagt.
4. Tilføj en lille backend/API, når formen er rigtig.
5. Integrér derefter Google Sheets som sandhedskilde.

## Senere AI-flow

```text
Indbakke i webapp
  -> AI sorterer
  -> bruger godkender ændringer
  -> Google Sheet opdateres
  -> webapp læser seneste status fra Sheet
```

## Designregel

Appen skal hjælpe med næste konkrete handling. Den må ikke udvikle sig til et stort system, før den simple version tydeligt mangler noget.
