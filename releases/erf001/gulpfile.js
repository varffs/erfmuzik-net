var gulp = require('gulp');

var stylus = require('gulp-stylus');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');

var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');

var imagemin = require('gulp-imagemin');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var notify = require('gulp-notify');
var cache = require('gulp-cache');
var connect = require('gulp-connect');

/* SERVER */

gulp.task('connect', function() {
  connect.server({
    root: './',
    port: 8008,
    livereload: true
  });
});

gulp.task('html', function () {
  gulp.src('./*.html')
    .pipe(connect.reload())
    .pipe(notify({ message: 'HTML task complete' }));
});

/* STYLES */

gulp.task('styles', function() {
  return gulp.src('src/css/main.styl')
    .pipe(stylus())
    .pipe(autoprefixer('last 2 version'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(connect.reload())
    .pipe(notify({ message: 'Styles task complete' }));
});

/* JS */

gulp.task('jslib', function() {
  return gulp.src('src/js/lib/*.js')
    .pipe(concat('lib.js'))
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(connect.reload())
    .pipe(notify({ message: 'Lib task complete' }));
});

gulp.task('scripts', function() {
  return gulp.src('src/js/main.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(connect.reload())
    .pipe(notify({ message: 'Scripts task complete' }));
});

/* WATCH */

gulp.task('watch', function() {

  gulp.watch('src/css/*.styl', ['styles']);
  gulp.watch('src/js/main.js', ['scripts']);
  gulp.watch('src/js/lib/*.js', ['jslib']);
  gulp.watch(['./build/*.html'], ['html']);

});

gulp.task('default', ['connect', 'watch']);