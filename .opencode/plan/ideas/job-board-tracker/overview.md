# Idea Incubator — Overview

## What It Is

A full-stack **idea management and planning platform** where users capture ideas,
plan them with structured markdown documents, track progress through a visual
pipeline, and collaborate with others.

Think: _Notion meets Trello meets a personal brainstorming assistant_.

## Who It's For

Individual creators, developers, and entrepreneurs who want to:

- Capture ideas quickly before they disappear
- Structure plans with markdown-backed sections (overview, tech stack, features, timeline, risks)
- Visualize their idea pipeline on a Kanban board
- Track tasks and milestones within each idea
- Collaborate by sharing ideas with others
- Never lose context with activity feeds and comments

## Core Concepts

### Ideas

The central entity. Each idea has a title, description, status, priority, tags,
and an auto-generated planning folder with structured markdown sections.

### Status Pipeline

Ideas flow through a defined pipeline:

```
Idea → Planning → Planned → In Progress → Done → Archived
```

### Planning Folders

Each idea gets a file-system planning folder with markdown sections:

```
storage/content/{userId}/{ideaId}/
  overview.md
  tech-stack.md
  features.md
  timeline.md
  risks.md          (created on demand)
```

Each file is generated with a **rich template** containing section headers, tables,
guidance comments, and placeholder examples — not a blank page. Users edit the
templates directly to fill in their project-specific planning. Templates mirror
the comprehensive planning structure needed for real projects (see
`planning-templates.md` for full content).

### Collaboration

Users can share ideas with others at different access levels (Owner / Edit / View).
Comments and notifications keep everyone in the loop.

## Key Screens

| Screen          | Purpose                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| **Auth**        | Login / Register with email or OAuth (GitHub, Google)                       |
| **Dashboard**   | Greeting, stats cards, recent activity, needs attention, in-progress ideas  |
| **Ideas List**  | Grid/list view of all ideas with search, filters, tags, sort                |
| **Create Idea** | Form to create a new idea with planning folder preview                      |
| **Idea Detail** | Full idea view with collapsible planning sections, tasks, comments, sharing |
| **Roadmap**     | Kanban board with drag-and-drop between status columns                      |
| **Shared**      | Ideas shared by other users                                                 |
| **Settings**    | Profile, theme, preferences                                                 |

## Design Principles

- **Markdown-first**: Planning sections are real `.md` files, not rich-text blobs
- **Keyboard-driven**: `/` to search, `n` to create, `Esc` to close modals, `Cmd+Enter` to save
- **Dark / Light**: Full theme support on every screen
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: WCAG 2.1 AA compliance target
