(function () {
    function log(msg) {
        if (_cfx.env == _ENV.development) {
            console.log(msg);
        }
    }

    function each(array, cb) {
        if (!isAry(array)) {
            for (var pro in array) {
                if (!cb)
                    break;

                if (cb.call(array[pro], array[pro], pro) === false) {
                    break;
                }
            }
        } else {
            for (var i = 0; i < array.length; i++) {
                if (!cb)
                    break;

                if (cb.call(array[i], array[i], i) === false) {
                    break;
                }
            }
        }
    }
    function assign(target, src) {
        if (!src) {
            return target;
        }
        if (!target) {
            target = {};
        }
        for (var pro in src) {
            target[pro] = src[pro];
        }
        return target;
    }

    function isType(type) {
        return function (obj) {
            return {}.toString.call(obj) == "[object " + type + "]";
        }
    }

    var isObj = isType("Object");
    var isStr = isType("String");
    var isAry = Array.isArray || isType("Array");
    var isFunc = isType("Function");
    var isUndef = isType("Undefined");

    function _getBaseUrl() {
        var doc = document;
        var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
        var baseElement = head.getElementsByTagName("base")[0];
        if (baseElement) {
            var url = baseElement.href;
            if (url.charAt(url.length - 1) !== '/') {
                url += '/';
            }
            return url;
        }
       
        var regx = new RegExp('(http|https|file)://([^\/]*\/)*');
        var val = regx.exec(window.location.href);
        return val[0];
    }

    function _bind(func, context) {
        return function () {
            return func.apply(context, arguments);
        }
    }

    return {
        log: log,
        assign: assign,
        each: each,
        isObject:isObj,
        isString: isStr,
        isArray: isAry,
        isFunction: isFunc,
        isUndefined: isUndef,
        getBaseUrl: _getBaseUrl,
        bind: _bind       
    }
})();
