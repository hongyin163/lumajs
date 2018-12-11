(function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory(require("React"));
  else if (typeof define === 'function' && define.amd)
    define(["React",'./fish'], factory);
  else if (typeof exports === 'object')
    exports["index"] = factory(require("React"));
  else
    root["index"] = factory(root["React"]);
})(window, function (React,fish) {
  debugger;
  console.log('car');
  return {
    name:'car'
  }
});
  //# sourceMappingURL=index.entry.js.map