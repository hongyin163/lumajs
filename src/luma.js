(function (glb) {
    /**模块映射表 */
    var _context = {},
        _commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg,
        _cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        _cfx = {
            ONLYJS: true,
            type: 'amd',
            externals: {},
            env: 'production'
        },
        //如果define执行是不能获取模块名，暂时保存依赖和模块代码，后续onload时获取名称，加载模块依赖
        _currentDefine = {},
        _package = '',
        currentlyAddingScript = '';
    var doc = document;
    var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
    var baseElement = head.getElementsByTagName("base")[0];

    var _ROOT = 0;
    var _ENV = {
        development: 'development',
        production: 'production'
    }
    var util = _include('./util.js');
    var storage = _include('./storage.js');
    var Mod = _include('./module.js');
    var loaderManager = _include('./loader_manage.js');
    var loader = _include('./loader.js');
    var version = _include('./version.js');

    function getRootId() {
        return 'ROOT' + (++_ROOT);
    }

    function commentReplace(match, singlePrefix) {
        return singlePrefix || '';
    }
    var interactiveScript;
    function getCurrentScript() {
        if (currentlyAddingScript) {
            return currentlyAddingScript
        }

        // For IE6-9 browsers, the script onload event may not fire right
        // after the script is evaluated. Kris Zyp found that it
        // could query the script nodes and the one that is in "interactive"
        // mode indicates the current script
        // ref: http://goo.gl/JHfFW
        if (interactiveScript && interactiveScript.readyState === "interactive") {
            return interactiveScript
        }

        var scripts = head.getElementsByTagName("script")

        for (var i = scripts.length - 1; i >= 0; i--) {
            var script = scripts[i]
            if (script.readyState === "interactive") {
                interactiveScript = script
                return interactiveScript
            }
        }
    }

    //分析模块名称，返回uri
    //abc||./abc=>abc.js
    //./js/aa=>
    function parseName(name, baseUrl) {
        if (_cfx.externals[name]) {
            return name;
        }

        baseUrl = baseUrl || _cfx.baseUrl;

        if (/^(http|https|file):\/\//.test(name)) {
            return name;
        } else if (baseUrl) {
            if (name == 'root') {
                return name;
            }
            //baseurl:http://localhost/sss/

            //../../js/..//../ss/./../p.js
            //如果模块名没有后缀，默认.js，
            name = normlizeName(name);

            //绝对路径
            if (name.substring(0, 1) == '/') {
                var reg_pro = /^(?:http|https|file):\/\/[^\/]*/;
                name = reg_pro.exec(baseUrl)[0] + name;
            } else {
                name = baseUrl + name;

                //aaa/./ad/aaa/ss.js=>ad/aaa/ss.js
                name = name.replace(/\/\.\//g, '/');

                //../../b/c.js=>bbb/aaa/../../b/c.js
                var regx = /\/[^/]+\/\.\.\//;
                while (name.match(regx)) {
                    name = name.replace(regx, "/")
                }
            }
            return name;
        }
        return name;
    }

    function removeBase(uri) {
        var baseUrl = _cfx.baseUrl;
        return uri.replace(baseUrl, './');
    }
    function normlizeName(name) {
        if (_cfx.ONLYJS) {
            return /\.js$/.test(name) ? name : name + '.js';
        }
        return /\.\w*$/g.test(name) ? name : name + '.js';
    }

    function define(name, deps, callback) {
        if (typeof name !== 'string') {
            callback = deps;
            deps = name;
            name = null;
        }

        if (!util.isArray(deps)) {
            callback = deps;
            deps = [];
        }
        //name命名，用script加载过程中，当前正在加载的uri。
        //Try to derive uri in IE6-9 for anonymous modules
        if (!name) {
            if (doc.attachEvent && typeof getCurrentScript !== "undefined") {
                var script = getCurrentScript()

                if (script) {
                    name = script.src
                }

                // NOTE: If the id-deriving methods above is failed, then falls back
                // to use onload event to get the uri
            }
            if (document.currentScript) {
                name = document.currentScript.src;
            }
        }
        // var exports = {}, module = {};
        if (util.isFunction(callback)) {

            callback
                .toString()
                .replace(_commentRegExp, commentReplace)
                .replace(_cjsRequireRegExp, function (match, dep) {
                    deps.push(dep);
                });
            var def = { name: name, deps: deps, factory: callback };
            if (name) {
                var m = Mod.getOrCreate(def.name, {
                    deps: def.deps,
                    factory: def.factory
                })

                m.save();
            } else {
                _currentDefine = def;
            }
        }
    }


    function require(deps, callback) {
        //加载依赖
        if (!util.isArray(deps)) {
            callback = deps;
            deps = null;
        }
        if (util.isFunction(callback)) {

            if (!deps) {
                callback && callback();
                return;
            }

            var root = Mod.getOrCreate(getRootId(), {
                base: _cfx.baseUrl,
                deps: deps,
                factory: callback
            });

            root.on('loaded', function () {
                var params = root.getDepModules();
                callback && callback.apply(_context, params);
            });
            root.load();
        }
    }

    function async(deps, callback) {
        setTimeout(function () {
            if (util.isString(deps)) {
                deps = [deps];
            }

            require(deps, callback);
        }, 1);
    }

    function install(pkg) {
        _package = pkg;
    }
    glb.lumajs = {};
    glb.lumajs.config = function (config) {

        _cfx.baseUrl = config.baseUrl || _cfx.baseUrl;
        var baseUrl = _cfx.baseUrl;
        if (!/^(http|https|file):\/\//.test(baseUrl)) {
            var reg_pro = /^(?:http|https|file):\/\/[^\/]*/;
            baseUrl = reg_pro.exec(window.location.href)[0] + baseUrl;
        }
        _cfx.baseUrl = baseUrl;

        _cfx.env = config.env || 'production';//devlepment    
        _cfx.localStore = config.localStore;
        _cfx.comboHandler = config.comboHandler || _cfx.comboHandler;
        _cfx.externals = config.externals || _cfx.externals;
        _cfx.type = config.type || _cfx.type;
    }
    glb.lumajs.install = install;
    define.amd = {
        jQuery: true
    }
    glb.define = define;
    glb.lumajs.use = function () {
        if (_package) {
            glb.lumajs.check(_package);
        }
        require.apply(glb, arguments);
    }
    glb.require = {};
    glb.require.async = async;
    glb.lumajs.check = version.check;

    //default config
    glb.lumajs.config({
        baseUrl: util.getBaseUrl(),
        localStore: false,
        externals: {},
        type: 'amd'//amd or cmd
    });
    glb.lumajs.setStorage = function (store) {
        if (store) { storage = store; }
    }
})(window);