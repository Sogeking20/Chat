const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let messages = [];
const MAX_MESSAGES = 9;

app.get('/messages', (req, res) => {
  res.json(messages);
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'INIT', data: messages }));

  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    if (msg.type === 'NEW_MESSAGE') {
      if (messages.length >= MAX_MESSAGES) {
        messages.shift();
      }
      messages.push({ content: msg.data, timestamp: new Date() });

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'MESSAGE', data: messages }));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

app.post('/message', (req, res) => {
  const { content } = req.body;
  if (messages.length >= MAX_MESSAGES) {
    messages.shift();
  }
  messages.push({ content, timestamp: new Date() });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'MESSAGE', data: messages }));
    }
  });

  res.status(201).json({ message: 'Message created' });
});

server.listen(3001, () => {
  console.log('Server started on http://localhost:3001');
});