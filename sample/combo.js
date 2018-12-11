var PORT = 3000;

var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');

function readFile(filePath) {
    return new Promise(function (resole, reject) {
        var p = path.resolve(__dirname, 'src', filePath)
        fs.readFile(p, 'utf-8', function (error, content) {
            if (error) {
                reject(error);
            } else {
                var result = content.replace(/define\(/, 'define(\'' + filePath + '\',');
                resole(result);
            }
        })
    })
}
function normlize(file, content) {

}
var server = http.createServer(function (request, response) {
    if (request.url.indexOf('??') < 0) {
        response.end();
    }
    var files = request.url.split('??')[1];
    files = files.split(',');
    var ps = [];
    files.forEach(function (file) {
        ps.push(readFile(file));
    })
    var ext = path.extname(files[0])
    Promise.all(ps).then(function (result) {
        if (ext == '.js') {
            response.writeHead(200, {
                'Content-Type': 'application/javascript'
            });
        } else {
            response.writeHead(200, {
                'Content-Type': 'text/css'
            });
        }
        response.write(result.join(''));
        response.end();
    }).catch(function (err) {
        response.write(err);
        response.end();
    });
});
server.listen(PORT);
console.log("Server runing at port: " + PORT + ".");