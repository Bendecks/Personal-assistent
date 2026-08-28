const STORAGE_KEY = 'arbejdscentral.items.v2';
const ROUTINE_KEY = 'arbejdscentral.routines.v1';
const LEGACY_STORAGE_KEY = 'arbejdscentral.items.v1';

const form = document.querySelector('#captureForm');
const textInput = document.querySelector('#captureText');
const typeInput = document.querySelector('#captureType');
const urgencyInput = document.querySelector('#captureUrgency');
const screenshotForm = document.querySelector('#screenshotForm');
const screenshotFile = document.querySelector('#screenshotFile');
const screenshotPreview = document.querySelector('#screenshotPreview');
const screenshotType = document.querySelector('#screenshotType');
const screenshotArea = document.querySelector('#screenshotArea');
const screenshotUrgency = document.querySelector('#screenshotUrgency');
const screenshotText = document.querySelector('#screenshotText');
const screenshotSender = document.querySelector('#screenshotSender');
const screenshotDate = document.querySelector('#screenshotDate');
const screenshotStatus = document.querySelector('#screenshotStatus');
const taskList = document.querySelector('#taskList');
const nextAction = document.querySelector('#nextAction');
const focusCount = document.querySelector('#focusCount');
const todayLabel = document.querySelector('#todayLabel');
const aiPrompt = document.querySelector('#aiPrompt');
const copyPromptButton = document.querySelector('#copyPromptButton');
const clearDoneButton = document.querySelector('#clearDoneButton');
const filterButtons = [...document.querySelectorAll('.filter')];
const routineBoxes = [...document.querySelectorAll('[data-routine]')];

let pendingScreenshot = null;
let items = readItems();
let routines = readJson(ROUTINE_KEY, {});
let activeFilter = 'alle';

function seedItems() {
  return [
    {
      id: crypto.randomUUID(),
      text: 'Ved vagtstart: læs nye notater og genopfrisk mål for børn/unge.',
      type: 'rutine',
      urgency: 'høj',
      status: 'aktiv',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      text: 'Hold arbejdsopgaver adskilt fra privatprojekter.',
      type: 'rutine',
      urgency: 'normal',
      status: 'aktiv',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      text: 'Brug Google Sheet “ChatGPT Arbejde-hukommelse” som sandhedskilde ved status og synkronisering.',
      type: 'dokumentation',
      urgency: 'normal',
      status: 'aktiv',
      createdAt: new Date().toISOString()
    }
  ];
}

function readItems() {
  const current = readJson(STORAGE_KEY, null);
  if (current) return current;

  const legacy = readJson(LEGACY_STORAGE_KEY, null);
  if (legacy) {
    const migrated = legacy.map(normalizeItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }

  return seedItems();
}

function normalizeItem(item) {
  return {
    source: 'manuel',
    area: '',
    sender: '',
    sourceDate: '',
    imageDataUrl: '',
    imageName: '',
    ...item
  };
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(routines));
}

function urgencyRank(item) {
  if (item.status === 'lukket') return 99;
  if (item.urgency === 'høj') return 1;
  if (item.type === 'aktiv arbejdsopgave') return 2;
  if (item.type === 'venter på svar') return 3;
  if (item.type === 'møde/aftale') return 4;
  if (item.type === 'information') return 5;
  if (item.type === 'dokumentation') return 6;
  if (item.type === 'rutine') return 7;
  return 8;
}

function getVisibleItems() {
  return items
    .filter((item) => activeFilter === 'alle' || item.type === activeFilter)
    .sort((a, b) => urgencyRank(a) - urgencyRank(b) || new Date(a.createdAt) - new Date(b.createdAt));
}

