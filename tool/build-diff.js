/**
 * 针对rev的输出提供前后输出的版本比对，输出历史版本到新版本的升级包
 */
var dateFormat = require('dateformat');
var path = require('path');
var fs = require('fs');
var syncy = require('syncy');
var vergen = require('./version-generater.js');
var gulp = require('gulp');
var option = {
    folder: '',
    version: ''
}

function createVersionFile() {
    if (!fs.existsSync(option.packageFolder)) {
        fs.mkdirSync(option.packageFolder);
    }
    var verFilePath = path.resolve(option.packageFolder, './version.json');
    var exist = fs.existsSync(verFilePath);
    if (!exist) {
        var verFile = {
            "version": '',
            "current": '',
            "timestamp": new Date().getTime(),
            "histroy": {
            }
        }
        fs.writeFileSync(verFilePath, JSON.stringify(verFile), 'utf-8');
    }
}
function getVersion(targetFolder) {
    var folder = option.packageFolder;
    var releaseFile = path.resolve(folder, targetFolder, 'rev-version.json');
    if (!fs.existsSync(releaseFile)) {
        return '';
    }
    var fileContent = fs.readFileSync(releaseFile, 'utf-8');
    var version = JSON.parse(fileContent).hash;
    return version;
}

function getManifest(targetFolder) {
    var folder = option.packageFolder;
    var v1path = path.resolve(folder, targetFolder, 'rev-manifest.json');
    var content = fs.readFileSync(v1path, 'utf-8');
    var manifest = JSON.parse(content);
    return manifest;
}
function getMainVersion() {
    var folder = option.packageFolder;
    var verFilePath = path.resolve(folder, './version.json');
    var verfile = fs.readFileSync(verFilePath, 'utf-8');
    var content = JSON.parse(verfile);
    return content;
}
function setMainVersion(content) {
    var folder = option.packageFolder;
    var verFilePath = path.resolve(folder, './version.json');
    fs.writeFileSync(verFilePath, JSON.stringify(content), 'utf-8');
}
function packageZip(sourceFolder, files, zipName, callback) {

    var folder = option.packageFolder;
    var from = path.resolve(folder, sourceFolder);

    //拷贝文件到临时目录
    var archiver = require('archiver');
    var output = fs.createWriteStream(path.resolve(folder, './' + zipName + '.zip'));
    output.on('close', function (err) {
        // console.log('close:' + (err || ""));
        console.log('生成:' + zipName);
        callback && callback(null, zipName + '.zip');
    });
    // archive.on('error', function (err) {
    //     console.log('生成失败:' + zipName);
    //     callback && callback(err, zipName + '.zip');
    // });
    var archive = archiver('zip', {
        store: true // Sets the compression method to STORE.
    });
    archive.pipe(output);

    for (var i = 0; i < files.length; i++) {
        archive.file(path.resolve(from, files[i]), { name: files[i] });
    }
    var version = {
        version: sourceFolder
    }
    archive.append(JSON.stringify(version), { name: 'version.json' });

    archive.finalize();
}
function packageFolder(folderDir, version, callback) {
    var folder = option.packageFolder;
    folderDir = path.resolve(folder, folderDir);
    var archiver = require('archiver');
    var output = fs.createWriteStream(path.resolve(folder, './' + version + '.zip'));
    output.on('close', function (err) {
        console.log('生成zip包结束');
        callback && callback();
    });
    var archive = archiver('zip', {
        store: true // Sets the compression method to STORE.
    });
    archive.pipe(output);
    archive.directory(folderDir, '');
    var vercfx = {
        version: version
    }
    archive.append(JSON.stringify(vercfx), { name: 'version.json' });
    archive.finalize();
}
function resetVersionFile(newVersion) {
    var folder = option.packageFolder;
    var verFilePath = path.resolve(folder, './version.json');
    var verfile = fs.readFileSync(verFilePath, 'utf-8');
    var content = JSON.parse(verfile);
    var oldv = content.version;
    var oldver = content.current;
    var oldtime = content.timestamp;
    content.version = vergen(oldv);
    content.current = newVersion;
    content.timestamp = dateFormat(new Date(), 'yyyymmddhhMMss');
    if (oldv) {
        content.histroy[oldv] = oldtime;
    }
    fs.writeFileSync(verFilePath, JSON.stringify(content), 'utf-8');
}
function renameReleaseFolder(releaseDir, newVersion, callback) {
    var folder = option.packageFolder;
    gulp.src([releaseDir + '/**/*'])
        .pipe(gulp.dest(path.resolve(folder, newVersion)))
        .on('end', function () {
            callback && callback();
        })
}
//生成离线
function diffFromTo(fromFolder, toFolder, callback) {
    var folder = option.packageFolder;

    if (!toFolder) {
        return;
    }
    var toV = getVersion(toFolder);

    //没有from
    if (!fromFolder) {
        packageFolder(toFolder, toFolder, callback);
        return;
    }
    var fromV = getVersion(fromFolder);

    if (fromFolder == toFolder) {
        console.log('版本相同，不需要更新');
        return;
    }

    var v1manifest = getManifest(fromFolder)
    var v2manifest = getManifest(toFolder)
    // console.log(v1manifest)
    // console.log(v2manifest)
    //比较v1（旧版本）和v2（新版本）的不同
    var diffFiles = [];
    for (var pro in v2manifest) {
        if (!v1manifest[pro]) {
            diffFiles.push(pro);
            continue;
        }
        if (v1manifest[pro] != v2manifest[pro]) {
            diffFiles.push(pro);
            continue;
        }
    }

    console.log('开始生成离线包：' + fromFolder + '_' + toFolder);
    packageZip(toFolder, diffFiles, fromFolder + '_' + toFolder, function (err, pkgName) {
        if (err) {
            callback && callback(err, pkgName);
        } else {
            callback && callback(null, pkgName);
        }
    });
    console.log('变化的文件：' + JSON.stringify(diffFiles));
}

