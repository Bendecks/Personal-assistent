const SENSUM_NOTES_KEY = 'arbejdscentral.sensumNotes.v1';
const SENSUM_API_ENDPOINT_KEY = 'arbejdscentral.sensumApiEndpoint.v1';
const ACTIVE_MODULE_KEY = 'arbejdscentral.activeModule.v1';

const sensumStyle = document.createElement('style');
sensumStyle.textContent = `
.sensum-note-form {
  display: grid;
  gap: 0.75rem;
}

.sensum-note-grid,
.sensum-sync-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.sensum-sync-grid {
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: end;
}

.sensum-note-actions,
.sensum-note-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.sensum-note-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.sensum-note-card {
  border: 1px solid var(--line);
  border-left: 6px solid var(--accent);
  border-radius: 20px;
  background: #fffdf9;
  padding: 14px;
}

.sensum-note-card.done {
  opacity: 0.68;
  border-left-color: var(--ok);
}

.sensum-note-card.remote {
  border-left-color: var(--warn);
}

.sensum-note-card header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.sensum-note-card pre {
  white-space: pre-wrap;
  font: inherit;
  line-height: 1.45;
  margin: 0 0 12px;
}

.sensum-note-empty {
  border: 1px dashed var(--line);
  border-radius: 18px;
  padding: 16px;
  color: var(--muted);
  background: #fffdf9;
}

.sensum-sync-box {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 12px;
  background: #fffdf9;
}

.sensum-sync-box summary {
  cursor: pointer;
  font-weight: 800;
}

@media (max-width: 820px) {
  .sensum-note-grid,
  .sensum-sync-grid {
    grid-template-columns: 1fr;
  }
}
`;
document.head.appendChild(sensumStyle);

const sensumPanel = document.createElement('section');
sensumPanel.className = 'panel';
sensumPanel.innerHTML = `
  <div class="panel-header">
    <div>
      <h2>Sensum-notater</h2>
      <p>Notater formuleret i ChatGPT, klar til kopiering og afkrydsning når de er ført i Sensum.</p>
    </div>
  </div>

  <details class="sensum-sync-box" open>
    <summary>Synkronisering med SensumKladder</summary>
    <p class="hint">Når API-endpoint er sat, henter modulet kladder fra Google Sheet og kan markere dem som ført.</p>
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

    <p id="sensumStatus" class="hint">Førstevalg: Synkronisér fra SensumKladder. Lokal gem er fallback.</p>
  </form>

  <div id="sensumNoteList" class="sensum-note-list"></div>
`;

const memoryPanel = [...document.querySelectorAll('h2')]
  .find((heading) => heading.textContent.trim() === 'Hukommelse')
  ?.closest('section');

memoryPanel?.before(sensumPanel);

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

sensumApiEndpoint.value = localStorage.getItem(SENSUM_API_ENDPOINT_KEY) || '';

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
  return (localStorage.getItem(SENSUM_API_ENDPOINT_KEY) || sensumApiEndpoint.value || '').trim();
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
}

function setStatus(message) {
  sensumStatus.textContent = message;
}

function mergeNotes(remoteNotes, localNotes) {
  const byId = new Map();
  for (const note of [...remoteNotes, ...localNotes]) {
    const normalized = normalizeSensumNote(note);
    byId.set(normalized.id, normalized);
  }
  return [...byId.values()];
}

function getSortedNotes() {
  return readSensumNotes().map(normalizeSensumNote)
    .sort((a, b) => Number(isDone(a)) - Number(isDone(b)) || new Date(b.createdAt) - new Date(a.createdAt));
}

function isDone(note) {
  return note.status === 'ført' || String(note.completedInSensum).toLowerCase() === 'ja';
}

