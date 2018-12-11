define(function (require, exports, module) {
    var imgurl = 'url';
    var img = 'base64';
    if (img == '')
        module.exports = imgurl;
    else
        module.exports = img;
});