var gulp = require('gulp'),
    gutil = require('gulp-util'),
    bower = require('bower'),
    resolve = require('gulp-resolve-dependencies'),
    copy = require('gulp-copy'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    replace = require('gulp-replace'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    create = require('gulp-cordova-create'),
    plugin = require('gulp-cordova-plugin'),
    android = require('gulp-cordova-build-android'),
    sh = require('shelljs');

var paths = {
  clean: ['www'],
  styles: ['static/css/styles.css'],
  scripts: ['static/js/ambilight.js'],
  images: ['static/img/**/ambilight-icons.svg', 'static/img/*.jpg'],
  templates: ['static/**/*.html']
};

var replaceMin = function(a) {
    if (false) {
        return 'min.js'
    } else {
        return 'js'
    }
};

gulp.task('default', ['scripts', 'styles', 'templates', 'images']);

gulp.task('clean', function(done) {
    gulp.src(paths.clean, {read: false})
    .pipe(clean())
    .on('end', done);
});

gulp.task('scripts', function(done) {
  gulp.src(paths.scripts)
    .pipe(replace('$min', replaceMin))
    .pipe(resolve({log:true, pattern: /\/\/=require [\s-]*(.*\.js)/g}))
    .on('error', function(err) {console.log(err.message);})
    .pipe(concat('ambilight.js'))
    .pipe(gulp.dest('www/js/'))
    .on('end', done);
});

gulp.task('images', function(done) {
    gulp.src(paths.images)
        .pipe(gulp.dest('www/img/'))
        .on('end', done);
});

gulp.task('styles', function(done) {
  gulp.src(paths.styles)
    .pipe(replace('$min', replaceMin))
    .pipe(resolve({log:true, pattern: /\* =require [\s-]*(.*\.css)/g}))
    .on('error', function(err) {console.log(err.message);})
    .pipe(concat('styles.css'))
    .pipe(gulp.dest('www/css/'))
    .on('end', done);
});

gulp.task('templates', function(done) {
  gulp.src(paths.templates)
    .pipe(gulp.dest('www/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.templates, ['templates']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('release', ['default'], function () {
    return gulp.src('www')
        .pipe(android({
            release:true,
            storeFile:'/path/to/keystore',
            keyAlias: 'ambilightApp'
        }))
        .pipe(gulp.dest('apk'))
});
