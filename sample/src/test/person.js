define(function (require, exports, module) {
    var hello = require('./hello.js');
    var world = require('./world.js');
    var dog = require('./dog.js');
    module.exports = {
        say: function () {
            return '【person:' + hello.say() + world.say() + dog.say() + '】';
        }
    };
});