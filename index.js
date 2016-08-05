var path = require('path'),
    fs = require('fs'),
    async = require('async'),
    util = require('./lib/util.js'),
    fis_util = require('./lib/fis-util.js');

function DeployPlugin(options) {
    this.receiver = options.receiver || null;
    this.tplDir = options.tplDir;
    this.staticDir = options.staticDir;
}
DeployPlugin.prototype.apply = function(complier){
    var that = this;
    function deployLocal(asset, to, cb){
        util.writeFile(asset.source(), to, cb)
    }
    /* @param to :the final path of the asset */
    function deployRemote(asset, to, cb){
        fis_util.upload(that.receiver, null, {to: to}, (asset.source()), path.basename(to), cb);
    }
    complier.plugin('done', function(stats, done){
        var assets = stats.compilation.assets;
        async.eachOf(assets, function(asset, name, cb){
            var deployDir = /\.(js|css|jpeg|jpg|png|gif)$/.test(name) ? that.staticDir : that.tplDir;
            var to = path.join(deployDir, name);
            var deployFuc = that.receiver ? deployRemote : deployLocal;
            deployFuc(asset, to, function(err){
                if(err){
                    console.error(err.message, 'when deploying ', name, '  ---->  ', to);
                    cb(err);
                }else{
                    console.log( name, '  ---->  ', to);
                    if(asset.existsAt) fs.unlink(asset.existsAt, function(err){
                        if(err)console.warn(err.message, 'when removing cache file ', name);
                        cb(null)
                    });
                    else cb(null)
                }
            });
        }, done)
    })
};

module.exports = DeployPlugin;