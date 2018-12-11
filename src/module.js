(function (glb) {

    var _map = {};//存储模块加载状态
    var _STATUS = {
        init: 0,
        loading: 2,
        loaded: 4,
        executing: 6,
        executed: 8,
        error: -1
    }

    //模块对象
    function Mod(options) {
        this.init(options);
        // me.loader = loaderManager.get(me.uri);
    }

    Mod.prototype.init = function (options) {
        var me = this;
        //模块的名称，标识，如果没有定义，取模块的uri。
        me.name = options.name;

        // this.depsCount = this.deps.length;
        //模块脚本uri
        me.uri = options.uri;
        //模块当前状态
        me.base = options.base;

        me.status = options.status || _STATUS.init;
        //模块的代码
        me.factory = options.factory;
        //存储模块父级模块,如果没有父亲模块，设置为自身
        // this.parent = options.parent || this;

        me.exports = null;
        me.events = {};
        me.depsCount = 0;

        //存储的是Mod实例
        me.deps = options.deps || [];
        me.remain = me.deps.length;
    }

    Mod.prototype.update = function (options) {
        var me = this;
        for (var name in options) {
            me[name] = options[name];
        }
        me.normalizeDeps();
    }

    Mod.prototype.on = function (name, cb) {
        var me = this;
        var list = me.events[name] || (me.events[name] = [])
        list.push(cb)
        return me;
    }

    Mod.prototype.off = function (name, cb) {
        var me = this;
        // Remove *all* events
        if (!(name || cb)) {
            me.events = {}
            return me;
        }

        var list = me.events[name]
        if (list) {
            if (cb) {
                for (var i = list.length - 1; i >= 0; i--) {
                    if (list[i] === cb) {
                        list.splice(i, 1)
                    }
                }
            }
            else {
                delete events[name]
            }
        }

        return me;
    }

    Mod.prototype.emit = function (name, data) {

        var me = this;
        util.log('event:' + name + ',source:' + me.name);

        var list = me.events[name];
        if (list) {
            // Copy cb lists to prevent modification
            list = list.slice();

            // Execute event cbs, use index because it's the faster.
            for (var i = 0, len = list.length; i < len; i++) {
                list[i].call(me, data);
            }
        }

        return me;
    }

    Mod.prototype.resolveName = function (name) {
        //基于模块的base，计算uri
        return parseName(name, this.base);
    }

    Mod.prototype.save = function () {
        var me = this;
        me.setLoading();
        // loadFile(me.name);
        //依赖检查,如果没有依赖，或依赖都加载完，本模块触发loaded事件
        if (!me.loadCheck()) {
            me.subscribe();
        }
        loader.save(me.uri, me.factory);
    }
    //订阅依赖模块的load事件
    Mod.prototype.subscribe = function () {
        var me = this;
        util.each(me.deps, function (dep, i) {
            if (_cfx.externals[dep]) {
                me.remain--;
                me.loadCheck();
                return;
            }
            //根据模块的base，计算模块的uri；
            var m = Mod.getOrCreate(dep);
            if (m.isLoaded()) {
                me.remain--;
                me.loadCheck();
                return;
            }
            util.log('loaded:' + m.name + ',parent:' + me.name);
            m.on('loaded', function () {
                me.remain--;
                me.loadCheck();
            });
        });
        return me;
    }
    //补全依赖模块名称为uri
    Mod.prototype.normalizeDeps = function () {
        var me = this;
        var deps = [];
        if (me.deps && me.deps.length > 0) {
            util.each(me.deps, function (dep) {
                if (_cfx.externals[dep]) {
                    deps.push(dep);
                } else {
                    dep = me.resolveName(dep);
                    deps.push(dep);
                }
            });
        }
        me.deps = deps;
        me.remain = deps.length;
    }
    //加载依赖的模块，模块状态为init
    Mod.prototype.loadDeps = function () {
        var me = this;
        var ds = [];
        var depsType = {};

        util.each(me.deps, function (dep, i) {
            //根据模块的base，计算模块的uri；
            if (_cfx.externals[dep]) {
                return;
            }
            var m = Mod.getOrCreate(dep);
            if (m.isInit()) {
                util.log('init:' + m.name);
                m.setLoading();
                ds.push(m.uri);
            }
        });

        if (ds.length <= 0) {
            return;
        }

        loader.load(ds, function (err, deps) {
            if (err == true) {
                me.emit('loaderror', err);
            } else {
                //匿名加载
                if (_currentDefine && _currentDefine.deps) {
                    util.log('anonymous module,set module name :' + deps)
                    if (util.isArray(deps)) {
                        deps = deps[0];
                    }
                    _currentDefine.name = deps;
                    var def = _currentDefine;
                    _currentDefine = null;
                    var m = Mod.getOrCreate(def.name, {
                        deps: def.deps,
                        factory: def.factory
                    });
                    m.load();
                } else {
                    if (!deps) {
                        return;
                    }

                    if (!util.isArray(deps)) {
                        
                        Mod.getOrCreate(deps).load();
                    } else {
                        util.each(deps, function (dep) {
                            Mod.getOrCreate(dep).load();
                        });
                    }
                }
            }
        })
    }
    //加载模块依赖，如果是打包模式，不需要执行
    Mod.prototype.load = function () {
        //加载模块，处理依赖的加载，递归
        //计算js的uri
        var me = this;
        //已经加载完，不需要重新加载
        if (me.isLoaded()) {
            return true;
        }

        // loadFile(me.name);
        //依赖检查,如果没有依赖，或依赖都加载完，本模块触发loaded事件
        if (!me.loadCheck()) {
            me.subscribe();
            me.loadDeps();
        }
        loader.save(me.uri, me.factory);
    }

    //load状态检查，返回是否已加载。
    Mod.prototype.loadCheck = function () {
        var me = this;

        if (me.isLoaded()) {
            return true;
        }

        if (me.deps.length == 0) {
            me.setLoaded();
            return true;
        }
        
        if (me.remain <= 0) {
            me.setLoaded();
            return true;
        }
        return false;
    }

    Mod.prototype.circelCheck = function () {
        var me = this;
        me.depsCount++;

        if (me.depsCount > 1) {
            me.depsCount = 0;
            throw new Error('circular reference:' + me.name);
        }

        util.each(me.deps, function (dep, i) {
            var mod = Mod.getOrCreate(dep);
            if (mod) {
                return mod.circelCheck();
            }
        });

        me.depsCount--
    }

    Mod.prototype.require = function (name) {
        var me = this;

        if (_cfx.externals[name]) {
            return glb[_cfx.externals[name]];
        }

        var key = me.resolveName(name);

        var m = (_map[key]);
        if (!m) {
            return {};
        }

        if (m.status == _STATUS.executed) {
            return m.exports;
        } else {
            return m.exec();
        }
    }

    Mod.prototype.exec = function () {
        var me = this;
        var result = '';

        if (me.status == _STATUS.executed) {
            return me.exports;
        }

        me.setStatus(_STATUS.executing);

        var lod = loaderManager.get(me.uri);
        if (!lod) {
            return void 0;
        }

        me.exports = result = lod.exec(me);
        
        delete me.factory;
        me.deps = [];

        me.setStatus(_STATUS.executed);

        return result
    }

    Mod.prototype.setStatus = function (status, info) {
        var me = this;
        if (me.status !== status) {
            me.status = status;
            switch (status) {
                case _STATUS.loading:
                    me.emit('loading', me);
                    break;
                case _STATUS.loaded:
                    me.emit('loaded', me);
                    break;
                case _STATUS.executing:
                    me.emit('executing', me);
                    break;
                case _STATUS.executed:
                    me.emit('executed', me);
                    break;
                case _STATUS.error:
                    me.emit('error', info);
                    break;
                default:
                    break;
            }
        }
    }

    Mod.prototype.setLoaded = function () {
        this.setStatus(_STATUS.loaded);
    }

    Mod.prototype.setLoading = function () {
        this.setStatus(_STATUS.loading);
    }

    Mod.prototype.isLoaded = function () {
        return this.status == _STATUS.loaded
    }

    Mod.prototype.isLoading = function () {
        return this.status == _STATUS.loading
    }

    Mod.prototype.isInit = function () {
        return this.status == _STATUS.init;
    }

    Mod.prototype.getDepModules = function () {
        var params = [];
        util.each(this.deps, function (dep, i) {
            if (_cfx.externals[dep]) {
                params.push(glb[dep]);
                return;
            }
            params.push(Mod.getModule(dep));
        })
        return params;
    }

    Mod.get = function (uri, opts) {
        uri = parseName(uri);
        var m = _map[uri];
        return m;
    }

    Mod.create = function (uri, opts) {
        opts = opts || {};
        uri = parseName(uri);
        var mod = _map[uri];
        if (!mod) {
            var cfx = util.assign({
                base: uri.replace(/[^\/]*$/, ''),
                name: uri,
                uri: uri
            }, opts);
            mod = new Mod(cfx);
            _map[uri] = mod;
        }
        mod.normalizeDeps();
        return mod;
    }

    Mod.getOrCreate = function (uri, opts) {
        opts = opts || {};

        var mod = Mod.get(uri);
        if (!mod) {
            mod = Mod.create(uri, opts);
        } else {
            mod.update(opts);
        }
        return mod;
    }

    Mod.exist = function (uri) {
        return !!_map[uri];
    }

    Mod.getModule = function (uri) {
        var m = _map[uri];
        if (!m) {
            return {};
        }
        return m.exec();
    }
    return Mod;
})(glb);
