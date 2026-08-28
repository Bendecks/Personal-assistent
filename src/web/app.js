const STORAGE_KEY = 'arbejdscentral.items.v1';
const ROUTINE_KEY = 'arbejdscentral.routines.v1';

const form = document.querySelector('#captureForm');
const textInput = document.querySelector('#captureText');
const typeInput = document.querySelector('#captureType');
const urgencyInput = document.querySelector('#captureUrgency');
const taskList = document.querySelector('#taskList');
const nextAction = document.querySelector('#nextAction');
const focusCount = document.querySelector('#focusCount');
const todayLabel = document.querySelector('#todayLabel');
const aiPrompt = document.querySelector('#aiPrompt');
const copyPromptButton = document.querySelector('#copyPromptButton');
const clearDoneButton = document.querySelector('#clearDoneButton');
const filterButtons = [...document.querySelectorAll('.filter')];
const routineBoxes = [...document.querySelectorAll('[data-routine]')];

let items = readJson(STORAGE_KEY, seedItems());
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
  if (item.type === 'dokumentation') return 4;
  if (item.type === 'rutine') return 5;
  return 6;
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

  const suggested = [...openItems].sort((a, b) => urgencyRank(a) - urgencyRank(b))[0];
  if (!suggested) {
    nextAction.className = 'next-action empty';
    nextAction.textContent = 'Ingen aktive punkter endnu.';
  } else {
    nextAction.className = 'next-action';
    nextAction.innerHTML = `<strong>${escapeHtml(suggested.type)} · ${escapeHtml(suggested.urgency)}</strong><div>${escapeHtml(suggested.text)}</div>`;
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
    card.innerHTML = `
      <div>
        <div class="task-meta">
          <span class="pill">${escapeHtml(item.type)}</span>
          <span class="pill">${escapeHtml(item.urgency)}</span>
          <span class="pill">${escapeHtml(item.status)}</span>
        </div>
        <div class="task-text">${escapeHtml(item.text)}</div>
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
  aiPrompt.value = `Du er min praktiske arbejdsassistent. Sortér disse arbejdspunkter kort og konkret.\n\nRegler:\n- Skeln mellem aktiv arbejdsopgave, venter på svar, møde/aftale, rutine, dokumentation, parkeret og lukket.\n- Foreslå kun én næste handling.\n- Store ting skal deles i trin på 3-10 minutter.\n- Markér afhængigheder som “venter på svar”.\n- Foreslå hvad der bør opdateres i Google Sheet “ChatGPT Arbejde-hukommelse”.\n\nAktuelle punkter:\n${active.map((item, index) => `${index + 1}. [${item.type} · ${item.urgency} · ${item.status}] ${item.text}`).join('\n')}\n\nSvarformat:\n1. Kort overblik\n2. Én konkret næste handling\n3. Hvad der bør synkroniseres til arket`;
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
    createdAt: new Date().toISOString()
  });

  textInput.value = '';
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
