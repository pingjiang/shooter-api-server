var http = require('http');
var httpProxy = require('http-proxy');
var url = require('url');
var util = require('util');
var path = require('path');
var fs = require('fs');
var srt = require('./srt');

var config = {
  vender: 'shooter-api-server',
  originWhiteList: [
  ],
  tmpdir: './tmp',
  srtApiPath: '/srt',
  port: 5050,
  proxyURL: 'http://www.shooter.cn'
};

function checkConfig(cfg) {
  if (!fs.existsSync(cfg.tmpdir)) {
    fs.mkdirSync(cfg.tmpdir);
  }
}

checkConfig(config);

function allowOrigin(req, res) {
  var origin = req.headers['origin'];
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
}

// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});

// To modify the proxy connection before data is sent, you can listen
// for the 'proxyReq' event. When the event is fired, you will receive
// the following arguments:
// (http.ClientRequest proxyReq, http.IncomingMessage req,
//  http.ServerResponse res, Object options). This mechanism is useful when
// you need to modify the proxy request before the proxy connection
// is made to the target.
//
proxy.on('proxyReq', function(proxyReq, req, res, options) {
  console.log('handle proxy request %s', proxyReq.path);
  var parts = url.parse(proxyReq.path, true);
  // url.query || url.query.og || 
  if (config.vender) {
    proxyReq.setHeader('X-Proxy-Vendor', config.vender);
  }
  allowOrigin(req, res);
});

function fetchSRT(srturl, done) {
  var parts = url.parse(srturl);
  var subparts = parts.pathname.split('/');
  var saveFileName;
  if (subparts.length > 0) {
    saveFileName = subparts[subparts.length-1];
  }
  if (!saveFileName) {
    return done(new Error('invalid saveFileName, null'));
  }
  var saveFilePath = path.join(config.tmpdir, saveFileName);
  if (fs.existsSync(saveFilePath)) {
    return done(null, saveFilePath);
  }
  http.get(srturl, function(res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      var writer = fs.createWriteStream(saveFilePath);
      res.pipe(writer, {end: false}).on('end', function() {
        writer.end();
        done(null, saveFilePath);
      }).on('error', function(err) {
        done(err);
      });
    } else {
      done(new Error('HTTP GET ' + srturl + ', response with status code ' + res.statusCode));
    }
  }).on('error', function(err) {
    done(err);
  }); 
}

var server = http.createServer(function(req, res) {
  // 处理本地请求
  var parts = url.parse(req.url, true);
  if (parts.pathname === config.srtApiPath) {
    allowOrigin(req, res);
    
    // 下载字幕文件
    return fetchSRT(parts.query.url, function(err, localFilePath) {
      if (err) {
        console.error(err);
        return res.end(JSON.stringify({ error: err.messsage || 'server error' }));
      }
      
      // 解压字幕文件，转换为JSON结果
      srt.uncompress(localFilePath, parts.query.encoding, function(err, results) {
        if (err) {
          console.error(err);
          return res.end(JSON.stringify({ error: err.messsage || 'server error' }));
        }
        
        res.end(JSON.stringify(results));
      });
    });
  }
  
  // 处理代理请求，解决CORS问题
  proxy.web(req, res, {
    target: config.proxyURL
  });
});

console.log("listening on port %d", config.port)
server.listen(config.port);
