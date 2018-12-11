define(function (require, exports, module) {
    require('./world.css');
    module.exports = {
        say: function () {
            return 'world:' ;
        }
    };
});