define(function (require, exports, module) {
    exports.say = function () {
        var cat = require('./cat.js');
        return 'dog:wang! ' + cat.say();
    };
});

