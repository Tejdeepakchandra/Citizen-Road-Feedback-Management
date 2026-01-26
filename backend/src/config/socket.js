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

      // Store user info in socket
      socket.userId = userId;
      socket.role = role;

      // Join private room (user-specific)
      socket.join(`user_${userId}`);
      console.log(`✅ Joined room: user_${userId}`);

      // Join role-based rooms
      socket.join(`${role}_room`);
      console.log(`✅ Joined room: ${role}_room`);

      // Join combined room for easier broad notifications
      socket.join(`all_users`);
      console.log(`✅ Joined room: all_users`);

      // Emit connection confirmation to user
      socket.emit('connection:confirmed', {
        userId: userId,
        role: role,
        rooms: [`user_${userId}`, `${role}_room`, `all_users`]
      });
    }

    // 🔵 Report updates (emit from frontend when report updated)
    socket.on("report:update", (data) => {
      io.to(`user_${data.userId}`).emit("report:updated", data);
    });

    // 🔵 Progress updates (emit from frontend)
    socket.on("report:progress", (data) => {
      io.to(`user_${data.userId}`).emit("report:progress", data);
    });

    // 🔔 Generic notification (emit from frontend)
    socket.on("notify", (data) => {
      io.to(`user_${data.userId}`).emit("notification:new", data);
    });

    socket.on("disconnect", () => {
      if (socket.user) {
        console.log(`❌ Disconnected: ${socket.id} (${socket.role}: ${socket.userId})`);
      } else {
        console.log(`❌ Disconnected: ${socket.id}`);
      }
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
