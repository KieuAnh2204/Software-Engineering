const axios = require("axios");

function createHttpClient(baseURL) {
  const client = axios.create({ baseURL, timeout: 5000 });
  return client;
}

module.exports = { createHttpClient };
