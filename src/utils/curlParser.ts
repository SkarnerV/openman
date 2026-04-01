import type { HttpRequest, HttpMethod, Header, QueryParam, RequestBody } from "../stores/useRequestStore";

interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: Header[];
  body?: string;
  bodyType: "none" | "json" | "raw";
}

/**
 * Parses a cURL command string into an HttpRequest object
 * Supports common cURL flags: -X/--request, -H/--header, -d/--data, --data-raw, --json
 */
export function parseCurlCommand(curlCommand: string): Partial<HttpRequest> | null {
  try {
    // Clean up the command - remove line continuations and extra spaces
    const cleanedCommand = curlCommand
      .replace(/\\\s*\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Check if it starts with curl
    if (!cleanedCommand.toLowerCase().startsWith("curl")) {
      return null;
    }

    const parsed: ParsedCurl = {
      method: "GET",
      url: "",
      headers: [],
      bodyType: "none",
    };

    // Tokenize the command while respecting quotes
    const tokens = tokenizeCommand(cleanedCommand);

    let i = 1; // Skip 'curl'
    while (i < tokens.length) {
      const token = tokens[i];

      // Method flag
      if (token === "-X" || token === "--request") {
        i++;
        if (i < tokens.length) {
          const method = tokens[i].toUpperCase() as HttpMethod;
          if (["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method)) {
            parsed.method = method;
          }
        }
      }
      // Header flag
      else if (token === "-H" || token === "--header") {
        i++;
        if (i < tokens.length) {
          const header = parseHeader(tokens[i]);
          if (header) {
            // Check if header already exists and update it
            const existingIndex = parsed.headers.findIndex(h => h.key.toLowerCase() === header.key.toLowerCase());
            if (existingIndex >= 0) {
              parsed.headers[existingIndex] = header;
            } else {
              parsed.headers.push(header);
            }
          }
        }
      }
      // Data flag (body)
      else if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary") {
        i++;
        if (i < tokens.length) {
          parsed.body = tokens[i];
          parsed.bodyType = detectBodyType(tokens[i], parsed.headers);
          // If method is still GET, change to POST
          if (parsed.method === "GET") {
            parsed.method = "POST";
          }
        }
      }
      // JSON data flag
      else if (token === "--json") {
        i++;
        if (i < tokens.length) {
          parsed.body = tokens[i];
          parsed.bodyType = "json";
          // Add Content-Type header if not present
          if (!parsed.headers.some(h => h.key.toLowerCase() === "content-type")) {
            parsed.headers.push({ key: "Content-Type", value: "application/json", enabled: true });
          }
          if (parsed.method === "GET") {
            parsed.method = "POST";
          }
        }
      }
      // URL (no flag, starts with http or is the last argument)
      else if (!token.startsWith("-") && (token.startsWith("http://") || token.startsWith("https://"))) {
        parsed.url = token;
      }
      // URL with quotes
      else if ((token.startsWith("'http://") || token.startsWith("'https://") ||
                 token.startsWith('"http://') || token.startsWith('"https://')) &&
               !token.startsWith("-")) {
        parsed.url = token.replace(/^['"]|['"]$/g, "");
      }

      i++;
    }

    // If no URL found, return null
    if (!parsed.url) {
      return null;
    }

    // Parse query params from URL
    const { url: cleanUrl, params } = extractQueryParams(parsed.url);

    // Build the HttpRequest object
    const request: Partial<HttpRequest> = {
      id: crypto.randomUUID(),
      name: generateNameFromUrl(cleanUrl),
      method: parsed.method,
      url: cleanUrl,
      headers: parsed.headers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (params.length > 0) {
      request.params = params;
    }

    if (parsed.body && parsed.bodyType !== "none") {
      request.body = {
        mode: parsed.bodyType,
        content: parsed.body,
        rawLanguage: parsed.bodyType === "json" ? "json" : "text",
      } as RequestBody;
    }

    return request;
  } catch {
    return null;
  }
}

/**
 * Tokenize a command string while respecting quotes
 */
function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (char === " " || char === "\t") {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parse a header string like "Content-Type: application/json"
 */
function parseHeader(headerStr: string): Header | null {
  const colonIndex = headerStr.indexOf(":");
  if (colonIndex === -1) {
    return null;
  }

  const key = headerStr.substring(0, colonIndex).trim();
  const value = headerStr.substring(colonIndex + 1).trim();

  // Skip some headers that are handled automatically
  if (key.toLowerCase() === "content-length") {
    return null;
  }

  return {
    key,
    value,
    enabled: true,
  };
}

/**
 * Detect body type from content and headers
 */
function detectBodyType(body: string, headers: Header[]): "none" | "json" | "raw" {
  // Check Content-Type header
  const contentTypeHeader = headers.find(h => h.key.toLowerCase() === "content-type");
  if (contentTypeHeader) {
    const contentType = contentTypeHeader.value.toLowerCase();
    if (contentType.includes("application/json")) {
      return "json";
    }
  }

  // Try to parse as JSON
  try {
    JSON.parse(body);
    return "json";
  } catch {
    // Not valid JSON
  }

  return "raw";
}

/**
 * Extract query params from URL
 */
function extractQueryParams(url: string): { url: string; params: QueryParam[] } {
  try {
    const urlObj = new URL(url);
    const params: QueryParam[] = [];

    urlObj.searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        enabled: true,
      });
    });

    // Return URL without query params
    const cleanUrl = urlObj.origin + urlObj.pathname;

    return { url: cleanUrl, params };
  } catch {
    // Invalid URL, return as is
    return { url, params: [] };
  }
}

/**
 * Generate a readable name from URL
 */
function generateNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Use the last path segment as the name
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      return pathSegments[pathSegments.length - 1];
    }
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Convert an HttpRequest to a cURL command string
 */
export function generateCurlCommand(request: Partial<HttpRequest>): string {
  const parts: string[] = ["curl"];

  // Method
  if (request.method && request.method !== "GET") {
    parts.push("-X", request.method);
  }

  // URL with query params
  let url = request.url || "";
  if (request.params && request.params.length > 0) {
    const urlObj = new URL(url);
    request.params.filter(p => p.enabled).forEach(p => {
      urlObj.searchParams.append(p.key, p.value);
    });
    url = urlObj.toString();
  }
  parts.push(`'${url}'`);

  // Headers
  if (request.headers) {
    request.headers.filter(h => h.enabled).forEach(h => {
      parts.push("-H", `'${h.key}: ${h.value}'`);
    });
  }

  // Body
  if (request.body && request.body.content) {
    const escapedBody = request.body.content.replace(/'/g, "'\\''");
    parts.push("-d", `'${escapedBody}'`);
  }

  return parts.join(" ");
}