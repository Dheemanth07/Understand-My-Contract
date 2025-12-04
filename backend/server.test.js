const http = require('http');
const mongoose = require('mongoose');
const { app } = require('./server');

async function startTestServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    const requestedPort = process.env.TEST_BACKEND_PORT ? parseInt(process.env.TEST_BACKEND_PORT, 10) : 0;
    server.listen(requestedPort, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : requestedPort;
      console.log(`Test server started on port ${port}`);
      resolve({ server, port });
    });
    server.on('error', (err) => reject(err));
  });
}

async function stopTestServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { startTestServer, stopTestServer };
