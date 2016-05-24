'use strict';

require('mocha');
var path = require('path');
var Base = require('base');
var assert = require('assert');
var yaml = require('js-yaml');
var data = require('./');
var utils = data.utils;
var app;

Base.use(function() {
  this.isApp = true;
});

describe('data', function() {
  beforeEach(function() {
    app = new Base();
  });

  describe('plugin', function() {
    it('should add the data method to the `app` instance:', function() {
      app.use(data());
      assert.equal(typeof app.data, 'function');
    });

    it('should not add the data method to the `Base` prototype:', function() {
      app.use(data());
      assert.notEqual(typeof Base.prototype.data, 'function');
    });
  });

  describe('utils', function() {
    it('should expose utils', function() {
      assert(data.utils);
    });

    it('should expose utils as a getter', function() {
      assert.equal(typeof data.utils, 'function');
    });

    it('should format a file extension', function() {
      assert.equal(utils.formatExt('foo'), '.foo');
      assert.equal(utils.formatExt('.foo'), '.foo');
    });
  });

  describe('defaults', function() {
    it('should set data on `app.cache.data` by default', function() {
      app.use(data());
      app.data('a', 'b');
      assert.equal(app.cache.data.a, 'b');
    });

    it('should emit a data event with "args"', function(cb) {
      app.use(data());

      app.on('data', function(args) {
        assert(args);
        assert(Array.isArray(args));
        assert.equal(args.length, 2);
        cb();
      });

      app.data('a', 'b');
      assert.equal(app.cache.data.a, 'b');
    });
  });

  describe('custom properties', function() {
    it('should set data on app.foo', function() {
      app.use(data('foo'));
      app.data('a', 'b');
      assert.equal(app.foo.a, 'b');
    });

    it('should set data on app.bar', function() {
      app.use(data('bar'));
      app.data('a', 'b');
      assert.equal(app.bar.a, 'b');
    });

    it('should not overwrite existing values', function() {
      app.abc = {x: 'y'};
      app.use(data('abc'));
      app.data('a', 'b');
      assert.equal(app.abc.x, 'y');
      assert.equal(app.abc.a, 'b');
    });
  });

  describe('.set method', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());
    });

    it('should set an object on `app.cache.data`', function() {
      app.data.set({a: 'b'});
      assert.equal(app.cache.data.a, 'b');
    });

    it('should set a key-value pair on `app.cache.data`', function() {
      app.data.set('c', 'd');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should deeply set a key-value pair onto `app.cache.data`', function() {
      app.data.set('a.b.c.d', {e: 'f'});
      assert.deepEqual(app.cache.data.a, {b: {c: {d: {e: 'f'}}}});
    });
  });

  describe('.get method', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());
    });

    it('should get a value from `app.cache.data`', function() {
      app.data.set({a: 'b'});
      assert.equal(app.data.get('a'), 'b');
    });

    it('should get a deeply nested value from `app.cache.data`', function() {
      app.data.merge({a: {b: {c: {d: {e: 'f'}}}}});
      assert.deepEqual(app.data.get('a.b.c'), {d: {e: 'f'}});
    });
  });

  describe('.merge method', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());
    });

    it('should merge an object onto `app.cache.data`', function() {
      app.data({c: 'd'});
      app.data.merge({a: 'b'});
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should deeply merge an object onto `app.cache.data`', function() {
      app.data({c: {d: 'e'}});
      app.data.merge({c: {f: 'g'}});
      assert.deepEqual(app.cache.data.c, {d: 'e', f: 'g'});
    });
  });

  describe('.union method', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());
    });

    it('should union an array on `app.cache.data`', function() {
      app.data({a: ['b', 'c']});
      app.data.union('a', ['d', 'e']);
      assert.deepEqual(app.cache.data.a, ['b', 'c', 'd', 'e']);
    });

    it('should deeply union an array on `app.cache.data`', function() {
      app.data({a: {b: {c: ['b', 'c']}}});
      app.data.union('a.b.c', ['d', 'e']);
      assert.deepEqual(app.cache.data.a.b.c, ['b', 'c', 'd', 'e']);
    });
  });

  describe('filepath arguments', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());

      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });
    });

    it('should run a loader on a matching filepath:', function() {
      app.data('package.json');
      assert.equal(app.cache.data.name, 'base-data');
    });

    it('should run multiple loaders on a matching filepath:', function() {
      app.dataLoader(/\.json$/, function(data) {
        data.foo = 'bar';
        return data;
      });

      app.data('package.json');
      assert.equal(app.cache.data.name, 'base-data');
      assert.equal(app.cache.data.foo, 'bar');
    });

    it('should merge data from files:', function() {
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should load data from an array of filepaths:', function() {
      app.data(['package.json', 'fixtures/a.json']);
      assert.equal(app.cache.data.name, 'base-data');
      assert.equal(app.cache.data.a, 'b');
    });

    it('should throw an error on invalid keys:', function() {
      app.use(data());
      try {
        app.data(function() {});
      } catch (err) {
        assert(err);
        assert(err.message = 'expected value to be a string, array or object.');
      }
    });

    it('should fail on non-existant files:', function(cb) {
      app.use(data());
      try {
        app.data('fixtures/foo.md');
        app.data('fixtures/slslsl.json');
        cb(new Error('expected an error'));
      } catch (err) {
        assert(/failed to read/i.test(err.message));
        cb();
      }
    });
  });

  describe('glob arguments', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());

      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });
    });

    it('should run a loader on globbed files:', function() {
      app.data('*.json');
      assert.equal(app.cache.data.name, 'base-data');
    });

    it('should run multiple loaders on globbed files:', function() {
      app.dataLoader(/\.json$/, function(data) {
        data.foo = 'bar';
        return data;
      });

      app.data('*.json');
      assert.equal(app.cache.data.name, 'base-data');
      assert.equal(app.cache.data.foo, 'bar');
    });

    it('should merge data from a glob of files:', function() {
      app.use(data());
      app.data({c: 'd'});
      app.data('fixtures/*.json');
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should pass options to matched:', function() {
      app.use(data());
      app.data({c: 'd'});
      app.data('*.json', {cwd: 'fixtures'});
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should merge data from an array of globs:', function() {
      app.use(data());
      app.data({c: 'd'});
      app.data(['fixtures/*.json']);
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });
  });

  describe('object arguments', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());
    });

    it('should set an object:', function() {
      app.data({a: 'b'});
      assert.equal(app.cache.data.a, 'b');
    });

    it('should set a list of objects:', function() {
      app.data({a: 'b'}, {c: 'd'});
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });
  });

  describe('array arguments', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());
    });

    it('should set an array:', function() {
      app.data([{a: 'b'}]);
      assert.equal(app.cache.data.a, 'b');
    });

    it('should union an array value:', function() {
      app.data('a', ['b']);
      app.data('a', ['c'], true);
      assert.equal(app.cache.data.a[0], 'b');
      assert.equal(app.cache.data.a[1], 'c');
    });
  });

  describe('string arguments', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());
    });

    it('should set string/string:', function() {
      app.data('a', 'b');
      assert.equal(app.cache.data.a, 'b');
    });

    it('should set string/object:', function() {
      app.data('a', {b: 'c'});
      assert.deepEqual(app.cache.data.a, {b: 'c'});
    });

    it('should return a value when a single string arg is passed', function() {
      app.data({abc: 'xyz'});
      assert.equal(app.data('abc'), 'xyz');
    });

    it('should read a file from a single string arg', function() {
      app.data('fixtures/a.json');
      assert.equal(app.data('a'), 'b');
    });

    it('should merge a key/value pair when value is an object:', function() {
      app.data('a', {b: 'c'});
      app.data('a', {d: 'e'});
      assert.deepEqual(app.cache.data.a, {b: 'c', d: 'e'});
    });

    it('should support using dot notation in the key:', function() {
      app.data('a.b', {c: 'd'});
      app.data('a.b', {e: 'f'});
      assert.deepEqual(app.cache.data.a.b, {c: 'd', e: 'f'});
    });

    it('should extend data', function() {
      app.data({c: 'd'});
      assert.equal(app.cache.data.c, 'd');
    });

    it('should overwrite a string value', function() {
      app.data('a', 'b');
      assert.equal(app.cache.data.a, 'b');

      app.data('a', 'c');
      assert.equal(app.cache.data.a, 'c');
    });

    it('should update an array value', function() {
      app.data('a', ['b']);
      assert.deepEqual(app.cache.data.a, ['b']);

      app.data('a', ['c'], true);
      assert.deepEqual(app.cache.data.a, ['b', 'c']);
    });

    it('should overwrite an array value', function() {
      app.data('a', ['b']);
      assert.deepEqual(app.cache.data.a, ['b']);

      app.data('a', ['c']);
      assert.deepEqual(app.cache.data.a, ['c']);
    });

    it('should merge data', function() {
      app.data({a: 'b'});
      app.data({c: 'd'});
      assert.equal(app.cache.data.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should deeply merge data', function() {
      app.data({a: {b: {c: 'd'}}});
      app.data({a: {b: {d: 'e'}}});
      app.data({a: {b: {e: 'f'}}});
      assert.equal(app.cache.data.a.b.c, 'd');
      assert.equal(app.cache.data.a.b.d, 'e');
      assert.equal(app.cache.data.a.b.e, 'f');
    });
  });

  describe('data.json', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());

      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });
    });

    it('should merge `data.json` onto the root of the object:', function() {
      app.use(data());
      app.data({c: 'd'});
      app.data('fixtures/data.json');
      assert.equal(app.cache.data.me, 'I\'m at the root!');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should work when data.json is in a glob of files:', function() {
      app.use(data());
      app.data('fixtures/*.json');
      assert.equal(app.cache.data.me, 'I\'m at the root!');
    });
  });

  describe('options.namespace', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());

      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });
    });

    it('should namespace data using the default rename function:', function() {
      app = new Base();
      app.use(data({namespace: true}));
      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.cache.data.a.a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should use the filename as the namespace', function() {
      app.data('fixtures/a.json', {namespace: true});
      assert.equal(app.cache.data.a.a, 'b');
    });

    it('should use the namespace specified as a string', function() {
      app.data('fixtures/a.json', {namespace: 'abc'});
      assert.equal(app.cache.data.abc.a, 'b');
    });

    it('should not namespace when false', function() {
      app.data('fixtures/a.json', {namespace: false});
      assert.equal(app.cache.data.a, 'b');
    });

    it('should use a custom namespace function:', function() {
      app = new Base();
      function rename(fp) {
        var segs = fp.split(path.sep);
        segs.pop();
        return segs.pop();
      }
      app.use(data({namespace: rename}));
      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });
      app.data({c: 'd'});
      app.data('fixtures/*/index.json');
      assert.equal(app.cache.data.one.name, 'one');
      assert.equal(app.cache.data.two.name, 'two');
      assert.equal(app.cache.data.three.name, 'three');
      assert.equal(app.cache.data.c, 'd');
    });

    it('should namespace data using a custom renameKey function:', function() {
      app = new Base();
      function rename(key) {
        return 'foo-' + utils.basename(key);
      }
      app.use(data({renameKey: rename}));
      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });
      app.data({c: 'd'});
      app.data('fixtures/a.json');
      assert.equal(app.cache.data['foo-a'].a, 'b');
      assert.equal(app.cache.data.c, 'd');
    });
  });
});

