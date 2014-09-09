var gulp = require('gulp'),
    path = require('path'),
    concat = require('gulp-concat'),
    inject = require("gulp-inject"),
    express = require('express'),
    livereload = require('connect-livereload'),
    app = express(),
    refresh = require('gulp-livereload'),
    tinylr = require('tiny-lr')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


app.use(livereload());
app.use(express.static(__dirname));

var port = process.env.PORT || 4000;



gulp.task('livereload', function () {
  tinylr.listen(35729);
});


gulp.task('build-js', function () {
  var scripts = [
    'bower_components/underscore/underscore.js',
    'bower_components/d3/d3.min.js',
    'bower_components/topojson/topojson.js',
    'src/js/**.js'
  ];

  gulp.src(scripts)
    .pipe(concat('app.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(refresh(tinylr));
});



gulp.task('index', function () {
  var target = gulp.src('index.html');
  // It's not necessary to read the files (will speed up things), we're only after their paths:
  var sources = gulp.src([
    // duplicate changes to karma.conf.js
    './bower_components/underscore/underscore.js',
    './bower_components/angular/angular.js',
    './bower_components/d3/d3.min.js',
    './bower_components/topojson/topojson.js',

    './src/js/fixparser.js',
    './src/js/app.js',
    './src/js/**.js',
  ], {read: false});

  return target.pipe(inject(sources))
    .pipe(gulp.dest('.'));
});

gulp.task('build-css', function () {
  gulp.src('src/css/**')
    .pipe(concat('app.css'))
    .pipe(gulp.dest('public/'))
    .pipe(refresh(tinylr));
});

gulp.task('watch', function () {
  gulp.watch(['src/js/**', 'src/**.html', 'index.html'], ['index', 'build-js']);
  gulp.watch(['src/css/**'], ['build-css']);

});

gulp.task('server', function () {
  server.listen(port, function () {
    console.log('Server listening at port %d', port);
  });
  io.on('connection', function (socket) {
    connectedSocket = socket;
  });
});

gulp.task('default', [
    'build-js',
    'build-css',
    'server',
    'livereload',
    'watch'
]);
