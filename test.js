/*!
 * base-data <https://github.com/jonschlinkert/base-data>
 *
 * Copyright (c) 2015 .
 * Licensed under the MIT license.
 */

'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('base-methods');
var data = require('./');
var App, app;

describe('data', function () {
  beforeEach(function() {
    App = function() {
      Base.call(this);
    };
    Base.extend(App);
    app = new App();
  });

  it('should add the data method to the `app` prototype:', function () {
    app.mixin('data', data('cache'));
    assert.equal(typeof App.prototype.data, 'function');
  });

  describe('default property', function () {
    it('should set/get data on `app.cache.data` by default', function () {
      app.mixin('data', data());
      app.data('a', 'b');
      assert.equal(app.cache.data.a, 'b');
    });

    it('should merge a key/value pair when value is an object:', function () {
      app.mixin('data', data());
      app.data('foo', {one: 'two'});
      app.data('foo', {bar: 'baz'});
      assert.deepEqual(app.cache.data.foo, {one: 'two', bar: 'baz'});
    });

    it('should support using dot notation in the key:', function () {
      app.mixin('data', data());
      app.data('foo.bar', {one: 'two'});
      app.data('foo.bar', {baz: 'qux'});
      assert.deepEqual(app.cache.data.foo.bar, {one: 'two', baz: 'qux'});
    });

    it('should extend data', function () {
      app.mixin('data', data());
      app.data({c: 'd'});
      assert.equal(app.cache.data.c, 'd');
    });

    it('should merge data', function () {
      app.mixin('data', data());
      app.data({a: 'b'});
      app.data({c: 'd'});
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should deeply merge data', function () {
      app.mixin('data', data());
      app.data({a: {b: {c: 'd'}}});
      app.data({a: {b: {d: 'e'}}});
      app.data({a: {b: {e: 'f'}}});
      assert.equal(app.cache.data.a.b.c, 'd');
      assert.equal(app.cache.data.a.b.d, 'e');
      assert.equal(app.cache.data.a.b.e, 'f');
    });

    it('should merge data from files:', function () {
      app.mixin('data', data());
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should namespace data using the default rename function:', function () {
      app.mixin('data', data({namespace: true}));
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.cache.data.a.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should namespace data using a custom namespace function:', function () {
      function rename(key) {
        return 'foo-' + path.basename(key, path.extname(key));
      }
      app.mixin('data', data({namespace: rename}));
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.cache.data['foo-a'].a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should namespace data using a custom renameKey function:', function () {
      function rename(key) {
        return 'foo-' + path.basename(key, path.extname(key));
      }
      app.mixin('data', data({renameKey: rename}));
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.cache.data['foo-a'].a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should support a function as the second arg:', function () {
      app.mixin('data', data());
      app.data({c: 'd'});
      app.data('fixtures/a.json', function (fp) {
        return require(path.resolve(fp));
      });
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should merge `data.json` onto the root of the object:', function () {
      app.mixin('data', data());
      app.data({c: 'd'});
      app.data('fixtures/data.json');
      assert.equal(app.cache.data.me, 'I\'m at the root!');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should fail gracefully on non-existant files:', function () {
      app.mixin('data', data());
      app.data({c: 'd'});
      app.data('fixtures/slslsl.json');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should throw an error on invalid keys:', function () {
      app.mixin('data', data());
      try {
        app.data(function() {});
      } catch(err) {
        assert(err);
        assert(err.message = 'expected value to be a string, array or object.');
      }
    });

    it('should fail gracefully on invalid files:', function () {
      app.mixin('data', data());
      app.data({c: 'd'});
      app.data('fixtures/foo.md');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should merge data from a glob of files:', function () {
      app.mixin('data', data());
      app.data({c: 'd'});
      app.data('fixtures/*.json');
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should merge data from an array of globs:', function () {
      app.mixin('data', data());
      app.data({c: 'd'});
      app.data(['fixtures/*.json']);
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });
  });

  describe('custom property', function () {
    it('should set/get data:', function () {
      app.mixin('data', data('foo.bar'));
      app.data('a', 'b');
      assert.equal(app.foo.bar.a, 'b');
    });

    it('should merge a key/value pair when value is an object:', function () {
      app.mixin('data', data('foo.bar'));
      app.data('foo', {one: 'two'});
      app.data('foo', {bar: 'baz'});
      assert.deepEqual(app.foo.bar.foo, {one: 'two', bar: 'baz'});
    });

    it('should support using dot notation in the key:', function () {
      app.mixin('data', data('foo.bar'));
      app.data('a.b', {one: 'two'});
      app.data('a.b', {baz: 'qux'});
      assert.deepEqual(app.foo.bar.a.b, {one: 'two', baz: 'qux'});
    });

    it('should extend data', function () {
      app.mixin('data', data('foo.bar'));
      app.data({c: 'd'});
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should merge data', function () {
      app.mixin('data', data('foo.bar'));
      app.data({a: 'b'});
      app.data({c: 'd'});
      assert.equal(app.foo.bar.a, 'b');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should deeply merge data', function () {
      app.mixin('data', data('foo.bar'));
      app.data({a: {b: {c: 'd'}}});
      app.data({a: {b: {d: 'e'}}});
      app.data({a: {b: {e: 'f'}}});
      assert.equal(app.foo.bar.a.b.c, 'd');
      assert.equal(app.foo.bar.a.b.d, 'e');
      assert.equal(app.foo.bar.a.b.e, 'f');
    });

    it('should merge data from files:', function () {
      app.mixin('data', data('foo.bar'));
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.foo.bar.a, 'b');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should support a function as the second arg:', function () {
      app.mixin('data', data('foo.bar'));
      app.data({c: 'd'});
      app.data('fixtures/a.json', function (fp) {
        return require(path.resolve(fp));
      });
      assert.equal(app.foo.bar.a, 'b');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should namespace data using the default rename function:', function () {
      app.mixin('data', data('foo.bar', {namespace: true}));
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.foo.bar.a.a, 'b');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should merge `data.json` onto the root of the object:', function () {
      app.mixin('data', data('foo.bar'));
      app.data({c: 'd'});
      app.data('fixtures/data.json');
      assert.equal(app.foo.bar.me, 'I\'m at the root!');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should namespace data using a custom namespace function:', function () {
      function rename(key) {
        return 'foo-' + path.basename(key, path.extname(key));
      }
      app.mixin('data', data('foo.bar', {namespace: rename}));
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.foo.bar['foo-a'].a, 'b');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should namespace data using a custom renameKey function:', function () {
      function rename(key) {
        return 'foo-' + path.basename(key, path.extname(key));
      }
      app.mixin('data', data('foo.bar', {renameKey: rename}));
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.foo.bar['foo-a'].a, 'b');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should fail gracefully on non-existant files:', function () {
      app.mixin('data', data('foo.bar'));
      app.data({c: 'd'});
      app.data('fixtures/slslsl.json');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should throw an error on invalid keys:', function () {
      app.mixin('data', data('foo.bar'));
      try {
        app.data(function() {});
      } catch(err) {
        assert(err);
        assert(err.message = 'expected value to be a string, array or object.');
      }
    });

    it('should fail gracefully on invalid files:', function () {
      app.mixin('data', data('foo.bar'));
      app.data({c: 'd'});
      app.data('fixtures/foo.md');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should merge data from a glob of files:', function () {
      app.mixin('data', data('foo.bar'));
      app.data({c: 'd'});
      app.data('fixtures/*.json');
      assert.equal(app.foo.bar.a, 'b');
      assert.equal(app.foo.bar.c, 'd');
    });

    it('should merge data from an array of globs:', function () {
      app.mixin('data', data('foo.bar'));
      app.data({c: 'd'});
      app.data(['fixtures/*.json']);
      assert.equal(app.foo.bar.a, 'b');
      assert.equal(app.foo.bar.c, 'd');
    });
  });
});
