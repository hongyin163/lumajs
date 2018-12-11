define(function (require, exports, module) {
    var dog = require('./dog.js');
    exports.say = function () {
        return 'pig:heng heng! '+dog.say();
    };
});

