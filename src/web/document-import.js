const STORAGE_KEY = 'arbejdscentral.items.v2';
const MAX_TEXT_PREVIEW_CHARS = 12_000;

const style = document.createElement('style');
style.textContent = `
.document-form {
  display: grid;
  gap: 0.75rem;
}

.document-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 12px;
}

.document-drop {
  display: grid;
  gap: 0.45rem;
  place-content: center;
  min-height: 210px;
  border: 3px dashed var(--accent);
  border-radius: 22px;
  background: #fffdf9;
  padding: 18px;
  text-align: center;
}

.document-drop span {
  color: var(--accent);
  font-size: 1.25rem;
  font-weight: 950;
}

.document-drop small {
  color: var(--muted);
  font-weight: 500;
  line-height: 1.4;
}

.document-drop input {
  margin: 0 auto;
  max-width: 100%;
}

.document-summary {
  display: grid;
  align-content: center;
  min-height: 210px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: #fffdf9;
  padding: 18px;
  line-height: 1.45;
}

.document-summary strong {
  display: block;
  margin-bottom: 0.4rem;
}

.document-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.document-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.document-note-box {
  min-height: 160px;
}

@media (max-width: 820px) {
  .document-grid,
  .document-fields {
    grid-template-columns: 1fr;
  }
}
`;
document.head.appendChild(style);

const panel = document.createElement('section');
panel.className = 'panel';
panel.innerHTML = `
  <div class="panel-header">
    <div>
      <h2>Dokument-import</h2>
      <p>Brug til PDF'er, dagbogsnotater og andre arbejdsdokumenter. Filer behandles lokalt i browseren.</p>
    </div>
  </div>

  <form id="documentForm" class="document-form">
    <div class="document-grid">
      <label class="document-drop" for="documentFile">
        <span>Vælg fil</span>
        <small>PDF, tekst, markdown, csv eller lignende. PDF-indhold læses ikke automatisk endnu, men filen registreres og der laves en AI-prompt.</small>
        <input id="documentFile" type="file" accept=".pdf,.txt,.md,.csv,.rtf,.doc,.docx,application/pdf,text/*" />
      </label>

      <div id="documentSummary" class="document-summary empty">Ingen fil valgt.</div>
    </div>

    <div class="document-fields">
      <select id="documentKind" aria-label="Dokumenttype">
        <option value="Dagbogsnotater">Dagbogsnotater</option>
        <option value="Statusnotat">Statusnotat</option>
        <option value="Mødereferat">Mødereferat</option>
        <option value="Handleplan/mål">Handleplan/mål</option>
        <option value="Andet arbejdsdokument">Andet arbejdsdokument</option>
      </select>
      <input id="documentCitizen" type="text" placeholder="Borger/barn/ung, fx Derya" />
      <input id="documentPeriod" type="text" placeholder="Periode, fx 29-07-2026 - 29-08-2026" />
    </div>

    <div class="document-fields">
      <input id="documentTheme" type="text" placeholder="Tema, fx søvn, venskaber, selvskade" />
      <select id="documentUrgency" aria-label="Prioritet">
        <option value="normal">Normal</option>
        <option value="høj">Høj</option>
        <option value="lav">Lav</option>
      </select>
      <select id="documentSaveType" aria-label="Gem som">
        <option value="dokumentation">Dokumentation</option>
        <option value="information">Information</option>
        <option value="aktiv arbejdsopgave">Aktiv arbejdsopgave</option>
        <option value="venter på svar">Venter på svar</option>
        <option value="parkeret">Parkeret</option>
      </select>
    </div>

    <label for="documentNotes">Udtræk/resumé/næste handling</label>
    <textarea id="documentNotes" class="document-note-box" placeholder="Skriv fx: Skal læses før vagtstart. Fokus: søvnrutine, relationer, selvskade og sundhed. Næste handling: Lav kort overblik og forslag til dagbogsnotat."></textarea>

    <div class="document-actions">
      <button type="button" id="copyDocumentPromptButton" class="secondary">Kopiér læse-prompt</button>
      <button type="button" id="copyDiaryTemplateButton" class="secondary">Kopiér dagbogsskabelon</button>
      <button type="submit">Gem dokument-info</button>
    </div>

    <p id="documentStatus" class="hint">Følsomme dokumenter bør ikke gemmes i GitHub. Denne funktion gemmer kun metadata og dine noter i browseren.</p>
  </form>
`;

document.querySelector('.grid')?.before(panel);

const documentForm = document.querySelector('#documentForm');
const documentFile = document.querySelector('#documentFile');
const documentSummary = document.querySelector('#documentSummary');
const documentKind = document.querySelector('#documentKind');
const documentCitizen = document.querySelector('#documentCitizen');
const documentPeriod = document.querySelector('#documentPeriod');
const documentTheme = document.querySelector('#documentTheme');
const documentUrgency = document.querySelector('#documentUrgency');
const documentSaveType = document.querySelector('#documentSaveType');
const documentNotes = document.querySelector('#documentNotes');
const documentStatus = document.querySelector('#documentStatus');
const copyDocumentPromptButton = document.querySelector('#copyDocumentPromptButton');
const copyDiaryTemplateButton = document.querySelector('#copyDiaryTemplateButton');

let pendingDocument = null;

function readItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return 'ukendt størrelse';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isTextLike(file) {
  return file.type.startsWith('text/') || /\.(txt|md|csv|rtf)$/i.test(file.name);
}