describe('custom property', function() {
  beforeEach(function() {
    app = new Base();
    app.use(data());

    app.dataLoader('json', function(str) {
      return JSON.parse(str);
    });
  });

  it('should set/get data:', function() {
    app.use(data('foo.bar'));
    app.data('a', 'b');
    assert.equal(app.foo.bar.a, 'b');
  });

  it('should merge a key/value pair when value is an object:', function() {
    app.use(data('foo.bar'));
    app.data('foo', {one: 'two'});
    app.data('foo', {bar: 'baz'});
    assert.deepEqual(app.foo.bar.foo, {one: 'two', bar: 'baz'});
  });

  it('should support using dot notation in the key:', function() {
    app.use(data('foo.bar'));
    app.data('a.b', {one: 'two'});
    app.data('a.b', {baz: 'qux'});
    assert.deepEqual(app.foo.bar.a.b, {one: 'two', baz: 'qux'});
  });

  it('should extend data', function() {
    app.use(data('foo.bar'));
    app.data({c: 'd'});
    assert.equal(app.foo.bar.c, 'd');
  });

  it('should merge data', function() {
    app.use(data('foo.bar'));
    app.data({a: 'b'});
    app.data({c: 'd'});
    assert.equal(app.foo.bar.a, 'b');
    assert.equal(app.foo.bar.c, 'd');
  });

  it('should deeply merge data', function() {
    app.use(data('foo.bar'));
    app.data({a: {b: {c: 'd'}}});
    app.data({a: {b: {d: 'e'}}});
    app.data({a: {b: {e: 'f'}}});
    assert.equal(app.foo.bar.a.b.c, 'd');
    assert.equal(app.foo.bar.a.b.d, 'e');
    assert.equal(app.foo.bar.a.b.e, 'f');
  });

  it('should merge data from files:', function() {
    app.use(data('foo.bar'));
    app.data({c: 'd'});
    app.data('fixtures/a.json');
    assert.equal(app.foo.bar.a, 'b');
    assert.equal(app.foo.bar.c, 'd');
  });

  it('should namespace data using the default rename function:', function() {
    app.use(data('foo.bar', {namespace: true}));
    app.data({c: 'd'});
    app.data('fixtures/a.json');
    assert.equal(app.foo.bar.a.a, 'b');
    assert.equal(app.foo.bar.c, 'd');
  });

  it('should merge `data.json` onto the root of the object:', function() {
    app.use(data('foo.bar'));
    app.data({c: 'd'});
    app.data('fixtures/data.json');
    assert.equal(app.foo.bar.me, 'I\'m at the root!');
    assert.equal(app.foo.bar.c, 'd');
  });

  it('should namespace data using a custom namespace function:', function() {
    function rename(key) {
      return 'foo-' + utils.basename(key);
    }
    app.use(data('foo.bar', {namespace: rename}));
    app.data({c: 'd'});
    app.data('fixtures/a.json');
    assert.equal(app.foo.bar['foo-a'].a, 'b');
    assert.equal(app.foo.bar.c, 'd');
  });

  it('should namespace data using a custom renameKey function:', function() {
    function rename(key) {
      return 'foo-' + utils.basename(key);
    }
    app.use(data('foo.bar', {renameKey: rename}));
    app.data({c: 'd'});
    app.data('fixtures/a.json');
    assert.equal(app.foo.bar['foo-a'].a, 'b');
    assert.equal(app.foo.bar.c, 'd');
  });

  it('should fail on non-existant files:', function(cb) {
    app.use(data('foo.bar'));
    try {
      app.data('fixtures/slslsl.json');
      cb(new Error('expected an error'));
    } catch (err) {
      assert(/failed to read/i.test(err.message));
      cb();
    }
  });

  it('should throw an error on invalid keys:', function() {
    app.use(data('foo.bar'));
    try {
      app.data(function() {});
    } catch (err) {
      assert(err);
      assert(err.message = 'expected value to be a string, array or object.');
    }
  });

  it('should merge data from a glob of files:', function() {
    app.use(data('foo.bar'));
    app.data({c: 'd'});
    app.data('fixtures/*.json');
    assert.equal(app.foo.bar.a, 'b');
    assert.equal(app.foo.bar.c, 'd');
  });

  it('should merge data from an array of globs:', function() {
    app.use(data('foo.bar'));
    app.data({c: 'd'});
    app.data(['fixtures/*.json']);
    assert.equal(app.foo.bar.a, 'b');
    assert.equal(app.foo.bar.c, 'd');
  });
});

