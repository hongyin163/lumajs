define(['./dog'], function (dog, require, exports, module) {
    // var dog=require('./dog');
    // debugger;
    dog.say();
    exports.say = function () {
        return 'fish:mmmmm!mmmmm!mmmm';
    };
});