function buildDocumentPrompt() {
  const fileName = pendingDocument?.name || '[vedhæftet dokument]';
  const textPreview = pendingDocument?.textPreview ? `\n\nTekstudtræk fra filen:\n${pendingDocument.textPreview}` : '';
  return `Du er min praktiske arbejdsassistent. Læs det vedhæftede arbejdsdokument og hjælp mig roligt og konkret.\n\nDokumenttype: ${documentKind.value}\nBorger/barn/ung: ${documentCitizen.value.trim() || '[udfyld]'}\nPeriode: ${documentPeriod.value.trim() || '[udfyld]'}\nTema/fokus: ${documentTheme.value.trim() || '[udfyld]'}\nFilnavn: ${fileName}\n\nOpgave:\n1. Lav et kort overblik over de vigtigste temaer.\n2. Skeln mellem observationer, vurderinger/refleksioner og konkrete opfølgninger.\n3. Find ting der bør følges op på ved næste vagt.\n4. Foreslå én konkret næste handling.\n5. Hjælp mig derefter med at formulere et neutralt, fagligt dagbogsnotat, hvis jeg beder om det.\n\nSkriv kort, praktisk og på dansk. Bevar dokumentets egne formuleringer og temaer, og gæt ikke på noget dokumentet ikke understøtter.${textPreview}`;
}

function buildDiaryTemplate() {
  return `Journalnotat på borger\nKategori/tema: [fx Følelser og adfærd / Venskaber / Sundhedsobservationer]\n\nObservation:\n[Hvad skete der konkret? Skriv neutralt og adskil fakta fra vurdering.]\n\nPædagogisk indsats:\n[Hvordan støttede/guidede jeg barnet/den unge? Hvilke aftaler/rammer blev fastholdt?]\n\nBarnets/den unges reaktion:\n[Hvordan reagerede barnet/den unge? Hvad lykkedes? Hvad var svært?]\n\nRefleksion/opmærksomhedspunkt:\n[Hvad skal vi være opmærksomme på næste gang? Er der behov for opfølgning?]\n\nNæste handling:\n[Én konkret opfølgning, hvis relevant.]`;
}

function renderDocumentSummary() {
  if (!pendingDocument) {
    documentSummary.className = 'document-summary empty';
    documentSummary.textContent = 'Ingen fil valgt.';
    return;
  }

  documentSummary.className = 'document-summary';
  documentSummary.innerHTML = `
    <strong>${pendingDocument.name}</strong>
    <span>${pendingDocument.type || 'ukendt filtype'}</span>
    <span>${formatFileSize(pendingDocument.size)}</span>
    <span>${pendingDocument.textPreview ? 'Tekstudtræk læst fra fil.' : 'Indhold gemmes ikke automatisk.'}</span>
  `;
}

documentFile.addEventListener('change', () => {
  const file = documentFile.files?.[0];
  if (!file) {
    pendingDocument = null;
    renderDocumentSummary();
    return;
  }

  pendingDocument = {
    name: file.name,
    type: file.type || 'ukendt filtype',
    size: file.size,
    textPreview: ''
  };

  renderDocumentSummary();

  if (isTextLike(file)) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      pendingDocument.textPreview = String(reader.result || '').slice(0, MAX_TEXT_PREVIEW_CHARS);
      renderDocumentSummary();
      documentStatus.textContent = 'Tekstfil læst lokalt. Udtræk kan indgå i AI-prompten.';
    });
    reader.readAsText(file);
  } else if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    documentStatus.textContent = 'PDF registreret. Selve PDF-teksten læses ikke automatisk i webappen endnu; brug læse-prompten sammen med filen i ChatGPT.';
  } else {
    documentStatus.textContent = 'Fil registreret. Indholdet læses ikke automatisk, men metadata og dine noter kan gemmes.';
  }
});

copyDocumentPromptButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(buildDocumentPrompt());
  copyDocumentPromptButton.textContent = 'Kopieret';
  setTimeout(() => (copyDocumentPromptButton.textContent = 'Kopiér læse-prompt'), 1200);
});

copyDiaryTemplateButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(buildDiaryTemplate());
  copyDiaryTemplateButton.textContent = 'Kopieret';
  setTimeout(() => (copyDiaryTemplateButton.textContent = 'Kopiér dagbogsskabelon'), 1200);
});

documentForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = [
    `Dokument: ${pendingDocument?.name || 'ukendt fil'}`,
    `Dokumenttype: ${documentKind.value}`,
    documentCitizen.value.trim() ? `Borger/barn/ung: ${documentCitizen.value.trim()}` : '',
    documentPeriod.value.trim() ? `Periode: ${documentPeriod.value.trim()}` : '',
    documentTheme.value.trim() ? `Tema: ${documentTheme.value.trim()}` : '',
    documentNotes.value.trim()
  ].filter(Boolean).join('\n');

  if (!text.trim()) return;

  const items = readItems();
  items.unshift({
    id: crypto.randomUUID(),
    text,
    type: documentSaveType.value,
    urgency: documentUrgency.value,
    status: documentSaveType.value === 'parkeret' ? 'parkeret' : 'aktiv',
    source: 'document',
    area: documentCitizen.value.trim(),
    sender: '',
    sourceDate: documentPeriod.value.trim(),
    imageDataUrl: '',
    imageName: pendingDocument?.name || '',
    createdAt: new Date().toISOString()
  });

  writeItems(items);
  documentStatus.textContent = 'Dokument-info er gemt lokalt. Siden genindlæses, så den vises i arbejdsoverblikket.';
  setTimeout(() => window.location.reload(), 450);
});
