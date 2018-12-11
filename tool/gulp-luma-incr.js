/**
 * gulp插件，提供打包功能
 *//**
* 模块版本映射文件生成
* 包括：
* 1、生成每个模块名和每个模块md5版本的映射
* 2、生成整个文件的md5版本，优先检查整个md5版本
* 3、
*/
'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var pack = require('./build-pack');
var version = require('./build-map');
var incr = require('./build-incr');

var js = function (options) {
    var pathMap = {};
    var pathCwd = '';
    var pathBase = '';
    var filePath = '';
    var _options = {
        base: '',
        entry: [],
        output: '',
        ignore: [],
        suffix: '',
        config: null
    };
    _options = Object.assign(_options, options);

    return through.obj(function (file, enc, cb) {
        //file模块入口文件
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError('gulp-luma-incr', 'Streaming not supported'));
            return;
        }

        if (!_options.base) {
            _options.base = file.base;
        }


        if (!pathCwd) {
            // console.log(file.cwd);
            pathCwd = file.cwd;
        }
        var me = this;
        var content = file.contents.toString();
        var config = 'lumajs.config(' + JSON.stringify(_options.config) + ');';
        content = content.replace(/lumajs.config(\(\s*\{)[^(\}\*\))]*(\}\s*\));{0,1}/g, config);
        var extName = path.extname(file.path);
        me.push(new gutil.File({
            cwd: pathCwd,
            base: _options.base,
            path: path.resolve(_options.base, path.basename(file.path, extName) + _options.suffix + extName),
            contents: new Buffer(content, 'utf-8')
        }));

        cb && cb();
    });
};


var html = function (options) {
    var pathMap = {};
    var pathCwd = '';
    var pathBase = '';
    var filePath = '';
    var _options = {
        base: '',
        entry: [],
        output: '',
        ignore: [],
        suffix: '',
        config: null
    };
    _options = Object.assign(_options, options);

    return through.obj(function (file, enc, cb) {
        //file模块入口文件
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError('gulp-luma-incr', 'Streaming not supported'));
            return;
        }

        if (!_options.base) {
            _options.base = file.base;
        }


        if (!pathCwd) {
            // console.log(file.cwd);
            pathCwd = file.cwd;
        }
        var me = this;

        var target = path.resolve(_options.base, _options.main);
 
        _options.entry.push(file.path);

        incr(_options, function (err, content) {

            if (err) {
                cb && cb();
                return;
            }
            me.push(new gutil.File({
                cwd: pathCwd,
                base: _options.base,
                path: target,
                contents: new Buffer(content, 'utf-8')
            }));

            cb && cb();
        });
    });
};

module.exports = { js: js, html: html }
