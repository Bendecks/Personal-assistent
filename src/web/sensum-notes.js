const SENSUM_NOTES_KEY = 'arbejdscentral.sensumNotes.v1';
const SENSUM_API_ENDPOINT_KEY = 'arbejdscentral.sensumApiEndpoint.v1';
const ACTIVE_MODULE_KEY = 'arbejdscentral.activeModule.v1';

const sensumStyle = document.createElement('style');
sensumStyle.textContent = `
.sensum-note-form { display: grid; gap: 0.75rem; }
.sensum-note-grid, .sensum-sync-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.sensum-sync-grid { grid-template-columns: minmax(0, 1fr) auto auto; align-items: end; }
.sensum-note-actions, .sensum-note-card-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.sensum-note-list { display: grid; gap: 12px; margin-top: 14px; }
.sensum-note-card { border: 1px solid var(--line); border-left: 6px solid var(--accent); border-radius: 20px; background: #fffdf9; padding: 14px; }
.sensum-note-card.remote { border-left-color: var(--warn); }
.sensum-note-card header { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.sensum-note-card pre { white-space: pre-wrap; font: inherit; line-height: 1.45; margin: 0 0 12px; }
.sensum-note-empty { border: 1px dashed var(--line); border-radius: 18px; padding: 16px; color: var(--muted); background: #fffdf9; }
.sensum-sync-box { border: 1px solid var(--line); border-radius: 18px; padding: 12px; background: #fffdf9; }
.sensum-sync-box summary { cursor: pointer; font-weight: 800; }
.sensum-manual-copy { position: fixed; left: -9999px; top: 0; width: 1px; height: 1px; opacity: 0; }
@media (max-width: 820px) { .sensum-note-grid, .sensum-sync-grid { grid-template-columns: 1fr; } }
`;
document.head.appendChild(sensumStyle);

const sensumPanel = document.createElement('section');
sensumPanel.className = 'panel';
sensumPanel.innerHTML = `
  <div class="panel-header">
    <div>
      <h2>Sensum-notater</h2>
      <p>Aktive kladder fra ChatGPT. Når et notat er ført i Sensum, fjernes det fra listen.</p>
    </div>
  </div>

  <details class="sensum-sync-box" open>
    <summary>Synkronisering med SensumKladder</summary>
    <p class="hint">Når API-endpoint er sat, henter modulet aktive kladder fra Google Sheet og kan markere dem som ført.</p>
    <div class="sensum-sync-grid">
      <label>
        API-endpoint
        <input id="sensumApiEndpoint" type="url" placeholder="https://script.google.com/macros/s/.../exec" />
      </label>
      <button type="button" id="saveSensumEndpointButton" class="secondary">Gem endpoint</button>
      <button type="button" id="syncSensumButton">Synkronisér</button>
    </div>
  </details>

  <form id="sensumNoteForm" class="sensum-note-form">
    <div class="sensum-note-grid">
      <input id="sensumCitizen" type="text" placeholder="Barn/ung, fx Magnus" />
      <select id="sensumCategory" aria-label="Kategori">
        <option value="Følelser og adfærd">Følelser og adfærd</option>
        <option value="Familieforhold og baggrund">Familieforhold og baggrund</option>
        <option value="Venskaber">Venskaber</option>
        <option value="Selvstændighed">Selvstændighed</option>
        <option value="Motivation">Motivation</option>
        <option value="Trivsel">Trivsel</option>
        <option value="Sundhed">Sundhed</option>
        <option value="Andet">Andet</option>
      </select>
      <input id="sensumTitle" type="text" placeholder="Kort titel, fx Samvær med far" />
    </div>

    <label for="sensumText">Dagbogsnotat</label>
    <textarea id="sensumText" rows="9" placeholder="Manuel fallback: indsæt dagbogsnotat her, hvis Sheet-synk ikke er sat op endnu."></textarea>

    <div class="sensum-note-actions">
      <button type="submit">Gem lokalt</button>
      <button type="button" id="clearSensumDoneButton" class="secondary">Ryd førte lokale notater</button>
    </div>

    <p id="sensumStatus" class="hint">Listen viser kun notater, der endnu ikke er ført i Sensum.</p>
  </form>

  <div id="sensumNoteList" class="sensum-note-list"></div>
`;

const memoryPanel = [...document.querySelectorAll('h2')]
  .find((heading) => heading.textContent.trim() === 'Hukommelse')
  ?.closest('section');
const firstGrid = document.querySelector('.grid');
const quickCapture = document.querySelector('.quick-capture');
const appShell = document.querySelector('.app-shell');

if (memoryPanel) {
  memoryPanel.before(sensumPanel);
} else if (firstGrid) {
  firstGrid.before(sensumPanel);
} else if (quickCapture) {
  quickCapture.after(sensumPanel);
} else {
  appShell?.appendChild(sensumPanel);
}

