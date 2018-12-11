var resolve = require('./resolve.js');
var build_mod = require('./build-mod.js');
var fs = require('fs');
var path = require('path');
var obj = new resolve({
    base: "./sample/src",
    entry: "./index.js"
});

obj.parse();

console.log(obj.deps);
var base = path.resolve(__dirname, '../sample/src');
var codes = obj.deps.map(function (dep, i) {
    var ext = path.extname(dep);
    if (ext == '.js') {
        return { content: build_mod.js(base, dep), dir: dep };
    } else if (ext == '.css') {
        return { content: build_mod.css(base, dep), dir: dep + ".js" };
    } else if (/[png|jpg|gif]/.test(ext)) {
        return { content: build_mod.img(base, dep), dir: dep + ".js" };
    }
});
codes.map(function (code) {

    var name = path.basename(code.dir);
    fs.writeFileSync('./sample/src/dist/' + name, code.content)
})