define(function (require, exports, module) {
    var dog = require('./dog.js');
    exports.say = function () {
        return 'hello ' +dog.say();
    };
});



//define('dog', [], "var hello=require('hello');module.exports = {say: function () {return hello.say()+'wang!';}};");
