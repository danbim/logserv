var gulp               = require('gulp');
var path               = require('path');
var source             = require('vinyl-source-stream');
var browserify         = require('browserify');
var watchify           = require('watchify');
var sequence           = require('run-sequence');
var gulpif             = require('gulp-if');
var babelify           = require('babelify');
var uglify             = require('gulp-uglify');
var streamify          = require('gulp-streamify');
var notify             = require('gulp-notify');
var babel              = require('gulp-babel');
var gutil              = require('gulp-util');
var express            = require('gulp-express');
var newer              = require('gulp-newer');
var debug              = require('gulp-debug');
var del                = require('del');
var env                = require('gulp-env');
var cache              = require('gulp-cached');
var less               = require('gulp-less');
var LessPluginCleanCSS = require('less-plugin-clean-css');
var sourcemaps         = require('gulp-sourcemaps');
var minifyCSS          = require('gulp-minify-css');
var livereload         = require('gulp-livereload');
var jasmine            = require('gulp-jasmine');
var jasmineReporters   = require('jasmine-reporters');

var dirs = {
  src : {
    'less'   : ['./ui/assets/less/**/*.less'],
    'static' : ['./ui/static/**'],
    'config' : ['./config/**/*.js'],
    'common' : ['./common/**/*.js'],
    'server' : ['./server/**/*.js'],
    'view'   : './ui/views/App.jsx',
    'test'   : ['test/**/*.spec.js']
  },
  build : {
    'less'   : './dist/static/css/',
    'static' : './dist/static/',
    'config' : './dist/config/',
    'common' : './dist/common/',
    'server' : './dist/server/',
    'view'   : './dist/static/js/'
  }
};

var browserifyTask = function() {

  var development = process.env.DEVELOPMENT === 'true';
  var appBundler = browserify({
    entries: dirs.src.view, // Only need initial file, browserify finds the rest
    transform: [babelify], // We want to convert JSX to ES6 and ES6 to normal JavaScript
    debug: development, // Gives us sourcemapping
    cache: {}, packageCache: {}, fullPaths: development // Requirement of watchify
  });

  // The rebundle process
  var rebundle = function() {
    var start = Date.now();
    gutil.log('(Re)bundling front end');
    return appBundler
      .bundle()
      .on('error', function(err) {
        gutil.log(gutil.colors.red(err.toString()));
      })
      .pipe(source('App.js'))
      .pipe(gulpif(!development, streamify(uglify())))
      .pipe(gulp.dest(dirs.build.view))
      .pipe(livereload())
      .pipe(notify(function() {
        gutil.log('Front end (re)bundled in ' + (Date.now() - start) + 'ms');
      }));
  };

  // Fire up Watchify when developing
  if (development) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }

  return rebundle();
};

var serverExecutable = 'dist/server/server.js';
var server = {
  instance : null,
  start : function(callback) {
    gutil.log('Starting server');
    server.instance = express.run([serverExecutable], {}, false);
    callback();
  },
  restart : function(callback) {
    gutil.log('Restarting server');
    if (server.instance) {
      server.instance.stop();
    }
    server.instance = express.run([serverExecutable], {}, false);
    livereload.reload();
    callback();
  }
};

gulp.task('browserify', function() {
  return browserifyTask();
});

gulp.task('set-env-dev', function() {
  env({
    vars: {
      //DEBUG: "express:*",
      DEVELOPMENT : 'true'
    }
  });
});

gulp.task('set-env-prod', function() {
  console.log('set-env-prod');
});

gulp.task('config', function () {
    return gulp.src(dirs.src.config)
        .pipe(babel())
        .pipe(gulp.dest(dirs.build.config));
});

gulp.task('common', ['config'], function () {
    return gulp.src(dirs.src.common)
        .pipe(babel())
        .pipe(gulp.dest(dirs.build.common));
});

gulp.task('server', ['common', 'config'], function () {
    return gulp.src(dirs.src.server)
        .pipe(babel())
        .pipe(gulp.dest(dirs.build.server));
});

gulp.task('serve', ['server'], function(callback) {
  if (server.instance) {
    server.restart(callback);
  } else {
    server.start(callback);
  }
});

gulp.task('static', function() {
  var src = dirs.src.static;
  var dst = dirs.build.static;
  return gulp.src(src)
    .pipe(newer(dst))
    .pipe(cache('static'))
    .pipe(gulp.dest(dst))
    .pipe(livereload())
    .pipe(notify(function(file) {
      gutil.log('Copied', file.relative);
    }));
});

gulp.task('less', function() {
  var cleancss = new LessPluginCleanCSS({ advanced: true });
  var src = dirs.src.less;
  var dst = dirs.build.less;
  if (process.env.DEVELOPMENT) {
    return gulp.src(src)
      .pipe(cache('less'))
      .pipe(sourcemaps.init())
      .pipe(less({
        paths: [path.join(__dirname, 'node_modules/bootstrap/less')],
        plugins: [cleancss]
      }))
      .on('error', function(err) {
        gutil.log(gutil.colors.red(err.toString()));
      })
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(dst))
      .pipe(livereload());
  }
  return gulp.src(src)
    .pipe(less({ plugins: [cleancss] }))
    .on('error', function(err) {
      gutil.log(gutil.colors.red(err));
    })
    .pipe(minifyCSS())
    .pipe(gulp.dest(dst));
});

gulp.task('default', function(callback) {
  sequence('set-env-dev', 'test', ['browserify', 'static', 'less', 'server'], 'serve', function(err) {
    if (err) {
      gutil.log(err.toString());
    }
    livereload.listen();
    gulp.watch(dirs.src.less,   ['less']);
    gulp.watch(dirs.src.static, ['static']);
    gulp.watch(dirs.src.server, ['serve']);
    gulp.watch(dirs.src.test,   ['test']);
  });
});

gulp.task('build', function(callback) {
  return sequence(['clean', 'set-env-prod'], ['test'], ['less', 'browserify', 'static', 'server'], callback);
});

gulp.task('clean', function(callback) {
  del(['dist'], callback);
});

gulp.task('test', function() {
  return gulp.src(dirs.src.test)
    .pipe(jasmine({
      verbose: true,
      includeStackTrace: true,
      reporter: new jasmineReporters.TerminalReporter({
        isVerbose : true,
        includeStackTrace : true,
        showColors : true
      })
    }));
});
