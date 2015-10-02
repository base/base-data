'use strict';

/**
 * Lazily required module dependencies
 */

var lazy = require('lazy-cache')(require);
var fn = require;

require = lazy;
require('has-glob');
require('resolve-glob', 'resolve');
require('extend-shallow', 'extend');
require('merge-value', 'merge');
require('has-value', 'has');
require = fn;

/**
 * Expose `lazy` modules
 */

module.exports = lazy;
