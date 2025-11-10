const axios = require('axios');

// Simple retry with exponential backoff
async function withRetries(fn, { retries = 3, baseDelayMs = 200 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      // Do not retry on 4xx (except 429)
      if (status && status >= 400 && status < 500 && status !== 429) break;
      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

function createHttpClient(baseURL, defaultHeaders = {}) {
  const instance = axios.create({ baseURL, headers: defaultHeaders, timeout: 8000 });
  return instance;
}

module.exports = { withRetries, createHttpClient };

