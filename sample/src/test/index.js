// seajs.use('./person.js', function (p) {
//     console.log(p.say());
// })


lumajs.setConfig({
    // baseUrl:'http://localhost:8081/test/test/',
    env:'development'
});

require(['./person.js'], function (person) {
    var text=person.say();
    console.log(text);
}); 

// require(['./person.js'], function (person) {
//     var text=person.say();
//     console.log(text);
// }); 


// define('./dog.js',function (require, exports, module) {
//     exports.say = function () {
//         return 'dog:wang! ';
//     };
// });


// define('./pig.js', function (require, exports, module) {
//     var dog = require('./dog.js');
//     exports.say = function () {
//         return 'pig:heng heng! ' + dog.say();
//     };
// });

// define('./hello.js',function (require, exports, module) {
//     var dog = require('./dog.js');
//     exports.say = function () {
//         return 'hello ' +dog.say();
//     };
// });

// define('./world.js',function (require, exports, module) {
//     var dog = require('./dog.js');
//     var pig = require('./pig.js');
//     module.exports = {
//         say: function () {
//             return 'world:' + dog.say() + pig.say();
//         }
//     };
// });

// define('./person.js',function (require, exports, module) {
//     var hello = require('./hello.js');
//     var world = require('./world.js');
//     module.exports = {
//         say: function () {
//             return 'person:' +hello.say()+ world.say();
//         }
//     };
// });

// require(['./person.js'], function (person) {
//     var text=person.say();
//     console.log(text);
// }); 