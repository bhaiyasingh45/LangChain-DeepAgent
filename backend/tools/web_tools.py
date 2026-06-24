import os
import httpx
from bs4 import BeautifulSoup


def internet_search(query: str, max_results: int = 5) -> dict:
    """Search the internet and return relevant results. Requires user approval."""
    api_key = os.environ.get("TAVILY_API_KEY", "")
    if not api_key:
        return {"error": "TAVILY_API_KEY not configured", "results": []}

    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=api_key)
        response = client.search(query, max_results=max_results)
        return {
            "query": query,
            "results": [
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "content": r.get("content", "")[:500],
                }
                for r in response.get("results", [])
            ],
        }
    except Exception as e:
        return {"error": str(e), "results": []}


def fetch_url(url: str) -> dict:
    """Fetch the text content of a URL. Requires user approval."""
    try:
        with httpx.Client(timeout=15, follow_redirects=True) as client:
            resp = client.get(url, headers={"User-Agent": "ClaudeCode-DeepAgent/1.0"})
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "")
            if "html" in content_type:
                soup = BeautifulSoup(resp.text, "html.parser")
                for tag in soup(["script", "style", "nav", "footer"]):
                    tag.decompose()
                text = soup.get_text(separator="\n", strip=True)
                return {"url": url, "content": text[:3000], "truncated": len(text) > 3000}
            return {"url": url, "content": resp.text[:3000], "truncated": len(resp.text) > 3000}
    except Exception as e:
        return {"url": url, "error": str(e), "content": ""}
