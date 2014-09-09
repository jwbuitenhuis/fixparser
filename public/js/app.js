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
    concat           = ArrayProto.concat,
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
  var createCallback = function(func, context, argCount) {
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
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
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
    iteratee = _.iteratee(iteratee, context);
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
    iteratee = createCallback(iteratee, context, 4);
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
    iteratee = createCallback(iteratee, context, 4);
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
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
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
    predicate = _.iteratee(predicate, context);
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
      iteratee = _.iteratee(iteratee, context);
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
      iteratee = _.iteratee(iteratee, context);
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
    iteratee = _.iteratee(iteratee, context);
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
      iteratee = _.iteratee(iteratee, context);
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
    iteratee = _.iteratee(iteratee, context, 1);
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
    predicate = _.iteratee(predicate, context);
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
    if (n < 0) return [];
    return slice.call(array, 0, n);
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
    return slice.call(array, Math.max(array.length - n, 0));
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
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
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
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
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
    var rest = flatten(slice.call(arguments, 1), true, true, []);
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
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
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
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
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

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
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
      var address = hasher ? hasher.apply(this, arguments) : key;
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
        clearTimeout(timeout);
        timeout = null;
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

      if (last < wait && last > 0) {
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
      } else {
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

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
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
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
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
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
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
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
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

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
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

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
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
    iteratee = createCallback(iteratee, context, 1);
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
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
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
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
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
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
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

var app = angular.module('myApp', []);

app.controller('MainController', function($scope) {

    $scope.input = "8=FIX.4.19=6135=A34=149=EXEC52=20121105-23:24:0656=BANZAI98=0108=3010=0038=FIX.4.19=6135=A34=149=BANZAI52=20121105-23:24:0656=EXEC98=0108=3010=0038=FIX.4.19=4935=034=249=BANZAI52=20121105-23:24:3756=EXEC10=2288=FIX.4.19=4935=034=249=EXEC52=20121105-23:24:3756=BANZAI10=2288=FIX.4.19=10335=D34=349=BANZAI52=20121105-23:24:4256=EXEC11=135215788257721=138=1000040=154=155=MSFT59=010=0628=FIX.4.19=13935=834=349=EXEC52=20121105-23:24:4256=BANZAI6=011=135215788257714=017=120=031=032=037=138=1000039=054=155=MSFT150=2151=010=0598=FIX.4.19=15335=834=449=EXEC52=20121105-23:24:4256=BANZAI6=12.311=135215788257714=1000017=220=031=12.332=1000037=238=1000039=254=155=MSFT150=2151=010=2308=FIX.4.19=10335=D34=449=BANZAI52=20121105-23:24:5556=EXEC11=135215789503221=138=1000040=154=155=ORCL59=010=0478=FIX.4.19=13935=834=549=EXEC52=20121105-23:24:5556=BANZAI6=011=135215789503214=017=320=031=032=037=338=1000039=054=155=ORCL150=2151=010=0498=FIX.4.19=15335=834=649=EXEC52=20121105-23:24:5556=BANZAI6=12.311=135215789503214=1000017=420=031=12.332=1000037=438=1000039=254=155=ORCL150=2151=010=2208=FIX.4.19=10835=D34=549=BANZAI52=20121105-23:25:1256=EXEC11=135215791235721=138=1000040=244=1054=155=SPY59=010=0038=FIX.4.19=13835=834=749=EXEC52=20121105-23:25:1256=BANZAI6=011=135215791235714=017=520=031=032=037=538=1000039=054=155=SPY150=2151=010=2528=FIX.4.19=10435=F34=649=BANZAI52=20121105-23:25:1656=EXEC11=135215791643738=1000041=135215791235754=155=SPY10=1988=FIX.4.19=8235=334=849=EXEC52=20121105-23:25:1656=BANZAI45=658=Unsupported message type10=0008=FIX.4.19=10435=F34=749=BANZAI52=20121105-23:25:2556=EXEC11=135215792530938=1000041=135215791235754=155=SPY10=1978=FIX.4.19=8235=334=949=EXEC52=20121105-23:25:2556=BANZAI45=758=Unsupported message type10=002";

    var fixMessages = [
        '8=FIX.4.19=11235=049=BRKR56=INVMGR34=23552=19980604-07:58:28112=19980604-07:58:2810=157',
        '8=FIX.4.19=15435=649=BRKR56=INVMGR34=23652=19980604-07:58:4823=11568528=N55=SPMI.MI54=227=20000044=10100.00000025=H10=159',
        '8=FIX.4.19=9035=049=INVMGR56=BRKR34=23652=19980604-07:59:3010=225',
        '8=FIX.4.19=11235=049=BRKR56=INVMGR34=23752=19980604-07:59:48112=19980604-07:59:4810=225',
        '8=FIX.4.19=15435=649=BRKR56=INVMGR34=23852=19980604-07:59:5623=11568628=N55=FIA.MI54=227=25000044=7900.00000025=H10=231',
        '8=FIX.4.19=9035=049=INVMGR56=BRKR34=23752=19980604-08:00:3110=203',
        '8=FIX.4.19=15435=649=BRKR56=INVMGR34=23952=19980604-08:00:3623=11568728=N55=PIRI.MI54=127=30000044=5950.00000025=H10=168',
        '8=FIX.4.19=9035=049=INVMGR56=BRKR34=23852=19980604-08:01:3110=026',
        '8=FIX.4.19=11235=049=BRKR56=INVMGR34=24052=19980604-08:01:36112=19980604-08:01:3610=190',
        '8=FIX.4.19=9035=049=INVMGR56=BRKR34=23952=19980604-08:02:3110=026',
        '8=FIX.4.19=11235=049=BRKR56=INVMGR34=24152=19980604-08:02:36112=19980604-08:02:3610=018',
        '8=FIX.4.19=9035=049=INVMGR56=BRKR34=24052=19980604-08:03:3110=220'
    ];

    $scope.parse = function(input) {
        var messages = FIXParser.extractMessages(input),
            delimiter = FIXParser.guessDelimiter(messages[0]);

        return messages.map(function(message) {
            return FIXParser.toJSON(message, delimiter);
        });
    };

    $scope.speedTest = function () {
        var startTime = new Date().getTime(),
            CYCLES = 1000,
            endTime,
            timeTaken,
            i;

        for (i = 0; i < CYCLES; i += 1) {
            $scope.parse($scope.input);
        }
        
        endTime = new Date().getTime();
        timeTaken = endTime - startTime;
        $scope.averageParseTime = 1000 * timeTaken / (CYCLES*16);
        console.log('parse time (microseconds):', $scope.averageParseTime);
        console.log('total time taken (ms)', timeTaken);
    };

    $scope.speedTest();

    $scope.output = $scope.parse($scope.input);

    fixMessages.map(function (fixMessage) {
        $scope.output = $scope.output.concat($scope.parse(fixMessage));
    });
});
"use strict";

var msgTypeLU = {
"0":{msgname:"Heartbeat", msgcat:"admin"},
"A":{msgname:"Logon", msgcat:"admin"},
"1":{msgname:"TestRequest", msgcat:"admin"},
"2":{msgname:"ResendRequest", msgcat:"admin"},
"3":{msgname:"Reject", msgcat:"admin"},
"4":{msgname:"SequenceReset", msgcat:"admin"},
"5":{msgname:"Logout", msgcat:"admin"},
"j":{msgname:"BusinessMessageReject", msgcat:"app"},
"BE":{msgname:"UserRequest", msgcat:"app"},
"BF":{msgname:"UserResponse", msgcat:"app"},
"7":{msgname:"Advertisement", msgcat:"app"},
"6":{msgname:"IndicationOfInterest", msgcat:"app"},
"B":{msgname:"News", msgcat:"app"},
"C":{msgname:"Email", msgcat:"app"},
"R":{msgname:"QuoteRequest", msgcat:"app"},
"AJ":{msgname:"QuoteResponse", msgcat:"app"},
"AG":{msgname:"QuoteRequestReject", msgcat:"app"},
"AH":{msgname:"RFQRequest", msgcat:"app"},
"S":{msgname:"Quote", msgcat:"app"},
"Z":{msgname:"QuoteCancel", msgcat:"app"},
"a":{msgname:"QuoteStatusRequest", msgcat:"app"},
"AI":{msgname:"QuoteStatusReport", msgcat:"app"},
"i":{msgname:"MassQuote", msgcat:"app"},
"b":{msgname:"MassQuoteAcknowledgement", msgcat:"app"},
"V":{msgname:"MarketDataRequest", msgcat:"app"},
"W":{msgname:"MarketDataSnapshotFullRefresh", msgcat:"app"},
"X":{msgname:"MarketDataIncrementalRefresh", msgcat:"app"},
"Y":{msgname:"MarketDataRequestReject", msgcat:"app"},
"c":{msgname:"SecurityDefinitionRequest", msgcat:"app"},
"d":{msgname:"SecurityDefinition", msgcat:"app"},
"v":{msgname:"SecurityTypeRequest", msgcat:"app"},
"w":{msgname:"SecurityTypes", msgcat:"app"},
"x":{msgname:"SecurityListRequest", msgcat:"app"},
"y":{msgname:"SecurityList", msgcat:"app"},
"z":{msgname:"DerivativeSecurityListRequest", msgcat:"app"},
"AA":{msgname:"DerivativeSecurityList", msgcat:"app"},
"e":{msgname:"SecurityStatusRequest", msgcat:"app"},
"f":{msgname:"SecurityStatus", msgcat:"app"},
"g":{msgname:"TradingSessionStatusRequest", msgcat:"app"},
"h":{msgname:"TradingSessionStatus", msgcat:"app"},
"D":{msgname:"NewOrderSingle", msgcat:"app"},
"8":{msgname:"ExecutionReport", msgcat:"app"},
"Q":{msgname:"DontKnowTrade", msgcat:"app"},
"G":{msgname:"OrderCancelReplaceRequest", msgcat:"app"},
"F":{msgname:"OrderCancelRequest", msgcat:"app"},
"9":{msgname:"OrderCancelReject", msgcat:"app"},
"H":{msgname:"OrderStatusRequest", msgcat:"app"},
"q":{msgname:"OrderMassCancelRequest", msgcat:"app"},
"r":{msgname:"OrderMassCancelReport", msgcat:"app"},
"AF":{msgname:"OrderMassStatusRequest", msgcat:"app"},
"s":{msgname:"NewOrderCross", msgcat:"app"},
"t":{msgname:"CrossOrderCancelReplaceRequest", msgcat:"app"},
"u":{msgname:"CrossOrderCancelRequest", msgcat:"app"},
"AB":{msgname:"NewOrderMultileg", msgcat:"app"},
"AC":{msgname:"MultilegOrderCancelReplaceRequest", msgcat:"app"},
"k":{msgname:"BidRequest", msgcat:"app"},
"l":{msgname:"BidResponse", msgcat:"app"},
"E":{msgname:"NewOrderList", msgcat:"app"},
"m":{msgname:"ListStrikePrice", msgcat:"app"},
"N":{msgname:"ListStatus", msgcat:"app"},
"L":{msgname:"ListExecute", msgcat:"app"},
"K":{msgname:"ListCancelRequest", msgcat:"app"},
"M":{msgname:"ListStatusRequest", msgcat:"app"},
"J":{msgname:"AllocationInstruction", msgcat:"app"},
"P":{msgname:"AllocationInstructionAck", msgcat:"app"},
"AS":{msgname:"AllocationReport", msgcat:"app"},
"AT":{msgname:"AllocationReportAck", msgcat:"app"},
"AK":{msgname:"Confirmation", msgcat:"app"},
"AU":{msgname:"ConfirmationAck", msgcat:"app"},
"BH":{msgname:"ConfirmationRequest", msgcat:"app"},
"T":{msgname:"SettlementInstructions", msgcat:"app"},
"AV":{msgname:"SettlementInstructionRequest", msgcat:"app"},
"AD":{msgname:"TradeCaptureReportRequest", msgcat:"app"},
"AQ":{msgname:"TradeCaptureReportRequestAck", msgcat:"app"},
"AE":{msgname:"TradeCaptureReport", msgcat:"app"},
"AR":{msgname:"TradeCaptureReportAck", msgcat:"app"},
"o":{msgname:"RegistrationInstructions", msgcat:"app"},
"p":{msgname:"RegistrationInstructionsResponse", msgcat:"app"},
"AL":{msgname:"PositionMaintenanceRequest", msgcat:"app"},
"AM":{msgname:"PositionMaintenanceReport", msgcat:"app"},
"AN":{msgname:"RequestForPositions", msgcat:"app"},
"AO":{msgname:"RequestForPositionsAck", msgcat:"app"},
"AP":{msgname:"PositionReport", msgcat:"app"},
"AW":{msgname:"AssignmentReport", msgcat:"app"},
"AX":{msgname:"CollateralRequest", msgcat:"app"},
"AY":{msgname:"CollateralAssignment", msgcat:"app"},
"AZ":{msgname:"CollateralResponse", msgcat:"app"},
"BA":{msgname:"CollateralReport", msgcat:"app"},
"BB":{msgname:"CollateralInquiry", msgcat:"app"},
"BC":{msgname:"NetworkStatusRequest", msgcat:"app"},
"BD":{msgname:"NetworkStatusResponse", msgcat:"app"},
"BG":{msgname:"CollateralInquiryAck", msgcat:"app"}

};

var tagLU={
"1":{desc:"Account", enum:{}},
"2":{desc:"AdvId", enum:{}},
"3":{desc:"AdvRefID", enum:{}},
"4":{desc:"AdvSide", enum:{B:"BUY",S:"SELL",X:"CROSS",T:"TRADE"}},
"5":{desc:"AdvTransType", enum:{N:"NEW",C:"CANCEL",R:"REPLACE"}},
"6":{desc:"AvgPx", enum:{}},
"7":{desc:"BeginSeqNo", enum:{}},
"8":{desc:"BeginString", enum:{}},
"9":{desc:"BodyLength", enum:{}},
"10":{desc:"CheckSum", enum:{}},
"11":{desc:"ClOrdID", enum:{}},
"12":{desc:"Commission", enum:{}},
"13":{desc:"CommType", enum:{1:"PER_UNIT",2:"PERCENTAGE",3:"ABSOLUTE",4:"PERCENTAGE_WAIVED_CASH_DISCOUNT",5:"PERCENTAGE_WAIVED_ENHANCED_UNITS",6:"POINTS_PER_BOND_OR_OR_CONTRACT"}},
"14":{desc:"CumQty", enum:{}},
"15":{desc:"Currency", enum:{}},
"16":{desc:"EndSeqNo", enum:{}},
"17":{desc:"ExecID", enum:{}},
"18":{desc:"ExecInst", enum:{1:"NOT_HELD",2:"WORK",3:"GO_ALONG",4:"OVER_THE_DAY",5:"HELD",6:"PARTICIPATE_DONT_INITIATE",7:"STRICT_SCALE",8:"TRY_TO_SCALE",9:"STAY_ON_BIDSIDE",0:"STAY_ON_OFFERSIDE",A:"NO_CROSS",B:"OK_TO_CROSS",C:"CALL_FIRST",D:"PERCENT_OF_VOLUME",E:"DO_NOT_INCREASE",F:"DO_NOT_REDUCE",G:"ALL_OR_NONE",H:"REINSTATE_ON_SYSTEM_FAILURE",I:"INSTITUTIONS_ONLY",J:"REINSTATE_ON_TRADING_HALT",K:"CANCEL_ON_TRADING_HALT",L:"LAST_PEG",M:"MID_PRICE",N:"NON_NEGOTIABLE",O:"OPENING_PEG",P:"MARKET_PEG",Q:"CANCEL_ON_SYSTEM_FAILURE",R:"PRIMARY_PEG",S:"SUSPEND",T:"FIXED_PEG_TO_LOCAL_BEST_BID_OR_OFFER_AT_TIME_OF_ORDER",U:"CUSTOMER_DISPLAY_INSTRUCTION",V:"NETTING",W:"PEG_TO_VWAP",X:"TRADE_ALONG",Y:"TRY_TO_STOP",Z:"CANCEL_IF_NOT_BEST",a:"TRAILING_STOP_PEG",b:"STRICT_LIMIT",c:"IGNORE_PRICE_VALIDITY_CHECKS",d:"PEG_TO_LIMIT_PRICE",e:"WORK_TO_TARGET_STRATEGY"}},
"19":{desc:"ExecRefID", enum:{}},
"21":{desc:"HandlInst", enum:{1:"AUTOMATED_EXECUTION_ORDER_PRIVATE",2:"AUTOMATED_EXECUTION_ORDER_PUBLIC",3:"MANUAL_ORDER"}},
"22":{desc:"SecurityIDSource", enum:{1:"CUSIP",2:"SEDOL",3:"QUIK",4:"ISIN_NUMBER",5:"RIC_CODE",6:"ISO_CURRENCY_CODE",7:"ISO_COUNTRY_CODE",8:"EXCHANGE_SYMBOL",9:"CONSOLIDATED_TAPE_ASSOCIATION",A:"BLOOMBERG_SYMBOL",B:"WERTPAPIER",C:"DUTCH",D:"VALOREN",E:"SICOVAM",F:"BELGIAN",G:"COMMON",H:"CLEARING_HOUSE_CLEARING_ORGANIZATION",I:"ISDA_FPML_PRODUCT_SPECIFICATION",J:"OPTIONS_PRICE_REPORTING_AUTHORITY"}},
"23":{desc:"IOIid", enum:{}},
"25":{desc:"IOIQltyInd", enum:{L:"LOW",M:"MEDIUM",H:"HIGH"}},
"26":{desc:"IOIRefID", enum:{}},
"27":{desc:"IOIQty", enum:{}},
"28":{desc:"IOITransType", enum:{N:"NEW",C:"CANCEL",R:"REPLACE"}},
"29":{desc:"LastCapacity", enum:{1:"AGENT",2:"CROSS_AS_AGENT",3:"CROSS_AS_PRINCIPAL",4:"PRINCIPAL"}},
"30":{desc:"LastMkt", enum:{}},
"31":{desc:"LastPx", enum:{}},
"32":{desc:"LastQty", enum:{}},
"33":{desc:"LinesOfText", enum:{}},
"34":{desc:"MsgSeqNum", enum:{}},
"35":{desc:"MsgType", enum:{0:"HEARTBEAT",1:"TEST_REQUEST",2:"RESEND_REQUEST",3:"REJECT",4:"SEQUENCE_RESET",5:"LOGOUT",6:"INDICATION_OF_INTEREST",7:"ADVERTISEMENT",8:"EXECUTION_REPORT",9:"ORDER_CANCEL_REJECT",A:"LOGON",B:"NEWS",C:"EMAIL",D:"ORDER_SINGLE",E:"ORDER_LIST",F:"ORDER_CANCEL_REQUEST",G:"ORDER_CANCEL_REPLACE_REQUEST",H:"ORDER_STATUS_REQUEST",J:"ALLOCATION_INSTRUCTION",K:"LIST_CANCEL_REQUEST",L:"LIST_EXECUTE",M:"LIST_STATUS_REQUEST",N:"LIST_STATUS",P:"ALLOCATION_INSTRUCTION_ACK",Q:"DONT_KNOW_TRADE",R:"QUOTE_REQUEST",S:"QUOTE",T:"SETTLEMENT_INSTRUCTIONS",V:"MARKET_DATA_REQUEST",W:"MARKET_DATA_SNAPSHOT_FULL_REFRESH",X:"MARKET_DATA_INCREMENTAL_REFRESH",Y:"MARKET_DATA_REQUEST_REJECT",Z:"QUOTE_CANCEL",a:"QUOTE_STATUS_REQUEST",b:"MASS_QUOTE_ACKNOWLEDGEMENT",c:"SECURITY_DEFINITION_REQUEST",d:"SECURITY_DEFINITION",e:"SECURITY_STATUS_REQUEST",f:"SECURITY_STATUS",g:"TRADING_SESSION_STATUS_REQUEST",h:"TRADING_SESSION_STATUS",i:"MASS_QUOTE",j:"BUSINESS_MESSAGE_REJECT",k:"BID_REQUEST",l:"BID_RESPONSE",m:"LIST_STRIKE_PRICE",n:"XML_MESSAGE",o:"REGISTRATION_INSTRUCTIONS",p:"REGISTRATION_INSTRUCTIONS_RESPONSE",q:"ORDER_MASS_CANCEL_REQUEST",r:"ORDER_MASS_CANCEL_REPORT",s:"NEW_ORDER_CROSS",t:"CROSS_ORDER_CANCEL_REPLACE_REQUEST",u:"CROSS_ORDER_CANCEL_REQUEST",v:"SECURITY_TYPE_REQUEST",w:"SECURITY_TYPES",x:"SECURITY_LIST_REQUEST",y:"SECURITY_LIST",z:"DERIVATIVE_SECURITY_LIST_REQUEST",AA:"DERIVATIVE_SECURITY_LIST",AB:"NEW_ORDER_MULTILEG",AC:"MULTILEG_ORDER_CANCEL_REPLACE",AD:"TRADE_CAPTURE_REPORT_REQUEST",AE:"TRADE_CAPTURE_REPORT",AF:"ORDER_MASS_STATUS_REQUEST",AG:"QUOTE_REQUEST_REJECT",AH:"RFQ_REQUEST",AI:"QUOTE_STATUS_REPORT",AJ:"QUOTE_RESPONSE",AK:"CONFIRMATION",AL:"POSITION_MAINTENANCE_REQUEST",AM:"POSITION_MAINTENANCE_REPORT",AN:"REQUEST_FOR_POSITIONS",AO:"REQUEST_FOR_POSITIONS_ACK",AP:"POSITION_REPORT",AQ:"TRADE_CAPTURE_REPORT_REQUEST_ACK",AR:"TRADE_CAPTURE_REPORT_ACK",AS:"ALLOCATION_REPORT",AT:"ALLOCATION_REPORT_ACK",AU:"CONFIRMATION_ACK",AV:"SETTLEMENT_INSTRUCTION_REQUEST",AW:"ASSIGNMENT_REPORT",AX:"COLLATERAL_REQUEST",AY:"COLLATERAL_ASSIGNMENT",AZ:"COLLATERAL_RESPONSE",BA:"COLLATERAL_REPORT",BB:"COLLATERAL_INQUIRY",BC:"NETWORK_STATUS_REQUEST",BD:"NETWORK_STATUS_RESPONSE",BE:"USER_REQUEST",BF:"USER_RESPONSE",BG:"COLLATERAL_INQUIRY_ACK",BH:"CONFIRMATION_REQUEST"}},
"36":{desc:"NewSeqNo", enum:{}},
"37":{desc:"OrderID", enum:{}},
"38":{desc:"OrderQty", enum:{}},
"39":{desc:"OrdStatus", enum:{0:"NEW",1:"PARTIALLY_FILLED",2:"FILLED",3:"DONE_FOR_DAY",4:"CANCELED",5:"REPLACED",6:"PENDING_CANCEL",7:"STOPPED",8:"REJECTED",9:"SUSPENDED",A:"PENDING_NEW",B:"CALCULATED",C:"EXPIRED",D:"ACCEPTED_FOR_BIDDING",E:"PENDING_REPLACE"}},
"40":{desc:"OrdType", enum:{1:"MARKET",2:"LIMIT",3:"STOP",4:"STOP_LIMIT",5:"MARKET_ON_CLOSE",6:"WITH_OR_WITHOUT",7:"LIMIT_OR_BETTER",8:"LIMIT_WITH_OR_WITHOUT",9:"ON_BASIS",A:"ON_CLOSE",B:"LIMIT_ON_CLOSE",C:"FOREX_MARKET",D:"PREVIOUSLY_QUOTED",E:"PREVIOUSLY_INDICATED",F:"FOREX_LIMIT",G:"FOREX_SWAP",H:"FOREX_PREVIOUSLY_QUOTED",I:"FUNARI",J:"MARKET_IF_TOUCHED",K:"MARKET_WITH_LEFTOVER_AS_LIMIT",L:"PREVIOUS_FUND_VALUATION_POINT",M:"NEXT_FUND_VALUATION_POINT",P:"PEGGED"}},
"41":{desc:"OrigClOrdID", enum:{}},
"42":{desc:"OrigTime", enum:{}},
"43":{desc:"PossDupFlag", enum:{}},
"44":{desc:"Price", enum:{}},
"45":{desc:"RefSeqNum", enum:{}},
"48":{desc:"SecurityID", enum:{}},
"49":{desc:"SenderCompID", enum:{}},
"50":{desc:"SenderSubID", enum:{}},
"52":{desc:"SendingTime", enum:{}},
"53":{desc:"Quantity", enum:{}},
"54":{desc:"Side", enum:{1:"BUY",2:"SELL",3:"BUY_MINUS",4:"SELL_PLUS",5:"SELL_SHORT",6:"SELL_SHORT_EXEMPT",7:"UNDISCLOSED",8:"CROSS",9:"CROSS_SHORT",A:"CROSS_SHORT_EXEMPT",B:"AS_DEFINED",C:"OPPOSITE",D:"SUBSCRIBE",E:"REDEEM",F:"LEND",G:"BORROW"}},
"55":{desc:"Symbol", enum:{}},
"56":{desc:"TargetCompID", enum:{}},
"57":{desc:"TargetSubID", enum:{}},
"58":{desc:"Text", enum:{}},
"59":{desc:"TimeInForce", enum:{0:"DAY",1:"GOOD_TILL_CANCEL",2:"AT_THE_OPENING",3:"IMMEDIATE_OR_CANCEL",4:"FILL_OR_KILL",5:"GOOD_TILL_CROSSING",6:"GOOD_TILL_DATE",7:"AT_THE_CLOSE"}},
"60":{desc:"TransactTime", enum:{}},
"61":{desc:"Urgency", enum:{0:"NORMAL",1:"FLASH",2:"BACKGROUND"}},
"62":{desc:"ValidUntilTime", enum:{}},
"63":{desc:"SettlType", enum:{0:"REGULAR",1:"CASH",2:"NEXT_DAY",3:"T_PLUS_2",4:"T_PLUS_3",5:"T_PLUS_4",6:"FUTURE",7:"WHEN_AND_IF_ISSUED",8:"SELLERS_OPTION",9:"T_PLUS_5"}},
"64":{desc:"SettlDate", enum:{}},
"65":{desc:"SymbolSfx", enum:{WI:"WHEN_ISSUED",CD:"A_EUCP_WITH_LUMP_SUM_INTEREST"}},
"66":{desc:"ListID", enum:{}},
"67":{desc:"ListSeqNo", enum:{}},
"68":{desc:"TotNoOrders", enum:{}},
"69":{desc:"ListExecInst", enum:{}},
"70":{desc:"AllocID", enum:{}},
"71":{desc:"AllocTransType", enum:{0:"NEW",1:"REPLACE",2:"CANCEL",3:"PRELIMINARY",4:"CALCULATED",5:"CALCULATED_WITHOUT_PRELIMINARY"}},
"72":{desc:"RefAllocID", enum:{}},
"73":{desc:"NoOrders", enum:{}},
"74":{desc:"AvgPxPrecision", enum:{}},
"75":{desc:"TradeDate", enum:{}},
"77":{desc:"PositionEffect", enum:{O:"OPEN",C:"CLOSE",R:"ROLLED",F:"FIFO"}},
"78":{desc:"NoAllocs", enum:{}},
"79":{desc:"AllocAccount", enum:{}},
"80":{desc:"AllocQty", enum:{}},
"81":{desc:"ProcessCode", enum:{0:"REGULAR",1:"SOFT_DOLLAR",2:"STEP_IN",3:"STEP_OUT",4:"SOFT_DOLLAR_STEP_IN",5:"SOFT_DOLLAR_STEP_OUT",6:"PLAN_SPONSOR"}},
"82":{desc:"NoRpts", enum:{}},
"83":{desc:"RptSeq", enum:{}},
"84":{desc:"CxlQty", enum:{}},
"85":{desc:"NoDlvyInst", enum:{}},
"87":{desc:"AllocStatus", enum:{0:"ACCEPTED",1:"BLOCK_LEVEL_REJECT",2:"ACCOUNT_LEVEL_REJECT",3:"RECEIVED",4:"INCOMPLETE",5:"REJECTED_BY_INTERMEDIARY"}},
"88":{desc:"AllocRejCode", enum:{0:"UNKNOWN_ACCOUNT",1:"INCORRECT_QUANTITY",2:"INCORRECT_AVERAGE_PRICE",3:"UNKNOWN_EXECUTING_BROKER_MNEMONIC",4:"COMMISSION_DIFFERENCE",5:"UNKNOWN_ORDERID",6:"UNKNOWN_LISTID",7:"OTHER",8:"INCORRECT_ALLOCATED_QUANTITY",9:"CALCULATION_DIFFERENCE",10:"UNKNOWN_OR_STALE_EXEC_ID",11:"MISMATCHED_DATA_VALUE",12:"UNKNOWN_CLORDID",13:"WAREHOUSE_REQUEST_REJECTED"}},
"89":{desc:"Signature", enum:{}},
"90":{desc:"SecureDataLen", enum:{}},
"91":{desc:"SecureData", enum:{}},
"93":{desc:"SignatureLength", enum:{}},
"94":{desc:"EmailType", enum:{0:"NEW",1:"REPLY",2:"ADMIN_REPLY"}},
"95":{desc:"RawDataLength", enum:{}},
"96":{desc:"RawData", enum:{}},
"97":{desc:"PossResend", enum:{}},
"98":{desc:"EncryptMethod", enum:{0:"NONE_OTHER",1:"PKCS",2:"DES",3:"PKCS_DES",4:"PGP_DES",5:"PGP_DES_MD5",6:"PEM_DES_MD5"}},
"99":{desc:"StopPx", enum:{}},
"100":{desc:"ExDestination", enum:{}},
"102":{desc:"CxlRejReason", enum:{0:"TOO_LATE_TO_CANCEL",1:"UNKNOWN_ORDER",2:"BROKER_EXCHANGE_OPTION",3:"ORDER_ALREADY_IN_PENDING_CANCEL_OR_PENDING_REPLACE_STATUS",4:"UNABLE_TO_PROCESS_ORDER_MASS_CANCEL_REQUEST",5:"ORIGORDMODTIME_DID_NOT_MATCH_LAST_TRANSACTTIME_OF_ORDER",6:"DUPLICATE_CLORDID_RECEIVED",99:"OTHER"}},
"103":{desc:"OrdRejReason", enum:{0:"BROKER_EXCHANGE_OPTION",1:"UNKNOWN_SYMBOL",2:"EXCHANGE_CLOSED",3:"ORDER_EXCEEDS_LIMIT",4:"TOO_LATE_TO_ENTER",5:"UNKNOWN_ORDER",6:"DUPLICATE_ORDER",7:"DUPLICATE_OF_A_VERBALLY_COMMUNICATED_ORDER",8:"STALE_ORDER",9:"TRADE_ALONG_REQUIRED",10:"INVALID_INVESTOR_ID",11:"UNSUPPORTED_ORDER_CHARACTERISTIC",12:"SURVEILLENCE_OPTION",13:"INCORRECT_QUANTITY",14:"INCORRECT_ALLOCATED_QUANTITY",15:"UNKNOWN_ACCOUNT",99:"OTHER"}},
"104":{desc:"IOIQualifier", enum:{A:"ALL_OR_NONE",B:"MARKET_ON_CLOSE",C:"AT_THE_CLOSE",D:"VWAP",I:"IN_TOUCH_WITH",L:"LIMIT",M:"MORE_BEHIND",O:"AT_THE_OPEN",P:"TAKING_A_POSITION",Q:"AT_THE_MARKET",R:"READY_TO_TRADE",S:"PORTFOLIO_SHOWN",T:"THROUGH_THE_DAY",V:"VERSUS",W:"INDICATION_WORKING_AWAY",X:"CROSSING_OPPORTUNITY",Y:"AT_THE_MIDPOINT",Z:"PRE_OPEN"}},
"105":{desc:"WaveNo", enum:{}},
"106":{desc:"Issuer", enum:{}},
"107":{desc:"SecurityDesc", enum:{}},
"108":{desc:"HeartBtInt", enum:{}},
"110":{desc:"MinQty", enum:{}},
"111":{desc:"MaxFloor", enum:{}},
"112":{desc:"TestReqID", enum:{}},
"113":{desc:"ReportToExch", enum:{}},
"114":{desc:"LocateReqd", enum:{}},
"115":{desc:"OnBehalfOfCompID", enum:{}},
"116":{desc:"OnBehalfOfSubID", enum:{}},
"117":{desc:"QuoteID", enum:{}},
"118":{desc:"NetMoney", enum:{}},
"119":{desc:"SettlCurrAmt", enum:{}},
"120":{desc:"SettlCurrency", enum:{}},
"121":{desc:"ForexReq", enum:{}},
"122":{desc:"OrigSendingTime", enum:{}},
"123":{desc:"GapFillFlag", enum:{}},
"124":{desc:"NoExecs", enum:{}},
"126":{desc:"ExpireTime", enum:{}},
"127":{desc:"DKReason", enum:{A:"UNKNOWN_SYMBOL",B:"WRONG_SIDE",C:"QUANTITY_EXCEEDS_ORDER",D:"NO_MATCHING_ORDER",E:"PRICE_EXCEEDS_LIMIT",F:"CALCULATION_DIFFERENCE",Z:"OTHER"}},
"128":{desc:"DeliverToCompID", enum:{}},
"129":{desc:"DeliverToSubID", enum:{}},
"130":{desc:"IOINaturalFlag", enum:{}},
"131":{desc:"QuoteReqID", enum:{}},
"132":{desc:"BidPx", enum:{}},
"133":{desc:"OfferPx", enum:{}},
"134":{desc:"BidSize", enum:{}},
"135":{desc:"OfferSize", enum:{}},
"136":{desc:"NoMiscFees", enum:{}},
"137":{desc:"MiscFeeAmt", enum:{}},
"138":{desc:"MiscFeeCurr", enum:{}},
"139":{desc:"MiscFeeType", enum:{1:"REGULATORY",2:"TAX",3:"LOCAL_COMMISSION",4:"EXCHANGE_FEES",5:"STAMP",6:"LEVY",7:"OTHER",8:"MARKUP",9:"CONSUMPTION_TAX"}},
"140":{desc:"PrevClosePx", enum:{}},
"141":{desc:"ResetSeqNumFlag", enum:{}},
"142":{desc:"SenderLocationID", enum:{}},
"143":{desc:"TargetLocationID", enum:{}},
"144":{desc:"OnBehalfOfLocationID", enum:{}},
"145":{desc:"DeliverToLocationID", enum:{}},
"146":{desc:"NoRelatedSym", enum:{}},
"147":{desc:"Subject", enum:{}},
"148":{desc:"Headline", enum:{}},
"149":{desc:"URLLink", enum:{}},
"150":{desc:"ExecType", enum:{0:"NEW",1:"PARTIAL_FILL",2:"FILL",3:"DONE_FOR_DAY",4:"CANCELED",5:"REPLACE",6:"PENDING_CANCEL",7:"STOPPED",8:"REJECTED",9:"SUSPENDED",A:"PENDING_NEW",B:"CALCULATED",C:"EXPIRED",D:"RESTATED",E:"PENDING_REPLACE",F:"TRADE",G:"TRADE_CORRECT",H:"TRADE_CANCEL",I:"ORDER_STATUS"}},
"151":{desc:"LeavesQty", enum:{}},
"152":{desc:"CashOrderQty", enum:{}},
"153":{desc:"AllocAvgPx", enum:{}},
"154":{desc:"AllocNetMoney", enum:{}},
"155":{desc:"SettlCurrFxRate", enum:{}},
"156":{desc:"SettlCurrFxRateCalc", enum:{M:"MULTIPLY",D:"DIVIDE"}},
"157":{desc:"NumDaysInterest", enum:{}},
"158":{desc:"AccruedInterestRate", enum:{}},
"159":{desc:"AccruedInterestAmt", enum:{}},
"160":{desc:"SettlInstMode", enum:{0:"DEFAULT",1:"STANDING_INSTRUCTIONS_PROVIDED",4:"SPECIFIC_ORDER_FOR_A_SINGLE_ACCOUNT",5:"REQUEST_REJECT"}},
"161":{desc:"AllocText", enum:{}},
"162":{desc:"SettlInstID", enum:{}},
"163":{desc:"SettlInstTransType", enum:{N:"NEW",C:"CANCEL",R:"REPLACE",T:"RESTATE"}},
"164":{desc:"EmailThreadID", enum:{}},
"165":{desc:"SettlInstSource", enum:{1:"BROKERS_INSTRUCTIONS",2:"INSTITUTIONS_INSTRUCTIONS",3:"INVESTOR"}},
"167":{desc:"SecurityType", enum:{"?":"WILDCARD",ABS:"ASSET_BACKED_SECURITIES",AMENDED:"AMENDED_AND_RESTATED",AN:"OTHER_ANTICIPATION_NOTES",BA:"BANKERS_ACCEPTANCE",BN:"BANK_NOTES",BOX:"BILL_OF_EXCHANGES",BRADY:"BRADY_BOND",BRIDGE:"BRIDGE_LOAN",BUYSELL:"BUY_SELLBACK",CB:"CONVERTIBLE_BOND",CD:"CERTIFICATE_OF_DEPOSIT",CL:"CALL_LOANS",CMBS:"CORP_MORTGAGE_BACKED_SECURITIES",CMO:"COLLATERALIZED_MORTGAGE_OBLIGATION",COFO:"CERTIFICATE_OF_OBLIGATION",COFP:"CERTIFICATE_OF_PARTICIPATION",CORP:"CORPORATE_BOND",CP:"COMMERCIAL_PAPER",CPP:"CORPORATE_PRIVATE_PLACEMENT",CS:"COMMON_STOCK",DEFLTED:"DEFAULTED",DINP:"DEBTOR_IN_POSSESSION",DN:"DEPOSIT_NOTES",DUAL:"DUAL_CURRENCY",EUCD:"EURO_CERTIFICATE_OF_DEPOSIT",EUCORP:"EURO_CORPORATE_BOND",EUCP:"EURO_COMMERCIAL_PAPER",EUSOV:"EURO_SOVEREIGNS",EUSUPRA:"EURO_SUPRANATIONAL_COUPONS",FAC:"FEDERAL_AGENCY_COUPON",FADN:"FEDERAL_AGENCY_DISCOUNT_NOTE",FOR:"FOREIGN_EXCHANGE_CONTRACT",FORWARD:"FORWARD",FUT:"FUTURE",GO:"GENERAL_OBLIGATION_BONDS",IET:"IOETTE_MORTGAGE",LOFC:"LETTER_OF_CREDIT",LQN:"LIQUIDITY_NOTE",MATURED:"MATURED",MBS:"MORTGAGE_BACKED_SECURITIES",MF:"MUTUAL_FUND",MIO:"MORTGAGE_INTEREST_ONLY",MLEG:"MULTI_LEG_INSTRUMENT",MPO:"MORTGAGE_PRINCIPAL_ONLY",MPP:"MORTGAGE_PRIVATE_PLACEMENT",MPT:"MISCELLANEOUS_PASS_THROUGH",MT:"MANDATORY_TENDER",MTN:"MEDIUM_TERM_NOTES",NONE:"NO_SECURITY_TYPE",ONITE:"OVERNIGHT",OPT:"OPTION",PEF:"PRIVATE_EXPORT_FUNDING",PFAND:"PFANDBRIEFE",PN:"PROMISSORY_NOTE",PS:"PREFERRED_STOCK",PZFJ:"PLAZOS_FIJOS",RAN:"REVENUE_ANTICIPATION_NOTE",REPLACD:"REPLACED",REPO:"REPURCHASE",RETIRED:"RETIRED",REV:"REVENUE_BONDS",RVLV:"REVOLVER_LOAN",RVLVTRM:"REVOLVER_TERM_LOAN",SECLOAN:"SECURITIES_LOAN",SECPLEDGE:"SECURITIES_PLEDGE",SPCLA:"SPECIAL_ASSESSMENT",SPCLO:"SPECIAL_OBLIGATION",SPCLT:"SPECIAL_TAX",STN:"SHORT_TERM_LOAN_NOTE",STRUCT:"STRUCTURED_NOTES",SUPRA:"USD_SUPRANATIONAL_COUPONS",SWING:"SWING_LINE_FACILITY",TAN:"TAX_ANTICIPATION_NOTE",TAXA:"TAX_ALLOCATION",TBA:"TO_BE_ANNOUNCED",TBILL:"US_TREASURY_BILL",TBOND:"US_TREASURY_BOND",TCAL:"PRINCIPAL_STRIP_OF_A_CALLABLE_BOND_OR_NOTE",TD:"TIME_DEPOSIT",TECP:"TAX_EXEMPT_COMMERCIAL_PAPER",TERM:"TERM_LOAN",TINT:"INTEREST_STRIP_FROM_ANY_BOND_OR_NOTE",TIPS:"TREASURY_INFLATION_PROTECTED_SECURITIES",TNOTE:"US_TREASURY_NOTE",TPRN:"PRINCIPAL_STRIP_FROM_A_NON_CALLABLE_BOND_OR_NOTE",TRAN:"TAX_AND_REVENUE_ANTICIPATION_NOTE",VRDN:"VARIABLE_RATE_DEMAND_NOTE",WAR:"WARRANT",WITHDRN:"WITHDRAWN",XCN:"EXTENDED_COMM_NOTE",XLINKD:"INDEXED_LINKED",YANK:"YANKEE_CORPORATE_BOND",YCD:"YANKEE_CERTIFICATE_OF_DEPOSIT"}},
"168":{desc:"EffectiveTime", enum:{}},
"169":{desc:"StandInstDbType", enum:{0:"OTHER",1:"DTC_SID",2:"THOMSON_ALERT",3:"A_GLOBAL_CUSTODIAN",4:"ACCOUNTNET"}},
"170":{desc:"StandInstDbName", enum:{}},
"171":{desc:"StandInstDbID", enum:{}},
"172":{desc:"SettlDeliveryType", enum:{0:"VERSUS_PAYMENT",1:"FREE",2:"TRI_PARTY",3:"HOLD_IN_CUSTODY"}},
"188":{desc:"BidSpotRate", enum:{}},
"189":{desc:"BidForwardPoints", enum:{}},
"190":{desc:"OfferSpotRate", enum:{}},
"191":{desc:"OfferForwardPoints", enum:{}},
"192":{desc:"OrderQty2", enum:{}},
"193":{desc:"SettlDate2", enum:{}},
"194":{desc:"LastSpotRate", enum:{}},
"195":{desc:"LastForwardPoints", enum:{}},
"196":{desc:"AllocLinkID", enum:{}},
"197":{desc:"AllocLinkType", enum:{0:"F_X_NETTING",1:"F_X_SWAP"}},
"198":{desc:"SecondaryOrderID", enum:{}},
"199":{desc:"NoIOIQualifiers", enum:{}},
"200":{desc:"MaturityMonthYear", enum:{}},
"202":{desc:"StrikePrice", enum:{}},
"203":{desc:"CoveredOrUncovered", enum:{0:"COVERED",1:"UNCOVERED"}},
"206":{desc:"OptAttribute", enum:{}},
"207":{desc:"SecurityExchange", enum:{}},
"208":{desc:"NotifyBrokerOfCredit", enum:{}},
"209":{desc:"AllocHandlInst", enum:{1:"MATCH",2:"FORWARD",3:"FORWARD_AND_MATCH"}},
"210":{desc:"MaxShow", enum:{}},
"211":{desc:"PegOffsetValue", enum:{}},
"212":{desc:"XmlDataLen", enum:{}},
"213":{desc:"XmlData", enum:{}},
"214":{desc:"SettlInstRefID", enum:{}},
"215":{desc:"NoRoutingIDs", enum:{}},
"216":{desc:"RoutingType", enum:{1:"TARGET_FIRM",2:"TARGET_LIST",3:"BLOCK_FIRM",4:"BLOCK_LIST"}},
"217":{desc:"RoutingID", enum:{}},
"218":{desc:"Spread", enum:{}},
"220":{desc:"BenchmarkCurveCurrency", enum:{}},
"221":{desc:"BenchmarkCurveName", enum:{MuniAAA:"MUNIAAA",FutureSWAP:"FUTURESWAP",LIBID:"LIBID",LIBOR:"LIBOR",OTHER:"OTHER",SWAP:"SWAP",Treasury:"TREASURY",Euribor:"EURIBOR",Pfandbriefe:"PFANDBRIEFE",EONIA:"EONIA",SONIA:"SONIA",EUREPO:"EUREPO"}},
"222":{desc:"BenchmarkCurvePoint", enum:{}},
"223":{desc:"CouponRate", enum:{}},
"224":{desc:"CouponPaymentDate", enum:{}},
"225":{desc:"IssueDate", enum:{}},
"226":{desc:"RepurchaseTerm", enum:{}},
"227":{desc:"RepurchaseRate", enum:{}},
"228":{desc:"Factor", enum:{}},
"229":{desc:"TradeOriginationDate", enum:{}},
"230":{desc:"ExDate", enum:{}},
"231":{desc:"ContractMultiplier", enum:{}},
"232":{desc:"NoStipulations", enum:{}},
"233":{desc:"StipulationType", enum:{AMT:"AMT",AUTOREINV:"AUTO_REINVESTMENT_AT_OR_BETTER",BANKQUAL:"BANK_QUALIFIED",BGNCON:"BARGAIN_CONDITIONS",COUPON:"COUPON_RANGE",CURRENCY:"ISO_CURRENCY_CODE",CUSTOMDATE:"CUSTOM_START_END_DATE",GEOG:"GEOGRAPHICS_AND_PERCENT_RANGE",HAIRCUT:"VALUATION_DISCOUNT",INSURED:"INSURED",ISSUE:"YEAR_OR_YEAR_MONTH_OF_ISSUE",ISSUER:"ISSUERS_TICKER",ISSUESIZE:"ISSUE_SIZE_RANGE",LOOKBACK:"LOOKBACK_DAYS",LOT:"EXPLICIT_LOT_IDENTIFIER",LOTVAR:"LOT_VARIANCE",MAT:"MATURITY_YEAR_AND_MONTH",MATURITY:"MATURITY_RANGE",MAXSUBS:"MAXIMUM_SUBSTITUTIONS",MINQTY:"MINIMUM_QUANTITY",MININCR:"MINIMUM_INCREMENT",MINDNOM:"MINIMUM_DENOMINATION",PAYFREQ:"PAYMENT_FREQUENCY_CALENDAR",PIECES:"NUMBER_OF_PIECES",PMAX:"POOLS_MAXIMUM",PPM:"POOLS_PER_MILLION",PPL:"POOLS_PER_LOT",PPT:"POOLS_PER_TRADE",PRICE:"PRICE_RANGE",PRICEFREQ:"PRICING_FREQUENCY",PROD:"PRODUCTION_YEAR",PROTECT:"CALL_PROTECTION",PURPOSE:"PURPOSE",PXSOURCE:"BENCHMARK_PRICE_SOURCE",RATING:"RATING_SOURCE_AND_RANGE",RESTRICTED:"RESTRICTED",SECTOR:"MARKET_SECTOR",SECTYPE:"SECURITYTYPE_INCLUDED_OR_EXCLUDED",STRUCT:"STRUCTURE",SUBSFREQ:"SUBSTITUTIONS_FREQUENCY",SUBSLEFT:"SUBSTITUTIONS_LEFT",TEXT:"FREEFORM_TEXT",TRDVAR:"TRADE_VARIANCE",WAC:"WEIGHTED_AVERAGE_COUPON",WAL:"WEIGHTED_AVERAGE_LIFE_COUPON",WALA:"WEIGHTED_AVERAGE_LOAN_AGE",WAM:"WEIGHTED_AVERAGE_MATURITY",WHOLE:"WHOLE_POOL",YIELD:"YIELD_RANGE",SMM:"SINGLE_MONTHLY_MORTALITY",CPR:"CONSTANT_PREPAYMENT_RATE",CPY:"CONSTANT_PREPAYMENT_YIELD",CPP:"CONSTANT_PREPAYMENT_PENALTY",ABS:"ABSOLUTE_PREPAYMENT_SPEED",MPR:"MONTHLY_PREPAYMENT_RATE",PSA:"PERCENT_OF_BMA_PREPAYMENT_CURVE",PPC:"PERCENT_OF_PROSPECTUS_PREPAYMENT_CURVE",MHP:"PERCENT_OF_MANUFACTURED_HOUSING_PREPAYMENT_CURVE",HEP:"FINAL_CPR_OF_HOME_EQUITY_PREPAYMENT_CURVE"}},
"234":{desc:"StipulationValue", enum:{CD:"SPECIAL_CUM_DIVIDEND",XD:"SPECIAL_EX_DIVIDEND",CC:"SPECIAL_CUM_COUPON",XC:"SPECIAL_EX_COUPON",CB:"SPECIAL_CUM_BONUS",XB:"SPECIAL_EX_BONUS",CR:"SPECIAL_CUM_RIGHTS",XR:"SPECIAL_EX_RIGHTS",CP:"SPECIAL_CUM_CAPITAL_REPAYMENTS",XP:"SPECIAL_EX_CAPITAL_REPAYMENTS",CS:"CASH_SETTLEMENT",SP:"SPECIAL_PRICE",TR:"REPORT_FOR_EUROPEAN_EQUITY_MARKET_SECURITIES",GD:"GUARANTEED_DELIVERY"}},
"235":{desc:"YieldType", enum:{AFTERTAX:"AFTER_TAX_YIELD",ANNUAL:"ANNUAL_YIELD",ATISSUE:"YIELD_AT_ISSUE",AVGMATURITY:"YIELD_TO_AVERAGE_MATURITY",BOOK:"BOOK_YIELD",CALL:"YIELD_TO_NEXT_CALL",CHANGE:"YIELD_CHANGE_SINCE_CLOSE",CLOSE:"CLOSING_YIELD",COMPOUND:"COMPOUND_YIELD",CURRENT:"CURRENT_YIELD",GROSS:"TRUE_GROSS_YIELD",GOVTEQUIV:"GOVERNMENT_EQUIVALENT_YIELD",INFLATION:"YIELD_WITH_INFLATION_ASSUMPTION",INVERSEFLOATER:"INVERSE_FLOATER_BOND_YIELD",LASTCLOSE:"MOST_RECENT_CLOSING_YIELD",LASTMONTH:"CLOSING_YIELD_MOST_RECENT_MONTH",LASTQUARTER:"CLOSING_YIELD_MOST_RECENT_QUARTER",LASTYEAR:"CLOSING_YIELD_MOST_RECENT_YEAR",LONGAVGLIFE:"YIELD_TO_LONGEST_AVERAGE_LIFE",MARK:"MARK_TO_MARKET_YIELD",MATURITY:"YIELD_TO_MATURITY",NEXTREFUND:"YIELD_TO_NEXT_REFUND",OPENAVG:"OPEN_AVERAGE_YIELD",PUT:"YIELD_TO_NEXT_PUT",PREVCLOSE:"PREVIOUS_CLOSE_YIELD",PROCEEDS:"PROCEEDS_YIELD",SEMIANNUAL:"SEMI_ANNUAL_YIELD",SHORTAVGLIFE:"YIELD_TO_SHORTEST_AVERAGE_LIFE",SIMPLE:"SIMPLE_YIELD",TAXEQUIV:"TAX_EQUIVALENT_YIELD",TENDER:"YIELD_TO_TENDER_DATE",TRUE:"TRUE_YIELD",VALUE1_32:"YIELD_VALUE_OF_1_32",WORST:"YIELD_TO_WORST"}},
"236":{desc:"Yield", enum:{}},
"237":{desc:"TotalTakedown", enum:{}},
"238":{desc:"Concession", enum:{}},
"239":{desc:"RepoCollateralSecurityType", enum:{}},
"240":{desc:"RedemptionDate", enum:{}},
"241":{desc:"UnderlyingCouponPaymentDate", enum:{}},
"242":{desc:"UnderlyingIssueDate", enum:{}},
"243":{desc:"UnderlyingRepoCollateralSecurityType", enum:{}},
"244":{desc:"UnderlyingRepurchaseTerm", enum:{}},
"245":{desc:"UnderlyingRepurchaseRate", enum:{}},
"246":{desc:"UnderlyingFactor", enum:{}},
"247":{desc:"UnderlyingRedemptionDate", enum:{}},
"248":{desc:"LegCouponPaymentDate", enum:{}},
"249":{desc:"LegIssueDate", enum:{}},
"250":{desc:"LegRepoCollateralSecurityType", enum:{}},
"251":{desc:"LegRepurchaseTerm", enum:{}},
"252":{desc:"LegRepurchaseRate", enum:{}},
"253":{desc:"LegFactor", enum:{}},
"254":{desc:"LegRedemptionDate", enum:{}},
"255":{desc:"CreditRating", enum:{}},
"256":{desc:"UnderlyingCreditRating", enum:{}},
"257":{desc:"LegCreditRating", enum:{}},
"258":{desc:"TradedFlatSwitch", enum:{}},
"259":{desc:"BasisFeatureDate", enum:{}},
"260":{desc:"BasisFeaturePrice", enum:{}},
"262":{desc:"MDReqID", enum:{}},
"263":{desc:"SubscriptionRequestType", enum:{0:"SNAPSHOT",1:"SNAPSHOT_PLUS_UPDATES",2:"DISABLE_PREVIOUS_SNAPSHOT_PLUS_UPDATE_REQUEST"}},
"264":{desc:"MarketDepth", enum:{}},
"265":{desc:"MDUpdateType", enum:{0:"FULL_REFRESH",1:"INCREMENTAL_REFRESH"}},
"266":{desc:"AggregatedBook", enum:{}},
"267":{desc:"NoMDEntryTypes", enum:{}},
"268":{desc:"NoMDEntries", enum:{}},
"269":{desc:"MDEntryType", enum:{0:"BID",1:"OFFER",2:"TRADE",3:"INDEX_VALUE",4:"OPENING_PRICE",5:"CLOSING_PRICE",6:"SETTLEMENT_PRICE",7:"TRADING_SESSION_HIGH_PRICE",8:"TRADING_SESSION_LOW_PRICE",9:"TRADING_SESSION_VWAP_PRICE",A:"IMBALANCE",B:"TRADE_VOLUME",C:"OPEN_INTEREST"}},
"270":{desc:"MDEntryPx", enum:{}},
"271":{desc:"MDEntrySize", enum:{}},
"272":{desc:"MDEntryDate", enum:{}},
"273":{desc:"MDEntryTime", enum:{}},
"274":{desc:"TickDirection", enum:{0:"PLUS_TICK",1:"ZERO_PLUS_TICK",2:"MINUS_TICK",3:"ZERO_MINUS_TICK"}},
"275":{desc:"MDMkt", enum:{}},
"276":{desc:"QuoteCondition", enum:{A:"OPEN_ACTIVE",B:"CLOSED_INACTIVE",C:"EXCHANGE_BEST",D:"CONSOLIDATED_BEST",E:"LOCKED",F:"CROSSED",G:"DEPTH",H:"FAST_TRADING",I:"NON_FIRM"}},
"277":{desc:"TradeCondition", enum:{A:"CASH_MARKET",B:"AVERAGE_PRICE_TRADE",C:"CASH_TRADE",D:"NEXT_DAY_MARKET",E:"OPENING_REOPENING_TRADE_DETAIL",F:"INTRADAY_TRADE_DETAIL",G:"RULE127",H:"RULE155",I:"SOLD_LAST",J:"NEXT_DAY_TRADE",K:"OPENED",L:"SELLER",M:"SOLD",N:"STOPPED_STOCK",P:"IMBALANCE_MORE_BUYERS",Q:"IMBALANCE_MORE_SELLERS",R:"OPENING_PRICE"}},
"278":{desc:"MDEntryID", enum:{}},
"279":{desc:"MDUpdateAction", enum:{0:"NEW",1:"CHANGE",2:"DELETE"}},
"280":{desc:"MDEntryRefID", enum:{}},
"281":{desc:"MDReqRejReason", enum:{0:"UNKNOWN_SYMBOL",1:"DUPLICATE_MDREQID",2:"INSUFFICIENT_BANDWIDTH",3:"INSUFFICIENT_PERMISSIONS",4:"UNSUPPORTED_SUBSCRIPTIONREQUESTTYPE",5:"UNSUPPORTED_MARKETDEPTH",6:"UNSUPPORTED_MDUPDATETYPE",7:"UNSUPPORTED_AGGREGATEDBOOK",8:"UNSUPPORTED_MDENTRYTYPE",9:"UNSUPPORTED_TRADINGSESSIONID",A:"UNSUPPORTED_SCOPE",B:"UNSUPPORTED_OPENCLOSESETTLEFLAG",C:"UNSUPPORTED_MDIMPLICITDELETE"}},
"282":{desc:"MDEntryOriginator", enum:{}},
"283":{desc:"LocationID", enum:{}},
"284":{desc:"DeskID", enum:{}},
"285":{desc:"DeleteReason", enum:{0:"CANCELATION_TRADE_BUST",1:"ERROR"}},
"286":{desc:"OpenCloseSettlFlag", enum:{0:"DAILY_OPEN_CLOSE_SETTLEMENT_ENTRY",1:"SESSION_OPEN_CLOSE_SETTLEMENT_ENTRY",2:"DELIVERY_SETTLEMENT_ENTRY",3:"EXPECTED_ENTRY",4:"ENTRY_FROM_PREVIOUS_BUSINESS_DAY",5:"THEORETICAL_PRICE_VALUE"}},
"287":{desc:"SellerDays", enum:{}},
"288":{desc:"MDEntryBuyer", enum:{}},
"289":{desc:"MDEntrySeller", enum:{}},
"290":{desc:"MDEntryPositionNo", enum:{}},
"291":{desc:"FinancialStatus", enum:{1:"BANKRUPT",2:"PENDING_DELISTING"}},
"292":{desc:"CorporateAction", enum:{A:"EX_DIVIDEND",B:"EX_DISTRIBUTION",C:"EX_RIGHTS",D:"NEW",E:"EX_INTEREST"}},
"293":{desc:"DefBidSize", enum:{}},
"294":{desc:"DefOfferSize", enum:{}},
"295":{desc:"NoQuoteEntries", enum:{}},
"296":{desc:"NoQuoteSets", enum:{}},
"297":{desc:"QuoteStatus", enum:{0:"ACCEPTED",1:"CANCELED_FOR_SYMBOL",2:"CANCELED_FOR_SECURITY_TYPE",3:"CANCELED_FOR_UNDERLYING",4:"CANCELED_ALL",5:"REJECTED",6:"REMOVED_FROM_MARKET",7:"EXPIRED",8:"QUERY",9:"QUOTE_NOT_FOUND",10:"PENDING",11:"PASS",12:"LOCKED_MARKET_WARNING",13:"CROSS_MARKET_WARNING",14:"CANCELED_DUE_TO_LOCK_MARKET",15:"CANCELED_DUE_TO_CROSS_MARKET"}},
"298":{desc:"QuoteCancelType", enum:{1:"CANCEL_FOR_SYMBOL",2:"CANCEL_FOR_SECURITY_TYPE",3:"CANCEL_FOR_UNDERLYING_SYMBOL",4:"CANCEL_ALL_QUOTES"}},
"299":{desc:"QuoteEntryID", enum:{}},
"300":{desc:"QuoteRejectReason", enum:{1:"UNKNOWN_SYMBOL",2:"EXCHANGE_CLOSED",3:"QUOTE_REQUEST_EXCEEDS_LIMIT",4:"TOO_LATE_TO_ENTER",5:"UNKNOWN_QUOTE",6:"DUPLICATE_QUOTE",7:"INVALID_BID_ASK_SPREAD",8:"INVALID_PRICE",9:"NOT_AUTHORIZED_TO_QUOTE_SECURITY"}},
"301":{desc:"QuoteResponseLevel", enum:{0:"NO_ACKNOWLEDGEMENT",1:"ACKNOWLEDGE_ONLY_NEGATIVE_OR_ERRONEOUS_QUOTES",2:"ACKNOWLEDGE_EACH_QUOTE_MESSAGES"}},
"302":{desc:"QuoteSetID", enum:{}},
"303":{desc:"QuoteRequestType", enum:{1:"MANUAL",2:"AUTOMATIC"}},
"304":{desc:"TotNoQuoteEntries", enum:{}},
"305":{desc:"UnderlyingSecurityIDSource", enum:{}},
"306":{desc:"UnderlyingIssuer", enum:{}},
"307":{desc:"UnderlyingSecurityDesc", enum:{}},
"308":{desc:"UnderlyingSecurityExchange", enum:{}},
"309":{desc:"UnderlyingSecurityID", enum:{}},
"310":{desc:"UnderlyingSecurityType", enum:{}},
"311":{desc:"UnderlyingSymbol", enum:{}},
"312":{desc:"UnderlyingSymbolSfx", enum:{}},
"313":{desc:"UnderlyingMaturityMonthYear", enum:{}},
"316":{desc:"UnderlyingStrikePrice", enum:{}},
"317":{desc:"UnderlyingOptAttribute", enum:{}},
"318":{desc:"UnderlyingCurrency", enum:{}},
"320":{desc:"SecurityReqID", enum:{}},
"321":{desc:"SecurityRequestType", enum:{0:"REQUEST_SECURITY_IDENTITY_AND_SPECIFICATIONS",1:"REQUEST_SECURITY_IDENTITY_FOR_THE_SPECIFICATIONS_PROVIDED",2:"REQUEST_LIST_SECURITY_TYPES",3:"REQUEST_LIST_SECURITIES"}},
"322":{desc:"SecurityResponseID", enum:{}},
"323":{desc:"SecurityResponseType", enum:{1:"ACCEPT_SECURITY_PROPOSAL_AS_IS",2:"ACCEPT_SECURITY_PROPOSAL_WITH_REVISIONS_AS_INDICATED_IN_THE_MESSAGE",3:"LIST_OF_SECURITY_TYPES_RETURNED_PER_REQUEST",4:"LIST_OF_SECURITIES_RETURNED_PER_REQUEST",5:"REJECT_SECURITY_PROPOSAL",6:"CAN_NOT_MATCH_SELECTION_CRITERIA"}},
"324":{desc:"SecurityStatusReqID", enum:{}},
"325":{desc:"UnsolicitedIndicator", enum:{}},
"326":{desc:"SecurityTradingStatus", enum:{1:"OPENING_DELAY",2:"TRADING_HALT",3:"RESUME",4:"NO_OPEN_NO_RESUME",5:"PRICE_INDICATION",6:"TRADING_RANGE_INDICATION",7:"MARKET_IMBALANCE_BUY",8:"MARKET_IMBALANCE_SELL",9:"MARKET_ON_CLOSE_IMBALANCE_BUY",10:"MARKET_ON_CLOSE_IMBALANCE_SELL",11:"NOT_ASSIGNED",12:"NO_MARKET_IMBALANCE",13:"NO_MARKET_ON_CLOSE_IMBALANCE",14:"ITS_PRE_OPENING",15:"NEW_PRICE_INDICATION",16:"TRADE_DISSEMINATION_TIME",17:"READY_TO_TRADE_START_OF_SESSION",18:"NOT_AVAILABLE_FOR_TRADING_END_OF_SESSION",19:"NOT_TRADED_ON_THIS_MARKET",20:"UNKNOWN_OR_INVALID",21:"PRE_OPEN",22:"OPENING_ROTATION",23:"FAST_MARKET"}},
"327":{desc:"HaltReason", enum:{I:"ORDER_IMBALANCE",X:"EQUIPMENT_CHANGEOVER",P:"NEWS_PENDING",D:"NEWS_DISSEMINATION",E:"ORDER_INFLUX",M:"ADDITIONAL_INFORMATION"}},
"328":{desc:"InViewOfCommon", enum:{}},
"329":{desc:"DueToRelated", enum:{}},
"330":{desc:"BuyVolume", enum:{}},
"331":{desc:"SellVolume", enum:{}},
"332":{desc:"HighPx", enum:{}},
"333":{desc:"LowPx", enum:{}},
"334":{desc:"Adjustment", enum:{1:"CANCEL",2:"ERROR",3:"CORRECTION"}},
"335":{desc:"TradSesReqID", enum:{}},
"336":{desc:"TradingSessionID", enum:{}},
"337":{desc:"ContraTrader", enum:{}},
"338":{desc:"TradSesMethod", enum:{1:"ELECTRONIC",2:"OPEN_OUTCRY",3:"TWO_PARTY"}},
"339":{desc:"TradSesMode", enum:{1:"TESTING",2:"SIMULATED",3:"PRODUCTION"}},
"340":{desc:"TradSesStatus", enum:{0:"UNKNOWN",1:"HALTED",2:"OPEN",3:"CLOSED",4:"PRE_OPEN",5:"PRE_CLOSE",6:"REQUEST_REJECTED"}},
"341":{desc:"TradSesStartTime", enum:{}},
"342":{desc:"TradSesOpenTime", enum:{}},
"343":{desc:"TradSesPreCloseTime", enum:{}},
"344":{desc:"TradSesCloseTime", enum:{}},
"345":{desc:"TradSesEndTime", enum:{}},
"346":{desc:"NumberOfOrders", enum:{}},
"347":{desc:"MessageEncoding", enum:{"ISO-2022-JP":"ISO_2022_JP","EUC-JP":"EUC_JP","SHIFT_JIS":"SHIFT_JIS","UTF-8":"UTF_8"}},
"348":{desc:"EncodedIssuerLen", enum:{}},
"349":{desc:"EncodedIssuer", enum:{}},
"350":{desc:"EncodedSecurityDescLen", enum:{}},
"351":{desc:"EncodedSecurityDesc", enum:{}},
"352":{desc:"EncodedListExecInstLen", enum:{}},
"353":{desc:"EncodedListExecInst", enum:{}},
"354":{desc:"EncodedTextLen", enum:{}},
"355":{desc:"EncodedText", enum:{}},
"356":{desc:"EncodedSubjectLen", enum:{}},
"357":{desc:"EncodedSubject", enum:{}},
"358":{desc:"EncodedHeadlineLen", enum:{}},
"359":{desc:"EncodedHeadline", enum:{}},
"360":{desc:"EncodedAllocTextLen", enum:{}},
"361":{desc:"EncodedAllocText", enum:{}},
"362":{desc:"EncodedUnderlyingIssuerLen", enum:{}},
"363":{desc:"EncodedUnderlyingIssuer", enum:{}},
"364":{desc:"EncodedUnderlyingSecurityDescLen", enum:{}},
"365":{desc:"EncodedUnderlyingSecurityDesc", enum:{}},
"366":{desc:"AllocPrice", enum:{}},
"367":{desc:"QuoteSetValidUntilTime", enum:{}},
"368":{desc:"QuoteEntryRejectReason", enum:{1:"UNKNOWN_SYMBOL",2:"EXCHANGE_CLOSED",3:"QUOTE_EXCEEDS_LIMIT",4:"TOO_LATE_TO_ENTER",5:"UNKNOWN_QUOTE",6:"DUPLICATE_QUOTE",7:"INVALID_BID_ASK_SPREAD",8:"INVALID_PRICE",9:"NOT_AUTHORIZED_TO_QUOTE_SECURITY"}},
"369":{desc:"LastMsgSeqNumProcessed", enum:{}},
"371":{desc:"RefTagID", enum:{}},
"372":{desc:"RefMsgType", enum:{}},
"373":{desc:"SessionRejectReason", enum:{0:"INVALID_TAG_NUMBER",1:"REQUIRED_TAG_MISSING",2:"TAG_NOT_DEFINED_FOR_THIS_MESSAGE_TYPE",3:"UNDEFINED_TAG",4:"TAG_SPECIFIED_WITHOUT_A_VALUE",5:"VALUE_IS_INCORRECT",6:"INCORRECT_DATA_FORMAT_FOR_VALUE",7:"DECRYPTION_PROBLEM",8:"SIGNATURE_PROBLEM",9:"COMPID_PROBLEM",10:"SENDINGTIME_ACCURACY_PROBLEM",11:"INVALID_MSGTYPE",12:"XML_VALIDATION_ERROR",13:"TAG_APPEARS_MORE_THAN_ONCE",14:"TAG_SPECIFIED_OUT_OF_REQUIRED_ORDER",15:"REPEATING_GROUP_FIELDS_OUT_OF_ORDER",16:"INCORRECT_NUMINGROUP_COUNT_FOR_REPEATING_GROUP",17:"NON_DATA_VALUE_INCLUDES_FIELD_DELIMITER",99:"OTHER"}},
"374":{desc:"BidRequestTransType", enum:{N:"NEW",C:"CANCEL"}},
"375":{desc:"ContraBroker", enum:{}},
"376":{desc:"ComplianceID", enum:{}},
"377":{desc:"SolicitedFlag", enum:{}},
"378":{desc:"ExecRestatementReason", enum:{0:"GT_CORPORATE_ACTION",1:"GT_RENEWAL_RESTATEMENT",2:"VERBAL_CHANGE",3:"REPRICING_OF_ORDER",4:"BROKER_OPTION",5:"PARTIAL_DECLINE_OF_ORDERQTY",6:"CANCEL_ON_TRADING_HALT",7:"CANCEL_ON_SYSTEM_FAILURE",8:"MARKET_OPTION",9:"CANCELED_NOT_BEST"}},
"379":{desc:"BusinessRejectRefID", enum:{}},
"380":{desc:"BusinessRejectReason", enum:{0:"OTHER",1:"UNKOWN_ID",2:"UNKNOWN_SECURITY",3:"UNSUPPORTED_MESSAGE_TYPE",4:"APPLICATION_NOT_AVAILABLE",5:"CONDITIONALLY_REQUIRED_FIELD_MISSING",6:"NOT_AUTHORIZED",7:"DELIVERTO_FIRM_NOT_AVAILABLE_AT_THIS_TIME"}},
"381":{desc:"GrossTradeAmt", enum:{}},
"382":{desc:"NoContraBrokers", enum:{}},
"383":{desc:"MaxMessageSize", enum:{}},
"384":{desc:"NoMsgTypes", enum:{}},
"385":{desc:"MsgDirection", enum:{S:"SEND",R:"RECEIVE"}},
"386":{desc:"NoTradingSessions", enum:{}},
"387":{desc:"TotalVolumeTraded", enum:{}},
"388":{desc:"DiscretionInst", enum:{0:"RELATED_TO_DISPLAYED_PRICE",1:"RELATED_TO_MARKET_PRICE",2:"RELATED_TO_PRIMARY_PRICE",3:"RELATED_TO_LOCAL_PRIMARY_PRICE",4:"RELATED_TO_MIDPOINT_PRICE",5:"RELATED_TO_LAST_TRADE_PRICE",6:"RELATED_TO_VWAP"}},
"389":{desc:"DiscretionOffsetValue", enum:{}},
"390":{desc:"BidID", enum:{}},
"391":{desc:"ClientBidID", enum:{}},
"392":{desc:"ListName", enum:{}},
"393":{desc:"TotNoRelatedSym", enum:{}},
"394":{desc:"BidType", enum:{1:"NON_DISCLOSED",2:"DISCLOSED_STYLE",3:"NO_BIDDING_PROCESS"}},
"395":{desc:"NumTickets", enum:{}},
"396":{desc:"SideValue1", enum:{}},
"397":{desc:"SideValue2", enum:{}},
"398":{desc:"NoBidDescriptors", enum:{}},
"399":{desc:"BidDescriptorType", enum:{1:"SECTOR",2:"COUNTRY",3:"INDEX"}},
"400":{desc:"BidDescriptor", enum:{}},
"401":{desc:"SideValueInd", enum:{1:"SIDEVALUE1",2:"SIDEVALUE2"}},
"402":{desc:"LiquidityPctLow", enum:{}},
"403":{desc:"LiquidityPctHigh", enum:{}},
"404":{desc:"LiquidityValue", enum:{}},
"405":{desc:"EFPTrackingError", enum:{}},
"406":{desc:"FairValue", enum:{}},
"407":{desc:"OutsideIndexPct", enum:{}},
"408":{desc:"ValueOfFutures", enum:{}},
"409":{desc:"LiquidityIndType", enum:{1:"FIVEDAY_MOVING_AVERAGE",2:"TWENTYDAY_MOVING_AVERAGE",3:"NORMAL_MARKET_SIZE",4:"OTHER"}},
"410":{desc:"WtAverageLiquidity", enum:{}},
"411":{desc:"ExchangeForPhysical", enum:{}},
"412":{desc:"OutMainCntryUIndex", enum:{}},
"413":{desc:"CrossPercent", enum:{}},
"414":{desc:"ProgRptReqs", enum:{1:"BUYSIDE_EXPLICITLY_REQUESTS_STATUS_USING_STATUSREQUEST",2:"SELLSIDE_PERIODICALLY_SENDS_STATUS_USING_LISTSTATUS",3:"REAL_TIME_EXECUTION_REPORTS"}},
"415":{desc:"ProgPeriodInterval", enum:{}},
"416":{desc:"IncTaxInd", enum:{1:"NET",2:"GROSS"}},
"417":{desc:"NumBidders", enum:{}},
"418":{desc:"BidTradeType", enum:{R:"RISK_TRADE",G:"VWAP_GUARANTEE",A:"AGENCY",J:"GUARANTEED_CLOSE"}},
"419":{desc:"BasisPxType", enum:{2:"CLOSING_PRICE_AT_MORNING_SESSION",3:"CLOSING_PRICE",4:"CURRENT_PRICE",5:"SQ",6:"VWAP_THROUGH_A_DAY",7:"VWAP_THROUGH_A_MORNING_SESSION",8:"VWAP_THROUGH_AN_AFTERNOON_SESSION",9:"VWAP_THROUGH_A_DAY_EXCEPT_YORI",A:"VWAP_THROUGH_A_MORNING_SESSION_EXCEPT_YORI",B:"VWAP_THROUGH_AN_AFTERNOON_SESSION_EXCEPT_YORI",C:"STRIKE",D:"OPEN",Z:"OTHERS"}},
"420":{desc:"NoBidComponents", enum:{}},
"421":{desc:"Country", enum:{}},
"422":{desc:"TotNoStrikes", enum:{}},
"423":{desc:"PriceType", enum:{1:"PERCENTAGE",2:"PER_UNIT",3:"FIXED_AMOUNT",4:"DISCOUNT",5:"PREMIUM",6:"SPREAD",7:"TED_PRICE",8:"TED_YIELD",9:"YIELD"}},
"424":{desc:"DayOrderQty", enum:{}},
"425":{desc:"DayCumQty", enum:{}},
"426":{desc:"DayAvgPx", enum:{}},
"427":{desc:"GTBookingInst", enum:{0:"BOOK_OUT_ALL_TRADES_ON_DAY_OF_EXECUTION",1:"ACCUMULATE_EXECUTIONS_UNTIL_ORDER_IS_FILLED_OR_EXPIRES",2:"ACCUMULATE_UNTIL_VERBALLY_NOTIFIED_OTHERWISE"}},
"428":{desc:"NoStrikes", enum:{}},
"429":{desc:"ListStatusType", enum:{1:"ACK",2:"RESPONSE",3:"TIMED",4:"EXECSTARTED",5:"ALLDONE",6:"ALERT"}},
"430":{desc:"NetGrossInd", enum:{1:"NET",2:"GROSS"}},
"431":{desc:"ListOrderStatus", enum:{1:"INBIDDINGPROCESS",2:"RECEIVEDFOREXECUTION",3:"EXECUTING",4:"CANCELING",5:"ALERT",6:"ALL_DONE",7:"REJECT"}},
"432":{desc:"ExpireDate", enum:{}},
"433":{desc:"ListExecInstType", enum:{1:"IMMEDIATE",2:"WAIT_FOR_EXECUTE_INSTRUCTION",3:"EXCHANGE_SWITCH_CIV_ORDER_SELL_DRIVEN",4:"EXCHANGE_SWITCH_CIV_ORDER_BUY_DRIVEN_CASH_TOP_UP",5:"EXCHANGE_SWITCH_CIV_ORDER_BUY_DRIVEN_CASH_WITHDRAW"}},
"434":{desc:"CxlRejResponseTo", enum:{1:"ORDER_CANCEL_REQUEST",2:"ORDER_CANCEL_REPLACE_REQUEST"}},
"435":{desc:"UnderlyingCouponRate", enum:{}},
"436":{desc:"UnderlyingContractMultiplier", enum:{}},
"437":{desc:"ContraTradeQty", enum:{}},
"438":{desc:"ContraTradeTime", enum:{}},
"441":{desc:"LiquidityNumSecurities", enum:{}},
"442":{desc:"MultiLegReportingType", enum:{1:"SINGLE_SECURITY",2:"INDIVIDUAL_LEG_OF_A_MULTI_LEG_SECURITY",3:"MULTI_LEG_SECURITY"}},
"443":{desc:"StrikeTime", enum:{}},
"444":{desc:"ListStatusText", enum:{}},
"445":{desc:"EncodedListStatusTextLen", enum:{}},
"446":{desc:"EncodedListStatusText", enum:{}},
"447":{desc:"PartyIDSource", enum:{B:"BIC",C:"GENERALLY_ACCEPTED_MARKET_PARTICIPANT_IDENTIFIER",D:"PROPRIETARY_CUSTOM_CODE",E:"ISO_COUNTRY_CODE",F:"SETTLEMENT_ENTITY_LOCATION",G:"MIC",H:"CSD_PARTICIPANT_MEMBER_CODE",1:"KOREAN_INVESTOR_ID",2:"TAIWANESE_QUALIFIED_FOREIGN_INVESTOR_ID_QFII_FID",3:"TAIWANESE_TRADING_ACCOUNT",4:"MALAYSIAN_CENTRAL_DEPOSITORY_NUMBER",5:"CHINESE_B_SHARE",6:"UK_NATIONAL_INSURANCE_OR_PENSION_NUMBER",7:"US_SOCIAL_SECURITY_NUMBER",8:"US_EMPLOYER_IDENTIFICATION_NUMBER",9:"AUSTRALIAN_BUSINESS_NUMBER",A:"AUSTRALIAN_TAX_FILE_NUMBER",I:"DIRECTED_BROKER"}},
"448":{desc:"PartyID", enum:{}},
"451":{desc:"NetChgPrevDay", enum:{}},
"452":{desc:"PartyRole", enum:{1:"EXECUTING_FIRM",2:"BROKER_OF_CREDIT",3:"CLIENT_ID",4:"CLEARING_FIRM",5:"INVESTOR_ID",6:"INTRODUCING_FIRM",7:"ENTERING_FIRM",8:"LOCATE_LENDING_FIRM",9:"FUND_MANAGER_CLIENT_ID",10:"SETTLEMENT_LOCATION",11:"ORDER_ORIGINATION_TRADER",12:"EXECUTING_TRADER",13:"ORDER_ORIGINATION_FIRM",14:"GIVEUP_CLEARING_FIRM",15:"CORRESPONDANT_CLEARING_FIRM",16:"EXECUTING_SYSTEM",17:"CONTRA_FIRM",18:"CONTRA_CLEARING_FIRM",19:"SPONSORING_FIRM",20:"UNDERLYING_CONTRA_FIRM",21:"CLEARING_ORGANIZATION",22:"EXCHANGE",24:"CUSTOMER_ACCOUNT",25:"CORRESPONDENT_CLEARING_ORGANIZATION",26:"CORRESPONDENT_BROKER",27:"BUYER_SELLER",28:"CUSTODIAN",29:"INTERMEDIARY",30:"AGENT",31:"SUB_CUSTODIAN",32:"BENEFICIARY",33:"INTERESTED_PARTY",34:"REGULATORY_BODY",35:"LIQUIDITY_PROVIDER",36:"ENTERING_TRADER",37:"CONTRA_TRADER",38:"POSITION_ACCOUNT"}},
"453":{desc:"NoPartyIDs", enum:{}},
"454":{desc:"NoSecurityAltID", enum:{}},
"455":{desc:"SecurityAltID", enum:{}},
"456":{desc:"SecurityAltIDSource", enum:{}},
"457":{desc:"NoUnderlyingSecurityAltID", enum:{}},
"458":{desc:"UnderlyingSecurityAltID", enum:{}},
"459":{desc:"UnderlyingSecurityAltIDSource", enum:{}},
"460":{desc:"Product", enum:{1:"AGENCY",2:"COMMODITY",3:"CORPORATE",4:"CURRENCY",5:"EQUITY",6:"GOVERNMENT",7:"INDEX",8:"LOAN",9:"MONEYMARKET",10:"MORTGAGE",11:"MUNICIPAL",12:"OTHER",13:"FINANCING"}},
"461":{desc:"CFICode", enum:{}},
"462":{desc:"UnderlyingProduct", enum:{}},
"463":{desc:"UnderlyingCFICode", enum:{}},
"464":{desc:"TestMessageIndicator", enum:{}},
"465":{desc:"QuantityType", enum:{1:"SHARES",2:"BONDS",3:"CURRENTFACE",4:"ORIGINALFACE",5:"CURRENCY",6:"CONTRACTS",7:"OTHER",8:"PAR"}},
"466":{desc:"BookingRefID", enum:{}},
"467":{desc:"IndividualAllocID", enum:{}},
"468":{desc:"RoundingDirection", enum:{0:"ROUND_TO_NEAREST",1:"ROUND_DOWN",2:"ROUND_UP"}},
"469":{desc:"RoundingModulus", enum:{}},
"470":{desc:"CountryOfIssue", enum:{}},
"471":{desc:"StateOrProvinceOfIssue", enum:{}},
"472":{desc:"LocaleOfIssue", enum:{}},
"473":{desc:"NoRegistDtls", enum:{}},
"474":{desc:"MailingDtls", enum:{}},
"475":{desc:"InvestorCountryOfResidence", enum:{}},
"476":{desc:"PaymentRef", enum:{}},
"477":{desc:"DistribPaymentMethod", enum:{1:"CREST",2:"NSCC",3:"EUROCLEAR",4:"CLEARSTREAM",5:"CHEQUE",6:"TELEGRAPHIC_TRANSFER",7:"FEDWIRE",8:"DIRECT_CREDIT",9:"ACH_CREDIT"}},
"478":{desc:"CashDistribCurr", enum:{}},
"479":{desc:"CommCurrency", enum:{}},
"480":{desc:"CancellationRights", enum:{N:"NO_EXECUTION_ONLY",M:"NO_WAIVER_AGREEMENT",O:"NO_INSTITUTIONAL"}},
"481":{desc:"MoneyLaunderingStatus", enum:{Y:"PASSED",N:"NOT_CHECKED",1:"EXEMPT_BELOW_THE_LIMIT",2:"EXEMPT_CLIENT_MONEY_TYPE_EXEMPTION",3:"EXEMPT_AUTHORISED_CREDIT_OR_FINANCIAL_INSTITUTION"}},
"482":{desc:"MailingInst", enum:{}},
"483":{desc:"TransBkdTime", enum:{}},
"484":{desc:"ExecPriceType", enum:{B:"BID_PRICE",C:"CREATION_PRICE",D:"CREATION_PRICE_PLUS_ADJUSTMENT_PERCENT",E:"CREATION_PRICE_PLUS_ADJUSTMENT_AMOUNT",O:"OFFER_PRICE",P:"OFFER_PRICE_MINUS_ADJUSTMENT_PERCENT",Q:"OFFER_PRICE_MINUS_ADJUSTMENT_AMOUNT",S:"SINGLE_PRICE"}},
"485":{desc:"ExecPriceAdjustment", enum:{}},
"486":{desc:"DateOfBirth", enum:{}},
"487":{desc:"TradeReportTransType", enum:{0:"NEW",1:"CANCEL",2:"REPLACE",3:"RELEASE",4:"REVERSE"}},
"488":{desc:"CardHolderName", enum:{}},
"489":{desc:"CardNumber", enum:{}},
"490":{desc:"CardExpDate", enum:{}},
"491":{desc:"CardIssNum", enum:{}},
"492":{desc:"PaymentMethod", enum:{1:"CREST",2:"NSCC",3:"EUROCLEAR",4:"CLEARSTREAM",5:"CHEQUE",6:"TELEGRAPHIC_TRANSFER",7:"FEDWIRE",8:"DEBIT_CARD",9:"DIRECT_DEBIT"}},
"493":{desc:"RegistAcctType", enum:{}},
"494":{desc:"Designation", enum:{}},
"495":{desc:"TaxAdvantageType", enum:{0:"NONE",1:"MAXI_ISA",2:"TESSA",3:"MINI_CASH_ISA",4:"MINI_STOCKS_AND_SHARES_ISA",5:"MINI_INSURANCE_ISA",6:"CURRENT_YEAR_PAYMENT",7:"PRIOR_YEAR_PAYMENT",8:"ASSET_TRANSFER",9:"EMPLOYEE_PRIOR_YEAR",999:"OTHER"}},
"496":{desc:"RegistRejReasonText", enum:{}},
"497":{desc:"FundRenewWaiv", enum:{Y:"YES",N:"NO"}},
"498":{desc:"CashDistribAgentName", enum:{}},
"499":{desc:"CashDistribAgentCode", enum:{}},
"500":{desc:"CashDistribAgentAcctNumber", enum:{}},
"501":{desc:"CashDistribPayRef", enum:{}},
"502":{desc:"CashDistribAgentAcctName", enum:{}},
"503":{desc:"CardStartDate", enum:{}},
"504":{desc:"PaymentDate", enum:{}},
"505":{desc:"PaymentRemitterID", enum:{}},
"506":{desc:"RegistStatus", enum:{A:"ACCEPTED",R:"REJECTED",H:"HELD",N:"REMINDER"}},
"507":{desc:"RegistRejReasonCode", enum:{1:"INVALID_UNACCEPTABLE_ACCOUNT_TYPE",2:"INVALID_UNACCEPTABLE_TAX_EXEMPT_TYPE",3:"INVALID_UNACCEPTABLE_OWNERSHIP_TYPE",4:"INVALID_UNACCEPTABLE_NO_REG_DETLS",5:"INVALID_UNACCEPTABLE_REG_SEQ_NO",6:"INVALID_UNACCEPTABLE_REG_DTLS",7:"INVALID_UNACCEPTABLE_MAILING_DTLS",8:"INVALID_UNACCEPTABLE_MAILING_INST",9:"INVALID_UNACCEPTABLE_INVESTOR_ID",10:"INVALID_UNACCEPTABLE_INVESTOR_ID_SOURCE",11:"INVALID_UNACCEPTABLE_DATE_OF_BIRTH",12:"INVALID_UNACCEPTABLE_INVESTOR_COUNTRY_OF_RESIDENCE",13:"INVALID_UNACCEPTABLE_NODISTRIBINSTNS",14:"INVALID_UNACCEPTABLE_DISTRIB_PERCENTAGE",15:"INVALID_UNACCEPTABLE_DISTRIB_PAYMENT_METHOD",16:"INVALID_UNACCEPTABLE_CASH_DISTRIB_AGENT_ACCT_NAME",17:"INVALID_UNACCEPTABLE_CASH_DISTRIB_AGENT_CODE",18:"INVALID_UNACCEPTABLE_CASH_DISTRIB_AGENT_ACCT_NUM",99:"OTHER"}},
"508":{desc:"RegistRefID", enum:{}},
"509":{desc:"RegistDtls", enum:{}},
"510":{desc:"NoDistribInsts", enum:{}},
"511":{desc:"RegistEmail", enum:{}},
"512":{desc:"DistribPercentage", enum:{}},
"513":{desc:"RegistID", enum:{}},
"514":{desc:"RegistTransType", enum:{0:"NEW",1:"REPLACE",2:"CANCEL"}},
"515":{desc:"ExecValuationPoint", enum:{}},
"516":{desc:"OrderPercent", enum:{}},
"517":{desc:"OwnershipType", enum:{J:"JOINT_INVESTORS",T:"TENANTS_IN_COMMON",2:"JOINT_TRUSTEES"}},
"518":{desc:"NoContAmts", enum:{}},
"519":{desc:"ContAmtType", enum:{1:"COMMISSION_AMOUNT",2:"COMMISSION_PERCENT",3:"INITIAL_CHARGE_AMOUNT",4:"INITIAL_CHARGE_PERCENT",5:"DISCOUNT_AMOUNT",6:"DISCOUNT_PERCENT",7:"DILUTION_LEVY_AMOUNT",8:"DILUTION_LEVY_PERCENT",9:"EXIT_CHARGE_AMOUNT"}},
"520":{desc:"ContAmtValue", enum:{}},
"521":{desc:"ContAmtCurr", enum:{}},
"522":{desc:"OwnerType", enum:{1:"INDIVIDUAL_INVESTOR",2:"PUBLIC_COMPANY",3:"PRIVATE_COMPANY",4:"INDIVIDUAL_TRUSTEE",5:"COMPANY_TRUSTEE",6:"PENSION_PLAN",7:"CUSTODIAN_UNDER_GIFTS_TO_MINORS_ACT",8:"TRUSTS",9:"FIDUCIARIES"}},
"523":{desc:"PartySubID", enum:{}},
"524":{desc:"NestedPartyID", enum:{}},
"525":{desc:"NestedPartyIDSource", enum:{}},
"526":{desc:"SecondaryClOrdID", enum:{}},
"527":{desc:"SecondaryExecID", enum:{}},
"528":{desc:"OrderCapacity", enum:{A:"AGENCY",G:"PROPRIETARY",I:"INDIVIDUAL",P:"PRINCIPAL",R:"RISKLESS_PRINCIPAL",W:"AGENT_FOR_OTHER_MEMBER"}},
"529":{desc:"OrderRestrictions", enum:{1:"PROGRAM_TRADE",2:"INDEX_ARBITRAGE",3:"NON_INDEX_ARBITRAGE",4:"COMPETING_MARKET_MAKER",5:"ACTING_AS_MARKET_MAKER_OR_SPECIALIST_IN_THE_SECURITY",6:"ACTING_AS_MARKET_MAKER_OR_SPECIALIST_IN_THE_UNDERLYING_SECURITY_OF_A_DERIVATIVE_SECURITY",7:"FOREIGN_ENTITY",8:"EXTERNAL_MARKET_PARTICIPANT",9:"EXTERNAL_INTER_CONNECTED_MARKET_LINKAGE",A:"RISKLESS_ARBITRAGE"}},
"530":{desc:"MassCancelRequestType", enum:{1:"CANCEL_ORDERS_FOR_A_SECURITY",2:"CANCEL_ORDERS_FOR_AN_UNDERLYING_SECURITY",3:"CANCEL_ORDERS_FOR_A_PRODUCT",4:"CANCEL_ORDERS_FOR_A_CFICODE",5:"CANCEL_ORDERS_FOR_A_SECURITYTYPE",6:"CANCEL_ORDERS_FOR_A_TRADING_SESSION",7:"CANCEL_ALL_ORDERS"}},
"531":{desc:"MassCancelResponse", enum:{0:"CANCEL_REQUEST_REJECTED",1:"CANCEL_ORDERS_FOR_A_SECURITY",2:"CANCEL_ORDERS_FOR_AN_UNDERLYING_SECURITY",3:"CANCEL_ORDERS_FOR_A_PRODUCT",4:"CANCEL_ORDERS_FOR_A_CFICODE",5:"CANCEL_ORDERS_FOR_A_SECURITYTYPE",6:"CANCEL_ORDERS_FOR_A_TRADING_SESSION",7:"CANCEL_ALL_ORDERS"}},
"532":{desc:"MassCancelRejectReason", enum:{0:"MASS_CANCEL_NOT_SUPPORTED",1:"INVALID_OR_UNKNOWN_SECURITY",2:"INVALID_OR_UNKNOWN_UNDERLYING",3:"INVALID_OR_UNKNOWN_PRODUCT",4:"INVALID_OR_UNKNOWN_CFICODE",5:"INVALID_OR_UNKNOWN_SECURITY_TYPE",6:"INVALID_OR_UNKNOWN_TRADING_SESSION"}},
"533":{desc:"TotalAffectedOrders", enum:{}},
"534":{desc:"NoAffectedOrders", enum:{}},
"535":{desc:"AffectedOrderID", enum:{}},
"536":{desc:"AffectedSecondaryOrderID", enum:{}},
"537":{desc:"QuoteType", enum:{0:"INDICATIVE",1:"TRADEABLE",2:"RESTRICTED_TRADEABLE",3:"COUNTER"}},
"538":{desc:"NestedPartyRole", enum:{}},
"539":{desc:"NoNestedPartyIDs", enum:{}},
"540":{desc:"TotalAccruedInterestAmt", enum:{}},
"541":{desc:"MaturityDate", enum:{}},
"542":{desc:"UnderlyingMaturityDate", enum:{}},
"543":{desc:"InstrRegistry", enum:{}},
"544":{desc:"CashMargin", enum:{1:"CASH",2:"MARGIN_OPEN",3:"MARGIN_CLOSE"}},
"545":{desc:"NestedPartySubID", enum:{}},
"546":{desc:"Scope", enum:{1:"LOCAL",2:"NATIONAL",3:"GLOBAL"}},
"547":{desc:"MDImplicitDelete", enum:{}},
"548":{desc:"CrossID", enum:{}},
"549":{desc:"CrossType", enum:{1:"CROSS_TRADE_WHICH_IS_EXECUTED_COMPLETELY_OR_NOT",2:"CROSS_TRADE_WHICH_IS_EXECUTED_PARTIALLY_AND_THE_REST_IS_CANCELLED",3:"CROSS_TRADE_WHICH_IS_PARTIALLY_EXECUTED_WITH_THE_UNFILLED_PORTIONS_REMAINING_ACTIVE",4:"CROSS_TRADE_IS_EXECUTED_WITH_EXISTING_ORDERS_WITH_THE_SAME_PRICE"}},
"550":{desc:"CrossPrioritization", enum:{0:"NONE",1:"BUY_SIDE_IS_PRIORITIZED",2:"SELL_SIDE_IS_PRIORITIZED"}},
"551":{desc:"OrigCrossID", enum:{}},
"552":{desc:"NoSides", enum:{1:"ONE_SIDE",2:"BOTH_SIDES"}},
"553":{desc:"Username", enum:{}},
"554":{desc:"Password", enum:{}},
"555":{desc:"NoLegs", enum:{}},
"556":{desc:"LegCurrency", enum:{}},
"557":{desc:"TotNoSecurityTypes", enum:{}},
"558":{desc:"NoSecurityTypes", enum:{}},
"559":{desc:"SecurityListRequestType", enum:{0:"SYMBOL",1:"SECURITYTYPE_AND_OR_CFICODE",2:"PRODUCT",3:"TRADINGSESSIONID",4:"ALL_SECURITIES"}},
"560":{desc:"SecurityRequestResult", enum:{0:"VALID_REQUEST",1:"INVALID_OR_UNSUPPORTED_REQUEST",2:"NO_INSTRUMENTS_FOUND_THAT_MATCH_SELECTION_CRITERIA",3:"NOT_AUTHORIZED_TO_RETRIEVE_INSTRUMENT_DATA",4:"INSTRUMENT_DATA_TEMPORARILY_UNAVAILABLE",5:"REQUEST_FOR_INSTRUMENT_DATA_NOT_SUPPORTED"}},
"561":{desc:"RoundLot", enum:{}},
"562":{desc:"MinTradeVol", enum:{}},
"563":{desc:"MultiLegRptTypeReq", enum:{0:"REPORT_BY_MULITLEG_SECURITY_ONLY",1:"REPORT_BY_MULTILEG_SECURITY_AND_BY_INSTRUMENT_LEGS_BELONGING_TO_THE_MULTILEG_SECURITY",2:"REPORT_BY_INSTRUMENT_LEGS_BELONGING_TO_THE_MULTILEG_SECURITY_ONLY"}},
"564":{desc:"LegPositionEffect", enum:{}},
"565":{desc:"LegCoveredOrUncovered", enum:{}},
"566":{desc:"LegPrice", enum:{}},
"567":{desc:"TradSesStatusRejReason", enum:{1:"UNKNOWN_OR_INVALID_TRADINGSESSIONID"}},
"568":{desc:"TradeRequestID", enum:{}},
"569":{desc:"TradeRequestType", enum:{0:"ALL_TRADES",1:"MATCHED_TRADES_MATCHING_CRITERIA_PROVIDED_ON_REQUEST",2:"UNMATCHED_TRADES_THAT_MATCH_CRITERIA",3:"UNREPORTED_TRADES_THAT_MATCH_CRITERIA",4:"ADVISORIES_THAT_MATCH_CRITERIA"}},
"570":{desc:"PreviouslyReported", enum:{}},
"571":{desc:"TradeReportID", enum:{}},
"572":{desc:"TradeReportRefID", enum:{}},
"573":{desc:"MatchStatus", enum:{0:"COMPARED_MATCHED_OR_AFFIRMED",1:"UNCOMPARED_UNMATCHED_OR_UNAFFIRMED",2:"ADVISORY_OR_ALERT"}},
"574":{desc:"MatchType", enum:{}},
"575":{desc:"OddLot", enum:{}},
"576":{desc:"NoClearingInstructions", enum:{}},
"577":{desc:"ClearingInstruction", enum:{0:"PROCESS_NORMALLY",1:"EXCLUDE_FROM_ALL_NETTING",2:"BILATERAL_NETTING_ONLY",3:"EX_CLEARING",4:"SPECIAL_TRADE",5:"MULTILATERAL_NETTING",6:"CLEAR_AGAINST_CENTRAL_COUNTERPARTY",7:"EXCLUDE_FROM_CENTRAL_COUNTERPARTY",8:"MANUAL_MODE",9:"AUTOMATIC_POSTING_MODE"}},
"578":{desc:"TradeInputSource", enum:{}},
"579":{desc:"TradeInputDevice", enum:{}},
"580":{desc:"NoDates", enum:{}},
"581":{desc:"AccountType", enum:{1:"ACCOUNT_IS_CARRIED_ON_CUSTOMER_SIDE_OF_BOOKS",2:"ACCOUNT_IS_CARRIED_ON_NON_CUSTOMER_SIDE_OF_BOOKS",3:"HOUSE_TRADER",4:"FLOOR_TRADER",6:"ACCOUNT_IS_CARRIED_ON_NON_CUSTOMER_SIDE_OF_BOOKS_AND_IS_CROSS_MARGINED",7:"ACCOUNT_IS_HOUSE_TRADER_AND_IS_CROSS_MARGINED",8:"JOINT_BACKOFFICE_ACCOUNT"}},
"582":{desc:"CustOrderCapacity", enum:{1:"MEMBER_TRADING_FOR_THEIR_OWN_ACCOUNT",2:"CLEARING_FIRM_TRADING_FOR_ITS_PROPRIETARY_ACCOUNT",3:"MEMBER_TRADING_FOR_ANOTHER_MEMBER",4:"ALL_OTHER"}},
"583":{desc:"ClOrdLinkID", enum:{}},
"584":{desc:"MassStatusReqID", enum:{}},
"585":{desc:"MassStatusReqType", enum:{1:"STATUS_FOR_ORDERS_FOR_A_SECURITY",2:"STATUS_FOR_ORDERS_FOR_AN_UNDERLYING_SECURITY",3:"STATUS_FOR_ORDERS_FOR_A_PRODUCT",4:"STATUS_FOR_ORDERS_FOR_A_CFICODE",5:"STATUS_FOR_ORDERS_FOR_A_SECURITYTYPE",6:"STATUS_FOR_ORDERS_FOR_A_TRADING_SESSION",7:"STATUS_FOR_ALL_ORDERS",8:"STATUS_FOR_ORDERS_FOR_A_PARTYID"}},
"586":{desc:"OrigOrdModTime", enum:{}},
"587":{desc:"LegSettlType", enum:{}},
"588":{desc:"LegSettlDate", enum:{}},
"589":{desc:"DayBookingInst", enum:{0:"CAN_TRIGGER_BOOKING_WITHOUT_REFERENCE_TO_THE_ORDER_INITIATOR",1:"SPEAK_WITH_ORDER_INITIATOR_BEFORE_BOOKING",2:"ACCUMULATE"}},
"590":{desc:"BookingUnit", enum:{0:"EACH_PARTIAL_EXECUTION_IS_A_BOOKABLE_UNIT",1:"AGGREGATE_PARTIAL_EXECUTIONS_ON_THIS_ORDER_AND_BOOK_ONE_TRADE_PER_ORDER",2:"AGGREGATE_EXECUTIONS_FOR_THIS_SYMBOL_SIDE_AND_SETTLEMENT_DATE"}},
"591":{desc:"PreallocMethod", enum:{0:"PRO_RATA",1:"DO_NOT_PRO_RATA"}},
"592":{desc:"UnderlyingCountryOfIssue", enum:{}},
"593":{desc:"UnderlyingStateOrProvinceOfIssue", enum:{}},
"594":{desc:"UnderlyingLocaleOfIssue", enum:{}},
"595":{desc:"UnderlyingInstrRegistry", enum:{}},
"596":{desc:"LegCountryOfIssue", enum:{}},
"597":{desc:"LegStateOrProvinceOfIssue", enum:{}},
"598":{desc:"LegLocaleOfIssue", enum:{}},
"599":{desc:"LegInstrRegistry", enum:{}},
"600":{desc:"LegSymbol", enum:{}},
"601":{desc:"LegSymbolSfx", enum:{}},
"602":{desc:"LegSecurityID", enum:{}},
"603":{desc:"LegSecurityIDSource", enum:{}},
"604":{desc:"NoLegSecurityAltID", enum:{}},
"605":{desc:"LegSecurityAltID", enum:{}},
"606":{desc:"LegSecurityAltIDSource", enum:{}},
"607":{desc:"LegProduct", enum:{}},
"608":{desc:"LegCFICode", enum:{}},
"609":{desc:"LegSecurityType", enum:{}},
"610":{desc:"LegMaturityMonthYear", enum:{}},
"611":{desc:"LegMaturityDate", enum:{}},
"612":{desc:"LegStrikePrice", enum:{}},
"613":{desc:"LegOptAttribute", enum:{}},
"614":{desc:"LegContractMultiplier", enum:{}},
"615":{desc:"LegCouponRate", enum:{}},
"616":{desc:"LegSecurityExchange", enum:{}},
"617":{desc:"LegIssuer", enum:{}},
"618":{desc:"EncodedLegIssuerLen", enum:{}},
"619":{desc:"EncodedLegIssuer", enum:{}},
"620":{desc:"LegSecurityDesc", enum:{}},
"621":{desc:"EncodedLegSecurityDescLen", enum:{}},
"622":{desc:"EncodedLegSecurityDesc", enum:{}},
"623":{desc:"LegRatioQty", enum:{}},
"624":{desc:"LegSide", enum:{}},
"625":{desc:"TradingSessionSubID", enum:{}},
"626":{desc:"AllocType", enum:{1:"CALCULATED",2:"PRELIMINARY",5:"READY_TO_BOOK_SINGLE_ORDER",7:"WAREHOUSE_INSTRUCTION",8:"REQUEST_TO_INTERMEDIARY"}},
"627":{desc:"NoHops", enum:{}},
"628":{desc:"HopCompID", enum:{}},
"629":{desc:"HopSendingTime", enum:{}},
"630":{desc:"HopRefID", enum:{}},
"631":{desc:"MidPx", enum:{}},
"632":{desc:"BidYield", enum:{}},
"633":{desc:"MidYield", enum:{}},
"634":{desc:"OfferYield", enum:{}},
"635":{desc:"ClearingFeeIndicator", enum:{B:"CBOE_MEMBER",C:"NON_MEMBER_AND_CUSTOMER",E:"EQUITY_MEMBER_AND_CLEARING_MEMBER",F:"FULL_AND_ASSOCIATE_MEMBER_TRADING_FOR_OWN_ACCOUNT_AND_AS_FLOOR_BROKERS",H:"FIRMS_106H_AND_106J",I:"GIM_IDEM_AND_COM_MEMBERSHIP_INTEREST_HOLDERS",L:"LESSEE_AND_106F_EMPLOYEES",M:"ALL_OTHER_OWNERSHIP_TYPES"}},
"636":{desc:"WorkingIndicator", enum:{}},
"637":{desc:"LegLastPx", enum:{}},
"638":{desc:"PriorityIndicator", enum:{0:"PRIORITY_UNCHANGED",1:"LOST_PRIORITY_AS_RESULT_OF_ORDER_CHANGE"}},
"639":{desc:"PriceImprovement", enum:{}},
"640":{desc:"Price2", enum:{}},
"641":{desc:"LastForwardPoints2", enum:{}},
"642":{desc:"BidForwardPoints2", enum:{}},
"643":{desc:"OfferForwardPoints2", enum:{}},
"644":{desc:"RFQReqID", enum:{}},
"645":{desc:"MktBidPx", enum:{}},
"646":{desc:"MktOfferPx", enum:{}},
"647":{desc:"MinBidSize", enum:{}},
"648":{desc:"MinOfferSize", enum:{}},
"649":{desc:"QuoteStatusReqID", enum:{}},
"650":{desc:"LegalConfirm", enum:{}},
"651":{desc:"UnderlyingLastPx", enum:{}},
"652":{desc:"UnderlyingLastQty", enum:{}},
"654":{desc:"LegRefID", enum:{}},
"655":{desc:"ContraLegRefID", enum:{}},
"656":{desc:"SettlCurrBidFxRate", enum:{}},
"657":{desc:"SettlCurrOfferFxRate", enum:{}},
"658":{desc:"QuoteRequestRejectReason", enum:{1:"UNKNOWN_SYMBOL",2:"EXCHANGE_CLOSED",3:"QUOTE_REQUEST_EXCEEDS_LIMIT",4:"TOO_LATE_TO_ENTER",5:"INVALID_PRICE",6:"NOT_AUTHORIZED_TO_REQUEST_QUOTE",7:"NO_MATCH_FOR_INQUIRY",8:"NO_MARKET_FOR_INSTRUMENT",9:"NO_INVENTORY",10:"PASS",99:"OTHER"}},
"659":{desc:"SideComplianceID", enum:{}},
"660":{desc:"AcctIDSource", enum:{1:"BIC",2:"SID_CODE",3:"TFM",4:"OMGEO",5:"DTCC_CODE"}},
"661":{desc:"AllocAcctIDSource", enum:{}},
"662":{desc:"BenchmarkPrice", enum:{}},
"663":{desc:"BenchmarkPriceType", enum:{}},
"664":{desc:"ConfirmID", enum:{}},
"665":{desc:"ConfirmStatus", enum:{1:"RECEIVED",2:"MISMATCHED_ACCOUNT",3:"MISSING_SETTLEMENT_INSTRUCTIONS",4:"CONFIRMED",5:"REQUEST_REJECTED"}},
"666":{desc:"ConfirmTransType", enum:{0:"NEW",1:"REPLACE",2:"CANCEL"}},
"667":{desc:"ContractSettlMonth", enum:{}},
"668":{desc:"DeliveryForm", enum:{1:"BOOKENTRY",2:"BEARER"}},
"669":{desc:"LastParPx", enum:{}},
"670":{desc:"NoLegAllocs", enum:{}},
"671":{desc:"LegAllocAccount", enum:{}},
"672":{desc:"LegIndividualAllocID", enum:{}},
"673":{desc:"LegAllocQty", enum:{}},
"674":{desc:"LegAllocAcctIDSource", enum:{}},
"675":{desc:"LegSettlCurrency", enum:{}},
"676":{desc:"LegBenchmarkCurveCurrency", enum:{}},
"677":{desc:"LegBenchmarkCurveName", enum:{}},
"678":{desc:"LegBenchmarkCurvePoint", enum:{}},
"679":{desc:"LegBenchmarkPrice", enum:{}},
"680":{desc:"LegBenchmarkPriceType", enum:{}},
"681":{desc:"LegBidPx", enum:{}},
"682":{desc:"LegIOIQty", enum:{}},
"683":{desc:"NoLegStipulations", enum:{}},
"684":{desc:"LegOfferPx", enum:{}},
"685":{desc:"LegOrderQty", enum:{}},
"686":{desc:"LegPriceType", enum:{}},
"687":{desc:"LegQty", enum:{}},
"688":{desc:"LegStipulationType", enum:{}},
"689":{desc:"LegStipulationValue", enum:{}},
"690":{desc:"LegSwapType", enum:{1:"PAR_FOR_PAR",2:"MODIFIED_DURATION",4:"RISK",5:"PROCEEDS"}},
"691":{desc:"Pool", enum:{}},
"692":{desc:"QuotePriceType", enum:{1:"PERCENT",2:"PER_SHARE",3:"FIXED_AMOUNT",4:"DISCOUNT",5:"PREMIUM",6:"BASIS_POINTS_RELATIVE_TO_BENCHMARK",7:"TED_PRICE",8:"TED_YIELD",9:"YIELD_SPREAD"}},
"693":{desc:"QuoteRespID", enum:{}},
"694":{desc:"QuoteRespType", enum:{1:"HIT_LIFT",2:"COUNTER",3:"EXPIRED",4:"COVER",5:"DONE_AWAY",6:"PASS"}},
"695":{desc:"QuoteQualifier", enum:{}},
"696":{desc:"YieldRedemptionDate", enum:{}},
"697":{desc:"YieldRedemptionPrice", enum:{}},
"698":{desc:"YieldRedemptionPriceType", enum:{}},
"699":{desc:"BenchmarkSecurityID", enum:{}},
"700":{desc:"ReversalIndicator", enum:{}},
"701":{desc:"YieldCalcDate", enum:{}},
"702":{desc:"NoPositions", enum:{}},
"703":{desc:"PosType", enum:{TQ:"TRANSACTION_QUANTITY",IAS:"INTRA_SPREAD_QTY",IES:"INTER_SPREAD_QTY",FIN:"END_OF_DAY_QTY",SOD:"START_OF_DAY_QTY",EX:"OPTION_EXERCISE_QTY",AS:"OPTION_ASSIGNMENT",TX:"TRANSACTION_FROM_EXERCISE",TA:"TRANSACTION_FROM_ASSIGNMENT",PIT:"PIT_TRADE_QTY",TRF:"TRANSFER_TRADE_QTY",ETR:"ELECTRONIC_TRADE_QTY",ALC:"ALLOCATION_TRADE_QTY",PA:"ADJUSTMENT_QTY",ASF:"AS_OF_TRADE_QTY",DLV:"DELIVERY_QTY",TOT:"TOTAL_TRANSACTION_QTY",XM:"CROSS_MARGIN_QTY",SPL:"INTEGRAL_SPLIT"}},
"704":{desc:"LongQty", enum:{}},
"705":{desc:"ShortQty", enum:{}},
"706":{desc:"PosQtyStatus", enum:{0:"SUBMITTED",1:"ACCEPTED",2:"REJECTED"}},
"707":{desc:"PosAmtType", enum:{FMTM:"FINAL_MARK_TO_MARKET_AMOUNT",IMTM:"INCREMENTAL_MARK_TO_MARKET_AMOUNT",TVAR:"TRADE_VARIATION_AMOUNT",SMTM:"START_OF_DAY_MARK_TO_MARKET_AMOUNT",PREM:"PREMIUM_AMOUNT",CRES:"CASH_RESIDUAL_AMOUNT",CASH:"CASH_AMOUNT",VADJ:"VALUE_ADJUSTED_AMOUNT"}},
"708":{desc:"PosAmt", enum:{}},
"709":{desc:"PosTransType", enum:{1:"EXERCISE",2:"DO_NOT_EXERCISE",3:"POSITION_ADJUSTMENT",4:"POSITION_CHANGE_SUBMISSION_MARGIN_DISPOSITION",5:"PLEDGE"}},
"710":{desc:"PosReqID", enum:{}},
"711":{desc:"NoUnderlyings", enum:{}},
"712":{desc:"PosMaintAction", enum:{1:"NEW",2:"REPLACE",3:"CANCEL"}},
"713":{desc:"OrigPosReqRefID", enum:{}},
"714":{desc:"PosMaintRptRefID", enum:{}},
"715":{desc:"ClearingBusinessDate", enum:{}},
"716":{desc:"SettlSessID", enum:{}},
"717":{desc:"SettlSessSubID", enum:{}},
"718":{desc:"AdjustmentType", enum:{0:"PROCESS_REQUEST_AS_MARGIN_DISPOSITION",1:"DELTA_PLUS",2:"DELTA_MINUS",3:"FINAL"}},
"719":{desc:"ContraryInstructionIndicator", enum:{}},
"720":{desc:"PriorSpreadIndicator", enum:{}},
"721":{desc:"PosMaintRptID", enum:{}},
"722":{desc:"PosMaintStatus", enum:{0:"ACCEPTED",1:"ACCEPTED_WITH_WARNINGS",2:"REJECTED",3:"COMPLETED",4:"COMPLETED_WITH_WARNINGS"}},
"723":{desc:"PosMaintResult", enum:{0:"SUCCESSFUL_COMPLETION_NO_WARNINGS_OR_ERRORS",1:"REJECTED"}},
"724":{desc:"PosReqType", enum:{0:"POSITIONS",1:"TRADES",2:"EXERCISES",3:"ASSIGNMENTS"}},
"725":{desc:"ResponseTransportType", enum:{0:"INBAND",1:"OUT_OF_BAND"}},
"726":{desc:"ResponseDestination", enum:{}},
"727":{desc:"TotalNumPosReports", enum:{}},
"728":{desc:"PosReqResult", enum:{0:"VALID_REQUEST",1:"INVALID_OR_UNSUPPORTED_REQUEST",2:"NO_POSITIONS_FOUND_THAT_MATCH_CRITERIA",3:"NOT_AUTHORIZED_TO_REQUEST_POSITIONS",4:"REQUEST_FOR_POSITION_NOT_SUPPORTED",99:"OTHER"}},
"729":{desc:"PosReqStatus", enum:{0:"COMPLETED",1:"COMPLETED_WITH_WARNINGS",2:"REJECTED"}},
"730":{desc:"SettlPrice", enum:{}},
"731":{desc:"SettlPriceType", enum:{1:"FINAL",2:"THEORETICAL"}},
"732":{desc:"UnderlyingSettlPrice", enum:{}},
"733":{desc:"UnderlyingSettlPriceType", enum:{}},
"734":{desc:"PriorSettlPrice", enum:{}},
"735":{desc:"NoQuoteQualifiers", enum:{}},
"736":{desc:"AllocSettlCurrency", enum:{}},
"737":{desc:"AllocSettlCurrAmt", enum:{}},
"738":{desc:"InterestAtMaturity", enum:{}},
"739":{desc:"LegDatedDate", enum:{}},
"740":{desc:"LegPool", enum:{}},
"741":{desc:"AllocInterestAtMaturity", enum:{}},
"742":{desc:"AllocAccruedInterestAmt", enum:{}},
"743":{desc:"DeliveryDate", enum:{}},
"744":{desc:"AssignmentMethod", enum:{R:"RANDOM",P:"PRORATA"}},
"745":{desc:"AssignmentUnit", enum:{}},
"746":{desc:"OpenInterest", enum:{}},
"747":{desc:"ExerciseMethod", enum:{A:"AUTOMATIC",M:"MANUAL"}},
"748":{desc:"TotNumTradeReports", enum:{}},
"749":{desc:"TradeRequestResult", enum:{0:"SUCCESSFUL",1:"INVALID_OR_UNKNOWN_INSTRUMENT",2:"INVALID_TYPE_OF_TRADE_REQUESTED",3:"INVALID_PARTIES",4:"INVALID_TRANSPORT_TYPE_REQUESTED",5:"INVALID_DESTINATION_REQUESTED",8:"TRADEREQUESTTYPE_NOT_SUPPORTED",9:"UNAUTHORIZED_FOR_TRADE_CAPTURE_REPORT_REQUEST"}},
"750":{desc:"TradeRequestStatus", enum:{0:"ACCEPTED",1:"COMPLETED",2:"REJECTED"}},
"751":{desc:"TradeReportRejectReason", enum:{0:"SUCCESSFUL",1:"INVALID_PARTY_INFORMATION",2:"UNKNOWN_INSTRUMENT",3:"UNAUTHORIZED_TO_REPORT_TRADES",4:"INVALID_TRADE_TYPE"}},
"752":{desc:"SideMultiLegReportingType", enum:{1:"SINGLE_SECURITY",2:"INDIVIDUAL_LEG_OF_A_MULTI_LEG_SECURITY",3:"MULTI_LEG_SECURITY"}},
"753":{desc:"NoPosAmt", enum:{}},
"754":{desc:"AutoAcceptIndicator", enum:{}},
"755":{desc:"AllocReportID", enum:{}},
"756":{desc:"NoNested2PartyIDs", enum:{}},
"757":{desc:"Nested2PartyID", enum:{}},
"758":{desc:"Nested2PartyIDSource", enum:{}},
"759":{desc:"Nested2PartyRole", enum:{}},
"760":{desc:"Nested2PartySubID", enum:{}},
"761":{desc:"BenchmarkSecurityIDSource", enum:{1:"CUSIP",2:"SEDOL",3:"QUIK",4:"ISIN_NUMBER",5:"RIC_CODE",6:"ISO_CURRENCY_CODE",7:"ISO_COUNTRY_CODE",8:"EXCHANGE_SYMBOL",9:"CONSOLIDATED_TAPE_ASSOCIATION",A:"BLOOMBERG_SYMBOL",B:"WERTPAPIER",C:"DUTCH",D:"VALOREN",E:"SICOVAM",F:"BELGIAN",G:"COMMON",H:"CLEARING_HOUSE_CLEARING_ORGANIZATION",I:"ISDA_FPML_PRODUCT_SPECIFICATION",J:"OPTIONS_PRICE_REPORTING_AUTHORITY"}},
"762":{desc:"SecuritySubType", enum:{}},
"763":{desc:"UnderlyingSecuritySubType", enum:{}},
"764":{desc:"LegSecuritySubType", enum:{}},
"765":{desc:"AllowableOneSidednessPct", enum:{}},
"766":{desc:"AllowableOneSidednessValue", enum:{}},
"767":{desc:"AllowableOneSidednessCurr", enum:{}},
"768":{desc:"NoTrdRegTimestamps", enum:{}},
"769":{desc:"TrdRegTimestamp", enum:{}},
"770":{desc:"TrdRegTimestampType", enum:{1:"EXECUTION_TIME",2:"TIME_IN",3:"TIME_OUT",4:"BROKER_RECEIPT",5:"BROKER_EXECUTION"}},
"771":{desc:"TrdRegTimestampOrigin", enum:{}},
"772":{desc:"ConfirmRefID", enum:{}},
"773":{desc:"ConfirmType", enum:{1:"STATUS",2:"CONFIRMATION",3:"CONFIRMATION_REQUEST_REJECTED"}},
"774":{desc:"ConfirmRejReason", enum:{1:"MISMATCHED_ACCOUNT",2:"MISSING_SETTLEMENT_INSTRUCTIONS"}},
"775":{desc:"BookingType", enum:{0:"REGULAR_BOOKING",1:"CFD",2:"TOTAL_RETURN_SWAP"}},
"776":{desc:"IndividualAllocRejCode", enum:{}},
"777":{desc:"SettlInstMsgID", enum:{}},
"778":{desc:"NoSettlInst", enum:{}},
"779":{desc:"LastUpdateTime", enum:{}},
"780":{desc:"AllocSettlInstType", enum:{0:"USE_DEFAULT_INSTRUCTIONS",1:"DERIVE_FROM_PARAMETERS_PROVIDED",2:"FULL_DETAILS_PROVIDED",3:"SSI_DB_IDS_PROVIDED",4:"PHONE_FOR_INSTRUCTIONS"}},
"781":{desc:"NoSettlPartyIDs", enum:{}},
"782":{desc:"SettlPartyID", enum:{}},
"783":{desc:"SettlPartyIDSource", enum:{}},
"784":{desc:"SettlPartyRole", enum:{}},
"785":{desc:"SettlPartySubID", enum:{}},
"786":{desc:"SettlPartySubIDType", enum:{}},
"787":{desc:"DlvyInstType", enum:{S:"SECURITIES",C:"CASH"}},
"788":{desc:"TerminationType", enum:{1:"OVERNIGHT",2:"TERM",3:"FLEXIBLE",4:"OPEN"}},
"789":{desc:"NextExpectedMsgSeqNum", enum:{}},
"790":{desc:"OrdStatusReqID", enum:{}},
"791":{desc:"SettlInstReqID", enum:{}},
"792":{desc:"SettlInstReqRejCode", enum:{0:"UNABLE_TO_PROCESS_REQUEST",1:"UNKNOWN_ACCOUNT",2:"NO_MATCHING_SETTLEMENT_INSTRUCTIONS_FOUND"}},
"793":{desc:"SecondaryAllocID", enum:{}},
"794":{desc:"AllocReportType", enum:{3:"SELLSIDE_CALCULATED_USING_PRELIMINARY",4:"SELLSIDE_CALCULATED_WITHOUT_PRELIMINARY",5:"WAREHOUSE_RECAP",8:"REQUEST_TO_INTERMEDIARY"}},
"795":{desc:"AllocReportRefID", enum:{}},
"796":{desc:"AllocCancReplaceReason", enum:{1:"ORIGINAL_DETAILS_INCOMPLETE_INCORRECT",2:"CHANGE_IN_UNDERLYING_ORDER_DETAILS"}},
"797":{desc:"CopyMsgIndicator", enum:{}},
"798":{desc:"AllocAccountType", enum:{1:"ACCOUNT_IS_CARRIED_ON_CUSTOMER_SIDE_OF_BOOKS",2:"ACCOUNT_IS_CARRIED_ON_NON_CUSTOMER_SIDE_OF_BOOKS",3:"HOUSE_TRADER",4:"FLOOR_TRADER",6:"ACCOUNT_IS_CARRIED_ON_NON_CUSTOMER_SIDE_OF_BOOKS_AND_IS_CROSS_MARGINED",7:"ACCOUNT_IS_HOUSE_TRADER_AND_IS_CROSS_MARGINED",8:"JOINT_BACKOFFICE_ACCOUNT"}},
"799":{desc:"OrderAvgPx", enum:{}},
"800":{desc:"OrderBookingQty", enum:{}},
"801":{desc:"NoSettlPartySubIDs", enum:{}},
"802":{desc:"NoPartySubIDs", enum:{}},
"803":{desc:"PartySubIDType", enum:{}},
"804":{desc:"NoNestedPartySubIDs", enum:{}},
"805":{desc:"NestedPartySubIDType", enum:{}},
"806":{desc:"NoNested2PartySubIDs", enum:{}},
"807":{desc:"Nested2PartySubIDType", enum:{}},
"808":{desc:"AllocIntermedReqType", enum:{1:"PENDING_ACCEPT",2:"PENDING_RELEASE",3:"PENDING_REVERSAL",4:"ACCEPT",5:"BLOCK_LEVEL_REJECT",6:"ACCOUNT_LEVEL_REJECT"}},
"810":{desc:"UnderlyingPx", enum:{}},
"811":{desc:"PriceDelta", enum:{}},
"812":{desc:"ApplQueueMax", enum:{}},
"813":{desc:"ApplQueueDepth", enum:{}},
"814":{desc:"ApplQueueResolution", enum:{0:"NO_ACTION_TAKEN",1:"QUEUE_FLUSHED",2:"OVERLAY_LAST",3:"END_SESSION"}},
"815":{desc:"ApplQueueAction", enum:{0:"NO_ACTION_TAKEN",1:"QUEUE_FLUSHED",2:"OVERLAY_LAST",3:"END_SESSION"}},
"816":{desc:"NoAltMDSource", enum:{}},
"817":{desc:"AltMDSourceID", enum:{}},
"818":{desc:"SecondaryTradeReportID", enum:{}},
"819":{desc:"AvgPxIndicator", enum:{0:"NO_AVERAGE_PRICING",1:"TRADE_IS_PART_OF_AN_AVERAGE_PRICE_GROUP_IDENTIFIED_BY_THE_TRADELINKID",2:"LAST_TRADE_IN_THE_AVERAGE_PRICE_GROUP_IDENTIFIED_BY_THE_TRADELINKID"}},
"820":{desc:"TradeLinkID", enum:{}},
"821":{desc:"OrderInputDevice", enum:{}},
"822":{desc:"UnderlyingTradingSessionID", enum:{}},
"823":{desc:"UnderlyingTradingSessionSubID", enum:{}},
"824":{desc:"TradeLegRefID", enum:{}},
"825":{desc:"ExchangeRule", enum:{}},
"826":{desc:"TradeAllocIndicator", enum:{0:"ALLOCATION_NOT_REQUIRED",1:"ALLOCATION_REQUIRED",2:"USE_ALLOCATION_PROVIDED_WITH_THE_TRADE"}},
"827":{desc:"ExpirationCycle", enum:{0:"EXPIRE_ON_TRADING_SESSION_CLOSE",1:"EXPIRE_ON_TRADING_SESSION_OPEN"}},
"828":{desc:"TrdType", enum:{0:"REGULAR_TRADE",1:"BLOCK_TRADE",2:"EFP",3:"TRANSFER",4:"LATE_TRADE",5:"T_TRADE",6:"WEIGHTED_AVERAGE_PRICE_TRADE",7:"BUNCHED_TRADE",8:"LATE_BUNCHED_TRADE",9:"PRIOR_REFERENCE_PRICE_TRADE"}},
"829":{desc:"TrdSubType", enum:{}},
"830":{desc:"TransferReason", enum:{}},
"831":{desc:"AsgnReqID", enum:{}},
"832":{desc:"TotNumAssignmentReports", enum:{}},
"833":{desc:"AsgnRptID", enum:{}},
"834":{desc:"ThresholdAmount", enum:{}},
"835":{desc:"PegMoveType", enum:{0:"FLOATING",1:"FIXED"}},
"836":{desc:"PegOffsetType", enum:{0:"PRICE",1:"BASIS_POINTS",2:"TICKS",3:"PRICE_TIER_LEVEL"}},
"837":{desc:"PegLimitType", enum:{0:"OR_BETTER",1:"STRICT",2:"OR_WORSE"}},
"838":{desc:"PegRoundDirection", enum:{1:"MORE_AGGRESSIVE",2:"MORE_PASSIVE"}},
"839":{desc:"PeggedPrice", enum:{}},
"840":{desc:"PegScope", enum:{1:"LOCAL",2:"NATIONAL",3:"GLOBAL",4:"NATIONAL_EXCLUDING_LOCAL"}},
"841":{desc:"DiscretionMoveType", enum:{0:"FLOATING",1:"FIXED"}},
"842":{desc:"DiscretionOffsetType", enum:{0:"PRICE",1:"BASIS_POINTS",2:"TICKS",3:"PRICE_TIER_LEVEL"}},
"843":{desc:"DiscretionLimitType", enum:{0:"OR_BETTER",1:"STRICT",2:"OR_WORSE"}},
"844":{desc:"DiscretionRoundDirection", enum:{1:"MORE_AGGRESSIVE",2:"MORE_PASSIVE"}},
"845":{desc:"DiscretionPrice", enum:{}},
"846":{desc:"DiscretionScope", enum:{1:"LOCAL",2:"NATIONAL",3:"GLOBAL",4:"NATIONAL_EXCLUDING_LOCAL"}},
"847":{desc:"TargetStrategy", enum:{}},
"848":{desc:"TargetStrategyParameters", enum:{}},
"849":{desc:"ParticipationRate", enum:{}},
"850":{desc:"TargetStrategyPerformance", enum:{}},
"851":{desc:"LastLiquidityInd", enum:{1:"ADDED_LIQUIDITY",2:"REMOVED_LIQUIDITY",3:"LIQUIDITY_ROUTED_OUT"}},
"852":{desc:"PublishTrdIndicator", enum:{}},
"853":{desc:"ShortSaleReason", enum:{0:"DEALER_SOLD_SHORT",1:"DEALER_SOLD_SHORT_EXEMPT",2:"SELLING_CUSTOMER_SOLD_SHORT",3:"SELLING_CUSTOMER_SOLD_SHORT_EXEMPT",4:"QUALIFED_SERVICE_REPRESENTATIVE_OR_AUTOMATIC_GIVEUP_CONTRA_SIDE_SOLD_SHORT",5:"QSR_OR_AGU_CONTRA_SIDE_SOLD_SHORT_EXEMPT"}},
"854":{desc:"QtyType", enum:{0:"UNITS",1:"CONTRACTS"}},
"855":{desc:"SecondaryTrdType", enum:{}},
"856":{desc:"TradeReportType", enum:{0:"SUBMIT",1:"ALLEGED",2:"ACCEPT",3:"DECLINE",4:"ADDENDUM",5:"NO_WAS",6:"TRADE_REPORT_CANCEL",7:"LOCKED_IN_TRADE_BREAK"}},
"857":{desc:"AllocNoOrdersType", enum:{0:"NOT_SPECIFIED",1:"EXPLICIT_LIST_PROVIDED"}},
"858":{desc:"SharedCommission", enum:{}},
"859":{desc:"ConfirmReqID", enum:{}},
"860":{desc:"AvgParPx", enum:{}},
"861":{desc:"ReportedPx", enum:{}},
"862":{desc:"NoCapacities", enum:{}},
"863":{desc:"OrderCapacityQty", enum:{}},
"864":{desc:"NoEvents", enum:{}},
"865":{desc:"EventType", enum:{1:"PUT",2:"CALL",3:"TENDER",4:"SINKING_FUND_CALL"}},
"866":{desc:"EventDate", enum:{}},
"867":{desc:"EventPx", enum:{}},
"868":{desc:"EventText", enum:{}},
"869":{desc:"PctAtRisk", enum:{}},
"870":{desc:"NoInstrAttrib", enum:{}},
"871":{desc:"InstrAttribType", enum:{1:"FLAT",2:"ZERO_COUPON",3:"INTEREST_BEARING",4:"NO_PERIODIC_PAYMENTS",5:"VARIABLE_RATE",6:"LESS_FEE_FOR_PUT",7:"STEPPED_COUPON",8:"COUPON_PERIOD",9:"WHEN_AND_IF_ISSUED"}},
"872":{desc:"InstrAttribValue", enum:{}},
"873":{desc:"DatedDate", enum:{}},
"874":{desc:"InterestAccrualDate", enum:{}},
"875":{desc:"CPProgram", enum:{}},
"876":{desc:"CPRegType", enum:{}},
"877":{desc:"UnderlyingCPProgram", enum:{}},
"878":{desc:"UnderlyingCPRegType", enum:{}},
"879":{desc:"UnderlyingQty", enum:{}},
"880":{desc:"TrdMatchID", enum:{}},
"881":{desc:"SecondaryTradeReportRefID", enum:{}},
"882":{desc:"UnderlyingDirtyPrice", enum:{}},
"883":{desc:"UnderlyingEndPrice", enum:{}},
"884":{desc:"UnderlyingStartValue", enum:{}},
"885":{desc:"UnderlyingCurrentValue", enum:{}},
"886":{desc:"UnderlyingEndValue", enum:{}},
"887":{desc:"NoUnderlyingStips", enum:{}},
"888":{desc:"UnderlyingStipType", enum:{}},
"889":{desc:"UnderlyingStipValue", enum:{}},
"890":{desc:"MaturityNetMoney", enum:{}},
"891":{desc:"MiscFeeBasis", enum:{0:"ABSOLUTE",1:"PER_UNIT",2:"PERCENTAGE"}},
"892":{desc:"TotNoAllocs", enum:{}},
"893":{desc:"LastFragment", enum:{}},
"894":{desc:"CollReqID", enum:{}},
"895":{desc:"CollAsgnReason", enum:{0:"INITIAL",1:"SCHEDULED",2:"TIME_WARNING",3:"MARGIN_DEFICIENCY",4:"MARGIN_EXCESS",5:"FORWARD_COLLATERAL_DEMAND",6:"EVENT_OF_DEFAULT",7:"ADVERSE_TAX_EVENT"}},
"896":{desc:"CollInquiryQualifier", enum:{0:"TRADEDATE",1:"GC_INSTRUMENT",2:"COLLATERALINSTRUMENT",3:"SUBSTITUTION_ELIGIBLE",4:"NOT_ASSIGNED",5:"PARTIALLY_ASSIGNED",6:"FULLY_ASSIGNED",7:"OUTSTANDING_TRADES"}},
"897":{desc:"NoTrades", enum:{}},
"898":{desc:"MarginRatio", enum:{}},
"899":{desc:"MarginExcess", enum:{}},
"900":{desc:"TotalNetValue", enum:{}},
"901":{desc:"CashOutstanding", enum:{}},
"902":{desc:"CollAsgnID", enum:{}},
"903":{desc:"CollAsgnTransType", enum:{0:"NEW",1:"REPLACE",2:"CANCEL",3:"RELEASE",4:"REVERSE"}},
"904":{desc:"CollRespID", enum:{}},
"905":{desc:"CollAsgnRespType", enum:{0:"RECEIVED",1:"ACCEPTED",2:"DECLINED",3:"REJECTED"}},
"906":{desc:"CollAsgnRejectReason", enum:{0:"UNKNOWN_DEAL",1:"UNKNOWN_OR_INVALID_INSTRUMENT",2:"UNAUTHORIZED_TRANSACTION",3:"INSUFFICIENT_COLLATERAL",4:"INVALID_TYPE_OF_COLLATERAL",5:"EXCESSIVE_SUBSTITUTION"}},
"907":{desc:"CollAsgnRefID", enum:{}},
"908":{desc:"CollRptID", enum:{}},
"909":{desc:"CollInquiryID", enum:{}},
"910":{desc:"CollStatus", enum:{0:"UNASSIGNED",1:"PARTIALLY_ASSIGNED",2:"ASSIGNMENT_PROPOSED",3:"ASSIGNED",4:"CHALLENGED"}},
"911":{desc:"TotNumReports", enum:{}},
"912":{desc:"LastRptRequested", enum:{}},
"913":{desc:"AgreementDesc", enum:{}},
"914":{desc:"AgreementID", enum:{}},
"915":{desc:"AgreementDate", enum:{}},
"916":{desc:"StartDate", enum:{}},
"917":{desc:"EndDate", enum:{}},
"918":{desc:"AgreementCurrency", enum:{}},
"919":{desc:"DeliveryType", enum:{0:"VERSUS_PAYMENT",1:"FREE",2:"TRI_PARTY",3:"HOLD_IN_CUSTODY"}},
"920":{desc:"EndAccruedInterestAmt", enum:{}},
"921":{desc:"StartCash", enum:{}},
"922":{desc:"EndCash", enum:{}},
"923":{desc:"UserRequestID", enum:{}},
"924":{desc:"UserRequestType", enum:{1:"LOGONUSER",2:"LOGOFFUSER",3:"CHANGEPASSWORDFORUSER",4:"REQUEST_INDIVIDUAL_USER_STATUS"}},
"925":{desc:"NewPassword", enum:{}},
"926":{desc:"UserStatus", enum:{1:"LOGGED_IN",2:"NOT_LOGGED_IN",3:"USER_NOT_RECOGNISED",4:"PASSWORD_INCORRECT",5:"PASSWORD_CHANGED",6:"OTHER"}},
"927":{desc:"UserStatusText", enum:{}},
"928":{desc:"StatusValue", enum:{1:"CONNECTED",2:"NOT_CONNECTED_DOWN_EXPECTED_UP",3:"NOT_CONNECTED_DOWN_EXPECTED_DOWN",4:"IN_PROCESS"}},
"929":{desc:"StatusText", enum:{}},
"930":{desc:"RefCompID", enum:{}},
"931":{desc:"RefSubID", enum:{}},
"932":{desc:"NetworkResponseID", enum:{}},
"933":{desc:"NetworkRequestID", enum:{}},
"934":{desc:"LastNetworkResponseID", enum:{}},
"935":{desc:"NetworkRequestType", enum:{1:"SNAPSHOT",2:"SUBSCRIBE",4:"STOP_SUBSCRIBING",8:"LEVEL_OF_DETAIL"}},
"936":{desc:"NoCompIDs", enum:{}},
"937":{desc:"NetworkStatusResponseType", enum:{1:"FULL",2:"INCREMENTAL_UPDATE"}},
"938":{desc:"NoCollInquiryQualifier", enum:{}},
"939":{desc:"TrdRptStatus", enum:{0:"ACCEPTED",1:"REJECTED"}},
"940":{desc:"AffirmStatus", enum:{1:"RECEIVED",2:"CONFIRM_REJECTED",3:"AFFIRMED"}},
"941":{desc:"UnderlyingStrikeCurrency", enum:{}},
"942":{desc:"LegStrikeCurrency", enum:{}},
"943":{desc:"TimeBracket", enum:{}},
"944":{desc:"CollAction", enum:{0:"RETAIN",1:"ADD",2:"REMOVE"}},
"945":{desc:"CollInquiryStatus", enum:{0:"ACCEPTED",1:"ACCEPTED_WITH_WARNINGS",2:"COMPLETED",3:"COMPLETED_WITH_WARNINGS",4:"REJECTED"}},
"946":{desc:"CollInquiryResult", enum:{0:"SUCCESSFUL",1:"INVALID_OR_UNKNOWN_INSTRUMENT",2:"INVALID_OR_UNKNOWN_COLLATERAL_TYPE",3:"INVALID_PARTIES",4:"INVALID_TRANSPORT_TYPE_REQUESTED",5:"INVALID_DESTINATION_REQUESTED",6:"NO_COLLATERAL_FOUND_FOR_THE_TRADE_SPECIFIED",7:"NO_COLLATERAL_FOUND_FOR_THE_ORDER_SPECIFIED",8:"COLLATERAL_INQUIRY_TYPE_NOT_SUPPORTED",9:"UNAUTHORIZED_FOR_COLLATERAL_INQUIRY",99:"OTHER"}},
"947":{desc:"StrikeCurrency", enum:{}},
"948":{desc:"NoNested3PartyIDs", enum:{}},
"949":{desc:"Nested3PartyID", enum:{}},
"950":{desc:"Nested3PartyIDSource", enum:{}},
"951":{desc:"Nested3PartyRole", enum:{}},
"952":{desc:"NoNested3PartySubIDs", enum:{}},
"953":{desc:"Nested3PartySubID", enum:{}},
"954":{desc:"Nested3PartySubIDType", enum:{}},
"955":{desc:"LegContractSettlMonth", enum:{}},
"956":{desc:"LegInterestAccrualDate", enum:{}}

};


// singleton
var FIXParser = (function() {
    "use strict";

    var clientOrderLookup = {};

    function splitKeyVals(text, delimiter) {
        var result = {};

        text.split(delimiter).map(function(pair) {
            var keyAndValue = pair.split('=');
            if (keyAndValue[0] !== '') {
                result[keyAndValue[0]] = keyAndValue[1];
            }
        });

        return result;
    }

    function decorateFIX(message) {
        var result = {};

        // lookup tag names, translate to human readable version
        _.map(message, function(value, key) {
            var tag = tagLU[key],
                desc = tag && tag.desc;

            if (tag && desc) {
                // lookup in enum, if not present go with literal
                result[desc] = tag.enum[value] || value;
            }
        });

        var clientOrderId = result.ClOrdID;

        // store message in lookup table
        if (clientOrderId) {
            clientOrderLookup[clientOrderId] = clientOrderLookup[clientOrderId] || result;
        }

        result.MsgDetail = getMessageDetail(result);

        return result;
    }


    function getMessageDetail(result) {

        function findByOrderId(orderId) {
            return clientOrderLookup[orderId];
        }

        var detailFn, dispatch = {
            EXECUTION_REPORT: function() {
                var originalRequest = findByOrderId(result.OrigClOrdID),
                    detail = {},
                    _qty,
                    _cumQty;

                if (originalRequest) {
                    _qty = parseFloat(result.OrderQty);
                    _cumQty = parseFloat(result.CumQty);

                    if (_qty && _cumQty) {
                        detail.percentComplete = 100 * _cumQty / _qty;
                    }
                }

                return detail;
            },
            REJECT: function() {
                // Text should contain a reason for the rejection
                return {
                    text: result['Text'] || ''
                };
            },
            ORDER_CANCEL_REQUEST: function() {
                var originalRequest = findByOrderId(result.OrigClOrdID);

                return {
                    OriginalPrice: originalRequest.Price
                };
            },
        };

        detailFn = dispatch[result.MsgType];
        return detailFn ? detailFn(result) : null;
    }

    return {
        // private, here for testing
        splitKeyVals: splitKeyVals,
        extractMessages: function(fixText) {

            if (fixText.length === 0) {
                throw "No text found, please paste well formed FIX messages or click 'Sample data'";
            }

            var messages = fixText.match(/[^0-9a-zA-Z:\s]*8=FIX(.*?)[^0-9]10=\d\d\d.?/g);
            if (messages === null) {
                throw "No well formed FIX string found";
            }

            return messages;
        },
        guessDelimiter: function (fixText) {
            //Find end of tag 9 and beginning of tag 35. A char or set of cars between these two fields is the delim
            //--match tag 9 and find its length
            //--search tag 9, find its and location
            //--search tag 35 find its start location
            //--characters between end of tag 9 and start of tag 35 are the delimiter
            var tag9keyval = fixText.match(/[^0-9]9=[0-9]+/)[0];
            var startOfTag9 = fixText.search(/[^0-9]9=[0-9]+/);
            var endOfTag9 = startOfTag9 + tag9keyval.length;
            var startOfTag35 = fixText.search(/[^0-9]35=/) + 1;
            var delim = fixText.slice(endOfTag9, startOfTag35);

            return delim;

            //delimLoc = fixText.search(/[^0-9]9=/g);//TODO: does the 'g' need to be there?
            //return fixText[delimLoc];
        },
        toJSON: function(message, delimiter) {
            delimiter = delimiter || this.guessDelimiter(message);

            return decorateFIX(splitKeyVals(message, delimiter));
        }
    };

}());