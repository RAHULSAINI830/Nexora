import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_HTML_BYTES = 5_000_000;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 4;

const CRAWLERS = {
  GPTBot: "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
  "ChatGPT-User": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
  "OAI-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  PerplexityBot: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://www.perplexity.ai/bot)",
  ClaudeBot: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://www.anthropic.com)",
  "Google-Extended": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
};

const CONTENT_CRAWLERS = {
  "ChatGPT-User": CRAWLERS["ChatGPT-User"],
  "OAI-SearchBot": CRAWLERS["OAI-SearchBot"],
  PerplexityCrawler: CRAWLERS.PerplexityBot,
  GoogleBot: CRAWLERS["Google-Extended"]
};

function isPrivateIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168);
}

function isPrivateAddress(address) {
  if (isIP(address) === 4) return isPrivateIpv4(address);
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) return isPrivateIpv4(normalized.slice(7));
  return normalized === "::" || normalized === "::1" || normalized.startsWith("fc")
    || normalized.startsWith("fd") || normalized.startsWith("fe8")
    || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
}

async function assertPublicUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs can be audited.");
  if (["localhost", "localhost.localdomain"].includes(url.hostname.toLowerCase())) throw new Error("Private or local URLs cannot be audited.");
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private or local network targets cannot be audited.");
  }
  return url;
}

