import fs from 'fs';

const eventPath = process.env.GITHUB_EVENT_PATH;
const inboxPath = './data/inbox.jsonl';
const decisionsPath = './data/decisions.jsonl';

if (!eventPath) {
  throw new Error('GITHUB_EVENT_PATH is missing');
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf-8'));
const issue = event.issue;

if (!issue) {
  console.log('No issue found in event');
  process.exit(0);
}

const title = issue.title || '';
const body = issue.body || '';
const text = body.trim() || title.trim();

if (!text) {
  console.log('No text to capture');
  process.exit(0);
}

const decisionMatch = text.match(/^(done|dismiss):\s*(.+)$/i) || title.match(/^(done|dismiss):\s*(.+)$/i);

if (decisionMatch) {
  const decision = {
    id: `decision-${issue.number}`,
    created_at: issue.created_at || new Date().toISOString(),
    source: 'github_issue_review_ui',
    action: decisionMatch[1].toLowerCase(),
    title: decisionMatch[2].trim(),
    issue_number: issue.number,
    issue_url: issue.html_url
  };

  fs.appendFileSync(decisionsPath, JSON.stringify(decision) + '\n');
  console.log(`Captured decision #${issue.number}: ${decision.action}`);
  process.exit(0);
}

const entry = {
  id: `issue-${issue.number}`,
  created_at: issue.created_at || new Date().toISOString(),
  source: 'github_issue_shortcut',
  type: 'text',
  issue_number: issue.number,
  issue_url: issue.html_url,
  text,
  processed: false
};

fs.appendFileSync(inboxPath, JSON.stringify(entry) + '\n');

console.log(`Captured issue #${issue.number} to inbox`);