const sensumNoteForm = document.querySelector('#sensumNoteForm');
const sensumCitizen = document.querySelector('#sensumCitizen');
const sensumCategory = document.querySelector('#sensumCategory');
const sensumTitle = document.querySelector('#sensumTitle');
const sensumText = document.querySelector('#sensumText');
const sensumStatus = document.querySelector('#sensumStatus');
const sensumNoteList = document.querySelector('#sensumNoteList');
const clearSensumDoneButton = document.querySelector('#clearSensumDoneButton');
const sensumApiEndpoint = document.querySelector('#sensumApiEndpoint');
const saveSensumEndpointButton = document.querySelector('#saveSensumEndpointButton');
const syncSensumButton = document.querySelector('#syncSensumButton');

if (sensumApiEndpoint) sensumApiEndpoint.value = localStorage.getItem(SENSUM_API_ENDPOINT_KEY) || '';

function readSensumNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SENSUM_NOTES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSensumNotes(notes) {
  localStorage.setItem(SENSUM_NOTES_KEY, JSON.stringify(notes));
}

function getEndpoint() {
  return (localStorage.getItem(SENSUM_API_ENDPOINT_KEY) || sensumApiEndpoint?.value || '').trim();
}

function escapeSensumHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeSensumNote(note) {
  return {
    id: note.id || crypto.randomUUID(),
    rowNumber: note.rowNumber || '',
    citizen: note.citizen || note.barnUng || '',
    category: note.category || note.kategori || 'Følelser og adfærd',
    title: note.title || note.titel || '',
    text: note.text || note.notattekst || '',
    status: note.status || 'klar',
    completedInSensum: note.completedInSensum || note.foertISensum || '',
    createdAt: note.createdAt || note.oprettet || new Date().toISOString(),
    completedAt: note.completedAt || note.foertDato || '',
    source: note.source || note.kilde || 'lokal'
  };
}

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(parsed);
}

function setStatus(message) {
  if (sensumStatus) sensumStatus.textContent = message;
}

function isDone(note) {
  const status = String(note.status || '').toLowerCase();
  const completed = String(note.completedInSensum || '').toLowerCase();
  return status === 'ført' || status === 'foert' || completed === 'ja';
}

function visibleNotes(notes) {
  return notes.filter((note) => !isDone(note));
}

function mergeNotes(remoteNotes, localNotes) {
  const byId = new Map();
  for (const note of [...remoteNotes, ...localNotes]) {
    const normalized = normalizeSensumNote(note);
    byId.set(normalized.id, normalized);
  }
  return [...byId.values()];
}

function getActiveSortedNotes() {
  return visibleNotes(readSensumNotes().map(normalizeSensumNote))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back below.
  }

  const textarea = document.createElement('textarea');
  textarea.className = 'sensum-manual-copy';
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const ok = document.execCommand('copy');
  textarea.remove();
  return ok;
}

function updateLocalNote(noteId, changes) {
  const notes = readSensumNotes().map(normalizeSensumNote);
  const updated = notes.map((note) => note.id === noteId ? { ...note, ...changes } : note);
  writeSensumNotes(updated);
  renderSensumNotes();
  return updated.find((note) => note.id === noteId);
}

