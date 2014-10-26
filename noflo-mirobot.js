
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("bergie-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports.EventEmitter = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("jashkenas-underscore/underscore.js", function(exports, require, module){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = optimizeCb(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = cb(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = optimizeCb(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = optimizeCb(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (obj.length === +obj.length) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = cb(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = cb(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0, value;
    for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
      value = input[i];
      if (value && value.length >= 0 && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    while (length-- > 0) {
      results[length] = _.pluck(arguments, length);
    }
    return results;
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    return _.zip.apply(null, array);
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    var i = 0, length = array && array.length;
    if (typeof isSorted == 'number') {
      i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
    } else if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    var idx = array ? array.length : 0;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = function(array, predicate, context) {
    predicate = cb(predicate, context);
    var length = array != null ? array.length : 0;
    for (var i = 0; i < length; i++) {
      if (predicate(array[i], i, array)) return i;
    }
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    Ctor.prototype = sourceFunc.prototype;
    var self = new Ctor;
    Ctor.prototype = null;
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    return function bound() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function bound() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !({toString: null}).propertyIsEnumerable('toString');
  var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);

    // Ahem, IE < 9.
    if (hasEnumBug) {
      var nonEnumIdx = nonEnumerableProps.length;
      while (nonEnumIdx--) {
        var prop = nonEnumerableProps[nonEnumIdx];
        if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);
      }
    }
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = optimizeCb(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = flatten(arguments, false, false, 1);
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

});
require.register("noflo-fbp/lib/fbp.js", function(exports, require, module){
module.exports = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "start": parse_start,
        "line": parse_line,
        "LineTerminator": parse_LineTerminator,
        "comment": parse_comment,
        "connection": parse_connection,
        "bridge": parse_bridge,
        "leftlet": parse_leftlet,
        "iip": parse_iip,
        "rightlet": parse_rightlet,
        "node": parse_node,
        "component": parse_component,
        "compMeta": parse_compMeta,
        "port": parse_port,
        "portWithIndex": parse_portWithIndex,
        "anychar": parse_anychar,
        "iipchar": parse_iipchar,
        "_": parse__,
        "__": parse___
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "start";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_start() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = [];
        result1 = parse_line();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_line();
        }
        if (result0 !== null) {
          result0 = (function(offset) { return parser.getResult();  })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_line() {
        var result0, result1, result2, result3, result4, result5, result6, result7, result8;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse__();
        if (result0 !== null) {
          if (input.substr(pos, 7) === "EXPORT=") {
            result1 = "EXPORT=";
            pos += 7;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"EXPORT=\"");
            }
          }
          if (result1 !== null) {
            if (/^[A-Za-z.0-9_]/.test(input.charAt(pos))) {
              result3 = input.charAt(pos);
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("[A-Za-z.0-9_]");
              }
            }
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                if (/^[A-Za-z.0-9_]/.test(input.charAt(pos))) {
                  result3 = input.charAt(pos);
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("[A-Za-z.0-9_]");
                  }
                }
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 58) {
                result3 = ":";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\":\"");
                }
              }
              if (result3 !== null) {
                if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                  result5 = input.charAt(pos);
                  pos++;
                } else {
                  result5 = null;
                  if (reportFailures === 0) {
                    matchFailed("[A-Z0-9_]");
                  }
                }
                if (result5 !== null) {
                  result4 = [];
                  while (result5 !== null) {
                    result4.push(result5);
                    if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                      result5 = input.charAt(pos);
                      pos++;
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("[A-Z0-9_]");
                      }
                    }
                  }
                } else {
                  result4 = null;
                }
                if (result4 !== null) {
                  result5 = parse__();
                  if (result5 !== null) {
                    result6 = parse_LineTerminator();
                    result6 = result6 !== null ? result6 : "";
                    if (result6 !== null) {
                      result0 = [result0, result1, result2, result3, result4, result5, result6];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, priv, pub) {return parser.registerExports(priv.join(""),pub.join(""))})(pos0, result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse__();
          if (result0 !== null) {
            if (input.substr(pos, 7) === "INPORT=") {
              result1 = "INPORT=";
              pos += 7;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"INPORT=\"");
              }
            }
            if (result1 !== null) {
              if (/^[A-Za-z0-9_]/.test(input.charAt(pos))) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[A-Za-z0-9_]");
                }
              }
              if (result3 !== null) {
                result2 = [];
                while (result3 !== null) {
                  result2.push(result3);
                  if (/^[A-Za-z0-9_]/.test(input.charAt(pos))) {
                    result3 = input.charAt(pos);
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("[A-Za-z0-9_]");
                    }
                  }
                }
              } else {
                result2 = null;
              }
              if (result2 !== null) {
                if (input.charCodeAt(pos) === 46) {
                  result3 = ".";
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("\".\"");
                  }
                }
                if (result3 !== null) {
                  if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                    result5 = input.charAt(pos);
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("[A-Z0-9_]");
                    }
                  }
                  if (result5 !== null) {
                    result4 = [];
                    while (result5 !== null) {
                      result4.push(result5);
                      if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                        result5 = input.charAt(pos);
                        pos++;
                      } else {
                        result5 = null;
                        if (reportFailures === 0) {
                          matchFailed("[A-Z0-9_]");
                        }
                      }
                    }
                  } else {
                    result4 = null;
                  }
                  if (result4 !== null) {
                    if (input.charCodeAt(pos) === 58) {
                      result5 = ":";
                      pos++;
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("\":\"");
                      }
                    }
                    if (result5 !== null) {
                      if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                        result7 = input.charAt(pos);
                        pos++;
                      } else {
                        result7 = null;
                        if (reportFailures === 0) {
                          matchFailed("[A-Z0-9_]");
                        }
                      }
                      if (result7 !== null) {
                        result6 = [];
                        while (result7 !== null) {
                          result6.push(result7);
                          if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                            result7 = input.charAt(pos);
                            pos++;
                          } else {
                            result7 = null;
                            if (reportFailures === 0) {
                              matchFailed("[A-Z0-9_]");
                            }
                          }
                        }
                      } else {
                        result6 = null;
                      }
                      if (result6 !== null) {
                        result7 = parse__();
                        if (result7 !== null) {
                          result8 = parse_LineTerminator();
                          result8 = result8 !== null ? result8 : "";
                          if (result8 !== null) {
                            result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8];
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, node, port, pub) {return parser.registerInports(node.join(""),port.join(""),pub.join(""))})(pos0, result0[2], result0[4], result0[6]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse__();
            if (result0 !== null) {
              if (input.substr(pos, 8) === "OUTPORT=") {
                result1 = "OUTPORT=";
                pos += 8;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"OUTPORT=\"");
                }
              }
              if (result1 !== null) {
                if (/^[A-Za-z0-9_]/.test(input.charAt(pos))) {
                  result3 = input.charAt(pos);
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("[A-Za-z0-9_]");
                  }
                }
                if (result3 !== null) {
                  result2 = [];
                  while (result3 !== null) {
                    result2.push(result3);
                    if (/^[A-Za-z0-9_]/.test(input.charAt(pos))) {
                      result3 = input.charAt(pos);
                      pos++;
                    } else {
                      result3 = null;
                      if (reportFailures === 0) {
                        matchFailed("[A-Za-z0-9_]");
                      }
                    }
                  }
                } else {
                  result2 = null;
                }
                if (result2 !== null) {
                  if (input.charCodeAt(pos) === 46) {
                    result3 = ".";
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("\".\"");
                    }
                  }
                  if (result3 !== null) {
                    if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                      result5 = input.charAt(pos);
                      pos++;
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("[A-Z0-9_]");
                      }
                    }
                    if (result5 !== null) {
                      result4 = [];
                      while (result5 !== null) {
                        result4.push(result5);
                        if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                          result5 = input.charAt(pos);
                          pos++;
                        } else {
                          result5 = null;
                          if (reportFailures === 0) {
                            matchFailed("[A-Z0-9_]");
                          }
                        }
                      }
                    } else {
                      result4 = null;
                    }
                    if (result4 !== null) {
                      if (input.charCodeAt(pos) === 58) {
                        result5 = ":";
                        pos++;
                      } else {
                        result5 = null;
                        if (reportFailures === 0) {
                          matchFailed("\":\"");
                        }
                      }
                      if (result5 !== null) {
                        if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                          result7 = input.charAt(pos);
                          pos++;
                        } else {
                          result7 = null;
                          if (reportFailures === 0) {
                            matchFailed("[A-Z0-9_]");
                          }
                        }
                        if (result7 !== null) {
                          result6 = [];
                          while (result7 !== null) {
                            result6.push(result7);
                            if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                              result7 = input.charAt(pos);
                              pos++;
                            } else {
                              result7 = null;
                              if (reportFailures === 0) {
                                matchFailed("[A-Z0-9_]");
                              }
                            }
                          }
                        } else {
                          result6 = null;
                        }
                        if (result6 !== null) {
                          result7 = parse__();
                          if (result7 !== null) {
                            result8 = parse_LineTerminator();
                            result8 = result8 !== null ? result8 : "";
                            if (result8 !== null) {
                              result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8];
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, node, port, pub) {return parser.registerOutports(node.join(""),port.join(""),pub.join(""))})(pos0, result0[2], result0[4], result0[6]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              result0 = parse_comment();
              if (result0 !== null) {
                if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos))) {
                  result1 = input.charAt(pos);
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("[\\n\\r\\u2028\\u2029]");
                  }
                }
                result1 = result1 !== null ? result1 : "";
                if (result1 !== null) {
                  result0 = [result0, result1];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
              if (result0 === null) {
                pos0 = pos;
                result0 = parse__();
                if (result0 !== null) {
                  if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos))) {
                    result1 = input.charAt(pos);
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("[\\n\\r\\u2028\\u2029]");
                    }
                  }
                  if (result1 !== null) {
                    result0 = [result0, result1];
                  } else {
                    result0 = null;
                    pos = pos0;
                  }
                } else {
                  result0 = null;
                  pos = pos0;
                }
                if (result0 === null) {
                  pos0 = pos;
                  pos1 = pos;
                  result0 = parse__();
                  if (result0 !== null) {
                    result1 = parse_connection();
                    if (result1 !== null) {
                      result2 = parse__();
                      if (result2 !== null) {
                        result3 = parse_LineTerminator();
                        result3 = result3 !== null ? result3 : "";
                        if (result3 !== null) {
                          result0 = [result0, result1, result2, result3];
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                  if (result0 !== null) {
                    result0 = (function(offset, edges) {return parser.registerEdges(edges);})(pos0, result0[1]);
                  }
                  if (result0 === null) {
                    pos = pos0;
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_LineTerminator() {
        var result0, result1, result2, result3;
        var pos0;
        
        pos0 = pos;
        result0 = parse__();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 44) {
            result1 = ",";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\",\"");
            }
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_comment();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos))) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[\\n\\r\\u2028\\u2029]");
                }
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_comment() {
        var result0, result1, result2, result3;
        var pos0;
        
        pos0 = pos;
        result0 = parse__();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 35) {
            result1 = "#";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"#\"");
            }
          }
          if (result1 !== null) {
            result2 = [];
            result3 = parse_anychar();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse_anychar();
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_connection() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_bridge();
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            if (input.substr(pos, 2) === "->") {
              result2 = "->";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"->\"");
              }
            }
            if (result2 !== null) {
              result3 = parse__();
              if (result3 !== null) {
                result4 = parse_connection();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, x, y) { return [x,y]; })(pos0, result0[0], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_bridge();
        }
        return result0;
      }
      
      function parse_bridge() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_port();
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            result2 = parse_node();
            if (result2 !== null) {
              result3 = parse__();
              if (result3 !== null) {
                result4 = parse_port();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, x, proc, y) { return [{"tgt":{process:proc, port:x}},{"src":{process:proc, port:y}}]; })(pos0, result0[0], result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_iip();
          if (result0 === null) {
            result0 = parse_rightlet();
            if (result0 === null) {
              result0 = parse_leftlet();
            }
          }
        }
        return result0;
      }
      
      function parse_leftlet() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_node();
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            result2 = parse_port();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, proc, port) { return {"src":{process:proc, port:port}} })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_node();
          if (result0 !== null) {
            result1 = parse__();
            if (result1 !== null) {
              result2 = parse_portWithIndex();
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, proc, port) { return {"src":{process:proc, port:port.port, index: port.index}} })(pos0, result0[0], result0[2]);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_iip() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 39) {
          result0 = "'";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"'\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_iipchar();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_iipchar();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 39) {
              result2 = "'";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"'\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, iip) { return {"data":iip.join("")} })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_rightlet() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_port();
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            result2 = parse_node();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, port, proc) { return {"tgt":{process:proc, port:port}} })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_portWithIndex();
          if (result0 !== null) {
            result1 = parse__();
            if (result1 !== null) {
              result2 = parse_node();
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, port, proc) { return {"tgt":{process:proc, port:port.port, index: port.index}} })(pos0, result0[0], result0[2]);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_node() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (/^[a-zA-Z0-9_]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z0-9_]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[a-zA-Z0-9_]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z0-9_]");
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result1 = parse_component();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, node, comp) { if(comp){parser.addNode(node.join(""),comp);}; return node.join("")})(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_component() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 40) {
          result0 = "(";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"(\"");
          }
        }
        if (result0 !== null) {
          if (/^[a-zA-Z\/\-0-9_]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z\\/\\-0-9_]");
            }
          }
          if (result2 !== null) {
            result1 = [];
            while (result2 !== null) {
              result1.push(result2);
              if (/^[a-zA-Z\/\-0-9_]/.test(input.charAt(pos))) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[a-zA-Z\\/\\-0-9_]");
                }
              }
            }
          } else {
            result1 = null;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_compMeta();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 41) {
                result3 = ")";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\")\"");
                }
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, comp, meta) { var o = {}; comp ? o.comp = comp.join("") : o.comp = ''; meta ? o.meta = meta.join("").split(',') : null; return o; })(pos0, result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_compMeta() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 58) {
          result0 = ":";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\":\"");
          }
        }
        if (result0 !== null) {
          if (/^[a-zA-Z\/=_,0-9]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z\\/=_,0-9]");
            }
          }
          if (result2 !== null) {
            result1 = [];
            while (result2 !== null) {
              result1.push(result2);
              if (/^[a-zA-Z\/=_,0-9]/.test(input.charAt(pos))) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[a-zA-Z\\/=_,0-9]");
                }
              }
            }
          } else {
            result1 = null;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, meta) {return meta})(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_port() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (/^[A-Z.0-9_]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[A-Z.0-9_]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[A-Z.0-9_]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[A-Z.0-9_]");
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, portname) {return portname.join("").toLowerCase()})(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_portWithIndex() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (/^[A-Z.0-9_]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[A-Z.0-9_]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[A-Z.0-9_]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[A-Z.0-9_]");
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 91) {
            result1 = "[";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"[\"");
            }
          }
          if (result1 !== null) {
            if (/^[0-9]/.test(input.charAt(pos))) {
              result3 = input.charAt(pos);
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9]");
              }
            }
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                if (/^[0-9]/.test(input.charAt(pos))) {
                  result3 = input.charAt(pos);
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 93) {
                result3 = "]";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\"]\"");
                }
              }
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, portname, portindex) {return { port: portname.join("").toLowerCase(), index: parseInt(portindex.join('')) }})(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_anychar() {
        var result0;
        
        if (/^[^\n\r\u2028\u2029]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[^\\n\\r\\u2028\\u2029]");
          }
        }
        return result0;
      }
      
      function parse_iipchar() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (/^[\\]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\\\]");
          }
        }
        if (result0 !== null) {
          if (/^[']/.test(input.charAt(pos))) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[']");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "'"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          if (/^[^']/.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[^']");
            }
          }
        }
        return result0;
      }
      
      function parse__() {
        var result0, result1;
        
        result0 = [];
        if (input.charCodeAt(pos) === 32) {
          result1 = " ";
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("\" \"");
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          if (input.charCodeAt(pos) === 32) {
            result1 = " ";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\" \"");
            }
          }
        }
        result0 = result0 !== null ? result0 : "";
        return result0;
      }
      
      function parse___() {
        var result0, result1;
        
        if (input.charCodeAt(pos) === 32) {
          result1 = " ";
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("\" \"");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (input.charCodeAt(pos) === 32) {
              result1 = " ";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\" \"");
              }
            }
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
        var parser, edges, nodes; 
      
        parser = this;
        delete parser.exports;
        delete parser.inports;
        delete parser.outports;
      
        edges = parser.edges = [];
      
        nodes = {};
      
        parser.addNode = function (nodeName, comp) {
          if (!nodes[nodeName]) {
            nodes[nodeName] = {}
          }
          if (!!comp.comp) {
            nodes[nodeName].component = comp.comp;
          }
          if (!!comp.meta) {
            var metadata = {};
            for (var i = 0; i < comp.meta.length; i++) {
              var item = comp.meta[i].split('=');
              if (item.length === 1) {
                item = ['routes', item[0]];
              }
              metadata[item[0]] = item[1];
            }
            nodes[nodeName].metadata=metadata;
          }
         
        }
      
        parser.getResult = function () {
          return {processes:nodes, connections:parser.processEdges(), exports:parser.exports, inports: parser.inports, outports: parser.outports};
        }  
      
        var flatten = function (array, isShallow) {
          var index = -1,
            length = array ? array.length : 0,
            result = [];
      
          while (++index < length) {
            var value = array[index];
      
            if (value instanceof Array) {
              Array.prototype.push.apply(result, isShallow ? value : flatten(value));
            }
            else {
              result.push(value);
            }
          }
          return result;
        }
        
        parser.registerExports = function (priv, pub) {
          if (!parser.exports) {
            parser.exports = [];
          }
          parser.exports.push({private:priv.toLowerCase(), public:pub.toLowerCase()})
        }
        parser.registerInports = function (node, port, pub) {
          if (!parser.inports) {
            parser.inports = {};
          }
          parser.inports[pub.toLowerCase()] = {process:node, port:port.toLowerCase()}
        }
        parser.registerOutports = function (node, port, pub) {
          if (!parser.outports) {
            parser.outports = {};
          }
          parser.outports[pub.toLowerCase()] = {process:node, port:port.toLowerCase()}
        }
      
        parser.registerEdges = function (edges) {
      
          edges.forEach(function (o, i) {
            parser.edges.push(o);
          });
        }  
      
        parser.processEdges = function () {   
          var flats, grouped;
          flats = flatten(parser.edges);
          grouped = [];
          var current = {};
          flats.forEach(function (o, i) {
            if (i % 2 !== 0) { 
              var pair = grouped[grouped.length - 1];
              pair.tgt = o.tgt;
              return;
            }
            grouped.push(o);
          });
          return grouped;
        }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
});
require.register("noflo-noflo/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo","description":"Flow-Based Programming environment for JavaScript","keywords":["fbp","workflow","flow"],"repo":"noflo/noflo","version":"0.5.10","dependencies":{"bergie/emitter":"*","jashkenas/underscore":"*","noflo/fbp":"*"},"remotes":["https://raw.githubusercontent.com"],"development":{},"license":"MIT","main":"src/lib/NoFlo.js","scripts":["src/lib/Graph.js","src/lib/InternalSocket.js","src/lib/BasePort.js","src/lib/InPort.js","src/lib/OutPort.js","src/lib/Ports.js","src/lib/Port.js","src/lib/ArrayPort.js","src/lib/Component.js","src/lib/AsyncComponent.js","src/lib/LoggingComponent.js","src/lib/ComponentLoader.js","src/lib/NoFlo.js","src/lib/Network.js","src/lib/Platform.js","src/lib/Journal.js","src/lib/Utils.js","src/lib/Helpers.js","src/lib/Streams.js","src/components/Graph.js"],"json":["component.json"],"noflo":{"components":{"Graph":"src/components/Graph.js"}}}');
});
require.register("noflo-noflo/src/lib/Graph.js", function(exports, require, module){
var EventEmitter, Graph, clone, mergeResolveTheirsNaive, platform, resetGraph,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

clone = require('./Utils').clone;

platform = require('./Platform');

Graph = (function(_super) {
  __extends(Graph, _super);

  Graph.prototype.name = '';

  Graph.prototype.properties = {};

  Graph.prototype.nodes = [];

  Graph.prototype.edges = [];

  Graph.prototype.initializers = [];

  Graph.prototype.exports = [];

  Graph.prototype.inports = {};

  Graph.prototype.outports = {};

  Graph.prototype.groups = [];

  function Graph(name) {
    this.name = name != null ? name : '';
    this.properties = {};
    this.nodes = [];
    this.edges = [];
    this.initializers = [];
    this.exports = [];
    this.inports = {};
    this.outports = {};
    this.groups = [];
    this.transaction = {
      id: null,
      depth: 0
    };
  }

  Graph.prototype.startTransaction = function(id, metadata) {
    if (this.transaction.id) {
      throw Error("Nested transactions not supported");
    }
    this.transaction.id = id;
    this.transaction.depth = 1;
    return this.emit('startTransaction', id, metadata);
  };

  Graph.prototype.endTransaction = function(id, metadata) {
    if (!this.transaction.id) {
      throw Error("Attempted to end non-existing transaction");
    }
    this.transaction.id = null;
    this.transaction.depth = 0;
    return this.emit('endTransaction', id, metadata);
  };

  Graph.prototype.checkTransactionStart = function() {
    if (!this.transaction.id) {
      return this.startTransaction('implicit');
    } else if (this.transaction.id === 'implicit') {
      return this.transaction.depth += 1;
    }
  };

  Graph.prototype.checkTransactionEnd = function() {
    if (this.transaction.id === 'implicit') {
      this.transaction.depth -= 1;
    }
    if (this.transaction.depth === 0) {
      return this.endTransaction('implicit');
    }
  };

  Graph.prototype.setProperties = function(properties) {
    var before, item, val;
    this.checkTransactionStart();
    before = clone(this.properties);
    for (item in properties) {
      val = properties[item];
      this.properties[item] = val;
    }
    this.emit('changeProperties', this.properties, before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addExport = function(publicPort, nodeKey, portKey, metadata) {
    var exported;
    if (metadata == null) {
      metadata = {
        x: 0,
        y: 0
      };
    }
    if (!this.getNode(nodeKey)) {
      return;
    }
    this.checkTransactionStart();
    exported = {
      "public": publicPort,
      process: nodeKey,
      port: portKey,
      metadata: metadata
    };
    this.exports.push(exported);
    this.emit('addExport', exported);
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeExport = function(publicPort) {
    var exported, found, idx, _i, _len, _ref;
    publicPort = publicPort.toLowerCase();
    found = null;
    _ref = this.exports;
    for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
      exported = _ref[idx];
      if (exported["public"] === publicPort) {
        found = exported;
      }
    }
    if (!found) {
      return;
    }
    this.checkTransactionStart();
    this.exports.splice(this.exports.indexOf(found), 1);
    this.emit('removeExport', found);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addInport = function(publicPort, nodeKey, portKey, metadata) {
    if (!this.getNode(nodeKey)) {
      return;
    }
    this.checkTransactionStart();
    this.inports[publicPort] = {
      process: nodeKey,
      port: portKey,
      metadata: metadata
    };
    this.emit('addInport', publicPort, this.inports[publicPort]);
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeInport = function(publicPort) {
    var port;
    publicPort = publicPort.toLowerCase();
    if (!this.inports[publicPort]) {
      return;
    }
    this.checkTransactionStart();
    port = this.inports[publicPort];
    this.setInportMetadata(publicPort, {});
    delete this.inports[publicPort];
    this.emit('removeInport', publicPort, port);
    return this.checkTransactionEnd();
  };

  Graph.prototype.renameInport = function(oldPort, newPort) {
    if (!this.inports[oldPort]) {
      return;
    }
    this.checkTransactionStart();
    this.inports[newPort] = this.inports[oldPort];
    delete this.inports[oldPort];
    this.emit('renameInport', oldPort, newPort);
    return this.checkTransactionEnd();
  };

  Graph.prototype.setInportMetadata = function(publicPort, metadata) {
    var before, item, val;
    if (!this.inports[publicPort]) {
      return;
    }
    this.checkTransactionStart();
    before = clone(this.inports[publicPort].metadata);
    if (!this.inports[publicPort].metadata) {
      this.inports[publicPort].metadata = {};
    }
    for (item in metadata) {
      val = metadata[item];
      if (val != null) {
        this.inports[publicPort].metadata[item] = val;
      } else {
        delete this.inports[publicPort].metadata[item];
      }
    }
    this.emit('changeInport', publicPort, this.inports[publicPort], before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addOutport = function(publicPort, nodeKey, portKey, metadata) {
    if (!this.getNode(nodeKey)) {
      return;
    }
    this.checkTransactionStart();
    this.outports[publicPort] = {
      process: nodeKey,
      port: portKey,
      metadata: metadata
    };
    this.emit('addOutport', publicPort, this.outports[publicPort]);
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeOutport = function(publicPort) {
    var port;
    publicPort = publicPort.toLowerCase();
    if (!this.outports[publicPort]) {
      return;
    }
    this.checkTransactionStart();
    port = this.outports[publicPort];
    this.setOutportMetadata(publicPort, {});
    delete this.outports[publicPort];
    this.emit('removeOutport', publicPort, port);
    return this.checkTransactionEnd();
  };

  Graph.prototype.renameOutport = function(oldPort, newPort) {
    if (!this.outports[oldPort]) {
      return;
    }
    this.checkTransactionStart();
    this.outports[newPort] = this.outports[oldPort];
    delete this.outports[oldPort];
    this.emit('renameOutport', oldPort, newPort);
    return this.checkTransactionEnd();
  };

  Graph.prototype.setOutportMetadata = function(publicPort, metadata) {
    var before, item, val;
    if (!this.outports[publicPort]) {
      return;
    }
    this.checkTransactionStart();
    before = clone(this.outports[publicPort].metadata);
    if (!this.outports[publicPort].metadata) {
      this.outports[publicPort].metadata = {};
    }
    for (item in metadata) {
      val = metadata[item];
      if (val != null) {
        this.outports[publicPort].metadata[item] = val;
      } else {
        delete this.outports[publicPort].metadata[item];
      }
    }
    this.emit('changeOutport', publicPort, this.outports[publicPort], before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addGroup = function(group, nodes, metadata) {
    var g;
    this.checkTransactionStart();
    g = {
      name: group,
      nodes: nodes,
      metadata: metadata
    };
    this.groups.push(g);
    this.emit('addGroup', g);
    return this.checkTransactionEnd();
  };

  Graph.prototype.renameGroup = function(oldName, newName) {
    var group, _i, _len, _ref;
    this.checkTransactionStart();
    _ref = this.groups;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      if (!group) {
        continue;
      }
      if (group.name !== oldName) {
        continue;
      }
      group.name = newName;
      this.emit('renameGroup', oldName, newName);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeGroup = function(groupName) {
    var group, _i, _len, _ref;
    this.checkTransactionStart();
    _ref = this.groups;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      if (!group) {
        continue;
      }
      if (group.name !== groupName) {
        continue;
      }
      this.setGroupMetadata(group.name, {});
      this.groups.splice(this.groups.indexOf(group), 1);
      this.emit('removeGroup', group);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.setGroupMetadata = function(groupName, metadata) {
    var before, group, item, val, _i, _len, _ref;
    this.checkTransactionStart();
    _ref = this.groups;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      if (!group) {
        continue;
      }
      if (group.name !== groupName) {
        continue;
      }
      before = clone(group.metadata);
      for (item in metadata) {
        val = metadata[item];
        if (val != null) {
          group.metadata[item] = val;
        } else {
          delete group.metadata[item];
        }
      }
      this.emit('changeGroup', group, before);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.addNode = function(id, component, metadata) {
    var node;
    this.checkTransactionStart();
    if (!metadata) {
      metadata = {};
    }
    node = {
      id: id,
      component: component,
      metadata: metadata
    };
    this.nodes.push(node);
    this.emit('addNode', node);
    this.checkTransactionEnd();
    return node;
  };

  Graph.prototype.removeNode = function(id) {
    var edge, exported, group, index, initializer, node, priv, pub, toRemove, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _q, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    node = this.getNode(id);
    if (!node) {
      return;
    }
    this.checkTransactionStart();
    toRemove = [];
    _ref = this.edges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      edge = _ref[_i];
      if ((edge.from.node === node.id) || (edge.to.node === node.id)) {
        toRemove.push(edge);
      }
    }
    for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
      edge = toRemove[_j];
      this.removeEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port);
    }
    toRemove = [];
    _ref1 = this.initializers;
    for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
      initializer = _ref1[_k];
      if (initializer.to.node === node.id) {
        toRemove.push(initializer);
      }
    }
    for (_l = 0, _len3 = toRemove.length; _l < _len3; _l++) {
      initializer = toRemove[_l];
      this.removeInitial(initializer.to.node, initializer.to.port);
    }
    toRemove = [];
    _ref2 = this.exports;
    for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
      exported = _ref2[_m];
      if (id.toLowerCase() === exported.process) {
        toRemove.push(exported);
      }
    }
    for (_n = 0, _len5 = toRemove.length; _n < _len5; _n++) {
      exported = toRemove[_n];
      this.removeExports(exported["public"]);
    }
    toRemove = [];
    _ref3 = this.inports;
    for (pub in _ref3) {
      priv = _ref3[pub];
      if (priv.process === id) {
        toRemove.push(pub);
      }
    }
    for (_o = 0, _len6 = toRemove.length; _o < _len6; _o++) {
      pub = toRemove[_o];
      this.removeInport(pub);
    }
    toRemove = [];
    _ref4 = this.outports;
    for (pub in _ref4) {
      priv = _ref4[pub];
      if (priv.process === id) {
        toRemove.push(pub);
      }
    }
    for (_p = 0, _len7 = toRemove.length; _p < _len7; _p++) {
      pub = toRemove[_p];
      this.removeOutport(pub);
    }
    _ref5 = this.groups;
    for (_q = 0, _len8 = _ref5.length; _q < _len8; _q++) {
      group = _ref5[_q];
      if (!group) {
        continue;
      }
      index = group.nodes.indexOf(id);
      if (index === -1) {
        continue;
      }
      group.nodes.splice(index, 1);
    }
    this.setNodeMetadata(id, {});
    if (-1 !== this.nodes.indexOf(node)) {
      this.nodes.splice(this.nodes.indexOf(node), 1);
    }
    this.emit('removeNode', node);
    return this.checkTransactionEnd();
  };

  Graph.prototype.getNode = function(id) {
    var node, _i, _len, _ref;
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      if (!node) {
        continue;
      }
      if (node.id === id) {
        return node;
      }
    }
    return null;
  };

  Graph.prototype.renameNode = function(oldId, newId) {
    var edge, exported, group, iip, index, node, priv, pub, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    this.checkTransactionStart();
    node = this.getNode(oldId);
    if (!node) {
      return;
    }
    node.id = newId;
    _ref = this.edges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      edge = _ref[_i];
      if (!edge) {
        continue;
      }
      if (edge.from.node === oldId) {
        edge.from.node = newId;
      }
      if (edge.to.node === oldId) {
        edge.to.node = newId;
      }
    }
    _ref1 = this.initializers;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      iip = _ref1[_j];
      if (!iip) {
        continue;
      }
      if (iip.to.node === oldId) {
        iip.to.node = newId;
      }
    }
    _ref2 = this.inports;
    for (pub in _ref2) {
      priv = _ref2[pub];
      if (priv.process === oldId) {
        priv.process = newId;
      }
    }
    _ref3 = this.outports;
    for (pub in _ref3) {
      priv = _ref3[pub];
      if (priv.process === oldId) {
        priv.process = newId;
      }
    }
    _ref4 = this.exports;
    for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
      exported = _ref4[_k];
      if (exported.process === oldId) {
        exported.process = newId;
      }
    }
    _ref5 = this.groups;
    for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
      group = _ref5[_l];
      if (!group) {
        continue;
      }
      index = group.nodes.indexOf(oldId);
      if (index === -1) {
        continue;
      }
      group.nodes[index] = newId;
    }
    this.emit('renameNode', oldId, newId);
    return this.checkTransactionEnd();
  };

  Graph.prototype.setNodeMetadata = function(id, metadata) {
    var before, item, node, val;
    node = this.getNode(id);
    if (!node) {
      return;
    }
    this.checkTransactionStart();
    before = clone(node.metadata);
    if (!node.metadata) {
      node.metadata = {};
    }
    for (item in metadata) {
      val = metadata[item];
      if (val != null) {
        node.metadata[item] = val;
      } else {
        delete node.metadata[item];
      }
    }
    this.emit('changeNode', node, before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addEdge = function(outNode, outPort, inNode, inPort, metadata) {
    var edge, _i, _len, _ref;
    if (metadata == null) {
      metadata = {};
    }
    _ref = this.edges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      edge = _ref[_i];
      if (edge.from.node === outNode && edge.from.port === outPort && edge.to.node === inNode && edge.to.port === inPort) {
        return;
      }
    }
    if (!this.getNode(outNode)) {
      return;
    }
    if (!this.getNode(inNode)) {
      return;
    }
    this.checkTransactionStart();
    edge = {
      from: {
        node: outNode,
        port: outPort
      },
      to: {
        node: inNode,
        port: inPort
      },
      metadata: metadata
    };
    this.edges.push(edge);
    this.emit('addEdge', edge);
    this.checkTransactionEnd();
    return edge;
  };

  Graph.prototype.addEdgeIndex = function(outNode, outPort, outIndex, inNode, inPort, inIndex, metadata) {
    var edge;
    if (metadata == null) {
      metadata = {};
    }
    if (!this.getNode(outNode)) {
      return;
    }
    if (!this.getNode(inNode)) {
      return;
    }
    if (inIndex === null) {
      inIndex = void 0;
    }
    if (outIndex === null) {
      outIndex = void 0;
    }
    if (!metadata) {
      metadata = {};
    }
    this.checkTransactionStart();
    edge = {
      from: {
        node: outNode,
        port: outPort,
        index: outIndex
      },
      to: {
        node: inNode,
        port: inPort,
        index: inIndex
      },
      metadata: metadata
    };
    this.edges.push(edge);
    this.emit('addEdge', edge);
    this.checkTransactionEnd();
    return edge;
  };

  Graph.prototype.removeEdge = function(node, port, node2, port2) {
    var edge, index, toKeep, toRemove, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    this.checkTransactionStart();
    toRemove = [];
    toKeep = [];
    if (node2 && port2) {
      _ref = this.edges;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        edge = _ref[index];
        if (edge.from.node === node && edge.from.port === port && edge.to.node === node2 && edge.to.port === port2) {
          this.setEdgeMetadata(edge.from.node, edge.from.port, edge.to.node, edge.to.port, {});
          toRemove.push(edge);
        } else {
          toKeep.push(edge);
        }
      }
    } else {
      _ref1 = this.edges;
      for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
        edge = _ref1[index];
        if ((edge.from.node === node && edge.from.port === port) || (edge.to.node === node && edge.to.port === port)) {
          this.setEdgeMetadata(edge.from.node, edge.from.port, edge.to.node, edge.to.port, {});
          toRemove.push(edge);
        } else {
          toKeep.push(edge);
        }
      }
    }
    this.edges = toKeep;
    for (_k = 0, _len2 = toRemove.length; _k < _len2; _k++) {
      edge = toRemove[_k];
      this.emit('removeEdge', edge);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.getEdge = function(node, port, node2, port2) {
    var edge, index, _i, _len, _ref;
    _ref = this.edges;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      edge = _ref[index];
      if (!edge) {
        continue;
      }
      if (edge.from.node === node && edge.from.port === port) {
        if (edge.to.node === node2 && edge.to.port === port2) {
          return edge;
        }
      }
    }
    return null;
  };

  Graph.prototype.setEdgeMetadata = function(node, port, node2, port2, metadata) {
    var before, edge, item, val;
    edge = this.getEdge(node, port, node2, port2);
    if (!edge) {
      return;
    }
    this.checkTransactionStart();
    before = clone(edge.metadata);
    if (!edge.metadata) {
      edge.metadata = {};
    }
    for (item in metadata) {
      val = metadata[item];
      if (val != null) {
        edge.metadata[item] = val;
      } else {
        delete edge.metadata[item];
      }
    }
    this.emit('changeEdge', edge, before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addInitial = function(data, node, port, metadata) {
    var initializer;
    if (!this.getNode(node)) {
      return;
    }
    this.checkTransactionStart();
    initializer = {
      from: {
        data: data
      },
      to: {
        node: node,
        port: port
      },
      metadata: metadata
    };
    this.initializers.push(initializer);
    this.emit('addInitial', initializer);
    this.checkTransactionEnd();
    return initializer;
  };

  Graph.prototype.addInitialIndex = function(data, node, port, index, metadata) {
    var initializer;
    if (!this.getNode(node)) {
      return;
    }
    if (index === null) {
      index = void 0;
    }
    this.checkTransactionStart();
    initializer = {
      from: {
        data: data
      },
      to: {
        node: node,
        port: port,
        index: index
      },
      metadata: metadata
    };
    this.initializers.push(initializer);
    this.emit('addInitial', initializer);
    this.checkTransactionEnd();
    return initializer;
  };

  Graph.prototype.addGraphInitial = function(data, node, metadata) {
    var inport;
    inport = this.inports[node];
    if (!inport) {
      return;
    }
    return this.addInitial(data, inport.process, inport.port, metadata);
  };

  Graph.prototype.addGraphInitialIndex = function(data, node, index, metadata) {
    var inport;
    inport = this.inports[node];
    if (!inport) {
      return;
    }
    return this.addInitialIndex(data, inport.process, inport.port, index, metadata);
  };

  Graph.prototype.removeInitial = function(node, port) {
    var edge, index, toKeep, toRemove, _i, _j, _len, _len1, _ref;
    this.checkTransactionStart();
    toRemove = [];
    toKeep = [];
    _ref = this.initializers;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      edge = _ref[index];
      if (edge.to.node === node && edge.to.port === port) {
        toRemove.push(edge);
      } else {
        toKeep.push(edge);
      }
    }
    this.initializers = toKeep;
    for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
      edge = toRemove[_j];
      this.emit('removeInitial', edge);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeGraphInitial = function(node) {
    var inport;
    inport = this.inports[node];
    if (!inport) {
      return;
    }
    return this.removeInitial(inport.process, inport.port);
  };

  Graph.prototype.toDOT = function() {
    var cleanID, cleanPort, data, dot, edge, id, initializer, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    cleanID = function(id) {
      return id.replace(/\s*/g, "");
    };
    cleanPort = function(port) {
      return port.replace(/\./g, "");
    };
    dot = "digraph {\n";
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      dot += "    " + (cleanID(node.id)) + " [label=" + node.id + " shape=box]\n";
    }
    _ref1 = this.initializers;
    for (id = _j = 0, _len1 = _ref1.length; _j < _len1; id = ++_j) {
      initializer = _ref1[id];
      if (typeof initializer.from.data === 'function') {
        data = 'Function';
      } else {
        data = initializer.from.data;
      }
      dot += "    data" + id + " [label=\"'" + data + "'\" shape=plaintext]\n";
      dot += "    data" + id + " -> " + (cleanID(initializer.to.node)) + "[headlabel=" + (cleanPort(initializer.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
    }
    _ref2 = this.edges;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      edge = _ref2[_k];
      dot += "    " + (cleanID(edge.from.node)) + " -> " + (cleanID(edge.to.node)) + "[taillabel=" + (cleanPort(edge.from.port)) + " headlabel=" + (cleanPort(edge.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
    }
    dot += "}";
    return dot;
  };

  Graph.prototype.toYUML = function() {
    var edge, initializer, yuml, _i, _j, _len, _len1, _ref, _ref1;
    yuml = [];
    _ref = this.initializers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      initializer = _ref[_i];
      yuml.push("(start)[" + initializer.to.port + "]->(" + initializer.to.node + ")");
    }
    _ref1 = this.edges;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      edge = _ref1[_j];
      yuml.push("(" + edge.from.node + ")[" + edge.from.port + "]->(" + edge.to.node + ")");
    }
    return yuml.join(",");
  };

  Graph.prototype.toJSON = function() {
    var connection, edge, exported, group, groupData, initializer, json, node, priv, property, pub, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    json = {
      properties: {},
      inports: {},
      outports: {},
      groups: [],
      processes: {},
      connections: []
    };
    if (this.name) {
      json.properties.name = this.name;
    }
    _ref = this.properties;
    for (property in _ref) {
      value = _ref[property];
      json.properties[property] = value;
    }
    _ref1 = this.inports;
    for (pub in _ref1) {
      priv = _ref1[pub];
      json.inports[pub] = priv;
    }
    _ref2 = this.outports;
    for (pub in _ref2) {
      priv = _ref2[pub];
      json.outports[pub] = priv;
    }
    _ref3 = this.exports;
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      exported = _ref3[_i];
      if (!json.exports) {
        json.exports = [];
      }
      json.exports.push(exported);
    }
    _ref4 = this.groups;
    for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
      group = _ref4[_j];
      groupData = {
        name: group.name,
        nodes: group.nodes
      };
      if (Object.keys(group.metadata).length) {
        groupData.metadata = group.metadata;
      }
      json.groups.push(groupData);
    }
    _ref5 = this.nodes;
    for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
      node = _ref5[_k];
      json.processes[node.id] = {
        component: node.component
      };
      if (node.metadata) {
        json.processes[node.id].metadata = node.metadata;
      }
    }
    _ref6 = this.edges;
    for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
      edge = _ref6[_l];
      connection = {
        src: {
          process: edge.from.node,
          port: edge.from.port,
          index: edge.from.index
        },
        tgt: {
          process: edge.to.node,
          port: edge.to.port,
          index: edge.to.index
        }
      };
      if (Object.keys(edge.metadata).length) {
        connection.metadata = edge.metadata;
      }
      json.connections.push(connection);
    }
    _ref7 = this.initializers;
    for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
      initializer = _ref7[_m];
      json.connections.push({
        data: initializer.from.data,
        tgt: {
          process: initializer.to.node,
          port: initializer.to.port,
          index: initializer.to.index
        }
      });
    }
    return json;
  };

  Graph.prototype.save = function(file, success) {
    var json;
    json = JSON.stringify(this.toJSON(), null, 4);
    return require('fs').writeFile("" + file + ".json", json, "utf-8", function(err, data) {
      if (err) {
        throw err;
      }
      return success(file);
    });
  };

  return Graph;

})(EventEmitter);

exports.Graph = Graph;

exports.createGraph = function(name) {
  return new Graph(name);
};

exports.loadJSON = function(definition, success, metadata) {
  var conn, def, exported, graph, group, id, portId, priv, processId, properties, property, pub, split, value, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
  if (metadata == null) {
    metadata = {};
  }
  if (typeof definition === 'string') {
    definition = JSON.parse(definition);
  }
  if (!definition.properties) {
    definition.properties = {};
  }
  if (!definition.processes) {
    definition.processes = {};
  }
  if (!definition.connections) {
    definition.connections = [];
  }
  graph = new Graph(definition.properties.name);
  graph.startTransaction('loadJSON', metadata);
  properties = {};
  _ref = definition.properties;
  for (property in _ref) {
    value = _ref[property];
    if (property === 'name') {
      continue;
    }
    properties[property] = value;
  }
  graph.setProperties(properties);
  _ref1 = definition.processes;
  for (id in _ref1) {
    def = _ref1[id];
    if (!def.metadata) {
      def.metadata = {};
    }
    graph.addNode(id, def.component, def.metadata);
  }
  _ref2 = definition.connections;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    conn = _ref2[_i];
    metadata = conn.metadata ? conn.metadata : {};
    if (conn.data !== void 0) {
      if (typeof conn.tgt.index === 'number') {
        graph.addInitialIndex(conn.data, conn.tgt.process, conn.tgt.port.toLowerCase(), conn.tgt.index, metadata);
      } else {
        graph.addInitial(conn.data, conn.tgt.process, conn.tgt.port.toLowerCase(), metadata);
      }
      continue;
    }
    if (typeof conn.src.index === 'number' || typeof conn.tgt.index === 'number') {
      graph.addEdgeIndex(conn.src.process, conn.src.port.toLowerCase(), conn.src.index, conn.tgt.process, conn.tgt.port.toLowerCase(), conn.tgt.index, metadata);
      continue;
    }
    graph.addEdge(conn.src.process, conn.src.port.toLowerCase(), conn.tgt.process, conn.tgt.port.toLowerCase(), metadata);
  }
  if (definition.exports && definition.exports.length) {
    _ref3 = definition.exports;
    for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
      exported = _ref3[_j];
      if (exported["private"]) {
        split = exported["private"].split('.');
        if (split.length !== 2) {
          continue;
        }
        processId = split[0];
        portId = split[1];
        for (id in definition.processes) {
          if (id.toLowerCase() === processId.toLowerCase()) {
            processId = id;
          }
        }
      } else {
        processId = exported.process;
        portId = exported.port;
      }
      graph.addExport(exported["public"], processId, portId, exported.metadata);
    }
  }
  if (definition.inports) {
    _ref4 = definition.inports;
    for (pub in _ref4) {
      priv = _ref4[pub];
      graph.addInport(pub, priv.process, priv.port, priv.metadata);
    }
  }
  if (definition.outports) {
    _ref5 = definition.outports;
    for (pub in _ref5) {
      priv = _ref5[pub];
      graph.addOutport(pub, priv.process, priv.port, priv.metadata);
    }
  }
  if (definition.groups) {
    _ref6 = definition.groups;
    for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
      group = _ref6[_k];
      graph.addGroup(group.name, group.nodes, group.metadata || {});
    }
  }
  graph.endTransaction('loadJSON');
  return success(graph);
};

