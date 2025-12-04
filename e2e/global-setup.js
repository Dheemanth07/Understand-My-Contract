const path = require('path');
const fs = require('fs');
const { startTestServer } = require('../backend/server.test');

module.exports = async () => {
  // Start backend test server on configured port (default 5000)
  const port = process.env.TEST_BACKEND_PORT || process.env.PORT || 5000;
  process.env.TEST_BACKEND_PORT = port;

  const { server } = await startTestServer();

  // Persist PID/port to marker file so teardown can find it
  const markerDir = path.resolve(process.cwd(), 'e2e');
  if (!fs.existsSync(markerDir)) fs.mkdirSync(markerDir, { recursive: true });
  const marker = path.join(markerDir, '.e2e-backend');
  fs.writeFileSync(marker, JSON.stringify({ port, pid: process.pid }));

  // expose server on global so teardown can close it
  global.__E2E_BACKEND_SERVER__ = server;

  // Set backend URL env var used by frontend dev server if needed
  process.env.VITE_BACKEND_URL = `http://localhost:${port}`;
};
