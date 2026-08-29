/**
 * Zorvik AI Dynamic Tool & Function Calling Registry
 * Implements deterministic callable tools for model reasoning loops.
 */

// Tool Schema Definitions (OpenAI & Gemini Compatible Format)
const TOOL_DEFINITIONS = [
  {
    name: "calculate_expression",
    description: "Evaluates mathematical expressions, scientific formulas, statistics, and conversions.",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "The mathematical expression to evaluate, e.g. '(15 * 450) / 1.2' or 'sqrt(144) + 2^8'.",
        },
      },
      required: ["expression"],
    },
  },
  {
    name: "get_market_quote",
    description: "Fetches real-time price quotes, market cap, and 24h change for crypto assets (BTC, ETH, SOL, etc.).",
    parameters: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Crypto token symbol or name, e.g. 'bitcoin', 'ethereum', 'solana'.",
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_weather_data",
    description: "Fetches current real-time weather and temperature for any city/location globally.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City or location name, e.g. 'Tokyo', 'San Francisco', 'London', 'Mumbai'.",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "inspect_url_headers",
    description: "Inspects HTTP response headers, SSL status, latency, and server technologies for a given URL.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The target website or API endpoint URL, e.g. 'https://zorvik.tech'.",
        },
      },
      required: ["url"],
    },
  },
];

/**
 * Execute tool dynamically by name and arguments
 * @param {string} toolName
 * @param {object} args
 * @returns {Promise<object>}
 */
async function executeTool(toolName, args = {}) {
  switch (toolName) {
    case "calculate_expression": {
      const expr = args.expression;
      if (!expr || typeof expr !== "string") {
        return { error: "Missing or invalid 'expression' parameter" };
      }
      try {
        // Safe math evaluator: strip dangerous characters, evaluate strictly arithmetic/math expressions
        const sanitized = expr.replace(/[^0-9+\-*/().%^eE\sMath.sqrtincoaglbexp]/g, "");
        const formatted = sanitized
          .replace(/\^/g, "**")
          .replace(/sqrt\(/g, "Math.sqrt(")
          .replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/log\(/g, "Math.log10(");
        const result = Function(`"use strict"; return (${formatted})`)();
        return {
          expression: expr,
          result: Number.isFinite(result) ? result : String(result),
          success: true,
        };
      } catch (err) {
        return { expression: expr, error: `Math calculation failed: ${err.message}` };
      }
    }

    case "get_market_quote": {
      const sym = (args.symbol || "bitcoin").toLowerCase().trim();
      const idMap = {
        btc: "bitcoin",
        eth: "ethereum",
        sol: "solana",
        doge: "dogecoin",
        xrp: "ripple",
        ada: "cardano",
      };
      const coinId = idMap[sym] || sym;
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`Price API responded with ${res.status}`);
        const data = await res.json();
        const coinData = data[coinId];
        if (!coinData) {
          return { symbol: sym, message: `Could not find live quote for '${sym}'.` };
        }
        return {
          asset: coinId.toUpperCase(),
          price_usd: coinData.usd,
          change_24h_pct: coinData.usd_24h_change ? Number(coinData.usd_24h_change.toFixed(2)) : 0,
          market_cap_usd: coinData.usd_market_cap,
          timestamp: new Date().toISOString(),
          success: true,
        };
      } catch (err) {
        return { symbol: sym, error: `Market quote fetch failed: ${err.message}` };
      }
    }

    case "get_weather_data": {
      const loc = args.location || "London";
      try {
        // 1. Geocode location via Open-Meteo Geocoding
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`
        );
        const geoData = await geoRes.json();
        const firstResult = geoData.results?.[0];
        if (!firstResult) {
          return { location: loc, message: `Location '${loc}' not found.` };
        }

        const { latitude, longitude, name, country } = firstResult;
        // 2. Fetch current weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&temperature_unit=celsius`
        );
        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        return {
          location: `${name}, ${country || ""}`,
          temperature_c: current?.temperature_2m,
          apparent_temp_c: current?.apparent_temperature,
          humidity_pct: current?.relative_humidity_2m,
          wind_speed_kmh: current?.wind_speed_10m,
          precipitation_mm: current?.precipitation,
          timestamp: new Date().toISOString(),
          success: true,
        };
      } catch (err) {
        return { location: loc, error: `Weather fetch failed: ${err.message}` };
      }
    }

    case "inspect_url_headers": {
      const targetUrl = args.url?.startsWith("http") ? args.url : `https://${args.url}`;
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(targetUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const headers = {};
        res.headers.forEach((val, key) => {
          if (["server", "content-type", "strict-transport-security", "x-frame-options", "cf-ray"].includes(key.toLowerCase())) {
            headers[key] = val;
          }
        });
        return {
          url: targetUrl,
          status: res.status,
          latency_ms: Date.now() - start,
          ssl_active: targetUrl.startsWith("https://"),
          security_headers: headers,
          success: true,
        };
      } catch (err) {
        return { url: targetUrl, error: `Inspection failed: ${err.message}` };
      }
    }

    default:
      return { error: `Unknown tool '${toolName}'` };
  }
}

/**
 * Detect if prompt asks for a specific deterministically callable tool
 * @param {string} prompt
 * @returns {{ toolName: string, args: object } | null}
 */
function detectHeuristicToolCall(prompt) {
  if (!prompt || typeof prompt !== "string") return null;
  const lower = prompt.toLowerCase();

  // Math calculator pattern: "calculate 45 * 12", "what is 2^10 + 50", "sqrt(144) * 5"
  const mathMatch = prompt.match(/(?:calculate|what is|compute|evaluate)\s+([0-9+\-*/().%^eE\s]{3,60})/i);
  if (mathMatch && /[0-9]/.test(mathMatch[1]) && /[+\-*/^%]/.test(mathMatch[1])) {
    return {
      toolName: "calculate_expression",
      args: { expression: mathMatch[1].trim() },
    };
  }

  // Crypto price pattern: "price of btc", "bitcoin price", "solana market cap"
  const cryptoMatch = lower.match(/(?:price of|price for|quote for|cost of|how much is)\s+([a-z0-9]+)/i);
  if (cryptoMatch && ["btc", "bitcoin", "eth", "ethereum", "sol", "solana", "doge", "xrp"].includes(cryptoMatch[1])) {
    return {
      toolName: "get_market_quote",
      args: { symbol: cryptoMatch[1] },
    };
  }

  // Weather pattern: "weather in tokyo", "temperature of london"
  const weatherMatch = lower.match(/(?:weather in|weather for|temperature in|forecast for)\s+([a-zA-Z\s,]{2,30})/i);
  if (weatherMatch) {
    return {
      toolName: "get_weather_data",
      args: { location: weatherMatch[1].trim() },
    };
  }

  return null;
}

module.exports = {
  TOOL_DEFINITIONS,
  executeTool,
  detectHeuristicToolCall,
};
