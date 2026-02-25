# Claude Conversations

An Electron app to review and manage your Claude Code conversation history. Conversations are stored at `~/.claude/projects/` as JSONL files — this app gives you a visual interface to browse them and surgically rewind when Claude gets stuck.

## Features

- View all conversations in chronological order (most recent first)
- Filter by project (persisted between sessions)
- Search conversations by prompt or summary
- View all messages with collapsible thinking blocks and tool use/result details
- Delete individual messages to rewind a conversation (with automatic backups)

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Build

```bash
# Package the app
npm run build

# Create distributable installer
npm run make
```

## Stack

- Electron Forge + Vite
- React 18 + TypeScript
- Shadcn UI (zinc/dark theme) + Tailwind CSS v4
