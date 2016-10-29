var gulp = require('gulp');
var serve = require('gulp-serve');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");
var webpackConfigBuild = require('./webpack.config.build.js');
var webpackConfigDev = require('./webpack.config.dev.js');

var paths = {
 scripts: ['src/*.js'],
 exampleApp: {
   source: 'example-app/src/',
   build: 'example-app/build/',
   html: ['example-app/src/index.html']
 }
};

gulp.task('example-clean', function() {
 return gulp.src(paths.exampleApp.build)
 .pipe(clean());
});

gulp.task('example-serve', serve(['example-app/build/']));

gulp.task('example-dev-server', function(callback) {
    new WebpackDevServer(webpack(webpackConfigDev), {
        debug: true,
        contentBase: './example-app/build/',
        publicPath: webpackConfigBuild.output.publicPath,
        stats: {
            colors: true
        }
    }).listen(3000, 'localhost');
});

gulp.task('build', function(callback) {
    webpack(
      webpackConfigBuild,
      function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        callback();
    });
});

gulp.task('example-build', function(){
  return gulp.src(paths.exampleApp.html)
  .pipe(gulp.dest(paths.exampleApp.build));
});

gulp.task('example', ['example-build', 'example-dev-server']);
