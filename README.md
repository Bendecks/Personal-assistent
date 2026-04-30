# Personal Assistent

A personal capture and sorting system for family life, planning, house tasks, reminders, and notes.

## Goal

The system should let me dump thoughts quickly without organizing them manually. Later, an AI processing step should classify the input and turn only useful action items into structured tasks.

Tiimo remains the execution system. This repository is the capture, sorting, and preparation layer.

## Core idea

```text
Raw input
  -> GitHub / API endpoint / Shortcuts later
  -> inbox
  -> AI classification
  -> structured output
  -> tasks for Tiimo
  -> notes/archive for everything else
```

## Design principles

- Capture must be fast.
- No manual sorting at input time.
- Not everything should become a task.
- Only concrete actions should be prepared for Tiimo.
- Notes, reflections, child observations, house thoughts, and loose ideas should be archived or summarized.
- Cleanup should be automatic.
- The system must later support both text and image input from iPhone Shortcuts.

## Planned input types

### v1

- Text braindumps stored as JSONL.

### Later

- Text input from iPhone Shortcuts.
- Image input from iPhone Shortcuts.
- Mixed text + image input.
- Voice-to-text via Shortcuts.

## Planned output types

- Tasks suitable for Tiimo.
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
├─ data/
│  ├─ inbox.jsonl
│  ├─ processed.jsonl
│  └─ archive.jsonl
├─ docs/
│  └─ shortcuts-input-plan.md
├─ prompts/
│  └─ classify-braindump.md
├─ src/
│  ├─ index.js
│  ├─ classify.js
│  ├─ storage.js
│  └─ cleanup.js
└─ .github/
   └─ workflows/
      └─ process-inbox.yml
```

## Current status

Planning / v1 skeleton.
