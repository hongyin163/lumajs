/**
 * 模块依赖分析
 * 根据入口js文件，分析依赖的js模块
 */
var fs = require('fs');
var path = require('path');

var _regRequireDeps = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
    _regDefineDeps = /[require|define|use]\s*\(.*\[([^\]]*)\]/g,
    _commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg,
    _regAsyncDeps = /[require|define|use|require\.async]\s*\(.*\[([^\]]*)\]/g;

function _commentReplace(match, singlePrefix) {
    return singlePrefix || '';
}

function resolve(options) {
    //入口，必须
    this.entry = options.entry;
    if (!this.entry) {
        throw new Error('not set  main entry file');
    }

    //目录，默认main的dir
    this.base = options.base;
    if (!this.base) {
        this.base = process.cwd();
    }

    if (!path.isAbsolute(this.base)) {
        this.base = path.resolve(process.cwd(), this.base);
    }

    if (!path.isAbsolute(this.entry)) {
        this.entry = path.resolve(this.base, this.entry);
    }

    this.map = {};
    this.deps = [];
    // this.asyncDeps = [];
}

resolve.prototype = {
    parseAll: function (mainPath) {
        var me = this;

        var deps = me.parseDeps(mainPath);

        if (deps && deps.length <= 0) {
            return;
        }
        if (deps && deps.length > 0) {

            deps.forEach(function (dep) {

                if (!me.map[dep]) {
                    me.map[dep] = true;

                    me.deps.push(dep);
                }

                me.parseAll(dep);
            });

        }
    },
    parseDeps: function (filePath) {
        var me = this;
        var fileInfo = path.parse(filePath);
        var dir = fileInfo.dir;
        var content = fs.readFileSync(filePath, 'utf-8');
        var deps = [];
        content
            .replace(_commentRegExp, _commentReplace)
            .replace(_regDefineDeps, function (match, dep) {
                if (!dep) {
                    return;
                }
                dep.replace(/['"]([^'"]*)['"]/g, function (match, d) {
                    deps.push(path.resolve(dir, me.normlizeName(d)));
                });

            }).replace(_regRequireDeps, function (match, dep) {
                deps.push(path.resolve(dir, me.normlizeName(dep)));
            })
        return deps;
    },
    normlizeName: function (name) {
        return /\.\w*$/g.test(name) ? name : name + '.js';
    },
    resolvePath: function (filePath) {
        //转换路径到绝对路径

        if (path.isAbsolute(filePath))
            return filePath;

        if (!path.isAbsolute(this.base)) {

        }

        return path.resolve(this.base, filePath);
    },
    removeBase: function (filePath) {
        filePath.replace(this.base)
    },
    parse: function () {
        var me = this;
        var mainFile = me.normlizeName(me.entry);
        me.parseAll(mainFile);

        //把入口文件加入到依赖文件中
        // var fileInfo = path.parse(mainFile);
        // var dir = fileInfo.dir;        
        // me.deps.push(path.resolve(dir, mainFile));

        return me.deps;
    }
}

module.exports = resolve;