var lumajs = require('../index');
var pack = require('./gulp-luma-pack');
var luma_incr = require('./gulp-luma-incr');
var luma_js = require('./gulp-luma-js');
var gulp = require('gulp');
var path=require('path');

// gulp.task('mod', function () {
//     return gulp.src(['./sample/src/index.js'])
//         .pipe(luma_js())
//         .pipe(gulp.dest('./sample/src/dist'));
// })

gulp.task('mod', function () {
    var verpath = './sample/src/dist'
    return gulp.src(['./sample/src/index.js'])
        .pipe(lumajs.mod())        
        .pipe(gulp.dest(verpath))
        .pipe(lumajs.rev())
        .pipe(lumajs.rev.manifest({
            base:verpath,
            merge:true
        }))
        .pipe(gulp.dest(verpath))
        .pipe(lumajs.rev.version())
        .pipe(gulp.dest(verpath));
})

// gulp.task('pack', function () {
//     return gulp.src(['./test/test/index.js'])
//         .pipe(pack({
//             // base: './test/',
//             ignore: ['jquery']
//         }))
//         .pipe(gulp.dest('./dist'));
// })

// gulp.task('incrjs', function () {
//     return gulp.src(['./sample/src/index.js'])
//         .pipe(luma_incr.js({
//             // base: './test/',
//             lumajsConfig: {
//                 baseUrl: 'http://localhost:8081/dist/',
//                 // comboHandler:'http://localhost:3000/',
//                 localStore: true
//             },
//             suffix: '.incr'
//         }))
//         .pipe(gulp.dest('./dist'));
// });
// gulp.task('incrhtml', function () {
//     return gulp.src(['./sample/src/index.js'])
//         .pipe(luma_incr.html({
//             main: path.resolve(__dirname, '../sample/src/index_incr.html')
//         }))
//         .pipe(gulp.dest('./dist'));
// });
// gulp.start('incrjs','incrhtml');
gulp.start('mod');
// lumajs.incr({
//     base: './test/',
//     entry: ['./index.js'],
//     output: './dist',
//     main:'./index.html'
// }, function (results) {
//     debugger;
//     callback && callback();
// });


// lumajs.pack({
//     base: './test/',
//     entry: ['./index.js'],
//     output: './dist',
//     ignore:['jquery']
// }, function () {
//     callback && callback();
// });


// var fs=require('fs');
// fs.readFile('./test/moduleB/dog.js','utf-8',function(err,content){
//     fs.writeFile('./dist/moduleB/dog1.js','utf-8',function(err){
//         console.log(err);
//     });
// });