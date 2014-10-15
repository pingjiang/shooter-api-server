# Shooter API Server

## 功能

1. 使用`http-proxy`代理Shooter网站，解决CORS问题。除了/srt的请求都转发到Shooter.cn，返回结果的时候增加'Access-Control-Allow-Origin'。
2. 获取Shooter网站提供的字幕压缩文件后转换为JSON对象对外开放。查看下面的/srt接口。

## /srt接口

  > GET /srt?url={url}&encoding={encoding|utf8}
  > { type: '.srt', name: 'filename', content: 'subtitle content' }

可以使用subtitle.js来解析和播放字幕内容。

## Start

  > npm start
  > open http://localhost:5050
  

