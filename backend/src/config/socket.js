const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

exports.init = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // 🔐 Authenticate socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) return next();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name role");

      if (user) socket.user = user;
    } catch (err) {
      console.log("Socket Auth Error:", err.message);
    }
    next();
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    if (socket.user) {
      const userId = socket.user._id.toString();
      const role = socket.user.role;

      // Private room
      socket.join(`user_${userId}`);

      // Role rooms
      socket.join(`${role}_room`);

      console.log(`Joined rooms: user_${userId}, ${role}_room`);
    }

    // 🔵 Report updates
    socket.on("report:update", (data) => {
      io.to(`user_${data.userId}`).emit("report:updated", data);
    });

    // 🔵 Progress updates
    socket.on("report:progress", (data) => {
      io.to(`user_${data.userId}`).emit("report:progress", data);
    });

    // 🔔 Notification (generic)
    socket.on("notify", (data) => {
      io.to(`user_${data.userId}`).emit("notification:new", data);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });

  return io;
};

// 🟢 Socket helper for backend controllers
exports.emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

exports.emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`${role}_room`).emit(event, data);
};

exports.emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

exports.getIO = () => io;
