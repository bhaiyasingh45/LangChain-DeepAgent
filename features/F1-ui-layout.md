# F1 — Claude Code-Identical UI Layout

**Status:** `implemented`
**Feature ID:** F1
**Owner:** —

---

## Objective

Build a pixel-accurate clone of the Claude Code CLI UI as a web application. Every structural element, color, font, and spacing must match Claude Code's dark monospace aesthetic.

---

## Scope

| Element | Description |
|---|---|
| Dark background | `#0d0d0d` body, `#161616` sidebar/panels |
| Monospace font | Menlo → Monaco → Courier New → monospace fallback |
| Top bar (`h-12`) | Project name, model selector, settings icon, token/cost counter |
| Left sidebar (`w-64`) | Collapsible file tree, icons, active highlight, git status badges, new file/folder buttons |
| Main chat area (`flex-1`) | Full-height scrollable chat window (see F2) |
| Bottom input bar | Multi-line textarea, send button, file attach button, slash-command autocomplete |
| Bottom status bar (`h-7`) | CWD path, active agent name, model name, streaming indicator dot |

---

## Implementation Plan

1. Scaffold `frontend/` with `npx create-next-app@14 --typescript --tailwind --app`
2. Define `cc.*` color tokens and `font-mono` in `tailwind.config.ts`
3. Create root layout: `<body class="bg-cc-bg text-cc-text font-mono h-screen flex flex-col">`
4. Build `TopBar.tsx` — flex row, amber accent on project name, model pill selector
5. Build `Sidebar.tsx` — `w-64 bg-cc-surface border-r border-cc-border`, recursive `FileNode` tree component, collapse toggle
6. Build `StatusBar.tsx` — `h-7 bg-cc-surface border-t border-cc-border`, fixed bottom bar with live streaming dot
7. Build `InputBar.tsx` — `bg-cc-surface border-t border-cc-border`, auto-resize textarea, send/attach buttons
8. Wire layout in `app/page.tsx`: TopBar → (Sidebar + ChatWindow) → StatusBar + InputBar

---

## Files Created / Modified

- `frontend/tailwind.config.ts`
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/components/layout/TopBar.tsx`
- `frontend/components/layout/Sidebar.tsx`
- `frontend/components/layout/StatusBar.tsx`
- `frontend/components/chat/InputBar.tsx`

---

## Color Palette Reference

```
cc-bg:       #0d0d0d   body background
cc-surface:  #161616   sidebar, panels, input bg
cc-elevated: #1e1e1e   cards, tool blocks
cc-border:   #2a2a2a   dividers
cc-muted:    #3d3d3d   inactive items
cc-text:     #e8e8e8   primary text
cc-dim:      #888888   timestamps, secondary text
cc-amber:    #D4A853   accent, active file, project name
cc-green:    #4ade80   done / success
cc-red:      #f87171   error / deny
cc-blue:     #60a5fa   thinking label / links
cc-yellow:   #facc15   pending badge
cc-purple:   #c084fc   tool name label
```

---

## Test Checklist

- [ ] Body background is `#0d0d0d` — no white flash on load
- [ ] All text renders in monospace font
- [ ] Sidebar is `256px` wide, collapsible with chevron toggle
- [ ] Top bar shows project name in amber, model selector pill
- [ ] Status bar is pinned to bottom, `28px` tall
- [ ] Input bar textarea auto-resizes up to 6 lines, then scrolls
- [ ] File tree shows folder/file icons, highlights active file in amber
- [ ] Layout is responsive — no horizontal scroll at 1280px+ viewport
