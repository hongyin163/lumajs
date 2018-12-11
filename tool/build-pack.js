/**
 * 提供功能：
 * 模块名称补全，
 * 模块打包，
 * css资源打包提取
 */
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');


var _options = {
    package: {},
    base: process.cwd(),
    output: '',
    ignore: [],
    filename: '',
    config: null
}


//根据map文件，处理依赖的模块
var map = {
    "name": "./index.js", "main": "./index.js", "version": "651604bc67", "dependencies":
    {
        "person.js": "9d247173f7", "hello.js": "0ec6aa562b", "dog.js": "101516df17", "cat.js": "f5dfa1058f", "fish.js": "0edd20c478", "moduleA/moduleC/bus.js": "43445e9959", "moduleA/car.js": "a78f1c76ac", "moduleB/tree.js": "105945110a", "moduleB/dog.js": "ea9191a738", "world.js": "2023950628", "pig.js": "91aaf9976f", "person1.js": "2144df3d39",
        "adam.js": "7fd087a951"
    }
};
function readFile(filePath) {
    return new Promise(function (resole, reject) {
        var p = path.resolve(_options.base, filePath)
        fs.readFile(p, 'utf-8', function (error, content) {
            if (error) {
                reject(error);
            } else {
                resole([filePath, content]);
            }
        });
    })
}
function saveFile(filePath, content) {
    fs.writeFile(filePath, content, function (err) {

    });
}
function normalizeModCodeToJs(content, filePath) {
    var matchs = /\.\w*$/.exec(filePath);
    var ext = '';
    if (matchs && matchs.length > 0) {
        ext = matchs[0];
    }
    switch (ext) {
        case '.js':
            if (/^define\s*\(/.test(content)) {
                return content.replace(/^define\s*\(/, 'define(\'' + filePath + '\',');
            } else {
                return 'define(\'' + filePath + '\',function (require, exports, module) {\n' + content + '\n});\n';
            }
        case '.css':
            return 'define(\'' + filePath + '\',function () {});\n';
        default:
            return 'define(\'' + filePath + '\',function (require, exports, module) {\n module.exports=\'' + content + '\' \n});\n';
    }
}

function normalizeModCodeToCss(content, filePath) {
    return content;
}

function normalizeModToJs(fileContents) {
    var results = [];
    fileContents.forEach(function (contents) {
        var file = contents[0];
        var content = contents[1];
        results.push(normalizeModCodeToJs(content, file));
    });
    return results;
}

function normalizeModToCss(fileContents) {
    var results = [];
    fileContents.forEach(function (contents) {
        var file = contents[0];
        var content = contents[1];
        results.push(normalizeModCodeToCss(content, file));
    });
    return results;
}
//打包，提取模块依赖的js/css，
function pkgMod(callback) {
    var js = [], css = [];
    var files = [];
    for (var m in _options.package.dependencies) {
        files.push(m);
    }
    var ignore = _options.ignore;
    var file = files.pop();
    debugger;
    loopfile:
    while (file) {
        if (ignore.length > 0) {
            for (var i = 0; i < ignore.length; i++) {
                if (file.indexOf(ignore[i]) >= 0) {
                    file = files.pop();
                    continue loopfile;
                }
            }
        }

        var matchs = /\.\w+$/.exec(file);
        if (matchs.length == 0) {
            return;
        }
        switch (matchs[0]) {
            case '.js':
                js.push(file);
                break;
            case '.css':
                css.push(file);
                break;
        }
        file = files.pop();
    }



    Promise.all([
        jsTask(_options.package.main.replace('.js', '.pkg.js'), js.concat(css)),
        cssTask(_options.package.main.replace('.js', '.pkg.css'), css)
    ]).then(function (result) {
        callback && callback(null, result);
    }).catch(function (err) {
        callback && callback(err);
    });
}
function jsTask(filePath, files) {
    return new Promise(function (resole, reject) {
        comboFile(files, normalizeModToJs, function (err, content) {
            if (err) {
                reject(err);
            } else {

                var main = fs.readFileSync(path.resolve(_options.base, _options.package.main), 'utf-8');

                if (_options.config) {
                    var config = 'lumajs.config(' + JSON.stringify(_options.config) + ');';
                    main = main.replace(/lumajs.config(\(\s*\{)[^(\}\*\))]*(\}\s*\));{0,1}/g, config);
                } else {
                    main = main.replace(/lumajs.config(\(\s*\{)[^(\}\*\))]*(\}\s*\));{0,1}/g, '');
                }
                //移除config

                content = content + '\n' + main;
                if (!_options.output) {
                    resole(content);
                } else {
                    if (_options.filename) {
                        filePath = path.join(path.dirname(filePath), filename);
                    }
                    fs.writeFile(path.resolve(_options.output, filePath), content, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resole(content);
                        }
                    });
                }
            }
        });
    });
}

function cssTask(filePath, files) {
    return new Promise(function (resole, reject) {
        comboFile(files,normalizeModToCss, function (err, content) {
            if (err) {
                reject(err);
            } else {
                if (!_options.output) {
                    resole(content);
                } else {
                    fs.writeFile(path.resolve(_options.output, filePath), content, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resole(content);
                        }
                    });
                }
            }
        });
    });
}
function comboFile(files, normalizeFunc, callback) {
    var ps = [];
    files.forEach(function (file) {
        ps.push(readFile(file));
    })

    Promise.all(ps).then(function (result) {

        callback && callback(null, normalizeFunc(result).join('\n'));

    }).catch(function (err) {
        console.log(err);
        callback && callback(err)
    });
}

//模块打包,
function pack(opts, callback) {
    _options = Object.assign(_options, opts)
    pkgMod(callback);
}

module.exports = pack