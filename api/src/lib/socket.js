// lib/socket.js
import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

// Socket.io server
const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

// Kullanıcı socket map
const userSocketMap = {}; // {userId: socketId}

// Kullanıcı ID'den socket ID almak için
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Socket.io bağlantısı
io.on("connection", (socket) => {
  console.log("Kullanıcı bağlandı:", socket.user.fullName);

  const userId = socket.user._id.toString();
  userSocketMap[userId] = socket.id;

  // Online kullanıcıları gönder
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("Kullanıcı bağlantısı kesildi:", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