exports.loadFBP = function(fbpData, success) {
  var definition;
  definition = require('fbp').parse(fbpData);
  return exports.loadJSON(definition, success);
};

exports.loadHTTP = function(url, success) {
  var req;
  req = new XMLHttpRequest;
  req.onreadystatechange = function() {
    if (req.readyState !== 4) {
      return;
    }
    if (req.status !== 200) {
      return success();
    }
    return success(req.responseText);
  };
  req.open('GET', url, true);
  return req.send();
};

exports.loadFile = function(file, success, metadata) {
  var definition, e;
  if (metadata == null) {
    metadata = {};
  }
  if (platform.isBrowser()) {
    try {
      definition = require(file);
    } catch (_error) {
      e = _error;
      exports.loadHTTP(file, function(data) {
        if (!data) {
          throw new Error("Failed to load graph " + file);
          return;
        }
        if (file.split('.').pop() === 'fbp') {
          return exports.loadFBP(data, success, metadata);
        }
        definition = JSON.parse(data);
        return exports.loadJSON(definition, success, metadata);
      });
      return;
    }
    exports.loadJSON(definition, success, metadata);
    return;
  }
  return require('fs').readFile(file, "utf-8", function(err, data) {
    if (err) {
      throw err;
    }
    if (file.split('.').pop() === 'fbp') {
      return exports.loadFBP(data, success);
    }
    definition = JSON.parse(data);
    return exports.loadJSON(definition, success);
  });
};

resetGraph = function(graph) {
  var edge, exp, group, iip, node, port, v, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
  _ref = (clone(graph.groups)).reverse();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    group = _ref[_i];
    if (group != null) {
      graph.removeGroup(group.name);
    }
  }
  _ref1 = clone(graph.outports);
  for (port in _ref1) {
    v = _ref1[port];
    graph.removeOutport(port);
  }
  _ref2 = clone(graph.inports);
  for (port in _ref2) {
    v = _ref2[port];
    graph.removeInport(port);
  }
  _ref3 = clone(graph.exports.reverse());
  for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
    exp = _ref3[_j];
    graph.removeExports(exp["public"]);
  }
  graph.setProperties({});
  _ref4 = (clone(graph.initializers)).reverse();
  for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
    iip = _ref4[_k];
    graph.removeInitial(iip.to.node, iip.to.port);
  }
  _ref5 = (clone(graph.edges)).reverse();
  for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
    edge = _ref5[_l];
    graph.removeEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port);
  }
  _ref6 = (clone(graph.nodes)).reverse();
  _results = [];
  for (_m = 0, _len4 = _ref6.length; _m < _len4; _m++) {
    node = _ref6[_m];
    _results.push(graph.removeNode(node.id));
  }
  return _results;
};

mergeResolveTheirsNaive = function(base, to) {
  var edge, exp, group, iip, node, priv, pub, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
  resetGraph(base);
  _ref = to.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    base.addNode(node.id, node.component, node.metadata);
  }
  _ref1 = to.edges;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    edge = _ref1[_j];
    base.addEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port, edge.metadata);
  }
  _ref2 = to.initializers;
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    iip = _ref2[_k];
    base.addInitial(iip.from.data, iip.to.node, iip.to.port, iip.metadata);
  }
  _ref3 = to.exports;
  for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
    exp = _ref3[_l];
    base.addExport(exp["public"], exp.node, exp.port, exp.metadata);
  }
  base.setProperties(to.properties);
  _ref4 = to.inports;
  for (pub in _ref4) {
    priv = _ref4[pub];
    base.addInport(pub, priv.process, priv.port, priv.metadata);
  }
  _ref5 = to.outports;
  for (pub in _ref5) {
    priv = _ref5[pub];
    base.addOutport(pub, priv.process, priv.port, priv.metadata);
  }
  _ref6 = to.groups;
  _results = [];
  for (_m = 0, _len4 = _ref6.length; _m < _len4; _m++) {
    group = _ref6[_m];
    _results.push(base.addGroup(group.name, group.nodes, group.metadata));
  }
  return _results;
};

exports.equivalent = function(a, b, options) {
  var A, B;
  if (options == null) {
    options = {};
  }
  A = JSON.stringify(a);
  B = JSON.stringify(b);
  return A === B;
};

exports.mergeResolveTheirs = mergeResolveTheirsNaive;

});
require.register("noflo-noflo/src/lib/InternalSocket.js", function(exports, require, module){
var EventEmitter, InternalSocket,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

InternalSocket = (function(_super) {
  __extends(InternalSocket, _super);

  InternalSocket.prototype.regularEmitEvent = function(event, data) {
    return this.emit(event, data);
  };

  InternalSocket.prototype.debugEmitEvent = function(event, data) {
    var error;
    try {
      return this.emit(event, data);
    } catch (_error) {
      error = _error;
      return this.emit('error', {
        id: this.to.process.id,
        error: error
      });
    }
  };

  function InternalSocket() {
    this.connected = false;
    this.groups = [];
    this.dataDelegate = null;
    this.debug = false;
    this.emitEvent = this.regularEmitEvent;
  }

  InternalSocket.prototype.connect = function() {
    if (this.connected) {
      return;
    }
    this.connected = true;
    return this.emitEvent('connect', this);
  };

  InternalSocket.prototype.disconnect = function() {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    return this.emitEvent('disconnect', this);
  };

  InternalSocket.prototype.isConnected = function() {
    return this.connected;
  };

  InternalSocket.prototype.send = function(data) {
    if (!this.connected) {
      this.connect();
    }
    if (data === void 0 && typeof this.dataDelegate === 'function') {
      data = this.dataDelegate();
    }
    return this.emitEvent('data', data);
  };

  InternalSocket.prototype.beginGroup = function(group) {
    this.groups.push(group);
    return this.emitEvent('begingroup', group);
  };

  InternalSocket.prototype.endGroup = function() {
    if (!this.groups.length) {
      return;
    }
    return this.emitEvent('endgroup', this.groups.pop());
  };

  InternalSocket.prototype.setDataDelegate = function(delegate) {
    if (typeof delegate !== 'function') {
      throw Error('A data delegate must be a function.');
    }
    return this.dataDelegate = delegate;
  };

  InternalSocket.prototype.setDebug = function(active) {
    this.debug = active;
    return this.emitEvent = this.debug ? this.debugEmitEvent : this.regularEmitEvent;
  };

  InternalSocket.prototype.getId = function() {
    var fromStr, toStr;
    fromStr = function(from) {
      return "" + from.process.id + "() " + (from.port.toUpperCase());
    };
    toStr = function(to) {
      return "" + (to.port.toUpperCase()) + " " + to.process.id + "()";
    };
    if (!(this.from || this.to)) {
      return "UNDEFINED";
    }
    if (this.from && !this.to) {
      return "" + (fromStr(this.from)) + " -> ANON";
    }
    if (!this.from) {
      return "DATA -> " + (toStr(this.to));
    }
    return "" + (fromStr(this.from)) + " -> " + (toStr(this.to));
  };

  return InternalSocket;

})(EventEmitter);

exports.InternalSocket = InternalSocket;

exports.createSocket = function() {
  return new InternalSocket;
};

});
require.register("noflo-noflo/src/lib/BasePort.js", function(exports, require, module){
var BasePort, EventEmitter, validTypes,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

validTypes = ['all', 'string', 'number', 'int', 'object', 'array', 'boolean', 'color', 'date', 'bang', 'function', 'buffer'];

BasePort = (function(_super) {
  __extends(BasePort, _super);

  function BasePort(options) {
    this.handleOptions(options);
    this.sockets = [];
    this.node = null;
    this.name = null;
  }

  BasePort.prototype.handleOptions = function(options) {
    if (!options) {
      options = {};
    }
    if (!options.datatype) {
      options.datatype = 'all';
    }
    if (options.required === void 0) {
      options.required = false;
    }
    if (options.datatype === 'integer') {
      options.datatype = 'int';
    }
    if (validTypes.indexOf(options.datatype) === -1) {
      throw new Error("Invalid port datatype '" + options.datatype + "' specified, valid are " + (validTypes.join(', ')));
    }
    if (options.type && options.type.indexOf('/') === -1) {
      throw new Error("Invalid port type '" + options.type + "' specified. Should be URL or MIME type");
    }
    return this.options = options;
  };

  BasePort.prototype.getId = function() {
    if (!(this.node && this.name)) {
      return 'Port';
    }
    return "" + this.node + " " + (this.name.toUpperCase());
  };

  BasePort.prototype.getDataType = function() {
    return this.options.datatype;
  };

  BasePort.prototype.getDescription = function() {
    return this.options.description;
  };

  BasePort.prototype.attach = function(socket, index) {
    if (index == null) {
      index = null;
    }
    if (!this.isAddressable() || index === null) {
      index = this.sockets.length;
    }
    this.sockets[index] = socket;
    this.attachSocket(socket, index);
    if (this.isAddressable()) {
      this.emit('attach', socket, index);
      return;
    }
    return this.emit('attach', socket);
  };

  BasePort.prototype.attachSocket = function() {};

  BasePort.prototype.detach = function(socket) {
    var index;
    index = this.sockets.indexOf(socket);
    if (index === -1) {
      return;
    }
    this.sockets[index] = void 0;
    if (this.isAddressable()) {
      this.emit('detach', socket, index);
      return;
    }
    return this.emit('detach', socket);
  };

  BasePort.prototype.isAddressable = function() {
    if (this.options.addressable) {
      return true;
    }
    return false;
  };

  BasePort.prototype.isBuffered = function() {
    if (this.options.buffered) {
      return true;
    }
    return false;
  };

  BasePort.prototype.isRequired = function() {
    if (this.options.required) {
      return true;
    }
    return false;
  };

  BasePort.prototype.isAttached = function(socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (this.isAddressable() && socketId !== null) {
      if (this.sockets[socketId]) {
        return true;
      }
      return false;
    }
    if (this.sockets.length) {
      return true;
    }
    return false;
  };

  BasePort.prototype.listAttached = function() {
    var attached, idx, socket, _i, _len, _ref;
    attached = [];
    _ref = this.sockets;
    for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
      socket = _ref[idx];
      if (!socket) {
        continue;
      }
      attached.push(idx);
    }
    return attached;
  };

  BasePort.prototype.isConnected = function(socketId) {
    var connected;
    if (socketId == null) {
      socketId = null;
    }
    if (this.isAddressable()) {
      if (socketId === null) {
        throw new Error("" + (this.getId()) + ": Socket ID required");
      }
      if (!this.sockets[socketId]) {
        throw new Error("" + (this.getId()) + ": Socket " + socketId + " not available");
      }
      return this.sockets[socketId].isConnected();
    }
    connected = false;
    this.sockets.forEach((function(_this) {
      return function(socket) {
        if (!socket) {
          return;
        }
        if (socket.isConnected()) {
          return connected = true;
        }
      };
    })(this));
    return connected;
  };

  BasePort.prototype.canAttach = function() {
    return true;
  };

  return BasePort;

})(EventEmitter);

module.exports = BasePort;

});
require.register("noflo-noflo/src/lib/InPort.js", function(exports, require, module){
var BasePort, InPort,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BasePort = require('./BasePort');

InPort = (function(_super) {
  __extends(InPort, _super);

  function InPort(options, process) {
    this.process = null;
    if (!process && typeof options === 'function') {
      process = options;
      options = {};
    }
    if (options && options.buffered === void 0) {
      options.buffered = false;
    }
    if (!process && options && options.process) {
      process = options.process;
      delete options.process;
    }
    if (process) {
      if (typeof process !== 'function') {
        throw new Error('process must be a function');
      }
      this.process = process;
    }
    InPort.__super__.constructor.call(this, options);
    this.prepareBuffer();
  }

  InPort.prototype.attachSocket = function(socket, localId) {
    if (localId == null) {
      localId = null;
    }
    if (this.hasDefault()) {
      socket.setDataDelegate((function(_this) {
        return function() {
          return _this.options["default"];
        };
      })(this));
    }
    socket.on('connect', (function(_this) {
      return function() {
        return _this.handleSocketEvent('connect', socket, localId);
      };
    })(this));
    socket.on('begingroup', (function(_this) {
      return function(group) {
        return _this.handleSocketEvent('begingroup', group, localId);
      };
    })(this));
    socket.on('data', (function(_this) {
      return function(data) {
        _this.validateData(data);
        return _this.handleSocketEvent('data', data, localId);
      };
    })(this));
    socket.on('endgroup', (function(_this) {
      return function(group) {
        return _this.handleSocketEvent('endgroup', group, localId);
      };
    })(this));
    return socket.on('disconnect', (function(_this) {
      return function() {
        return _this.handleSocketEvent('disconnect', socket, localId);
      };
    })(this));
  };

  InPort.prototype.handleSocketEvent = function(event, payload, id) {
    if (this.isBuffered()) {
      this.buffer.push({
        event: event,
        payload: payload,
        id: id
      });
      if (this.isAddressable()) {
        if (this.process) {
          this.process(event, id, this.nodeInstance);
        }
        this.emit(event, id);
      } else {
        if (this.process) {
          this.process(event, this.nodeInstance);
        }
        this.emit(event);
      }
      return;
    }
    if (this.process) {
      if (this.isAddressable()) {
        this.process(event, payload, id, this.nodeInstance);
      } else {
        this.process(event, payload, this.nodeInstance);
      }
    }
    if (this.isAddressable()) {
      return this.emit(event, payload, id);
    }
    return this.emit(event, payload);
  };

  InPort.prototype.hasDefault = function() {
    return this.options["default"] !== void 0;
  };

  InPort.prototype.prepareBuffer = function() {
    if (!this.isBuffered()) {
      return;
    }
    return this.buffer = [];
  };

  InPort.prototype.validateData = function(data) {
    if (!this.options.values) {
      return;
    }
    if (this.options.values.indexOf(data) === -1) {
      throw new Error('Invalid data received');
    }
  };

  InPort.prototype.receive = function() {
    if (!this.isBuffered()) {
      throw new Error('Receive is only possible on buffered ports');
    }
    return this.buffer.shift();
  };

  InPort.prototype.contains = function() {
    if (!this.isBuffered()) {
      throw new Error('Contains query is only possible on buffered ports');
    }
    return this.buffer.filter(function(packet) {
      if (packet.event === 'data') {
        return true;
      }
    }).length;
  };

  return InPort;

})(BasePort);

module.exports = InPort;

});
require.register("noflo-noflo/src/lib/OutPort.js", function(exports, require, module){
var BasePort, OutPort,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BasePort = require('./BasePort');

OutPort = (function(_super) {
  __extends(OutPort, _super);

  function OutPort(options) {
    this.cache = {};
    OutPort.__super__.constructor.call(this, options);
  }

  OutPort.prototype.attach = function(socket, index) {
    if (index == null) {
      index = null;
    }
    OutPort.__super__.attach.call(this, socket, index);
    if (this.isCaching() && (this.cache[index] != null)) {
      return this.send(this.cache[index], index);
    }
  };

  OutPort.prototype.connect = function(socketId) {
    var socket, sockets, _i, _len, _results;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    _results = [];
    for (_i = 0, _len = sockets.length; _i < _len; _i++) {
      socket = sockets[_i];
      if (!socket) {
        continue;
      }
      _results.push(socket.connect());
    }
    return _results;
  };

  OutPort.prototype.beginGroup = function(group, socketId) {
    var sockets;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    return sockets.forEach(function(socket) {
      if (!socket) {
        return;
      }
      if (socket.isConnected()) {
        return socket.beginGroup(group);
      }
      socket.once('connect', function() {
        return socket.beginGroup(group);
      });
      return socket.connect();
    });
  };

  OutPort.prototype.send = function(data, socketId) {
    var sockets;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    if (this.isCaching() && data !== this.cache[socketId]) {
      this.cache[socketId] = data;
    }
    return sockets.forEach(function(socket) {
      if (!socket) {
        return;
      }
      if (socket.isConnected()) {
        return socket.send(data);
      }
      socket.once('connect', function() {
        return socket.send(data);
      });
      return socket.connect();
    });
  };

  OutPort.prototype.endGroup = function(socketId) {
    var socket, sockets, _i, _len, _results;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    _results = [];
    for (_i = 0, _len = sockets.length; _i < _len; _i++) {
      socket = sockets[_i];
      if (!socket) {
        continue;
      }
      _results.push(socket.endGroup());
    }
    return _results;
  };

  OutPort.prototype.disconnect = function(socketId) {
    var socket, sockets, _i, _len, _results;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    _results = [];
    for (_i = 0, _len = sockets.length; _i < _len; _i++) {
      socket = sockets[_i];
      if (!socket) {
        continue;
      }
      _results.push(socket.disconnect());
    }
    return _results;
  };

  OutPort.prototype.checkRequired = function(sockets) {
    if (sockets.length === 0 && this.isRequired()) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
  };

  OutPort.prototype.getSockets = function(socketId) {
    if (this.isAddressable()) {
      if (socketId === null) {
        throw new Error("" + (this.getId()) + " Socket ID required");
      }
      if (!this.sockets[socketId]) {
        return [];
      }
      return [this.sockets[socketId]];
    }
    return this.sockets;
  };

  OutPort.prototype.isCaching = function() {
    if (this.options.caching) {
      return true;
    }
    return false;
  };

  return OutPort;

})(BasePort);

module.exports = OutPort;

});
require.register("noflo-noflo/src/lib/Ports.js", function(exports, require, module){
var EventEmitter, InPort, InPorts, OutPort, OutPorts, Ports,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

InPort = require('./InPort');

OutPort = require('./OutPort');

Ports = (function(_super) {
  __extends(Ports, _super);

  Ports.prototype.model = InPort;

  function Ports(ports) {
    var name, options;
    this.ports = {};
    if (!ports) {
      return;
    }
    for (name in ports) {
      options = ports[name];
      this.add(name, options);
    }
  }

  Ports.prototype.add = function(name, options, process) {
    if (name === 'add' || name === 'remove') {
      throw new Error('Add and remove are restricted port names');
    }
    if (!name.match(/^[a-z0-9_\.\/]+$/)) {
      throw new Error("Port names can only contain lowercase alphanumeric characters and underscores. '" + name + "' not allowed");
    }
    if (this.ports[name]) {
      this.remove(name);
    }
    if (typeof options === 'object' && options.canAttach) {
      this.ports[name] = options;
    } else {
      this.ports[name] = new this.model(options, process);
    }
    this[name] = this.ports[name];
    this.emit('add', name);
    return this;
  };

  Ports.prototype.remove = function(name) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not defined");
    }
    delete this.ports[name];
    delete this[name];
    this.emit('remove', name);
    return this;
  };

  return Ports;

})(EventEmitter);

exports.InPorts = InPorts = (function(_super) {
  __extends(InPorts, _super);

  function InPorts() {
    return InPorts.__super__.constructor.apply(this, arguments);
  }

  InPorts.prototype.on = function(name, event, callback) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].on(event, callback);
  };

  InPorts.prototype.once = function(name, event, callback) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].once(event, callback);
  };

  return InPorts;

})(Ports);

exports.OutPorts = OutPorts = (function(_super) {
  __extends(OutPorts, _super);

  function OutPorts() {
    return OutPorts.__super__.constructor.apply(this, arguments);
  }

  OutPorts.prototype.model = OutPort;

  OutPorts.prototype.connect = function(name, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].connect(socketId);
  };

  OutPorts.prototype.beginGroup = function(name, group, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].beginGroup(group, socketId);
  };

  OutPorts.prototype.send = function(name, data, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].send(data, socketId);
  };

  OutPorts.prototype.endGroup = function(name, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].endGroup(socketId);
  };

  OutPorts.prototype.disconnect = function(name, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].disconnect(socketId);
  };

  return OutPorts;

})(Ports);

});
require.register("noflo-noflo/src/lib/Port.js", function(exports, require, module){
var EventEmitter, Port,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

Port = (function(_super) {
  __extends(Port, _super);

  Port.prototype.description = '';

  Port.prototype.required = true;

  function Port(type) {
    this.type = type;
    if (!this.type) {
      this.type = 'all';
    }
    if (this.type === 'integer') {
      this.type = 'int';
    }
    this.sockets = [];
    this.from = null;
    this.node = null;
    this.name = null;
  }

  Port.prototype.getId = function() {
    if (!(this.node && this.name)) {
      return 'Port';
    }
    return "" + this.node + " " + (this.name.toUpperCase());
  };

  Port.prototype.getDataType = function() {
    return this.type;
  };

  Port.prototype.getDescription = function() {
    return this.description;
  };

  Port.prototype.attach = function(socket) {
    this.sockets.push(socket);
    return this.attachSocket(socket);
  };

  Port.prototype.attachSocket = function(socket, localId) {
    if (localId == null) {
      localId = null;
    }
    this.emit("attach", socket, localId);
    this.from = socket.from;
    if (socket.setMaxListeners) {
      socket.setMaxListeners(0);
    }
    socket.on("connect", (function(_this) {
      return function() {
        return _this.emit("connect", socket, localId);
      };
    })(this));
    socket.on("begingroup", (function(_this) {
      return function(group) {
        return _this.emit("begingroup", group, localId);
      };
    })(this));
    socket.on("data", (function(_this) {
      return function(data) {
        return _this.emit("data", data, localId);
      };
    })(this));
    socket.on("endgroup", (function(_this) {
      return function(group) {
        return _this.emit("endgroup", group, localId);
      };
    })(this));
    return socket.on("disconnect", (function(_this) {
      return function() {
        return _this.emit("disconnect", socket, localId);
      };
    })(this));
  };

  Port.prototype.connect = function() {
    var socket, _i, _len, _ref, _results;
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.connect());
    }
    return _results;
  };

  Port.prototype.beginGroup = function(group) {
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    return this.sockets.forEach(function(socket) {
      if (socket.isConnected()) {
        return socket.beginGroup(group);
      }
      socket.once('connect', function() {
        return socket.beginGroup(group);
      });
      return socket.connect();
    });
  };

  Port.prototype.send = function(data) {
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    return this.sockets.forEach(function(socket) {
      if (socket.isConnected()) {
        return socket.send(data);
      }
      socket.once('connect', function() {
        return socket.send(data);
      });
      return socket.connect();
    });
  };

  Port.prototype.endGroup = function() {
    var socket, _i, _len, _ref, _results;
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.endGroup());
    }
    return _results;
  };

  Port.prototype.disconnect = function() {
    var socket, _i, _len, _ref, _results;
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.disconnect());
    }
    return _results;
  };

  Port.prototype.detach = function(socket) {
    var index;
    if (this.sockets.length === 0) {
      return;
    }
    if (!socket) {
      socket = this.sockets[0];
    }
    index = this.sockets.indexOf(socket);
    if (index === -1) {
      return;
    }
    if (this.isAddressable()) {
      this.sockets[index] = void 0;
      this.emit('detach', socket, index);
      return;
    }
    this.sockets.splice(index, 1);
    return this.emit("detach", socket);
  };

  Port.prototype.isConnected = function() {
    var connected;
    connected = false;
    this.sockets.forEach((function(_this) {
      return function(socket) {
        if (socket.isConnected()) {
          return connected = true;
        }
      };
    })(this));
    return connected;
  };

  Port.prototype.isAddressable = function() {
    return false;
  };

  Port.prototype.isRequired = function() {
    return this.required;
  };

  Port.prototype.isAttached = function() {
    if (this.sockets.length > 0) {
      return true;
    }
    return false;
  };

  Port.prototype.listAttached = function() {
    var attached, idx, socket, _i, _len, _ref;
    attached = [];
    _ref = this.sockets;
    for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
      socket = _ref[idx];
      if (!socket) {
        continue;
      }
      attached.push(idx);
    }
    return attached;
  };

  Port.prototype.canAttach = function() {
    return true;
  };

  return Port;

})(EventEmitter);

