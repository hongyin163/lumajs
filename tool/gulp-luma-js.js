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
var build_mod = require('./build-mod.js');
var resolve = require('./resolve.js');
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

        var obj = new resolve({
            base: _options.base,
            ignore: _options.ignore,
            entry: file.path
        });

        obj.parse();

        console.log( obj.deps);

    
        var ignore = _options.ignore;
        var codes = obj.deps.map(function (dep, i) {
            if (ignore.length > 0) {
                for (var i = 0; i < ignore.length; i++) {
                    if (dep.indexOf(ignore[i]) >= 0) {
                        return false;
                    }
                }
            }

            var ext = path.extname(dep);
            if (ext == '.js') {
                return { content: build_mod.js(_options.base, dep), dir: dep };
            } else if (ext == '.css') {
                return { content: build_mod.css(_options.base, dep), dir: dep + ".js" };
            } else if (/(png|jpg|gif|webp)/.test(ext)) {
                return { content: build_mod.img(_options.base, dep), dir: dep + ".js" };
            } else if (/svg/.test(ext)) {
                return { content: build_mod.svg(_options.base, dep), dir: dep + ".js" };
            }
        });

        codes.push({ content: build_mod.js(_options.base, file.path), dir: file.path });

        var jsPath;
        codes.map(function (code) {
            if (!code) { return; }

            jsPath = path.resolve(_options.base, code.dir);

            me.push(new gutil.File({
                cwd: pathCwd,
                base: _options.base,
                path: jsPath,
                contents: new Buffer(code.content)
            }));
        });
        cb();
    });
};

module.exports = plugin;