async function readLimitedBody(response, maxBytes) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) throw new Error("The target page is too large to audit safely.");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("The target page is too large to audit safely.");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function fetchPublicPage(rawUrl, { headers = {}, maxBytes = MAX_HTML_BYTES, readBody = true } = {}, redirectCount = 0) {
  const url = await assertPublicUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { headers, redirect: "manual", signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The target page took too long to respond.");
    throw new Error(`The target page could not be reached: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
  if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
    if (redirectCount >= MAX_REDIRECTS) throw new Error("The target page redirects too many times.");
    const nextUrl = new URL(response.headers.get("location"), url);
    return fetchPublicPage(nextUrl.toString(), { headers, maxBytes, readBody }, redirectCount + 1);
  }
  if (!readBody && response.body) await response.body.cancel();
  return {
    body: readBody ? await readLimitedBody(response, maxBytes) : "",
    headers: Object.fromEntries(response.headers.entries()),
    ok: response.ok,
    status: response.status,
    url: url.toString()
  };
}

function robotsRulesFor(robotsText, crawler) {
  const groups = [];
  let agents = [];
  let rules = [];
  const flush = () => {
    if (agents.length) groups.push({ agents, rules });
    agents = [];
    rules = [];
  };
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (rules.length) flush();
      agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && agents.length) {
      rules.push({ type: key, path: value });
    }
  }
  flush();
  const crawlerKey = crawler.toLowerCase();
  const exact = groups.filter((group) => group.agents.some((agent) => crawlerKey.includes(agent) || agent === crawlerKey));
  return (exact.length ? exact : groups.filter((group) => group.agents.includes("*"))).flatMap((group) => group.rules);
}

function robotsAllows(robotsText, crawler, pathname) {
  const matches = robotsRulesFor(robotsText, crawler)
    .filter((rule) => rule.path && pathname.startsWith(rule.path.replace(/\*.*$/, "")))
    .sort((a, b) => b.path.length - a.path.length || (a.type === "allow" ? -1 : 1));
  return !matches.length || matches[0].type === "allow";
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreContent(html, response) {
  const text = stripHtml(html);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const title = /<title[^>]*>\s*[^<]{3,}\s*<\/title>/i.test(html);
  const description = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(html)
    || /<meta[^>]+content=["'][^"']{20,}["'][^>]+name=["']description["']/i.test(html);
  const openGraph = /<meta[^>]+property=["']og:/i.test(html);
  const structuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const language = /<html[^>]+lang=["'][^"']+/i.test(html);
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const h1Count = countMatches(html, /<h1\b/gi);
  const h2Count = countMatches(html, /<h2\b/gi);
  const listCount = countMatches(html, /<(ul|ol)\b/gi);
  const semanticCount = countMatches(html, /<(main|article|section|nav|aside|header|footer)\b/gi);
  const paragraphCount = countMatches(html, /<p\b/gi);
  const imageCount = countMatches(html, /<img\b/gi);
  const imageAltCount = countMatches(html, /<img[^>]+alt=["'][^"']+["']/gi);
  const metadataScore = (title ? 30 : 0) + (description ? 30 : 0) + (openGraph ? 15 : 0) + (structuredData ? 25 : 0);
  const technicalScore = (response.ok ? 40 : 0) + (language ? 20 : 0) + (canonical ? 20 : 0) + (/viewport/i.test(html) ? 20 : 0);
  const structureScore = Math.min(100, (h1Count === 1 ? 25 : 0) + Math.min(25, h2Count * 5) + Math.min(20, listCount * 5) + Math.min(20, semanticCount * 3) + Math.min(10, paragraphCount));
  const contentScore = Math.min(100, Math.round((Math.min(1, wordCount / 1000) * 65) + (paragraphCount >= 3 ? 20 : 0) + (imageCount ? Math.min(15, (imageAltCount / imageCount) * 15) : 15)));
  const scriptCount = countMatches(html, /<script\b/gi);
  const dynamicPenalty = Math.min(70, scriptCount * 2) + (wordCount < 150 ? 25 : 0);
  const dynamicScore = Math.max(0, 100 - dynamicPenalty);
  const overallScore = Math.round((metadataScore + technicalScore + structureScore + contentScore) / 4);
  return {
    aiReadinessStats: { overallScore, wordCount, paragraphCount },
    dynamicContent: {
      score: dynamicScore,
      differenceDescription: dynamicScore >= 70 ? "Most meaningful page content is present in the initial HTML." : "The page relies heavily on scripts or exposes limited text in its initial HTML."
    },
    structuralAnalysis: {
      overallScore,
      categoryScores: { metadata: metadataScore, technical: technicalScore, structure: structureScore, content: contentScore },
      metadata: { titleTag: title, metaDescription: description, openGraphTags: openGraph, structuredData },
      technical: { httpStatus: response.status, languageDeclaration: language, canonicalTag: canonical },
      structure: { h1Count, h2Count, listCount, semanticElementCount: semanticCount },
      content: { wordCount, paragraphCount, imageCount, imagesWithAltText: imageAltCount }
    }
  };
}

export async function runCrawlabilityAudit(rawUrl, workspaceId) {
  const target = await assertPublicUrl(rawUrl);
  const robotsUrl = new URL("/robots.txt", target.origin).toString();
  const [robotsResponse, ...botResponses] = await Promise.all([
    fetchPublicPage(robotsUrl, { headers: { "User-Agent": CRAWLERS.GPTBot }, maxBytes: 500_000 }).catch(() => null),
    ...Object.entries(CRAWLERS).map(async ([name, userAgent]) => {
      try {
        const response = await fetchPublicPage(target.toString(), { headers: { "User-Agent": userAgent }, readBody: false });
        return [name, { userAgent, status: response.status, ok: response.ok }];
      } catch (error) {
        return [name, { userAgent, status: 0, ok: false, error: error.message }];
      }
    })
  ]);
  const robotsText = robotsResponse?.ok ? robotsResponse.body : "";
  const robotsTxtAnalysis = Object.fromEntries(Object.keys(CRAWLERS).map((name) => [name, robotsText ? robotsAllows(robotsText, name, target.pathname) : true]));
  const serverBotAccess = Object.fromEntries(botResponses);
  const createdDate = new Date().toISOString();
  return {
    id: randomUUID(),
    workspaceId,
    url: target.toString(),
    domain: target.hostname,
    source: "cortexy",
    status: "completed",
    createdDate,
    completedDate: createdDate,
    robotsTxtFound: Boolean(robotsResponse?.ok),
    robotsTxtAnalysis,
    robotsTxtAnalysisResult: Object.values(robotsTxtAnalysis).every(Boolean),
    serverBotAccess
  };
}

export async function runContentAudit(rawUrl, workspaceId, crawlerIdentity = "ChatGPT-User", sendCortexyHeader = true) {
  const userAgent = CONTENT_CRAWLERS[crawlerIdentity] || CONTENT_CRAWLERS["ChatGPT-User"];
  const response = await fetchPublicPage(rawUrl, {
    headers: {
      "User-Agent": userAgent,
      ...(sendCortexyHeader ? { "X-Cortexy-Crawler": "content-audit" } : {})
    }
  });
  if (!response.ok) throw new Error(`The target page returned HTTP ${response.status}.`);
  const contentType = response.headers["content-type"] || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error("Content Checker requires an HTML page.");
  }
  const target = new URL(response.url);
  const completedDate = new Date().toISOString();
  return {
    id: randomUUID(),
    workspaceId,
    url: target.toString(),
    domain: target.hostname,
    source: "cortexy",
    crawlerIdentity,
    status: "completed",
    createdDate: completedDate,
    completedDate,
    serverBotAccess: { [crawlerIdentity]: { userAgent, status: response.status, ok: response.ok } },
    ...scoreContent(response.body, response)
  };
}
