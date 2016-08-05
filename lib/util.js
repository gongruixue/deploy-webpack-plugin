var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    async = require('async');

exports.getFilter = function(pattern){
    if(typeof pattern == 'function') return pattern;
    else if(typeof pattern == 'string')
        return function (item) {
            return item.indexOf(pattern)!=-1
        };
    else if(pattern instanceof RegExp) return pattern.test.bind(pattern);
    else if(pattern instanceof Array) {
        var filters = pattern.map(getFilter);
        return function (item){
            return filters.some(function(filter){
                return filter(item);
            });
        }
    }
    else throw new Error('Invalid filter option');
};
exports.inheritFrom = function(A, B){
    function C(){}
    C.prototype = B.prototype;
    A.prototype = new C();
};

exports.copyFile = function(from, to, done){
    function copy(cb){
        var src = fs.createReadStream(from),
            dest = fs.createWriteStream(to);
        src.on('error', cb);
        dest.on('error', cb);
        dest.on('close', function(){ cb(null)});
        src.pipe(dest);
    }
    async.series([
        mkdirp.bind(null, path.dirname(to)),
        copy
    ], done)
};

/**
 * write file without path-not-exists worries,
 * the path shall be created along the way
 * @param content
 * @param filePath
 * @param done
 */
exports.writeFile = function(content, filePath, done){
    async.series([
        mkdirp.bind(null, path.dirname(filePath)),
        fs.writeFile.bind(fs, filePath, content)
    ], done)
};