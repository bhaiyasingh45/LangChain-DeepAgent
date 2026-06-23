"use client";

export const SLASH_COMMANDS = [
  { command: "/clear",       description: "Clear chat history and start a new session" },
  { command: "/compact",     description: "Summarize conversation to reduce context" },
  { command: "/cost",        description: "Show token usage and estimated cost" },
  { command: "/help",        description: "Show all commands and available tools" },
  { command: "/permissions", description: "View and revoke session-level permissions" },
  { command: "/agent",       description: "List active agents in the current graph" },
  { command: "/tools",       description: "List all tools available to the agent" },
];

export function useSlashCommands(inputValue: string) {
  const isSlash = inputValue.startsWith("/") && !inputValue.includes(" ");
  const suggestions = isSlash
    ? SLASH_COMMANDS.filter((c) => c.command.startsWith(inputValue))
    : [];
  const isExactCommand = SLASH_COMMANDS.some((c) => c.command === inputValue.trim());
  return { isSlash, suggestions, isExactCommand };
}
