const MEMORY_STORAGE_KEY = 'arbejdscentral.items.v2';
const MEMORY_IMPORT_INPUT_ID = 'memoryImportFile';

const memoryStyle = document.createElement('style');
memoryStyle.textContent = `
.memory-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 170px 170px;
  gap: 10px;
  margin-bottom: 12px;
}

.memory-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.memory-list {
  display: grid;
  gap: 10px;
}

.memory-card {
  border: 1px solid var(--line);
  border-left: 6px solid var(--accent);
  border-radius: 20px;
  background: #fffdf9;
  padding: 14px;
}

.memory-card[data-source='screenshot'] {
  border-left-color: var(--warn);
}

.memory-card[data-source='document'] {
  border-left-color: var(--ok);
}

.memory-card header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.memory-card pre {
  white-space: pre-wrap;
  margin: 0;
  font: inherit;
  line-height: 1.45;
}

.memory-card small {
  display: block;
  color: var(--muted);
  margin-top: 8px;
}

.memory-empty {
  border: 1px dashed var(--line);
  border-radius: 18px;
  padding: 16px;
  color: var(--muted);
  background: #fffdf9;
}

.memory-import-label {
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #ebe2d6;
  color: var(--text);
  padding: 0.82rem 1.05rem;
  font-weight: 800;
  cursor: pointer;
}

.memory-import-label input {
  display: none;
}

@media (max-width: 820px) {
  .memory-toolbar {
    grid-template-columns: 1fr;
  }
}
`;
document.head.appendChild(memoryStyle);

const memoryPanel = document.createElement('section');
memoryPanel.className = 'panel';
memoryPanel.innerHTML = `
  <div class="panel-header">
    <div>
      <h2>Hukommelse</h2>
      <p>Lokalt arkiv over dokumentation, information, screenshots og importerede dokumenter.</p>
    </div>
  </div>

  <div class="memory-toolbar">
    <input id="memorySearch" type="text" placeholder="Søg fx Derya, søvn, venskaber, A3..." />
    <select id="memoryTypeFilter" aria-label="Filtrer type">
      <option value="alle">Alle typer</option>
      <option value="dokumentation">Dokumentation</option>
      <option value="information">Information</option>
      <option value="aktiv arbejdsopgave">Aktive opgaver</option>
      <option value="venter på svar">Venter på svar</option>
      <option value="møde/aftale">Møder/aftaler</option>
      <option value="rutine">Rutiner</option>
      <option value="parkeret">Parkeret</option>
      <option value="lukket">Lukket</option>
    </select>
    <select id="memorySourceFilter" aria-label="Filtrer kilde">
      <option value="alle">Alle kilder</option>
      <option value="manuel">Manuel</option>
      <option value="screenshot">Screenshot</option>
      <option value="document">Dokument</option>
    </select>
  </div>

  <div class="memory-actions">
    <button id="copyMemoryButton" type="button" class="secondary">Kopiér hukommelse til ChatGPT</button>
    <button id="exportMemoryButton" type="button" class="secondary">Eksportér JSON</button>
    <label class="memory-import-label" for="${MEMORY_IMPORT_INPUT_ID}">Importér JSON<input id="${MEMORY_IMPORT_INPUT_ID}" type="file" accept="application/json,.json" /></label>
  </div>

  <div id="memoryList" class="memory-list"></div>
  <p id="memoryStatus" class="hint">Gemte punkter ligger i browserens lokale lager. Eksportér JSON som backup, hvis du skifter computer/browser.</p>
`;

const aiGrid = [...document.querySelectorAll('.grid')].at(-1);
aiGrid?.before(memoryPanel);

const memorySearch = document.querySelector('#memorySearch');
const memoryTypeFilter = document.querySelector('#memoryTypeFilter');
const memorySourceFilter = document.querySelector('#memorySourceFilter');
const memoryList = document.querySelector('#memoryList');
const memoryStatus = document.querySelector('#memoryStatus');
const copyMemoryButton = document.querySelector('#copyMemoryButton');
const exportMemoryButton = document.querySelector('#exportMemoryButton');
const memoryImportFile = document.querySelector(`#${MEMORY_IMPORT_INPUT_ID}`);

function readMemoryItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MEMORY_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMemoryItems(items) {
  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('arbejdscentral:memory-updated'));
}

function escapeMemoryHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeMemoryItem(item) {
  return {
    id: item.id || crypto.randomUUID(),
    text: item.text || '',
    type: item.type || 'information',
    urgency: item.urgency || 'normal',
    status: item.status || 'aktiv',
    source: item.source || 'manuel',
    area: item.area || '',
    sender: item.sender || '',
    sourceDate: item.sourceDate || '',
    imageDataUrl: item.imageDataUrl || '',
    imageName: item.imageName || '',
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function getFilteredMemoryItems() {
  const query = memorySearch.value.trim().toLowerCase();
  const type = memoryTypeFilter.value;
  const source = memorySourceFilter.value;

  return readMemoryItems()
    .map(normalizeMemoryItem)
    .filter((item) => {
      const statusOrTypeMatches = type === 'alle' || item.type === type || item.status === type;
      const sourceMatches = source === 'alle' || item.source === source;
      const haystack = [item.text, item.type, item.status, item.source, item.area, item.sender, item.sourceDate, item.imageName]
        .join(' ')
        .toLowerCase();
      const queryMatches = !query || haystack.includes(query);
      return statusOrTypeMatches && sourceMatches && queryMatches;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function formatMemoryDate(value) {
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

function renderMemory() {
  const items = getFilteredMemoryItems();
  memoryList.innerHTML = '';

  if (!items.length) {
    memoryList.innerHTML = '<div class="memory-empty">Ingen gemte punkter matcher filteret.</div>';
    return;
  }

  for (const item of items) {
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.dataset.source = item.source;

    const meta = [
      item.type,
      item.status,
      item.urgency,
      item.source,
      item.area ? `område: ${item.area}` : '',
      item.sender ? `fra: ${item.sender}` : '',
      item.sourceDate ? `dato/periode: ${item.sourceDate}` : '',
      item.imageName ? `fil: ${item.imageName}` : ''
    ].filter(Boolean);

    card.innerHTML = `
      <header>${meta.map((entry) => `<span class="pill">${escapeMemoryHtml(entry)}</span>`).join('')}</header>
      <pre>${escapeMemoryHtml(item.text)}</pre>
      <small>Gemt: ${escapeMemoryHtml(formatMemoryDate(item.createdAt))}</small>
    `;
    memoryList.appendChild(card);
  }
}

function buildMemoryPrompt() {
  const items = getFilteredMemoryItems();
  return `Du er min praktiske arbejdsassistent. Brug denne lokale arbejdshukommelse som grundlag.\n\nRegler:\n- Skeln mellem aktiv arbejdsopgave, information, dokumentation, venter på svar, møde/aftale, rutine, parkeret og lukket.\n- Brug dokumentation konkret og fagligt.\n- Foreslå kun én næste handling.\n- Gæt ikke på noget der ikke står i materialet.\n\nHukommelse:\n${items.map((item, index) => {
    const meta = [item.type, item.status, item.urgency, item.source, item.area, item.sender, item.sourceDate, item.imageName]
      .filter(Boolean)
      .join(' · ');
    return `${index + 1}. [${meta}]\n${item.text}`;
  }).join('\n\n')}`;
}

copyMemoryButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(buildMemoryPrompt());
  copyMemoryButton.textContent = 'Kopieret';
  memoryStatus.textContent = 'Hukommelsen er kopieret til udklipsholderen og kan indsættes i ChatGPT.';
  setTimeout(() => (copyMemoryButton.textContent = 'Kopiér hukommelse til ChatGPT'), 1200);
});

exportMemoryButton.addEventListener('click', () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'ChatGPT Arbejdscentral',
    storageKey: MEMORY_STORAGE_KEY,
    items: readMemoryItems().map(normalizeMemoryItem)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `arbejdscentral-hukommelse-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  memoryStatus.textContent = 'JSON-backup er hentet.';
});

memoryImportFile.addEventListener('change', () => {
  const file = memoryImportFile.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      const imported = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(imported)) throw new Error('Ingen items fundet');
      writeMemoryItems(imported.map(normalizeMemoryItem));
      memoryStatus.textContent = `Importeret ${imported.length} punkter. Genindlæs siden, hvis overblikket ikke opdateres med det samme.`;
      renderMemory();
    } catch {
      memoryStatus.textContent = 'Import fejlede. Vælg en gyldig JSON-eksport fra arbejdscentralen.';
    } finally {
      memoryImportFile.value = '';
    }
  });
  reader.readAsText(file);
});

[memorySearch, memoryTypeFilter, memorySourceFilter].forEach((control) => {
  control.addEventListener('input', renderMemory);
  control.addEventListener('change', renderMemory);
});

window.addEventListener('storage', renderMemory);
window.addEventListener('arbejdscentral:memory-updated', renderMemory);
document.addEventListener('submit', () => setTimeout(renderMemory, 250), true);
document.addEventListener('click', () => setTimeout(renderMemory, 250), true);

renderMemory();
