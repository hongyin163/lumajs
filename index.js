
var gulp_luma_incr = require('./tool/gulp-luma-incr.js');
var gulp_luma_pack = require('./tool/gulp-luma-pack.js');
var gulp_luma_js = require('./tool/gulp-luma-js');
var gulp_luma_rev = require('./tool/gulp-luma-rev');
var luma_diff = require('./tool/build-diff');
module.exports = {
    //分析入口文件依赖，模块打包
    pack: gulp_luma_pack,
    //生成package版本文件，
    incr: gulp_luma_incr,
    //将图片，css转换成图片
    mod: gulp_luma_js,
    //输出md5版本号
    rev: gulp_luma_rev,
    //提供diff方法，可以针对发布的文件做diff操作，提取变化的模块打包成zip
    diff: luma_diff
}