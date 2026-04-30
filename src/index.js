import fs from 'fs';
import { classify } from './classify.js';

const inboxPath = './data/inbox.jsonl';
const processedPath = './data/processed.jsonl';

const lines = fs.readFileSync(inboxPath, 'utf-8').split('\n').filter(Boolean);

for (const line of lines) {
  const entry = JSON.parse(line);

  if (entry.processed) continue;

  const result = await classify(entry.text);

  const output = {
    id: entry.id,
    created_at: entry.created_at,
    result
  };

  fs.appendFileSync(processedPath, JSON.stringify(output) + '\n');

  entry.processed = true;
}

fs.writeFileSync(inboxPath, lines.map(l => JSON.stringify(JSON.parse(l))).join('\n'));

console.log('Processing done');
