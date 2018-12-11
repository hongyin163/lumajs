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
// var modifyFilename = require('modify-filename');
var pack = require('./build-pack');
var version = require('./build-map');
var incr = require('./build-incr');

var plugin = function (options) {
    var pathMap = {};
    var pathCwd = '';
    var pathBase = '';
    var filePath = '';
    var _options = {
        base: '',
        entry: [],
        output: '',
        ignore: [],
        package: {},
        suffix: '',
        config:null
    };
    _options = Object.assign(_options, options);

    return through.obj(function (file, enc, cb) {
        //file模块入口文件
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError('gulp-luma-pack', 'Streaming not supported'));
            return;
        }

        if (!_options.base) {
            _options.base = file.base;
        }


        if (!pathCwd) {
            console.log(file.cwd);
            pathCwd = file.cwd;
        }
        var me = this;

        version({
            base: _options.base,
            entry: file.path
        }, function (maps) {
            if (maps && maps.length <= 0) {
                cb();
                return;
            }
            _options.package = maps[0];
            pack(_options, function (err, content) {
                var extName = path.extname(file.path), jsPath = '', cssPath = '';
                if (!err) {
                    if (content[0]) {
                        jsPath = path.resolve(_options.base, path.basename(file.path, extName) + _options.suffix + extName);
                        me.push(new gutil.File({
                            cwd: pathCwd,
                            base: _options.base,
                            path: jsPath,
                            contents: new Buffer(content[0])
                        }));
                    }
                    if (content[1]) {
                        cssPath = path.resolve(_options.base, path.basename(file.path, extName) + _options.suffix + '.css')
                        me.push(new gutil.File({
                            cwd: pathCwd,
                            base: _options.base,
                            path: cssPath,
                            contents: new Buffer(content[1])
                        }));
                    }

                    cb();
                }
            });
        })

    });
};

module.exports = plugin;
