const SENSUM_NOTES_KEY = 'arbejdscentral.sensumNotes.v1';
const ACTIVE_MODULE_KEY = 'arbejdscentral.activeModule.v1';

const sensumStyle = document.createElement('style');
sensumStyle.textContent = `
.sensum-note-form {
  display: grid;
  gap: 0.75rem;
}

.sensum-note-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
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

@media (max-width: 820px) {
  .sensum-note-grid {
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
    <textarea id="sensumText" rows="9" placeholder="Indsæt det dagbogsnotat ChatGPT har skrevet til Sensum."></textarea>

    <div class="sensum-note-actions">
      <button type="submit">Gem til Sensum-listen</button>
      <button type="button" id="clearSensumDoneButton" class="secondary">Ryd førte notater</button>
    </div>

    <p id="sensumStatus" class="hint">Fremover kan ChatGPT give dig en blok, du kopierer ind her. Data gemmes lokalt i browseren.</p>
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
    citizen: note.citizen || '',
    category: note.category || 'Følelser og adfærd',
    title: note.title || '',
    text: note.text || '',
    status: note.status || 'klar',
    createdAt: note.createdAt || new Date().toISOString(),
    completedAt: note.completedAt || ''
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

function renderSensumNotes() {
  const notes = readSensumNotes().map(normalizeSensumNote)
    .sort((a, b) => Number(a.status === 'ført') - Number(b.status === 'ført') || new Date(b.createdAt) - new Date(a.createdAt));

  sensumNoteList.innerHTML = '';

  if (!notes.length) {
    sensumNoteList.innerHTML = '<div class="sensum-note-empty">Ingen klargjorte Sensum-notater endnu.</div>';
    return;
  }

  for (const note of notes) {
    const card = document.createElement('article');
    card.className = `sensum-note-card ${note.status === 'ført' ? 'done' : ''}`;
    card.innerHTML = `
      <header>
        <span class="pill">${escapeSensumHtml(note.citizen || 'Ukendt')}</span>
        <span class="pill">${escapeSensumHtml(note.category)}</span>
        <span class="pill">${escapeSensumHtml(note.status)}</span>
        ${note.title ? `<span class="pill">${escapeSensumHtml(note.title)}</span>` : ''}
      </header>
      <pre>${escapeSensumHtml(note.text)}</pre>
      <div class="sensum-note-card-actions">
        <button type="button" class="secondary" data-action="copy" data-id="${note.id}">Kopiér tekst</button>
        <button type="button" class="secondary" data-action="done" data-id="${note.id}">${note.status === 'ført' ? 'Ført i Sensum' : 'Markér ført i Sensum'}</button>
        <button type="button" class="secondary" data-action="delete" data-id="${note.id}">Slet</button>
      </div>
      <p class="hint">Oprettet: ${escapeSensumHtml(formatDate(note.createdAt))}${note.completedAt ? ` · Ført: ${escapeSensumHtml(formatDate(note.completedAt))}` : ''}</p>
    `;
    sensumNoteList.appendChild(card);
  }
}

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
    createdAt: new Date().toISOString(),
    completedAt: ''
  });

  writeSensumNotes(notes);
  sensumText.value = '';
  sensumTitle.value = '';
  sensumStatus.textContent = 'Notatet er gemt og klar til kopiering til Sensum.';
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
    sensumStatus.textContent = 'Notattekst kopieret til udklipsholderen.';
  }

  if (button.dataset.action === 'done') {
    note.status = 'ført';
    note.completedAt = new Date().toISOString();
    writeSensumNotes(notes);
    sensumStatus.textContent = 'Notatet er markeret som ført i Sensum.';
    renderSensumNotes();
  }

  if (button.dataset.action === 'delete') {
    notes = notes.filter((entry) => entry.id !== note.id);
    writeSensumNotes(notes);
    sensumStatus.textContent = 'Notatet er slettet fra den lokale liste.';
    renderSensumNotes();
  }
});

clearSensumDoneButton.addEventListener('click', () => {
  const notes = readSensumNotes().map(normalizeSensumNote).filter((note) => note.status !== 'ført');
  writeSensumNotes(notes);
  sensumStatus.textContent = 'Førte notater er ryddet fra listen.';
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
  getNotes: readSensumNotes
};

renderSensumNotes();
