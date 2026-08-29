/**
 * Zorvik AI Real-Time Web Grounding & Live URL Fetcher Engine
 * Automatically crawls and fetches live website content and search results
 * to inject into LLM context across all cascade providers (Gemini, Groq, Cerebras, Mistral, OpenRouter).
 */

/**
 * Extract clean domain name from URL
 */
function extractDomain(url) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

/**
 * Extract URLs and domains from text
 */
function extractUrlsAndDomains(text) {
  if (!text || typeof text !== "string") return [];

  // Match full URLs: http:// or https://
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const fullUrls = text.match(urlRegex) || [];

  // Match standalone domains like zorviktech.com, api.zorvik.tech, etc.
  const domainRegex = /\b([a-zA-Z0-9-]+\.(?:com|tech|org|net|io|ai|dev|co|in|app|xyz|me)(?:\/[^\s]*)?)\b/gi;
  const domainMatches = text.match(domainRegex) || [];

  const allUrls = [...fullUrls];
  for (const domain of domainMatches) {
    const formatted = domain.startsWith("http") ? domain : `https://${domain}`;
    if (!allUrls.includes(formatted)) {
      allUrls.push(formatted);
    }
  }

  return [...new Set(allUrls)];
}

/**
 * Strip HTML tags, scripts, styles, and extra whitespace
 */
function sanitizeHtmlToText(html) {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch live content from a URL with timeout and fallback to Jina Reader
 */
async function fetchLiveUrl(targetUrl) {
  const normalizedUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
  const domain = extractDomain(normalizedUrl);

  // 1. Direct fetch with browser headers
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();
      const cleanText = sanitizeHtmlToText(html);
      if (cleanText.length > 50) {
        return {
          title: `${domain} Live Webpage`,
          url: normalizedUrl,
          domain,
          content: cleanText.slice(0, 3500),
        };
      }
    }
  } catch (_err) {
    // Fallback to Jina Reader proxy for JS-heavy SPAs
  }

  // 2. Fallback to Jina AI Reader
  try {
    const jinaUrl = `https://r.jina.ai/${normalizedUrl}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: { Accept: "text/plain" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      return {
        title: `${domain} Reader`,
        url: normalizedUrl,
        domain,
        content: text.slice(0, 3500),
      };
    }
  } catch (_e) {
    // Ignore fetch error
  }

  return null;
}

/**
 * Live search via DuckDuckGo HTML / Instant API
 */
async function searchWeb(query) {
  const encoded = encodeURIComponent(query);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const html = await res.text();
    const results = [];

    // Extract search snippets from HTML
    const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
    const titleRegex = /<a class="result__url[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

    let match;
    const snippets = [];
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 4) {
      snippets.push(sanitizeHtmlToText(match[1]));
    }

    const urls = [];
    while ((match = titleRegex.exec(html)) !== null && urls.length < 4) {
      let rawUrl = match[1];
      if (rawUrl.includes("uddg=")) {
        try {
          const matchUddg = rawUrl.match(/uddg=([^&]+)/);
          if (matchUddg) rawUrl = decodeURIComponent(matchUddg[1]);
        } catch {
          // Ignore
        }
      }
      urls.push(rawUrl);
    }

    for (let i = 0; i < Math.min(snippets.length, urls.length, 3); i++) {
      const u = urls[i];
      results.push({
        id: `search_${i + 1}`,
        title: query,
        url: u,
        domain: extractDomain(u),
        content: snippets[i],
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Universal Grounding Pipeline
 * Analyzes prompt for URLs and search intent, extracts live web content,
 * and formats enriched context.
 */
async function groundPrompt({ prompt, mode = "auto" }) {
  const urls = extractUrlsAndDomains(prompt);
  const isSearchMode =
    mode === "search" ||
    /\b(check|review|audit|browse|scrape|latest|current|recent|news|today|price of|score|weather|who won|release date)\b/i.test(
      prompt
    );

  const sources = [];
  const webContextParts = [];

  // 1. If explicit URLs/domains were found in the prompt, fetch them immediately
  if (urls.length > 0) {
    for (const u of urls.slice(0, 2)) {
      const fetched = await fetchLiveUrl(u);
      if (fetched && fetched.content) {
        sources.push({
          id: `src_${sources.length + 1}`,
          title: fetched.title,
          url: fetched.url,
          domain: fetched.domain,
        });
        webContextParts.push(
          `[LIVE WEBPAGE CONTENT FROM: ${fetched.url}]\n${fetched.content}`
        );
      }
    }
  }

  // 2. If search mode or no explicit URL fetched, do a web search
  if (isSearchMode && webContextParts.length === 0) {
    const cleanQuery = prompt
      .replace(/\b(check|review|audit|browse|scrape|what is|search for|tell me about)\b/gi, "")
      .trim();
    const searchResults = await searchWeb(cleanQuery || prompt);
    for (const item of searchResults) {
      sources.push({
        id: `src_${sources.length + 1}`,
        title: item.title,
        url: item.url,
        domain: item.domain,
      });
      webContextParts.push(
        `[WEB SEARCH RESULT FROM: ${item.url} (${item.domain})]\n${item.content}`
      );
    }
  }

  let enrichedContext = "";
  if (webContextParts.length > 0) {
    enrichedContext = `REAL-TIME LIVE WEB GROUNDING (USE THIS CURRENT DATA TO DIRECTLY ANSWER THE USER'S REQUEST):\n\n${webContextParts.join(
      "\n\n---\n\n"
    )}`;
  }

  return {
    hasGrounding: webContextParts.length > 0,
    enrichedContext,
    sources,
  };
}

module.exports = {
  groundPrompt,
  fetchLiveUrl,
  searchWeb,
  extractUrlsAndDomains,
  extractDomain,
};
