const MODULES = [
  {
    id: 'dashboard',
    label: 'Start',
    title: 'Start og næste handling',
    selectors: ['.hero'],
    heading: 'Næste handling'
  },
  {
    id: 'inbox',
    label: 'Indbakke',
    title: 'Hurtig indbakke',
    selectors: ['.quick-capture']
  },
  {
    id: 'screenshots',
    label: 'Screenshots',
    title: 'Screenshot-import',
    heading: 'Screenshot-import'
  },
  {
    id: 'documents',
    label: 'Dokumenter',
    title: 'Dokument-import',
    heading: 'Dokument-import'
  },
  {
    id: 'sensum',
    label: 'Sensum',
    title: 'Klargjorte Sensum-notater',
    heading: 'Sensum-notater'
  },
  {
    id: 'memory',
    label: 'Hukommelse',
    title: 'Lokal dokumentationshukommelse',
    heading: 'Hukommelse'
  },
  {
    id: 'overview',
    label: 'Overblik',
    title: 'Arbejdsoverblik',
    heading: 'Arbejdsoverblik'
  },
  {
    id: 'ai',
    label: 'AI/ark',
    title: 'AI og arbejdshukommelse',
    selectors: ['.grid:last-of-type']
  }
];

const style = document.createElement('style');
style.textContent = `
.main-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 18px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: rgba(255, 250, 243, 0.96);
  box-shadow: 0 10px 30px rgba(54, 43, 31, 0.08);
  backdrop-filter: blur(8px);
}

.main-nav button {
  flex: 1 1 120px;
  min-width: fit-content;
  background: #ebe2d6;
  color: var(--text);
  padding: 0.72rem 0.85rem;
}

.main-nav button.active {
  background: var(--accent);
  color: white;
}

.module-header {
  margin: 0 0 14px;
  padding: 0 4px;
}

.module-header h2 {
  margin: 0;
  font-size: 1.15rem;
}

.module-view-hidden {
  display: none !important;
}

@media (max-width: 820px) {
  .main-nav {
    overflow-x: auto;
    flex-wrap: nowrap;
    border-radius: 18px;
  }

  .main-nav button {
    flex: 0 0 auto;
  }
}
`;
document.head.appendChild(style);

function findSectionByHeading(text) {
  const headings = [...document.querySelectorAll('h2')];
  const heading = headings.find((entry) => entry.textContent.trim() === text);
  return heading?.closest('section, .grid') || null;
}

function resolveModuleElements(module) {
  const elements = [];

  if (module.heading) {
    const section = findSectionByHeading(module.heading);
    if (section) elements.push(section);
  }

  for (const selector of module.selectors || []) {
    const element = document.querySelector(selector);
    if (element) elements.push(element);
  }

  return [...new Set(elements)];
}

function setupNavigation() {
  const shell = document.querySelector('.app-shell');
  if (!shell) return;

  const nav = document.createElement('nav');
  nav.className = 'main-nav';
  nav.setAttribute('aria-label', 'Hovednavigation');

  const moduleHeader = document.createElement('div');
  moduleHeader.className = 'module-header';

  const resolvedModules = MODULES.map((module) => ({
    ...module,
    elements: resolveModuleElements(module)
  })).filter((module) => module.elements.length);

  for (const module of resolvedModules) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.module = module.id;
    button.textContent = module.label;
    button.addEventListener('click', () => activateModule(module.id));
    nav.appendChild(button);
  }

  const hero = document.querySelector('.hero');
  hero?.after(nav, moduleHeader);

  function activateModule(moduleId) {
    const activeModule = resolvedModules.find((module) => module.id === moduleId) || resolvedModules[0];
    const activeSet = new Set(activeModule.elements);

    for (const module of resolvedModules) {
      for (const element of module.elements) {
        element.classList.toggle('module-view-hidden', !activeSet.has(element));
      }
    }

    for (const button of nav.querySelectorAll('button')) {
      button.classList.toggle('active', button.dataset.module === activeModule.id);
    }

    moduleHeader.innerHTML = `<h2>${activeModule.title}</h2>`;
    localStorage.setItem('arbejdscentral.activeModule.v1', activeModule.id);
  }

  const savedModule = localStorage.getItem('arbejdscentral.activeModule.v1');
  activateModule(resolvedModules.some((module) => module.id === savedModule) ? savedModule : 'dashboard');
}

setupNavigation();
