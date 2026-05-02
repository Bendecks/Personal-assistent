import fs from 'fs';

const processedPath = './data/processed.jsonl';
const reviewPath = './data/review.md';

function readJsonl(path) {
  if (!fs.existsSync(path)) return [];
  const raw = fs.readFileSync(path, 'utf-8').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => JSON.parse(line));
}

const entries = readJsonl(processedPath);

const tasks = [];
const notes = [];

for (const entry of entries) {
  const result = entry.result || {};

  for (const task of result.tasks || []) {
    if (task.tiimo_candidate === false) continue;
    tasks.push({
      id: entry.id,
      created_at: entry.created_at,
      title: task.title,
      area: task.area || 'unknown',
      type: task.type || 'task',
      priority: task.priority || 'normal',
      person: task.person || null,
      due_hint: task.due_hint || null
    });
  }

  for (const note of result.notes || []) {
    if (note.keep === false) continue;
    notes.push({
      id: entry.id,
      created_at: entry.created_at,
      text: note.text,
      area: note.area || 'unknown',
      person: note.person || null
    });
  }
}

const now = new Date().toISOString();

const lines = [];
lines.push('# Personal Assistent Review');
lines.push('');
lines.push(`Updated: ${now}`);
lines.push('');
lines.push('## Tiimo candidates');
lines.push('');

if (tasks.length === 0) {
  lines.push('No current Tiimo candidates.');
} else {
  for (const task of tasks.slice(-50)) {
    const parts = [];
    parts.push(`- [ ] ${task.title}`);
    parts.push(`area: ${task.area}`);
    parts.push(`type: ${task.type}`);
    parts.push(`priority: ${task.priority}`);
    if (task.person) parts.push(`person: ${task.person}`);
    if (task.due_hint) parts.push(`due: ${task.due_hint}`);
    lines.push(parts.join(' | '));
  }
}

lines.push('');
lines.push('## Notes to keep');
lines.push('');

if (notes.length === 0) {
  lines.push('No current notes.');
} else {
  for (const note of notes.slice(-50)) {
    const parts = [];
    parts.push(`- ${note.text}`);
    parts.push(`area: ${note.area}`);
    if (note.person) parts.push(`person: ${note.person}`);
    lines.push(parts.join(' | '));
  }
}

fs.writeFileSync(reviewPath, lines.join('\n') + '\n');

console.log(`Review built with ${tasks.length} tasks and ${notes.length} notes.`);
