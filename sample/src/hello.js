define(function (require, exports, module) {
    require('./hello.css');
    var world = require('./moduleB/dog.js');
    // var fish = require('./fish.js');

    var hello = React.createClass({

        render: function () {

            return (
                <div>
                    测试
                </div>
            )
        }
    });

    module.exports=hello;
});


