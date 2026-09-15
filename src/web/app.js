const todayLabel = document.querySelector('#todayLabel');
const focusCount = document.querySelector('#focusCount');
const nextAction = document.querySelector('#nextAction');
const taskList = document.querySelector('#taskList');

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderReadOnlyShell() {
  const formatter = new Intl.DateTimeFormat('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  if (todayLabel) todayLabel.textContent = formatter.format(new Date());
  if (focusCount) focusCount.textContent = 'Kun overblik';

  if (nextAction) {
    nextAction.className = 'next-action';
    nextAction.innerHTML = `
      <strong>Læsning · Google Sheet</strong>
      <div>${escapeHtml('Synkronisér Sensum-kladden og brug ChatGPT til nye input.')}</div>
    `;
  }

  if (taskList) {
    taskList.innerHTML = `
      <article class="task-card" data-urgency="normal">
        <div>
          <div class="task-meta">
            <span class="pill">overblik</span>
            <span class="pill">read-only</span>
          </div>
          <div class="task-text">Arbejdsoverblik skal komme fra ChatGPT og Google Sheet, ikke fra manuel indtastning i webappen.</div>
          <div class="task-note">Næste tekniske trin: udvide API'et, så webappen også kan læse aktive opgaver og ventepunkter fra arket.</div>
        </div>
      </article>
    `;
  }
}

renderReadOnlyShell();
