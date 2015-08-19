import path              from 'path';
import express           from 'express';
import config            from '../config/config.js';
import routes            from '../common/routes.js';
import bodyParser        from 'body-parser';
import expressListRoutes from 'express-list-routes';

var app  = express();
var port = process.env.PORT || config.port;
var dir  = path.dirname(process.mainModule.filename);

app.use(routes.asset('/static'), express.static(dir + '/../static/'));

// set up our express application
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));


// serve all (other) requests to single-page-app contained in index.html
var index = require('./index.js');
var contextPath = config.contextPath;
contextPath = contextPath.substr(0, 1) === '/' ? contextPath : '/' + contextPath;
contextPath = contextPath.substr(contextPath.length - 1) === '/' ? contextPath + '?' : contextPath + '/?';
var catchAllRoute = contextPath + '*';
app.get(catchAllRoute, function(req, res) {
  res.status(200).send(index);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
  console.log('404 ', req.path);
});

// error handlers
if (app.get('env') === 'development') {

  console.log('Starting server in development mode');

  // development error handler
  // will print stacktrace
  app.use(function(err, req, res, next) {
    if (!err.status || err.status === 500) {
      console.log(err.stack);
    }
    res.status(err.status || 500);
    res.format({
      'application/json': function() {
        res.json(err);
      },
      'default': function() {
        res.status(406).send('Not Acceptable');
      }
    });
  });

} else {

  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.format({
        'application/json': function() {
          res.json({});
        },
        'default': function() {
          res.send(406, 'Not Acceptable');
        }
      });
  });
}

// launch =====================================================================
app.listen(port);
expressListRoutes({ prefix: '' }, 'Server REST API:', app);
console.log('Server started on ' + config.host + ':' + port + config.contextPath);
