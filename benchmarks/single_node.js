'use strict';

var nodeRedis = require('redis');
var ioRedis = require('../');
var ndredis, ioredis;

console.log('==========================');
console.log('ioredis: ' + require('../package.json').version);
console.log('node_redis: ' + require('redis/package.json').version);
var os = require('os');
console.log('CPU: ' + os.cpus().length);
console.log('OS: ' + os.platform() + ' ' + os.arch());
console.log('==========================');

var waitReady = function (next) {
  var pending = 2;
  ndredis.on('ready', function () {
    if (!--pending) {
      next();
    }
  });

  ioredis.on('ready', function () {
    if (!--pending) {
      next();
    }
  });
};

suite('simple set', function() {
  set('mintime', 5000);
  set('concurrency', 50);
  before(function (start) {
    ndredis = nodeRedis.createClient();
    ioredis = new ioRedis();
    waitReady(start);
  });

  bench('ioredis', function(next) {
    ioredis.set('foo', 'bar', next);
  });

  bench('node_redis', function(next) {
    ndredis.set('foo', 'bar', next);
  });

  after(function () {
    ndredis.quit();
    ioredis.quit();
  });
});

suite('simple get', function() {
  set('mintime', 5000);
  set('concurrency', 50);
  before(function (start) {
    ndredis = nodeRedis.createClient();
    ioredis = new ioRedis();
    waitReady(function () {
      ndredis.set('foo', 'bar', start);
    });
  });

  bench('ioredis', function(next) {
    ioredis.get('foo', next);
  });

  bench('node_redis', function(next) {
    ndredis.get('foo', next);
  });

  after(function () {
    ndredis.quit();
    ioredis.quit();
  });
});

suite('simple get with pipeline', function() {
  set('mintime', 5000);
  set('concurrency', 50);
  before(function (start) {
    ndredis = nodeRedis.createClient();
    ioredis = new ioRedis();
    waitReady(function () {
      ndredis.set('foo', 'bar', start);
    });
  });

  bench('ioredis', function(next) {
    var pipeline = ioredis.pipeline();
    for (var i = 0; i < 10; ++i) {
      pipeline.get('foo');
    }
    pipeline.exec(next);
  });

  bench('node_redis', function(next) {
    var pending = 0;
    for (var i = 0; i < 10; ++i) {
      pending += 1;
      ndredis.get('foo', check);
    }
    function check() {
      if (!--pending) {
        next();
      }
    }
  });

  after(function () {
    ndredis.quit();
    ioredis.quit();
  });
});

suite('lrange 100', function() {
  set('mintime', 5000);
  set('concurrency', 50);
  before(function (start) {
    ndredis = nodeRedis.createClient();
    ioredis = new ioRedis();
    waitReady(function () {
      var item = [];
      for (var i = 0; i < 100; ++i) {
        item.push((Math.random() * 100000 | 0) + 'str');
      }
      ndredis.del('foo');
      ndredis.lpush('foo', item, start);
    });
  });

  bench('ioredis', function(next) {
    ioredis.lrange('foo', 0, 99, next);
  });

  bench('node_redis', function(next) {
    ndredis.lrange('foo', 0, 99, next);
  });

  after(function () {
    ndredis.quit();
    ioredis.quit();
  });
});
