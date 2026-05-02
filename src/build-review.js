import fs from 'fs';

const processedPath = './data/processed.jsonl';
const reviewPath = './data/review.md';

function readJsonl(path) {
  if (!fs.existsSync(path)) return [];
  const raw = fs.readFileSync(path, 'utf-8').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => JSON.parse(line));
}

function scoreTask(task) {
  let score = 0;

  if (task.priority === 'high') score += 3;
  if (task.priority === 'normal') score += 2;
  if (task.priority === 'low') score += 1;

  if (task.due_hint === 'today') score += 3;
  if (task.due_hint === 'soon') score += 2;

  if (task.area === 'family') score += 2;
  if (task.area === 'health') score += 2;

  return score;
}

const entries = readJsonl(processedPath);

const tasks = [];
const notes = [];

for (const entry of entries) {
  const result = entry.result || {};

  for (const task of result.tasks || []) {
    if (task.tiimo_candidate === false) continue;

    const enriched = {
      title: task.title,
      area: task.area || 'unknown',
      priority: task.priority || 'normal',
      due_hint: task.due_hint || null
    };

    enriched.score = scoreTask(enriched);
    tasks.push(enriched);
  }

  for (const note of result.notes || []) {
    if (note.keep === false) continue;
    notes.push({
      text: note.text,
      area: note.area || 'unknown'
    });
  }
}

// Sort by score descending
tasks.sort((a, b) => b.score - a.score);

const now = new Date().toISOString();

const lines = [];
lines.push('# Personal Assistent Review');
lines.push('');
lines.push(`Updated: ${now}`);
lines.push('');

lines.push('## 🔥 Do Today');
lines.push('');

const todayTasks = tasks.filter(t => t.score >= 5).slice(0, 10);

if (todayTasks.length === 0) {
  lines.push('No urgent tasks.');
} else {
  for (const task of todayTasks) {
    lines.push(`- [ ] ${task.title} | ${task.area} | score:${task.score}`);
  }
}

lines.push('');
lines.push('## 🟡 Next Up');
lines.push('');

const nextTasks = tasks.filter(t => t.score >= 3 && t.score < 5).slice(0, 15);

if (nextTasks.length === 0) {
  lines.push('No medium tasks.');
} else {
  for (const task of nextTasks) {
    lines.push(`- [ ] ${task.title} | ${task.area} | score:${task.score}`);
  }
}

lines.push('');
lines.push('## ⚪ Low Priority');
lines.push('');

const lowTasks = tasks.filter(t => t.score < 3).slice(0, 20);

if (lowTasks.length === 0) {
  lines.push('No low priority tasks.');
} else {
  for (const task of lowTasks) {
    lines.push(`- [ ] ${task.title} | ${task.area}`);
  }
}

lines.push('');
lines.push('## Notes');
lines.push('');

if (notes.length === 0) {
  lines.push('No notes.');
} else {
  for (const note of notes.slice(-20)) {
    lines.push(`- ${note.text} | ${note.area}`);
  }
}

fs.writeFileSync(reviewPath, lines.join('\n') + '\n');

console.log(`Review built with prioritization.`);
