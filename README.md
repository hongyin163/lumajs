# LumaJs使用

## 介绍

lumajs是可以支持CMD和AMD规范的模块加载器,具有如下特性：
1. 支持LocalStorage缓存
2. 支持Combo服务
3. 支持增量更新
4. 提供模块打包工具

## 安装


安装lumajs

`npm install lumajs `

在页面中引用luma.js文件

`<script src="path/dist/luma.js"></script>`

或者引用压缩后的文件

`<script src="path/dist/luma.min.js"></script>`

## 使用

### 模块定义

文件dog.js

```
define(function (require, exports, module) {
    exports.say = function () {
        return 'pig:heng heng! ';
    };
    //或者
    module.exports={
        say:function () {
            return 'pig:heng heng! ';
        }
    }
});
```

文件cat.js

```
define(function (require, exports, module) {
    var cat = require('./dog.js');
    var a=1;
    exports.say = function () {
        return 'cat:miaomiao!' +cat.say();
    };
    //或者
    module.exports={
        say:function () {
            return 'cat:miaomiao!' +cat.say();
        }
    }
});

```

### 模块配置

```
lumajs.config({
    baseUrl: 'http://localhost:8081/test/',
    // comboHandler:'http://localhost:3000/',
    localStore: false,
    externals: {
        'jquery': 'jQuery'
    },
    type:'amd'
});
```
* baseUrl：模块代码发布的路径，模块加载过程中相对这个路径加载模块
* comboHandler：combo服务，可选
* externals：针对模块中的引用，采用对应配置的全局变量代替
* localStore：是否启用本地缓存，默认是不开启的，在打包发布模式下，不需要开启本地缓存，在增量更新模式下，需要开启。
* type：默认是amd,可设置cmd

### 入口引用

```
lumajs.use(['./dog.js'],function(dog){
    console.log(dog.say());
})
```

### 异步调用

```
require.async(['./dog.js'],function(dog){
    console.log(dog.say());
})
```

## 构建工具

lumajs提供构建所需要的gulp插件，包括模块打包插件，增量更新需要的相关插件。

### 模块打包

打包API可以根据模块入口分析该模块相关的依赖，将依赖的模块打包，异步调用的模块不会合并到包里。

```
var lumajs = require('lumajs');
gulp.task('modpack', function () {
    return gulp.src(['./src/index.js'])
        .pipe(lumajs.pack({
            //base: './src/',
            config: {
                baseUrl: 'http://localhost:8081/dist/',
                // comboHandler:'http://localhost:3000/',
                localStore: false
            },
            ignore: ['jquery'],
            suffix: '.min'
        }))
        .pipe(gulp.dest('./src/dist'));
})
```
说明：

gulp.src引入模块入口文件，通过lumajs.pack插件打包，输出到目标目录。

API：

lumajs.pack(options);

options:
* base：代码所在目录的根目录，默认是输入文件所在的目录，
* ignore：忽略该模块，不打入包中
* suffix：生成文件名添加的后缀
* config：通过该配置调整最终生成代码的配置:lumajs.config(...)

注意：

输出的结果未压缩，可以借助其他压缩工具压缩，异步加载的模块不在包中，其他异步加载依赖的模块需要借助gulp文件拷贝插件发布到目标目录。

### 增量更新

开启本地缓存后，模块代码存入LocalStorage，优先加载缓存中的模块，如果开启了Combo服务，通过Combo服务加载所有更新的模块，如果没有Combo服务，每个模块一个请求加载。

有模块代码更新后，可以只更新有修改的模块。

构建过程会生成版本信息文件，利用前后两个构建的版本信息文件比对，加载有更新的模块。

```
//调整入口js文件的配置，输出新的入口文件
gulp.task('incr_js', function () {
    return gulp.src(['./src/index.js'])
        .pipe(lumajs.incr.js({
            // base: './test/',
            config: {
                baseUrl: 'http://localhost:8081/dist/',
                // comboHandler:'http://localhost:3000/',
                localStore: true
            },
            suffix: '.incr'
        }))
        .pipe(gulp.dest('./src/dist'));
});
//调整入口html的，加入版本信息
gulp.task('incr_html', function () {
    return gulp.src(['./src/index.js'])
        .pipe(lumajs.incr.html({
            main: path.resolve(__dirname, './src/index_incr.html')
        }))
        .pipe(gulp.dest('./src/dist'));
});

```

说明：

增量更新构建分两个步骤，第一个步骤用来调整入口js的配置，使支持本地存储，第二个步骤是生成版本信息，将版本信息注入到入口的html页面。

API：

lumajs.incr.js(options);

说明：通过该插件调整js入口函数中lumajs的配置

options

* base：代码所在目录的根目录,默认为输入文件所在的目录
* config：通过该配置调整最终生成代码的配置，增量更新下开启本地缓存
* suffix：生成文件名添加的后缀

lumajs.incr.html(options);

说明：将模块版本信息加入到入口html页面的head中，输出新生成的html页面

* main：入口html页面文件

最终生成的入口html文件内容：

```
<!DOCTYPE html>
<html lang="en">

<head>
	<title>test</title>
	<script src="../path/luma.js"></script>
    <script>lumajs.install('[{"name":"./index.js","main":"./index.js","version":"633465ca38","dependencies":{"person.js":"0872a46a71","jquery.js":"b6c7c0534b","fish.js":"2dfd8e0582","cat.js":"f38a8dbb12","moduleA/moduleC/bus.js":"43445e9959","moduleA/car.js":"a78f1c76ac","moduleB/tree.js":"105945110a","moduleB/dog.js":"ea9191a738","hello.js":"fd12337f84","world.js":"2023950628","dog.js":"594a9e2642","pig.js":"399506050d"}}]');</script>
</head>
<body>
    // ...
	<script src="../path/index.js"></script>
</body>

</html>
```

说明：
* install的参数是当前版本映射信息
* 如果是首次访问，模块全部加载，同时将该版本信息存入LocalStorage
* 二次访问会将LocalStorage中的版本信息与新的版本信息对比，如果主版本号version没变，即不更新，如果主版本号更新，对比依赖模块的版本号，查找更新的模块，然后更新有变更的模块。

注意：构建过程只会生成入口html文件，其他模块的代码需要借助gulp插件将代码输出到目标目录

### 示例

在sample中由相关的打包和实现增量更新的gulp设置代码通过如下步骤可以启动，

1. 在项目根目录下执行npm install,安装项目依赖
2. 启动开发环境，`npm run test`,访问:http://localhost:8081/index.html
3. 启动打包模式，`npm run test_pack`,访问:http://localhost:8081/dist/index_pack.html
4. 启动增量更新模式,`npm run test_incr`,访问：http://localhost:8081/dist/index_incr.html

具体实现请参考sample中的代码。