exports.Port = Port;

});
require.register("noflo-noflo/src/lib/ArrayPort.js", function(exports, require, module){
var ArrayPort, port,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

port = require("./Port");

ArrayPort = (function(_super) {
  __extends(ArrayPort, _super);

  function ArrayPort(type) {
    this.type = type;
    ArrayPort.__super__.constructor.call(this, this.type);
  }

  ArrayPort.prototype.attach = function(socket, socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      socketId = this.sockets.length;
    }
    this.sockets[socketId] = socket;
    return this.attachSocket(socket, socketId);
  };

  ArrayPort.prototype.connect = function(socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      this.sockets.forEach(function(socket) {
        if (!socket) {
          return;
        }
        return socket.connect();
      });
      return;
    }
    if (!this.sockets[socketId]) {
      throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
    }
    return this.sockets[socketId].connect();
  };

  ArrayPort.prototype.beginGroup = function(group, socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      this.sockets.forEach((function(_this) {
        return function(socket, index) {
          if (!socket) {
            return;
          }
          return _this.beginGroup(group, index);
        };
      })(this));
      return;
    }
    if (!this.sockets[socketId]) {
      throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
    }
    if (this.isConnected(socketId)) {
      return this.sockets[socketId].beginGroup(group);
    }
    this.sockets[socketId].once("connect", (function(_this) {
      return function() {
        return _this.sockets[socketId].beginGroup(group);
      };
    })(this));
    return this.sockets[socketId].connect();
  };

  ArrayPort.prototype.send = function(data, socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      this.sockets.forEach((function(_this) {
        return function(socket, index) {
          if (!socket) {
            return;
          }
          return _this.send(data, index);
        };
      })(this));
      return;
    }
    if (!this.sockets[socketId]) {
      throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
    }
    if (this.isConnected(socketId)) {
      return this.sockets[socketId].send(data);
    }
    this.sockets[socketId].once("connect", (function(_this) {
      return function() {
        return _this.sockets[socketId].send(data);
      };
    })(this));
    return this.sockets[socketId].connect();
  };

  ArrayPort.prototype.endGroup = function(socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      this.sockets.forEach((function(_this) {
        return function(socket, index) {
          if (!socket) {
            return;
          }
          return _this.endGroup(index);
        };
      })(this));
      return;
    }
    if (!this.sockets[socketId]) {
      throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
    }
    return this.sockets[socketId].endGroup();
  };

  ArrayPort.prototype.disconnect = function(socketId) {
    var socket, _i, _len, _ref;
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      _ref = this.sockets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        socket = _ref[_i];
        if (!socket) {
          return;
        }
        socket.disconnect();
      }
      return;
    }
    if (!this.sockets[socketId]) {
      return;
    }
    return this.sockets[socketId].disconnect();
  };

  ArrayPort.prototype.isConnected = function(socketId) {
    var connected;
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      connected = false;
      this.sockets.forEach((function(_this) {
        return function(socket) {
          if (!socket) {
            return;
          }
          if (socket.isConnected()) {
            return connected = true;
          }
        };
      })(this));
      return connected;
    }
    if (!this.sockets[socketId]) {
      return false;
    }
    return this.sockets[socketId].isConnected();
  };

  ArrayPort.prototype.isAddressable = function() {
    return true;
  };

  ArrayPort.prototype.isAttached = function(socketId) {
    var socket, _i, _len, _ref;
    if (socketId === void 0) {
      _ref = this.sockets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        socket = _ref[_i];
        if (socket) {
          return true;
        }
      }
      return false;
    }
    if (this.sockets[socketId]) {
      return true;
    }
    return false;
  };

  return ArrayPort;

})(port.Port);