describe('dataLoader', function() {
  describe('defaults', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());

      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });
    });

    it('should expose a dataLoaders property', function() {
      assert(app.dataLoaders);
      assert(Array.isArray(app.dataLoaders));
      assert.equal(app.dataLoaders.length, 1);
    });

    it('should expose a default json loader', function() {
      assert(app.dataLoaders[0].hasOwnProperty('name'));
      assert.equal(app.dataLoaders[0].name, 'json');
    });

    it('should load data from a json file', function() {
      app.data('package.json');
      assert.equal(app.cache.data.name, 'base-data');
    });

    it('should load data from a glob of json files', function() {
      app.data('*.json');
      assert.equal(app.cache.data.name, 'base-data');
    });
  });

  describe('custom dataLoaders', function() {
    beforeEach(function() {
      app = new Base();
      app.use(data());

      app.dataLoader('json', function(str) {
        return JSON.parse(str);
      });

      app.dataLoader(/\.ya?ml$/, function(str) {
        return yaml.load(str);
      });
    });

    it('should register a dataLoader', function() {
      assert.equal(app.dataLoaders.length, 2);
    });

    it('should load data from a yaml file', function() {
      app.data('fixtures/c.yml');
      assert.deepEqual(app.cache.data, {c: ['d', 'e', 'f']});
    });

    it('should load data.yaml object on the root', function() {
      app.data('fixtures/*.yaml');
      assert.equal(app.cache.data.me1, 'I\'m a yaml file at the root!');
    });

    it('should load data.yml object on the root', function() {
      app.data('fixtures/*.yml');
      assert.equal(app.cache.data.me2, 'I\'m a yml file at the root!');
    });

    it('should load data.* object on the root', function() {
      app.data('fixtures/*.{yml,yaml}');
      assert.equal(app.cache.data.me1, 'I\'m a yaml file at the root!');
      assert.equal(app.cache.data.me2, 'I\'m a yml file at the root!');
    });

    it('should load data from a glob of yaml files', function() {
      app.data('fixtures/*.{yml,yaml}');
      assert.deepEqual(app.cache.data.c, ['d', 'e', 'f']);
    });
  });
});
