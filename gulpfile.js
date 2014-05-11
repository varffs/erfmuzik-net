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

gulp.task('styles', function() {
  return gulp.src('src/css/main.styl')
    .pipe(stylus())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(notify({ message: 'Styles task complete' }));
});

gulp.task('jslib', function() {
  return gulp.src('src/js/lib/*.js')
    .pipe(concat('lib.js'))
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'))
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
    .pipe(notify({ message: 'Scripts task complete' }));
});

gulp.task('watch', function() {

  gulp.watch('src/css/*.styl', ['styles']);
  gulp.watch('src/js/main.js', ['scripts']);
  gulp.watch('src/js/lib/*.js', ['jslib']);
/*   gulp.watch('src/images/*', ['images']); */

});

gulp.task('default', function() {

	gulp.start('styles', 'scripts', 'jslib');

});