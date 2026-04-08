const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const userCount = document.getElementById('user-count');
const totalMessagesDisplay = document.getElementById('total-messages');
const statusDisplay = document.getElementById('status');
const joinContainer = document.getElementById('join-container');
const chatContainer = document.getElementById('chat-container');
const joinForm = document.getElementById('join-form');

let socket;
let currentUser = { username: '', room: '' };

// Join form submit
joinForm.addEventListener('submit', (e) => {
  e.preventDefault();

  currentUser.username = e.target.elements.username.value;
  currentUser.room = e.target.elements.room.value;

  // Show chat, hide join
  joinContainer.classList.add('hidden');
  chatContainer.classList.remove('hidden');

  // Initialize socket connection
  initSocket();
});

function initSocket() {
  // Connect to socket
  socket = io();

  // Handle connection
  socket.on('connect', () => {
    console.log('Connected to server');
    statusDisplay.innerText = 'Connected';
    statusDisplay.className = 'online';

    // Automatically join room on connect/reconnect
    if (currentUser.username && currentUser.room) {
      socket.emit('joinRoom', { 
        username: currentUser.username, 
        room: currentUser.room 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    statusDisplay.innerText = 'Disconnected';
    statusDisplay.className = '';
  });

  // Get room and users
  socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
  });

  // Get total messages update
  socket.on('totalMessagesUpdate', (count) => {
    totalMessagesDisplay.innerText = count;
  });

  // Message from server
  socket.on('message', (message) => {
    outputMessage(message);

    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  const msg = e.target.elements.msg.value;

  // Emit message to server
  if (socket && socket.connected) {
    socket.emit('chatMessage', msg);
  }

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  
  if (message.user === 'System') {
    div.classList.add('system');
  }

  div.innerHTML = `
    <p class="meta">${message.user} <span>${message.time}</span></p>
    <p class="text">
      ${message.text}
    </p>
  `;
  chatMessages.appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
  `;
  userCount.innerText = users.length;
}
