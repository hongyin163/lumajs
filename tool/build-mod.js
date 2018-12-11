/**
 * 将静态资源转换成js模块
 * css，png，jpg
 */
var fs = require('fs');
var bable = require('babel-core');
var path = require('path');
//图片base64编码
var _regCssDeps = /url\s*\(([^\)]*)\)/g;

var imgToJsTpl = `define(function (require, exports, module) {
    var imgurl = '{url}';
    var img = '{data}';
    if (img == '')
        module.exports = imgurl;
    else
        module.exports = 'data:image/{ext};base64,'+img;
});`
var cssToJsTpl = `define(function (require, exports, module) {    
    {require}
    require.style('{cssText}');
});`

var svgToJsTpl = `define(function (require, exports, module) {
    var imgurl = '{url}';
    var img = '{data}';
    if (img == '')
        module.exports = imgurl;
    else
        module.exports = 'data:image/svg+xml;base64,'+img;
});`
var cssToJsTpl = `define(function (require, exports, module) {    
    {require}
    require.style('{cssText}');
});`
function svgToJs(dir, url) {

    var imageBuf = fs.readFileSync(url);

    var base64str = imageBuf.toString("base64");
    var reqUrl = "./" + url.replace(dir, '').replace(/\\/g, '/')

    var name = path.basename(url) + '.js';

    return svgToJsTpl
        .replace('{name}', name)
        .replace('{url}', reqUrl)
        .replace('{data}', base64str);
}
function imgToJs(dir, url) {

    var imageBuf = fs.readFileSync(url);

    var base64str = imageBuf.toString("base64");
    var reqUrl = "./" + url.replace(dir, '').replace(/\\/g, '/')

    var name = path.basename(url) + '.js';

    return imgToJsTpl
        .replace('{name}', name)
        .replace('{url}', reqUrl)
        .replace('{ext}', path.extname(url).substring(1))
        .replace('{data}', base64str);
}
//css，依赖图片分析，
function cssToJs(dir, url) {
    var cssText = fs.readFileSync(url, 'utf-8');
    var deps = [];
    cssText.replace(_regCssDeps, function (match, dep) {
        deps.push(dep);
    });
    var reqstr = ''
    var urlToReq = {};
    deps.map(function (dep, i) {
        reqstr += "var i" + i + "= require('" + dep + "');\r\n";
        urlToReq[dep] = "i" + i;
    });
    //url(./img/p.png)
    //url('+require('')+')
    cssText = cssText.replace(/'/g, "\\'")
        .replace(/[\r\n]/g, '');

    for (var pro in urlToReq) {
        console.log(pro);
        cssText = cssText.replace(new RegExp(pro, 'g'), "'+" + urlToReq[pro] + "+'")
    }

    var name = path.basename(url) + '.js'



    return cssToJsTpl
        .replace('{name}', name)
        .replace('{require}', reqstr)
        .replace(/\{cssText\}/g, cssText);
}
//CommonJs转CMD
function jsToJs(dir, url) {
    var content = fs.readFileSync(url, 'utf-8');
    var name = "./" + url.replace(dir, '').replace(/\\/g, '/');

    name = path.basename(name);

    // if (!/lumajs.use/.test(content)) {
    //     if (/^define\s*\(/.test(content)) {
    //         //content = content.replace(/^define\s*\(/, 'define(\'' + name + '\',');
    //     } else {
    //         content = 'define(function (require, exports, module) {\n' + content + '\n});\n';
    //     }
    // }

    var obj = bable.transform(content, {
        plugins: ["transform-react-jsx"]
    });

    return obj.code;
}

module.exports = {
    img: imgToJs,
    svg: svgToJs,
    css: cssToJs,
    js: jsToJs
}