define(function (require, exports, module) {
    var bus = require('./moduleA/moduleC/bus.js');
    var a=1;
    exports.say = function () {
        return 'cat:miaomiao!' 
    };
});