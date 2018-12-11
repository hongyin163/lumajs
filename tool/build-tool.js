/**
 * 模块构建，包括：
 * 1、模块压缩
 * 2、模块版本文件生成
 */
var pack = require('./build-pack');
var version = require('./build-map');
var incr = require('./build-incr');

module.exports = {
    pack: pack,
    version: version,
    incr: incr
};