import { Message } from "../models/message.models.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

export const initializeChatSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      // Extract token from multiple possible locations
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "") ||
        socket.handshake.query.token ||
        socket.request.cookies?.accessToken; // Add cookie support

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (!decoded || !decoded.id) {
        return next(new Error("Invalid token"));
      }

      // Find user in database
      const user = await User.findById(decoded.id).select("-password -refreshToken");

      if (!user) {
        return next(new Error("User not found"));
      }

      // Check if user is verified (optional - remove if not needed)
      if (!user.isVerified) {
        return next(new Error("User not verified"));
      }

      // Store user in socket data
      socket.data.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      if (error.name === "JsonWebTokenError") {
        return next(new Error("Invalid token"));
      }
      if (error.name === "TokenExpiredError") {
        return next(new Error("Token expired"));
      }
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    socket.join("community-chat");

    socket.broadcast.emit("user:joined", {
      userId: user._id,
      username: user.username,
      message: `${user.username} joined the chat`,
    });

    // Note: Message sending is handled by REST API endpoints
    // Controllers broadcast via Socket.IO after saving to DB
    
    // User typing indicator
    socket.on("typing:start", () => {
      socket.broadcast.to("community-chat").emit("user:typing", {
        userId: user._id,
        username: user.username,
      });
    });

    socket.on("typing:stop", () => {
      socket.broadcast.to("community-chat").emit("user:stopped-typing", {
        userId: user._id,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      socket.broadcast.to("community-chat").emit("user:left", {
        userId: user._id,
        username: user.username,
        message: `${user.username} left the chat`,
      });
    });

    // Get online users
    socket.on("users:online", async () => {
      const sockets = await io.in("community-chat").fetchSockets();
      const onlineUsers = sockets.map((s) => ({
        userId: s.data.user._id,
        username: s.data.user.username,
      }));

      socket.emit("users:online-list", {
        count: onlineUsers.length,
        users: onlineUsers,
      });
    });
  });
};
