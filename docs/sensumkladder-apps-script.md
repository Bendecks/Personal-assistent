# SensumKladder API via Google Apps Script

Formål: give webappen et lille privat mellemled til Google Sheet-fanen `SensumKladder`.

Dette undgår at konkrete Sensum-notater gemmes i det offentlige GitHub-repo.

## Hurtigste opsætning

1. Åbn Google Sheet: `ChatGPT Arbejde-hukommelse`.
2. Vælg **Udvidelser → Apps Script**.
3. Slet eventuel startkode i editoren.
4. Indsæt hele koden fra afsnittet **Apps Script-kode** nedenfor.
5. Tryk **Gem**.
6. Navngiv projektet: `SensumKladder API`.
7. Vælg **Implementer → Ny implementering**.
8. Vælg typen **Webapp**.
9. Beskrivelse: `SensumKladder API`.
10. **Udfør som:** `Mig`.
11. **Hvem har adgang:** start med `Alle med linket`, hvis webappen skal kunne kalde endpointet uden Google-login. Skift til mere lukket adgang senere, hvis det virker med din konto.
12. Tryk **Implementer**.
13. Godkend rettigheder, når Google beder om det.
14. Kopiér **Webapp-URL**.
15. Åbn webappen: `https://bendecks.github.io/Personal-assistent/`.
16. Gå til **Sensum**.
17. Indsæt URL'en i feltet **API-endpoint**.
18. Tryk **Gem endpoint**.
19. Tryk **Synkronisér**.

Hvis det virker, skal du kunne se kladderne fra fanen `SensumKladder`.

## Apps Script-kode

```javascript
const SHEET_NAME = 'SensumKladder';
const HEADERS = [
  'ID',
  'Oprettet',
  'Barn/ung',
  'Kategori',
  'Titel',
  'Notattekst',
  'Status',
  'Ført i Sensum',
  'Ført dato',
  'Kilde',
  'Oprettet af',
  'Kommentar'
];

function doGet() {
  return jsonResponse({ ok: true, service: 'SensumKladder API' });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    const action = payload.action || 'list';

    if (action === 'list') {
      return jsonResponse({ ok: true, notes: listNotes() });
    }

    if (action === 'markDone') {
      markDone(payload);
      return jsonResponse({ ok: true });
    }

    if (action === 'append') {
      const note = appendNote(payload.note || payload);
      return jsonResponse({ ok: true, note });
    }

    return jsonResponse({ ok: false, error: 'Ukendt action: ' + action });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => firstRow[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function listNotes() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values
    .map((row, index) => rowToNote(row, index + 2))
    .filter((note) => note.id && note.text)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function rowToNote(row, rowNumber) {
  return {
    rowNumber,
    id: String(row[0] || ''),
    createdAt: toIso(row[1]),
    citizen: String(row[2] || ''),
    category: String(row[3] || ''),
    title: String(row[4] || ''),
    text: String(row[5] || ''),
    status: String(row[6] || ''),
    completedInSensum: String(row[7] || ''),
    completedAt: toIso(row[8]),
    source: 'Google Sheet',
    createdBy: String(row[10] || ''),
    comment: String(row[11] || '')
  };
}

function appendNote(input) {
  const sheet = getSheet();
  const now = new Date();
  const id = input.id || Utilities.getUuid();
  const row = [
    id,
    input.createdAt ? new Date(input.createdAt) : now,
    input.citizen || input.barnUng || '',
    input.category || input.kategori || 'Følelser og adfærd',
    input.title || input.titel || '',
    input.text || input.notattekst || '',
    input.status || 'Kladde',
    input.completedInSensum || 'Nej',
    input.completedAt ? new Date(input.completedAt) : '',
    input.source || input.kilde || 'ChatGPT',
    input.createdBy || input.oprettetAf || 'ChatGPT',
    input.comment || input.kommentar || ''
  ];
  sheet.appendRow(row);
  return rowToNote(row, sheet.getLastRow());
}

function markDone(payload) {
  const sheet = getSheet();
  const rowNumber = Number(payload.rowNumber);
  if (!rowNumber || rowNumber < 2) throw new Error('Ugyldigt rowNumber');

  const id = String(payload.id || '');
  if (id) {
    const currentId = String(sheet.getRange(rowNumber, 1).getValue() || '');
    if (currentId !== id) throw new Error('ID matcher ikke rækken');
  }

  sheet.getRange(rowNumber, 7).setValue('Ført');
  sheet.getRange(rowNumber, 8).setValue('Ja');
  sheet.getRange(rowNumber, 9).setValue(new Date());
}

function toIso(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return value.toISOString();
  }
  return String(value);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Test i browser

Når webappen er deployet, kan du åbne Webapp-URL'en direkte i browseren.

Du bør se noget i stil med:

```json
{"ok":true,"service":"SensumKladder API"}
```

Derefter testes den rigtige funktion fra arbejdswebappen via knappen **Synkronisér** i Sensum-modulet.

## Dataflow

```text
ChatGPT skriver kladde i SensumKladder
→ Apps Script API læser rækkerne
→ Webappen viser dem i Sensum-modulet
→ Brugeren kopierer til Sensum
→ Brugeren markerer ført
→ Apps Script opdaterer rækken i Google Sheet
```

## Vigtigt

- Notater må ikke gemmes i GitHub.
- Sheetet er den fælles arbejdshukommelse.
- Webappen må kun have endpoint-URL gemt lokalt i browseren.
- Apps Script skal altid være oprettet fra selve Google Sheetet, så `SpreadsheetApp.getActiveSpreadsheet()` peger på det rigtige ark.
