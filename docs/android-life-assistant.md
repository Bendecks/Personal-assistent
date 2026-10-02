# Android life assistant

## Scope for first version

Første modul er korrespondancer, mails og sager der skal følges op.

Hver sag har et fortløbende sagsnummer og disse felter:

- titel
- modpart
- kanal
- status
- seneste udvikling
- næste handling
- opfølgningsdato
- noter

Statusmodellen er bevidst lille:

1. Skal følges op
2. Venter på svar
3. Lukket

Det gør det muligt senere at koble Gmail ind uden først at bygge et stort CRM-system.

## Næste naturlige udvidelse

Når grundappen er stabil, kan Gmail-integration tilføjes som et separat lag:

- foreslå nye sager ud fra relevante mailtråde
- knytte en Gmail-tråd til et sagsnummer
- registrere sidste indgående og udgående mail
- markere en sag som "Venter på svar" efter afsendelse
- gøre opmærksom på manglende svar efter en valgt frist

Første version holder data lokalt, så appen kan bruges uden backend.
