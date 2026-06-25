---
name: file-operations
description: >
  Activate this skill when the user asks to read, write, edit, delete, list,
  search, or navigate files and directories in the project. Provides best
  practices for safe file manipulation and content search.
license: MIT
compatibility: Requires LocalShellBackend or FilesystemBackend
metadata:
  author: ClaudeCode DeepAgent
  version: "1.0"
allowed-tools: ls read_file write_file edit_file glob grep delete_file
---

## File Operations Guidelines

### Reading Files
1. Before reading a file, use `ls` or `glob` to confirm it exists.
2. For large files, use `read_file` with `offset` and `limit` to read in chunks.
3. Use `grep` to search for specific patterns before reading the full file.

### Writing and Editing Files
1. Always read the file first before editing to understand the current content.
2. Use `edit_file` (old_string → new_string) for targeted edits — prefer it over full `write_file`.
3. Make the `old_string` unique enough to avoid accidental multi-match edits.
4. After writing or editing, confirm success by reading the affected section.

### Searching
1. Use `glob` to find files by pattern (e.g., `**/*.py`, `src/**/*.tsx`).
2. Use `grep` to search file contents by regex across the project.
3. Combine glob + grep for targeted content searches.

### Safety Rules
1. Never delete a file without confirming the path with the user.
2. Write operations on files outside the workspace directory require explicit user approval.
3. Always show what will be written/changed before doing it.
