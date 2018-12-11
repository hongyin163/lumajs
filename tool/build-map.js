/**
 * 根据version模块生成在版本数据生成对应的目标文件。
 */
var version = require('./version.js');
var fs = require('fs');
var path = require('path');

function normlizeName(name) {
    return /\.\w*$/g.test(name) ? name : name + '.js';
}

function parseMainFile(filePath) {
    var mainRegx = /[require|define|use]\s*\(.*\[([^\]]*)\]/g;
    var commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg;
    var content = fs.readFileSync(filePath, 'utf-8');
    var mains = [];
    content
        .replace(commentRegExp, function (match, singlePrefix) {
            return singlePrefix || '';
        })
        .replace(mainRegx, function (match, a) {
            a.replace(/['"]([^'"]*)['"]/g, function (match, b) {
                mains.push(normlizeName(b));
            });
        });
    return mains;
}

function map(opts, callback){
    var base = opts.base, main = opts.entry, dist = opts.output;

    var entrys = [];
    var mains = Array.isArray(main) ? main : [main];

    mains.forEach(function (m) {
        // entrys = entrys.concat(parseMainFile(path.resolve(base, normlizeName(m))));
        entrys=entrys.concat(normlizeName(m));
    });

    var maps = version({
        base: base,
        entry: entrys
    });


    if (!dist) {
        return callback && callback(maps);
    }

    var tasks = maps.map(function (map) {
        return new Promise(function (resolve, reject) {
            var content = JSON.stringify(map);
            var filename = path.resolve(dist, map.name).replace(/\.js/g, '.json');
            fs.writeFile(filename, content, 'utf-8', function (error) {
                if (error) {
                    reject(error)
                } else {
                    resolve();
                }
            })
        });
    });

    Promise.all(tasks).then(function () {
        callback && callback(maps);
    });
}

module.exports = map