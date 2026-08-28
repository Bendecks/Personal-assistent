# Personal Assistent

A personal capture and sorting system for family life, planning, house tasks, reminders, notes, and now a first work-focused web interface.

## Current status

- Existing Node scripts: capture, AI classification, cleanup, and review generation.
- New webapp: `index.html` + `src/web/*`.
- The webapp is currently static and stores data locally in the browser.
- Google Sheet `ChatGPT Arbejde-hukommelse` remains the work truth source until direct sync is added.

## Work AI central

The first webapp version is designed as a calm practical work dashboard.

It supports:

- quick capture of loose work notes
- separation of task types:
  - active work task
  - waiting for reply
  - meeting/agreement
  - routine
  - documentation
  - parked
  - closed
- one suggested next action
- visible shift-start checklist
- AI-ready prompt generation for ChatGPT
- direct link to the work memory Google Sheet

See: [`docs/work-ai-central.md`](docs/work-ai-central.md)

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL.

## Build

```bash
npm run build
```

## Original goal

The system should let me dump thoughts quickly without organizing them manually. Later, an AI processing step should classify the input and turn only useful action items into structured tasks.

Tiimo remains the execution system for personal routines. This repository is the capture, sorting, and preparation layer.

## Core idea

```text
Raw input
  -> GitHub / API endpoint / Shortcuts later
  -> inbox
  -> AI classification
  -> structured output
  -> tasks for Tiimo / work memory / reminders
  -> notes/archive for everything else
```

## Design principles

- Capture must be fast.
- No manual sorting at input time.
- Not everything should become a task.
- Only concrete actions should be prepared as tasks.
- Notes, reflections, child observations, house thoughts, and loose ideas should be archived or summarized.
- Cleanup should be automatic.
- The system must later support both text and image input from iPhone Shortcuts.
- For work use, the next concrete action is more important than a perfect system.

## Planned input types

### v1

- Text braindumps stored as JSONL.
- Browser-based work notes stored in `localStorage`.

### Later

- Text input from iPhone Shortcuts.
- Image input from iPhone Shortcuts.
- Mixed text + image input.
- Voice-to-text via Shortcuts.
- Google Sheets sync for work memory.

## Planned output types

- Tasks suitable for Tiimo.
- Work memory updates.
- Reminders.
- Shopping items.
- Calendar candidates.
- Family notes.
- House/project notes.
- Work notes.
- Archive entries.
- Weekly summary.

## Folder structure

```text
.
├─ index.html
├─ data/
│  ├─ inbox.jsonl
│  ├─ processed.jsonl
│  └─ archive.jsonl
├─ docs/
│  ├─ shortcuts-input-plan.md
│  └─ work-ai-central.md
├─ prompts/
│  └─ classify-braindump.md
├─ src/
│  ├─ web/
│  │  ├─ app.js
│  │  └─ styles.css
│  ├─ index.js
│  ├─ classify.js
│  ├─ storage.js
│  └─ cleanup.js
└─ .github/
   └─ workflows/
      └─ process-inbox.yml
```
