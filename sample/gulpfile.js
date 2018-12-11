var gulp = require('gulp'),
    path = require('path'),
    gls = require('gulp-live-server'),
    cmd = require('gulp-cmd'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    fs = require('fs'),
    syncy = require('syncy'),
    fileinclude = require('gulp-file-include'),
    replace = require('gulp-replace'),
    babel = require("gulp-babel");
var lumajs = require('../index');
//压缩
gulp.task('modpack', function () {
    return gulp.src(['./src/index.js'])
        .pipe(lumajs.pack({
            base: './src/',
            config: {
                baseUrl: 'http://localhost:8081/dist/',
                // comboHandler:'http://localhost:3000/',
                localStore: false,
                externals: {
                    'React': 'React'
                }
            },
            ignore: ['jquery', 'React'],
            suffix: '.min'
        }))
        .pipe(gulp.dest('./src/dist'));
})

gulp.task('modifihtmlforpack', function () {
    return gulp.src('./src/index_pack.html')
        .pipe(replace('index.js', 'index.min.js'))
        .pipe(gulp.dest('./src/dist'));
});

gulp.task('syncfile', (done) => {
    syncy([
        './src/**/*',
        // '!./src/*.html',
        '!./src/dist/**'
    ], './src/dist/', { base: './src/' })
        .then(() => {
            done();
        })
        .catch((err) => {
            done(err);
        });
});


//增量
//调整入口js文件的配置，输出新的入口文件
gulp.task('incr_js', function () {
    return gulp.src(['./src/index.js'])
        .pipe(lumajs.incr.js({
            // base: './test/',
            config: {
                baseUrl: 'http://localhost:8081/dist/',
                comboHandler: 'http://localhost:3000/',
                localStore: true
            },
            suffix: '.incr'
        }))
        .pipe(gulp.dest('./src/dist'));
});
//调整入口html的，加入版本信息
gulp.task('incr_html', function () {
    return gulp.src(['./src/index.js'])
        .pipe(lumajs.incr.html({
            main: path.resolve(__dirname, './src/index_incr.html')
        }))
        .pipe(gulp.dest('./src/dist'));
});

//监听服务
gulp.task('serve', function () {
    //启动80端口作为本地web服务器
    var server = gls.static('./src/', 8081);
    server.start();
    //监听文件目录
    gulp.watch([
        path.resolve(__dirname, './src/*.js'),
        path.resolve(__dirname, './src/*.css'),
        path.resolve(__dirname, './src/*.html')
    ], function (file) {
        // console.log(file.path);
        gulp.start('mod', function () {
            server.notify.apply(server, [{ path: file.path + '.js' }]);
        });
    });
});
//监听服务
gulp.task('serve_pack', function () {
    //启动80端口作为本地web服务器
    var server = gls.static('./src/', 8081);
    server.start();
    //监听文件目录
    gulp.watch([
        path.resolve(__dirname, './src/*.js'),
        path.resolve(__dirname, './src/*.css'),
        path.resolve(__dirname, './src/*.html')
    ], function (file) {

        gulp.start('syncfile', 'modpack', 'modifihtmlforpack', function () {
            server.notify.apply(server, [file]);
        });
    });
});


gulp.task('serve_incr', function () {
    //启动80端口作为本地web服务器
    var server = gls.static('./src/', 8081);
    server.start();
    //监听文件目录
    gulp.watch([
        path.resolve(__dirname, './src/*.js'),
        path.resolve(__dirname, './src/*.css'),
        path.resolve(__dirname, './src/*.html')
    ], function (file) {

        gulp.start('syncfile', 'incr_js', 'incr_html', function () {
            server.notify.apply(server, [file]);
        });
    });
});

gulp.task('lib', function () {
    return gulp.src(['../dist/luma.js', '../dist/luma.min.js'])
        .pipe(gulp.dest('./src/lib'));
})

gulp.task('jsx', () =>
    gulp.src('src/**/*.js')
        .pipe(babel({
            plugins: ['babel-plugin-transform-react-jsx']
        }))
        .pipe(gulp.dest('src/dist'))
);

gulp.task('mod', function () {
    var verpath = './src/dist/'
    return gulp.src(['./src/index.js'])
        .pipe(lumajs.mod({
            ignore: ['jquery', 'React']
        }))
        .pipe(gulp.dest(verpath))
        .pipe(lumajs.rev())
        .pipe(lumajs.rev.manifest())
        .pipe(gulp.dest(verpath))
        .pipe(lumajs.rev.version())
        .pipe(gulp.dest(verpath));
})

gulp.task('version', function () {
    var verpath = path.resolve(__dirname, './release/');
    return gulp.src(['./src/dist/**/*'])
        .pipe(gulp.dest(verpath))
        .pipe(lumajs.rev())
        .pipe(lumajs.rev.manifest())
        .pipe(gulp.dest(verpath))
        .pipe(lumajs.rev.version())
        .pipe(gulp.dest(verpath));
})
//和旧版本比较，获取修改和新增的文件打包成zip

gulp.task('diff', ['mod'], function (callback) {
    lumajs.diff({
        folder: path.resolve(__dirname, './data/'),
        releaseFolder: path.resolve(__dirname, './src/dist/'),
    }, function () {
        callback && callback();
    })
});
//默认的任务，执行全部的构建任务
gulp.task('pack', function () {
    gulp.start('syncfile', 'modpack', 'modifihtmlforpack', 'serve_pack');
});

gulp.task('incr', function () {
    gulp.start('syncfile', 'incr_js', 'incr_html', 'serve_incr');
});

gulp.task('default', function () {
    gulp.start('mod', 'serve');
})



