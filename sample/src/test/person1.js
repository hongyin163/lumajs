define(function (require, exports, module) {
    var hello = require('./hello.js');
    var world = require('./world.js');
    module.exports = {
        say: function () {
            return 'person:' +hello.say()+ world.say();
        }
    };
});