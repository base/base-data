/*!
 * base-data <https://github.com/jonschlinkert/base-data>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var utils = require('./utils');

/**
 * ```js
 * app.data('a', 'b');
 * app.data({c: 'd'});
 * console.log(app.cache.data);
 * //=> {a: 'b', c: 'd'}
 * ```
 *
 * @name .data
 * @param {String|Object} `key` Pass a key-value pair or an object to set.
 * @param {any} `val` Any value when a key-value pair is passed. This can also be options if a glob pattern is passed as the first value.
 * @return {Object} Returns an instance of `Templates` for chaining.
 * @api public
 */

module.exports = function (prop, defaults) {
  if (typeof prop === 'object') {
    defaults = prop;
    prop = 'cache.data';
  }

  if (typeof prop === 'undefined') {
    prop = 'cache.data';
  }
  return function(app) {
    if (!utils.has(this, prop)) {
      this.set(prop, {});
    }

    if (!this.dataLoaders) {
      this.define('dataLoaders', []);
    }

    this.mixin('dataLoader', function(name, fn) {
      this.dataLoaders.push({name: name, fn: fn});
      return this;
    });

    this.dataLoader('json', requireData);

    this.mixin('data', function (key, val) {
      if (isObject(key)) {
        return utils.merge(this, prop, key);
      }

      if (isGlob(key, val)) {
        var opts = utils.extend({}, defaults, this.options, val);
        var fn = matchLoader(this.dataLoaders, key);
        var files = arrayify(fn(key, opts));

        files.forEach(function (file) {
          utils.merge(this, prop, file);
        }.bind(this));
        return this;
      }

      if (typeof key !== 'string') {
        throw new TypeError('expected value to be a string, array or object.');
      }

      utils.merge(this, prop + '.' + key, val);
      return this;
    });
  };
};

function formatExt(ext) {
  if (ext.charAt(0) !== '.') {
    return '.' + ext;
  }
  return ext;
}

function matchLoader(arr, key) {
  var len = arr.length, i = -1;
  var ext = path.extname(key);

  while (++i < len) {
    var loader = arr[i];
    var name = loader.name;
    if (typeof name === 'string' && ext === formatExt(name)) {
      return loader.fn;
    }
    if (name instanceof RegExp && name.test(ext)) {
      return loader.fn;
    }
  }
  return arr[0].fn;
}


/**
 * Require a glob of data files
 */

function requireData(patterns, opts) {
  if (typeof patterns === 'string' && !utils.hasGlob(patterns)) {
    return reduceFiles(patterns, opts);
  }
  var files = utils.resolve.sync(patterns, opts);
  return reduceFiles(files, opts);
}

/**
 * Reduce one or more files to an array of objects.
 *
 * @param {Array|String} `files`
 * @param {Object} `opts`
 * @return {Array}
 */

function reduceFiles(files, opts) {
  files = arrayify(files);
  var len = files.length, i = -1;
  var arr = [];

  while (++i < len) {
    var fp = files[i];

    if (/\.(js(?:on)?)/.test(fp)) {
      var val = tryRequire(fp);
      if (!val) continue;
      if (/data\.json/.test(fp)) {
        arr.push(val);
        continue;
      }
      if (opts.namespace || opts.renameKey) {
        arr.push(namespaceFile(fp, val, opts));
        continue;
      }
      arr.push(val);
    }
  }
  return arr;
}

/**
 * Attempt to require a file. Fail silently.
 */

function tryRequire(fp) {
  try {
    return require(fp);
  } catch(err) {}

  try {
    fp = path.resolve(fp);
    return require(fp);
  } catch(err) {}
  return null;
}

/**
 * Namespace a file
 */

function namespaceFile(fp, val, opts) {
  var obj = {};
  obj[rename(fp, opts)] = val;
  return obj;
}

/**
 * Rename a file
 */

function rename(fp, opts) {
  var renameFn = name;
  if (typeof opts.namespace === 'function') {
    renameFn = opts.namespace;
  }
  if (typeof opts.renameKey === 'function') {
    renameFn = opts.renameKey;
  }
  return renameFn(fp);
}

/**
 * Get the name of a filepath excluding extension
 */

function name(fp) {
  return path.basename(fp, path.extname(fp));
}

/**
 * Return the given value is a glob pattern.
 */

function isGlob(key, val) {
  return (typeof key === 'string' && typeof val === 'undefined')
    || utils.hasGlob(key);
}

/**
 * Cast a value to an array
 */

function arrayify(val) {
  return Array.isArray(val) ? val : [val];
}

/**
 * Return true if the given value is an object.
 * @return {Boolean}
 */

function isObject(val) {
  if (!val || Array.isArray(val)) {
    return false;
  }
  return typeof val === 'object';
}
