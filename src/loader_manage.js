(function (glb) {
    //存储loader实现
    var _context = {},
        _store = {},
        _extRegx = /\.(\w*)$/;


    function addCssToDom(cssText) {
        var style = doc.createElement('style');
        style.type = 'text/css';
        style.innerHTML = cssText;
        // ref: #185 & http://dev.jquery.com/ticket/2709
        baseElement ?
            head.insertBefore(style, baseElement) :
            head.appendChild(style)
    }
    var jsLoader = {
        addOnload: function (node, cb, url) {
            var supportOnload = "onload" in node

            if (supportOnload) {
                node.onload = onload
                node.onerror = function () {
                    // emit("error", { uri: url, node: node })
                    onload(true)
                }
            }
            else {
                node.onreadystatechange = function () {
                    if (/loaded|complete/.test(node.readyState)) {
                        onload()
                    }
                }
            }

            function onload(error) {
                // Ensure only run once and handle memory leak in IE
                node.onload = node.onerror = node.onreadystatechange = null

                // Remove the script to reduce memory leak
                // if (!data.debug) {
                head.removeChild(node)
                // }

                // Dereference the node
                node = null

                cb(error)
            }
        },
        load: function (url, cb, charset, crossorigin) {
            var node = doc.createElement("script")
            if (charset) {
                node.charset = charset
            }
            if (!util.isUndefined(crossorigin)) {
                node.setAttribute("crossorigin", crossorigin)
            }
            this.addOnload(node, cb, url)

            node.async = true
            node.src = url

            // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
            // the end of the insert execution, so use `currentlyAddingScript` to
            // hold current node, for deriving url in `define` call
            currentlyAddingScript = node

            // ref: #185 & http://dev.jquery.com/ticket/2709
            baseElement ?
                head.insertBefore(node, baseElement) :
                head.appendChild(node)

            currentlyAddingScript = null
        },
        exec: function (mod) {
            var exports = {};
            var req = util.bind(mod.require, mod);
            req.async = glb.require.async;
            req.style = addCssToDom;
            if (!mod.factory) {
                util.log(mod.name + ' factory is undefined');
                return;
            }
            debugger;
            var params = [req, exports, mod], depmods=[];
            if (_cfx.type == 'amd') {
                debugger;
                depmods = mod.getDepModules();
                params = depmods.concat(params);
            }
            var result = mod.factory.apply(_context, params);
            if (result) {
                return result;
            } else {
                return util.assign(mod.exports, exports);
            }
        }
    }

    var cssLoader = {
        addToDom: function (css) {
            var link = doc.createElement('link');
            link.href = url;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.innerHTML = css;
            link.addEventListener('load', function (a) {
                cb && cb(false, url);
            })
            // ref: #185 & http://dev.jquery.com/ticket/2709
            baseElement ?
                head.insertBefore(link, baseElement) :
                head.appendChild(link)
        },
        load: function (url, cb) {
            var link = doc.createElement('link');
            link.href = url;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.addEventListener('load', function (a) {
                cb && cb(false, url);
            })
            // ref: #185 & http://dev.jquery.com/ticket/2709
            baseElement ?
                head.insertBefore(link, baseElement) :
                head.appendChild(link)
        },
        exec: function (mod) {
            if (!mod.factory) {
                return;
            }
            var exports = {};
            var req = util.bind(mod.require, mod);
            req.async = glb.require.async;
            var result = mod.factory.apply(_context, [req, exports, mod]);
            if (!result) {
                result = util.assign(mod.exports, exports);
            }
            if (result) {
                this.addToDom(result);
            }
        }
    }

    _store['.js'] = jsLoader;
    _store['.css'] = cssLoader;
    return {
        get: function (name) {
            if (_cfx.ONLYJS) {
                return jsLoader;
            }
            var matchs = _extRegx.exec(name);
            if (matchs && matchs.length > 0) {
                var ext = matchs[0];
                if (ext) {
                    return _store[ext];
                }
            }
            return jsLoader;
        },
        set: function (ext, loader) {
            _store[ext] = loader;
        }
    }
})(glb)