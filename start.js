const express = require("express");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const port = 5000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, "dist"))); // Ensure this path is correct
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html")); // Ensure fallback to index.html
});

// Start the server and open the browser
const server = app.listen(port, "localhost", () => {
  console.log("=".repeat(50));
  console.log(`Server is running at http://localhost:${port}`);
  console.log("Minimize this window to keep the server running.");
  console.log("=".repeat(50));

  setTimeout(() => {
    exec(`start http://localhost:${port}`, (error) => {
      if (error) {
        console.error("Failed to open the browser:", error);
      }
    });
  }, 2000);
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server encountered an error:", err);
});

// Keep the process alive
setInterval(() => {}, 1000);