function renderSensumNotes() {
  const notes = getSortedNotes();

  sensumNoteList.innerHTML = '';

  if (!notes.length) {
    sensumNoteList.innerHTML = '<div class="sensum-note-empty">Ingen klargjorte Sensum-notater endnu.</div>';
    return;
  }

  for (const note of notes) {
    const done = isDone(note);
    const remote = note.source === 'Google Sheet' || Boolean(note.rowNumber);
    const card = document.createElement('article');
    card.className = `sensum-note-card ${done ? 'done' : ''} ${remote ? 'remote' : ''}`;
    card.innerHTML = `
      <header>
        <span class="pill">${escapeSensumHtml(note.citizen || 'Ukendt')}</span>
        <span class="pill">${escapeSensumHtml(note.category)}</span>
        <span class="pill">${escapeSensumHtml(done ? 'ført' : note.status)}</span>
        ${remote ? '<span class="pill">Google Sheet</span>' : '<span class="pill">lokal</span>'}
        ${note.title ? `<span class="pill">${escapeSensumHtml(note.title)}</span>` : ''}
      </header>
      <pre>${escapeSensumHtml(note.text)}</pre>
      <div class="sensum-note-card-actions">
        <button type="button" class="secondary" data-action="copy" data-id="${note.id}">Kopiér tekst</button>
        <button type="button" class="secondary" data-action="done" data-id="${note.id}">${done ? 'Ført i Sensum' : 'Markér ført i Sensum'}</button>
        ${remote ? '' : `<button type="button" class="secondary" data-action="delete" data-id="${note.id}">Slet</button>`}
      </div>
      <p class="hint">Oprettet: ${escapeSensumHtml(formatDate(note.createdAt))}${note.completedAt ? ` · Ført: ${escapeSensumHtml(formatDate(note.completedAt))}` : ''}</p>
    `;
    sensumNoteList.appendChild(card);
  }
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
  syncSensumButton.disabled = true;
  setStatus('Synkroniserer fra SensumKladder...');
  try {
    const data = await apiRequest({ action: 'list' });
    const remoteNotes = (data.notes || []).map((note) => normalizeSensumNote({ ...note, source: 'Google Sheet' }));
    const localOnly = readSensumNotes().map(normalizeSensumNote).filter((note) => !note.rowNumber);
    writeSensumNotes(mergeNotes(remoteNotes, localOnly));
    renderSensumNotes();
    setStatus(`Synkroniseret: ${remoteNotes.length} kladder hentet fra Google Sheet.`);
  } catch (error) {
    setStatus(`Synkronisering fejlede: ${error.message}. Lokal fallback virker stadig.`);
  } finally {
    syncSensumButton.disabled = false;
  }
}

async function markRemoteDone(note) {
  if (!note.rowNumber) return false;
  await apiRequest({ action: 'markDone', rowNumber: note.rowNumber, id: note.id });
  await syncFromSheet();
  return true;
}

saveSensumEndpointButton.addEventListener('click', () => {
  const endpoint = sensumApiEndpoint.value.trim();
  if (!endpoint) {
    localStorage.removeItem(SENSUM_API_ENDPOINT_KEY);
    setStatus('API-endpoint er fjernet. Modulet bruger lokal fallback.');
    return;
  }
  localStorage.setItem(SENSUM_API_ENDPOINT_KEY, endpoint);
  setStatus('API-endpoint er gemt. Tryk Synkronisér.');
});

syncSensumButton.addEventListener('click', syncFromSheet);

sensumNoteForm.addEventListener('submit', (event) => {
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
  setStatus('Notatet er gemt lokalt og klar til kopiering til Sensum.');
  renderSensumNotes();
});

sensumNoteList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  let notes = readSensumNotes().map(normalizeSensumNote);
  const note = notes.find((entry) => entry.id === button.dataset.id);
  if (!note) return;

  if (button.dataset.action === 'copy') {
    await navigator.clipboard.writeText(note.text);
    setStatus('Notattekst kopieret til udklipsholderen.');
  }

  if (button.dataset.action === 'done') {
    button.disabled = true;
    try {
      if (note.rowNumber && getEndpoint()) {
        await markRemoteDone(note);
        setStatus('Notatet er markeret som ført i Sensum i Google Sheet.');
      } else {
        note.status = 'ført';
        note.completedInSensum = 'Ja';
        note.completedAt = new Date().toISOString();
        writeSensumNotes(notes);
        setStatus('Notatet er markeret som ført i Sensum lokalt.');
        renderSensumNotes();
      }
    } catch (error) {
      setStatus(`Kunne ikke markere ført: ${error.message}`);
      button.disabled = false;
    }
  }

  if (button.dataset.action === 'delete') {
    notes = notes.filter((entry) => entry.id !== note.id);
    writeSensumNotes(notes);
    setStatus('Notatet er slettet fra den lokale liste.');
    renderSensumNotes();
  }
});

clearSensumDoneButton.addEventListener('click', () => {
  const notes = readSensumNotes().map(normalizeSensumNote).filter((note) => !isDone(note) || note.rowNumber);
  writeSensumNotes(notes);
  setStatus('Førte lokale notater er ryddet fra listen. Google Sheet-notater ryddes ikke lokalt.');
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
