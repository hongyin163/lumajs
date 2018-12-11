define(function (require, exports, module) {
    var dog = require('./dog.js');
    exports.say = function () {
        return 'tree:hu hu hu ! ' + dog.say();
    };
});