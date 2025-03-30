import express, { type Request, Response, NextFunction } from "express";
import multer from "multer";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

app.post("/api/upload-set-image", upload.single("image"), (req, res) => {
  console.log("Received request:", req.body, req.file); // Debugging log

  const { setId } = req.body;
  if (!req.file) {
    console.error("❌ No file uploaded.");
    return res.status(400).json({ message: "No file uploaded. Please select an image." });
  }

  if (!setId) {
    console.error("❌ Set ID is missing.");
    return res.status(400).json({ message: "Set ID is required." });
  }

  const updatedSet = {
    id: setId,
    thumbnail: `/uploads/${req.file.filename}`,
  };

  console.log(`✅ Set ${setId} updated with new thumbnail: ${updatedSet.thumbnail}`);
  res.status(200).json({
    success: true,
    message: "Image uploaded and set thumbnail updated successfully.",
    updatedSet,
  });
});

// Create a WebSocket server
const wss = new WebSocketServer({ port: 5001 });

wss.on("connection", (ws) => {
  console.log("WebSocket connection established.");
  ws.on("message", (message) => {
    console.log("Received:", message);
  });
  ws.send("Hello from WebSocket server!");
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const port = 5000;
  const isDev = process.env.NODE_ENV !== 'production';

  // Setup Vite first in development
  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  server.listen(port, "0.0.0.0", () => {
    log(`Server running at http://localhost:${port}`);
  });
})();
