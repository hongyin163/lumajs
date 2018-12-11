/**
 * cmd模块处理
 * 包括：
 * 1、模块名补全
 * 2、commonjs规范补全define方法
 * 有两种构建模式：
 * 一种打包模式，多个模块打成一个包，md5版本控制
 * 一种是利用版本映射文件+combo服务模式，前端利用Loader增量更新（combo服务不是必须，最好有这种服务）
 * 一种是利用版本映射文件，无combo服务模式
 */

var fs = require('fs');
var path = require('path');
var buildmap = require('./build-map.js');

var _options = {
    base: './',
    entry: [],
    output: '',
    main: './',
    config:null
};

function _generateMainFile(entry, map, callback) {
    var entryPath = path.resolve(_options.base, entry);

    var content = 'lumajs.install(\'' + JSON.stringify(map) + '\');';
    content = '<script>' + content + '</script>';

    fs.readFile(entryPath, 'utf-8', function (err, file) {
        if (err) {
            callback && callback(err);
            return;
        }
        content = file.replace(/<\/head>/, function () {
            return content + '\n</head>';
        })
        if (!_options.output) {
            callback && callback(null, content);
        } else {
            fs.writeFile(path.resolve(_options.output, entry), content, function (err) {
                if (!err) {
                    callback && callback(null, content);
                } else {
                    callback && callback(err);
                }
            })
        }
    })
}
function _copyFile(filePath) {
    return new Promise(function (resole, reject) {
        fs.readFile(path.resolve(_options.base, filePath), 'utf-8', function (err, content) {
            if (err) {
                reject(err);
                return
            }

            var target = path.resolve(_options.output, filePath);
            var dir = path.dirname(target);
            _createDir(dir);

            fs.writeFile(path.resolve(_options.output, filePath), content, function (err) {
                if (err) {
                    reject(err)
                } else {
                    resole();
                }
            });
        })
    });
}
function _createDir(dir) {
    if (fs.existsSync(dir)) {
        return;
    }
    var dirs = dir.split(path.sep);
    var dirTmp = dirs.shift();
    while (dirTmp) {
        if (!fs.existsSync(dirTmp)) {
            fs.mkdirSync(dirTmp);
        }
        if (dirs.length == 0) {
            break;
        }
        dirTmp += (path.sep + dirs.shift());
    }

}
function _normalizeFile(filePath) {
    return new Promise(function (resole, reject) {
        var p = path.resolve(_options.base, filePath)
        fs.readFile(p, 'utf-8', function (error, content) {
            if (error) {
                reject(error);
            } else {
                var target = path.resolve(_options.output, filePath);
                var dir = path.dirname(target);
                _createDir(dir);

                var content = _normalizeModName(content, filePath);
                fs.writeFile(path.resolve(_options.output, filePath), content, function (err) {
                    if (err) {
                        reject(err)
                    } else {
                        resole();
                    }
                });
            }
        });
    })
}
function _normalizeModName(content, filePath) {
    if ((/\.js$/).test(filePath)) {
        if (/^define\s*\(/.test(content)) {
            return content.replace(/^define\s*\(/, 'define(\'' + filePath + '\',');
        } else {
            return 'define(\'' + filePath + '\',function (require, exports, module) {\n' + content + '\n});\n';
        }
    } else {
        return content;
    }
}


var _haveCopy = {};
function _copyFileToDist(maps, callback) {
    var files = [];
    var mains = [];
    maps.forEach(function (map) {
        if (!_haveCopy[map.main]) {
            mains.push(map.main);
            _haveCopy[map.main] = true;
        }

        if (!map.dependencies) {
            return;
        }

        for (var pro in map.dependencies) {
            if (!_haveCopy[pro]) {
                files.push(pro);
                _haveCopy[pro] = true;
            }
        }
    });

    var ps = [];
    files.forEach(function (item) {
        ps.push(_normalizeFile(item));
    });

    mains.forEach(function (item) {
        ps.push(_copyFile(item));
    });

    Promise.all(ps).then(function () {
        callback && callback()
    }).catch(function (err) {
        console.log(err);
        callback && callback(err);
    })

}
//{base:'./a',entry:[],output:'./aa/}



function gen_maps(entry) {
    return new Promise(function (resole, reject) {
        buildmap({
            base: _options.base,
            entry: entry,
            output: _options.output
        }, function (maps) {
            resole(maps);
        });
    });
}

function incr(opts, callback) {
    _options = Object.assign(_options, opts);
    var entrys = Array.isArray(_options.entry) ? _options.entry : [_options.entry];

    var ps = [];

    entrys.forEach(function (item) {
        ps.push(gen_maps(item));
    });

    Promise.all(ps).then(function (results) {
        var maps = [];
        results.map(function (result) {
            maps = maps.concat(result);
        })
        // debugger;
        //拷贝模块代码到输出目录
        // _haveCopy = {};
        // _copyFileToDist(maps, function () {
        //     //修改入口文件

        // });

        _generateMainFile(_options.main, maps, function (err, content) {
            callback && callback(err,content);
        });

    });
}


module.exports = incr