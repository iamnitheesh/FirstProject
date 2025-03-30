const express = require("express");
const path = require("path");
const { exec } = require('child_process');

// Keep the process running
process.stdin.resume();

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("Unhandled Error:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

const app = express();
const port = 5000;

// Configure express
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Create HTTP server with proper error handling
const server = app.listen(port, 'localhost', () => {
  console.log('='.repeat(50));
  console.log(`Server running at http://localhost:${port}`);
  console.log('DO NOT CLOSE THIS WINDOW');
  console.log('Minimize this window and use the app in your browser');
  console.log('='.repeat(50));
  
  // Open browser with delay
  setTimeout(() => {
    exec('start http://localhost:5000', (error) => {
      if (error) console.error('Browser launch error:', error);
    });
  }, 2000);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server Error:', err);
});

// Multiple keep-alive mechanisms
setInterval(() => {}, 1000);
setTimeout(() => {}, 100000);
process.on('SIGINT', () => {
  console.log('\nKeeping application alive. Use Ctrl+C twice to exit.');
});

// Health check endpoint
app.get('/health', (_, res) => res.send('ok'));
