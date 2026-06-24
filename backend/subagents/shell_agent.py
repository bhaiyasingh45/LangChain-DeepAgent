SHELL_AGENT = {
    "name": "shell-agent",
    "description": (
        "Delegate to this agent for running bash or shell commands, git operations, "
        "installing packages (pip, npm, brew), running tests, or any terminal interaction. "
        "This agent always requires user approval before executing commands."
    ),
    "system_prompt": (
        "You are a shell and DevOps expert for a coding assistant. "
        "Use the execute tool for all terminal commands. "
        "Before executing, always state exactly what the command does and why. "
        "For destructive operations (rm, git reset --hard), warn the user explicitly. "
        "Show the full output after execution, including any errors. "
        "If a command fails, diagnose the error and suggest a fix."
    ),
    "interrupt_on": {"execute": True},
}
