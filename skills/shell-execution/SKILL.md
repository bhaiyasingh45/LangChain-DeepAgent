---
name: shell-execution
description: >
  Activate this skill when the user asks to run a terminal command, bash script,
  git operation, install packages (pip, npm, brew), or any other shell interaction.
  Provides safety guidelines for shell execution with user approval workflow.
license: MIT
compatibility: Requires LocalShellBackend with execute tool
metadata:
  author: ClaudeCode DeepAgent
  version: "1.0"
allowed-tools: execute
---

## Shell Execution Guidelines

### Before Running Any Command
1. Always explain what the command does and what its effect will be before requesting approval.
2. Show the exact command string in the permission request.
3. Never run commands that could cause data loss without an explicit backup plan.

### Destructive Command Rules
- `rm -rf`, `git reset --hard`, `git clean -fd`, `DROP TABLE` — require explicit user confirmation beyond the normal HITL approval.
- Always prefer dry-run flags first: `rm -n`, `git diff --name-only`, `rsync --dry-run`.

### Package Installation
- `pip install` → show package name, version, and source before installing.
- `npm install` → confirm `package.json` will be updated.
- `brew install` → confirm system-level change.

### Git Operations
- Before `git push`, show `git log --oneline origin/HEAD..HEAD` to confirm what will be pushed.
- Before `git reset`, show what commits will be lost.
- Prefer `git stash` over discarding changes.

### Error Handling
- If a command exits with non-zero status, show the full stderr output.
- Suggest the most likely fix based on the error message.
- Offer to run a diagnostic command if the error is ambiguous.

### Environment Variables
- Never print or log environment variables that contain secrets (API keys, passwords).
- Use `printenv | grep -v KEY` pattern if listing env vars.
