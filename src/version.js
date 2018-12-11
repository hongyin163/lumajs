/**
 * 模块更新检查
 * 根据模块路径，查找该路径下是【模块名】.json文件，如果有，进行更新检查，没有不进行
 */
(function (glb) {
    //检查之前缓存的pkg文件内容，如果整个的版本未变，则不需要更新
    //如果之前没有缓存，需要更新所有
    //cb(depsNeedUpdate)
    function checkPkg(pkg, cb) {
        if (!_cfx.localStore) {
            cb && cb(pkg.dependencies);
            return;
        }

        storage.get(pkg.name, function (val) {
            //不存在历史缓存，全部更新
            if (!val) {
                cb && cb(pkg.dependencies);
                return;
            }
            var oldPkg = typeof JSON == 'undefined' ? eval('(' + val + ')') : JSON.parse(val);
            var needs = {}
            if (oldPkg.version == pkg.version) {
                //主版本一致，不更新
                return cb && cb(null);
            } else {
                //主版本不一致，分析需要更新的依赖模块                
                util.each(pkg.dependencies, function (ver, pro) {
                    if (!oldPkg.dependencies[pro]) {
                        needs[pro] = ver;
                        return;
                    }
                    if (oldPkg.dependencies[pro] != ver) {
                        needs[pro] = ver;
                        return;
                    }
                })
            }
            cb && cb(needs);
        });
    }

    function check(pkg) {
        //判断本地缓存是否有map文件，如果有，检查模块是否存在，已经对比模块的版本，如果不存在或者版本有变化，下载对应的js模块
        var pkgs = pkg;

        if (util.isString(pkg)) {
            pkgs = typeof JSON == 'undefined' ? eval('(' + pkg + ')') : JSON.parse(pkg);
        }

        if (!util.isArray(pkgs)) {
            pkgs = [pkgs];
        }
        //先检查之前缓存的pkg文件，利用name

        util.each(pkgs, function (p, i) {

            checkPkg(p, function (depsNeedUpdate) {

                if (!depsNeedUpdate) {
                    return;
                }
                var deps = [];
                util.each(depsNeedUpdate, function (p, name) {
                    var uri = parseName(name);
                    deps.push(uri);
                    loader.remove(uri);
                    Mod.getOrCreate(uri).setLoading();                    
                });
                loader.update(deps, function (err, deps) {

                    if (_currentDefine && _currentDefine.deps) {
                        util.log('set module name :' + deps)
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
                        if (!util.isArray(deps)) {
                            deps = [deps];
                        }
                        util.each(deps, function (dep) {
                            Mod.getOrCreate(dep).load();
                        });
                    }

                });
            });

            if (typeof JSON != 'undefined') {
                storage.set(p.name, JSON.stringify(p))
            }
        });
    }
    return {
        check: check
    }
})(glb)