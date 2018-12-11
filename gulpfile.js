var gulp = require('gulp'),
    path = require('path'),
    gls = require('gulp-live-server'),
    cmd = require('gulp-cmd'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    fs = require('fs'),
    fileinclude = require('gulp-file-include');


gulp.task('uglify', ['build'], function () {
    return gulp.src(['./dist/luma.js'])
        .pipe(rename({ suffix: '.min' }))
        .pipe(uglify())    //压缩
        .on('error', function (err) {
           console.log(err);
        })
        .pipe(gulp.dest('./dist/'));  //输出
});


gulp.task('build', function () {
    return gulp.src(['./src/luma.js'])
        .pipe(fileinclude({
            prefix: '_',
            basepath: '@file'
        }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('copy',['build'], function () {
    return gulp.src(['./dist/*.js'])
        .pipe(gulp.dest('./sample/src/lib/'));  //输出
});

gulp.task('serve', function () {
    //监听文件目录
    gulp.watch([
        path.resolve(__dirname, './src/*.js')
    ], function (file) {
        console.log(file.path);
        gulp.start('copy');
    });
});

//默认的任务，执行全部的构建任务
gulp.task('default', ['uglify'], function () {
    console.log('构建完成');
});