var vmap = {};
function diffVersion(callback) {
    var folder = option.packageFolder;
    var content = getMainVersion();
    var current = content.current;
    var releaseDir = option.releaseFolder;

    if (!current) {
        console.log('无旧版本，全量打包');
    } else {
        console.log('当前版本:' + current);
    }

    //新版本
    var newVersion = getVersion(releaseDir)
    if (!newVersion) {
        console.log('暂无新发布的版本');
        return;
    }

    console.log('新版本:' + newVersion);

    if (current == newVersion) {

        console.log('版本相同，不需要更新');

        return;
    }

    //版本信息写进version.json
    resetVersionFile(newVersion);

    //获取更新后端版本信息文件内容
    content = getMainVersion();
    //拷贝发布的代码到folder下
    console.log(releaseDir);

    renameReleaseFolder(releaseDir, content.version, function () {

        //生成从旧版本到新版本的的diff包
        var mainVersion = getMainVersion();
        var target = mainVersion.version;
        // var target = mainVersion.current;
        var histroy = mainVersion.histroy;

        if (!histroy || Object.keys(histroy).length == 0) {
            //没有历史版本，生成全量包
            diffFromTo('', target, function () {
                console.log('全量打包结束');
                callback && callback();
            });
            return;
        }

        var tasks = [];
        for (var oldV in histroy) {
            tasks.push(new Promise(function (resole, reject) {
                //生成离线包
                console.log('执行diffFromTo：' + oldV + '_' + target)
                diffFromTo(oldV, target, function (err, pkgName) {
                    if (err) {
                        reject(err);
                    } else {
                        resole(pkgName);
                    }
                });
            }));
        }

        console.log('离线包生成开始:' + tasks.length);

        Promise.all(tasks).then(function (results) {
            console.log('离线包生成结束');
            callback && callback(null, results);
        }).catch(function (err) {
            console.log('离线包生成异常:' + err);
            callback && callback(err);
        });

    });
}

function main(_option, callback) {
    option = Object.assign(option, _option);
    if (!option.packageFolder) {
        throw new Error('please set folder property for your zip package;')
    }

    option.packageFolder = path.resolve(process.cwd(), option.packageFolder);
    option.releaseFolder = path.resolve(process.cwd(), option.releaseFolder);
    createVersionFile();
    diffVersion(callback);
}

// main({
//     folder: path.resolve(__dirname, '../data/'),
//     releaseFolder: path.resolve(__dirname, '../release/')
// });

module.exports = main