exports.ArrayPort = ArrayPort;

});
require.register("noflo-noflo/src/lib/Component.js", function(exports, require, module){
var Component, EventEmitter, ports,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

ports = require('./Ports');

Component = (function(_super) {
  __extends(Component, _super);

  Component.prototype.description = '';

  Component.prototype.icon = null;

  Component.prototype.started = false;

  function Component(options) {
    this.error = __bind(this.error, this);
    if (!options) {
      options = {};
    }
    if (!options.inPorts) {
      options.inPorts = {};
    }
    if (options.inPorts instanceof ports.InPorts) {
      this.inPorts = options.inPorts;
    } else {
      this.inPorts = new ports.InPorts(options.inPorts);
    }
    if (!options.outPorts) {
      options.outPorts = {};
    }
    if (options.outPorts instanceof ports.OutPorts) {
      this.outPorts = options.outPorts;
    } else {
      this.outPorts = new ports.OutPorts(options.outPorts);
    }
  }

  Component.prototype.getDescription = function() {
    return this.description;
  };

  Component.prototype.isReady = function() {
    return true;
  };

  Component.prototype.isSubgraph = function() {
    return false;
  };

  Component.prototype.setIcon = function(icon) {
    this.icon = icon;
    return this.emit('icon', this.icon);
  };

  Component.prototype.getIcon = function() {
    return this.icon;
  };

  Component.prototype.error = function(e, groups, errorPort) {
    var group, _i, _j, _len, _len1;
    if (groups == null) {
      groups = [];
    }
    if (errorPort == null) {
      errorPort = 'error';
    }
    if (this.outPorts[errorPort] && (this.outPorts[errorPort].isAttached() || !this.outPorts[errorPort].isRequired())) {
      for (_i = 0, _len = groups.length; _i < _len; _i++) {
        group = groups[_i];
        this.outPorts[errorPort].beginGroup(group);
      }
      this.outPorts[errorPort].send(e);
      for (_j = 0, _len1 = groups.length; _j < _len1; _j++) {
        group = groups[_j];
        this.outPorts[errorPort].endGroup();
      }
      this.outPorts[errorPort].disconnect();
      return;
    }
    throw e;
  };

  Component.prototype.shutdown = function() {
    return this.started = false;
  };

  Component.prototype.start = function() {
    this.started = true;
    return this.started;
  };

  Component.prototype.isStarted = function() {
    return this.started;
  };

  return Component;

})(EventEmitter);

exports.Component = Component;

});
require.register("noflo-noflo/src/lib/AsyncComponent.js", function(exports, require, module){
var AsyncComponent, component, port,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

port = require("./Port");

component = require("./Component");

AsyncComponent = (function(_super) {
  __extends(AsyncComponent, _super);

  function AsyncComponent(inPortName, outPortName, errPortName) {
    this.inPortName = inPortName != null ? inPortName : "in";
    this.outPortName = outPortName != null ? outPortName : "out";
    this.errPortName = errPortName != null ? errPortName : "error";
    if (!this.inPorts[this.inPortName]) {
      throw new Error("no inPort named '" + this.inPortName + "'");
    }
    if (!this.outPorts[this.outPortName]) {
      throw new Error("no outPort named '" + this.outPortName + "'");
    }
    this.load = 0;
    this.q = [];
    this.errorGroups = [];
    this.outPorts.load = new port.Port();
    this.inPorts[this.inPortName].on("begingroup", (function(_this) {
      return function(group) {
        if (_this.load > 0) {
          return _this.q.push({
            name: "begingroup",
            data: group
          });
        }
        _this.errorGroups.push(group);
        return _this.outPorts[_this.outPortName].beginGroup(group);
      };
    })(this));
    this.inPorts[this.inPortName].on("endgroup", (function(_this) {
      return function() {
        if (_this.load > 0) {
          return _this.q.push({
            name: "endgroup"
          });
        }
        _this.errorGroups.pop();
        return _this.outPorts[_this.outPortName].endGroup();
      };
    })(this));
    this.inPorts[this.inPortName].on("disconnect", (function(_this) {
      return function() {
        if (_this.load > 0) {
          return _this.q.push({
            name: "disconnect"
          });
        }
        _this.outPorts[_this.outPortName].disconnect();
        _this.errorGroups = [];
        if (_this.outPorts.load.isAttached()) {
          return _this.outPorts.load.disconnect();
        }
      };
    })(this));
    this.inPorts[this.inPortName].on("data", (function(_this) {
      return function(data) {
        if (_this.q.length > 0) {
          return _this.q.push({
            name: "data",
            data: data
          });
        }
        return _this.processData(data);
      };
    })(this));
  }

  AsyncComponent.prototype.processData = function(data) {
    this.incrementLoad();
    return this.doAsync(data, (function(_this) {
      return function(err) {
        if (err) {
          _this.error(err, _this.errorGroups, _this.errPortName);
        }
        return _this.decrementLoad();
      };
    })(this));
  };

  AsyncComponent.prototype.incrementLoad = function() {
    this.load++;
    if (this.outPorts.load.isAttached()) {
      this.outPorts.load.send(this.load);
    }
    if (this.outPorts.load.isAttached()) {
      return this.outPorts.load.disconnect();
    }
  };

  AsyncComponent.prototype.doAsync = function(data, callback) {
    return callback(new Error("AsyncComponents must implement doAsync"));
  };

  AsyncComponent.prototype.decrementLoad = function() {
    if (this.load === 0) {
      throw new Error("load cannot be negative");
    }
    this.load--;
    if (this.outPorts.load.isAttached()) {
      this.outPorts.load.send(this.load);
    }
    if (this.outPorts.load.isAttached()) {
      this.outPorts.load.disconnect();
    }
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      return process.nextTick((function(_this) {
        return function() {
          return _this.processQueue();
        };
      })(this));
    } else {
      return setTimeout((function(_this) {
        return function() {
          return _this.processQueue();
        };
      })(this), 0);
    }
  };

  AsyncComponent.prototype.processQueue = function() {
    var event, processedData;
    if (this.load > 0) {
      return;
    }
    processedData = false;
    while (this.q.length > 0) {
      event = this.q[0];
      switch (event.name) {
        case "begingroup":
          if (processedData) {
            return;
          }
          this.outPorts[this.outPortName].beginGroup(event.data);
          this.errorGroups.push(event.data);
          this.q.shift();
          break;
        case "endgroup":
          if (processedData) {
            return;
          }
          this.outPorts[this.outPortName].endGroup();
          this.errorGroups.pop();
          this.q.shift();
          break;
        case "disconnect":
          if (processedData) {
            return;
          }
          this.outPorts[this.outPortName].disconnect();
          if (this.outPorts.load.isAttached()) {
            this.outPorts.load.disconnect();
          }
          this.errorGroups = [];
          this.q.shift();
          break;
        case "data":
          this.processData(event.data);
          this.q.shift();
          processedData = true;
      }
    }
  };

  AsyncComponent.prototype.shutdown = function() {
    this.q = [];
    return this.errorGroups = [];
  };

  return AsyncComponent;

})(component.Component);

exports.AsyncComponent = AsyncComponent;

});
require.register("noflo-noflo/src/lib/LoggingComponent.js", function(exports, require, module){
var Component, Port, util,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Component = require("./Component").Component;

Port = require("./Port").Port;

if (!require('./Platform').isBrowser()) {
  util = require("util");
} else {
  util = {
    inspect: function(data) {
      return data;
    }
  };
}

exports.LoggingComponent = (function(_super) {
  __extends(LoggingComponent, _super);

  function LoggingComponent() {
    this.sendLog = __bind(this.sendLog, this);
    this.outPorts = {
      log: new Port()
    };
  }

  LoggingComponent.prototype.sendLog = function(message) {
    if (typeof message === "object") {
      message.when = new Date;
      message.source = this.constructor.name;
      if (this.nodeId != null) {
        message.nodeID = this.nodeId;
      }
    }
    if ((this.outPorts.log != null) && this.outPorts.log.isAttached()) {
      return this.outPorts.log.send(message);
    } else {
      return console.log(util.inspect(message, 4, true, true));
    }
  };

  return LoggingComponent;

})(Component);

});
require.register("noflo-noflo/src/lib/ComponentLoader.js", function(exports, require, module){
var ComponentLoader, EventEmitter, internalSocket, nofloGraph, utils,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

internalSocket = require('./InternalSocket');

nofloGraph = require('./Graph');

utils = require('./Utils');

EventEmitter = require('events').EventEmitter;

ComponentLoader = (function(_super) {
  __extends(ComponentLoader, _super);

  function ComponentLoader(baseDir) {
    this.baseDir = baseDir;
    this.components = null;
    this.checked = [];
    this.revalidate = false;
    this.libraryIcons = {};
    this.processing = false;
    this.ready = false;
  }

  ComponentLoader.prototype.getModulePrefix = function(name) {
    if (!name) {
      return '';
    }
    if (name === 'noflo') {
      return '';
    }
    return name.replace('noflo-', '');
  };

  ComponentLoader.prototype.getModuleComponents = function(moduleName) {
    var cPath, definition, dependency, e, loader, name, prefix, _ref, _ref1, _results;
    if (this.checked.indexOf(moduleName) !== -1) {
      return;
    }
    this.checked.push(moduleName);
    try {
      definition = require("/" + moduleName + "/component.json");
    } catch (_error) {
      e = _error;
      if (moduleName.substr(0, 1) === '/') {
        return this.getModuleComponents("noflo-" + (moduleName.substr(1)));
      }
      return;
    }
    for (dependency in definition.dependencies) {
      this.getModuleComponents(dependency.replace('/', '-'));
    }
    if (!definition.noflo) {
      return;
    }
    prefix = this.getModulePrefix(definition.name);
    if (definition.noflo.icon) {
      this.libraryIcons[prefix] = definition.noflo.icon;
    }
    if (moduleName[0] === '/') {
      moduleName = moduleName.substr(1);
    }
    if (definition.noflo.loader) {
      loader = require("/" + moduleName + "/" + definition.noflo.loader);
      this.registerLoader(loader, function() {});
    }
    if (definition.noflo.components) {
      _ref = definition.noflo.components;
      for (name in _ref) {
        cPath = _ref[name];
        if (cPath.indexOf('.js') !== -1) {
          cPath = cPath.replace('.js', '.js');
        }
        if (cPath.substr(0, 2) === './') {
          cPath = cPath.substr(2);
        }
        this.registerComponent(prefix, name, "/" + moduleName + "/" + cPath);
      }
    }
    if (definition.noflo.graphs) {
      _ref1 = definition.noflo.graphs;
      _results = [];
      for (name in _ref1) {
        cPath = _ref1[name];
        _results.push(this.registerGraph(prefix, name, "/" + moduleName + "/" + cPath));
      }
      return _results;
    }
  };

  ComponentLoader.prototype.listComponents = function(callback) {
    if (this.processing) {
      this.once('ready', (function(_this) {
        return function() {
          return callback(_this.components);
        };
      })(this));
      return;
    }
    if (this.components) {
      return callback(this.components);
    }
    this.ready = false;
    this.processing = true;
    return setTimeout((function(_this) {
      return function() {
        _this.components = {};
        _this.getModuleComponents(_this.baseDir);
        _this.processing = false;
        _this.ready = true;
        _this.emit('ready', true);
        if (callback) {
          return callback(_this.components);
        }
      };
    })(this), 1);
  };

  ComponentLoader.prototype.load = function(name, callback, metadata) {
    var component, componentName;
    if (!this.ready) {
      this.listComponents((function(_this) {
        return function() {
          return _this.load(name, callback, metadata);
        };
      })(this));
      return;
    }
    component = this.components[name];
    if (!component) {
      for (componentName in this.components) {
        if (componentName.split('/')[1] === name) {
          component = this.components[componentName];
          break;
        }
      }
      if (!component) {
        callback(new Error("Component " + name + " not available with base " + this.baseDir));
        return;
      }
    }
    if (this.isGraph(component)) {
      if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
        process.nextTick((function(_this) {
          return function() {
            return _this.loadGraph(name, component, callback, metadata);
          };
        })(this));
      } else {
        setTimeout((function(_this) {
          return function() {
            return _this.loadGraph(name, component, callback, metadata);
          };
        })(this), 0);
      }
      return;
    }
    return this.createComponent(name, component, metadata, (function(_this) {
      return function(err, instance) {
        if (err) {
          return callback(err);
        }
        if (!instance) {
          callback(new Error("Component " + name + " could not be loaded."));
          return;
        }
        if (name === 'Graph') {
          instance.baseDir = _this.baseDir;
        }
        _this.setIcon(name, instance);
        return callback(null, instance);
      };
    })(this));
  };

  ComponentLoader.prototype.createComponent = function(name, component, metadata, callback) {
    var e, implementation, instance;
    implementation = component;
    if (typeof implementation === 'string') {
      try {
        implementation = require(implementation);
      } catch (_error) {
        e = _error;
        return callback(e);
      }
    }
    if (typeof implementation.getComponent === 'function') {
      instance = implementation.getComponent(metadata);
    } else if (typeof implementation === 'function') {
      instance = implementation(metadata);
    } else {
      callback(new Error("Invalid type " + (typeof implementation) + " for component " + name + "."));
      return;
    }
    return callback(null, instance);
  };

  ComponentLoader.prototype.isGraph = function(cPath) {
    if (typeof cPath === 'object' && cPath instanceof nofloGraph.Graph) {
      return true;
    }
    if (typeof cPath !== 'string') {
      return false;
    }
    return cPath.indexOf('.fbp') !== -1 || cPath.indexOf('.json') !== -1;
  };

  ComponentLoader.prototype.loadGraph = function(name, component, callback, metadata) {
    var graph, graphImplementation, graphSocket;
    graphImplementation = require(this.components['Graph']);
    graphSocket = internalSocket.createSocket();
    graph = graphImplementation.getComponent(metadata);
    graph.loader = this;
    graph.baseDir = this.baseDir;
    graph.inPorts.graph.attach(graphSocket);
    graphSocket.send(component);
    graphSocket.disconnect();
    graph.inPorts.remove('graph');
    this.setIcon(name, graph);
    return callback(null, graph);
  };

  ComponentLoader.prototype.setIcon = function(name, instance) {
    var componentName, library, _ref;
    if (!instance.getIcon || instance.getIcon()) {
      return;
    }
    _ref = name.split('/'), library = _ref[0], componentName = _ref[1];
    if (componentName && this.getLibraryIcon(library)) {
      instance.setIcon(this.getLibraryIcon(library));
      return;
    }
    if (instance.isSubgraph()) {
      instance.setIcon('sitemap');
      return;
    }
    instance.setIcon('square');
  };

  ComponentLoader.prototype.getLibraryIcon = function(prefix) {
    if (this.libraryIcons[prefix]) {
      return this.libraryIcons[prefix];
    }
    return null;
  };

  ComponentLoader.prototype.normalizeName = function(packageId, name) {
    var fullName, prefix;
    prefix = this.getModulePrefix(packageId);
    fullName = "" + prefix + "/" + name;
    if (!packageId) {
      fullName = name;
    }
    return fullName;
  };

  ComponentLoader.prototype.registerComponent = function(packageId, name, cPath, callback) {
    var fullName;
    fullName = this.normalizeName(packageId, name);
    this.components[fullName] = cPath;
    if (callback) {
      return callback();
    }
  };

  ComponentLoader.prototype.registerGraph = function(packageId, name, gPath, callback) {
    return this.registerComponent(packageId, name, gPath, callback);
  };

  ComponentLoader.prototype.registerLoader = function(loader, callback) {
    return loader(this, callback);
  };

  ComponentLoader.prototype.setSource = function(packageId, name, source, language, callback) {
    var e, implementation;
    if (!this.ready) {
      this.listComponents((function(_this) {
        return function() {
          return _this.setSource(packageId, name, source, language, callback);
        };
      })(this));
      return;
    }
    if (language === 'coffeescript') {
      if (!window.CoffeeScript) {
        return callback(new Error('CoffeeScript compiler not available'));
      }
      try {
        source = CoffeeScript.compile(source, {
          bare: true
        });
      } catch (_error) {
        e = _error;
        return callback(e);
      }
    }
    try {
      source = source.replace("require('noflo')", "require('./NoFlo')");
      source = source.replace('require("noflo")', 'require("./NoFlo")');
      implementation = eval("(function () { var exports = {}; " + source + "; return exports; })()");
    } catch (_error) {
      e = _error;
      return callback(e);
    }
    if (!(implementation || implementation.getComponent)) {
      return callback(new Error('Provided source failed to create a runnable component'));
    }
    return this.registerComponent(packageId, name, implementation, function() {
      return callback(null);
    });
  };

  ComponentLoader.prototype.getSource = function(name, callback) {
    var component, componentName, nameParts, path;
    if (!this.ready) {
      this.listComponents((function(_this) {
        return function() {
          return _this.getSource(name, callback);
        };
      })(this));
      return;
    }
    component = this.components[name];
    if (!component) {
      for (componentName in this.components) {
        if (componentName.split('/')[1] === name) {
          component = this.components[componentName];
          name = componentName;
          break;
        }
      }
      if (!component) {
        return callback(new Error("Component " + name + " not installed"));
      }
    }
    if (typeof component !== 'string') {
      return callback(new Error("Can't provide source for " + name + ". Not a file"));
    }
    nameParts = name.split('/');
    if (nameParts.length === 1) {
      nameParts[1] = nameParts[0];
      nameParts[0] = '';
    }
    if (this.isGraph(component)) {
      nofloGraph.loadFile(component, function(graph) {
        if (!graph) {
          return callback(new Error('Unable to load graph'));
        }
        return callback(null, {
          name: nameParts[1],
          library: nameParts[0],
          code: JSON.stringify(graph.toJSON()),
          language: 'json'
        });
      });
      return;
    }
    path = window.require.resolve(component);
    if (!path) {
      return callback(new Error("Component " + name + " is not resolvable to a path"));
    }
    return callback(null, {
      name: nameParts[1],
      library: nameParts[0],
      code: window.require.modules[path].toString(),
      language: utils.guessLanguageFromFilename(component)
    });
  };

  ComponentLoader.prototype.clear = function() {
    this.components = null;
    this.checked = [];
    this.revalidate = true;
    this.ready = false;
    return this.processing = false;
  };

  return ComponentLoader;

})(EventEmitter);

exports.ComponentLoader = ComponentLoader;

});
require.register("noflo-noflo/src/lib/NoFlo.js", function(exports, require, module){
var ports;

exports.graph = require('./Graph');

exports.Graph = exports.graph.Graph;

exports.journal = require('./Journal');

exports.Journal = exports.journal.Journal;

exports.Network = require('./Network').Network;

exports.isBrowser = require('./Platform').isBrowser;

if (!exports.isBrowser()) {
  exports.ComponentLoader = require('./nodejs/ComponentLoader').ComponentLoader;
} else {
  exports.ComponentLoader = require('./ComponentLoader').ComponentLoader;
}

exports.Component = require('./Component').Component;

exports.AsyncComponent = require('./AsyncComponent').AsyncComponent;

exports.LoggingComponent = require('./LoggingComponent').LoggingComponent;

exports.helpers = require('./Helpers');

ports = require('./Ports');

exports.InPorts = ports.InPorts;

exports.OutPorts = ports.OutPorts;

exports.InPort = require('./InPort');

exports.OutPort = require('./OutPort');

exports.Port = require('./Port').Port;

exports.ArrayPort = require('./ArrayPort').ArrayPort;

exports.internalSocket = require('./InternalSocket');

exports.createNetwork = function(graph, callback, delay) {
  var network, networkReady;
  network = new exports.Network(graph);
  networkReady = function(network) {
    if (callback != null) {
      callback(network);
    }
    return network.start();
  };
  network.loader.listComponents(function() {
    if (graph.nodes.length === 0) {
      return networkReady(network);
    }
    if (delay) {
      if (callback != null) {
        callback(network);
      }
      return;
    }
    return network.connect(function() {
      return networkReady(network);
    });
  });
  return network;
};

exports.loadFile = function(file, baseDir, callback) {
  if (!callback) {
    callback = baseDir;
    baseDir = null;
  }
  return exports.graph.loadFile(file, function(net) {
    if (baseDir) {
      net.baseDir = baseDir;
    }
    return exports.createNetwork(net, callback);
  });
};

exports.saveFile = function(graph, file, callback) {
  return exports.graph.save(file, function() {
    return callback(file);
  });
};

});
require.register("noflo-noflo/src/lib/Network.js", function(exports, require, module){
var EventEmitter, Network, componentLoader, graph, internalSocket, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("underscore");

internalSocket = require("./InternalSocket");

graph = require("./Graph");

EventEmitter = require('events').EventEmitter;

if (!require('./Platform').isBrowser()) {
  componentLoader = require("./nodejs/ComponentLoader");
} else {
  componentLoader = require('./ComponentLoader');
}

Network = (function(_super) {
  __extends(Network, _super);

  Network.prototype.processes = {};

  Network.prototype.connections = [];

  Network.prototype.initials = [];

  Network.prototype.defaults = [];

  Network.prototype.graph = null;

  Network.prototype.startupDate = null;

  Network.prototype.portBuffer = {};

  function Network(graph) {
    this.processes = {};
    this.connections = [];
    this.initials = [];
    this.nextInitials = [];
    this.defaults = [];
    this.graph = graph;
    this.started = false;
    this.debug = false;
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      this.baseDir = graph.baseDir || process.cwd();
    } else {
      this.baseDir = graph.baseDir || '/';
    }
    this.startupDate = new Date();
    if (graph.componentLoader) {
      this.loader = graph.componentLoader;
    } else {
      this.loader = new componentLoader.ComponentLoader(this.baseDir);
    }
  }

  Network.prototype.uptime = function() {
    return new Date() - this.startupDate;
  };

  Network.prototype.connectionCount = 0;

  Network.prototype.increaseConnections = function() {
    if (this.connectionCount === 0) {
      this.emit('start', {
        start: this.startupDate
      });
    }
    return this.connectionCount++;
  };

  Network.prototype.decreaseConnections = function() {
    var ender;
    this.connectionCount--;
    if (this.connectionCount === 0) {
      ender = _.debounce((function(_this) {
        return function() {
          if (_this.connectionCount) {
            return;
          }
          return _this.emit('end', {
            start: _this.startupDate,
            end: new Date,
            uptime: _this.uptime()
          });
        };
      })(this), 10);
      return ender();
    }
  };

  Network.prototype.load = function(component, metadata, callback) {
    return this.loader.load(component, callback, metadata);
  };

  Network.prototype.addNode = function(node, callback) {
    var process;
    if (this.processes[node.id]) {
      if (callback) {
        callback(null, this.processes[node.id]);
      }
      return;
    }
    process = {
      id: node.id
    };
    if (!node.component) {
      this.processes[process.id] = process;
      if (callback) {
        callback(null, process);
      }
      return;
    }
    return this.load(node.component, node.metadata, (function(_this) {
      return function(err, instance) {
        var name, port, _ref, _ref1;
        if (err) {
          return callback(err);
        }
        instance.nodeId = node.id;
        process.component = instance;
        _ref = process.component.inPorts;
        for (name in _ref) {
          port = _ref[name];
          if (!port || typeof port === 'function' || !port.canAttach) {
            continue;
          }
          port.node = node.id;
          port.nodeInstance = instance;
          port.name = name;
        }
        _ref1 = process.component.outPorts;
        for (name in _ref1) {
          port = _ref1[name];
          if (!port || typeof port === 'function' || !port.canAttach) {
            continue;
          }
          port.node = node.id;
          port.nodeInstance = instance;
          port.name = name;
        }
        if (instance.isSubgraph()) {
          _this.subscribeSubgraph(process);
        }
        _this.subscribeNode(process);
        _this.processes[process.id] = process;
        if (callback) {
          return callback(null, process);
        }
      };
    })(this));
  };

  Network.prototype.removeNode = function(node, callback) {
    if (!this.processes[node.id]) {
      return callback(new Error("Node " + node.id + " not found"));
    }
    this.processes[node.id].component.shutdown();
    delete this.processes[node.id];
    if (callback) {
      return callback(null);
    }
  };

  Network.prototype.renameNode = function(oldId, newId, callback) {
    var name, port, process, _ref, _ref1;
    process = this.getNode(oldId);
    if (!process) {
      return callback(new Error("Process " + oldId + " not found"));
    }
    process.id = newId;
    _ref = process.component.inPorts;
    for (name in _ref) {
      port = _ref[name];
      port.node = newId;
    }
    _ref1 = process.component.outPorts;
    for (name in _ref1) {
      port = _ref1[name];
      port.node = newId;
    }
    this.processes[newId] = process;
    delete this.processes[oldId];
    if (callback) {
      return callback(null);
    }
  };

  Network.prototype.getNode = function(id) {
    return this.processes[id];
  };

  Network.prototype.connect = function(done) {
    var callStack, edges, initializers, nodes, serialize, setDefaults, subscribeGraph;
    if (done == null) {
      done = function() {};
    }
    callStack = 0;
    serialize = (function(_this) {
      return function(next, add) {
        return function(type) {
          return _this["add" + type](add, function() {
            callStack++;
            if (callStack % 100 === 0) {
              setTimeout(function() {
                return next(type);
              }, 0);
              return;
            }
            return next(type);
          });
        };
      };
    })(this);
    subscribeGraph = (function(_this) {
      return function() {
        _this.subscribeGraph();
        return done();
      };
    })(this);
    setDefaults = _.reduceRight(this.graph.nodes, serialize, subscribeGraph);
    initializers = _.reduceRight(this.graph.initializers, serialize, function() {
      return setDefaults("Defaults");
    });
    edges = _.reduceRight(this.graph.edges, serialize, function() {
      return initializers("Initial");
    });
    nodes = _.reduceRight(this.graph.nodes, serialize, function() {
      return edges("Edge");
    });
    return nodes("Node");
  };

  Network.prototype.connectPort = function(socket, process, port, index, inbound) {
    if (inbound) {
      socket.to = {
        process: process,
        port: port,
        index: index
      };
      if (!(process.component.inPorts && process.component.inPorts[port])) {
        throw new Error("No inport '" + port + "' defined in process " + process.id + " (" + (socket.getId()) + ")");
        return;
      }
      if (process.component.inPorts[port].isAddressable()) {
        return process.component.inPorts[port].attach(socket, index);
      }
      return process.component.inPorts[port].attach(socket);
    }
    socket.from = {
      process: process,
      port: port,
      index: index
    };
    if (!(process.component.outPorts && process.component.outPorts[port])) {
      throw new Error("No outport '" + port + "' defined in process " + process.id + " (" + (socket.getId()) + ")");
      return;
    }
    if (process.component.outPorts[port].isAddressable()) {
      return process.component.outPorts[port].attach(socket, index);
    }
    return process.component.outPorts[port].attach(socket);
  };

  Network.prototype.subscribeGraph = function() {
    var graphOps, processOps, processing, registerOp;
    graphOps = [];
    processing = false;
    registerOp = function(op, details) {
      return graphOps.push({
        op: op,
        details: details
      });
    };
    processOps = (function(_this) {
      return function() {
        var cb, op;
        if (!graphOps.length) {
          processing = false;
          return;
        }
        processing = true;
        op = graphOps.shift();
        cb = processOps;
        switch (op.op) {
          case 'renameNode':
            return _this.renameNode(op.details.from, op.details.to, cb);
          default:
            return _this[op.op](op.details, cb);
        }
      };
    })(this);
    this.graph.on('addNode', (function(_this) {
      return function(node) {
        registerOp('addNode', node);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('removeNode', (function(_this) {
      return function(node) {
        registerOp('removeNode', node);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('renameNode', (function(_this) {
      return function(oldId, newId) {
        registerOp('renameNode', {
          from: oldId,
          to: newId
        });
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('addEdge', (function(_this) {
      return function(edge) {
        registerOp('addEdge', edge);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('removeEdge', (function(_this) {
      return function(edge) {
        registerOp('removeEdge', edge);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('addInitial', (function(_this) {
      return function(iip) {
        registerOp('addInitial', iip);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    return this.graph.on('removeInitial', (function(_this) {
      return function(iip) {
        registerOp('removeInitial', iip);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
  };

  Network.prototype.subscribeSubgraph = function(node) {
    var emitSub;
    if (!node.component.isReady()) {
      node.component.once('ready', (function(_this) {
        return function() {
          return _this.subscribeSubgraph(node);
        };
      })(this));
      return;
    }
    if (!node.component.network) {
      return;
    }
    emitSub = (function(_this) {
      return function(type, data) {
        if (type === 'connect') {
          _this.increaseConnections();
        }
        if (type === 'disconnect') {
          _this.decreaseConnections();
        }
        if (!data) {
          data = {};
        }
        if (data.subgraph) {
          if (!data.subgraph.unshift) {
            data.subgraph = [data.subgraph];
          }
          data.subgraph = data.subgraph.unshift(node.id);
        } else {
          data.subgraph = [node.id];
        }
        return _this.emit(type, data);
      };
    })(this);
    node.component.network.on('connect', function(data) {
      return emitSub('connect', data);
    });
    node.component.network.on('begingroup', function(data) {
      return emitSub('begingroup', data);
    });
    node.component.network.on('data', function(data) {
      return emitSub('data', data);
    });
    node.component.network.on('endgroup', function(data) {
      return emitSub('endgroup', data);
    });
    node.component.network.on('disconnect', function(data) {
      return emitSub('disconnect', data);
    });
    return node.component.network.on('process-error', function(data) {
      return emitSub('process-error', data);
    });
  };

  Network.prototype.subscribeSocket = function(socket) {
    socket.on('connect', (function(_this) {
      return function() {
        _this.increaseConnections();
        return _this.emit('connect', {
          id: socket.getId(),
          socket: socket
        });
      };
    })(this));
    socket.on('begingroup', (function(_this) {
      return function(group) {
        return _this.emit('begingroup', {
          id: socket.getId(),
          socket: socket,
          group: group
        });
      };
    })(this));
    socket.on('data', (function(_this) {
      return function(data) {
        return _this.emit('data', {
          id: socket.getId(),
          socket: socket,
          data: data
        });
      };
    })(this));
    socket.on('endgroup', (function(_this) {
      return function(group) {
        return _this.emit('endgroup', {
          id: socket.getId(),
          socket: socket,
          group: group
        });
      };
    })(this));
    socket.on('disconnect', (function(_this) {
      return function() {
        _this.decreaseConnections();
        return _this.emit('disconnect', {
          id: socket.getId(),
          socket: socket
        });
      };
    })(this));
    return socket.on('error', (function(_this) {
      return function(event) {
        return _this.emit('process-error', event);
      };
    })(this));
  };

  Network.prototype.subscribeNode = function(node) {
    if (!node.component.getIcon) {
      return;
    }
    return node.component.on('icon', (function(_this) {
      return function() {
        return _this.emit('icon', {
          id: node.id,
          icon: node.component.getIcon()
        });
      };
    })(this));
  };

  Network.prototype.addEdge = function(edge, callback) {
    var from, socket, to;
    socket = internalSocket.createSocket();
    from = this.getNode(edge.from.node);
    if (!from) {
      throw new Error("No process defined for outbound node " + edge.from.node);
    }
    if (!from.component) {
      throw new Error("No component defined for outbound node " + edge.from.node);
    }
    if (!from.component.isReady()) {
      from.component.once("ready", (function(_this) {
        return function() {
          return _this.addEdge(edge, callback);
        };
      })(this));
      return;
    }
    to = this.getNode(edge.to.node);
    if (!to) {
      throw new Error("No process defined for inbound node " + edge.to.node);
    }
    if (!to.component) {
      throw new Error("No component defined for inbound node " + edge.to.node);
    }
    if (!to.component.isReady()) {
      to.component.once("ready", (function(_this) {
        return function() {
          return _this.addEdge(edge, callback);
        };
      })(this));
      return;
    }
    this.subscribeSocket(socket);
    this.connectPort(socket, to, edge.to.port, edge.to.index, true);
    this.connectPort(socket, from, edge.from.port, edge.from.index, false);
    this.connections.push(socket);
    if (callback) {
      return callback();
    }
  };

  Network.prototype.removeEdge = function(edge, callback) {
    var connection, _i, _len, _ref, _results;
    _ref = this.connections;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      connection = _ref[_i];
      if (!connection) {
        continue;
      }
      if (!(edge.to.node === connection.to.process.id && edge.to.port === connection.to.port)) {
        continue;
      }
      connection.to.process.component.inPorts[connection.to.port].detach(connection);
      if (edge.from.node) {
        if (connection.from && edge.from.node === connection.from.process.id && edge.from.port === connection.from.port) {
          connection.from.process.component.outPorts[connection.from.port].detach(connection);
        }
      }
      this.connections.splice(this.connections.indexOf(connection), 1);
      if (callback) {
        _results.push(callback());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Network.prototype.addDefaults = function(node, callback) {
    var key, port, process, socket, _ref;
    process = this.processes[node.id];
    if (!process.component.isReady()) {
      if (process.component.setMaxListeners) {
        process.component.setMaxListeners(0);
      }
      process.component.once("ready", (function(_this) {
        return function() {
          return _this.addDefaults(process, callback);
        };
      })(this));
      return;
    }
    _ref = process.component.inPorts.ports;
    for (key in _ref) {
      port = _ref[key];
      if (typeof port.hasDefault === 'function' && port.hasDefault() && !port.isAttached()) {
        socket = internalSocket.createSocket();
        this.subscribeSocket(socket);
        this.connectPort(socket, process, key, void 0, true);
        this.connections.push(socket);
        this.defaults.push(socket);
      }
    }
    if (callback) {
      return callback();
    }
  };

  Network.prototype.addInitial = function(initializer, callback) {
    var init, socket, to;
    socket = internalSocket.createSocket();
    this.subscribeSocket(socket);
    to = this.getNode(initializer.to.node);
    if (!to) {
      throw new Error("No process defined for inbound node " + initializer.to.node);
    }
    if (!(to.component.isReady() || to.component.inPorts[initializer.to.port])) {
      if (to.component.setMaxListeners) {
        to.component.setMaxListeners(0);
      }
      to.component.once("ready", (function(_this) {
        return function() {
          return _this.addInitial(initializer, callback);
        };
      })(this));
      return;
    }
    this.connectPort(socket, to, initializer.to.port, initializer.to.index, true);
    this.connections.push(socket);
    init = {
      socket: socket,
      data: initializer.from.data
    };
    this.initials.push(init);
    this.nextInitials.push(init);
    if (this.isStarted()) {
      this.sendInitials();
    }
    if (callback) {
      return callback();
    }
  };

  Network.prototype.removeInitial = function(initializer, callback) {
    var connection, init, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    _ref = this.connections;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      connection = _ref[_i];
      if (!connection) {
        continue;
      }
      if (!(initializer.to.node === connection.to.process.id && initializer.to.port === connection.to.port)) {
        continue;
      }
      connection.to.process.component.inPorts[connection.to.port].detach(connection);
      this.connections.splice(this.connections.indexOf(connection), 1);
      _ref1 = this.initials;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        init = _ref1[_j];
        if (!init) {
          continue;
        }
        if (init.socket !== connection) {
          continue;
        }
        this.initials.splice(this.initials.indexOf(init), 1);
      }
      _ref2 = this.nextInitials;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        init = _ref2[_k];
        if (!init) {
          continue;
        }
        if (init.socket !== connection) {
          continue;
        }
        this.nextInitials.splice(this.nextInitials.indexOf(init), 1);
      }
    }
    if (callback) {
      return callback();
    }
  };

  Network.prototype.sendInitial = function(initial) {
    initial.socket.connect();
    initial.socket.send(initial.data);
    return initial.socket.disconnect();
  };

  Network.prototype.sendInitials = function() {
    var send;
    send = (function(_this) {
      return function() {
        var initial, _i, _len, _ref;
        _ref = _this.initials;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          initial = _ref[_i];
          _this.sendInitial(initial);
        }
        return _this.initials = [];
      };
    })(this);
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      return process.nextTick(send);
    } else {
      return setTimeout(send, 0);
    }
  };

  Network.prototype.isStarted = function() {
    return this.started;
  };

  Network.prototype.isRunning = function() {
    if (!this.started) {
      return false;
    }
    return this.connectionCount > 0;
  };

  Network.prototype.startComponents = function() {
    var id, process, _ref, _results;
    _ref = this.processes;
    _results = [];
    for (id in _ref) {
      process = _ref[id];
      _results.push(process.component.start());
    }
    return _results;
  };

  Network.prototype.sendDefaults = function() {
    var socket, _i, _len, _ref, _results;
    _ref = this.defaults;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      if (socket.to.process.component.inPorts[socket.to.port].sockets.length !== 1) {
        continue;
      }
      socket.connect();
      socket.send();
      _results.push(socket.disconnect());
    }
    return _results;
  };

  Network.prototype.start = function() {
    if (this.started) {
      this.stop();
    }
    this.started = true;
    this.initials = this.nextInitials.slice(0);
    this.startComponents();
    this.sendInitials();
    return this.sendDefaults();
  };

  Network.prototype.stop = function() {
    var connection, id, process, _i, _len, _ref, _ref1;
    _ref = this.connections;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      connection = _ref[_i];
      if (!connection.isConnected()) {
        continue;
      }
      connection.disconnect();
    }
    _ref1 = this.processes;
    for (id in _ref1) {
      process = _ref1[id];
      process.component.shutdown();
    }
    return this.started = false;
  };

  Network.prototype.getDebug = function() {
    return this.debug;
  };

  Network.prototype.setDebug = function(active) {
    var instance, process, processId, socket, _i, _len, _ref, _ref1, _results;
    if (active === this.debug) {
      return;
    }
    this.debug = active;
    _ref = this.connections;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      socket.setDebug(active);
    }
    _ref1 = this.processes;
    _results = [];
    for (processId in _ref1) {
      process = _ref1[processId];
      instance = process.component;
      if (instance.isSubgraph()) {
        _results.push(instance.network.setDebug(active));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  return Network;

})(EventEmitter);

exports.Network = Network;

});
require.register("noflo-noflo/src/lib/Platform.js", function(exports, require, module){
exports.isBrowser = function() {
  if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    return false;
  }
  return true;
};

});
require.register("noflo-noflo/src/lib/Journal.js", function(exports, require, module){
var EventEmitter, Journal, JournalStore, MemoryJournalStore, calculateMeta, clone, entryToPrettyString,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

EventEmitter = require('events').EventEmitter;

clone = require('./Utils').clone;

entryToPrettyString = function(entry) {
  var a;
  a = entry.args;
  switch (entry.cmd) {
    case 'addNode':
      return "" + a.id + "(" + a.component + ")";
    case 'removeNode':
      return "DEL " + a.id + "(" + a.component + ")";
    case 'renameNode':
      return "RENAME " + a.oldId + " " + a.newId;
    case 'changeNode':
      return "META " + a.id;
    case 'addEdge':
      return "" + a.from.node + " " + a.from.port + " -> " + a.to.port + " " + a.to.node;
    case 'removeEdge':
      return "" + a.from.node + " " + a.from.port + " -X> " + a.to.port + " " + a.to.node;
    case 'changeEdge':
      return "META " + a.from.node + " " + a.from.port + " -> " + a.to.port + " " + a.to.node;
    case 'addInitial':
      return "'" + a.from.data + "' -> " + a.to.port + " " + a.to.node;
    case 'removeInitial':
      return "'" + a.from.data + "' -X> " + a.to.port + " " + a.to.node;
    case 'startTransaction':
      return ">>> " + entry.rev + ": " + a.id;
    case 'endTransaction':
      return "<<< " + entry.rev + ": " + a.id;
    case 'changeProperties':
      return "PROPERTIES";
    case 'addGroup':
      return "GROUP " + a.name;
    case 'renameGroup':
      return "RENAME GROUP " + a.oldName + " " + a.newName;
    case 'removeGroup':
      return "DEL GROUP " + a.name;
    case 'changeGroup':
      return "META GROUP " + a.name;
    case 'addInport':
      return "INPORT " + a.name;
    case 'removeInport':
      return "DEL INPORT " + a.name;
    case 'renameInport':
      return "RENAME INPORT " + a.oldId + " " + a.newId;
    case 'changeInport':
      return "META INPORT " + a.name;
    case 'addOutport':
      return "OUTPORT " + a.name;
    case 'removeOutport':
      return "DEL OUTPORT " + a.name;
    case 'renameOutport':
      return "RENAME OUTPORT " + a.oldId + " " + a.newId;
    case 'changeOutport':
      return "META OUTPORT " + a.name;
    default:
      throw new Error("Unknown journal entry: " + entry.cmd);
  }
};

calculateMeta = function(oldMeta, newMeta) {
  var k, setMeta, v;
  setMeta = {};
  for (k in oldMeta) {
    v = oldMeta[k];
    setMeta[k] = null;
  }
  for (k in newMeta) {
    v = newMeta[k];
    setMeta[k] = v;
  }
  return setMeta;
};

JournalStore = (function(_super) {
  __extends(JournalStore, _super);

  JournalStore.prototype.lastRevision = 0;

  function JournalStore(graph) {
    this.graph = graph;
    this.lastRevision = 0;
  }

  JournalStore.prototype.putTransaction = function(revId, entries) {
    if (revId > this.lastRevision) {
      this.lastRevision = revId;
    }
    return this.emit('transaction', revId);
  };

  JournalStore.prototype.fetchTransaction = function(revId, entries) {};

  return JournalStore;

})(EventEmitter);

MemoryJournalStore = (function(_super) {
  __extends(MemoryJournalStore, _super);

  function MemoryJournalStore(graph) {
    MemoryJournalStore.__super__.constructor.call(this, graph);
    this.transactions = [];
  }

  MemoryJournalStore.prototype.putTransaction = function(revId, entries) {
    MemoryJournalStore.__super__.putTransaction.call(this, revId, entries);
    return this.transactions[revId] = entries;
  };

  MemoryJournalStore.prototype.fetchTransaction = function(revId) {
    return this.transactions[revId];
  };

  return MemoryJournalStore;

})(JournalStore);

Journal = (function(_super) {
  __extends(Journal, _super);

  Journal.prototype.graph = null;

  Journal.prototype.entries = [];

  Journal.prototype.subscribed = true;

  function Journal(graph, metadata, store) {
    this.endTransaction = __bind(this.endTransaction, this);
    this.startTransaction = __bind(this.startTransaction, this);
    var edge, group, iip, k, node, v, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    this.graph = graph;
    this.entries = [];
    this.subscribed = true;
    this.store = store || new MemoryJournalStore(this.graph);
    if (this.store.transactions.length === 0) {
      this.currentRevision = -1;
      this.startTransaction('initial', metadata);
      _ref = this.graph.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        this.appendCommand('addNode', node);
      }
      _ref1 = this.graph.edges;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        edge = _ref1[_j];
        this.appendCommand('addEdge', edge);
      }
      _ref2 = this.graph.initializers;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        iip = _ref2[_k];
        this.appendCommand('addInitial', iip);
      }
      if (Object.keys(this.graph.properties).length > 0) {
        this.appendCommand('changeProperties', this.graph.properties, {});
      }
      _ref3 = this.graph.inports;
      for (k in _ref3) {
        v = _ref3[k];
        this.appendCommand('addInport', {
          name: k,
          port: v
        });
      }
      _ref4 = this.graph.outports;
      for (k in _ref4) {
        v = _ref4[k];
        this.appendCommand('addOutport', {
          name: k,
          port: v
        });
      }
      _ref5 = this.graph.groups;
      for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
        group = _ref5[_l];
        this.appendCommand('addGroup', group);
      }
      this.endTransaction('initial', metadata);
    } else {
      this.currentRevision = this.store.lastRevision;
    }
    this.graph.on('addNode', (function(_this) {
      return function(node) {
        return _this.appendCommand('addNode', node);
      };
    })(this));
    this.graph.on('removeNode', (function(_this) {
      return function(node) {
        return _this.appendCommand('removeNode', node);
      };
    })(this));
    this.graph.on('renameNode', (function(_this) {
      return function(oldId, newId) {
        var args;
        args = {
          oldId: oldId,
          newId: newId
        };
        return _this.appendCommand('renameNode', args);
      };
    })(this));
    this.graph.on('changeNode', (function(_this) {
      return function(node, oldMeta) {
        return _this.appendCommand('changeNode', {
          id: node.id,
          "new": node.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('addEdge', (function(_this) {
      return function(edge) {
        return _this.appendCommand('addEdge', edge);
      };
    })(this));
    this.graph.on('removeEdge', (function(_this) {
      return function(edge) {
        return _this.appendCommand('removeEdge', edge);
      };
    })(this));
    this.graph.on('changeEdge', (function(_this) {
      return function(edge, oldMeta) {
        return _this.appendCommand('changeEdge', {
          from: edge.from,
          to: edge.to,
          "new": edge.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('addInitial', (function(_this) {
      return function(iip) {
        return _this.appendCommand('addInitial', iip);
      };
    })(this));
    this.graph.on('removeInitial', (function(_this) {
      return function(iip) {
        return _this.appendCommand('removeInitial', iip);
      };
    })(this));
    this.graph.on('changeProperties', (function(_this) {
      return function(newProps, oldProps) {
        return _this.appendCommand('changeProperties', {
          "new": newProps,
          old: oldProps
        });
      };
    })(this));
    this.graph.on('addGroup', (function(_this) {
      return function(group) {
        return _this.appendCommand('addGroup', group);
      };
    })(this));
    this.graph.on('renameGroup', (function(_this) {
      return function(oldName, newName) {
        return _this.appendCommand('renameGroup', {
          oldName: oldName,
          newName: newName
        });
      };
    })(this));
    this.graph.on('removeGroup', (function(_this) {
      return function(group) {
        return _this.appendCommand('removeGroup', group);
      };
    })(this));
    this.graph.on('changeGroup', (function(_this) {
      return function(group, oldMeta) {
        return _this.appendCommand('changeGroup', {
          name: group.name,
          "new": group.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('addExport', (function(_this) {
      return function(exported) {
        return _this.appendCommand('addExport', exported);
      };
    })(this));
    this.graph.on('removeExport', (function(_this) {
      return function(exported) {
        return _this.appendCommand('removeExport', exported);
      };
    })(this));
    this.graph.on('addInport', (function(_this) {
      return function(name, port) {
        return _this.appendCommand('addInport', {
          name: name,
          port: port
        });
      };
    })(this));
    this.graph.on('removeInport', (function(_this) {
      return function(name, port) {
        return _this.appendCommand('removeInport', {
          name: name,
          port: port
        });
      };
    })(this));
    this.graph.on('renameInport', (function(_this) {
      return function(oldId, newId) {
        return _this.appendCommand('renameInport', {
          oldId: oldId,
          newId: newId
        });
      };
    })(this));
    this.graph.on('changeInport', (function(_this) {
      return function(name, port, oldMeta) {
        return _this.appendCommand('changeInport', {
          name: name,
          "new": port.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('addOutport', (function(_this) {
      return function(name, port) {
        return _this.appendCommand('addOutport', {
          name: name,
          port: port
        });
      };
    })(this));
    this.graph.on('removeOutport', (function(_this) {
      return function(name, port) {
        return _this.appendCommand('removeOutport', {
          name: name,
          port: port
        });
      };
    })(this));
    this.graph.on('renameOutport', (function(_this) {
      return function(oldId, newId) {
        return _this.appendCommand('renameOutport', {
          oldId: oldId,
          newId: newId
        });
      };
    })(this));
    this.graph.on('changeOutport', (function(_this) {
      return function(name, port, oldMeta) {
        return _this.appendCommand('changeOutport', {
          name: name,
          "new": port.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('startTransaction', (function(_this) {
      return function(id, meta) {
        return _this.startTransaction(id, meta);
      };
    })(this));
    this.graph.on('endTransaction', (function(_this) {
      return function(id, meta) {
        return _this.endTransaction(id, meta);
      };
    })(this));
  }

  Journal.prototype.startTransaction = function(id, meta) {
    if (!this.subscribed) {
      return;
    }
    if (this.entries.length > 0) {
      throw Error("Inconsistent @entries");
    }
    this.currentRevision++;
    return this.appendCommand('startTransaction', {
      id: id,
      metadata: meta
    }, this.currentRevision);
  };

  Journal.prototype.endTransaction = function(id, meta) {
    if (!this.subscribed) {
      return;
    }
    this.appendCommand('endTransaction', {
      id: id,
      metadata: meta
    }, this.currentRevision);
    this.store.putTransaction(this.currentRevision, this.entries);
    return this.entries = [];
  };

  Journal.prototype.appendCommand = function(cmd, args, rev) {
    var entry;
    if (!this.subscribed) {
      return;
    }
    entry = {
      cmd: cmd,
      args: clone(args)
    };
    if (rev != null) {
      entry.rev = rev;
    }
    return this.entries.push(entry);
  };

  Journal.prototype.executeEntry = function(entry) {
    var a;
    a = entry.args;
    switch (entry.cmd) {
      case 'addNode':
        return this.graph.addNode(a.id, a.component);
      case 'removeNode':
        return this.graph.removeNode(a.id);
      case 'renameNode':
        return this.graph.renameNode(a.oldId, a.newId);
      case 'changeNode':
        return this.graph.setNodeMetadata(a.id, calculateMeta(a.old, a["new"]));
      case 'addEdge':
        return this.graph.addEdge(a.from.node, a.from.port, a.to.node, a.to.port);
      case 'removeEdge':
        return this.graph.removeEdge(a.from.node, a.from.port, a.to.node, a.to.port);
      case 'changeEdge':
        return this.graph.setEdgeMetadata(a.from.node, a.from.port, a.to.node, a.to.port, calculateMeta(a.old, a["new"]));
      case 'addInitial':
        return this.graph.addInitial(a.from.data, a.to.node, a.to.port);
      case 'removeInitial':
        return this.graph.removeInitial(a.to.node, a.to.port);
      case 'startTransaction':
        return null;
      case 'endTransaction':
        return null;
      case 'changeProperties':
        return this.graph.setProperties(a["new"]);
      case 'addGroup':
        return this.graph.addGroup(a.name, a.nodes, a.metadata);
      case 'renameGroup':
        return this.graph.renameGroup(a.oldName, a.newName);
      case 'removeGroup':
        return this.graph.removeGroup(a.name);
      case 'changeGroup':
        return this.graph.setGroupMetadata(a.name, calculateMeta(a.old, a["new"]));
      case 'addInport':
        return this.graph.addInport(a.name, a.port.process, a.port.port, a.port.metadata);
      case 'removeInport':
        return this.graph.removeInport(a.name);
      case 'renameInport':
        return this.graph.renameInport(a.oldId, a.newId);
      case 'changeInport':
        return this.graph.setInportMetadata(a.port, calculateMeta(a.old, a["new"]));
      case 'addOutport':
        return this.graph.addOutport(a.name, a.port.process, a.port.port, a.port.metadata(a.name));
      case 'removeOutport':
        return this.graph.removeOutport;
      case 'renameOutport':
        return this.graph.renameOutport(a.oldId, a.newId);
      case 'changeOutport':
        return this.graph.setOutportMetadata(a.port, calculateMeta(a.old, a["new"]));
      default:
        throw new Error("Unknown journal entry: " + entry.cmd);
    }
  };

  Journal.prototype.executeEntryInversed = function(entry) {
    var a;
    a = entry.args;
    switch (entry.cmd) {
      case 'addNode':
        return this.graph.removeNode(a.id);
      case 'removeNode':
        return this.graph.addNode(a.id, a.component);
      case 'renameNode':
        return this.graph.renameNode(a.newId, a.oldId);
      case 'changeNode':
        return this.graph.setNodeMetadata(a.id, calculateMeta(a["new"], a.old));
      case 'addEdge':
        return this.graph.removeEdge(a.from.node, a.from.port, a.to.node, a.to.port);
      case 'removeEdge':
        return this.graph.addEdge(a.from.node, a.from.port, a.to.node, a.to.port);
      case 'changeEdge':
        return this.graph.setEdgeMetadata(a.from.node, a.from.port, a.to.node, a.to.port, calculateMeta(a["new"], a.old));
      case 'addInitial':
        return this.graph.removeInitial(a.to.node, a.to.port);
      case 'removeInitial':
        return this.graph.addInitial(a.from.data, a.to.node, a.to.port);
      case 'startTransaction':
        return null;
      case 'endTransaction':
        return null;
      case 'changeProperties':
        return this.graph.setProperties(a.old);
      case 'addGroup':
        return this.graph.removeGroup(a.name);
      case 'renameGroup':
        return this.graph.renameGroup(a.newName, a.oldName);
      case 'removeGroup':
        return this.graph.addGroup(a.name, a.nodes, a.metadata);
      case 'changeGroup':
        return this.graph.setGroupMetadata(a.name, calculateMeta(a["new"], a.old));
      case 'addInport':
        return this.graph.removeInport(a.name);
      case 'removeInport':
        return this.graph.addInport(a.name, a.port.process, a.port.port, a.port.metadata);
      case 'renameInport':
        return this.graph.renameInport(a.newId, a.oldId);
      case 'changeInport':
        return this.graph.setInportMetadata(a.port, calculateMeta(a["new"], a.old));
      case 'addOutport':
        return this.graph.removeOutport(a.name);
      case 'removeOutport':
        return this.graph.addOutport(a.name, a.port.process, a.port.port, a.port.metadata);
      case 'renameOutport':
        return this.graph.renameOutport(a.newId, a.oldId);
      case 'changeOutport':
        return this.graph.setOutportMetadata(a.port, calculateMeta(a["new"], a.old));
      default:
        throw new Error("Unknown journal entry: " + entry.cmd);
    }
  };

  Journal.prototype.moveToRevision = function(revId) {
    var entries, entry, i, r, _i, _j, _k, _l, _len, _ref, _ref1, _ref2, _ref3, _ref4;
    if (revId === this.currentRevision) {
      return;
    }
    this.subscribed = false;
    if (revId > this.currentRevision) {
      for (r = _i = _ref = this.currentRevision + 1; _ref <= revId ? _i <= revId : _i >= revId; r = _ref <= revId ? ++_i : --_i) {
        _ref1 = this.store.fetchTransaction(r);
        for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
          entry = _ref1[_j];
          this.executeEntry(entry);
        }
      }
    } else {
      for (r = _k = _ref2 = this.currentRevision, _ref3 = revId + 1; _k >= _ref3; r = _k += -1) {
        entries = this.store.fetchTransaction(r);
        for (i = _l = _ref4 = entries.length - 1; _l >= 0; i = _l += -1) {
          this.executeEntryInversed(entries[i]);
        }
      }
    }
    this.currentRevision = revId;
    return this.subscribed = true;
  };

  Journal.prototype.undo = function() {
    if (!this.canUndo()) {
      return;
    }
    return this.moveToRevision(this.currentRevision - 1);
  };

  Journal.prototype.canUndo = function() {
    return this.currentRevision > 0;
  };

  Journal.prototype.redo = function() {
    if (!this.canRedo()) {
      return;
    }
    return this.moveToRevision(this.currentRevision + 1);
  };

  Journal.prototype.canRedo = function() {
    return this.currentRevision < this.store.lastRevision;
  };

  Journal.prototype.toPrettyString = function(startRev, endRev) {
    var e, entry, lines, r, _i, _j, _len;
    startRev |= 0;
    endRev |= this.store.lastRevision;
    lines = [];
    for (r = _i = startRev; startRev <= endRev ? _i < endRev : _i > endRev; r = startRev <= endRev ? ++_i : --_i) {
      e = this.store.fetchTransaction(r);
      for (_j = 0, _len = e.length; _j < _len; _j++) {
        entry = e[_j];
        lines.push(entryToPrettyString(entry));
      }
    }
    return lines.join('\n');
  };

  Journal.prototype.toJSON = function(startRev, endRev) {
    var entries, entry, r, _i, _j, _len, _ref;
    startRev |= 0;
    endRev |= this.store.lastRevision;
    entries = [];
    for (r = _i = startRev; _i < endRev; r = _i += 1) {
      _ref = this.store.fetchTransaction(r);
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        entry = _ref[_j];
        entries.push(entryToPrettyString(entry));
      }
    }
    return entries;
  };

  Journal.prototype.save = function(file, success) {
    var json;
    json = JSON.stringify(this.toJSON(), null, 4);
    return require('fs').writeFile("" + file + ".json", json, "utf-8", function(err, data) {
      if (err) {
        throw err;
      }
      return success(file);
    });
  };

  return Journal;

})(EventEmitter);

exports.Journal = Journal;

exports.JournalStore = JournalStore;

exports.MemoryJournalStore = MemoryJournalStore;

});
require.register("noflo-noflo/src/lib/Utils.js", function(exports, require, module){
var clone, guessLanguageFromFilename;

clone = function(obj) {
  var flags, key, newInstance;
  if ((obj == null) || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof RegExp) {
    flags = '';
    if (obj.global != null) {
      flags += 'g';
    }
    if (obj.ignoreCase != null) {
      flags += 'i';
    }
    if (obj.multiline != null) {
      flags += 'm';
    }
    if (obj.sticky != null) {
      flags += 'y';
    }
    return new RegExp(obj.source, flags);
  }
  newInstance = new obj.constructor();
  for (key in obj) {
    newInstance[key] = clone(obj[key]);
  }
  return newInstance;
};

guessLanguageFromFilename = function(filename) {
  if (/.*\.coffee$/.test(filename)) {
    return 'coffeescript';
  }
  return 'javascript';
};

exports.clone = clone;

exports.guessLanguageFromFilename = guessLanguageFromFilename;

});
require.register("noflo-noflo/src/lib/Helpers.js", function(exports, require, module){
var InternalSocket, StreamReceiver, StreamSender, isArray, _,
  __hasProp = {}.hasOwnProperty;

_ = require('underscore');

StreamSender = require('./Streams').StreamSender;

StreamReceiver = require('./Streams').StreamReceiver;

InternalSocket = require('./InternalSocket');

isArray = function(obj) {
  if (Array.isArray) {
    return Array.isArray(obj);
  }
  return Object.prototype.toString.call(arg) === '[object Array]';
};

exports.MapComponent = function(component, func, config) {
  var groups, inPort, outPort;
  if (!config) {
    config = {};
  }
  if (!config.inPort) {
    config.inPort = 'in';
  }
  if (!config.outPort) {
    config.outPort = 'out';
  }
  inPort = component.inPorts[config.inPort];
  outPort = component.outPorts[config.outPort];
  groups = [];
  return inPort.process = function(event, payload) {
    switch (event) {
      case 'connect':
        return outPort.connect();
      case 'begingroup':
        groups.push(payload);
        return outPort.beginGroup(payload);
      case 'data':
        return func(payload, groups, outPort);
      case 'endgroup':
        groups.pop();
        return outPort.endGroup();
      case 'disconnect':
        groups = [];
        return outPort.disconnect();
    }
  };
};

exports.WirePattern = function(component, config, proc) {
  var baseShutdown, closeGroupOnOuts, collectGroups, disconnectOuts, gc, inPorts, name, outPorts, port, processQueue, resumeTaskQ, sendGroupToOuts, _fn, _fn1, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1;
  inPorts = 'in' in config ? config["in"] : 'in';
  if (!isArray(inPorts)) {
    inPorts = [inPorts];
  }
  outPorts = 'out' in config ? config.out : 'out';
  if (!isArray(outPorts)) {
    outPorts = [outPorts];
  }
  if (!('error' in config)) {
    config.error = 'error';
  }
  if (!('async' in config)) {
    config.async = false;
  }
  if (!('ordered' in config)) {
    config.ordered = true;
  }
  if (!('group' in config)) {
    config.group = false;
  }
  if (!('field' in config)) {
    config.field = null;
  }
  if (!('forwardGroups' in config)) {
    config.forwardGroups = false;
  }
  if (!('receiveStreams' in config)) {
    config.receiveStreams = false;
  }
  if (typeof config.receiveStreams === 'string') {
    config.receiveStreams = [config.receiveStreams];
  }
  if (!('sendStreams' in config)) {
    config.sendStreams = false;
  }
  if (typeof config.sendStreams === 'string') {
    config.sendStreams = [config.sendStreams];
  }
  if (config.async) {
    config.sendStreams = outPorts;
  }
  if (!('params' in config)) {
    config.params = [];
  }
  if (typeof config.params === 'string') {
    config.params = [config.params];
  }
  if (!('name' in config)) {
    config.name = '';
  }
  if (!('dropInput' in config)) {
    config.dropInput = false;
  }
  if (!('arrayPolicy' in config)) {
    config.arrayPolicy = {
      "in": 'any',
      params: 'all'
    };
  }
  if (!('gcFrequency' in config)) {
    config.gcFrequency = 100;
  }
  if (!('gcTimeout' in config)) {
    config.gcTimeout = 300;
  }
  collectGroups = config.forwardGroups;
  if (typeof collectGroups === 'boolean' && !config.group) {
    collectGroups = inPorts;
  }
  if (typeof collectGroups === 'string' && !config.group) {
    collectGroups = [collectGroups];
  }
  if (collectGroups !== false && config.group) {
    collectGroups = true;
  }
  for (_i = 0, _len = inPorts.length; _i < _len; _i++) {
    name = inPorts[_i];
    if (!component.inPorts[name]) {
      throw new Error("no inPort named '" + name + "'");
    }
  }
  for (_j = 0, _len1 = outPorts.length; _j < _len1; _j++) {
    name = outPorts[_j];
    if (!component.outPorts[name]) {
      throw new Error("no outPort named '" + name + "'");
    }
  }
  component.groupedData = {};
  component.groupedGroups = {};
  component.groupedDisconnects = {};
  disconnectOuts = function() {
    var p, _k, _len2, _results;
    _results = [];
    for (_k = 0, _len2 = outPorts.length; _k < _len2; _k++) {
      p = outPorts[_k];
      if (component.outPorts[p].isConnected()) {
        _results.push(component.outPorts[p].disconnect());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };
  sendGroupToOuts = function(grp) {
    var p, _k, _len2, _results;
    _results = [];
    for (_k = 0, _len2 = outPorts.length; _k < _len2; _k++) {
      p = outPorts[_k];
      _results.push(component.outPorts[p].beginGroup(grp));
    }
    return _results;
  };
  closeGroupOnOuts = function(grp) {
    var p, _k, _len2, _results;
    _results = [];
    for (_k = 0, _len2 = outPorts.length; _k < _len2; _k++) {
      p = outPorts[_k];
      _results.push(component.outPorts[p].endGroup(grp));
    }
    return _results;
  };
  component.outputQ = [];
  processQueue = function() {
    var flushed, key, stream, streams, tmp;
    while (component.outputQ.length > 0) {
      streams = component.outputQ[0];
      flushed = false;
      if (streams === null) {
        disconnectOuts();
        flushed = true;
      } else {
        if (outPorts.length === 1) {
          tmp = {};
          tmp[outPorts[0]] = streams;
          streams = tmp;
        }
        for (key in streams) {
          stream = streams[key];
          if (stream.resolved) {
            stream.flush();
            flushed = true;
          }
        }
      }
      if (flushed) {
        component.outputQ.shift();
      }
      if (!flushed) {
        return;
      }
    }
  };
  if (config.async) {
    if ('load' in component.outPorts) {
      component.load = 0;
    }
    component.beforeProcess = function(outs) {
      if (config.ordered) {
        component.outputQ.push(outs);
      }
      component.load++;
      if ('load' in component.outPorts && component.outPorts.load.isAttached()) {
        component.outPorts.load.send(component.load);
        return component.outPorts.load.disconnect();
      }
    };
    component.afterProcess = function(err, outs) {
      processQueue();
      component.load--;
      if ('load' in component.outPorts && component.outPorts.load.isAttached()) {
        component.outPorts.load.send(component.load);
        return component.outPorts.load.disconnect();
      }
    };
  }
  component.taskQ = [];
  component.params = {};
  component.requiredParams = [];
  component.completeParams = [];
  component.receivedParams = [];
  component.defaultedParams = [];
  component.defaultsSent = false;
  component.sendDefaults = function() {
    var param, tempSocket, _k, _len2, _ref;
    if (component.defaultedParams.length > 0) {
      _ref = component.defaultedParams;
      for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
        param = _ref[_k];
        if (component.receivedParams.indexOf(param) === -1) {
          tempSocket = InternalSocket.createSocket();
          component.inPorts[param].attach(tempSocket);
          tempSocket.send();
          tempSocket.disconnect();
          component.inPorts[param].detach(tempSocket);
        }
      }
    }
    return component.defaultsSent = true;
  };
  resumeTaskQ = function() {
    var task, temp, _results;
    if (component.completeParams.length === component.requiredParams.length && component.taskQ.length > 0) {
      temp = component.taskQ.slice(0);
      component.taskQ = [];
      _results = [];
      while (temp.length > 0) {
        task = temp.shift();
        _results.push(task());
      }
      return _results;
    }
  };
  _ref = config.params;
  for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
    port = _ref[_k];
    if (!component.inPorts[port]) {
      throw new Error("no inPort named '" + port + "'");
    }
    if (component.inPorts[port].isRequired()) {
      component.requiredParams.push(port);
    }
    if (component.inPorts[port].hasDefault()) {
      component.defaultedParams.push(port);
    }
  }
  _ref1 = config.params;
  _fn = function(port) {
    var inPort;
    inPort = component.inPorts[port];
    return inPort.process = function(event, payload, index) {
      if (event !== 'data') {
        return;
      }
      if (inPort.isAddressable()) {
        if (!(port in component.params)) {
          component.params[port] = {};
        }
        component.params[port][index] = payload;
        if (config.arrayPolicy.params === 'all' && Object.keys(component.params[port]).length < inPort.listAttached().length) {
          return;
        }
      } else {
        component.params[port] = payload;
      }
      if (component.completeParams.indexOf(port) === -1 && component.requiredParams.indexOf(port) > -1) {
        component.completeParams.push(port);
      }
      component.receivedParams.push(port);
      return resumeTaskQ();
    };
  };
  for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
    port = _ref1[_l];
    _fn(port);
  }
  component.disconnectData = {};
  component.disconnectQ = [];
  component.groupBuffers = {};
  component.keyBuffers = {};
  component.gcTimestamps = {};
  component.dropRequest = function(key) {
    if (key in component.disconnectData) {
      delete component.disconnectData[key];
    }
    if (key in component.groupedData) {
      delete component.groupedData[key];
    }
    if (key in component.groupedGroups) {
      return delete component.groupedGroups[key];
    }
  };
  component.gcCounter = 0;
  gc = function() {
    var current, key, val, _ref2, _results;
    component.gcCounter++;
    if (component.gcCounter % config.gcFrequency === 0) {
      current = new Date().getTime();
      _ref2 = component.gcTimestamps;
      _results = [];
      for (key in _ref2) {
        val = _ref2[key];
        if ((current - val) > (config.gcTimeout * 1000)) {
          component.dropRequest(key);
          _results.push(delete component.gcTimestamps[key]);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };
  _fn1 = function(port) {
    var inPort, needPortGroups;
    component.groupBuffers[port] = [];
    component.keyBuffers[port] = null;
    if (config.receiveStreams && config.receiveStreams.indexOf(port) !== -1) {
      inPort = new StreamReceiver(component.inPorts[port]);
    } else {
      inPort = component.inPorts[port];
    }
    needPortGroups = collectGroups instanceof Array && collectGroups.indexOf(port) !== -1;
    return inPort.process = function(event, payload, index) {
      var data, foundGroup, g, groupLength, groups, grp, i, key, obj, out, outs, postpone, postponedToQ, reqId, requiredLength, resume, task, tmp, whenDone, whenDoneGroups, _len5, _len6, _len7, _len8, _n, _o, _p, _q, _r, _ref2, _ref3, _ref4, _s;
      if (!component.groupBuffers[port]) {
        component.groupBuffers[port] = [];
      }
      switch (event) {
        case 'begingroup':
          component.groupBuffers[port].push(payload);
          if (config.forwardGroups && (collectGroups === true || needPortGroups) && !config.async) {
            return sendGroupToOuts(payload);
          }
          break;
        case 'endgroup':
          component.groupBuffers[port] = component.groupBuffers[port].slice(0, component.groupBuffers[port].length - 1);
          if (config.forwardGroups && (collectGroups === true || needPortGroups) && !config.async) {
            return closeGroupOnOuts(payload);
          }
          break;
        case 'disconnect':
          if (inPorts.length === 1) {
            if (config.async || config.StreamSender) {
              if (config.ordered) {
                component.outputQ.push(null);
                return processQueue();
              } else {
                return component.disconnectQ.push(true);
              }
            } else {
              return disconnectOuts();
            }
          } else {
            foundGroup = false;
            key = component.keyBuffers[port];
            if (!(key in component.disconnectData)) {
              component.disconnectData[key] = [];
            }
            for (i = _n = 0, _ref2 = component.disconnectData[key].length; 0 <= _ref2 ? _n < _ref2 : _n > _ref2; i = 0 <= _ref2 ? ++_n : --_n) {
              if (!(port in component.disconnectData[key][i])) {
                foundGroup = true;
                component.disconnectData[key][i][port] = true;
                if (Object.keys(component.disconnectData[key][i]).length === inPorts.length) {
                  component.disconnectData[key].shift();
                  if (config.async || config.StreamSender) {
                    if (config.ordered) {
                      component.outputQ.push(null);
                      processQueue();
                    } else {
                      component.disconnectQ.push(true);
                    }
                  } else {
                    disconnectOuts();
                  }
                  if (component.disconnectData[key].length === 0) {
                    delete component.disconnectData[key];
                  }
                }
                break;
              }
            }
            if (!foundGroup) {
              obj = {};
              obj[port] = true;
              return component.disconnectData[key].push(obj);
            }
          }
          break;
        case 'data':
          if (inPorts.length === 1) {
            if (inPort.isAddressable()) {
              data = {};
              data[index] = payload;
            } else {
              data = payload;
            }
            groups = component.groupBuffers[port];
          } else {
            key = '';
            if (config.group && component.groupBuffers[port].length > 0) {
              key = component.groupBuffers[port].toString();
              if (config.group instanceof RegExp) {
                reqId = null;
                _ref3 = component.groupBuffers[port];
                for (_o = 0, _len5 = _ref3.length; _o < _len5; _o++) {
                  grp = _ref3[_o];
                  if (config.group.test(grp)) {
                    reqId = grp;
                    break;
                  }
                }
                key = reqId ? reqId : '';
              }
            } else if (config.field && typeof payload === 'object' && config.field in payload) {
              key = payload[config.field];
            }
            component.keyBuffers[port] = key;
            if (!(key in component.groupedData)) {
              component.groupedData[key] = [];
            }
            if (!(key in component.groupedGroups)) {
              component.groupedGroups[key] = [];
            }
            foundGroup = false;
            requiredLength = inPorts.length;
            if (config.field) {
              ++requiredLength;
            }
            for (i = _p = 0, _ref4 = component.groupedData[key].length; 0 <= _ref4 ? _p < _ref4 : _p > _ref4; i = 0 <= _ref4 ? ++_p : --_p) {
              if (!(port in component.groupedData[key][i]) || (component.inPorts[port].isAddressable() && config.arrayPolicy["in"] === 'all' && !(index in component.groupedData[key][i][port]))) {
                foundGroup = true;
                if (component.inPorts[port].isAddressable()) {
                  if (!(port in component.groupedData[key][i])) {
                    component.groupedData[key][i][port] = {};
                  }
                  component.groupedData[key][i][port][index] = payload;
                } else {
                  component.groupedData[key][i][port] = payload;
                }
                if (needPortGroups) {
                  component.groupedGroups[key][i] = _.union(component.groupedGroups[key][i], component.groupBuffers[port]);
                } else if (collectGroups === true) {
                  component.groupedGroups[key][i][port] = component.groupBuffers[port];
                }
                if (component.inPorts[port].isAddressable() && config.arrayPolicy["in"] === 'all' && Object.keys(component.groupedData[key][i][port]).length < component.inPorts[port].listAttached().length) {
                  return;
                }
                groupLength = Object.keys(component.groupedData[key][i]).length;
                if (groupLength === requiredLength) {
                  data = (component.groupedData[key].splice(i, 1))[0];
                  groups = (component.groupedGroups[key].splice(i, 1))[0];
                  if (collectGroups === true) {
                    groups = _.intersection.apply(null, _.values(groups));
                  }
                  if (component.groupedData[key].length === 0) {
                    delete component.groupedData[key];
                  }
                  if (component.groupedGroups[key].length === 0) {
                    delete component.groupedGroups[key];
                  }
                  if (config.group && key) {
                    delete component.gcTimestamps[key];
                  }
                  break;
                } else {
                  return;
                }
              }
            }
            if (!foundGroup) {
              obj = {};
              if (config.field) {
                obj[config.field] = key;
              }
              obj[port] = payload;
              component.groupedData[key].push(obj);
              if (needPortGroups) {
                component.groupedGroups[key].push(component.groupBuffers[port]);
              } else if (collectGroups === true) {
                tmp = {};
                tmp[port] = component.groupBuffers[port];
                component.groupedGroups[key].push(tmp);
              } else {
                component.groupedGroups[key].push([]);
              }
              if (config.group && key) {
                component.gcTimestamps[key] = new Date().getTime();
              }
              return;
            }
          }
          if (config.dropInput && component.completeParams.length !== component.requiredParams.length) {
            return;
          }
          outs = {};
          for (_q = 0, _len6 = outPorts.length; _q < _len6; _q++) {
            name = outPorts[_q];
            if (config.async || config.sendStreams && config.sendStreams.indexOf(name) !== -1) {
              outs[name] = new StreamSender(component.outPorts[name], config.ordered);
            } else {
              outs[name] = component.outPorts[name];
            }
          }
          if (outPorts.length === 1) {
            outs = outs[outPorts[0]];
          }
          if (!groups) {
            groups = [];
          }
          whenDoneGroups = groups.slice(0);
          whenDone = function(err) {
            var disconnect, out, outputs, _len7, _r;
            if (err) {
              component.error(err, whenDoneGroups);
            }
            if (typeof component.fail === 'function' && component.hasErrors) {
              component.fail();
            }
            outputs = outPorts.length === 1 ? {
              port: outs
            } : outs;
            disconnect = false;
            if (component.disconnectQ.length > 0) {
              component.disconnectQ.shift();
              disconnect = true;
            }
            for (name in outputs) {
              out = outputs[name];
              if (config.forwardGroups && config.async) {
                for (_r = 0, _len7 = whenDoneGroups.length; _r < _len7; _r++) {
                  i = whenDoneGroups[_r];
                  out.endGroup();
                }
              }
              if (disconnect) {
                out.disconnect();
              }
              if (config.async || config.StreamSender) {
                out.done();
              }
            }
            if (typeof component.afterProcess === 'function') {
              return component.afterProcess(err || component.hasErrors, outs);
            }
          };
          if (typeof component.beforeProcess === 'function') {
            component.beforeProcess(outs);
          }
          if (config.forwardGroups && config.async) {
            if (outPorts.length === 1) {
              for (_r = 0, _len7 = groups.length; _r < _len7; _r++) {
                g = groups[_r];
                outs.beginGroup(g);
              }
            } else {
              for (name in outs) {
                out = outs[name];
                for (_s = 0, _len8 = groups.length; _s < _len8; _s++) {
                  g = groups[_s];
                  out.beginGroup(g);
                }
              }
            }
          }
          exports.MultiError(component, config.name, config.error, groups);
          if (config.async) {
            postpone = function() {};
            resume = function() {};
            postponedToQ = false;
            task = function() {
              return proc.call(component, data, groups, outs, whenDone, postpone, resume);
            };
            postpone = function(backToQueue) {
              if (backToQueue == null) {
                backToQueue = true;
              }
              postponedToQ = backToQueue;
              if (backToQueue) {
                return component.taskQ.push(task);
              }
            };
            resume = function() {
              if (postponedToQ) {
                return resumeTaskQ();
              } else {
                return task();
              }
            };
          } else {
            task = function() {
              proc.call(component, data, groups, outs);
              return whenDone();
            };
          }
          component.taskQ.push(task);
          resumeTaskQ();
          return gc();
      }
    };
  };
  for (_m = 0, _len4 = inPorts.length; _m < _len4; _m++) {
    port = inPorts[_m];
    _fn1(port);
  }
  baseShutdown = component.shutdown;
  component.shutdown = function() {
    baseShutdown.call(component);
    component.groupedData = {};
    component.groupedGroups = {};
    component.outputQ = [];
    component.disconnectData = {};
    component.disconnectQ = [];
    component.taskQ = [];
    component.params = {};
    component.completeParams = [];
    component.receivedParams = [];
    component.defaultsSent = false;
    component.groupBuffers = {};
    component.keyBuffers = {};
    component.gcTimestamps = {};
    return component.gcCounter = 0;
  };
  return component;
};

exports.GroupedInput = exports.WirePattern;

exports.CustomError = function(message, options) {
  var err;
  err = new Error(message);
  return exports.CustomizeError(err, options);
};

exports.CustomizeError = function(err, options) {
  var key, val;
  for (key in options) {
    if (!__hasProp.call(options, key)) continue;
    val = options[key];
    err[key] = val;
  }
  return err;
};

exports.MultiError = function(component, group, errorPort, forwardedGroups) {
  var baseShutdown;
  if (group == null) {
    group = '';
  }
  if (errorPort == null) {
    errorPort = 'error';
  }
  if (forwardedGroups == null) {
    forwardedGroups = [];
  }
  component.hasErrors = false;
  component.errors = [];
  component.error = function(e, groups) {
    if (groups == null) {
      groups = [];
    }
    component.errors.push({
      err: e,
      groups: forwardedGroups.concat(groups)
    });
    return component.hasErrors = true;
  };
  component.fail = function(e, groups) {
    var error, grp, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    if (e == null) {
      e = null;
    }
    if (groups == null) {
      groups = [];
    }
    if (e) {
      component.error(e, groups);
    }
    if (!component.hasErrors) {
      return;
    }
    if (!(errorPort in component.outPorts)) {
      return;
    }
    if (!component.outPorts[errorPort].isAttached()) {
      return;
    }
    if (group) {
      component.outPorts[errorPort].beginGroup(group);
    }
    _ref = component.errors;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      error = _ref[_i];
      _ref1 = error.groups;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        grp = _ref1[_j];
        component.outPorts[errorPort].beginGroup(grp);
      }
      component.outPorts[errorPort].send(error.err);
      _ref2 = error.groups;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        grp = _ref2[_k];
        component.outPorts[errorPort].endGroup();
      }
    }
    if (group) {
      component.outPorts[errorPort].endGroup();
    }
    component.outPorts[errorPort].disconnect();
    component.hasErrors = false;
    return component.errors = [];
  };
  baseShutdown = component.shutdown;
  component.shutdown = function() {
    baseShutdown.call(component);
    component.hasErrors = false;
    return component.errors = [];
  };
  return component;
};

});
require.register("noflo-noflo/src/lib/Streams.js", function(exports, require, module){
var IP, StreamReceiver, StreamSender, Substream;

IP = (function() {
  function IP(data) {
    this.data = data;
  }

  IP.prototype.sendTo = function(port) {
    return port.send(this.data);
  };

  IP.prototype.getValue = function() {
    return this.data;
  };

  IP.prototype.toObject = function() {
    return this.data;
  };

  return IP;

})();

exports.IP = IP;

Substream = (function() {
  function Substream(key) {
    this.key = key;
    this.value = [];
  }

  Substream.prototype.push = function(value) {
    return this.value.push(value);
  };

  Substream.prototype.sendTo = function(port) {
    var ip, _i, _len, _ref;
    port.beginGroup(this.key);
    _ref = this.value;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ip = _ref[_i];
      if (ip instanceof Substream || ip instanceof IP) {
        ip.sendTo(port);
      } else {
        port.send(ip);
      }
    }
    return port.endGroup();
  };

  Substream.prototype.getKey = function() {
    return this.key;
  };

  Substream.prototype.getValue = function() {
    var hasKeys, ip, obj, res, val, _i, _len, _ref;
    switch (this.value.length) {
      case 0:
        return null;
      case 1:
        if (typeof this.value[0].getValue === 'function') {
          if (this.value[0] instanceof Substream) {
            obj = {};
            obj[this.value[0].key] = this.value[0].getValue();
            return obj;
          } else {
            return this.value[0].getValue();
          }
        } else {
          return this.value[0];
        }
        break;
      default:
        res = [];
        hasKeys = false;
        _ref = this.value;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ip = _ref[_i];
          val = typeof ip.getValue === 'function' ? ip.getValue() : ip;
          if (ip instanceof Substream) {
            obj = {};
            obj[ip.key] = ip.getValue();
            res.push(obj);
          } else {
            res.push(val);
          }
        }
        return res;
    }
  };

  Substream.prototype.toObject = function() {
    var obj;
    obj = {};
    obj[this.key] = this.getValue();
    return obj;
  };

  return Substream;

})();

exports.Substream = Substream;

StreamSender = (function() {
  function StreamSender(port, ordered) {
    this.port = port;
    this.ordered = ordered != null ? ordered : false;
    this.q = [];
    this.resetCurrent();
    this.resolved = false;
  }

  StreamSender.prototype.resetCurrent = function() {
    this.level = 0;
    this.current = null;
    return this.stack = [];
  };

  StreamSender.prototype.beginGroup = function(group) {
    var stream;
    this.level++;
    stream = new Substream(group);
    this.stack.push(stream);
    this.current = stream;
    return this;
  };

  StreamSender.prototype.endGroup = function() {
    var parent, value;
    if (this.level > 0) {
      this.level--;
    }
    value = this.stack.pop();
    if (this.level === 0) {
      this.q.push(value);
      this.resetCurrent();
    } else {
      parent = this.stack[this.stack.length - 1];
      parent.push(value);
      this.current = parent;
    }
    return this;
  };

  StreamSender.prototype.send = function(data) {
    if (this.level === 0) {
      this.q.push(new IP(data));
    } else {
      this.current.push(new IP(data));
    }
    return this;
  };

  StreamSender.prototype.done = function() {
    if (this.ordered) {
      this.resolved = true;
    } else {
      this.flush();
    }
    return this;
  };

  StreamSender.prototype.disconnect = function() {
    this.q.push(null);
    return this;
  };

  StreamSender.prototype.flush = function() {
    var ip, res, _i, _len, _ref;
    res = false;
    if (this.q.length > 0) {
      _ref = this.q;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ip = _ref[_i];
        if (ip === null) {
          if (this.port.isConnected()) {
            this.port.disconnect();
          }
        } else {
          ip.sendTo(this.port);
        }
      }
      res = true;
    }
    this.q = [];
    return res;
  };

  StreamSender.prototype.isAttached = function() {
    return this.port.isAttached();
  };

  return StreamSender;

})();

exports.StreamSender = StreamSender;

StreamReceiver = (function() {
  function StreamReceiver(port, buffered, process) {
    this.port = port;
    this.buffered = buffered != null ? buffered : false;
    this.process = process != null ? process : null;
    this.q = [];
    this.resetCurrent();
    this.port.process = (function(_this) {
      return function(event, payload, index) {
        var stream;
        switch (event) {
          case 'connect':
            if (typeof _this.process === 'function') {
              return _this.process('connect', index);
            }
            break;
          case 'begingroup':
            _this.level++;
            stream = new Substream(payload);
            if (_this.level === 1) {
              _this.root = stream;
              _this.parent = null;
            } else {
              _this.parent = _this.current;
            }
            return _this.current = stream;
          case 'endgroup':
            if (_this.level > 0) {
              _this.level--;
            }
            if (_this.level === 0) {
              if (_this.buffered) {
                _this.q.push(_this.root);
                _this.process('readable', index);
              } else {
                if (typeof _this.process === 'function') {
                  _this.process('data', _this.root, index);
                }
              }
              return _this.resetCurrent();
            } else {
              _this.parent.push(_this.current);
              return _this.current = _this.parent;
            }
            break;
          case 'data':
            if (_this.level === 0) {
              return _this.q.push(new IP(payload));
            } else {
              return _this.current.push(new IP(payload));
            }
            break;
          case 'disconnect':
            if (typeof _this.process === 'function') {
              return _this.process('disconnect', index);
            }
        }
      };
    })(this);
  }

  StreamReceiver.prototype.resetCurrent = function() {
    this.level = 0;
    this.root = null;
    this.current = null;
    return this.parent = null;
  };

  StreamReceiver.prototype.read = function() {
    if (this.q.length === 0) {
      return void 0;
    }
    return this.q.shift();
  };

  return StreamReceiver;

})();

exports.StreamReceiver = StreamReceiver;

});
require.register("noflo-noflo/src/components/Graph.js", function(exports, require, module){
var Graph, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  noflo = require("../../lib/NoFlo");
} else {
  noflo = require('../lib/NoFlo');
}

Graph = (function(_super) {
  __extends(Graph, _super);

  function Graph(metadata) {
    this.metadata = metadata;
    this.network = null;
    this.ready = true;
    this.started = false;
    this.baseDir = null;
    this.loader = null;
    this.inPorts = new noflo.InPorts({
      graph: {
        datatype: 'all',
        description: 'NoFlo graph definition to be used with the subgraph component',
        required: true,
        immediate: true
      }
    });
    this.outPorts = new noflo.OutPorts;
    this.inPorts.on('graph', 'data', (function(_this) {
      return function(data) {
        return _this.setGraph(data);
      };
    })(this));
  }

  Graph.prototype.setGraph = function(graph) {
    this.ready = false;
    if (typeof graph === 'object') {
      if (typeof graph.addNode === 'function') {
        return this.createNetwork(graph);
      }
      noflo.graph.loadJSON(graph, (function(_this) {
        return function(instance) {
          instance.baseDir = _this.baseDir;
          return _this.createNetwork(instance);
        };
      })(this));
      return;
    }
    if (graph.substr(0, 1) !== "/" && graph.substr(1, 1) !== ":" && process && process.cwd) {
      graph = "" + (process.cwd()) + "/" + graph;
    }
    return graph = noflo.graph.loadFile(graph, (function(_this) {
      return function(instance) {
        instance.baseDir = _this.baseDir;
        return _this.createNetwork(instance);
      };
    })(this));
  };

  Graph.prototype.createNetwork = function(graph) {
    this.description = graph.properties.description || '';
    this.icon = graph.properties.icon || this.icon;
    graph.componentLoader = this.loader;
    return noflo.createNetwork(graph, (function(_this) {
      return function(network) {
        _this.network = network;
        _this.emit('network', _this.network);
        return _this.network.connect(function() {
          var name, notReady, process, _ref;
          notReady = false;
          _ref = _this.network.processes;
          for (name in _ref) {
            process = _ref[name];
            if (!_this.checkComponent(name, process)) {
              notReady = true;
            }
          }
          if (!notReady) {
            return _this.setToReady();
          }
        });
      };
    })(this), true);
  };

  Graph.prototype.start = function() {
    if (!this.isReady()) {
      this.on('ready', (function(_this) {
        return function() {
          return _this.start();
        };
      })(this));
      return;
    }
    if (!this.network) {
      return;
    }
    this.started = true;
    return this.network.start();
  };

  Graph.prototype.checkComponent = function(name, process) {
    if (!process.component.isReady()) {
      process.component.once("ready", (function(_this) {
        return function() {
          _this.checkComponent(name, process);
          return _this.setToReady();
        };
      })(this));
      return false;
    }
    this.findEdgePorts(name, process);
    return true;
  };

  Graph.prototype.isExportedInport = function(port, nodeName, portName) {
    var exported, priv, pub, _i, _len, _ref, _ref1;
    _ref = this.network.graph.inports;
    for (pub in _ref) {
      priv = _ref[pub];
      if (!(priv.process === nodeName && priv.port === portName)) {
        continue;
      }
      return pub;
    }
    _ref1 = this.network.graph.exports;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      exported = _ref1[_i];
      if (!(exported.process === nodeName && exported.port === portName)) {
        continue;
      }
      this.network.graph.checkTransactionStart();
      this.network.graph.removeExport(exported["public"]);
      this.network.graph.addInport(exported["public"], exported.process, exported.port, exported.metadata);
      this.network.graph.checkTransactionEnd();
      return exported["public"];
    }
    return false;
  };

  Graph.prototype.isExportedOutport = function(port, nodeName, portName) {
    var exported, priv, pub, _i, _len, _ref, _ref1;
    _ref = this.network.graph.outports;
    for (pub in _ref) {
      priv = _ref[pub];
      if (!(priv.process === nodeName && priv.port === portName)) {
        continue;
      }
      return pub;
    }
    _ref1 = this.network.graph.exports;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      exported = _ref1[_i];
      if (!(exported.process === nodeName && exported.port === portName)) {
        continue;
      }
      this.network.graph.checkTransactionStart();
      this.network.graph.removeExport(exported["public"]);
      this.network.graph.addOutport(exported["public"], exported.process, exported.port, exported.metadata);
      this.network.graph.checkTransactionEnd();
      return exported["public"];
    }
    return false;
  };

  Graph.prototype.setToReady = function() {
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      return process.nextTick((function(_this) {
        return function() {
          _this.ready = true;
          return _this.emit('ready');
        };
      })(this));
    } else {
      return setTimeout((function(_this) {
        return function() {
          _this.ready = true;
          return _this.emit('ready');
        };
      })(this), 0);
    }
  };

  Graph.prototype.findEdgePorts = function(name, process) {
    var port, portName, targetPortName, _ref, _ref1;
    _ref = process.component.inPorts;
    for (portName in _ref) {
      port = _ref[portName];
      if (!port || typeof port === 'function' || !port.canAttach) {
        continue;
      }
      targetPortName = this.isExportedInport(port, name, portName);
      if (targetPortName === false) {
        continue;
      }
      this.inPorts.add(targetPortName, port);
      this.inPorts[targetPortName].once('connect', (function(_this) {
        return function() {
          if (_this.isStarted()) {
            return;
          }
          return _this.start();
        };
      })(this));
    }
    _ref1 = process.component.outPorts;
    for (portName in _ref1) {
      port = _ref1[portName];
      if (!port || typeof port === 'function' || !port.canAttach) {
        continue;
      }
      targetPortName = this.isExportedOutport(port, name, portName);
      if (targetPortName === false) {
        continue;
      }
      this.outPorts.add(targetPortName, port);
    }
    return true;
  };

  Graph.prototype.isReady = function() {
    return this.ready;
  };

  Graph.prototype.isSubgraph = function() {
    return true;
  };

  Graph.prototype.shutdown = function() {
    if (!this.network) {
      return;
    }
    return this.network.stop();
  };

  return Graph;

})(noflo.Component);

exports.getComponent = function(metadata) {
  return new Graph(metadata);
};

});
require.register("noflo-mirobot/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of noflo-mirobot.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-mirobot/vendor/mirobot.js", function(exports, require, module){
(function (root, factory) {
    'use strict';
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(root);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('mirobot', function () {
            var Mirobot = factory(root);
            if (!root.Mirobot) {
                root.Mirobot = Mirobot;
            }
            return Mirobot;
        });
    } else {
        // Browser globals
        root.Mirobot = factory(root);
    }
}(this, function (window, undefined) {

    var Mirobot = function(url, cb){
      this.url = url;
      this.connect(cb);
      this.cbs = {};
      this.listeners = [];
      this.robot_state = 'idle';
    }

    Mirobot.prototype = {

      connected: false,

      connect: function(cb){
        if(!this.connected){
          var self = this;
          this.ws = new WebSocket(this.url);
          this.ws.onmessage = function(ws_msg){self.handle_ws(ws_msg)};
          this.ws.onopen = function(){ 
            console.log("Mirobot is connected"); 
            self.setConnectedState(true);
            if (cb) {
              cb();
            }
          }
          this.ws.onerror = function(err){self.handleError(err)}
          this.ws.onclose = function(err){self.handleError(err)}
        }
      },

      setConnectedState: function(state){
        var self = this;
        self.connected = state;
        self.broadcast(state ? 'connected' : 'disconnected');
        // Try to auto reconnect if disconnected
        if(state){
          if(self.reconnectTimer){
            clearInterval(self.reconnectTimer);
            self.reconnectTimer = undefined;
          }
        }else{
          if(!self.reconnectTimer){
            self.reconnectTimer = setInterval(function(){
              self.connect();
            }, 1000);
          }
        }
      },
      
      broadcast: function(msg){
        for(i in this.listeners){
          this.listeners[i](msg);
        }
      },

      addListener: function(listener){
        this.listeners.push(listener);
      },

      handleError: function(err){
        if(err instanceof CloseEvent){
          this.setConnectedState(false);
        }else{
          console.log(err);
        }
      },

      move: function(direction, distance, cb){
        this.send({cmd: direction, arg: distance}, cb);
        // this.send({cmd: direction, arg: distance}, function(state, msg, recursion){
        //   // console.log(state, msg, recursion);
        //   // if(state === 'started'){
        //   //   console.log('ACEITO');
        //   // }
        // });
      },

      turn: function(direction, angle, cb){
        this.send({cmd: direction, arg: angle}, cb);
        // this.send({cmd: direction, arg: angle}, function(state, msg, recursion){
        //   // console.log(state, msg, recursion);
        //   // if(state === 'started'){
        //   //   console.log('ACEITO');
        //   // }
        // });
      },

      penup: function(cb){
        this.send({cmd: 'penup'}, cb);
      },

      pendown: function(cb){
        this.send({cmd: 'pendown'}, cb);
      },

      ping: function(cb){
        this.send({cmd: 'ping'}, cb);
      },
      
      stop: function(cb){
        var self = this;
        this.send({cmd:'stop'}, function(state, msg, recursion){
          if(state === 'complete' && !recursion){
            for(var i in self.cbs){
              self.cbs[i]('complete', undefined, true);
            }
            self.robot_state = 'idle';
            self.msg_stack = [];
            self.cbs = {};
            if(cb){ cb(state); }
          }
        });
      },
      
      pause: function(cb){
        this.send({cmd:'pause'}, cb);
      },
      
      resume: function(cb){
        this.send({cmd:'resume'}, cb);
      },

      version: function(cb){
        this.send({cmd:'version'}, cb);
      },

      send: function(msg, cb){
        msg.id = Math.random().toString(36).substr(2, 10)
        if(cb){
          this.cbs[msg.id] = cb;
        }
        if(msg.arg){ 
          msg.arg = msg.arg.toString(); 
        }
        if(['stop', 'pause', 'resume', 'ping', 'version'].indexOf(msg.cmd) >= 0){
          this.ws.send(JSON.stringify(msg));
        } else{
          this.push_msg(msg);
        }
      },
      
      push_msg: function(msg){
        this.msg_stack.push(msg);
        this.run_stack();
      },
      
      run_stack: function(){
        if(this.robot_state === 'idle' && this.msg_stack.length > 0){
          this.robot_state = 'receiving';
          console.log(this.msg_stack[0]);
          this.ws.send(JSON.stringify(this.msg_stack[0]));
        }
      },
      
      handle_ws: function(ws_msg){
        msg = JSON.parse(ws_msg.data);
        console.log('Handle message:', msg);
        if(this.msg_stack.length > 0 && this.msg_stack[0].id == msg.id){
          if(msg.status === 'accepted'){
            if(this.cbs[msg.id]){
              this.cbs[msg.id]('started', msg);
            }
            this.robot_state = 'running';
            // console.log(this.robot_state);
          }else if(msg.status === 'complete'){
            if(this.cbs[msg.id]){
              this.cbs[msg.id]('complete', msg);
              delete this.cbs[msg.id];
            }
            this.msg_stack.shift();
            if(this.msg_stack.length === 0){
              this.broadcast('program_complete');
            }
            this.robot_state = 'idle';
            this.run_stack();
          }
        }else{
          if(this.cbs[msg.id]){
            this.cbs[msg.id]('complete', msg);
            delete this.cbs[msg.id];
          }
        } 
      },
      
      robot_state: 'idle',
      msg_stack: []
    }
    return Mirobot;
}));
});
require.register("noflo-mirobot/graphs/DrawImage.json", function(exports, require, module){
module.exports = JSON.parse('{"properties":{"name":"DrawImage","environment":{"type":"noflo-browser","content":"<canvas id=\\"c\\" width=\\"400\\" height=\\"400\\"></canvas>"},"icon":""},"inports":{},"outports":{},"groups":[],"processes":{"Draw":{"component":"canvas/Draw","metadata":{"label":"Draw","x":864,"y":180,"width":72,"height":72}},"Image":{"component":"image/UrlToCanvas","metadata":{"label":"Image","x":-216,"y":72,"width":72,"height":72}},"DropError":{"component":"core/Drop","metadata":{"label":"DropError","x":-216,"y":180,"width":72,"height":72}},"GetCanvas":{"component":"dom/GetElement","metadata":{"label":"GetCanvas","x":864,"y":72,"width":72,"height":72}},"FilterWhite":{"component":"mirobot/PixelsToPoints","metadata":{"label":"FilterWhite","x":0,"y":72,"width":72,"height":72}},"MakeCircle":{"component":"canvas/MakeCircle","metadata":{"label":"MakeCircle","x":648,"y":288,"width":72,"height":72}},"Fill":{"component":"canvas/Fill","metadata":{"label":"Fill","x":756,"y":288,"width":72,"height":72}},"GetEdges":{"component":"image/GetCannyEdges","metadata":{"label":"GetEdges","x":-108,"y":72,"width":72,"height":72}},"SolveTSP":{"component":"mirobot/TSP","metadata":{"label":"SolveTSP","x":216,"y":0,"width":72,"height":72}},"MakePath":{"component":"canvas/MakePath","metadata":{"label":"MakePath","x":108,"y":72,"width":72,"height":72}},"MakePath_kp03g":{"component":"canvas/MakePath","metadata":{"label":"MakePath","x":324,"y":0,"width":72,"height":72}},"Stroke":{"component":"canvas/Stroke","metadata":{"label":"Stroke","x":756,"y":180,"width":72,"height":72}},"PointsToPolar":{"component":"mirobot/PointsToPolar","metadata":{"label":"PointsToPolar","x":432,"y":468,"width":72,"height":72}},"ProcessCommands":{"component":"mirobot/ProcessCommands","metadata":{"label":"ProcessCommands","x":576,"y":468,"width":72,"height":72}},"mirobot/Left_bkygc":{"component":"mirobot/Left","metadata":{"label":"mirobot/Left","x":216,"y":540,"width":72,"height":72}},"Output":{"component":"core/Output","metadata":{"label":"Output","x":900,"y":504,"width":72,"height":72}},"mirobot/Right_eavcp":{"component":"mirobot/Right","metadata":{"label":"mirobot/Right","x":216,"y":648,"width":72,"height":72}},"mirobot/SendCommand_7r5z2":{"component":"mirobot/SendCommand","metadata":{"label":"mirobot/SendCommand","x":756,"y":540,"width":72,"height":72}},"mirobot/GetMirobotLib_yb3su":{"component":"mirobot/GetMirobotLib","metadata":{"label":"mirobot/GetMirobotLib","x":612,"y":612,"width":72,"height":72}},"core/Repeat_a68ki":{"component":"core/Repeat","metadata":{"label":"core/Repeat","x":468,"y":612,"width":72,"height":72}}},"connections":[{"src":{"process":"Image","port":"error"},"tgt":{"process":"DropError","port":"in"}},{"src":{"process":"GetCanvas","port":"element"},"tgt":{"process":"Draw","port":"canvas"}},{"src":{"process":"FilterWhite","port":"points"},"tgt":{"process":"MakeCircle","port":"center"},"metadata":{"route":0}},{"src":{"process":"MakeCircle","port":"circle"},"tgt":{"process":"Fill","port":"items"}},{"src":{"process":"Fill","port":"fill"},"tgt":{"process":"Draw","port":"commands"}},{"src":{"process":"GetEdges","port":"canvas"},"tgt":{"process":"FilterWhite","port":"image"},"metadata":{"route":null}},{"src":{"process":"FilterWhite","port":"points"},"tgt":{"process":"MakePath","port":"items"},"metadata":{"route":0}},{"src":{"process":"MakePath","port":"path"},"tgt":{"process":"SolveTSP","port":"points"}},{"src":{"process":"SolveTSP","port":"points"},"tgt":{"process":"MakePath_kp03g","port":"items"},"metadata":{"route":null}},{"src":{"process":"MakePath_kp03g","port":"path"},"tgt":{"process":"Stroke","port":"items"}},{"src":{"process":"Stroke","port":"stroke"},"tgt":{"process":"Draw","port":"commands"}},{"src":{"process":"Image","port":"canvas"},"tgt":{"process":"GetEdges","port":"canvas"},"metadata":{"route":null}},{"src":{"process":"MakePath_kp03g","port":"path"},"tgt":{"process":"PointsToPolar","port":"points"},"metadata":{"route":0}},{"src":{"process":"PointsToPolar","port":"polar"},"tgt":{"process":"ProcessCommands","port":"commands"}},{"src":{"process":"core/Repeat_a68ki","port":"out"},"tgt":{"process":"mirobot/GetMirobotLib_yb3su","port":"bang"},"metadata":{}},{"src":{"process":"mirobot/GetMirobotLib_yb3su","port":"lib"},"tgt":{"process":"mirobot/SendCommand_7r5z2","port":"lib"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_7r5z2","port":"completed"},"tgt":{"process":"ProcessCommands","port":"next"},"metadata":{}},{"src":{"process":"ProcessCommands","port":"command"},"tgt":{"process":"mirobot/SendCommand_7r5z2","port":"command"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_7r5z2","port":"connected"},"tgt":{"process":"Output","port":"in"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_7r5z2","port":"disconnected"},"tgt":{"process":"Output","port":"in"},"metadata":{}},{"data":true,"tgt":{"process":"Draw","port":"drawevery"}},{"data":true,"tgt":{"process":"Draw","port":"clearevery"}},{"data":"#c","tgt":{"process":"GetCanvas","port":"selector"}},{"data":"Anonymous","tgt":{"process":"Image","port":"crossorigin"}},{"data":"#00ff00","tgt":{"process":"Fill","port":"fillstyle"}},{"data":true,"tgt":{"process":"FilterWhite","port":"shuffle"}},{"data":2,"tgt":{"process":"MakeCircle","port":"radius"}},{"data":2,"tgt":{"process":"GetEdges","port":"low"}},{"data":10,"tgt":{"process":"GetEdges","port":"high"}},{"data":5,"tgt":{"process":"GetEdges","port":"kernel"}},{"data":255,"tgt":{"process":"FilterWhite","port":"level"}},{"data":"#fff","tgt":{"process":"Stroke","port":"strokestyle"}},{"data":1,"tgt":{"process":"Stroke","port":"linewidth"}},{"data":20,"tgt":{"process":"mirobot/Left_bkygc","port":"angle"}},{"data":20,"tgt":{"process":"mirobot/Right_eavcp","port":"right"}},{"data":100,"tgt":{"process":"FilterWhite","port":"size"}},{"data":" https://i.imgur.com/Jpq8YGi.png","tgt":{"process":"Image","port":"url"}},{"data":"dummy","tgt":{"process":"core/Repeat_a68ki","port":"in"}},{"data":"ws://10.10.100.254:8899/websocket","tgt":{"process":"mirobot/SendCommand_7r5z2","port":"url"}}]}');
});
require.register("noflo-mirobot/graphs/DrawPoints.json", function(exports, require, module){
module.exports = JSON.parse('{"properties":{"name":"DrawPoints","id":"noflo-mirobot_graphs_DrawPoints","project":"noflo-mirobot","environment":{"type":"noflo-browser","content":"<canvas id=\\"c\\" width=\\"200\\" height=\\"200\\"></canvas>\\n<button id=\\"connectButton\\">Connect</button>\\n<button id=\\"sendButton\\">Start</button>\\n<button id=\\"clearButton\\">Clear</button>\\n<p id=\\"status\\"></p>"},"changed":false,"icon":"","sha":"883f0b129c19ffe561d6885eae7a2ef809520c52"},"inports":{},"outports":{},"groups":[],"processes":{"canvas/Draw_wicpv":{"component":"canvas/Draw","metadata":{"label":"canvas/Draw","x":1584,"y":180,"width":72,"height":72}},"dom/GetElement_zz4rq":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":468,"y":0,"width":72,"height":72}},"interaction/ReadCoordinates_2ocub":{"component":"interaction/ReadCoordinates","metadata":{"label":"interaction/ReadCoordinates","x":792,"y":72,"width":72,"height":72}},"dom/Listen_nha6s":{"component":"dom/Listen","metadata":{"label":"dom/Listen","x":612,"y":72,"width":72,"height":72}},"canvas/MakeCircle_2fgfk":{"component":"canvas/MakeCircle","metadata":{"label":"canvas/MakeCircle","x":1080,"y":180,"width":72,"height":72}},"canvas/Fill_52nqr":{"component":"canvas/Fill","metadata":{"label":"canvas/Fill","x":1224,"y":180,"width":72,"height":72}},"canvas/MakePath_8hr15":{"component":"canvas/MakePath","metadata":{"label":"canvas/MakePath","x":1224,"y":288,"width":72,"height":72}},"canvas/Stroke_xnlrz":{"component":"canvas/Stroke","metadata":{"label":"canvas/Stroke","x":1368,"y":288,"width":72,"height":72}},"MakePoint":{"component":"core/MakeFunction","metadata":{"label":"MakePoint","x":900,"y":180,"width":72,"height":72}},"mirobot/Array_5i69q":{"component":"mirobot/Array","metadata":{"label":"mirobot/Array","x":1080,"y":288,"width":72,"height":72}},"mirobot/ProcessCommands_bv8yi":{"component":"mirobot/ProcessCommands","metadata":{"label":"mirobot/ProcessCommands","x":1080,"y":468,"width":72,"height":72}},"mirobot/SendCommand_15fsp":{"component":"mirobot/SendCommand","metadata":{"label":"mirobot/SendCommand","x":1296,"y":504,"width":72,"height":72}},"core/Drop_8r4gr":{"component":"core/Drop","metadata":{"label":"core/Drop","x":1476,"y":648,"width":72,"height":72}},"mirobot/Array_8iyre":{"component":"mirobot/Array","metadata":{"label":"mirobot/Array","x":792,"y":468,"width":72,"height":72}},"mirobot/PointsToPolar_1ss44":{"component":"mirobot/PointsToPolar","metadata":{"label":"mirobot/PointsToPolar","x":936,"y":468,"width":72,"height":72}},"NextPls":{"component":"core/Kick","metadata":{"label":"NextPls","x":972,"y":576,"width":72,"height":72}},"SendCmds":{"component":"core/Kick","metadata":{"label":"SendCmds","x":648,"y":432,"width":72,"height":72}},"mirobot/GetMirobotLib_l0tku":{"component":"mirobot/GetMirobotLib","metadata":{"label":"mirobot/GetMirobotLib","x":1188,"y":792,"width":72,"height":72}},"core/Repeat_subwe":{"component":"core/Repeat","metadata":{"label":"core/Repeat","x":972,"y":828,"width":72,"height":72}},"ConnectPls":{"component":"core/Kick","metadata":{"label":"ConnectPls","x":972,"y":684,"width":72,"height":72}},"dom/GetElement_paqie":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":504,"y":576,"width":72,"height":72}},"interaction/ListenMouse_2uodb":{"component":"interaction/ListenMouse","metadata":{"label":"interaction/ListenMouse","x":648,"y":612,"width":72,"height":72}},"core/Output_uktbq":{"component":"core/Output","metadata":{"label":"core/Output","x":648,"y":936,"width":72,"height":72}},"dom/GetElement_r2dgi":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":468,"y":720,"width":72,"height":72}},"interaction/ListenMouse_g1lon":{"component":"interaction/ListenMouse","metadata":{"label":"interaction/ListenMouse","x":684,"y":756,"width":72,"height":72}},"dom/GetElement_3hc7s":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":1512,"y":396,"width":72,"height":72}},"dom/WriteHtml_b5khn":{"component":"dom/WriteHtml","metadata":{"label":"dom/WriteHtml","x":1620,"y":504,"width":72,"height":72}},"core/Repeat_3638i":{"component":"core/Repeat","metadata":{"label":"core/Repeat","x":648,"y":252,"width":72,"height":72}},"dom/GetElement_hr1tv":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":288,"y":252,"width":72,"height":72}},"interaction/ListenMouse_dyurx":{"component":"interaction/ListenMouse","metadata":{"label":"interaction/ListenMouse","x":468,"y":252,"width":72,"height":72}}},"connections":[{"src":{"process":"dom/GetElement_zz4rq","port":"element"},"tgt":{"process":"canvas/Draw_wicpv","port":"canvas"}},{"src":{"process":"dom/Listen_nha6s","port":"event"},"tgt":{"process":"interaction/ReadCoordinates_2ocub","port":"event"}},{"src":{"process":"interaction/ReadCoordinates_2ocub","port":"client"},"tgt":{"process":"canvas/MakeCircle_2fgfk","port":"center"}},{"src":{"process":"dom/GetElement_zz4rq","port":"element"},"tgt":{"process":"dom/Listen_nha6s","port":"element"},"metadata":{"route":0}},{"src":{"process":"canvas/MakeCircle_2fgfk","port":"circle"},"tgt":{"process":"canvas/Fill_52nqr","port":"items"}},{"src":{"process":"canvas/Fill_52nqr","port":"fill"},"tgt":{"process":"canvas/Draw_wicpv","port":"commands"}},{"src":{"process":"canvas/MakePath_8hr15","port":"path"},"tgt":{"process":"canvas/Stroke_xnlrz","port":"items"}},{"src":{"process":"canvas/Stroke_xnlrz","port":"stroke"},"tgt":{"process":"canvas/Draw_wicpv","port":"commands"}},{"src":{"process":"interaction/ReadCoordinates_2ocub","port":"client"},"tgt":{"process":"MakePoint","port":"in"},"metadata":{"route":0}},{"src":{"process":"mirobot/Array_5i69q","port":"array"},"tgt":{"process":"canvas/MakePath_8hr15","port":"items"},"metadata":{"route":null}},{"src":{"process":"MakePoint","port":"out"},"tgt":{"process":"mirobot/Array_5i69q","port":"points"},"metadata":{"route":0}},{"src":{"process":"MakePoint","port":"out"},"tgt":{"process":"mirobot/Array_5i69q","port":"send"},"metadata":{"route":0}},{"src":{"process":"mirobot/SendCommand_15fsp","port":"completed"},"tgt":{"process":"mirobot/ProcessCommands_bv8yi","port":"next"}},{"src":{"process":"interaction/ReadCoordinates_2ocub","port":"client"},"tgt":{"process":"mirobot/Array_8iyre","port":"points"},"metadata":{"route":0}},{"src":{"process":"mirobot/Array_8iyre","port":"array"},"tgt":{"process":"mirobot/PointsToPolar_1ss44","port":"points"},"metadata":{"route":null}},{"src":{"process":"mirobot/PointsToPolar_1ss44","port":"polar"},"tgt":{"process":"mirobot/ProcessCommands_bv8yi","port":"commands"}},{"src":{"process":"NextPls","port":"out"},"tgt":{"process":"mirobot/ProcessCommands_bv8yi","port":"next"}},{"src":{"process":"SendCmds","port":"out"},"tgt":{"process":"mirobot/Array_8iyre","port":"send"}},{"src":{"process":"core/Repeat_subwe","port":"out"},"tgt":{"process":"mirobot/GetMirobotLib_l0tku","port":"bang"},"metadata":{}},{"src":{"process":"mirobot/GetMirobotLib_l0tku","port":"lib"},"tgt":{"process":"mirobot/SendCommand_15fsp","port":"lib"},"metadata":{}},{"src":{"process":"mirobot/ProcessCommands_bv8yi","port":"command"},"tgt":{"process":"mirobot/SendCommand_15fsp","port":"command"},"metadata":{}},{"src":{"process":"ConnectPls","port":"out"},"tgt":{"process":"mirobot/SendCommand_15fsp","port":"url"},"metadata":{}},{"src":{"process":"mirobot/ProcessCommands_bv8yi","port":"path"},"tgt":{"process":"core/Drop_8r4gr","port":"in"},"metadata":{}},{"src":{"process":"dom/GetElement_paqie","port":"element"},"tgt":{"process":"interaction/ListenMouse_2uodb","port":"element"},"metadata":{}},{"src":{"process":"dom/GetElement_paqie","port":"error"},"tgt":{"process":"core/Output_uktbq","port":"in"},"metadata":{"route":1}},{"src":{"process":"interaction/ListenMouse_2uodb","port":"click"},"tgt":{"process":"ConnectPls","port":"in"},"metadata":{}},{"src":{"process":"dom/GetElement_r2dgi","port":"element"},"tgt":{"process":"interaction/ListenMouse_g1lon","port":"element"},"metadata":{}},{"src":{"process":"dom/GetElement_r2dgi","port":"error"},"tgt":{"process":"core/Output_uktbq","port":"in"},"metadata":{"route":1}},{"src":{"process":"interaction/ListenMouse_g1lon","port":"click"},"tgt":{"process":"SendCmds","port":"in"},"metadata":{}},{"src":{"process":"interaction/ListenMouse_g1lon","port":"click"},"tgt":{"process":"NextPls","port":"in"},"metadata":{"route":0}},{"src":{"process":"dom/GetElement_3hc7s","port":"element"},"tgt":{"process":"dom/WriteHtml_b5khn","port":"container"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_15fsp","port":"connected"},"tgt":{"process":"dom/WriteHtml_b5khn","port":"html"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_15fsp","port":"disconnected"},"tgt":{"process":"dom/WriteHtml_b5khn","port":"html"},"metadata":{}},{"src":{"process":"core/Repeat_3638i","port":"out"},"tgt":{"process":"mirobot/Array_8iyre","port":"clean"},"metadata":{}},{"src":{"process":"core/Repeat_3638i","port":"out"},"tgt":{"process":"mirobot/Array_5i69q","port":"clean"},"metadata":{"route":0}},{"src":{"process":"dom/GetElement_hr1tv","port":"element"},"tgt":{"process":"interaction/ListenMouse_dyurx","port":"element"},"metadata":{}},{"src":{"process":"interaction/ListenMouse_dyurx","port":"click"},"tgt":{"process":"core/Repeat_3638i","port":"in"},"metadata":{}},{"data":"#c","tgt":{"process":"dom/GetElement_zz4rq","port":"selector"}},{"data":true,"tgt":{"process":"canvas/Draw_wicpv","port":"drawevery"}},{"data":2,"tgt":{"process":"canvas/MakeCircle_2fgfk","port":"radius"}},{"data":"click","tgt":{"process":"dom/Listen_nha6s","port":"type"}},{"data":"#00ff00","tgt":{"process":"canvas/Fill_52nqr","port":"fillstyle"}},{"data":"#fff","tgt":{"process":"canvas/Stroke_xnlrz","port":"strokestyle"}},{"data":1,"tgt":{"process":"canvas/Stroke_xnlrz","port":"linewidth"}},{"data":"return {\\"type\\": \\"point\\", \\"x\\": x.x, \\"y\\": x.y};","tgt":{"process":"MakePoint","port":"function"}},{"data":"f","tgt":{"process":"SendCmds","port":"data"}},{"data":"j","tgt":{"process":"core/Repeat_subwe","port":"in"}},{"data":"ws://10.10.100.254:8899/websocket","tgt":{"process":"ConnectPls","port":"data"}},{"data":"h","tgt":{"process":"NextPls","port":"data"}},{"data":"#connectButton","tgt":{"process":"dom/GetElement_paqie","port":"selector"}},{"data":"#sendButton","tgt":{"process":"dom/GetElement_r2dgi","port":"selector"}},{"data":"#status","tgt":{"process":"dom/GetElement_3hc7s","port":"selector"}},{"data":"#clearButton","tgt":{"process":"dom/GetElement_hr1tv","port":"selector"}},{"data":true,"tgt":{"process":"canvas/Draw_wicpv","port":"clearevery"}}]}');
});
require.register("noflo-mirobot/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-mirobot","description":"Components for Mirobot.","author":"Vilson Vieira <vilson@void.cc>","repo":"vilson/noflo-mirobot","version":"0.1.0","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["index.js","vendor/mirobot.js","components/ControlMirobot.js","components/ControlVerticalMirobot.js","components/Forward.js","components/Repeat.js","components/Back.js","components/Left.js","components/Pause.js","components/Pendown.js","components/Penup.js","components/PixelsToPoints.js","components/Right.js","components/PointsToPolar.js","components/Dither.js","components/FloydSteinberg.js","components/BlackAndWhiteFilter.js","components/ThresholdFilter.js","components/TSP.js","components/PreviewCommand.js","components/ProcessCommands.js","components/SendCommand.js","components/Array.js","components/EstimateTime.js","components/GetMirobotLib.js","graphs/DrawImage.json","graphs/DrawPoints.json"],"json":["component.json","graphs/DrawImage.json","graphs/DrawPoints.json"],"noflo":{"components":{"Array":"components/Array.js","Back":"components/Back.js","BlackAndWhiteFilter":"components/BlackAndWhiteFilter.js","ControlMirobot":"components/ControlMirobot.js","ControlVerticalMirobot":"components/ControlVerticalMirobot.js","Dither":"components/Dither.js","EstimateTime":"components/EstimateTime.js","FloydSteinberg":"components/FloydSteinberg.js","Forward":"components/Forward.js","GetMirobotLib":"components/GetMirobotLib.js","Left":"components/Left.js","Pause":"components/Pause.js","Pendown":"components/Pendown.js","Penup":"components/Penup.js","PixelsToPoints":"components/PixelsToPoints.js","PointsToPolar":"components/PointsToPolar.js","PreviewCommand":"components/PreviewCommand.js","ProcessCommands":"components/ProcessCommands.js","Repeat":"components/Repeat.js","Right":"components/Right.js","SendCommand":"components/SendCommand.js","TSP":"components/TSP.js","ThresholdFilter":"components/ThresholdFilter.js"},"graphs":{"DrawImage":"graphs/DrawImage.json","noflo-mirobot_graphs_DrawPoints":"graphs/DrawPoints.json"}}}');
});
require.register("noflo-mirobot/graphs/DrawImage.json", function(exports, require, module){
module.exports = JSON.parse('{"properties":{"name":"DrawImage","environment":{"type":"noflo-browser","content":"<canvas id=\\"c\\" width=\\"400\\" height=\\"400\\"></canvas>"},"icon":""},"inports":{},"outports":{},"groups":[],"processes":{"Draw":{"component":"canvas/Draw","metadata":{"label":"Draw","x":864,"y":180,"width":72,"height":72}},"Image":{"component":"image/UrlToCanvas","metadata":{"label":"Image","x":-216,"y":72,"width":72,"height":72}},"DropError":{"component":"core/Drop","metadata":{"label":"DropError","x":-216,"y":180,"width":72,"height":72}},"GetCanvas":{"component":"dom/GetElement","metadata":{"label":"GetCanvas","x":864,"y":72,"width":72,"height":72}},"FilterWhite":{"component":"mirobot/PixelsToPoints","metadata":{"label":"FilterWhite","x":0,"y":72,"width":72,"height":72}},"MakeCircle":{"component":"canvas/MakeCircle","metadata":{"label":"MakeCircle","x":648,"y":288,"width":72,"height":72}},"Fill":{"component":"canvas/Fill","metadata":{"label":"Fill","x":756,"y":288,"width":72,"height":72}},"GetEdges":{"component":"image/GetCannyEdges","metadata":{"label":"GetEdges","x":-108,"y":72,"width":72,"height":72}},"SolveTSP":{"component":"mirobot/TSP","metadata":{"label":"SolveTSP","x":216,"y":0,"width":72,"height":72}},"MakePath":{"component":"canvas/MakePath","metadata":{"label":"MakePath","x":108,"y":72,"width":72,"height":72}},"MakePath_kp03g":{"component":"canvas/MakePath","metadata":{"label":"MakePath","x":324,"y":0,"width":72,"height":72}},"Stroke":{"component":"canvas/Stroke","metadata":{"label":"Stroke","x":756,"y":180,"width":72,"height":72}},"PointsToPolar":{"component":"mirobot/PointsToPolar","metadata":{"label":"PointsToPolar","x":432,"y":468,"width":72,"height":72}},"ProcessCommands":{"component":"mirobot/ProcessCommands","metadata":{"label":"ProcessCommands","x":576,"y":468,"width":72,"height":72}},"mirobot/Left_bkygc":{"component":"mirobot/Left","metadata":{"label":"mirobot/Left","x":216,"y":540,"width":72,"height":72}},"Output":{"component":"core/Output","metadata":{"label":"Output","x":900,"y":504,"width":72,"height":72}},"mirobot/Right_eavcp":{"component":"mirobot/Right","metadata":{"label":"mirobot/Right","x":216,"y":648,"width":72,"height":72}},"mirobot/SendCommand_7r5z2":{"component":"mirobot/SendCommand","metadata":{"label":"mirobot/SendCommand","x":756,"y":540,"width":72,"height":72}},"mirobot/GetMirobotLib_yb3su":{"component":"mirobot/GetMirobotLib","metadata":{"label":"mirobot/GetMirobotLib","x":612,"y":612,"width":72,"height":72}},"core/Repeat_a68ki":{"component":"core/Repeat","metadata":{"label":"core/Repeat","x":468,"y":612,"width":72,"height":72}}},"connections":[{"src":{"process":"Image","port":"error"},"tgt":{"process":"DropError","port":"in"}},{"src":{"process":"GetCanvas","port":"element"},"tgt":{"process":"Draw","port":"canvas"}},{"src":{"process":"FilterWhite","port":"points"},"tgt":{"process":"MakeCircle","port":"center"},"metadata":{"route":0}},{"src":{"process":"MakeCircle","port":"circle"},"tgt":{"process":"Fill","port":"items"}},{"src":{"process":"Fill","port":"fill"},"tgt":{"process":"Draw","port":"commands"}},{"src":{"process":"GetEdges","port":"canvas"},"tgt":{"process":"FilterWhite","port":"image"},"metadata":{"route":null}},{"src":{"process":"FilterWhite","port":"points"},"tgt":{"process":"MakePath","port":"items"},"metadata":{"route":0}},{"src":{"process":"MakePath","port":"path"},"tgt":{"process":"SolveTSP","port":"points"}},{"src":{"process":"SolveTSP","port":"points"},"tgt":{"process":"MakePath_kp03g","port":"items"},"metadata":{"route":null}},{"src":{"process":"MakePath_kp03g","port":"path"},"tgt":{"process":"Stroke","port":"items"}},{"src":{"process":"Stroke","port":"stroke"},"tgt":{"process":"Draw","port":"commands"}},{"src":{"process":"Image","port":"canvas"},"tgt":{"process":"GetEdges","port":"canvas"},"metadata":{"route":null}},{"src":{"process":"MakePath_kp03g","port":"path"},"tgt":{"process":"PointsToPolar","port":"points"},"metadata":{"route":0}},{"src":{"process":"PointsToPolar","port":"polar"},"tgt":{"process":"ProcessCommands","port":"commands"}},{"src":{"process":"core/Repeat_a68ki","port":"out"},"tgt":{"process":"mirobot/GetMirobotLib_yb3su","port":"bang"},"metadata":{}},{"src":{"process":"mirobot/GetMirobotLib_yb3su","port":"lib"},"tgt":{"process":"mirobot/SendCommand_7r5z2","port":"lib"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_7r5z2","port":"completed"},"tgt":{"process":"ProcessCommands","port":"next"},"metadata":{}},{"src":{"process":"ProcessCommands","port":"command"},"tgt":{"process":"mirobot/SendCommand_7r5z2","port":"command"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_7r5z2","port":"connected"},"tgt":{"process":"Output","port":"in"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_7r5z2","port":"disconnected"},"tgt":{"process":"Output","port":"in"},"metadata":{}},{"data":true,"tgt":{"process":"Draw","port":"drawevery"}},{"data":true,"tgt":{"process":"Draw","port":"clearevery"}},{"data":"#c","tgt":{"process":"GetCanvas","port":"selector"}},{"data":"Anonymous","tgt":{"process":"Image","port":"crossorigin"}},{"data":"#00ff00","tgt":{"process":"Fill","port":"fillstyle"}},{"data":true,"tgt":{"process":"FilterWhite","port":"shuffle"}},{"data":2,"tgt":{"process":"MakeCircle","port":"radius"}},{"data":2,"tgt":{"process":"GetEdges","port":"low"}},{"data":10,"tgt":{"process":"GetEdges","port":"high"}},{"data":5,"tgt":{"process":"GetEdges","port":"kernel"}},{"data":255,"tgt":{"process":"FilterWhite","port":"level"}},{"data":"#fff","tgt":{"process":"Stroke","port":"strokestyle"}},{"data":1,"tgt":{"process":"Stroke","port":"linewidth"}},{"data":20,"tgt":{"process":"mirobot/Left_bkygc","port":"angle"}},{"data":20,"tgt":{"process":"mirobot/Right_eavcp","port":"right"}},{"data":100,"tgt":{"process":"FilterWhite","port":"size"}},{"data":" https://i.imgur.com/Jpq8YGi.png","tgt":{"process":"Image","port":"url"}},{"data":"dummy","tgt":{"process":"core/Repeat_a68ki","port":"in"}},{"data":"ws://10.10.100.254:8899/websocket","tgt":{"process":"mirobot/SendCommand_7r5z2","port":"url"}}]}');
});
require.register("noflo-mirobot/graphs/DrawPoints.json", function(exports, require, module){
module.exports = JSON.parse('{"properties":{"name":"DrawPoints","id":"noflo-mirobot_graphs_DrawPoints","project":"noflo-mirobot","environment":{"type":"noflo-browser","content":"<canvas id=\\"c\\" width=\\"200\\" height=\\"200\\"></canvas>\\n<button id=\\"connectButton\\">Connect</button>\\n<button id=\\"sendButton\\">Start</button>\\n<button id=\\"clearButton\\">Clear</button>\\n<p id=\\"status\\"></p>"},"changed":false,"icon":"","sha":"883f0b129c19ffe561d6885eae7a2ef809520c52"},"inports":{},"outports":{},"groups":[],"processes":{"canvas/Draw_wicpv":{"component":"canvas/Draw","metadata":{"label":"canvas/Draw","x":1584,"y":180,"width":72,"height":72}},"dom/GetElement_zz4rq":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":468,"y":0,"width":72,"height":72}},"interaction/ReadCoordinates_2ocub":{"component":"interaction/ReadCoordinates","metadata":{"label":"interaction/ReadCoordinates","x":792,"y":72,"width":72,"height":72}},"dom/Listen_nha6s":{"component":"dom/Listen","metadata":{"label":"dom/Listen","x":612,"y":72,"width":72,"height":72}},"canvas/MakeCircle_2fgfk":{"component":"canvas/MakeCircle","metadata":{"label":"canvas/MakeCircle","x":1080,"y":180,"width":72,"height":72}},"canvas/Fill_52nqr":{"component":"canvas/Fill","metadata":{"label":"canvas/Fill","x":1224,"y":180,"width":72,"height":72}},"canvas/MakePath_8hr15":{"component":"canvas/MakePath","metadata":{"label":"canvas/MakePath","x":1224,"y":288,"width":72,"height":72}},"canvas/Stroke_xnlrz":{"component":"canvas/Stroke","metadata":{"label":"canvas/Stroke","x":1368,"y":288,"width":72,"height":72}},"MakePoint":{"component":"core/MakeFunction","metadata":{"label":"MakePoint","x":900,"y":180,"width":72,"height":72}},"mirobot/Array_5i69q":{"component":"mirobot/Array","metadata":{"label":"mirobot/Array","x":1080,"y":288,"width":72,"height":72}},"mirobot/ProcessCommands_bv8yi":{"component":"mirobot/ProcessCommands","metadata":{"label":"mirobot/ProcessCommands","x":1080,"y":468,"width":72,"height":72}},"mirobot/SendCommand_15fsp":{"component":"mirobot/SendCommand","metadata":{"label":"mirobot/SendCommand","x":1296,"y":504,"width":72,"height":72}},"core/Drop_8r4gr":{"component":"core/Drop","metadata":{"label":"core/Drop","x":1476,"y":648,"width":72,"height":72}},"mirobot/Array_8iyre":{"component":"mirobot/Array","metadata":{"label":"mirobot/Array","x":792,"y":468,"width":72,"height":72}},"mirobot/PointsToPolar_1ss44":{"component":"mirobot/PointsToPolar","metadata":{"label":"mirobot/PointsToPolar","x":936,"y":468,"width":72,"height":72}},"NextPls":{"component":"core/Kick","metadata":{"label":"NextPls","x":972,"y":576,"width":72,"height":72}},"SendCmds":{"component":"core/Kick","metadata":{"label":"SendCmds","x":648,"y":432,"width":72,"height":72}},"mirobot/GetMirobotLib_l0tku":{"component":"mirobot/GetMirobotLib","metadata":{"label":"mirobot/GetMirobotLib","x":1188,"y":792,"width":72,"height":72}},"core/Repeat_subwe":{"component":"core/Repeat","metadata":{"label":"core/Repeat","x":972,"y":828,"width":72,"height":72}},"ConnectPls":{"component":"core/Kick","metadata":{"label":"ConnectPls","x":972,"y":684,"width":72,"height":72}},"dom/GetElement_paqie":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":504,"y":576,"width":72,"height":72}},"interaction/ListenMouse_2uodb":{"component":"interaction/ListenMouse","metadata":{"label":"interaction/ListenMouse","x":648,"y":612,"width":72,"height":72}},"core/Output_uktbq":{"component":"core/Output","metadata":{"label":"core/Output","x":648,"y":936,"width":72,"height":72}},"dom/GetElement_r2dgi":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":468,"y":720,"width":72,"height":72}},"interaction/ListenMouse_g1lon":{"component":"interaction/ListenMouse","metadata":{"label":"interaction/ListenMouse","x":684,"y":756,"width":72,"height":72}},"dom/GetElement_3hc7s":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":1512,"y":396,"width":72,"height":72}},"dom/WriteHtml_b5khn":{"component":"dom/WriteHtml","metadata":{"label":"dom/WriteHtml","x":1620,"y":504,"width":72,"height":72}},"core/Repeat_3638i":{"component":"core/Repeat","metadata":{"label":"core/Repeat","x":648,"y":252,"width":72,"height":72}},"dom/GetElement_hr1tv":{"component":"dom/GetElement","metadata":{"label":"dom/GetElement","x":288,"y":252,"width":72,"height":72}},"interaction/ListenMouse_dyurx":{"component":"interaction/ListenMouse","metadata":{"label":"interaction/ListenMouse","x":468,"y":252,"width":72,"height":72}}},"connections":[{"src":{"process":"dom/GetElement_zz4rq","port":"element"},"tgt":{"process":"canvas/Draw_wicpv","port":"canvas"}},{"src":{"process":"dom/Listen_nha6s","port":"event"},"tgt":{"process":"interaction/ReadCoordinates_2ocub","port":"event"}},{"src":{"process":"interaction/ReadCoordinates_2ocub","port":"client"},"tgt":{"process":"canvas/MakeCircle_2fgfk","port":"center"}},{"src":{"process":"dom/GetElement_zz4rq","port":"element"},"tgt":{"process":"dom/Listen_nha6s","port":"element"},"metadata":{"route":0}},{"src":{"process":"canvas/MakeCircle_2fgfk","port":"circle"},"tgt":{"process":"canvas/Fill_52nqr","port":"items"}},{"src":{"process":"canvas/Fill_52nqr","port":"fill"},"tgt":{"process":"canvas/Draw_wicpv","port":"commands"}},{"src":{"process":"canvas/MakePath_8hr15","port":"path"},"tgt":{"process":"canvas/Stroke_xnlrz","port":"items"}},{"src":{"process":"canvas/Stroke_xnlrz","port":"stroke"},"tgt":{"process":"canvas/Draw_wicpv","port":"commands"}},{"src":{"process":"interaction/ReadCoordinates_2ocub","port":"client"},"tgt":{"process":"MakePoint","port":"in"},"metadata":{"route":0}},{"src":{"process":"mirobot/Array_5i69q","port":"array"},"tgt":{"process":"canvas/MakePath_8hr15","port":"items"},"metadata":{"route":null}},{"src":{"process":"MakePoint","port":"out"},"tgt":{"process":"mirobot/Array_5i69q","port":"points"},"metadata":{"route":0}},{"src":{"process":"MakePoint","port":"out"},"tgt":{"process":"mirobot/Array_5i69q","port":"send"},"metadata":{"route":0}},{"src":{"process":"mirobot/SendCommand_15fsp","port":"completed"},"tgt":{"process":"mirobot/ProcessCommands_bv8yi","port":"next"}},{"src":{"process":"interaction/ReadCoordinates_2ocub","port":"client"},"tgt":{"process":"mirobot/Array_8iyre","port":"points"},"metadata":{"route":0}},{"src":{"process":"mirobot/Array_8iyre","port":"array"},"tgt":{"process":"mirobot/PointsToPolar_1ss44","port":"points"},"metadata":{"route":null}},{"src":{"process":"mirobot/PointsToPolar_1ss44","port":"polar"},"tgt":{"process":"mirobot/ProcessCommands_bv8yi","port":"commands"}},{"src":{"process":"NextPls","port":"out"},"tgt":{"process":"mirobot/ProcessCommands_bv8yi","port":"next"}},{"src":{"process":"SendCmds","port":"out"},"tgt":{"process":"mirobot/Array_8iyre","port":"send"}},{"src":{"process":"core/Repeat_subwe","port":"out"},"tgt":{"process":"mirobot/GetMirobotLib_l0tku","port":"bang"},"metadata":{}},{"src":{"process":"mirobot/GetMirobotLib_l0tku","port":"lib"},"tgt":{"process":"mirobot/SendCommand_15fsp","port":"lib"},"metadata":{}},{"src":{"process":"mirobot/ProcessCommands_bv8yi","port":"command"},"tgt":{"process":"mirobot/SendCommand_15fsp","port":"command"},"metadata":{}},{"src":{"process":"ConnectPls","port":"out"},"tgt":{"process":"mirobot/SendCommand_15fsp","port":"url"},"metadata":{}},{"src":{"process":"mirobot/ProcessCommands_bv8yi","port":"path"},"tgt":{"process":"core/Drop_8r4gr","port":"in"},"metadata":{}},{"src":{"process":"dom/GetElement_paqie","port":"element"},"tgt":{"process":"interaction/ListenMouse_2uodb","port":"element"},"metadata":{}},{"src":{"process":"dom/GetElement_paqie","port":"error"},"tgt":{"process":"core/Output_uktbq","port":"in"},"metadata":{"route":1}},{"src":{"process":"interaction/ListenMouse_2uodb","port":"click"},"tgt":{"process":"ConnectPls","port":"in"},"metadata":{}},{"src":{"process":"dom/GetElement_r2dgi","port":"element"},"tgt":{"process":"interaction/ListenMouse_g1lon","port":"element"},"metadata":{}},{"src":{"process":"dom/GetElement_r2dgi","port":"error"},"tgt":{"process":"core/Output_uktbq","port":"in"},"metadata":{"route":1}},{"src":{"process":"interaction/ListenMouse_g1lon","port":"click"},"tgt":{"process":"SendCmds","port":"in"},"metadata":{}},{"src":{"process":"interaction/ListenMouse_g1lon","port":"click"},"tgt":{"process":"NextPls","port":"in"},"metadata":{"route":0}},{"src":{"process":"dom/GetElement_3hc7s","port":"element"},"tgt":{"process":"dom/WriteHtml_b5khn","port":"container"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_15fsp","port":"connected"},"tgt":{"process":"dom/WriteHtml_b5khn","port":"html"},"metadata":{}},{"src":{"process":"mirobot/SendCommand_15fsp","port":"disconnected"},"tgt":{"process":"dom/WriteHtml_b5khn","port":"html"},"metadata":{}},{"src":{"process":"core/Repeat_3638i","port":"out"},"tgt":{"process":"mirobot/Array_8iyre","port":"clean"},"metadata":{}},{"src":{"process":"core/Repeat_3638i","port":"out"},"tgt":{"process":"mirobot/Array_5i69q","port":"clean"},"metadata":{"route":0}},{"src":{"process":"dom/GetElement_hr1tv","port":"element"},"tgt":{"process":"interaction/ListenMouse_dyurx","port":"element"},"metadata":{}},{"src":{"process":"interaction/ListenMouse_dyurx","port":"click"},"tgt":{"process":"core/Repeat_3638i","port":"in"},"metadata":{}},{"data":"#c","tgt":{"process":"dom/GetElement_zz4rq","port":"selector"}},{"data":true,"tgt":{"process":"canvas/Draw_wicpv","port":"drawevery"}},{"data":2,"tgt":{"process":"canvas/MakeCircle_2fgfk","port":"radius"}},{"data":"click","tgt":{"process":"dom/Listen_nha6s","port":"type"}},{"data":"#00ff00","tgt":{"process":"canvas/Fill_52nqr","port":"fillstyle"}},{"data":"#fff","tgt":{"process":"canvas/Stroke_xnlrz","port":"strokestyle"}},{"data":1,"tgt":{"process":"canvas/Stroke_xnlrz","port":"linewidth"}},{"data":"return {\\"type\\": \\"point\\", \\"x\\": x.x, \\"y\\": x.y};","tgt":{"process":"MakePoint","port":"function"}},{"data":"f","tgt":{"process":"SendCmds","port":"data"}},{"data":"j","tgt":{"process":"core/Repeat_subwe","port":"in"}},{"data":"ws://10.10.100.254:8899/websocket","tgt":{"process":"ConnectPls","port":"data"}},{"data":"h","tgt":{"process":"NextPls","port":"data"}},{"data":"#connectButton","tgt":{"process":"dom/GetElement_paqie","port":"selector"}},{"data":"#sendButton","tgt":{"process":"dom/GetElement_r2dgi","port":"selector"}},{"data":"#status","tgt":{"process":"dom/GetElement_3hc7s","port":"selector"}},{"data":"#clearButton","tgt":{"process":"dom/GetElement_hr1tv","port":"selector"}},{"data":true,"tgt":{"process":"canvas/Draw_wicpv","port":"clearevery"}}]}');
});
require.register("noflo-mirobot/components/ControlMirobot.js", function(exports, require, module){
var ControlMirobot, Mirobot, noflo, sleep,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Mirobot = null;

sleep = function(ms) {
  var start, _results;
  start = new Date().getTime();
  _results = [];
  while (new Date().getTime() - start < ms) {
    continue;
  }
  return _results;
};

ControlMirobot = (function(_super) {
  __extends(ControlMirobot, _super);

  ControlMirobot.prototype.description = 'Control Mirobot.';

  ControlMirobot.prototype.icon = 'pencil';

  function ControlMirobot() {
    this.right = __bind(this.right, this);
    this.left = __bind(this.left, this);
    this.back = __bind(this.back, this);
    this.forward = __bind(this.forward, this);
    this.drawCommand = __bind(this.drawCommand, this);
    this.Mirobot = null;
    this.url = null;
    this.mirobot = null;
    this.commands = [];
    this.points = [];
    this.inPorts = {
      url: new noflo.Port('string'),
      start: new noflo.Port('bang'),
      stop: new noflo.Port('bang'),
      commands: new noflo.ArrayPort('object'),
      points: new noflo.Port('object'),
      lib: new noflo.Port('object')
    };
    this.outPorts = {
      path: new noflo.Port('object')
    };
    this.inPorts.lib.on('data', (function(_this) {
      return function(Mirobot) {
        _this.Mirobot = Mirobot;
      };
    })(this));
    this.inPorts.url.on('data', (function(_this) {
      return function(data) {
        _this.commands = [];
        _this.url = data;
        if (_this.mirobot == null) {
          console.log('Connecting on', _this.url);
          return _this.mirobot = new _this.Mirobot(_this.url);
        }
      };
    })(this));
    this.inPorts.start.on('data', (function(_this) {
      return function(data) {
        if (_this.mirobot != null) {
          return _this.parseThing(_this.commands, 0);
        }
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function(data) {
        _this.commands = [];
        if (_this.mirobot != null) {
          return _this.mirobot.stop();
        }
      };
    })(this));
    this.inPorts.commands.on('data', (function(_this) {
      return function(cmd, i) {
        return _this.commands[i] = cmd;
      };
    })(this));
    this.inPorts.points.on('data', (function(_this) {
      return function(data) {
        return _this.points = data.items;
      };
    })(this));
  }

  ControlMirobot.prototype.parseThing = function(thing, currentPoint) {
    var i, item, _i, _len, _results;
    if ((thing != null) && (thing.cmd != null) && (this[thing.cmd] != null)) {
      return this[thing.cmd](thing, currentPoint);
    } else if (thing instanceof Array) {
      _results = [];
      for (i = _i = 0, _len = thing.length; _i < _len; i = ++_i) {
        item = thing[i];
        if (item == null) {
          continue;
        }
        _results.push(this.parseThing(item, i));
      }
      return _results;
    }
  };

  ControlMirobot.prototype.drawCommand = function(position) {
    var path;
    if (!this.inPorts.points.isAttached()) {
      return;
    }
    if (!this.outPorts.path.isAttached()) {
      return;
    }
    if (position < this.points.length - 1) {
      path = [];
      path.push(this.points[position]);
      path.push(this.points[position + 1]);
      return this.outPorts.path.send(path);
    }
  };

  ControlMirobot.prototype.forward = function(distance, currentPoint) {
    this.setIcon('arrow-up');
    return this.mirobot.move('forward', distance.arg, (function(_this) {
      return function(state, msg, recursion) {};
    })(this));
  };

  ControlMirobot.prototype.back = function(distance, currentPoint) {
    this.setIcon('arrow-down');
    return this.mirobot.move('back', distance.arg, (function(_this) {
      return function(state, msg, recursion) {};
    })(this));
  };

  ControlMirobot.prototype.left = function(angle, currentPoint) {
    this.setIcon('mail-reply');
    return this.mirobot.turn('left', angle.arg, (function(_this) {
      return function(state, msg, recursion) {};
    })(this));
  };

  ControlMirobot.prototype.right = function(angle, currentPoint) {
    this.setIcon('mail-forward');
    return this.mirobot.turn('right', angle.arg, (function(_this) {
      return function(state, msg, recursion) {};
    })(this));
  };

  ControlMirobot.prototype.pause = function() {
    return this.mirobot.pause();
  };

  ControlMirobot.prototype.resume = function() {
    return this.mirobot.resume();
  };

  ControlMirobot.prototype.ping = function() {
    return this.mirobot.ping();
  };

  ControlMirobot.prototype.penup = function() {
    return this.mirobot.penup();
  };

  ControlMirobot.prototype.pendown = function() {
    return this.mirobot.pendown();
  };

  return ControlMirobot;

})(noflo.Component);

exports.getComponent = function() {
  return new ControlMirobot;
};

});
require.register("noflo-mirobot/components/ControlVerticalMirobot.js", function(exports, require, module){
var ControlVerticalMirobot, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ControlVerticalMirobot = (function(_super) {
  var description, icon;

  __extends(ControlVerticalMirobot, _super);

  icon = 'cog';

  description = 'Send commands to Vertical Mirobot through WebSockets.';

  function ControlVerticalMirobot() {
    this.setup = __bind(this.setup, this);
    this.sendNext = __bind(this.sendNext, this);
    this.send = __bind(this.send, this);
    this.point = __bind(this.point, this);
    this.path = __bind(this.path, this);
    this.pathItem = __bind(this.pathItem, this);
    this.stroke = __bind(this.stroke, this);
    this.parseThing = __bind(this.parseThing, this);
    this.parse = __bind(this.parse, this);
    this.socket = null;
    this.commandsCounter = 0;
    this.toRobot = [];
    this.commands = [];
    this.inPorts = {
      url: new noflo.Port('string'),
      send: new noflo.Port('bang'),
      commands: new noflo.ArrayPort('object'),
      rawcommand: new noflo.Port('string'),
      gohome: new noflo.Port('bang'),
      sethome: new noflo.Port('bang'),
      penup: new noflo.Port('bang'),
      pendown: new noflo.Port('bang')
    };
    this.inPorts.url.on('data', (function(_this) {
      return function(data) {
        var socket;
        socket = new WebSocket(data);
        console.log('socket created', socket);
        socket.onopen = function() {
          _this.socket = socket;
          console.log('socket opened', socket);
          _this.setup();
          return console.log('bot setup done');
        };
        return socket.addEventListener('message', function(m) {
          console.log('received from arduino', m, ' sending next command');
          return _this.sendNext();
        });
      };
    })(this));
    this.inPorts.send.on('data', (function(_this) {
      return function() {
        _this.parse(_this.commands);
        return _this.sendNext();
      };
    })(this));
    this.inPorts.commands.on('data', (function(_this) {
      return function(commands, i) {
        return _this.commands[i] = commands;
      };
    })(this));
    this.inPorts.rawcommand.on('data', (function(_this) {
      return function(commands) {
        return _this.send(commands);
      };
    })(this));
    this.inPorts.gohome.on('data', (function(_this) {
      return function() {
        var feed_rate;
        feed_rate = 2000;
        _this.send('G00 F' + feed_rate + ' X0 Y0;');
        return _this.send('M114;');
      };
    })(this));
    this.inPorts.sethome.on('data', (function(_this) {
      return function() {
        if (_this.socket == null) {
          return;
        }
        return _this.send('TELEPORT X0 Y0 Z0;');
      };
    })(this));
    this.inPorts.penup.on('data', (function(_this) {
      return function() {
        if (_this.socket == null) {
          return;
        }
        return _this.send('G00 Z90;');
      };
    })(this));
    this.inPorts.pendown.on('data', (function(_this) {
      return function() {
        if (_this.socket == null) {
          return;
        }
        return _this.send('G00 Z0;');
      };
    })(this));
  }

  ControlVerticalMirobot.prototype.parse = function(commands) {
    console.log('parse', commands);
    return this.parseThing(commands);
  };

  ControlVerticalMirobot.prototype.parseThing = function(thing, before, after) {
    var item, _i, _len, _results;
    if ((thing != null) && (thing.type != null) && (this[thing.type] != null)) {
      if (before != null) {
        before();
      }
      this[thing.type](thing);
      if (after != null) {
        return after();
      }
    } else if (thing instanceof Array) {
      _results = [];
      for (_i = 0, _len = thing.length; _i < _len; _i++) {
        item = thing[_i];
        if (item == null) {
          continue;
        }
        _results.push(this.parseThing(item, before, after));
      }
      return _results;
    }
  };

  ControlVerticalMirobot.prototype.stroke = function(stroke) {
    var after, before;
    before = function() {};
    after = function() {};
    return this.parseThing(stroke.items, before.bind(this), after.bind(this));
  };

  ControlVerticalMirobot.prototype.pathItem = function(thing, i) {
    var child, j, _i, _len;
    if (thing instanceof Array) {
      for (j = _i = 0, _len = thing.length; _i < _len; j = ++_i) {
        child = thing[j];
        this.pathItem(child, j);
      }
      return;
    }
    if (thing.type != null) {
      switch (thing.type) {
        case 'point':
          if (i === 0) {
            return this.point(thing);
          } else {
            return this.point(thing);
          }
          break;
        case 'beziercurve':
          return this.bezierCurve(thing);
        case 'arc':
          return this.arc(thing);
      }
    }
  };

  ControlVerticalMirobot.prototype.path = function(path) {
    var i, thing, _i, _len, _ref, _results;
    _ref = path.items;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      thing = _ref[i];
      if (thing == null) {
        continue;
      }
      _results.push(this.pathItem(thing, i));
    }
    return _results;
  };

  ControlVerticalMirobot.prototype.point = function(thing) {
    return this.toRobot.push([thing.x, thing.y]);
  };

  ControlVerticalMirobot.prototype.forward = function(distance) {
    return 'FD ' + distance;
  };

  ControlVerticalMirobot.prototype.right = function(angle) {
    return 'RT ' + angle;
  };

  ControlVerticalMirobot.prototype.send = function(command) {
    if (this.socket == null) {
      return;
    }
    this.socket.send(command);
    return console.log('socket sent', command);
  };

  ControlVerticalMirobot.prototype.sendNext = function() {
    var c, x, y;
    if (!(this.commandsCounter < this.toRobot.length)) {
      return;
    }
    c = this.toRobot[this.commandsCounter];
    x = c[0] / 5.0;
    y = c[1] / 5.0;
    console.log('send next', x, y);
    this.send('G01 X' + x + ' Y' + y + ';');
    return this.commandsCounter += 1;
  };

  ControlVerticalMirobot.prototype.setup = function() {
    this.send('CONFIG T30.0 B-30.0 L-25.0 R25.0 I1 J-1;');
    return this.send('D01 L1.02 R1.02;');
  };

  return ControlVerticalMirobot;

})(noflo.Component);

exports.getComponent = function() {
  return new ControlVerticalMirobot;
};

});
require.register("noflo-mirobot/components/Forward.js", function(exports, require, module){
var Forward, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Forward = (function(_super) {
  __extends(Forward, _super);

  Forward.prototype.description = 'Send a forward direction command.';

  Forward.prototype.icon = 'forward';

  function Forward() {
    this.command = {
      cmd: 'forward',
      arg: 100
    };
    this.inPorts = {
      distance: new noflo.Port('number')
    };
    this.outPorts = {
      command: new noflo.Port('string')
    };
    this.inPorts.distance.on('data', (function(_this) {
      return function(data) {
        if (!_this.outPorts.command.isAttached()) {
          return;
        }
        _this.command.arg = data;
        return _this.outPorts.command.send(_this.command);
      };
    })(this));
  }

  return Forward;

})(noflo.Component);

exports.getComponent = function() {
  return new Forward;
};

});
require.register("noflo-mirobot/components/Repeat.js", function(exports, require, module){
var Repeat, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Repeat = (function(_super) {
  __extends(Repeat, _super);

  Repeat.prototype.description = 'Repeat commands.';

  Repeat.prototype.icon = 'cog';

  function Repeat() {
    this.commands = [];
    this.times = null;
    this.inPorts = {
      times: new noflo.Port('number'),
      commands: new noflo.ArrayPort('string')
    };
    this.outPorts = {
      command: new noflo.Port('array')
    };
    this.inPorts.times.on('data', (function(_this) {
      return function(data) {
        _this.times = data;
        return _this.repeat();
      };
    })(this));
    this.inPorts.commands.on('data', (function(_this) {
      return function(data, i) {
        _this.commands[i] = data;
        return _this.repeat();
      };
    })(this));
  }

  Repeat.prototype.repeat = function() {
    var i, out;
    if (!this.outPorts.command.isAttached()) {
      return;
    }
    if (this.commands.length == null) {
      return;
    }
    if (this.times == null) {
      return;
    }
    out = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.times; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.commands);
      }
      return _results;
    }).call(this);
    return this.outPorts.command.send(out);
  };

  return Repeat;

})(noflo.Component);

exports.getComponent = function() {
  return new Repeat;
};

});
require.register("noflo-mirobot/components/Back.js", function(exports, require, module){
var Back, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Back = (function(_super) {
  __extends(Back, _super);

  Back.prototype.description = 'Send a back direction command.';

  Back.prototype.icon = 'backward';

  function Back() {
    this.command = {
      cmd: 'back',
      arg: null
    };
    this.inPorts = {
      distance: new noflo.Port('number')
    };
    this.outPorts = {
      command: new noflo.Port('string')
    };
    this.inPorts.distance.on('data', (function(_this) {
      return function(data) {
        if (!_this.outPorts.command.isAttached()) {
          return;
        }
        _this.command.arg = data;
        return _this.outPorts.command.send(_this.command);
      };
    })(this));
  }

  return Back;

})(noflo.Component);

exports.getComponent = function() {
  return new Back;
};

});
require.register("noflo-mirobot/components/Left.js", function(exports, require, module){
var Left, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Left = (function(_super) {
  __extends(Left, _super);

  Left.prototype.description = 'Send a left direction command.';

  Left.prototype.icon = 'rotate-left';

  function Left() {
    this.command = {
      cmd: 'left',
      arg: null
    };
    this.inPorts = {
      angle: new noflo.Port('number')
    };
    this.outPorts = {
      command: new noflo.Port('string')
    };
    this.inPorts.angle.on('data', (function(_this) {
      return function(data) {
        if (!_this.outPorts.command.isAttached()) {
          return;
        }
        _this.command.arg = data;
        return _this.outPorts.command.send(_this.command);
      };
    })(this));
  }

  return Left;

})(noflo.Component);

exports.getComponent = function() {
  return new Left;
};

});
require.register("noflo-mirobot/components/Pause.js", function(exports, require, module){
var Pause, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Pause = (function(_super) {
  __extends(Pause, _super);

  Pause.prototype.description = 'Send a pause command.';

  Pause.prototype.icon = 'pause';

  function Pause() {
    this.command = {
      cmd: 'pause'
    };
    this.inPorts = {
      pause: new noflo.Port('bang')
    };
    this.outPorts = {
      command: new noflo.Port('string')
    };
    this.inPorts.pause.on('data', (function(_this) {
      return function(data) {
        if (!_this.outPorts.command.isAttached()) {
          return;
        }
        return _this.outPorts.command.send(_this.command);
      };
    })(this));
  }

  return Pause;

})(noflo.Component);

exports.getComponent = function() {
  return new Pause;
};

});
require.register("noflo-mirobot/components/Pendown.js", function(exports, require, module){
var Pendown, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Pendown = (function(_super) {
  __extends(Pendown, _super);

  Pendown.prototype.description = 'Send a pendown command.';

  Pendown.prototype.icon = 'level-down';

  function Pendown() {
    this.command = {
      cmd: 'pendown'
    };
    this.inPorts = {
      pendown: new noflo.Port('bang')
    };
    this.outPorts = {
      command: new noflo.Port('string')
    };
    this.inPorts.pendown.on('data', (function(_this) {
      return function(data) {
        if (!_this.outPorts.command.isAttached()) {
          return;
        }
        return _this.outPorts.command.send(_this.command);
      };
    })(this));
  }

  return Pendown;

})(noflo.Component);

exports.getComponent = function() {
  return new Pendown;
};

});
require.register("noflo-mirobot/components/Penup.js", function(exports, require, module){
var Penup, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Penup = (function(_super) {
  __extends(Penup, _super);

  Penup.prototype.description = 'Send a penup command.';

  Penup.prototype.icon = 'level-up';

  function Penup() {
    this.command = {
      cmd: 'penup'
    };
    this.inPorts = {
      penup: new noflo.Port('bang')
    };
    this.outPorts = {
      command: new noflo.Port('string')
    };
    this.inPorts.penup.on('data', (function(_this) {
      return function(data) {
        if (!_this.outPorts.command.isAttached()) {
          return;
        }
        return _this.outPorts.command.send(_this.command);
      };
    })(this));
  }

  return Penup;

})(noflo.Component);

exports.getComponent = function() {
  return new Penup;
};

});
require.register("noflo-mirobot/components/PixelsToPoints.js", function(exports, require, module){
var PixelsToPoints, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

PixelsToPoints = (function(_super) {
  var description, icon;

  __extends(PixelsToPoints, _super);

  icon = 'file-image-o';

  description = 'Converts pixels to cartesian points collecting points for pixels equals to a given level.';

  function PixelsToPoints() {
    this.shuffleFY = __bind(this.shuffleFY, this);
    this.image = null;
    this.size = 10;
    this.level = 0;
    this.shuffle = false;
    this.inPorts = {
      image: new noflo.Port('object'),
      size: new noflo.Port('number'),
      level: new noflo.Port('number'),
      shuffle: new noflo.Port('boolean')
    };
    this.outPorts = {
      points: new noflo.Port('object')
    };
    this.inPorts.size.on('data', (function(_this) {
      return function(data) {
        return _this.size = data;
      };
    })(this));
    this.inPorts.level.on('data', (function(_this) {
      return function(data) {
        return _this.level = data;
      };
    })(this));
    this.inPorts.shuffle.on('data', (function(_this) {
      return function(data) {
        return _this.shuffle = data;
      };
    })(this));
    this.inPorts.image.on('data', (function(_this) {
      return function(data) {
        var canvas, ctx, height, i, image, imageData, points, width, x, y, _i, _ref;
        if (!_this.outPorts.points.isAttached()) {
          return;
        }
        _this.image = data;
        canvas = document.createElement('canvas');
        width = canvas.width = _this.image.width;
        height = canvas.height = _this.image.height;
        image = _this.image;
        ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        imageData = ctx.getImageData(0, 0, width, height);
        data = imageData.data;
        points = [];
        console.log('points', points);
        for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 4) {
          if (data[i] === _this.level) {
            x = i / 4 % width;
            y = Math.floor(i / 4 / width);
            points.push({
              'type': 'point',
              'x': x,
              'y': y
            });
          }
        }
        if (_this.shuffle) {
          return _this.outPorts.points.send(_this.shuffleFY(points).slice(0, _this.size));
        } else {
          return _this.outPorts.points.send(points.slice(0, _this.size));
        }
      };
    })(this));
  }

  PixelsToPoints.prototype.shuffleFY = function(a) {
    var i, r, t, _i, _ref;
    for (i = _i = 0, _ref = a.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      r = this.randomInt(i, a.length);
      t = a[r];
      a[r] = a[i];
      a[i] = t;
    }
    return a;
  };

  PixelsToPoints.prototype.randomInt = function(min, max) {
    return Math.floor((Math.random() * (max - min)) + min);
  };

  return PixelsToPoints;

})(noflo.Component);

exports.getComponent = function() {
  return new PixelsToPoints;
};

});
require.register("noflo-mirobot/components/Right.js", function(exports, require, module){
var Right, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Right = (function(_super) {
  __extends(Right, _super);

  Right.prototype.description = 'Send a right direction command.';

  Right.prototype.icon = 'rotate-right';

  function Right() {
    this.command = {
      cmd: 'right',
      arg: null
    };
    this.inPorts = {
      right: new noflo.Port('number')
    };
    this.outPorts = {
      command: new noflo.Port('string')
    };
    this.inPorts.right.on('data', (function(_this) {
      return function(data) {
        if (!_this.outPorts.command.isAttached()) {
          return;
        }
        _this.command.arg = data;
        return _this.outPorts.command.send(_this.command);
      };
    })(this));
  }

  return Right;

})(noflo.Component);

exports.getComponent = function() {
  return new Right;
};

});
require.register("noflo-mirobot/components/PointsToPolar.js", function(exports, require, module){
var PointsToPolar, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

PointsToPolar = (function(_super) {
  __extends(PointsToPolar, _super);

  PointsToPolar.prototype.description = 'Converts cartesian coordinates to polar coordinates.';

  PointsToPolar.prototype.icon = 'paint-brush';

  function PointsToPolar() {
    this.pathFinding = __bind(this.pathFinding, this);
    this.parsePoints = __bind(this.parsePoints, this);
    this.mirobotAngle = 0;
    this.commands = [];
    this.inPorts = {
      points: new noflo.Port('object')
    };
    this.outPorts = {
      polar: new noflo.Port('object')
    };
    this.inPorts.points.on('data', (function(_this) {
      return function(data) {
        var points;
        if (!_this.outPorts.polar.isAttached()) {
          return;
        }
        _this.mirobotAngle = 0;
        if (data.items != null) {
          points = data.items;
        } else {
          points = data;
        }
        _this.parsePoints(points);
        return _this.outPorts.polar.send(_this.commands);
      };
    })(this));
  }

  PointsToPolar.prototype.parsePoints = function(start, end) {
    var i, item, _i, _len, _results;
    if ((start != null) && (end != null) && (start.x != null) && (end.x != null)) {
      return this.pathFinding(start, end);
    } else if (start instanceof Array) {
      _results = [];
      for (i = _i = 0, _len = start.length; _i < _len; i = ++_i) {
        item = start[i];
        if (item == null) {
          continue;
        }
        if (start[i + 1] != null) {
          _results.push(this.parsePoints(item, start[i + 1]));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  PointsToPolar.prototype.pathFinding = function(from, to) {
    var angle, arctangent, commandDirection, commandForward, distance, dx, dy;
    dx = to.x - from.x;
    dy = to.y - from.y;
    distance = Math.sqrt(dx * dx + dy * dy);
    arctangent = Math.atan2(dx, dy);
    angle = Math.degrees(arctangent);
    this.walkingAngle = angle - this.mirobotAngle;
    if (this.walkingAngle < 0) {
      this.walkingAngle = this.walkingAngle + 360;
    }
    this.mirobotAngle = angle;
    if (this.mirobotAngle >= 360) {
      this.mirobotAngle = this.mirobotAngle - 360;
    }
    commandDirection = {
      cmd: null,
      arg: null
    };
    if (this.walkingAngle <= 180) {
      commandDirection.cmd = 'right';
      commandDirection.arg = this.walkingAngle.toString();
    } else {
      commandDirection.cmd = 'left';
      commandDirection.arg = (360 - this.walkingAngle).toString();
    }
    commandForward = {
      cmd: 'forward',
      arg: distance.toString()
    };
    this.commands.push(commandDirection);
    return this.commands.push(commandForward);
  };

  return PointsToPolar;

})(noflo.Component);

exports.getComponent = function() {
  return new PointsToPolar;
};

});
require.register("noflo-mirobot/components/Dither.js", function(exports, require, module){
var Dither, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Dither = (function(_super) {
  var description, icon;

  __extends(Dither, _super);

  icon = 'file-image-o';

  description = 'Dither filter.';

  function Dither() {
    this.ditterDirection = __bind(this.ditterDirection, this);
    this.quantizeColor = __bind(this.quantizeColor, this);
    this.image = null;
    this.tone = null;
    this.inPorts = {
      image: new noflo.Port('object')
    };
    this.outPorts = {
      canvas: new noflo.Port('object')
    };
    this.inPorts.image.on('data', (function(_this) {
      return function(data) {
        var b, canvas, ctx, currentPixel, direction, error, g, h, height, i, image, imageData, img, nexterror, r, tmp, tone, w, width, x, y, _i, _j, _ref, _ref1;
        if (!_this.outPorts.canvas.isAttached()) {
          return;
        }
        _this.image = data;
        canvas = document.createElement('canvas');
        width = canvas.width = _this.image.width;
        height = canvas.height = _this.image.height;
        image = _this.image;
        ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        imageData = ctx.getImageData(0, 0, width, height);
        data = imageData.data;
        h = height;
        w = width;
        img = image;
        direction = 1;
        error = (function() {
          var _i, _results;
          _results = [];
          for (i = _i = 0; 0 <= w ? _i < w : _i > w; i = 0 <= w ? ++_i : --_i) {
            _results.push(0);
          }
          return _results;
        })();
        nexterror = (function() {
          var _i, _results;
          _results = [];
          for (i = _i = 0; 0 <= w ? _i < w : _i > w; i = 0 <= w ? ++_i : --_i) {
            _results.push(0);
          }
          return _results;
        })();
        for (currentPixel = _i = 0, _ref = data.length; _i < _ref; currentPixel = _i += 4) {
          x = currentPixel / 4 % w;
          y = Math.floor(currentPixel / 4 / w);
          r = data[currentPixel];
          g = data[currentPixel + 1];
          b = data[currentPixel + 2];
          tone = (r + g + b) / 3;
        }
        tone /= w * h;
        for (y = _j = 0; 0 <= h ? _j < h : _j > h; y = 0 <= h ? ++_j : --_j) {
          _this.ditherDirection(img, y, error, nexterror, direction);
          direction = (_ref1 = direction > 0) != null ? _ref1 : -{
            1: 1
          };
          tmp = error;
          error = nexterror;
          nexterror = tmp;
        }
        return _this.outPorts.canvas.send(img);
      };
    })(this));
  }

  Dither.prototype.quantizeColor = function(original) {
    var i, _ref;
    i = Math.min(Math.max(original, 0), 255);
    return (_ref = i > this.tone) != null ? _ref : {
      255: 0
    };
  };

  Dither.prototype.decode = function(pixel) {
    var b, g, r;
    r = (pixel >> 16) & 0xff;
    g = (pixel >> 8) & 0xff;
    b = pixel & 0xff;
    return (r + g + b) / 3;
  };

  Dither.prototype.encode = function(i) {
    return (0xff << 24) | (i << 16) | (i << 8) | i;
  };

  Dither.prototype.ditterDirection = function(img, y, error, nexterror, direction) {
    var b, end, g, newPixel, oldPixel, quant_error, r, start, w, x, _i, _j, _results;
    w = img.width;
    for (x = _i = 0; 0 <= w ? _i < w : _i > w; x = 0 <= w ? ++_i : --_i) {
      nexterror[x] = 0;
    }
    if (direction > 0) {
      start = 0;
      end = w;
    } else {
      start = w - 1;
      end = -1;
    }
    _results = [];
    for (x = _j = start; direction > 0 ? _j < end : _j > end; x = _j += direction) {
      r = 255;
      g = 255;
      b = 255;
      oldPixel = ((r + g + b) / 3) + error[x];
      newPixel = this.quantizeColor(oldPixel);
      quant_error = oldPixel - newPixel;
      nexterror[x] += 5.0 / 16.0 * quant_error;
      if (x + direction >= 0 && x + direction < w) {
        error[x + direction] += 7.0 / 16.0 * quant_error;
        nexterror[x + direction] += 1.0 / 16.0 * quant_error;
      }
      if (x - direction >= 0 && x - direction < w) {
        _results.push(nexterror[x - direction] += 3.0 / 16.0 * quant_error);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  return Dither;

})(noflo.Component);

exports.getComponent = function() {
  return new Dither;
};

});
require.register("noflo-mirobot/components/FloydSteinberg.js", function(exports, require, module){
var FloydSteinberg, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

FloydSteinberg = (function(_super) {
  var description, icon;

  __extends(FloydSteinberg, _super);

  icon = 'file-image-o';

  description = 'Dithering using Floyd-Steinberg.';

  function FloydSteinberg() {
    var i, lumB, lumG, lumR, _i;
    this.image = null;
    this.tone = null;
    lumR = [];
    lumG = [];
    lumB = [];
    for (i = _i = 0; _i < 256; i = ++_i) {
      lumR[i] = i * 0.299;
      lumG[i] = i * 0.587;
      lumB[i] = i * 0.114;
    }
    this.inPorts = {
      image: new noflo.Port('object')
    };
    this.outPorts = {
      canvas: new noflo.Port('object')
    };
    this.inPorts.image.on('data', (function(_this) {
      return function(data) {
        var canvas, ctx, currentPixel, err, height, image, imageData, imageDataLength, newPixel, w, width, _j, _k;
        if (!_this.outPorts.canvas.isAttached()) {
          return;
        }
        _this.image = data;
        canvas = document.createElement('canvas');
        width = canvas.width = _this.image.width;
        height = canvas.height = _this.image.height;
        image = _this.image;
        ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        imageData = ctx.getImageData(0, 0, width, height);
        data = imageData.data;
        imageDataLength = imageData.data.length;
        for (i = _j = 0; _j < imageDataLength; i = _j += 4) {
          imageData.data[i] = Math.floor(lumR[imageData.data[i]] + lumG[imageData.data[i + 1]] + lumB[imageData.data[i + 2]]);
        }
        w = imageData.width;
        newPixel = null;
        err = null;
        for (currentPixel = _k = 0; _k < imageDataLength; currentPixel = _k += 4) {
          newPixel = imageData.data[currentPixel] < 129 ? 0 : 255;
          err = Math.floor((imageData.data[currentPixel] - newPixel) / 16);
          imageData.data[currentPixel] = newPixel;
          imageData.data[currentPixel + 4] += err * 7;
          imageData.data[currentPixel + 4 * w - 4] += err * 3;
          imageData.data[currentPixel + 4 * w] += err * 5;
          imageData.data[currentPixel + 4 * w + 4] += err * 1;
          imageData.data[currentPixel + 1] = imageData.data[currentPixel + 2] = imageData.data[currentPixel];
        }
        ctx.putImageData(imageData, 0, 0);
        return _this.outPorts.canvas.send(canvas);
      };
    })(this));
  }

  return FloydSteinberg;

})(noflo.Component);

exports.getComponent = function() {
  return new FloydSteinberg;
};

});
require.register("noflo-mirobot/components/BlackAndWhiteFilter.js", function(exports, require, module){
var BlackAndWhiteFilter, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

BlackAndWhiteFilter = (function(_super) {
  var description, icon;

  __extends(BlackAndWhiteFilter, _super);

  icon = 'file-image-o';

  description = 'Black and white filter.';

  function BlackAndWhiteFilter() {
    this.image = null;
    this.inPorts = {
      image: new noflo.Port('object')
    };
    this.outPorts = {
      canvas: new noflo.Port('object')
    };
    this.inPorts.image.on('data', (function(_this) {
      return function(data) {
        var a, b, c, canvas, ctx, g, height, i, image, imageData, imageDataLength, max_intensity, min_intensity, r, width, x, y, _i, _j;
        if (!_this.outPorts.canvas.isAttached()) {
          return;
        }
        _this.image = data;
        canvas = document.createElement('canvas');
        width = canvas.width = _this.image.width;
        height = canvas.height = _this.image.height;
        image = _this.image;
        ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        imageData = ctx.getImageData(0, 0, width, height);
        data = imageData.data;
        imageDataLength = imageData.data.length;
        max_intensity = -1000;
        min_intensity = 1000;
        for (i = _i = 0; _i < imageDataLength; i = _i += 4) {
          x = i / 4 % width;
          y = Math.floor(i / 4 / width);
          r = imageData.data[i];
          g = imageData.data[i + 1];
          b = imageData.data[i + 2];
          c = (r + g + b) / 3;
          if (max_intensity < c) {
            max_intensity = c;
          }
          if (min_intensity > c) {
            min_intensity = c;
          }
          imageData.data[i] = c;
          imageData.data[i + 1] = c;
          imageData.data[i + 2] = c;
        }
        for (i = _j = 0; _j < imageDataLength; i = _j += 4) {
          r = imageData.data[i];
          g = imageData.data[i + 1];
          b = imageData.data[i + 2];
          c = (r + g + b) / 3;
          a = (c - min_intensity) / (max_intensity - min_intensity);
          b = a * 95.0 + 200.0;
          if (b > 255) {
            b = 255;
          }
          imageData.data[i] = b;
          imageData.data[i + 1] = b;
          imageData.data[i + 2] = b;
        }
        ctx.putImageData(imageData, 0, 0);
        return _this.outPorts.canvas.send(canvas);
      };
    })(this));
  }

  return BlackAndWhiteFilter;

})(noflo.Component);

exports.getComponent = function() {
  return new BlackAndWhiteFilter;
};

});
require.register("noflo-mirobot/components/ThresholdFilter.js", function(exports, require, module){
var ThresholdFilter, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ThresholdFilter = (function(_super) {
  var description, icon;

  __extends(ThresholdFilter, _super);

  icon = 'file-image-o';

  description = 'Converts an image to black and white given a threshold value.';

  function ThresholdFilter() {
    this.image = null;
    this.threshold = 10;
    this.inPorts = {
      image: new noflo.Port('object'),
      threshold: new noflo.Port('number')
    };
    this.outPorts = {
      canvas: new noflo.Port('object')
    };
    this.inPorts.threshold.on('data', (function(_this) {
      return function(data) {
        return _this.threshold = data;
      };
    })(this));
    this.inPorts.image.on('data', (function(_this) {
      return function(data) {
        var b, canvas, ctx, g, height, i, image, imageData, imageDataLength, r, v, width, _i;
        if (!_this.outPorts.canvas.isAttached()) {
          return;
        }
        _this.image = data;
        canvas = document.createElement('canvas');
        width = canvas.width = _this.image.width;
        height = canvas.height = _this.image.height;
        image = _this.image;
        ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        imageData = ctx.getImageData(0, 0, width, height);
        data = imageData.data;
        imageDataLength = imageData.data.length;
        for (i = _i = 0; _i < imageDataLength; i = _i += 4) {
          r = imageData.data[i];
          g = imageData.data[i + 1];
          b = imageData.data[i + 2];
          v = 0.2126 * r + 0.7152 * g + 0.0722 * b >= _this.threshold ? 255 : 0;
          imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = v;
        }
        ctx.putImageData(imageData, 0, 0);
        return _this.outPorts.canvas.send(canvas);
      };
    })(this));
  }

  return ThresholdFilter;

})(noflo.Component);

exports.getComponent = function() {
  return new ThresholdFilter;
};

});
require.register("noflo-mirobot/components/TSP.js", function(exports, require, module){
var TSP, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

TSP = (function(_super) {
  __extends(TSP, _super);

  TSP.prototype.description = 'Ordenates points based on the minimum distance between them.';

  TSP.prototype.icon = 'code-fork';

  function TSP() {
    this.tspGreedy = __bind(this.tspGreedy, this);
    this.distance = __bind(this.distance, this);
    this.points = [];
    this.inPorts = {
      points: new noflo.Port('object')
    };
    this.outPorts = {
      points: new noflo.Port('object')
    };
    this.inPorts.points.on('data', (function(_this) {
      return function(data) {
        if (!_this.outPorts.points.isAttached()) {
          return;
        }
        if (data.items.length === 0) {
          return;
        }
        _this.points = data.items;
        _this.tspGreedy();
        return _this.outPorts.points.send(_this.points);
      };
    })(this));
  }

  TSP.prototype.distance = function(from, to) {
    var dx, dy;
    dx = this.points[to].x - this.points[from].x;
    dy = this.points[to].y - this.points[from].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  TSP.prototype.tspGreedy = function() {
    var bestPath, current, currentDistance, i, lastNode, near, nearest, next, step, visited, _i, _j, _ref, _ref1;
    current = 0;
    currentDistance = 0;
    lastNode = 0;
    visited = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.points.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(false);
      }
      return _results;
    }).call(this);
    bestPath = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.points.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(0);
      }
      return _results;
    }).call(this);
    for (step = _i = 0, _ref = this.points.length - 1; 0 <= _ref ? _i < _ref : _i > _ref; step = 0 <= _ref ? ++_i : --_i) {
      visited[current] = true;
      bestPath[step] = current;
      nearest = 999999;
      near = -1;
      for (next = _j = 1, _ref1 = this.points.length; 1 <= _ref1 ? _j < _ref1 : _j > _ref1; next = 1 <= _ref1 ? ++_j : --_j) {
        if (!visited[next] && ((this.distance(current, next)) < nearest)) {
          nearest = this.distance(current, next);
          near = next;
        }
      }
      currentDistance += this.distance(current, near);
      current = near;
    }
    bestPath[this.points.length - 1] = current;
    return this.points = (function() {
      var _k, _len, _results;
      _results = [];
      for (_k = 0, _len = bestPath.length; _k < _len; _k++) {
        i = bestPath[_k];
        _results.push(this.points[i]);
      }
      return _results;
    }).call(this);
  };

  return TSP;

})(noflo.Component);

exports.getComponent = function() {
  return new TSP;
};

});
require.register("noflo-mirobot/components/PreviewCommand.js", function(exports, require, module){
var PreviewCommand, TAU, noflo, _accuracy,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

TAU = 2 * Math.PI;

_accuracy = 1000000000;

PreviewCommand = (function(_super) {
  __extends(PreviewCommand, _super);

  PreviewCommand.prototype.description = 'Previews a command.';

  PreviewCommand.prototype.icon = 'pencil';

  function PreviewCommand() {
    this.right = __bind(this.right, this);
    this.left = __bind(this.left, this);
    this.forward = __bind(this.forward, this);
    this.turn = __bind(this.turn, this);
    this.canvas = null;
    this.turtle = {
      position: {
        x: 100,
        y: 100
      },
      vector: {
        x: 0,
        y: 1
      },
      angle: 90,
      pen: true
    };
    this.inPorts = {
      command: new noflo.Port('object'),
      canvas: new noflo.Port('object')
    };
    this.outPorts = {
      canvas: new noflo.Port('object')
    };
    this.inPorts.command.on('data', (function(_this) {
      return function(data) {
        if (_this.canvas == null) {
          return;
        }
        _this.ctx = _this.canvas.getContext('2d');
        _this.ctx.beginPath();
        return _this.parseThing(data);
      };
    })(this));
    this.inPorts.canvas.on('data', (function(_this) {
      return function(data) {
        return _this.canvas = data;
      };
    })(this));
  }

  PreviewCommand.prototype.shutdown = function() {};

  PreviewCommand.prototype.parseThing = function(thing) {
    var item, _i, _len, _results;
    if ((thing != null) && (thing.cmd != null) && (this[thing.cmd] != null)) {
      return this[thing.cmd](thing);
    } else if (thing instanceof Array) {
      _results = [];
      for (_i = 0, _len = thing.length; _i < _len; _i++) {
        item = thing[_i];
        if (item == null) {
          continue;
        }
        _results.push(this.parseThing(item));
      }
      return _results;
    }
  };

  PreviewCommand.prototype.turn = function() {
    console.log('turn');
    this.turtle.vector.x = Math.round(Math.cos(TAU * this.turtle.angle));
    return this.turtle.vector.y = Math.round(Math.sin(TAU * this.turtle.angle));
  };

  PreviewCommand.prototype.forward = function(distance) {
    var a, x, y;
    console.log('forward');
    distance = distance.arg;
    a = this.turtle.angle * (Math.PI / 180.0);
    x = Math.round(distance * Math.cos(a));
    y = Math.round(distance * Math.sin(a));
    console.log("x", x, "y", y, "distance", distance);
    this.turtle.position.x += x;
    this.turtle.position.y += y;
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.linewidth = 1;
    console.log('Line between', this.turtle.position.x, this.turtle.position.y);
    this.ctx.stroke();
    return this.ctx.lineTo(this.turtle.position.x, this.turtle.position.y);
  };

  PreviewCommand.prototype.back = function(distance) {
    distance = distance.arg;
    return this.turtle.angle += 180;
  };

  PreviewCommand.prototype.left = function(angle) {
    console.log('left', angle);
    if (angle.arg != null) {
      this.turtle.angle += angle.arg;
    } else {
      this.turtle.angle += angle;
    }
    this.turtle.angle = this.turtle.angle % 360;
    return this.turn();
  };

  PreviewCommand.prototype.right = function(angle) {
    console.log('right', angle);
    if (angle.arg != null) {
      this.turtle.angle -= angle.arg;
    } else {
      this.turtle.angle -= angle;
    }
    this.turtle.angle = this.turtle.angle % 360;
    return this.turn();
  };

  PreviewCommand.prototype.pause = function() {};

  PreviewCommand.prototype.resume = function() {};

  PreviewCommand.prototype.ping = function() {};

  PreviewCommand.prototype.penup = function() {
    return this.turtle.pen = false;
  };

  PreviewCommand.prototype.pendown = function() {
    return this.turtle.pen = true;
  };

  return PreviewCommand;

})(noflo.Component);

exports.getComponent = function() {
  return new PreviewCommand;
};

});
require.register("noflo-mirobot/components/ProcessCommands.js", function(exports, require, module){
var ProcessCommands, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ProcessCommands = (function(_super) {
  __extends(ProcessCommands, _super);

  ProcessCommands.prototype.description = 'Processes and stores commands to send to Mirobot.';

  ProcessCommands.prototype.icon = 'pencil';

  function ProcessCommands() {
    this.commands = [];
    this.points = [];
    this.currentCommand = 0;
    this.currentCommandArray = 0;
    this.inPorts = {
      commands: new noflo.ArrayPort('object'),
      points: new noflo.Port('object'),
      next: new noflo.Port('bang')
    };
    this.outPorts = {
      command: new noflo.Port('object'),
      path: new noflo.Port('object')
    };
    this.inPorts.commands.on('data', (function(_this) {
      return function(cmd, i) {
        return _this.commands[i] = cmd;
      };
    })(this));
    this.inPorts.points.on('data', (function(_this) {
      return function(data) {
        if (data.items != null) {
          return _this.points = data.items;
        } else {
          return _this.points = data;
        }
      };
    })(this));
    this.inPorts.next.on('data', (function(_this) {
      return function() {
        var path;
        if (!_this.outPorts.command.isAttached()) {
          return;
        }
        path = [];
        if (_this.commands[_this.currentCommand] instanceof Array) {
          _this.outPorts.command.send(_this.commands[_this.currentCommand][_this.currentCommandArray]);
          console.log('HERE', _this.currentCommandArray, _this.commands[_this.currentCommand].length);
          if (_this.currentCommandArray < _this.commands[_this.currentCommand].length) {
            path.push(_this.points[_this.currentCommandArray]);
            path.push(_this.points[_this.currentCommandArray + 1]);
            console.log(path);
            _this.outPorts.path.send(path);
            _this.currentCommandArray += 1;
          }
          if (_this.currentCommandArray > _this.commands[_this.currentCommand].length) {
            console.log('Mirobot finished array');
            _this.currentCommandArray = 0;
            _this.currentCommand += 1;
          }
        } else {
          _this.outPorts.command.send(_this.commands[_this.currentCommand]);
          _this.currentCommand += 1;
        }
        if (_this.currentCommand >= _this.commands.length) {
          console.log('Mirobot finished all commands');
          _this.commands = [];
          _this.currentCommand = 0;
          return _this.currentCommandArray = 0;
        }
      };
    })(this));
  }

  ProcessCommands.prototype.shutdown = function() {};

  return ProcessCommands;

})(noflo.Component);

exports.getComponent = function() {
  return new ProcessCommands;
};

});
require.register("noflo-mirobot/components/SendCommand.js", function(exports, require, module){
var SendCommand, noflo, sleep,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

sleep = function(ms) {
  var start, _results;
  start = new Date().getTime();
  _results = [];
  while (new Date().getTime() - start < ms) {
    continue;
  }
  return _results;
};

SendCommand = (function(_super) {
  __extends(SendCommand, _super);

  SendCommand.prototype.description = 'Sends a command to Mirobot.';

  SendCommand.prototype.icon = 'pencil';

  function SendCommand() {
    this.right = __bind(this.right, this);
    this.left = __bind(this.left, this);
    this.back = __bind(this.back, this);
    this.forward = __bind(this.forward, this);
    this.shutdown = __bind(this.shutdown, this);
    this.url = 'ws://10.10.100.254:8899/websocket';
    this.Mirobot = null;
    this.mirobot = null;
    this.inPorts = {
      lib: new noflo.Port('object'),
      url: new noflo.Port('string'),
      disconnect: new noflo.Port('bang'),
      command: new noflo.Port('object')
    };
    this.outPorts = {
      completed: new noflo.Port('string'),
      connected: new noflo.Port('string'),
      disconnected: new noflo.Port('string')
    };
    this.inPorts.lib.on('data', (function(_this) {
      return function(data) {
        return _this.Mirobot = data;
      };
    })(this));
    this.inPorts.url.on('data', (function(_this) {
      return function(data) {
        _this.url = data;
        if (_this.mirobot == null) {
          return _this.mirobot = new _this.Mirobot(_this.url, function() {
            if (!_this.outPorts.connected.isAttached()) {
              return;
            }
            return _this.outPorts.connected.send('connected');
          });
        }
      };
    })(this));
    this.inPorts.disconnect.on('data', (function(_this) {
      return function(data) {
        if (_this.mirobot != null) {
          return _this.mirobot.stop(function(state, msg, recursion) {
            _this.outPorts.disconnected.send('disconnected');
            return _this.mirobot = null;
          });
        }
      };
    })(this));
    this.inPorts.command.on('data', (function(_this) {
      return function(data) {
        if (_this.mirobot != null) {
          return _this.parseThing(data);
        }
      };
    })(this));
  }

  SendCommand.prototype.shutdown = function() {
    if (this.mirobot != null) {
      this.mirobot.stop();
      return this.mirobot = null;
    }
  };

  SendCommand.prototype.parseThing = function(thing) {
    var item, _i, _len, _results;
    console.log('Receive', thing);
    if ((thing != null) && (thing.cmd != null) && (this[thing.cmd] != null)) {
      return this[thing.cmd](thing);
    } else if (thing instanceof Array) {
      _results = [];
      for (_i = 0, _len = thing.length; _i < _len; _i++) {
        item = thing[_i];
        if (item == null) {
          continue;
        }
        _results.push(this.parseThing(item));
      }
      return _results;
    }
  };

  SendCommand.prototype.forward = function(distance, currentPoint) {
    this.setIcon('arrow-up');
    return this.mirobot.move('forward', distance.arg, (function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  SendCommand.prototype.back = function(distance, currentPoint) {
    this.setIcon('arrow-down');
    return this.mirobot.move('back', distance.arg, (function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  SendCommand.prototype.left = function(angle, currentPoint) {
    this.setIcon('mail-reply');
    return this.mirobot.turn('left', angle.arg, (function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  SendCommand.prototype.right = function(angle, currentPoint) {
    this.setIcon('mail-forward');
    return this.mirobot.turn('right', angle.arg, (function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  SendCommand.prototype.pause = function() {
    return this.mirobot.pause((function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  SendCommand.prototype.resume = function() {
    return this.mirobot.resume((function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  SendCommand.prototype.ping = function() {
    return this.mirobot.ping((function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  SendCommand.prototype.penup = function() {
    return this.mirobot.penup((function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  SendCommand.prototype.pendown = function() {
    return this.mirobot.pendown((function(_this) {
      return function(state, msg, recursion) {
        if (state === 'complete') {
          return _this.outPorts.completed.send(state);
        }
      };
    })(this));
  };

  return SendCommand;

})(noflo.Component);

exports.getComponent = function() {
  return new SendCommand;
};

});
require.register("noflo-mirobot/components/Array.js", function(exports, require, module){
var Array, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Array = (function(_super) {
  __extends(Array, _super);

  Array.prototype.description = 'Array.';

  Array.prototype.icon = 'pencil';

  function Array() {
    this.points = [];
    this.inPorts = {
      send: new noflo.Port('bang'),
      clean: new noflo.Port('bang'),
      points: new noflo.Port('object')
    };
    this.outPorts = {
      array: new noflo.Port('object')
    };
    this.inPorts.send.on('data', (function(_this) {
      return function() {
        return _this.outPorts.array.send(_this.points);
      };
    })(this));
    this.inPorts.clean.on('data', (function(_this) {
      return function() {
        _this.points = [];
        return _this.outPorts.array.send(_this.points);
      };
    })(this));
    this.inPorts.points.on('data', (function(_this) {
      return function(point) {
        return _this.points.push(point);
      };
    })(this));
  }

  return Array;

})(noflo.Component);

exports.getComponent = function() {
  return new Array;
};

});
require.register("noflo-mirobot/components/EstimateTime.js", function(exports, require, module){
var costs, noflo;

noflo = require('noflo');

costs = {
  left: function(arg) {
    return (10 * parseFloat(arg)) / 360;
  },
  right: function(arg) {
    return (10 * parseFloat(arg)) / 360;
  },
  forward: function(arg) {
    return parseFloat(arg) / 40;
  },
  back: function(arg) {
    return parseFloat(arg) / 40;
  },
  penup: function(arg) {
    return 0.25;
  },
  pendown: function(arg) {
    return 0.25;
  }
};


/*
Object {cmd: "left", arg: "6.3401917459099195", id: "chmqgad8id"}
Object {cmd: "forward", arg: "6.4031242374328485"}
Object {cmd: "right", arg: "51.34019174590991", id: "w61z4r3mi3"}
 */

exports.getComponent = function() {
  var c;
  c = new noflo.Component;
  c.inPorts.add('commands', function(event, payload) {
    var command, commands, cost, func, total, _i, _len;
    if (event !== 'data') {
      return;
    }
    commands = payload;
    total = 0.0;
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      func = costs[command.cmd];
      cost = func(command.arg);
      total += cost;
    }
    return c.outPorts.out.send(total);
  });
  c.outPorts.add('out');
  return c;
};

});
require.register("noflo-mirobot/components/GetMirobotLib.js", function(exports, require, module){
var GetMirobotLib, library, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

library = {};


(function (root, factory) {
    'use strict';
    // Browser globals
    root.Mirobot = factory(root);
}(library, function (window, undefined) {

    var Mirobot = function(url, cb){
      this.url = url;
      this.connect(cb);
      this.cbs = {};
      this.listeners = [];
      this.robot_state = 'idle';
    }

    Mirobot.prototype = {

      connected: false,

      connect: function(cb){
        if(!this.connected){
          var self = this;
          this.ws = new WebSocket(this.url);
          this.ws.onmessage = function(ws_msg){self.handle_ws(ws_msg)};
          this.ws.onopen = function(){ 
            console.log("Mirobot is connected"); 
            self.setConnectedState(true);
            if (cb) {
              cb();
            }
          }
          this.ws.onerror = function(err){self.handleError(err)}
          this.ws.onclose = function(err){self.handleError(err)}
        }
      },

      setConnectedState: function(state){
        var self = this;
        self.connected = state;
        self.broadcast(state ? 'connected' : 'disconnected');
        // Try to auto reconnect if disconnected
        if(state){
          if(self.reconnectTimer){
            clearInterval(self.reconnectTimer);
            self.reconnectTimer = undefined;
          }
        }else{
          if(!self.reconnectTimer){
            self.reconnectTimer = setInterval(function(){
              self.connect();
            }, 1000);
          }
        }
      },
      
      broadcast: function(msg){
        for(i in this.listeners){
          this.listeners[i](msg);
        }
      },

      addListener: function(listener){
        this.listeners.push(listener);
      },

      handleError: function(err){
        if(err instanceof CloseEvent){
          this.setConnectedState(false);
        }else{
          console.log(err);
        }
      },

      move: function(direction, distance, cb){
        this.send({cmd: direction, arg: distance}, cb);
        // this.send({cmd: direction, arg: distance}, function(state, msg, recursion){
        //   // console.log(state, msg, recursion);
        //   // if(state === 'started'){
        //   //   console.log('ACEITO');
        //   // }
        // });
      },

      turn: function(direction, angle, cb){
        this.send({cmd: direction, arg: angle}, cb);
        // this.send({cmd: direction, arg: angle}, function(state, msg, recursion){
        //   // console.log(state, msg, recursion);
        //   // if(state === 'started'){
        //   //   console.log('ACEITO');
        //   // }
        // });
      },

      penup: function(cb){
        this.send({cmd: 'penup'}, cb);
      },

      pendown: function(cb){
        this.send({cmd: 'pendown'}, cb);
      },

      ping: function(cb){
        this.send({cmd: 'ping'}, cb);
      },
      
      stop: function(cb){
        var self = this;
        this.send({cmd:'stop'}, function(state, msg, recursion){
          if(state === 'complete' && !recursion){
            for(var i in self.cbs){
              self.cbs[i]('complete', undefined, true);
            }
            self.robot_state = 'idle';
            self.msg_stack = [];
            self.cbs = {};
            if(cb){ cb(state); }
          }
        });
      },
      
      pause: function(cb){
        this.send({cmd:'pause'}, cb);
      },
      
      resume: function(cb){
        this.send({cmd:'resume'}, cb);
      },

      version: function(cb){
        this.send({cmd:'version'}, cb);
      },

      send: function(msg, cb){
        msg.id = Math.random().toString(36).substr(2, 10)
        if(cb){
          this.cbs[msg.id] = cb;
        }
        if(msg.arg){ 
          msg.arg = msg.arg.toString(); 
        }
        if(['stop', 'pause', 'resume', 'ping', 'version'].indexOf(msg.cmd) >= 0){
          this.ws.send(JSON.stringify(msg));
        } else{
          this.push_msg(msg);
        }
      },
      
      push_msg: function(msg){
        this.msg_stack.push(msg);
        this.run_stack();
      },
      
      run_stack: function(){
        if(this.robot_state === 'idle' && this.msg_stack.length > 0){
          this.robot_state = 'receiving';
          console.log(this.msg_stack[0]);
          this.ws.send(JSON.stringify(this.msg_stack[0]));
        }
      },
      
      handle_ws: function(ws_msg){
        msg = JSON.parse(ws_msg.data);
        console.log('Handle message:', msg);
        if(this.msg_stack.length > 0 && this.msg_stack[0].id == msg.id){
          if(msg.status === 'accepted'){
            if(this.cbs[msg.id]){
              this.cbs[msg.id]('started', msg);
            }
            this.robot_state = 'running';
            // console.log(this.robot_state);
          }else if(msg.status === 'complete'){
            if(this.cbs[msg.id]){
              this.cbs[msg.id]('complete', msg);
              delete this.cbs[msg.id];
            }
            this.msg_stack.shift();
            if(this.msg_stack.length === 0){
              this.broadcast('program_complete');
            }
            this.robot_state = 'idle';
            this.run_stack();
          }
        }else{
          if(this.cbs[msg.id]){
            this.cbs[msg.id]('complete', msg);
            delete this.cbs[msg.id];
          }
        } 
      },
      
      robot_state: 'idle',
      msg_stack: []
    }
    return Mirobot;
}));
;

GetMirobotLib = (function(_super) {
  __extends(GetMirobotLib, _super);

  GetMirobotLib.prototype.description = 'Mirobot.js library';

  GetMirobotLib.prototype.icon = 'pencil';

  function GetMirobotLib() {
    this.inPorts = {
      bang: new noflo.Port('bang')
    };
    this.outPorts = {
      lib: new noflo.Port('object')
    };
    this.inPorts.bang.on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.lib.send(library.Mirobot);
      };
    })(this));
  }

  return GetMirobotLib;

})(noflo.Component);

exports.getComponent = function() {
  return new GetMirobotLib;
};

});



require.register("noflo-noflo/component.json", function(exports, require, module){
module.exports = {
  "name": "noflo",
  "description": "Flow-Based Programming environment for JavaScript",
  "keywords": [
    "fbp",
    "workflow",
    "flow"
  ],
  "repo": "noflo/noflo",
  "version": "0.5.10",
  "dependencies": {
    "bergie/emitter": "*",
    "jashkenas/underscore": "*",
    "noflo/fbp": "*"
  },
  "remotes": [
    "https://raw.githubusercontent.com"
  ],
  "development": {},
  "license": "MIT",
  "main": "src/lib/NoFlo.js",
  "scripts": [
    "src/lib/Graph.js",
    "src/lib/InternalSocket.js",
    "src/lib/BasePort.js",
    "src/lib/InPort.js",
    "src/lib/OutPort.js",
    "src/lib/Ports.js",
    "src/lib/Port.js",
    "src/lib/ArrayPort.js",
    "src/lib/Component.js",
    "src/lib/AsyncComponent.js",
    "src/lib/LoggingComponent.js",
    "src/lib/ComponentLoader.js",
    "src/lib/NoFlo.js",
    "src/lib/Network.js",
    "src/lib/Platform.js",
    "src/lib/Journal.js",
    "src/lib/Utils.js",
    "src/lib/Helpers.js",
    "src/lib/Streams.js",
    "src/components/Graph.js"
  ],
  "json": [
    "component.json"
  ],
  "noflo": {
    "components": {
      "Graph": "src/components/Graph.js"
    }
  }
}
});



require.alias("noflo-noflo/src/lib/Graph.js", "noflo-mirobot/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-mirobot/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-mirobot/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-mirobot/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-mirobot/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-mirobot/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-mirobot/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-mirobot/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-mirobot/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-mirobot/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-mirobot/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-mirobot/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-mirobot/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-mirobot/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-mirobot/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-mirobot/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-mirobot/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/lib/Helpers.js", "noflo-mirobot/deps/noflo/src/lib/Helpers.js");
require.alias("noflo-noflo/src/lib/Streams.js", "noflo-mirobot/deps/noflo/src/lib/Streams.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-mirobot/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-mirobot/deps/noflo/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo/index.js");
require.alias("bergie-emitter/index.js", "noflo-noflo/deps/events/index.js");

require.alias("jashkenas-underscore/underscore.js", "noflo-noflo/deps/underscore/underscore.js");
require.alias("jashkenas-underscore/underscore.js", "noflo-noflo/deps/underscore/index.js");
require.alias("jashkenas-underscore/underscore.js", "jashkenas-underscore/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");