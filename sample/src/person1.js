define(['./fish.js','./pig.js','./cat.js'],function (require, exports, module) {
    var hello = require('./hello.js');
    var world = require('./world.js');
    var dog = require('./dog.js');
      var adam = require('./adam.js');
    module.exports = {
        say: function () {
            return '【person:' + hello.say() + world.say() + dog.say() + '】';
        }
    };
});