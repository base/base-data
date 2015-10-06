'use strict';

/**
 * Lazily required module dependencies
 */

var utils = require('lazy-cache')(require);
require = utils;
require('has-glob');
require('resolve-glob', 'resolve');
require('extend-shallow', 'extend');
require('merge-value', 'merge');
require('has-value', 'has');

/**
 * Expose `utils` modules
 */

module.exports = utils;
