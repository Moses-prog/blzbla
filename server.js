const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'WhatsApp Bot service is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the terminal interface at /shell
app.get('/shell', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal.html'));
});

// WebSocket connection for terminal
io.on('connection', (socket) => {
  console.log('Client connected to terminal');
  
  // Create a new bot process
  const botProcess = spawn('node', ['index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Send output to client
  botProcess.stdout.on('data', (data) => {
    socket.emit('output', data.toString());
  });
  
  botProcess.stderr.on('data', (data) => {
    socket.emit('output', data.toString());
  });
  
  // Handle input from client
  socket.on('input', (data) => {
    botProcess.stdin.write(data + '\n');
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    botProcess.kill();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
