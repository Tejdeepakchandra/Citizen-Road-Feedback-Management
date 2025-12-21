const { getIO } = require("../config/socket");

// Emit event to a single user
exports.emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user_${userId}`).emit(event, data);
  } catch (err) {
    console.error("emitToUser error:", err.message);
  }
};

// Emit event to role room
exports.emitToRole = (role, event, data) => {
  try {
    const io = getIO();
    io.to(`${role}_room`).emit(event, data);
  } catch (err) {
    console.error("emitToRole error:", err.message);
  }
};

// Emit event to everyone
exports.emitToAll = (event, data) => {
  try {
    const io = getIO();
    io.emit(event, data);
  } catch (err) {
    console.error("emitToAll error:", err.message);
  }
};
