import fs         from 'fs';
import path       from 'path';
import timers     from 'timers';
import express    from 'express';
import Http       from 'http';
import SocketIo   from 'socket.io';
import config     from '../config/config.js';
import routes     from '../common/routes.js';
import Tail       from 'tail';
import LineByLine from 'line-by-line';

var logFilesArg;
if (!process.env.LOGSERV_FILES) {
  logFilesArg = process.argv.slice(2);
} else if (process.env.LOGSERV_FILES) {
  logFilesArg = process.env.LOGSERV_FILES.split(' ');
} else {
  logFilesArg = config.logFiles;
}
var logFiles = logFilesArg.map((f) => path.resolve(process.cwd(), f));

console.log('Starting logserv serving', logFiles);

var app    = express();
var server = Http.Server(app);
var io     = SocketIo(server, { path : routes.route('socket.io') + '/' });
var port   = process.env.PORT || config.port;
var host   = config.host || 'localhost';
var dir    = path.dirname(process.mainModule.filename);

// map of map to hold tail instances for clients, maps socket ids -> file names -> tail instances
var tails  = {};

var stopWatch = function(socketId, filename) {
  if (tails[socketId] !== undefined && tails[socketId] != null &&
      tails[socketId][filename] !== undefined && tails[socketId][filename] != null) {
    console.log(`stopping watch for socket id ${socketId} on ${filename}`);
    tails[socketId][filename].unwatch();
    tails[socketId][filename] = null;
  }
};

var stopAllWatches = function(socketId) {
  if (tails[socketId]) {
    Object.getOwnPropertyNames(tails[socketId]).forEach((filename) => {
      stopWatch(socketId, filename);
    });
    tails[socketId] = undefined;
  }
};

io.on('connection', (socket) => {
  console.log('client connected');

  socket.on('join', (data) => {

    console.log('client trying to join', data.filename);

    var logFile = data.filename;
    // return error if file is not in the list of served files
    if (logFiles.indexOf(logFile) == -1) {
      console.log(`the requested filename "${logFile}" is not served`);
      return;
    }

    console.log('client joined', logFile);
    socket.join(logFile);

    if (!fs.existsSync(logFile)) {

      var msg = `log file "${logFile}" does not exist. ignoring for now...`;
      console.log(msg);
      socket.to(logFile).emit('error', msg);

    } else {

      if (tails[socket.id] === undefined) {
        tails[socket.id] = {};
      }
      tails[socket.id][logFile] = new Tail.Tail(logFile, '\n', {}, false);
      tails[socket.id][logFile].watch();
      tails[socket.id][logFile].on('error', (error) => {
        io.to(logFile).emit('error', error);
      });

      var lr = new LineByLine(logFile);
      lr.on('error', () => console.log('error reading', logFile, error));
      lr.on('end', () => {
        console.log('ended reading', logFile)
        tails[socket.id][logFile].on('line', (line) => {
          io.to(logFile).emit('log', {
            filename : logFile,
            line : line
          });
        });
      });
      lr.on('line', (line) => io.to(logFile).emit('log', {
        filename : logFile,
        line : line
      }));
    }
  });

  socket.on('leave', (data) => {
    console.log('client leaving', data.filename);
    socket.leave(data.filename);
    stopWatch(socket.id, data.filename);
  });

  socket.on('disconnect', () => {
    console.log('client disconnected');
    stopAllWatches(socket.id);
  });
});

app.use(routes.asset('/static'), express.static(dir + '/../static/'));

var index = require('./index.js');
app.get(routes.asset('/'), (req, res) => {
  res.status(200).send(index);
});

app.get(routes.route('filenames'), (req, res) => {
  res.json(logFiles);
});

server.listen(port);

console.log('Server started on ' + config.host + ':' + port + config.contextPath);
