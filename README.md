# base-data [![NPM version](https://badge.fury.io/js/base-data.svg)](http://badge.fury.io/js/base-data)

> adds a `data` method to base-methods.

Adds a `data` method to [base-methods](https://github.com/jonschlinkert/base-methods) that can be used for setting, getting and loading data onto a specified object in your application.

<!-- toc -->

* [Install](#install)
* [Usage](#usage)
* [API](#api)
* [Glob patterns](#glob-patterns)
* [Namespacing](#namespacing)
* [Related projects](#related-projects)
* [Running tests](#running-tests)
* [Contributing](#contributing)
* [Author](#author)
* [License](#license)

_(Table of contents generated by [verb])_

<!-- tocstop -->

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i base-data --save
```

## Usage

```js
var Base = require('base-methods');
var data = require('base-data');

// instantiate `Base`
var base = new Base();
// add `data` as a plugin
base.use(data());
```

**Examples**

Add data:

```js
app.data('a', 'b');
app.data({c: 'd'});
app.data('e', ['f']);
console.log(app.cache.data);
//=> {a: 'b', c: 'd', e: ['f']}
```

**cache.data**

By default, all data is loaded onto `app.cache.data`. This can be customized by passing the property to use when the plugin is initialized.

For example, the following set `app.foo` as object for storing data:

```js
app.use(data('foo'));
app.data('a', 'b');
console.log(app.foo);
//=> {a: 'b'}
```

## API

### [.dataLoader](index.js#L52)

Register a data loader for loading data onto `app.cache.data`.

**Params**

* `ext` **{String}**: The file extension for to match to the loader
* `fn` **{Function}**: The loader function.

**Example**

```js
var fs = require('fs');
var yaml = require('js-yaml');

app.dataLoader('yml', function(fp) {
  var str = fs.readFileSync(fp, 'utf8');
  return yaml.safeLoad(str);
});

app.data('foo.yml');
//=> loads and parses `foo.yml` as yaml
```

### [.data](index.js#L87)

Load data onto `app.cache.data`

**Params**

* `key` **{String|Object}**: Key of the value to set, or object to extend.
* `val` **{any}**
* `returns` **{Object}**: Returns the instance of `Template` for chaining

**Example**

```js
console.log(app.cache.data);
//=> {};

app.data('a', 'b');
app.data({c: 'd'});
console.log(app.cache.data);
//=> {a: 'b', c: 'd'}

// set an array
app.data('e', ['f']);

// overwrite the array
app.data('e', ['g']);

// update the array
app.data('e', ['h'], true);
console.log(app.cache.data.e);
//=> ['g', 'h']
```

## Glob patterns

Glob patterns may be passed as a string or array. All of these work:

```js
app.data('foo.json');
app.data('*.json');
app.data(['*.json']);
// pass options to node-glob
app.data(['*.json'], {dot: true});
```

## Namespacing

Namespacing allows you to load data onto a specific key, optionally using part of the file path as the key.

**Example**

Given that `foo.json` contains `{a: 'b'}`:

```js
app.data('foo.json');
console.log(app.cache.data);
//=> {a: 'b'}

app.data('foo.json', {namespace: true});
console.log(app.cache.data);
//=> {foo: {a: 'b'}}

app.data('foo.json', {
  namespace: function(fp) {
    return path.basename(fp);
  }
});
console.log(app.cache.data);
//=> {'foo.json': {a: 'b'}}
```

## Related projects

* [base-methods](https://www.npmjs.com/package/base-methods): Starter for creating a node.js application with a handful of common methods, like `set`, `get`,… [more](https://www.npmjs.com/package/base-methods) | [homepage](https://github.com/jonschlinkert/base-methods)
* [base-options](https://www.npmjs.com/package/base-options): Adds a few options methods to base-methods, like `option`, `enable` and `disable`. See the readme… [more](https://www.npmjs.com/package/base-options) | [homepage](https://github.com/jonschlinkert/base-options)
* [base-plugins](https://www.npmjs.com/package/base-plugins): Upgrade's plugin support in base-methods to allow plugins to be called any time after init. | [homepage](https://github.com/jonschlinkert/base-plugins)

## Running tests

Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/base-data/issues/new).

## Author

**Jon Schlinkert**

+ [github/jonschlinkert](https://github.com/jonschlinkert)
+ [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2015 Jon Schlinkert
Released under the MIT license.

***

_This file was generated by [verb-cli](https://github.com/assemble/verb-cli) on October 21, 2015._