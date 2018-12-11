
/**
 * 模块分析
 * 生成模块映射文件
 * {
        "name": '',
        "version": "",
        "main": '',
        "dependencies": {}
    }
 */
var revHash = require('rev-hash');
var resolve = require('./resolve.js');
var fs = require('fs');
var path = require('path');

// function _isType(type) {
//     return function (obj) {
//         return {}.toString.call(obj) == "[object " + type + "]";
//     }
// }

// var _isObject = _isType("Object");
// var _isString = _isType("String");
// var _isArray = Array.isArray || _isType("Array");
// var _isFunction = _isType("Function");
// var _isUndefined = _isType("Undefined");

function version(options) {
    var me = this;
    me.base = options.base || '';
    me.main = options.entry || '';

    if (!Array.isArray(this.main)) {
        this.main = [this.main];
    }

    return this.main.map(function (entry) {
        var resolor = new resolve({
            base: me.base,
            entry: entry
        });

        var deps = resolor.parse();
        var mainName=path.relative(me.base, entry);
        var map = {
            name:mainName,
            main: mainName,
            version: '',
            dependencies: {}
        }

        deps.forEach(function (dep) {
            var content = fs.readFileSync(dep);
            var name=path.relative(me.base, dep);
            name=name.replace(/\\/g,'/');
            map.dependencies[name] = revHash(content);
        })
        var mapBuffer = new Buffer(JSON.stringify(map));

        map.version = revHash(mapBuffer);

        return map;
    })
}


module.exports = version;