import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let usernames = {}; // Store usernames for each socket

// Production debugging: Track server restarts
let serverStartTime = new Date();
console.log(`🚀 SocketManager initialized at: ${serverStartTime}`);

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
    // Render-compatible settings
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowUpgrades: true,
    maxHttpBufferSize: 1e6,
    // Remove sticky - not supported in constructor
    connectTimeout: 45000
  });

  io.on("connection", (socket) => {
    console.log("✅ NEW CONNECTION:", socket.id);
    console.log("🌍 Environment:", process.env.NODE_ENV || 'development');
    console.log("🔗 Total active connections:", io.engine.clientsCount);
    
    // Handle user joining with username
    socket.on("join-call", (path, username) => {
      console.log(`📞 JOIN-CALL received: path=${path}, username="${username}", socketId=${socket.id}`);
      console.log(`🏠 Current room state for ${path}:`, connections[path] || 'empty');
      
      if (connections[path] == undefined) {
        connections[path] = [];
        console.log(`🆕 Created new room: ${path}`);
      }
      
      // PRODUCTION FIX: Prevent duplicate socket IDs in the same room
      if (connections[path].includes(socket.id)) {
        console.log(`⚠️ DUPLICATE DETECTED: Socket ${socket.id} already in room ${path} - preventing duplicate`);
        console.log(`🔍 Current room participants:`, connections[path]);
        return; // Don't add duplicate
      }
      
      connections[path].push(socket.id);
      console.log(`✅ Added ${socket.id} to room ${path}. Total participants: ${connections[path].length}`);
      console.log(`🎯 Final room state:`, connections[path]);

      // Store username for this socket - ENHANCED: Ensure username is stored correctly
      if (username && typeof username === 'string' && username.trim()) {
        const cleanUsername = username.trim();
        usernames[socket.id] = cleanUsername;
        console.log(`✅ Stored username: "${cleanUsername}" for socket: ${socket.id}`);
      } else {
        console.log(`⚠️ Invalid username provided for socket: ${socket.id}, received:`, typeof username, username);
        usernames[socket.id] = `Anonymous-${socket.id.slice(-4)}`;
      }

      timeOnline[socket.id] = new Date();

      console.log(`📊 Current usernames:`, usernames);
      console.log(`📊 Current connections for ${path}:`, connections[path]);

      // Send user-joined event with usernames - IMPROVED
      for (let a = 0; a < connections[path].length; a++) {
        const targetSocketId = connections[path][a];
        
        // Create clients with usernames array with better mapping
        const clientsWithUsernames = connections[path].map(id => {
          const actualUsername = usernames[id];
          console.log(`🔍 Mapping socket ${id} to username: "${actualUsername}"`);
          
          // Don't send Unknown usernames if we have actual usernames
          const usernameToSend = actualUsername && !actualUsername.startsWith('Anonymous-') 
            ? actualUsername 
            : (actualUsername || `User ${id.slice(-4)}`);
            
          return {
            socketId: id,
            username: usernameToSend
          };
        });
        
        console.log(`📤 Sending to ${targetSocketId}:`, {
          newUserId: socket.id,
          allClients: connections[path],
          clientsWithUsernames: clientsWithUsernames
        });
        
        io.to(targetSocketId).emit(
          "user-joined",
          socket.id,
          connections[path],
          clientsWithUsernames
        );
      }

      if (messages[path] != undefined) {
        console.log(`📋 Loading ${messages[path].length} historical messages for new user`);
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"]
          );
        }
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [roomKey, isFound];
        },
        ["", false]
      );
      if (found == true) {
        if (messages[matchingRoom] == undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });
        console.log("📨 Broadcasting message from", sender, ":", data);

        connections[matchingRoom].forEach((element) => {
          console.log("📤 Sending message to socket:", element);
          io.to(element).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 DISCONNECT: Socket ${socket.id} disconnected`);
      console.log(`⏰ Server uptime: ${(new Date() - serverStartTime) / 1000}s`);
      
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());

      // Clean up username
      delete usernames[socket.id];

      var key;
      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        for (let a = 0; a < v.length; a++) {
          if (v[a] == socket.id) {
            key = k;
            console.log(`🏠 Removing ${socket.id} from room ${key}`);
            console.log(`👥 Room ${key} before removal:`, connections[key]);
            
            for (let b = 0; b < connections[key].length; ++b) {
              const socketId = connections[key][b];
              io.to(socketId).emit("user-left", socket.id);
            }

            var index = connections[key].indexOf(socket.id);
            connections[key].splice(index, 1);
            
            console.log(`👥 Room ${key} after removal:`, connections[key]);

            if (connections[key].length == 0) {
              console.log(`🗑️ Deleting empty room: ${key}`);
              delete connections[key];
            }
          }
        }
      }
      
      // Clean up username when socket disconnects
      if (usernames[socket.id]) {
        console.log(`🧹 Cleaning up username for disconnected socket: ${socket.id} (${usernames[socket.id]})`);
        delete usernames[socket.id];
      }
      
      // Clean up time tracking
      if (timeOnline[socket.id]) {
        delete timeOnline[socket.id];
      }
    });
  });
  return io;
};
