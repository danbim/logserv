import path              from 'path';
import timers            from 'timers';
import express           from 'express';
import Http              from 'http';
import SocketIo          from 'socket.io';
import config            from '../config/config.js';
import routes            from '../common/routes.js';

var logFiles;
if (!process.env.LOGSERV_FILES) {
  logFiles = process.argv.slice(2);
} else if (process.env.LOGSERV_FILES) {
  logFiles = process.env.LOGSERV_FILES.split(' ');
} else {
  logFiles = config.logFiles;
}
logFiles = logFiles.map((f) => path.normalize(f));

console.log('Starting logserv serving', logFiles);

var app    = express();
var server = Http.Server(app);
var io     = SocketIo(server, { path : routes.route('socket.io') + '/' });
var port   = process.env.PORT || config.port;
var host   = config.host || 'localhost';
var dir    = path.dirname(process.mainModule.filename);

io.on('connection', (socket) => {
  console.log('client connected');
  var schedules = [];
  logFiles.forEach((logFile) => {
    schedules.push(timers.setInterval(() => {
      var filename = path.basename(logFile);
      var msg = {
        filename : filename,
        line : 'hello, ' + filename + ' ' + new Date().toISOString()
      };
      console.log('emitting to %s: %s', filename, JSON.stringify(msg));
      io.to(filename).emit('log', msg);
    }, 1000));
  });
  socket.on('join', (data) => {
    console.log('client joined', data.filename);
    socket.join(data.filename);
  });
  socket.on('leave', (data) => {
    console.log('client leaving', data.filename);
    socket.leave(data.filename);
  });
  socket.on('disconnect', (socket) => {
    console.log('client disconnected');
    schedules.forEach((s) => timers.clearInterval(s));
  });
});

app.use(routes.asset('/static'), express.static(dir + '/../static/'));

var index = require('./index.js');
app.get(routes.asset('/'), (req, res) => {
  res.status(200).send(index);
});

app.get(routes.route('filenames'), (req, res) => {
  res.json(logFiles.map((f) => path.basename(f)));
});

server.listen(port);

console.log('Server started on ' + config.host + ':' + port + config.contextPath);
