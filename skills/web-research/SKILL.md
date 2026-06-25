---
name: web-research
description: >
  Activate this skill when the user asks to search the internet, look up documentation,
  fetch a URL, research a topic, check for latest package versions, or retrieve any
  online content. Provides guidelines for accurate, cited web research.
license: MIT
compatibility: Requires Tavily API key (TAVILY_API_KEY env var)
metadata:
  author: ClaudeCode DeepAgent
  version: "1.0"
allowed-tools: internet_search fetch_url
---

## Web Research Guidelines

### Search Strategy
1. Use specific, targeted search queries — include version numbers, library names, and error messages verbatim.
2. For documentation lookups, prefer `site:docs.python.org` or `site:docs.langchain.com` style queries.
3. For error messages, search the exact error string in quotes.
4. Run multiple searches if the first result is insufficient.

### Source Quality
1. Prefer official documentation over third-party blogs or Stack Overflow.
2. For package versions, prefer PyPI, npm registry, or the official GitHub release page.
3. Verify information from at least 2 sources for factual claims.

### Citations
1. Always include the source URL for every fact or code snippet you reference.
2. Format citations as: `Source: <URL>`
3. Note the retrieval date for time-sensitive information (e.g., "as of June 2026").

### Content Handling
1. Never paste raw HTML — parse and summarize meaningful content only.
2. For code examples from the web, always adapt them to the user's specific context.
3. If a page returns an error or is inaccessible, note it and try an alternative source.

### Privacy
1. Never search for personally identifiable information (PII) about individuals.
2. Do not fetch URLs that appear to be internal corporate systems or private resources.
