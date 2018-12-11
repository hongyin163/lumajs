(function (glb) {

    var ls = window.localStorage;
    var sptLoc = true;
    return {
        get: function (key, cb) {
            if (ls && sptLoc) {
                try {
                    cb && cb(ls.getItem(key));
                } catch (ex) {
                    sptLoc = false;
                    cb && cb(null);
                }
            } else {
                cb && cb(null);
            }
        },
        set: function (key, v) {
            if (ls && sptLoc) {
                try {                    
                    ls.setItem(key, v);
                } catch (ex) {
                    sptLoc = false;
                }
            }
        },
        remove: function (key) {
            if (ls) {
                ls.removeItem(key);
            }
        }
    }
})(glb)