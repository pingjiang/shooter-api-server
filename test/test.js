var assert = require('assert');
var srt = require('../srt');
var parsers = require('../parsers');
var fs = require('fs');
var path = require('path');
var util = require('util');

describe('srt', function(){
  describe('#unzip()', function(){
    it('should return results', function(done){
      fs.readFile('./tmp/srt.zip', function(err, buf) {
        if (err) {
          return done(err);
        }
        srt.uncompress(buf, null, function(err, results) {
          if (err) {
            throw err;
          }
          
          results.forEach(function(r) {
            // console.log('result: %s\n\n%s', r.name, r.content);
          });
          done();
        });
      });
    });
    
    it('should return results', function(done){
      srt.uncompress('./tmp/SpiderMan.rar', 'utf8', function(err, results) {
        if (err) {
          return done(err);
        }
        results.forEach(function(r) {
          // console.log('result: %s\n\n%s', r.name, r.content);
        });
        done();
      });
    });
    
    it('should parse results', function(done){
      srt.uncompress('./tmp/noah3.rar', 'gbk', function(err, results) {
        if (err) {
          return done(err);
        }
        results.forEach(function(r) {
          // console.log('result: %s\n\n%s', r.name, r.content);
          var ass = parsers.parse_ass(r.content);
          // console.log(util.inspect(ass.info));
        });
        done();
      });
    });
    
    it('should parse ass', function(done){
      srt.readSrt('./tmp/test-ass.ass', null, null, null, function(err, r) {
        if (err) {
          return done(err);
        }
        var ass = parsers.parse_ass(r.content);
        // console.log(util.inspect(ass.info));
        done();
      });
    });
    
    it('should parse ass1', function(done){
      srt.readSrt('./tmp/test-ass1.ass', null, null, null, function(err, r) {
        if (err) {
          return done(err);
        }
        var ass = parsers.parse_ass(r.content);
        // console.log(util.inspect(ass.info));
        done();
      });
    });
    
    it('should parse srt', function(done){
      srt.readSrt('./tmp/Noah.2013.1080p.BluRay.x264-SPARKS.hk.cht.srt', null, null, null, function(err, r) {
        if (err) {
          return done(err);
        }
        var ass = parsers.parse_srt(r.content);
        // console.log(util.inspect(ass.events));
        done();
      });
    });
    
    it('should parse vtt', function(done){
      srt.readSrt('./tmp/noah.hk.cht.vtt', null, null, null, function(err, r) {
        if (err) {
          return done(err);
        }
        var ass = parsers.parse_srt(r.content);
        // console.log(util.inspect(ass.events));
        done();
      });
    });
    
    it('should parse lyrics', function(done){
      fs.readFile('./tmp/test.lrc', { encoding: 'utf8' }, function(err, data) {
        var lrc = parsers.parse_lrc(data);
        // console.log(util.inspect(lrc));
        done();
      });
    });
    
    var files = ['262113.ASS.rar', 
      '263462.Lucy_2014_KORSUB_720p_WEBRip_XviD_MP3_RARBG.rar', 
      '263467.262885_The_Purge_Anarchy_2014_Clean_720p_HDRip_AC3_eng.rar', 
      '263516._____________Noah_2014_720p_BluRay_x264_WiKi.rar', // GBK
      '263519.____________4________________Transformers_Age_of_Extinction_2014_720p_BluRay_x264_WiKi.rar', 
      '263566.X_Men_Days_of_Future_Past_2014_BluRay.rar', 
      '263664.Lukcy_2014_KORSUB_720p_WEBRip_x264_AC3_JYK.rar', 
      '263697.Deliver_us_From_Evil_2014_720p_BluRay_x264_SPARKS.rar', 
      '263700.Automata_2014_720p_WEB_DL_DD5_1_H264_RARBG.rar', 
      '263701._______________2______22_Jump_Street_2014____________.zip', 
      '263736.Automata_2014_720p____________________________.rar'
    ].map(function(f) { return './test/fixtures/'+f; });
    
    var ii = 0, j;
    function runTest(i, enc, done) {
      ii++;
      srt.uncompress(files[i], enc, function(err, results) {
        if (err) {
          return done(err);
        }
        j = 0;
        results.forEach(function(r) {
          var ret = parsers.parse(r.name ? path.extname(r.name) : null, r.content);
          ret.name = r.name;
          // console.log(util.inspect(ret.events[0]));
          fs.createWriteStream('srt'+(ii)+'-'+(j++)+'.json').end(JSON.stringify(ret, null, '  '));
        });
        done();
      });
    }
    
    it('should extract and parse 0', function(done){ runTest(0, 'utf8', done); });
    it('should extract and parse 1', function(done){ runTest(1, 'gbk', done); });
    it('should extract and parse 2', function(done){ runTest(2, 'gbk', done); });
    it('should extract and parse 3', function(done){ runTest(3, 'gbk', done); });
    it('should extract and parse 4', function(done){ runTest(4, 'gbk', done); });
    it('should extract and parse 5', function(done){ runTest(5, 'utf16', done); });// x-men, utf-16le[dos]
    it('should extract and parse 6', function(done){ runTest(6, 'big5', done); });
    it('should extract and parse 7', function(done){ runTest(7, 'gbk', done); });
    it('should extract and parse 8', function(done){ runTest(8, null, done); });
    it('should extract and parse 9', function(done){ runTest(9, null, done); });
    
  });
});
