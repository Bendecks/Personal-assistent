import fs from 'fs';
import { classify } from './classify.js';

const inboxPath = './data/inbox.jsonl';
const processedPath = './data/processed.jsonl';

const raw = fs.readFileSync(inboxPath, 'utf-8').trim();

if (!raw) {
  console.log('Inbox is empty');
  process.exit(0);
}

const entries = raw
  .split('\n')
  .filter(Boolean)
  .map(line => JSON.parse(line));

let processedCount = 0;

for (const entry of entries) {
  if (entry.processed) continue;

  const result = await classify(entry.text || '');

  const output = {
    id: entry.id,
    created_at: entry.created_at,
    source: entry.source || 'manual',
    type: entry.type || 'text',
    result
  };

  fs.appendFileSync(processedPath, JSON.stringify(output) + '\n');

  entry.processed = true;
  entry.processed_at = new Date().toISOString();
  processedCount++;
}

fs.writeFileSync(
  inboxPath,
  entries.map(entry => JSON.stringify(entry)).join('\n') + '\n'
);

console.log(`Processing done. Processed ${processedCount} entr${processedCount === 1 ? 'y' : 'ies'}.`);