function render() {
  const formatter = new Intl.DateTimeFormat('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });
  todayLabel.textContent = formatter.format(new Date());

  const openItems = items.filter((item) => item.status !== 'lukket' && item.type !== 'parkeret');
  focusCount.textContent = `${openItems.length} aktive`;

  const actionableItems = openItems.filter((item) => item.type !== 'information' && item.type !== 'dokumentation');
  const suggested = [...(actionableItems.length ? actionableItems : openItems)].sort((a, b) => urgencyRank(a) - urgencyRank(b))[0];

  if (!suggested) {
    nextAction.className = 'next-action empty';
    nextAction.textContent = 'Ingen aktive punkter endnu.';
  } else {
    nextAction.className = 'next-action';
    nextAction.innerHTML = `
      <strong>${escapeHtml(suggested.type)} · ${escapeHtml(suggested.urgency)}</strong>
      <div>${escapeHtml(suggested.text)}</div>
      ${suggested.area ? `<small>Område: ${escapeHtml(suggested.area)}</small>` : ''}
    `;
  }

  renderTasks();
  renderPrompt();
  renderRoutines();
}

function renderTasks() {
  const visible = getVisibleItems();
  taskList.innerHTML = '';

  if (!visible.length) {
    taskList.innerHTML = '<p class="empty">Ingen punkter i dette filter.</p>';
    return;
  }

  for (const item of visible) {
    const card = document.createElement('article');
    card.className = `task-card ${item.status === 'lukket' ? 'done' : ''}`;
    card.dataset.urgency = item.urgency;

    const metadata = [
      item.type,
      item.urgency,
      item.status,
      item.area ? `område: ${item.area}` : '',
      item.sender ? `fra: ${item.sender}` : '',
      item.source === 'screenshot' ? 'screenshot' : ''
    ].filter(Boolean);

    card.innerHTML = `
      <div>
        <div class="task-meta">
          ${metadata.map((entry) => `<span class="pill">${escapeHtml(entry)}</span>`).join('')}
        </div>
        <div class="task-text">${escapeHtml(item.text)}</div>
        ${item.sourceDate ? `<div class="task-note">Dato/tid: ${escapeHtml(item.sourceDate)}</div>` : ''}
        ${item.imageDataUrl ? `<details class="screenshot-details"><summary>Vis screenshot</summary><img src="${item.imageDataUrl}" alt="Gemt screenshot" /></details>` : ''}
      </div>
      <div class="task-actions">
        <button class="secondary" data-action="lower" data-id="${item.id}">Sænk</button>
        <button class="secondary" data-action="done" data-id="${item.id}">Luk</button>
        <button class="secondary" data-action="delete" data-id="${item.id}">Slet</button>
      </div>
    `;
    taskList.appendChild(card);
  }
}

function renderPrompt() {
  const active = items.filter((item) => item.status !== 'lukket');
  aiPrompt.value = `Du er min praktiske arbejdsassistent. Sortér disse arbejdspunkter kort og konkret.

Regler:
- Skeln mellem aktiv arbejdsopgave, information, venter på svar, møde/aftale, rutine, dokumentation, parkeret og lukket.
- Screenshot-beskeder skal normalt gemmes som information eller dokumentation, medmindre de tydeligt kræver handling.
- Foreslå kun én næste handling.
- Store ting skal deles i trin på 3-10 minutter.
- Markér afhængigheder som “venter på svar”.
- Foreslå hvad der bør opdateres i Google Sheet “ChatGPT Arbejde-hukommelse”.

Aktuelle punkter:
${active.map((item, index) => {
  const extra = [
    item.area ? `område=${item.area}` : '',
    item.sender ? `afsender=${item.sender}` : '',
    item.sourceDate ? `dato=${item.sourceDate}` : '',
    item.source ? `kilde=${item.source}` : ''
  ].filter(Boolean).join(' · ');
  return `${index + 1}. [${item.type} · ${item.urgency} · ${item.status}${extra ? ` · ${extra}` : ''}] ${item.text}`;
}).join('\n')}

Svarformat:
1. Kort overblik
2. Én konkret næste handling
3. Hvad der bør synkroniseres til arket`;
}

function renderRoutines() {
  for (const box of routineBoxes) {
    box.checked = Boolean(routines[box.dataset.routine]);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildScreenshotText() {
  const chunks = [];
  if (screenshotSender.value.trim()) chunks.push(`Fra: ${screenshotSender.value.trim()}`);
  if (screenshotDate.value.trim()) chunks.push(`Dato/tid: ${screenshotDate.value.trim()}`);
  if (screenshotArea.value.trim()) chunks.push(`Område: ${screenshotArea.value.trim()}`);
  if (screenshotText.value.trim()) chunks.push(screenshotText.value.trim());
  return chunks.join('\n');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = textInput.value.trim();
  if (!text) return;

  items.unshift({
    id: crypto.randomUUID(),
    text,
    type: typeInput.value,
    urgency: urgencyInput.value,
    status: typeInput.value === 'parkeret' ? 'parkeret' : 'aktiv',
    source: 'manuel',
    area: '',
    sender: '',
    sourceDate: '',
    imageDataUrl: '',
    imageName: '',
    createdAt: new Date().toISOString()
  });

  textInput.value = '';
  writeState();
  render();
});

screenshotFile.addEventListener('change', () => {
  const file = screenshotFile.files?.[0];
  pendingScreenshot = null;

  if (!file) {
    screenshotPreview.className = 'screenshot-preview empty';
    screenshotPreview.textContent = 'Ingen screenshot valgt.';
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const dataUrl = String(reader.result || '');
    const shouldStoreImage = file.size <= 900_000;
    pendingScreenshot = {
      name: file.name,
      size: file.size,
      dataUrl: shouldStoreImage ? dataUrl : ''
    };

    screenshotPreview.className = 'screenshot-preview';
    screenshotPreview.innerHTML = `<img src="${dataUrl}" alt="Valgt screenshot" />`;
    screenshotStatus.textContent = shouldStoreImage
      ? 'Screenshotet kan gemmes lokalt sammen med posten.'
      : 'Screenshotet er stort. Appen gemmer teksten og filnavnet, men ikke selve billedet.';
  });
  reader.readAsDataURL(file);
});

screenshotForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = buildScreenshotText();
  if (!text) return;

  items.unshift({
    id: crypto.randomUUID(),
    text,
    type: screenshotType.value,
    urgency: screenshotUrgency.value,
    status: screenshotType.value === 'parkeret' ? 'parkeret' : 'aktiv',
    source: 'screenshot',
    area: screenshotArea.value.trim(),
    sender: screenshotSender.value.trim(),
    sourceDate: screenshotDate.value.trim(),
    imageDataUrl: pendingScreenshot?.dataUrl || '',
    imageName: pendingScreenshot?.name || '',
    createdAt: new Date().toISOString()
  });

  screenshotForm.reset();
  pendingScreenshot = null;
  screenshotPreview.className = 'screenshot-preview empty';
  screenshotPreview.textContent = 'Ingen screenshot valgt.';
  screenshotStatus.textContent = 'Gemt. Screenshot-info er sorteret ind i arbejdsoverblikket.';

  writeState();
  render();
});

taskList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const item = items.find((entry) => entry.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.action === 'done') item.status = 'lukket';
  if (button.dataset.action === 'delete') items = items.filter((entry) => entry.id !== item.id);
  if (button.dataset.action === 'lower') item.urgency = item.urgency === 'høj' ? 'normal' : 'lav';

  writeState();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((entry) => entry.classList.toggle('active', entry === button));
    renderTasks();
  });
});

copyPromptButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(aiPrompt.value);
  copyPromptButton.textContent = 'Kopieret';
  setTimeout(() => (copyPromptButton.textContent = 'Kopiér AI-prompt'), 1200);
});

clearDoneButton.addEventListener('click', () => {
  items = items.filter((item) => item.status !== 'lukket');
  writeState();
  render();
});

routineBoxes.forEach((box) => {
  box.addEventListener('change', () => {
    routines[box.dataset.routine] = box.checked;
    writeState();
  });
});

render();
