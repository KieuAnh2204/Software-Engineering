const axios = require('axios');

const http = axios.create({ timeout: 6000 });

module.exports = http;

