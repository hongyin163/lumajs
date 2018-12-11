(function (glb) {
    /**
     * 模块加载，提供统一loader接口，可以通过在本地存储加载，也可以从网络加载
     */

    var doc = document;
    var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
    var baseElement = head.getElementsByTagName("base")[0];

    var reg_def = /^define\(/;
    var reg_defname = /^define\(['"][^'"]*['"]/;
    var reg_pro = /^(http|https|file):\/\/[^\/]*/;

    var baseUrl = _cfx.baseUrl;
    var locStore = {
        getUnid: function (url) {
            //根目录
            return url.replace(reg_pro, '');
        },
        load: function (url, cb) {
            //本地加载，模拟define执行过程
            var key = this.getUnid(url);
            storage.get(key, function (code) {
                if (!code) {
                    cb && cb(true, url);
                    return;
                }
                //是否有define
                if (reg_def.test(code)) {
                    //检查是否有name
                    if (!reg_defname.test(code)) {
                        code = code.replace(/^define\s*\(/, 'define(\'' + key + '\',');
                    }
                    eval(code);
                    cb && cb(false, url);

                } else {
                    code = 'define(\'' + key + '\',' + code + ');';
                    eval(code);
                    cb && cb(false, url);
                }
            });
        },
        save: function (url, factory) {
            var key = this.getUnid(url);
            var code = 'define(\'' + key + '\',' + factory.toString() + ');';
            storage.set(key, code);
        },
        remove: function (url) {
            var key = this.getUnid(url);
            storage.remove(key);
        }
    }

    //本地加载依赖
    var loc = {
        load: function (deps, cb) {
            // var notExist = [];
            util.each(deps, function (dep) {
                var url = dep;
                locStore.load(url, function (error, dep) {
                    if (error === true) {
                        // notExist.push(dep);
                        cb && cb(error, [dep])
                    } else {
                        cb && cb(error, [dep])
                    }
                });
            });
        }
    }

    var combo = {
        load: function (deps, loader, cb) {
            var url = '??';
            util.each(deps, function (dep, i) {
                url += removeBase(dep) + ',';
            });
            url = _cfx.comboHandler + url.substring(0, url.length - 1);
            util.log(url);

            loader.load(url, function (error) {
                cb && cb(error, deps);
            })
        }
    }
    var single = {
        load: function (deps, loader, callbck) {
            util.each(deps, function (dep, i) {
                var url = dep;
                loader.load(url,  function (event) {
                    util.log('load result '+ event+','+dep);
                    callbck && callbck(event, dep);
                });
            })
        }
    }


    var network = {
        load: function (deps, cb) {
            //根据后缀名分拣
            var types = {};
            var extRegx = /\.\w*$/;
            for (var i = 0; i < deps.length; i++) {
                var ext = deps[i].match(extRegx)[0];
                if (!types[ext]) { types[ext] = [] }
                types[ext].push(deps[i]);
            }

            var loadeHandler = _cfx.comboHandler ? combo : single;

            for (var t in types) {
                var resLoader = loaderManager.get(t);

                loadeHandler.load(deps, resLoader, cb);
            }
        }
    }


    var result = {
        load: function (deps, cb) {
            //先看模块是否有本地存储，如果有就不需要加载
            if (_cfx.localStore) {
                function _loadFirstLocal(deps, cb) {

                    loc.load(deps, function (error, deps) {
                        if (error) {
                            if (!deps || deps.length <= 0) {
                                return;
                            }
                            network.load(deps, function (error, dep) {
                                cb && cb(error, dep);
                            });
                        } else {
                            cb && cb(error, deps);
                        }
                    });
                }
                result.load = _loadFirstLocal;
            } else {
                function _loadFirstNet(deps, cb) {

                    network.load(deps, function (error, dep) {
                        cb && cb(error, dep);
                    });
                }
                result.load = _loadFirstNet;
            }

            result.load(deps, cb);
        },
        update: function (deps, cb) {
            network.load(deps, function (error, dep) {
                cb && cb(error, dep);
            });
        },
        save: function (url, factory) {
            if (!factory) { return; }
            if (_cfx.localStore) {
                locStore.save(url, factory);
            }
        },
        remove: function (url) {
            if (_cfx.localStore) {
                locStore.remove(url);
            }
        }
    }
    return result;
})(glb);