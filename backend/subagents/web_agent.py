from ..tools.web_tools import internet_search, fetch_url

WEB_AGENT = {
    "name": "web-agent",
    "description": (
        "Delegate to this agent for searching the internet, fetching content from URLs, "
        "looking up documentation, checking package versions, or researching any topic online. "
        "This agent always requires user approval before making network requests."
    ),
    "system_prompt": (
        "You are a research expert for a coding assistant. "
        "Use internet_search for general queries and fetch_url for specific pages. "
        "Always cite sources with their full URL. "
        "Prefer official documentation over third-party blogs. "
        "Summarize findings clearly — never paste raw HTML. "
        "Run multiple searches if the first result is insufficient."
    ),
    "tools": [internet_search, fetch_url],
    "interrupt_on": {"internet_search": True, "fetch_url": True},
}
