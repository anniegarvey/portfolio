#!/usr/bin/env node
// Finds a free port for this worktree session and saves it to .port.
// Idempotent: returns the same port on subsequent calls.
const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");

const portFile = path.join(process.cwd(), ".port");

if (fs.existsSync(portFile)) {
  const existing = parseInt(fs.readFileSync(portFile, "utf8").trim(), 10);
  if (!Number.isNaN(existing)) {
    process.stdout.write(`${String(existing)}\n`);
    process.exit(0);
  }
}

const server = net.createServer();
server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  server.close(() => {
    fs.writeFileSync(portFile, String(port));
    process.stdout.write(`${String(port)}\n`);
  });
});
