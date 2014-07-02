var gulp = require('gulp'),
	stylus = require('gulp-stylus');
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    connect = require('gulp-connect'),

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
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
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