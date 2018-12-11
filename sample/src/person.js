define(function (require, exports, module) {
    require('./person.css');
    var Hello = require('./hello.js');
    var person=React.createClass({
        render:function(){            
            return (
                <div>
                    <div className="person">dd </div>
                    <div/>
                    <span>Person</span>
                    <Hello/>
                </div>
            )
        }    
    })
    module.exports = person;
});