async function apiRequest(payload) {
  const endpoint = getEndpoint();
  if (!endpoint) throw new Error('Mangler API-endpoint');
  const response = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`API-fejl: ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'API svarede med fejl');
  return data;
}

async function syncFromSheet() {
  if (!syncSensumButton) return;
  syncSensumButton.disabled = true;
  setStatus('Synkroniserer fra SensumKladder...');
  try {
    const data = await apiRequest({ action: 'list' });
    const remoteNotes = (data.notes || []).map((note) => normalizeSensumNote({ ...note, source: 'Google Sheet' }));
    const localOnly = readSensumNotes().map(normalizeSensumNote).filter((note) => !note.rowNumber);
    writeSensumNotes(mergeNotes(remoteNotes, localOnly));
    renderSensumNotes();
    setStatus(`Synkroniseret: ${visibleNotes(remoteNotes).length} aktive kladder hentet fra Google Sheet.`);
  } catch (error) {
    setStatus(`Synkronisering fejlede: ${error.message}. Lokal fallback virker stadig.`);
  } finally {
    syncSensumButton.disabled = false;
  }
}

async function handleCopy(noteId) {
  const note = readSensumNotes().map(normalizeSensumNote).find((entry) => entry.id === noteId);
  if (!note) return;
  const ok = await copyTextToClipboard(note.text);
  setStatus(ok ? 'Notattekst kopieret til udklipsholderen.' : 'Kunne ikke kopiere automatisk. Markér teksten manuelt og kopier.');
}

async function handleDone(noteId, button) {
  const note = readSensumNotes().map(normalizeSensumNote).find((entry) => entry.id === noteId);
  if (!note) return;

  button.disabled = true;
  const completedAt = new Date().toISOString();
  updateLocalNote(noteId, { status: 'ført', completedInSensum: 'Ja', completedAt });

  if (note.rowNumber && getEndpoint()) {
    try {
      await apiRequest({ action: 'markDone', rowNumber: note.rowNumber, id: note.id });
      setStatus('Notatet er ført og fjernet fra den aktive liste. Google Sheet er opdateret.');
      await syncFromSheet();
    } catch (error) {
      setStatus(`Notatet er ført og fjernet lokalt. Sheet-opdatering fejlede: ${error.message}`);
    }
  } else {
    setStatus('Notatet er ført og fjernet fra den aktive liste.');
  }
}

function handleDelete(noteId) {
  const notes = readSensumNotes().map(normalizeSensumNote).filter((note) => note.id !== noteId);
  writeSensumNotes(notes);
  setStatus('Notatet er slettet fra den lokale liste.');
  renderSensumNotes();
}

function attachCardHandlers(card, note) {
  const copyButton = card.querySelector('[data-action="copy"]');
  const doneButton = card.querySelector('[data-action="done"]');
  const deleteButton = card.querySelector('[data-action="delete"]');

  copyButton?.addEventListener('click', (event) => {
    event.preventDefault();
    handleCopy(note.id);
  });

  doneButton?.addEventListener('click', (event) => {
    event.preventDefault();
    handleDone(note.id, doneButton);
  });

  deleteButton?.addEventListener('click', (event) => {
    event.preventDefault();
    handleDelete(note.id);
  });
}

function renderSensumNotes() {
  const notes = getActiveSortedNotes();
  sensumNoteList.innerHTML = '';

  if (!notes.length) {
    sensumNoteList.innerHTML = '<div class="sensum-note-empty">Ingen aktive Sensum-kladdder. Førte notater vises ikke her.</div>';
    return;
  }

  for (const note of notes) {
    const remote = note.source === 'Google Sheet' || Boolean(note.rowNumber);
    const card = document.createElement('article');
    card.className = `sensum-note-card ${remote ? 'remote' : ''}`;
    card.innerHTML = `
      <header>
        <span class="pill">${escapeSensumHtml(note.citizen || 'Ukendt')}</span>
        <span class="pill">${escapeSensumHtml(note.category)}</span>
        <span class="pill">${escapeSensumHtml(note.status)}</span>
        ${remote ? '<span class="pill">Google Sheet</span>' : '<span class="pill">lokal</span>'}
        ${note.title ? `<span class="pill">${escapeSensumHtml(note.title)}</span>` : ''}
      </header>
      <pre>${escapeSensumHtml(note.text)}</pre>
      <div class="sensum-note-card-actions">
        <button type="button" class="secondary" data-action="copy">Kopiér tekst</button>
        <button type="button" class="secondary" data-action="done">Markér ført i Sensum</button>
        ${remote ? '' : '<button type="button" class="secondary" data-action="delete">Slet</button>'}
      </div>
      <p class="hint">Oprettet: ${escapeSensumHtml(formatDate(note.createdAt))}</p>
    `;
    attachCardHandlers(card, note);
    sensumNoteList.appendChild(card);
  }
}

saveSensumEndpointButton?.addEventListener('click', () => {
  const endpoint = sensumApiEndpoint.value.trim();
  if (!endpoint) {
    localStorage.removeItem(SENSUM_API_ENDPOINT_KEY);
    setStatus('API-endpoint er fjernet. Modulet bruger lokal fallback.');
    return;
  }
  localStorage.setItem(SENSUM_API_ENDPOINT_KEY, endpoint);
  setStatus('API-endpoint er gemt. Tryk Synkronisér.');
});

syncSensumButton?.addEventListener('click', syncFromSheet);

sensumNoteForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = sensumText.value.trim();
  if (!text) return;
  const notes = readSensumNotes().map(normalizeSensumNote);
  notes.unshift({
    id: crypto.randomUUID(),
    citizen: sensumCitizen.value.trim(),
    category: sensumCategory.value,
    title: sensumTitle.value.trim(),
    text,
    status: 'klar',
    completedInSensum: 'Nej',
    createdAt: new Date().toISOString(),
    completedAt: '',
    source: 'lokal'
  });
  writeSensumNotes(notes);
  sensumText.value = '';
  sensumTitle.value = '';
  setStatus('Notatet er gemt lokalt og vises som aktiv kladde.');
  renderSensumNotes();
});

clearSensumDoneButton?.addEventListener('click', () => {
  const notes = readSensumNotes().map(normalizeSensumNote).filter((note) => !isDone(note) || note.rowNumber);
  writeSensumNotes(notes);
  setStatus('Førte lokale notater er ryddet. Førte Google Sheet-notater vises allerede ikke.');
  renderSensumNotes();
});

window.ArbejdscentralSensum = {
  addNote(note) {
    const notes = readSensumNotes().map(normalizeSensumNote);
    notes.unshift(normalizeSensumNote({ ...note, status: note.status || 'klar' }));
    writeSensumNotes(notes);
    localStorage.setItem(ACTIVE_MODULE_KEY, 'sensum');
    renderSensumNotes();
  },
  sync: syncFromSheet,
  getNotes: readSensumNotes
};

renderSensumNotes();

if (getEndpoint()) {
  syncFromSheet();
}
