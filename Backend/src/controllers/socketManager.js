import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let usernames = {}; // Store usernames for each socket

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Something Connected");
    
    // Handle user joining with username
    socket.on("join-call", (path, username) => {
      console.log(`📞 JOIN-CALL received: path=${path}, username="${username}", socketId=${socket.id}`);
      
      if (connections[path] == undefined) {
        connections[path] = [];
      }
      connections[path].push(socket.id);

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
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["date"],
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
        console.log("message", key, ":", sender, data);

        connections[matchingRoom].array.forEach((element) => {
          io.to(element).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
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
            for (let b = 0; b < connections[key].length; ++b) {
              const socketId = connections[key][b];
              io.to(socketId).emit("user-left", socket.id);
            }

            var index = connections[key].indexOf(socket.id);
            connections[key].splice(index, 1);

            if (connections[key].length == 0) {
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
