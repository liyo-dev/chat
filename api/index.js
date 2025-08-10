const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Importar rutas
const indexRouter = require('../routes/index');
const usersRouter = require('../routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Para desarrollo local y Railway
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Chat retro servidor corriendo en puerto ${port}`);
  console.log(`🌐 Abre tu navegador en http://localhost:${port}`);
});

// Export the app for Railway
module.exports = app;
