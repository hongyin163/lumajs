define(function (require, exports, module) {
    var dog = require('./dog.js');
    var pig = require('./pig.js');
    module.exports = {
        say: function () {
            return 'world:' + dog.say() + pig.say();
        }
    };
});