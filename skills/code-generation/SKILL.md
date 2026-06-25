---
name: code-generation
description: >
  Activate this skill when the user asks to write new code, refactor existing code,
  explain how code works, review code for bugs or improvements, generate tests,
  or convert code between languages or frameworks.
license: MIT
compatibility: Works with any model; no special tools required
metadata:
  author: ClaudeCode DeepAgent
  version: "1.0"
allowed-tools: read_file
---

## Code Generation Guidelines

### Before Writing Code
1. Read relevant existing files first to understand the project's patterns, naming conventions, and style.
2. Check for existing utilities or helpers that can be reused — avoid reinventing the wheel.
3. Confirm the target language, framework version, and any constraints.

### Code Quality Standards
1. Write clean, self-documenting code with clear variable and function names.
2. Add comments only when the WHY is non-obvious — avoid explaining WHAT the code does.
3. Follow the existing code style of the project (indentation, quote style, etc.).
4. Do not add features, abstractions, or error handling beyond what is explicitly requested.

### Security
1. Never generate code with SQL injection, XSS, command injection, or other OWASP Top 10 vulnerabilities.
2. Validate all user inputs at system boundaries.
3. Do not hardcode secrets, API keys, or credentials in generated code.
4. Use parameterized queries for all database interactions.

### Code Review
When reviewing code:
1. Focus on correctness bugs, security issues, and significant performance problems.
2. Call out potential null/undefined errors, off-by-one errors, and race conditions.
3. Suggest simplifications where 3+ similar lines could be a loop or helper.
4. Do not nitpick style unless it causes a real problem.

### Test Generation
1. Cover the happy path and at least 2 edge cases.
2. Use the testing framework already present in the project.
3. Write tests that verify behavior, not implementation details.

### Refactoring
1. Preserve existing behavior — do not change what the code does, only how it does it.
2. Make one logical change per refactor; don't bundle unrelated cleanups.
3. After refactoring, explain what changed and why.
