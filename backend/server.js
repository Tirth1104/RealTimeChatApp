const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, '../frontend')));

const users = [];
let totalMessages = 0;

// Run when client connects
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('joinRoom', ({ username, room }) => {
    console.log(`User ${username} joining room: ${room} (Socket: ${socket.id})`);
    const user = { id: socket.id, username, room };
    users.push(user);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', {
      user: 'System',
      text: `Welcome to the ${user.room} room, ${user.username}!`,
      time: new Date().toLocaleTimeString()
    });

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message', {
      user: 'System',
      text: `${user.username} has joined the chat`,
      time: new Date().toLocaleTimeString()
    });

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: users.filter(u => u.room === user.room)
    });

    // Send current total messages to the new user
    socket.emit('totalMessagesUpdate', totalMessages);
  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = users.find(u => u.id === socket.id);
    
    if (user) {
      totalMessages++;
      console.log(`[${user.room}] ${user.username}: ${msg} (Total: ${totalMessages})`);
      
      io.to(user.room).emit('message', {
        user: user.username,
        text: msg,
        time: new Date().toLocaleTimeString()
      });

      // Update total messages for everyone
      io.emit('totalMessagesUpdate', totalMessages);
    } else {
      console.log(`Warning: Unregistered socket ${socket.id} attempted to send message.`);
    }
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const index = users.findIndex(u => u.id === socket.id);

    if (index !== -1) {
      const user = users.splice(index, 1)[0];

      io.to(user.room).emit('message', {
        user: 'System',
        text: `${user.username} has left the chat`,
        time: new Date().toLocaleTimeString()
      });

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: users.filter(u => u.room === user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
