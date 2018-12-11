/**
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
var revHash = require('rev-hash');
var revPath = require('rev-path');
var modifyFilename = require('modify-filename');
var resolve = require('./resolve.js');
var version = require('./version.js');

var plugin = function (options) {
    var pathMap = {};
    var pathCwd = '';
    var pathBase = '';
    var filePaht = '';
    var mapfile = {
        "name": options.name || '',
        "version": "",
        "main": options.main || '',
        "dependencies": {}
    };
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError('gulp-rev', 'Streaming not supported'));
            return;
        }


        if (!pathCwd) {
            console.log(file.cwd);
            pathCwd = file.cwd;
        }

        // Normalize the base common to all the files
        if (!pathBase) {
            console.log(file.base);
            pathBase = file.base;

        }

        
        this.push(new gutil.File({
            cwd: pathCwd,
            base: pathBase,
            path: path.join(pathBase, map.name, +'.json'),
            contents: new Buffer(JSON.stringify(map, null, 2))
        }));

        // pathMap[path.parse(file.path).base] = revHash(file.contents);
        // console.log(pathMap);

        cb();
    });
};

module.exports = plugin;
