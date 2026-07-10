import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeChatSocket } from "./sockets/chat.socket.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Ensure temp directory exists for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, "../public/temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

let port = process.env.PORT || 8001;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
  allowRequest: (req, callback) => {
    // Parse cookies for socket.io
    const cookies = {};
    if (req.headers.cookie) {
      req.headers.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
      });
    }
    req.cookies = cookies;
    callback(null, true);
  },
});

app.set("io", io);

initializeChatSocket(io);

connectDB()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Socket.IO server is ready`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error");
  });
