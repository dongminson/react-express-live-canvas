import express from 'express';
import { Server } from 'socket.io';

const PORT = 4000;

const handleListen = () => {
  console.log(`Listening on port ${PORT}`);
};

const app = express();
const server = app.listen(PORT, handleListen);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('draw', (x, y, ox, oy, color) => {
    io.emit('receive', x, y, ox, oy, color);
  });
  socket.on('clear', () => {
    io.emit('clear');
  });
});
