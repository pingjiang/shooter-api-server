// srt.js
var util = require('util');
var path = require('path');
var fs = require('fs');
var AdmZip = require('adm-zip');
var iconv = require('iconv-lite');
var rar = require('node-rar');
var jschardet = require("jschardet");

var debug = console.log.bind(console, 'debug: %s');

var RE_SUBTITLES = /\.(srt|sub|smi|vtt|sbv|ass)/i;
function isSubtitleFile(ext) {
  return RE_SUBTITLES.test(ext);
}
var ENCODING_FLAGS = {
  '.eng' : 'ascii',
  '.cht': 'big5',
  '.chs': 'GBK',
  '.繁體中文': 'big5', 
  '.简体中文': 'GBK', 
  '.英上中下': 'utf8', 
  '.英文': 'utf8', 
  '.中上英下': 'utf8'
};
function encodingByExt(ext) {
  return ENCODING_FLAGS[ext] || 'utf8';
}

function handleSrt(buffer, enc, ext) {
  enc = enc || encodingByExt(ext);
  debug('using encoding: ' + enc);
  var detected = jschardet.detect(buffer);
  debug('detected: ' + util.inspect(detected));
  if (iconv.encodingExists(detected.encoding)) {
    debug('detected encoding is exists');
    enc = detected.encoding;
  }
  var buf = iconv.decode(buffer, enc);
  return buf.toString();
}

var readSrt = exports.readSrt = function(localFilePath, entryName, enc, partExt, done) {
  if (!localFilePath) {
    throw new Error('invalid argument localFilePath: ' + localFilePath);
  }
  entryName = entryName || path.basename(localFilePath);
  var entryNameExt = path.extname(entryName);
  var entryNameNoExt = entryName.substring(0, entryName.length - entryNameExt.length);
  partExt = partExt || path.extname(entryNameNoExt);
  
  fs.readFile(localFilePath, function(err, data) {
    if (err) {
      return done(err);
    }
    var result = {
      name: entryName,
      content: handleSrt(data, enc, partExt)
    };
    done(null, result);
  });
};

var unzip = exports.unzip = function(zipBuffer, enc) {
  var zip = new AdmZip(zipBuffer);
  var zipEntries = zip.getEntries(); // an array of ZipEntry records
  var results = [];
  zipEntries.forEach(function(zipEntry) {
    var entryName = zipEntry.entryName;
    var ext = path.extname(entryName);
    if (!isSubtitleFile(ext)) {
      return;
    }
    var entryNamePart = entryName.substring(0, entryName.length - ext.length);
    var partExt = path.extname(entryNamePart);
    var result = {
      name: entryName,
      content: handleSrt(zipEntry.getData(), enc, partExt)
    };
    results.push(result);
  });
  return results;
};


var unrar = exports.unrar = function(file, enc, done) {
  var entries = rar.extract(file, './tmp');
  var self = this;
  var results = [], remains = entries.length;
  var finished = function() {
    if (--remains <= 0) {
      done(null, results);
    }
  };
  debug(entries);
  entries.forEach(function(entry) {
    var entryName = entry.FileName;
    var ext = path.extname(entryName);
    if (!isSubtitleFile(ext)) {
      return finished();
    }
    debug(entryName);
    var entryNamePart = entryName.substring(0, entryName.length - ext.length);
    var partExt = path.extname(entryNamePart);
    var entryFullPath = path.join('./tmp', entry.FileName);
    readSrt(entryFullPath, entryName, enc, partExt, function(err, result) {
      if (err) {
        debug(err);
        return finished();
      }
      
      results.push(result);
      finished();
    });
  });
};

var uncompress = exports.uncompress = function(file, enc, done) {
  var ext = Buffer.isBuffer(file) ? '.zip' : path.extname(file);
  if (ext === '.zip') {
    return done(null, unzip(file, enc));
  } else if (ext === '.rar') {
    return unrar(file, enc, done);
  } else {
    return done(new Error('File extension ' + ext + ' is not supported yet.'));
  }
};
