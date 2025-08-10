#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./app');
var debug = require('debug')('chat:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

const io = require('socket.io')(server);

// Almacenar usuarios conectados
let connectedUsers = new Map();

io.on('connection', (socket) => { 
  console.log('Usuario conectado:', socket.id);

  socket.on('user_join', (data) => {
    // Guardar usuario en el mapa
    connectedUsers.set(socket.id, data.usuario);
    
    // Notificar a todos sobre el nuevo usuario
    socket.broadcast.emit('mensaje_chat', {
      usuario: 'INFO',
      mensaje: `${data.usuario} se ha unido a la sala`
    });
    
    // Enviar lista actualizada de usuarios a todos
    const usersList = Array.from(connectedUsers.values());
    io.emit('users_list', usersList);
    io.emit('num_clientes', connectedUsers.size);
  });

  socket.on('mensaje_chat', data => {
    io.emit('mensaje_chat', data);
  });

  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    if (username) {
      connectedUsers.delete(socket.id);
      
      // Notificar desconexión
      io.emit('mensaje_chat', {
        usuario: 'INFO',
        mensaje: `${username} ha abandonado la sala`
      });
      
      // Enviar lista actualizada
      const usersList = Array.from(connectedUsers.values());
      io.emit('users_list', usersList);
      io.emit('num_clientes', connectedUsers.size);
    }
    
    console.log('Usuario desconectado:', socket.id);
  });
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
