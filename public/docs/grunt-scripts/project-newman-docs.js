'use strict';

// Source: src/main/js/lib/overthrow.js
/*! overthrow - An overflow:auto polyfill for responsive design. - v0.7.0 - 2014-07-15
* Copyright (c) 2014 Scott Jehl, Filament Group, Inc.; Licensed MIT */
/*! Overthrow. An overflow:auto polyfill for responsive design. (c) 2012: Scott Jehl, Filament Group, Inc. http://filamentgroup.github.com/Overthrow/license.txt */
(function( w, undefined ){
	
	var doc = w.document,
		docElem = doc.documentElement,
		enabledClassName = "overthrow-enabled",

		// Touch events are used in the polyfill, and thus are a prerequisite
		canBeFilledWithPoly = "ontouchmove" in doc,
		
		// The following attempts to determine whether the browser has native overflow support
		// so we can enable it but not polyfill
		nativeOverflow = 
			// Features-first. iOS5 overflow scrolling property check - no UA needed here. thanks Apple :)
			"WebkitOverflowScrolling" in docElem.style ||
			// Test the windows scrolling property as well
			"msOverflowStyle" in docElem.style ||
			// Touch events aren't supported and screen width is greater than X
			// ...basically, this is a loose "desktop browser" check. 
			// It may wrongly opt-in very large tablets with no touch support.
			( !canBeFilledWithPoly && w.screen.width > 800 ) ||
			// Hang on to your hats.
			// Whitelist some popular, overflow-supporting mobile browsers for now and the future
			// These browsers are known to get overlow support right, but give us no way of detecting it.
			(function(){
				var ua = w.navigator.userAgent,
					// Webkit crosses platforms, and the browsers on our list run at least version 534
					webkit = ua.match( /AppleWebKit\/([0-9]+)/ ),
					wkversion = webkit && webkit[1],
					wkLte534 = webkit && wkversion >= 534;
					
				return (
					/* Android 3+ with webkit gte 534
					~: Mozilla/5.0 (Linux; U; Android 3.0; en-us; Xoom Build/HRI39) AppleWebKit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13 */
					ua.match( /Android ([0-9]+)/ ) && RegExp.$1 >= 3 && wkLte534 ||
					/* Blackberry 7+ with webkit gte 534
					~: Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en-US) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.0.0 Mobile Safari/534.11+ */
					ua.match( / Version\/([0-9]+)/ ) && RegExp.$1 >= 0 && w.blackberry && wkLte534 ||
					/* Blackberry Playbook with webkit gte 534
					~: Mozilla/5.0 (PlayBook; U; RIM Tablet OS 1.0.0; en-US) AppleWebKit/534.8+ (KHTML, like Gecko) Version/0.0.1 Safari/534.8+ */   
					ua.indexOf( "PlayBook" ) > -1 && wkLte534 && !ua.indexOf( "Android 2" ) === -1 ||
					/* Firefox Mobile (Fennec) 4 and up
					~: Mozilla/5.0 (Mobile; rv:15.0) Gecko/15.0 Firefox/15.0 */
					ua.match(/Firefox\/([0-9]+)/) && RegExp.$1 >= 4 ||
					/* WebOS 3 and up (TouchPad too)
					~: Mozilla/5.0 (hp-tablet; Linux; hpwOS/3.0.0; U; en-US) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/233.48 Safari/534.6 TouchPad/1.0 */
					ua.match( /wOSBrowser\/([0-9]+)/ ) && RegExp.$1 >= 233 && wkLte534 ||
					/* Nokia Browser N8
					~: Mozilla/5.0 (Symbian/3; Series60/5.2 NokiaN8-00/012.002; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/533.4 (KHTML, like Gecko) NokiaBrowser/7.3.0 Mobile Safari/533.4 3gpp-gba 
					~: Note: the N9 doesn't have native overflow with one-finger touch. wtf */
					ua.match( /NokiaBrowser\/([0-9\.]+)/ ) && parseFloat(RegExp.$1) === 7.3 && webkit && wkversion >= 533
				);
			})();

	// Expose overthrow API
	w.overthrow = {};

	w.overthrow.enabledClassName = enabledClassName;

	w.overthrow.addClass = function(){
		if( docElem.className.indexOf( w.overthrow.enabledClassName ) === -1 ){
			docElem.className += " " + w.overthrow.enabledClassName;
		}
	};

	w.overthrow.removeClass = function(){
		docElem.className = docElem.className.replace( w.overthrow.enabledClassName, "" );
	};

	// Enable and potentially polyfill overflow
	w.overthrow.set = function(){
			
		// If nativeOverflow or at least the element canBeFilledWithPoly, add a class to cue CSS that assumes overflow scrolling will work (setting height on elements and such)
		if( nativeOverflow ){
			w.overthrow.addClass();
		}

	};

	// expose polyfillable 
	w.overthrow.canBeFilledWithPoly = canBeFilledWithPoly;

	// Destroy everything later. If you want to.
	w.overthrow.forget = function(){

		w.overthrow.removeClass();
		
	};
		
	// Expose overthrow API
	w.overthrow.support = nativeOverflow ? "native" : "none";
		
})( this );

/*! Overthrow. An overflow:auto polyfill for responsive design. (c) 2012: Scott Jehl, Filament Group, Inc. http://filamentgroup.github.com/Overthrow/license.txt */
(function( w, o, undefined ){

	// o is overthrow reference from overthrow-polyfill.js
	if( o === undefined ){
		return;
	}

	// Easing can use any of Robert Penner's equations (http://www.robertpenner.com/easing_terms_of_use.html). By default, overthrow includes ease-out-cubic
	// arguments: t = current iteration, b = initial value, c = end value, d = total iterations
	// use w.overthrow.easing to provide a custom function externally, or pass an easing function as a callback to the toss method
	o.easing = function (t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	};

	// tossing property is true during a programatic scroll
	o.tossing = false;

	// Keeper of intervals
	var timeKeeper;

	/* toss scrolls and element with easing

	// elem is the element to scroll
	// options hash:
		* left is the desired horizontal scroll. Default is "+0". For relative distances, pass a string with "+" or "-" in front.
		* top is the desired vertical scroll. Default is "+0". For relative distances, pass a string with "+" or "-" in front.
		* duration is the number of milliseconds the throw will take. Default is 100.
		* easing is an optional custom easing function. Default is w.overthrow.easing. Must follow the easing function signature

	*/
	o.toss = function( elem, options ){
		o.intercept();
		var i = 0,
			sLeft = elem.scrollLeft,
			sTop = elem.scrollTop,
			// Toss defaults
			op = {
				top: "+0",
				left: "+0",
				duration: 50,
				easing: o.easing,
				finished: function() {}
			},
			endLeft, endTop, finished = false;

		// Mixin based on predefined defaults
		if( options ){
			for( var j in op ){
				if( options[ j ] !== undefined ){
					op[ j ] = options[ j ];
				}
			}
		}

		// Convert relative values to ints
		// First the left val
		if( typeof op.left === "string" ){
			op.left = parseFloat( op.left );
			endLeft = op.left + sLeft;
		}
		else {
			endLeft = op.left;
			op.left = op.left - sLeft;
		}
		// Then the top val
		if( typeof op.top === "string" ){

			op.top = parseFloat( op.top );
			endTop = op.top + sTop;
		}
		else {
			endTop = op.top;
			op.top = op.top - sTop;
		}

		o.tossing = true;
		timeKeeper = setInterval(function(){
			if( i++ < op.duration ){
				elem.scrollLeft = op.easing( i, sLeft, op.left, op.duration );
				elem.scrollTop = op.easing( i, sTop, op.top, op.duration );
			}
			else{
				if( endLeft !== elem.scrollLeft ){
					elem.scrollLeft = endLeft;
				} else {
					// if the end of the vertical scrolling has taken place
					// we know that we're done here call the callback
					// otherwise signal that horizontal scrolling is complete
					if( finished ) {
						op.finished();
					}
					finished = true;
				}

				if( endTop !== elem.scrollTop ){
					elem.scrollTop = endTop;
				} else {
					// if the end of the horizontal scrolling has taken place
					// we know that we're done here call the callback
					if( finished ) {
						op.finished();
					}
					finished = true;
				}

				o.intercept();
			}
		}, 1 );

		// Return the values, post-mixin, with end values specified
		return { top: endTop, left: endLeft, duration: o.duration, easing: o.easing };
	};

	// Intercept any throw in progress
	o.intercept = function(){
		clearInterval( timeKeeper );
		o.tossing = false;
	};

})( this, this.overthrow );

/*! Overthrow. An overflow:auto polyfill for responsive design. (c) 2012: Scott Jehl, Filament Group, Inc. http://filamentgroup.github.com/Overthrow/license.txt */
(function( w, o, undefined ){

	// o is overthrow reference from overthrow-polyfill.js
	if( o === undefined ){
		return;
	}

	o.scrollIndicatorClassName = "overthrow";
	
	var doc = w.document,
		docElem = doc.documentElement,
		// o api
		nativeOverflow = o.support === "native",
		canBeFilledWithPoly = o.canBeFilledWithPoly,
		configure = o.configure,
		set = o.set,
		forget = o.forget,
		scrollIndicatorClassName = o.scrollIndicatorClassName;

	// find closest overthrow (elem or a parent)
	o.closest = function( target, ascend ){
		return !ascend && target.className && target.className.indexOf( scrollIndicatorClassName ) > -1 && target || o.closest( target.parentNode );
	};
		
	// polyfill overflow
	var enabled = false;
	o.set = function(){
			
		set();

		// If nativeOverflow or it doesn't look like the browser canBeFilledWithPoly, our job is done here. Exit viewport left.
		if( enabled || nativeOverflow || !canBeFilledWithPoly ){
			return;
		}

		w.overthrow.addClass();

		enabled = true;

		o.support = "polyfilled";

		o.forget = function(){
			forget();
			enabled = false;
			// Remove touch binding (check for method support since this part isn't qualified by touch support like the rest)
			if( doc.removeEventListener ){
				doc.removeEventListener( "touchstart", start, false );
			}
		};

		// Fill 'er up!
		// From here down, all logic is associated with touch scroll handling
			// elem references the overthrow element in use
		var elem,
			
			// The last several Y values are kept here
			lastTops = [],
	
			// The last several X values are kept here
			lastLefts = [],
			
			// lastDown will be true if the last scroll direction was down, false if it was up
			lastDown,
			
			// lastRight will be true if the last scroll direction was right, false if it was left
			lastRight,
			
			// For a new gesture, or change in direction, reset the values from last scroll
			resetVertTracking = function(){
				lastTops = [];
				lastDown = null;
			},
			
			resetHorTracking = function(){
				lastLefts = [];
				lastRight = null;
			},
		
			// On webkit, touch events hardly trickle through textareas and inputs
			// Disabling CSS pointer events makes sure they do, but it also makes the controls innaccessible
			// Toggling pointer events at the right moments seems to do the trick
			// Thanks Thomas Bachem http://stackoverflow.com/a/5798681 for the following
			inputs,
			setPointers = function( val ){
				inputs = elem.querySelectorAll( "textarea, input" );
				for( var i = 0, il = inputs.length; i < il; i++ ) {
					inputs[ i ].style.pointerEvents = val;
				}
			},
			
			// For nested overthrows, changeScrollTarget restarts a touch event cycle on a parent or child overthrow
			changeScrollTarget = function( startEvent, ascend ){
				if( doc.createEvent ){
					var newTarget = ( !ascend || ascend === undefined ) && elem.parentNode || elem.touchchild || elem,
						tEnd;
							
					if( newTarget !== elem ){
						tEnd = doc.createEvent( "HTMLEvents" );
						tEnd.initEvent( "touchend", true, true );
						elem.dispatchEvent( tEnd );
						newTarget.touchchild = elem;
						elem = newTarget;
						newTarget.dispatchEvent( startEvent );
					}
				}
			},
			
			// Touchstart handler
			// On touchstart, touchmove and touchend are freshly bound, and all three share a bunch of vars set by touchstart
			// Touchend unbinds them again, until next time
			start = function( e ){

				// Stop any throw in progress
				if( o.intercept ){
					o.intercept();
				}
				
				// Reset the distance and direction tracking
				resetVertTracking();
				resetHorTracking();
				
				elem = o.closest( e.target );
					
				if( !elem || elem === docElem || e.touches.length > 1 ){
					return;
				}			

				setPointers( "none" );
				var touchStartE = e,
					scrollT = elem.scrollTop,
					scrollL = elem.scrollLeft,
					height = elem.offsetHeight,
					width = elem.offsetWidth,
					startY = e.touches[ 0 ].pageY,
					startX = e.touches[ 0 ].pageX,
					scrollHeight = elem.scrollHeight,
					scrollWidth = elem.scrollWidth,
				
					// Touchmove handler
					move = function( e ){
					
						var ty = scrollT + startY - e.touches[ 0 ].pageY,
							tx = scrollL + startX - e.touches[ 0 ].pageX,
							down = ty >= ( lastTops.length ? lastTops[ 0 ] : 0 ),
							right = tx >= ( lastLefts.length ? lastLefts[ 0 ] : 0 );
							
						// If there's room to scroll the current container, prevent the default window scroll
						if( ( ty > 0 && ty < scrollHeight - height ) || ( tx > 0 && tx < scrollWidth - width ) ){
							e.preventDefault();
						}
						// This bubbling is dumb. Needs a rethink.
						else {
							changeScrollTarget( touchStartE );
						}
						
						// If down and lastDown are inequal, the y scroll has changed direction. Reset tracking.
						if( lastDown && down !== lastDown ){
							resetVertTracking();
						}
						
						// If right and lastRight are inequal, the x scroll has changed direction. Reset tracking.
						if( lastRight && right !== lastRight ){
							resetHorTracking();
						}
						
						// remember the last direction in which we were headed
						lastDown = down;
						lastRight = right;							
						
						// set the container's scroll
						elem.scrollTop = ty;
						elem.scrollLeft = tx;
					
						lastTops.unshift( ty );
						lastLefts.unshift( tx );
					
						if( lastTops.length > 3 ){
							lastTops.pop();
						}
						if( lastLefts.length > 3 ){
							lastLefts.pop();
						}
					},
				
					// Touchend handler
					end = function( e ){

						// Bring the pointers back
						setPointers( "auto" );
						setTimeout( function(){
							setPointers( "none" );
						}, 450 );
						elem.removeEventListener( "touchmove", move, false );
						elem.removeEventListener( "touchend", end, false );
					};
				
				elem.addEventListener( "touchmove", move, false );
				elem.addEventListener( "touchend", end, false );
			};
			
		// Bind to touch, handle move and end within
		doc.addEventListener( "touchstart", start, false );
	};
		
})( this, this.overthrow );

/*! Overthrow. An overflow:auto polyfill for responsive design. (c) 2012: Scott Jehl, Filament Group, Inc. http://filamentgroup.github.com/Overthrow/license.txt */
(function( w, undefined ){
	
	// Auto-init
	w.overthrow.set();

}( this ));;
// Source: src/main/js/lib/underscore-min.js
//     Underscore.js 1.6.0
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
    _.VERSION = '1.6.0';

    // Internal function: creates a callback bound to its context if supplied
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

    // An internal function to generate lookup iterators.
    var lookupIterator = function(value, context, argCount) {
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
    _.each = _.forEach = function(obj, iterator, context) {
        if (obj == null) return obj;
        iterator = createCallback(iterator, context);
        var i, length = obj.length;
        if (length === +length) {
            for (i = 0; i < length; i++) {
                iterator(obj[i], i, obj);
            }
        } else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iterator(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    };

    // Return the results of applying the iterator to each element.
    _.map = _.collect = function(obj, iterator, context) {
        if (obj == null) return [];
        iterator = lookupIterator(iterator, context);
        var length = obj.length,
            currentKey, keys;
        if (length !== +length) {
            keys = _.keys(obj);
            length = keys.length;
        }
        var results = Array(length);
        for (var index = 0; index < length; index++) {
            currentKey = keys ? keys[index] : index;
            results[index] = iterator(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    var reduceError = 'Reduce of empty array with no initial value';

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`.
    _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
        if (obj == null) obj = [];
        iterator = createCallback(iterator, context, 4);
        var index = 0, length = obj.length,
            currentKey, keys;
        if (length !== +length) {
            keys = _.keys(obj);
            length = keys.length;
        }
        if (arguments.length < 3) {
            if (!length) throw TypeError(reduceError);
            memo = obj[keys ? keys[index++] : index++];
        }
        for (; index < length; index++) {
            currentKey = keys ? keys[index] : index;
            memo = iterator(memo, obj[currentKey], currentKey, obj);
        }
        return memo;
    };

    // The right-associative version of reduce, also known as `foldr`.
    _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
        if (obj == null) obj = [];
        iterator = createCallback(iterator, context, 4);
        var index = obj.length,
            currentKey, keys;
        if (index !== +index) {
            keys = _.keys(obj);
            index = keys.length;
        }
        if (arguments.length < 3) {
            if (!index) throw TypeError(reduceError);
            memo = obj[keys ? keys[--index] : --index];
        }
        while (index--) {
            currentKey = keys ? keys[index] : index;
            memo = iterator(memo, obj[currentKey], currentKey, obj);
        }
        return memo;
    };

    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function(obj, predicate, context) {
        var result;
        predicate = lookupIterator(predicate, context);
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
        predicate = lookupIterator(predicate, context);
        _.each(obj, function(value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });
        return results;
    };

    // Return all the elements for which a truth test fails.
    _.reject = function(obj, predicate, context) {
        return _.filter(obj, _.negate(lookupIterator(predicate)), context);
    };

    // Determine whether all of the elements match a truth test.
    // Aliased as `all`.
    _.every = _.all = function(obj, predicate, context) {
        if (obj == null) return true;
        predicate = lookupIterator(predicate, context);
        var length = obj.length;
        var index, currentKey, keys;
        if (length !== +length) {
            keys = _.keys(obj);
            length = keys.length;
        }
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
        predicate = lookupIterator(predicate, context);
        var length = obj.length;
        var index, currentKey, keys;
        if (length !== +length) {
            keys = _.keys(obj);
            length = keys.length;
        }
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
    _.max = function(obj, iterator, context) {
        var result = -Infinity, lastComputed = -Infinity,
            value, computed;
        if (iterator == null && obj != null) {
            obj = obj.length === +obj.length ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value > result) {
                    result = value;
                }
            }
        } else {
            iterator = lookupIterator(iterator, context);
            _.each(obj, function(value, index, list) {
                computed = iterator(value, index, list);
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Return the minimum element (or element-based computation).
    _.min = function(obj, iterator, context) {
        var result = Infinity, lastComputed = Infinity,
            value, computed;
        if (iterator == null && obj != null) {
            obj = obj.length === +obj.length ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value < result) {
                    result = value;
                }
            }
        } else {
            iterator = lookupIterator(iterator, context);
            _.each(obj, function(value, index, list) {
                computed = iterator(value, index, list);
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

    // Sort the object's values by a criterion produced by an iterator.
    _.sortBy = function(obj, iterator, context) {
        iterator = lookupIterator(iterator, context);
        return _.pluck(_.map(obj, function(value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iterator(value, index, list)
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
        return function(obj, iterator, context) {
            var result = {};
            iterator = lookupIterator(iterator, context);
            _.each(obj, function(value, index) {
                var key = iterator(value, index, obj);
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
    _.sortedIndex = function(array, obj, iterator, context) {
        iterator = lookupIterator(iterator, context, 1);
        var value = iterator(obj);
        var low = 0, high = array.length;
        while (low < high) {
            var mid = (low + high) >>> 1;
            if (iterator(array[mid]) < value) low = mid + 1; else high = mid;
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
        predicate = lookupIterator(predicate, context);
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
    _.uniq = _.unique = function(array, isSorted, iterator, context) {
        if (array == null) return [];
        if (_.isFunction(isSorted)) {
            context = iterator;
            iterator = isSorted;
            isSorted = false;
        }
        if (iterator) iterator = lookupIterator(iterator, context);
        var result = [];
        var seen = [];
        for (var i = 0, length = array.length; i < length; i++) {
            var value = array[i];
            if (isSorted) {
                if (!i || seen !== value) result.push(value);
                seen = value;
            } else if (iterator) {
                var computed = iterator(value, i, array);
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
        if (!_.isFunction(func)) throw TypeError('Bind must be called on a function');
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
        if (length <= 1) throw Error('bindAll must be passed function names');
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
            }
            else func = null;
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
                obj[prop] = source[prop];
            }
        }
        return obj;
    };

    // Return a copy of the object only containing the whitelisted properties.
    _.pick = function(obj, iterator, context) {
        var result = {}, key;
        if (obj == null) return result;
        if (_.isFunction(iterator)) {
            iterator = createCallback(iterator, context);
            for (key in obj) {
                var value = obj[key];
                if (iterator(value, key, obj)) result[key] = value;
            }
        } else {
            var keys = concat.apply([], slice.call(arguments, 1));
            obj = Object(obj);
            for (var i = 0, length = keys.length; i < length; i++) {
                key = keys[i];
                if (key in obj) result[key] = obj[key];
            }
        }
        return result;
    };

    // Return a copy of the object without the blacklisted properties.
    _.omit = function(obj, iterator, context) {
        if (_.isFunction(iterator)) {
            iterator = _.negate(iterator);
        } else {
            var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
            iterator = function(value, key) {
                return !_.contains(keys, key);
            };
        }
        return _.pick(obj, iterator, context);
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

    // Optimize `isFunction` if appropriate.
    if (typeof /./ !== 'function') {
        _.isFunction = function(obj) {
            return typeof obj === 'function';
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

    // Keep the identity function around for default iterators.
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
            obj = Object(obj);
            for (var i = 0; i < length; i++) {
                var pair = pairs[i], key = pair[0];
                if (pair[1] !== obj[key] || !(key in obj)) return false;
            }
            return true;
        };
    };

    // Run a function **n** times.
    _.times = function(n, iterator, context) {
        var accum = Array(Math.max(0, n));
        iterator = createCallback(iterator, context, 1);
        for (var i = 0; i < n; i++) accum[i] = iterator(i);
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
    _.template = function(text, data, settings) {
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
            var render = Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        if (data) return render(data, _);
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
}.call(this));;
// Source: src/main/js/lib/angular/v1.2/angular.min.js
/*
 AngularJS v1.2.21
 (c) 2010-2014 Google, Inc. http://angularjs.org
 License: MIT
*/
(function(P,W,s){'use strict';function y(b){return function(){var a=arguments[0],c,a="["+(b?b+":":"")+a+"] http://errors.angularjs.org/1.2.21/"+(b?b+"/":"")+a;for(c=1;c<arguments.length;c++)a=a+(1==c?"?":"&")+"p"+(c-1)+"="+encodeURIComponent("function"==typeof arguments[c]?arguments[c].toString().replace(/ \{[\s\S]*$/,""):"undefined"==typeof arguments[c]?"undefined":"string"!=typeof arguments[c]?JSON.stringify(arguments[c]):arguments[c]);return Error(a)}}function eb(b){if(null==b||Fa(b))return!1;
var a=b.length;return 1===b.nodeType&&a?!0:z(b)||I(b)||0===a||"number"===typeof a&&0<a&&a-1 in b}function q(b,a,c){var d;if(b)if(C(b))for(d in b)"prototype"==d||("length"==d||"name"==d||b.hasOwnProperty&&!b.hasOwnProperty(d))||a.call(c,b[d],d);else if(I(b)||eb(b))for(d=0;d<b.length;d++)a.call(c,b[d],d);else if(b.forEach&&b.forEach!==q)b.forEach(a,c);else for(d in b)b.hasOwnProperty(d)&&a.call(c,b[d],d);return b}function Zb(b){var a=[],c;for(c in b)b.hasOwnProperty(c)&&a.push(c);return a.sort()}function Tc(b,
a,c){for(var d=Zb(b),e=0;e<d.length;e++)a.call(c,b[d[e]],d[e]);return d}function $b(b){return function(a,c){b(c,a)}}function fb(){for(var b=ka.length,a;b;){b--;a=ka[b].charCodeAt(0);if(57==a)return ka[b]="A",ka.join("");if(90==a)ka[b]="0";else return ka[b]=String.fromCharCode(a+1),ka.join("")}ka.unshift("0");return ka.join("")}function ac(b,a){a?b.$$hashKey=a:delete b.$$hashKey}function F(b){var a=b.$$hashKey;q(arguments,function(a){a!==b&&q(a,function(a,c){b[c]=a})});ac(b,a);return b}function Z(b){return parseInt(b,
10)}function bc(b,a){return F(new (F(function(){},{prototype:b})),a)}function D(){}function Ga(b){return b}function $(b){return function(){return b}}function v(b){return"undefined"===typeof b}function B(b){return"undefined"!==typeof b}function S(b){return null!=b&&"object"===typeof b}function z(b){return"string"===typeof b}function Ab(b){return"number"===typeof b}function sa(b){return"[object Date]"===ya.call(b)}function C(b){return"function"===typeof b}function gb(b){return"[object RegExp]"===ya.call(b)}
function Fa(b){return b&&b.document&&b.location&&b.alert&&b.setInterval}function Uc(b){return!(!b||!(b.nodeName||b.prop&&b.attr&&b.find))}function Vc(b,a,c){var d=[];q(b,function(b,f,g){d.push(a.call(c,b,f,g))});return d}function Pa(b,a){if(b.indexOf)return b.indexOf(a);for(var c=0;c<b.length;c++)if(a===b[c])return c;return-1}function Qa(b,a){var c=Pa(b,a);0<=c&&b.splice(c,1);return a}function Ha(b,a,c,d){if(Fa(b)||b&&b.$evalAsync&&b.$watch)throw Ra("cpws");if(a){if(b===a)throw Ra("cpi");c=c||[];
d=d||[];if(S(b)){var e=Pa(c,b);if(-1!==e)return d[e];c.push(b);d.push(a)}if(I(b))for(var f=a.length=0;f<b.length;f++)e=Ha(b[f],null,c,d),S(b[f])&&(c.push(b[f]),d.push(e)),a.push(e);else{var g=a.$$hashKey;q(a,function(b,c){delete a[c]});for(f in b)e=Ha(b[f],null,c,d),S(b[f])&&(c.push(b[f]),d.push(e)),a[f]=e;ac(a,g)}}else if(a=b)I(b)?a=Ha(b,[],c,d):sa(b)?a=new Date(b.getTime()):gb(b)?(a=RegExp(b.source,b.toString().match(/[^\/]*$/)[0]),a.lastIndex=b.lastIndex):S(b)&&(a=Ha(b,{},c,d));return a}function ga(b,
a){if(I(b)){a=a||[];for(var c=0;c<b.length;c++)a[c]=b[c]}else if(S(b))for(c in a=a||{},b)!hb.call(b,c)||"$"===c.charAt(0)&&"$"===c.charAt(1)||(a[c]=b[c]);return a||b}function za(b,a){if(b===a)return!0;if(null===b||null===a)return!1;if(b!==b&&a!==a)return!0;var c=typeof b,d;if(c==typeof a&&"object"==c)if(I(b)){if(!I(a))return!1;if((c=b.length)==a.length){for(d=0;d<c;d++)if(!za(b[d],a[d]))return!1;return!0}}else{if(sa(b))return sa(a)&&b.getTime()==a.getTime();if(gb(b)&&gb(a))return b.toString()==a.toString();
if(b&&b.$evalAsync&&b.$watch||a&&a.$evalAsync&&a.$watch||Fa(b)||Fa(a)||I(a))return!1;c={};for(d in b)if("$"!==d.charAt(0)&&!C(b[d])){if(!za(b[d],a[d]))return!1;c[d]=!0}for(d in a)if(!c.hasOwnProperty(d)&&"$"!==d.charAt(0)&&a[d]!==s&&!C(a[d]))return!1;return!0}return!1}function Bb(b,a){var c=2<arguments.length?Aa.call(arguments,2):[];return!C(a)||a instanceof RegExp?a:c.length?function(){return arguments.length?a.apply(b,c.concat(Aa.call(arguments,0))):a.apply(b,c)}:function(){return arguments.length?
a.apply(b,arguments):a.call(b)}}function Wc(b,a){var c=a;"string"===typeof b&&"$"===b.charAt(0)?c=s:Fa(a)?c="$WINDOW":a&&W===a?c="$DOCUMENT":a&&(a.$evalAsync&&a.$watch)&&(c="$SCOPE");return c}function ta(b,a){return"undefined"===typeof b?s:JSON.stringify(b,Wc,a?"  ":null)}function cc(b){return z(b)?JSON.parse(b):b}function Sa(b){"function"===typeof b?b=!0:b&&0!==b.length?(b=K(""+b),b=!("f"==b||"0"==b||"false"==b||"no"==b||"n"==b||"[]"==b)):b=!1;return b}function ha(b){b=x(b).clone();try{b.empty()}catch(a){}var c=
x("<div>").append(b).html();try{return 3===b[0].nodeType?K(c):c.match(/^(<[^>]+>)/)[1].replace(/^<([\w\-]+)/,function(a,b){return"<"+K(b)})}catch(d){return K(c)}}function dc(b){try{return decodeURIComponent(b)}catch(a){}}function ec(b){var a={},c,d;q((b||"").split("&"),function(b){b&&(c=b.replace(/\+/g,"%20").split("="),d=dc(c[0]),B(d)&&(b=B(c[1])?dc(c[1]):!0,hb.call(a,d)?I(a[d])?a[d].push(b):a[d]=[a[d],b]:a[d]=b))});return a}function Cb(b){var a=[];q(b,function(b,d){I(b)?q(b,function(b){a.push(Ba(d,
!0)+(!0===b?"":"="+Ba(b,!0)))}):a.push(Ba(d,!0)+(!0===b?"":"="+Ba(b,!0)))});return a.length?a.join("&"):""}function ib(b){return Ba(b,!0).replace(/%26/gi,"&").replace(/%3D/gi,"=").replace(/%2B/gi,"+")}function Ba(b,a){return encodeURIComponent(b).replace(/%40/gi,"@").replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,a?"%20":"+")}function Xc(b,a){function c(a){a&&d.push(a)}var d=[b],e,f,g=["ng:app","ng-app","x-ng-app","data-ng-app"],k=/\sng[:\-]app(:\s*([\w\d_]+);?)?\s/;
q(g,function(a){g[a]=!0;c(W.getElementById(a));a=a.replace(":","\\:");b.querySelectorAll&&(q(b.querySelectorAll("."+a),c),q(b.querySelectorAll("."+a+"\\:"),c),q(b.querySelectorAll("["+a+"]"),c))});q(d,function(a){if(!e){var b=k.exec(" "+a.className+" ");b?(e=a,f=(b[2]||"").replace(/\s+/g,",")):q(a.attributes,function(b){!e&&g[b.name]&&(e=a,f=b.value)})}});e&&a(e,f?[f]:[])}function fc(b,a){var c=function(){b=x(b);if(b.injector()){var c=b[0]===W?"document":ha(b);throw Ra("btstrpd",c);}a=a||[];a.unshift(["$provide",
function(a){a.value("$rootElement",b)}]);a.unshift("ng");c=gc(a);c.invoke(["$rootScope","$rootElement","$compile","$injector","$animate",function(a,b,c,d,e){a.$apply(function(){b.data("$injector",d);c(b)(a)})}]);return c},d=/^NG_DEFER_BOOTSTRAP!/;if(P&&!d.test(P.name))return c();P.name=P.name.replace(d,"");Ta.resumeBootstrap=function(b){q(b,function(b){a.push(b)});c()}}function jb(b,a){a=a||"_";return b.replace(Yc,function(b,d){return(d?a:"")+b.toLowerCase()})}function Db(b,a,c){if(!b)throw Ra("areq",
a||"?",c||"required");return b}function Ua(b,a,c){c&&I(b)&&(b=b[b.length-1]);Db(C(b),a,"not a function, got "+(b&&"object"===typeof b?b.constructor.name||"Object":typeof b));return b}function Ca(b,a){if("hasOwnProperty"===b)throw Ra("badname",a);}function hc(b,a,c){if(!a)return b;a=a.split(".");for(var d,e=b,f=a.length,g=0;g<f;g++)d=a[g],b&&(b=(e=b)[d]);return!c&&C(b)?Bb(e,b):b}function Eb(b){var a=b[0];b=b[b.length-1];if(a===b)return x(a);var c=[a];do{a=a.nextSibling;if(!a)break;c.push(a)}while(a!==
b);return x(c)}function Zc(b){var a=y("$injector"),c=y("ng");b=b.angular||(b.angular={});b.$$minErr=b.$$minErr||y;return b.module||(b.module=function(){var b={};return function(e,f,g){if("hasOwnProperty"===e)throw c("badname","module");f&&b.hasOwnProperty(e)&&(b[e]=null);return b[e]||(b[e]=function(){function b(a,d,e){return function(){c[e||"push"]([a,d,arguments]);return p}}if(!f)throw a("nomod",e);var c=[],d=[],l=b("$injector","invoke"),p={_invokeQueue:c,_runBlocks:d,requires:f,name:e,provider:b("$provide",
"provider"),factory:b("$provide","factory"),service:b("$provide","service"),value:b("$provide","value"),constant:b("$provide","constant","unshift"),animation:b("$animateProvider","register"),filter:b("$filterProvider","register"),controller:b("$controllerProvider","register"),directive:b("$compileProvider","directive"),config:l,run:function(a){d.push(a);return this}};g&&l(g);return p}())}}())}function $c(b){F(b,{bootstrap:fc,copy:Ha,extend:F,equals:za,element:x,forEach:q,injector:gc,noop:D,bind:Bb,
toJson:ta,fromJson:cc,identity:Ga,isUndefined:v,isDefined:B,isString:z,isFunction:C,isObject:S,isNumber:Ab,isElement:Uc,isArray:I,version:ad,isDate:sa,lowercase:K,uppercase:Ia,callbacks:{counter:0},$$minErr:y,$$csp:Va});Wa=Zc(P);try{Wa("ngLocale")}catch(a){Wa("ngLocale",[]).provider("$locale",bd)}Wa("ng",["ngLocale"],["$provide",function(a){a.provider({$$sanitizeUri:cd});a.provider("$compile",ic).directive({a:dd,input:jc,textarea:jc,form:ed,script:fd,select:gd,style:hd,option:id,ngBind:jd,ngBindHtml:kd,
ngBindTemplate:ld,ngClass:md,ngClassEven:nd,ngClassOdd:od,ngCloak:pd,ngController:qd,ngForm:rd,ngHide:sd,ngIf:td,ngInclude:ud,ngInit:vd,ngNonBindable:wd,ngPluralize:xd,ngRepeat:yd,ngShow:zd,ngStyle:Ad,ngSwitch:Bd,ngSwitchWhen:Cd,ngSwitchDefault:Dd,ngOptions:Ed,ngTransclude:Fd,ngModel:Gd,ngList:Hd,ngChange:Id,required:kc,ngRequired:kc,ngValue:Jd}).directive({ngInclude:Kd}).directive(Fb).directive(lc);a.provider({$anchorScroll:Ld,$animate:Md,$browser:Nd,$cacheFactory:Od,$controller:Pd,$document:Qd,
$exceptionHandler:Rd,$filter:mc,$interpolate:Sd,$interval:Td,$http:Ud,$httpBackend:Vd,$location:Wd,$log:Xd,$parse:Yd,$rootScope:Zd,$q:$d,$sce:ae,$sceDelegate:be,$sniffer:ce,$templateCache:de,$timeout:ee,$window:fe,$$rAF:ge,$$asyncCallback:he})}])}function Xa(b){return b.replace(ie,function(a,b,d,e){return e?d.toUpperCase():d}).replace(je,"Moz$1")}function Gb(b,a,c,d){function e(b){var e=c&&b?[this.filter(b)]:[this],m=a,h,l,p,n,r,t;if(!d||null!=b)for(;e.length;)for(h=e.shift(),l=0,p=h.length;l<p;l++)for(n=
x(h[l]),m?n.triggerHandler("$destroy"):m=!m,r=0,n=(t=n.children()).length;r<n;r++)e.push(Da(t[r]));return f.apply(this,arguments)}var f=Da.fn[b],f=f.$original||f;e.$original=f;Da.fn[b]=e}function R(b){if(b instanceof R)return b;z(b)&&(b=aa(b));if(!(this instanceof R)){if(z(b)&&"<"!=b.charAt(0))throw Hb("nosel");return new R(b)}if(z(b)){var a=b;b=W;var c;if(c=ke.exec(a))b=[b.createElement(c[1])];else{var d=b,e;b=d.createDocumentFragment();c=[];if(Ib.test(a)){d=b.appendChild(d.createElement("div"));
e=(le.exec(a)||["",""])[1].toLowerCase();e=ba[e]||ba._default;d.innerHTML="<div>&#160;</div>"+e[1]+a.replace(me,"<$1></$2>")+e[2];d.removeChild(d.firstChild);for(a=e[0];a--;)d=d.lastChild;a=0;for(e=d.childNodes.length;a<e;++a)c.push(d.childNodes[a]);d=b.firstChild;d.textContent=""}else c.push(d.createTextNode(a));b.textContent="";b.innerHTML="";b=c}Jb(this,b);x(W.createDocumentFragment()).append(this)}else Jb(this,b)}function Kb(b){return b.cloneNode(!0)}function Ja(b){Lb(b);var a=0;for(b=b.childNodes||
[];a<b.length;a++)Ja(b[a])}function nc(b,a,c,d){if(B(d))throw Hb("offargs");var e=la(b,"events");la(b,"handle")&&(v(a)?q(e,function(a,c){Ya(b,c,a);delete e[c]}):q(a.split(" "),function(a){v(c)?(Ya(b,a,e[a]),delete e[a]):Qa(e[a]||[],c)}))}function Lb(b,a){var c=b.ng339,d=Za[c];d&&(a?delete Za[c].data[a]:(d.handle&&(d.events.$destroy&&d.handle({},"$destroy"),nc(b)),delete Za[c],b.ng339=s))}function la(b,a,c){var d=b.ng339,d=Za[d||-1];if(B(c))d||(b.ng339=d=++ne,d=Za[d]={}),d[a]=c;else return d&&d[a]}
function Mb(b,a,c){var d=la(b,"data"),e=B(c),f=!e&&B(a),g=f&&!S(a);d||g||la(b,"data",d={});if(e)d[a]=c;else if(f){if(g)return d&&d[a];F(d,a)}else return d}function Nb(b,a){return b.getAttribute?-1<(" "+(b.getAttribute("class")||"")+" ").replace(/[\n\t]/g," ").indexOf(" "+a+" "):!1}function kb(b,a){a&&b.setAttribute&&q(a.split(" "),function(a){b.setAttribute("class",aa((" "+(b.getAttribute("class")||"")+" ").replace(/[\n\t]/g," ").replace(" "+aa(a)+" "," ")))})}function lb(b,a){if(a&&b.setAttribute){var c=
(" "+(b.getAttribute("class")||"")+" ").replace(/[\n\t]/g," ");q(a.split(" "),function(a){a=aa(a);-1===c.indexOf(" "+a+" ")&&(c+=a+" ")});b.setAttribute("class",aa(c))}}function Jb(b,a){if(a){a=a.nodeName||!B(a.length)||Fa(a)?[a]:a;for(var c=0;c<a.length;c++)b.push(a[c])}}function oc(b,a){return mb(b,"$"+(a||"ngController")+"Controller")}function mb(b,a,c){9==b.nodeType&&(b=b.documentElement);for(a=I(a)?a:[a];b;){for(var d=0,e=a.length;d<e;d++)if((c=x.data(b,a[d]))!==s)return c;b=b.parentNode||11===
b.nodeType&&b.host}}function pc(b){for(var a=0,c=b.childNodes;a<c.length;a++)Ja(c[a]);for(;b.firstChild;)b.removeChild(b.firstChild)}function qc(b,a){var c=nb[a.toLowerCase()];return c&&rc[b.nodeName]&&c}function oe(b,a){var c=function(c,e){c.preventDefault||(c.preventDefault=function(){c.returnValue=!1});c.stopPropagation||(c.stopPropagation=function(){c.cancelBubble=!0});c.target||(c.target=c.srcElement||W);if(v(c.defaultPrevented)){var f=c.preventDefault;c.preventDefault=function(){c.defaultPrevented=
!0;f.call(c)};c.defaultPrevented=!1}c.isDefaultPrevented=function(){return c.defaultPrevented||!1===c.returnValue};var g=ga(a[e||c.type]||[]);q(g,function(a){a.call(b,c)});8>=Q?(c.preventDefault=null,c.stopPropagation=null,c.isDefaultPrevented=null):(delete c.preventDefault,delete c.stopPropagation,delete c.isDefaultPrevented)};c.elem=b;return c}function Ka(b,a){var c=typeof b,d;"function"==c||"object"==c&&null!==b?"function"==typeof(d=b.$$hashKey)?d=b.$$hashKey():d===s&&(d=b.$$hashKey=(a||fb)()):
d=b;return c+":"+d}function $a(b,a){if(a){var c=0;this.nextUid=function(){return++c}}q(b,this.put,this)}function sc(b){var a,c;"function"===typeof b?(a=b.$inject)||(a=[],b.length&&(c=b.toString().replace(pe,""),c=c.match(qe),q(c[1].split(re),function(b){b.replace(se,function(b,c,d){a.push(d)})})),b.$inject=a):I(b)?(c=b.length-1,Ua(b[c],"fn"),a=b.slice(0,c)):Ua(b,"fn",!0);return a}function gc(b){function a(a){return function(b,c){if(S(b))q(b,$b(a));else return a(b,c)}}function c(a,b){Ca(a,"service");
if(C(b)||I(b))b=p.instantiate(b);if(!b.$get)throw ab("pget",a);return l[a+k]=b}function d(a,b){return c(a,{$get:b})}function e(a){var b=[],c,d,f,k;q(a,function(a){if(!h.get(a)){h.put(a,!0);try{if(z(a))for(c=Wa(a),b=b.concat(e(c.requires)).concat(c._runBlocks),d=c._invokeQueue,f=0,k=d.length;f<k;f++){var g=d[f],m=p.get(g[0]);m[g[1]].apply(m,g[2])}else C(a)?b.push(p.invoke(a)):I(a)?b.push(p.invoke(a)):Ua(a,"module")}catch(l){throw I(a)&&(a=a[a.length-1]),l.message&&(l.stack&&-1==l.stack.indexOf(l.message))&&
(l=l.message+"\n"+l.stack),ab("modulerr",a,l.stack||l.message||l);}}});return b}function f(a,b){function c(d){if(a.hasOwnProperty(d)){if(a[d]===g)throw ab("cdep",d+" <- "+m.join(" <- "));return a[d]}try{return m.unshift(d),a[d]=g,a[d]=b(d)}catch(e){throw a[d]===g&&delete a[d],e;}finally{m.shift()}}function d(a,b,e){var f=[],k=sc(a),g,m,h;m=0;for(g=k.length;m<g;m++){h=k[m];if("string"!==typeof h)throw ab("itkn",h);f.push(e&&e.hasOwnProperty(h)?e[h]:c(h))}I(a)&&(a=a[g]);return a.apply(b,f)}return{invoke:d,
instantiate:function(a,b){var c=function(){},e;c.prototype=(I(a)?a[a.length-1]:a).prototype;c=new c;e=d(a,c,b);return S(e)||C(e)?e:c},get:c,annotate:sc,has:function(b){return l.hasOwnProperty(b+k)||a.hasOwnProperty(b)}}}var g={},k="Provider",m=[],h=new $a([],!0),l={$provide:{provider:a(c),factory:a(d),service:a(function(a,b){return d(a,["$injector",function(a){return a.instantiate(b)}])}),value:a(function(a,b){return d(a,$(b))}),constant:a(function(a,b){Ca(a,"constant");l[a]=b;n[a]=b}),decorator:function(a,
b){var c=p.get(a+k),d=c.$get;c.$get=function(){var a=r.invoke(d,c);return r.invoke(b,null,{$delegate:a})}}}},p=l.$injector=f(l,function(){throw ab("unpr",m.join(" <- "));}),n={},r=n.$injector=f(n,function(a){a=p.get(a+k);return r.invoke(a.$get,a)});q(e(b),function(a){r.invoke(a||D)});return r}function Ld(){var b=!0;this.disableAutoScrolling=function(){b=!1};this.$get=["$window","$location","$rootScope",function(a,c,d){function e(a){var b=null;q(a,function(a){b||"a"!==K(a.nodeName)||(b=a)});return b}
function f(){var b=c.hash(),d;b?(d=g.getElementById(b))?d.scrollIntoView():(d=e(g.getElementsByName(b)))?d.scrollIntoView():"top"===b&&a.scrollTo(0,0):a.scrollTo(0,0)}var g=a.document;b&&d.$watch(function(){return c.hash()},function(){d.$evalAsync(f)});return f}]}function he(){this.$get=["$$rAF","$timeout",function(b,a){return b.supported?function(a){return b(a)}:function(b){return a(b,0,!1)}}]}function te(b,a,c,d){function e(a){try{a.apply(null,Aa.call(arguments,1))}finally{if(t--,0===t)for(;L.length;)try{L.pop()()}catch(b){c.error(b)}}}
function f(a,b){(function ca(){q(w,function(a){a()});u=b(ca,a)})()}function g(){A=null;M!=k.url()&&(M=k.url(),q(da,function(a){a(k.url())}))}var k=this,m=a[0],h=b.location,l=b.history,p=b.setTimeout,n=b.clearTimeout,r={};k.isMock=!1;var t=0,L=[];k.$$completeOutstandingRequest=e;k.$$incOutstandingRequestCount=function(){t++};k.notifyWhenNoOutstandingRequests=function(a){q(w,function(a){a()});0===t?a():L.push(a)};var w=[],u;k.addPollFn=function(a){v(u)&&f(100,p);w.push(a);return a};var M=h.href,X=a.find("base"),
A=null;k.url=function(a,c){h!==b.location&&(h=b.location);l!==b.history&&(l=b.history);if(a){if(M!=a)return M=a,d.history?c?l.replaceState(null,"",a):(l.pushState(null,"",a),X.attr("href",X.attr("href"))):(A=a,c?h.replace(a):h.href=a),k}else return A||h.href.replace(/%27/g,"'")};var da=[],J=!1;k.onUrlChange=function(a){if(!J){if(d.history)x(b).on("popstate",g);if(d.hashchange)x(b).on("hashchange",g);else k.addPollFn(g);J=!0}da.push(a);return a};k.baseHref=function(){var a=X.attr("href");return a?
a.replace(/^(https?\:)?\/\/[^\/]*/,""):""};var T={},ea="",O=k.baseHref();k.cookies=function(a,b){var d,e,f,k;if(a)b===s?m.cookie=escape(a)+"=;path="+O+";expires=Thu, 01 Jan 1970 00:00:00 GMT":z(b)&&(d=(m.cookie=escape(a)+"="+escape(b)+";path="+O).length+1,4096<d&&c.warn("Cookie '"+a+"' possibly not set or overflowed because it was too large ("+d+" > 4096 bytes)!"));else{if(m.cookie!==ea)for(ea=m.cookie,d=ea.split("; "),T={},f=0;f<d.length;f++)e=d[f],k=e.indexOf("="),0<k&&(a=unescape(e.substring(0,
k)),T[a]===s&&(T[a]=unescape(e.substring(k+1))));return T}};k.defer=function(a,b){var c;t++;c=p(function(){delete r[c];e(a)},b||0);r[c]=!0;return c};k.defer.cancel=function(a){return r[a]?(delete r[a],n(a),e(D),!0):!1}}function Nd(){this.$get=["$window","$log","$sniffer","$document",function(b,a,c,d){return new te(b,d,a,c)}]}function Od(){this.$get=function(){function b(b,d){function e(a){a!=p&&(n?n==a&&(n=a.n):n=a,f(a.n,a.p),f(a,p),p=a,p.n=null)}function f(a,b){a!=b&&(a&&(a.p=b),b&&(b.n=a))}if(b in
a)throw y("$cacheFactory")("iid",b);var g=0,k=F({},d,{id:b}),m={},h=d&&d.capacity||Number.MAX_VALUE,l={},p=null,n=null;return a[b]={put:function(a,b){if(h<Number.MAX_VALUE){var c=l[a]||(l[a]={key:a});e(c)}if(!v(b))return a in m||g++,m[a]=b,g>h&&this.remove(n.key),b},get:function(a){if(h<Number.MAX_VALUE){var b=l[a];if(!b)return;e(b)}return m[a]},remove:function(a){if(h<Number.MAX_VALUE){var b=l[a];if(!b)return;b==p&&(p=b.p);b==n&&(n=b.n);f(b.n,b.p);delete l[a]}delete m[a];g--},removeAll:function(){m=
{};g=0;l={};p=n=null},destroy:function(){l=k=m=null;delete a[b]},info:function(){return F({},k,{size:g})}}}var a={};b.info=function(){var b={};q(a,function(a,e){b[e]=a.info()});return b};b.get=function(b){return a[b]};return b}}function de(){this.$get=["$cacheFactory",function(b){return b("templates")}]}function ic(b,a){var c={},d="Directive",e=/^\s*directive\:\s*([\d\w_\-]+)\s+(.*)$/,f=/(([\d\w_\-]+)(?:\:([^;]+))?;?)/,g=/^(on[a-z]+|formaction)$/;this.directive=function m(a,e){Ca(a,"directive");z(a)?
(Db(e,"directiveFactory"),c.hasOwnProperty(a)||(c[a]=[],b.factory(a+d,["$injector","$exceptionHandler",function(b,d){var e=[];q(c[a],function(c,f){try{var g=b.invoke(c);C(g)?g={compile:$(g)}:!g.compile&&g.link&&(g.compile=$(g.link));g.priority=g.priority||0;g.index=f;g.name=g.name||a;g.require=g.require||g.controller&&g.name;g.restrict=g.restrict||"A";e.push(g)}catch(m){d(m)}});return e}])),c[a].push(e)):q(a,$b(m));return this};this.aHrefSanitizationWhitelist=function(b){return B(b)?(a.aHrefSanitizationWhitelist(b),
this):a.aHrefSanitizationWhitelist()};this.imgSrcSanitizationWhitelist=function(b){return B(b)?(a.imgSrcSanitizationWhitelist(b),this):a.imgSrcSanitizationWhitelist()};this.$get=["$injector","$interpolate","$exceptionHandler","$http","$templateCache","$parse","$controller","$rootScope","$document","$sce","$animate","$$sanitizeUri",function(a,b,l,p,n,r,t,L,w,u,M,X){function A(a,b,c,d,e){a instanceof x||(a=x(a));q(a,function(b,c){3==b.nodeType&&b.nodeValue.match(/\S+/)&&(a[c]=x(b).wrap("<span></span>").parent()[0])});
var f=J(a,b,a,c,d,e);da(a,"ng-scope");return function(b,c,d,e){Db(b,"scope");var g=c?La.clone.call(a):a;q(d,function(a,b){g.data("$"+b+"Controller",a)});d=0;for(var m=g.length;d<m;d++){var h=g[d].nodeType;1!==h&&9!==h||g.eq(d).data("$scope",b)}c&&c(g,b);f&&f(b,g,g,e);return g}}function da(a,b){try{a.addClass(b)}catch(c){}}function J(a,b,c,d,e,f){function g(a,c,d,e){var f,h,l,r,p,n,t;f=c.length;var w=Array(f);for(r=0;r<f;r++)w[r]=c[r];n=r=0;for(p=m.length;r<p;n++)h=w[n],c=m[r++],f=m[r++],c?(c.scope?
(l=a.$new(),x.data(h,"$scope",l)):l=a,t=c.transcludeOnThisElement?T(a,c.transclude,e):!c.templateOnThisElement&&e?e:!e&&b?T(a,b):null,c(f,l,h,d,t)):f&&f(a,h.childNodes,s,e)}for(var m=[],h,l,r,p,n=0;n<a.length;n++)h=new Ob,l=ea(a[n],[],h,0===n?d:s,e),(f=l.length?H(l,a[n],h,b,c,null,[],[],f):null)&&f.scope&&da(h.$$element,"ng-scope"),h=f&&f.terminal||!(r=a[n].childNodes)||!r.length?null:J(r,f?(f.transcludeOnThisElement||!f.templateOnThisElement)&&f.transclude:b),m.push(f,h),p=p||f||h,f=null;return p?
g:null}function T(a,b,c){return function(d,e,f){var g=!1;d||(d=a.$new(),g=d.$$transcluded=!0);e=b(d,e,f,c);if(g)e.on("$destroy",function(){d.$destroy()});return e}}function ea(a,b,c,d,g){var h=c.$attr,m;switch(a.nodeType){case 1:ca(b,ma(Ma(a).toLowerCase()),"E",d,g);for(var l,r,p,n=a.attributes,t=0,w=n&&n.length;t<w;t++){var L=!1,M=!1;l=n[t];if(!Q||8<=Q||l.specified){m=l.name;r=aa(l.value);l=ma(m);if(p=V.test(l))m=jb(l.substr(6),"-");var u=l.replace(/(Start|End)$/,"");l===u+"Start"&&(L=m,M=m.substr(0,
m.length-5)+"end",m=m.substr(0,m.length-6));l=ma(m.toLowerCase());h[l]=m;if(p||!c.hasOwnProperty(l))c[l]=r,qc(a,l)&&(c[l]=!0);P(a,b,r,l);ca(b,l,"A",d,g,L,M)}}a=a.className;if(z(a)&&""!==a)for(;m=f.exec(a);)l=ma(m[2]),ca(b,l,"C",d,g)&&(c[l]=aa(m[3])),a=a.substr(m.index+m[0].length);break;case 3:y(b,a.nodeValue);break;case 8:try{if(m=e.exec(a.nodeValue))l=ma(m[1]),ca(b,l,"M",d,g)&&(c[l]=aa(m[2]))}catch(A){}}b.sort(v);return b}function O(a,b,c){var d=[],e=0;if(b&&a.hasAttribute&&a.hasAttribute(b)){do{if(!a)throw ia("uterdir",
b,c);1==a.nodeType&&(a.hasAttribute(b)&&e++,a.hasAttribute(c)&&e--);d.push(a);a=a.nextSibling}while(0<e)}else d.push(a);return x(d)}function E(a,b,c){return function(d,e,f,g,m){e=O(e[0],b,c);return a(d,e,f,g,m)}}function H(a,c,d,e,f,g,m,p,n){function w(a,b,c,d){if(a){c&&(a=E(a,c,d));a.require=G.require;a.directiveName=na;if(J===G||G.$$isolateScope)a=tc(a,{isolateScope:!0});m.push(a)}if(b){c&&(b=E(b,c,d));b.require=G.require;b.directiveName=na;if(J===G||G.$$isolateScope)b=tc(b,{isolateScope:!0});p.push(b)}}
function L(a,b,c,d){var e,f="data",g=!1;if(z(b)){for(;"^"==(e=b.charAt(0))||"?"==e;)b=b.substr(1),"^"==e&&(f="inheritedData"),g=g||"?"==e;e=null;d&&"data"===f&&(e=d[b]);e=e||c[f]("$"+b+"Controller");if(!e&&!g)throw ia("ctreq",b,a);}else I(b)&&(e=[],q(b,function(b){e.push(L(a,b,c,d))}));return e}function M(a,e,f,g,n){function w(a,b){var c;2>arguments.length&&(b=a,a=s);Ea&&(c=ea);return n(a,b,c)}var u,N,A,E,T,O,ea={},pb;u=c===f?d:ga(d,new Ob(x(f),d.$attr));N=u.$$element;if(J){var ca=/^\s*([@=&])(\??)\s*(\w*)\s*$/;
O=e.$new(!0);!H||H!==J&&H!==J.$$originalDirective?N.data("$isolateScopeNoTemplate",O):N.data("$isolateScope",O);da(N,"ng-isolate-scope");q(J.scope,function(a,c){var d=a.match(ca)||[],f=d[3]||c,g="?"==d[2],d=d[1],m,l,p,n;O.$$isolateBindings[c]=d+f;switch(d){case "@":u.$observe(f,function(a){O[c]=a});u.$$observers[f].$$scope=e;u[f]&&(O[c]=b(u[f])(e));break;case "=":if(g&&!u[f])break;l=r(u[f]);n=l.literal?za:function(a,b){return a===b};p=l.assign||function(){m=O[c]=l(e);throw ia("nonassign",u[f],J.name);
};m=O[c]=l(e);O.$watch(function(){var a=l(e);n(a,O[c])||(n(a,m)?p(e,a=O[c]):O[c]=a);return m=a},null,l.literal);break;case "&":l=r(u[f]);O[c]=function(a){return l(e,a)};break;default:throw ia("iscp",J.name,c,a);}})}pb=n&&w;X&&q(X,function(a){var b={$scope:a===J||a.$$isolateScope?O:e,$element:N,$attrs:u,$transclude:pb},c;T=a.controller;"@"==T&&(T=u[a.name]);c=t(T,b);ea[a.name]=c;Ea||N.data("$"+a.name+"Controller",c);a.controllerAs&&(b.$scope[a.controllerAs]=c)});g=0;for(A=m.length;g<A;g++)try{E=m[g],
E(E.isolateScope?O:e,N,u,E.require&&L(E.directiveName,E.require,N,ea),pb)}catch(ob){l(ob,ha(N))}g=e;J&&(J.template||null===J.templateUrl)&&(g=O);a&&a(g,f.childNodes,s,n);for(g=p.length-1;0<=g;g--)try{E=p[g],E(E.isolateScope?O:e,N,u,E.require&&L(E.directiveName,E.require,N,ea),pb)}catch(G){l(G,ha(N))}}n=n||{};for(var u=-Number.MAX_VALUE,T,X=n.controllerDirectives,J=n.newIsolateScopeDirective,H=n.templateDirective,ca=n.nonTlbTranscludeDirective,v=!1,F=!1,Ea=n.hasElementTranscludeDirective,y=d.$$element=
x(c),G,na,U,R=e,Q,P=0,oa=a.length;P<oa;P++){G=a[P];var V=G.$$start,Y=G.$$end;V&&(y=O(c,V,Y));U=s;if(u>G.priority)break;if(U=G.scope)T=T||G,G.templateUrl||(K("new/isolated scope",J,G,y),S(U)&&(J=G));na=G.name;!G.templateUrl&&G.controller&&(U=G.controller,X=X||{},K("'"+na+"' controller",X[na],G,y),X[na]=G);if(U=G.transclude)v=!0,G.$$tlb||(K("transclusion",ca,G,y),ca=G),"element"==U?(Ea=!0,u=G.priority,U=y,y=d.$$element=x(W.createComment(" "+na+": "+d[na]+" ")),c=y[0],qb(f,Aa.call(U,0),c),R=A(U,e,u,
g&&g.name,{nonTlbTranscludeDirective:ca})):(U=x(Kb(c)).contents(),y.empty(),R=A(U,e));if(G.template)if(F=!0,K("template",H,G,y),H=G,U=C(G.template)?G.template(y,d):G.template,U=Z(U),G.replace){g=G;U=Ib.test(U)?x(aa(U)):[];c=U[0];if(1!=U.length||1!==c.nodeType)throw ia("tplrt",na,"");qb(f,y,c);oa={$attr:{}};U=ea(c,[],oa);var $=a.splice(P+1,a.length-(P+1));J&&ob(U);a=a.concat(U).concat($);B(d,oa);oa=a.length}else y.html(U);if(G.templateUrl)F=!0,K("template",H,G,y),H=G,G.replace&&(g=G),M=D(a.splice(P,
a.length-P),y,d,f,v&&R,m,p,{controllerDirectives:X,newIsolateScopeDirective:J,templateDirective:H,nonTlbTranscludeDirective:ca}),oa=a.length;else if(G.compile)try{Q=G.compile(y,d,R),C(Q)?w(null,Q,V,Y):Q&&w(Q.pre,Q.post,V,Y)}catch(ba){l(ba,ha(y))}G.terminal&&(M.terminal=!0,u=Math.max(u,G.priority))}M.scope=T&&!0===T.scope;M.transcludeOnThisElement=v;M.templateOnThisElement=F;M.transclude=R;n.hasElementTranscludeDirective=Ea;return M}function ob(a){for(var b=0,c=a.length;b<c;b++)a[b]=bc(a[b],{$$isolateScope:!0})}
function ca(b,e,f,g,h,r,p){if(e===h)return null;h=null;if(c.hasOwnProperty(e)){var n;e=a.get(e+d);for(var t=0,w=e.length;t<w;t++)try{n=e[t],(g===s||g>n.priority)&&-1!=n.restrict.indexOf(f)&&(r&&(n=bc(n,{$$start:r,$$end:p})),b.push(n),h=n)}catch(L){l(L)}}return h}function B(a,b){var c=b.$attr,d=a.$attr,e=a.$$element;q(a,function(d,e){"$"!=e.charAt(0)&&(b[e]&&b[e]!==d&&(d+=("style"===e?";":" ")+b[e]),a.$set(e,d,!0,c[e]))});q(b,function(b,f){"class"==f?(da(e,b),a["class"]=(a["class"]?a["class"]+" ":
"")+b):"style"==f?(e.attr("style",e.attr("style")+";"+b),a.style=(a.style?a.style+";":"")+b):"$"==f.charAt(0)||a.hasOwnProperty(f)||(a[f]=b,d[f]=c[f])})}function D(a,b,c,d,e,f,g,m){var h=[],l,r,t=b[0],w=a.shift(),L=F({},w,{templateUrl:null,transclude:null,replace:null,$$originalDirective:w}),M=C(w.templateUrl)?w.templateUrl(b,c):w.templateUrl;b.empty();p.get(u.getTrustedResourceUrl(M),{cache:n}).success(function(p){var n,u;p=Z(p);if(w.replace){p=Ib.test(p)?x(aa(p)):[];n=p[0];if(1!=p.length||1!==n.nodeType)throw ia("tplrt",
w.name,M);p={$attr:{}};qb(d,b,n);var A=ea(n,[],p);S(w.scope)&&ob(A);a=A.concat(a);B(c,p)}else n=t,b.html(p);a.unshift(L);l=H(a,n,c,e,b,w,f,g,m);q(d,function(a,c){a==n&&(d[c]=b[0])});for(r=J(b[0].childNodes,e);h.length;){p=h.shift();u=h.shift();var E=h.shift(),X=h.shift(),A=b[0];if(u!==t){var O=u.className;m.hasElementTranscludeDirective&&w.replace||(A=Kb(n));qb(E,x(u),A);da(x(A),O)}u=l.transcludeOnThisElement?T(p,l.transclude,X):X;l(r,p,A,d,u)}h=null}).error(function(a,b,c,d){throw ia("tpload",d.url);
});return function(a,b,c,d,e){a=e;h?(h.push(b),h.push(c),h.push(d),h.push(a)):(l.transcludeOnThisElement&&(a=T(b,l.transclude,e)),l(r,b,c,d,a))}}function v(a,b){var c=b.priority-a.priority;return 0!==c?c:a.name!==b.name?a.name<b.name?-1:1:a.index-b.index}function K(a,b,c,d){if(b)throw ia("multidir",b.name,c.name,a,ha(d));}function y(a,c){var d=b(c,!0);d&&a.push({priority:0,compile:function(a){var b=a.parent().length;b&&da(a.parent(),"ng-binding");return function(a,c){var e=c.parent(),f=e.data("$binding")||
[];f.push(d);e.data("$binding",f);b||da(e,"ng-binding");a.$watch(d,function(a){c[0].nodeValue=a})}}})}function R(a,b){if("srcdoc"==b)return u.HTML;var c=Ma(a);if("xlinkHref"==b||"FORM"==c&&"action"==b||"IMG"!=c&&("src"==b||"ngSrc"==b))return u.RESOURCE_URL}function P(a,c,d,e){var f=b(d,!0);if(f){if("multiple"===e&&"SELECT"===Ma(a))throw ia("selmulti",ha(a));c.push({priority:100,compile:function(){return{pre:function(c,d,m){d=m.$$observers||(m.$$observers={});if(g.test(e))throw ia("nodomevents");if(f=
b(m[e],!0,R(a,e)))m[e]=f(c),(d[e]||(d[e]=[])).$$inter=!0,(m.$$observers&&m.$$observers[e].$$scope||c).$watch(f,function(a,b){"class"===e&&a!=b?m.$updateClass(a,b):m.$set(e,a)})}}}})}}function qb(a,b,c){var d=b[0],e=b.length,f=d.parentNode,g,m;if(a)for(g=0,m=a.length;g<m;g++)if(a[g]==d){a[g++]=c;m=g+e-1;for(var h=a.length;g<h;g++,m++)m<h?a[g]=a[m]:delete a[g];a.length-=e-1;break}f&&f.replaceChild(c,d);a=W.createDocumentFragment();a.appendChild(d);c[x.expando]=d[x.expando];d=1;for(e=b.length;d<e;d++)f=
b[d],x(f).remove(),a.appendChild(f),delete b[d];b[0]=c;b.length=1}function tc(a,b){return F(function(){return a.apply(null,arguments)},a,b)}var Ob=function(a,b){this.$$element=a;this.$attr=b||{}};Ob.prototype={$normalize:ma,$addClass:function(a){a&&0<a.length&&M.addClass(this.$$element,a)},$removeClass:function(a){a&&0<a.length&&M.removeClass(this.$$element,a)},$updateClass:function(a,b){var c=uc(a,b),d=uc(b,a);0===c.length?M.removeClass(this.$$element,d):0===d.length?M.addClass(this.$$element,c):
M.setClass(this.$$element,c,d)},$set:function(a,b,c,d){var e=qc(this.$$element[0],a);e&&(this.$$element.prop(a,b),d=e);this[a]=b;d?this.$attr[a]=d:(d=this.$attr[a])||(this.$attr[a]=d=jb(a,"-"));e=Ma(this.$$element);if("A"===e&&"href"===a||"IMG"===e&&"src"===a)this[a]=b=X(b,"src"===a);!1!==c&&(null===b||b===s?this.$$element.removeAttr(d):this.$$element.attr(d,b));(c=this.$$observers)&&q(c[a],function(a){try{a(b)}catch(c){l(c)}})},$observe:function(a,b){var c=this,d=c.$$observers||(c.$$observers={}),
e=d[a]||(d[a]=[]);e.push(b);L.$evalAsync(function(){e.$$inter||b(c[a])});return b}};var Ea=b.startSymbol(),oa=b.endSymbol(),Z="{{"==Ea||"}}"==oa?Ga:function(a){return a.replace(/\{\{/g,Ea).replace(/}}/g,oa)},V=/^ngAttr[A-Z]/;return A}]}function ma(b){return Xa(b.replace(ue,""))}function uc(b,a){var c="",d=b.split(/\s+/),e=a.split(/\s+/),f=0;a:for(;f<d.length;f++){for(var g=d[f],k=0;k<e.length;k++)if(g==e[k])continue a;c+=(0<c.length?" ":"")+g}return c}function Pd(){var b={},a=/^(\S+)(\s+as\s+(\w+))?$/;
this.register=function(a,d){Ca(a,"controller");S(a)?F(b,a):b[a]=d};this.$get=["$injector","$window",function(c,d){return function(e,f){var g,k,m;z(e)&&(g=e.match(a),k=g[1],m=g[3],e=b.hasOwnProperty(k)?b[k]:hc(f.$scope,k,!0)||hc(d,k,!0),Ua(e,k,!0));g=c.instantiate(e,f);if(m){if(!f||"object"!==typeof f.$scope)throw y("$controller")("noscp",k||e.name,m);f.$scope[m]=g}return g}}]}function Qd(){this.$get=["$window",function(b){return x(b.document)}]}function Rd(){this.$get=["$log",function(b){return function(a,
c){b.error.apply(b,arguments)}}]}function vc(b){var a={},c,d,e;if(!b)return a;q(b.split("\n"),function(b){e=b.indexOf(":");c=K(aa(b.substr(0,e)));d=aa(b.substr(e+1));c&&(a[c]=a[c]?a[c]+", "+d:d)});return a}function wc(b){var a=S(b)?b:s;return function(c){a||(a=vc(b));return c?a[K(c)]||null:a}}function xc(b,a,c){if(C(c))return c(b,a);q(c,function(c){b=c(b,a)});return b}function Ud(){var b=/^\s*(\[|\{[^\{])/,a=/[\}\]]\s*$/,c=/^\)\]\}',?\n/,d={"Content-Type":"application/json;charset=utf-8"},e=this.defaults=
{transformResponse:[function(d){z(d)&&(d=d.replace(c,""),b.test(d)&&a.test(d)&&(d=cc(d)));return d}],transformRequest:[function(a){return S(a)&&"[object File]"!==ya.call(a)&&"[object Blob]"!==ya.call(a)?ta(a):a}],headers:{common:{Accept:"application/json, text/plain, */*"},post:ga(d),put:ga(d),patch:ga(d)},xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN"},f=this.interceptors=[],g=this.responseInterceptors=[];this.$get=["$httpBackend","$browser","$cacheFactory","$rootScope","$q","$injector",
function(a,b,c,d,p,n){function r(a){function b(a){var d=F({},a,{data:xc(a.data,a.headers,c.transformResponse)});return 200<=a.status&&300>a.status?d:p.reject(d)}var c={method:"get",transformRequest:e.transformRequest,transformResponse:e.transformResponse},d=function(a){var b=e.headers,c=F({},a.headers),d,f,b=F({},b.common,b[K(a.method)]);a:for(d in b){a=K(d);for(f in c)if(K(f)===a)continue a;c[d]=b[d]}(function(a){var b;q(a,function(c,d){C(c)&&(b=c(),null!=b?a[d]=b:delete a[d])})})(c);return c}(a);
F(c,a);c.headers=d;c.method=Ia(c.method);var f=[function(a){d=a.headers;var c=xc(a.data,wc(d),a.transformRequest);v(c)&&q(d,function(a,b){"content-type"===K(b)&&delete d[b]});v(a.withCredentials)&&!v(e.withCredentials)&&(a.withCredentials=e.withCredentials);return t(a,c,d).then(b,b)},s],g=p.when(c);for(q(u,function(a){(a.request||a.requestError)&&f.unshift(a.request,a.requestError);(a.response||a.responseError)&&f.push(a.response,a.responseError)});f.length;){a=f.shift();var m=f.shift(),g=g.then(a,
m)}g.success=function(a){g.then(function(b){a(b.data,b.status,b.headers,c)});return g};g.error=function(a){g.then(null,function(b){a(b.data,b.status,b.headers,c)});return g};return g}function t(c,f,g){function h(a,b,c,e){E&&(200<=a&&300>a?E.put(x,[a,b,vc(c),e]):E.remove(x));n(b,a,c,e);d.$$phase||d.$apply()}function n(a,b,d,e){b=Math.max(b,0);(200<=b&&300>b?u.resolve:u.reject)({data:a,status:b,headers:wc(d),config:c,statusText:e})}function t(){var a=Pa(r.pendingRequests,c);-1!==a&&r.pendingRequests.splice(a,
1)}var u=p.defer(),q=u.promise,E,H,x=L(c.url,c.params);r.pendingRequests.push(c);q.then(t,t);(c.cache||e.cache)&&(!1!==c.cache&&"GET"==c.method)&&(E=S(c.cache)?c.cache:S(e.cache)?e.cache:w);if(E)if(H=E.get(x),B(H)){if(H&&C(H.then))return H.then(t,t),H;I(H)?n(H[1],H[0],ga(H[2]),H[3]):n(H,200,{},"OK")}else E.put(x,q);v(H)&&((H=Pb(c.url)?b.cookies()[c.xsrfCookieName||e.xsrfCookieName]:s)&&(g[c.xsrfHeaderName||e.xsrfHeaderName]=H),a(c.method,x,f,h,g,c.timeout,c.withCredentials,c.responseType));return q}
function L(a,b){if(!b)return a;var c=[];Tc(b,function(a,b){null===a||v(a)||(I(a)||(a=[a]),q(a,function(a){S(a)&&(sa(a)?a=a.toISOString():S(a)&&(a=ta(a)));c.push(Ba(b)+"="+Ba(a))}))});0<c.length&&(a+=(-1==a.indexOf("?")?"?":"&")+c.join("&"));return a}var w=c("$http"),u=[];q(f,function(a){u.unshift(z(a)?n.get(a):n.invoke(a))});q(g,function(a,b){var c=z(a)?n.get(a):n.invoke(a);u.splice(b,0,{response:function(a){return c(p.when(a))},responseError:function(a){return c(p.reject(a))}})});r.pendingRequests=
[];(function(a){q(arguments,function(a){r[a]=function(b,c){return r(F(c||{},{method:a,url:b}))}})})("get","delete","head","jsonp");(function(a){q(arguments,function(a){r[a]=function(b,c,d){return r(F(d||{},{method:a,url:b,data:c}))}})})("post","put");r.defaults=e;return r}]}function ve(b){if(8>=Q&&(!b.match(/^(get|post|head|put|delete|options)$/i)||!P.XMLHttpRequest))return new P.ActiveXObject("Microsoft.XMLHTTP");if(P.XMLHttpRequest)return new P.XMLHttpRequest;throw y("$httpBackend")("noxhr");}function Vd(){this.$get=
["$browser","$window","$document",function(b,a,c){return we(b,ve,b.defer,a.angular.callbacks,c[0])}]}function we(b,a,c,d,e){function f(a,b,c){var f=e.createElement("script"),g=null;f.type="text/javascript";f.src=a;f.async=!0;g=function(a){Ya(f,"load",g);Ya(f,"error",g);e.body.removeChild(f);f=null;var k=-1,t="unknown";a&&("load"!==a.type||d[b].called||(a={type:"error"}),t=a.type,k="error"===a.type?404:200);c&&c(k,t)};rb(f,"load",g);rb(f,"error",g);8>=Q&&(f.onreadystatechange=function(){z(f.readyState)&&
/loaded|complete/.test(f.readyState)&&(f.onreadystatechange=null,g({type:"load"}))});e.body.appendChild(f);return g}var g=-1;return function(e,m,h,l,p,n,r,t){function L(){u=g;X&&X();A&&A.abort()}function w(a,d,e,f,g){J&&c.cancel(J);X=A=null;0===d&&(d=e?200:"file"==ua(m).protocol?404:0);a(1223===d?204:d,e,f,g||"");b.$$completeOutstandingRequest(D)}var u;b.$$incOutstandingRequestCount();m=m||b.url();if("jsonp"==K(e)){var M="_"+(d.counter++).toString(36);d[M]=function(a){d[M].data=a;d[M].called=!0};
var X=f(m.replace("JSON_CALLBACK","angular.callbacks."+M),M,function(a,b){w(l,a,d[M].data,"",b);d[M]=D})}else{var A=a(e);A.open(e,m,!0);q(p,function(a,b){B(a)&&A.setRequestHeader(b,a)});A.onreadystatechange=function(){if(A&&4==A.readyState){var a=null,b=null,c="";u!==g&&(a=A.getAllResponseHeaders(),b="response"in A?A.response:A.responseText);u===g&&10>Q||(c=A.statusText);w(l,u||A.status,b,a,c)}};r&&(A.withCredentials=!0);if(t)try{A.responseType=t}catch(da){if("json"!==t)throw da;}A.send(h||null)}if(0<
n)var J=c(L,n);else n&&C(n.then)&&n.then(L)}}function Sd(){var b="{{",a="}}";this.startSymbol=function(a){return a?(b=a,this):b};this.endSymbol=function(b){return b?(a=b,this):a};this.$get=["$parse","$exceptionHandler","$sce",function(c,d,e){function f(f,h,l){for(var p,n,r=0,t=[],L=f.length,w=!1,u=[];r<L;)-1!=(p=f.indexOf(b,r))&&-1!=(n=f.indexOf(a,p+g))?(r!=p&&t.push(f.substring(r,p)),t.push(r=c(w=f.substring(p+g,n))),r.exp=w,r=n+k,w=!0):(r!=L&&t.push(f.substring(r)),r=L);(L=t.length)||(t.push(""),
L=1);if(l&&1<t.length)throw yc("noconcat",f);if(!h||w)return u.length=L,r=function(a){try{for(var b=0,c=L,g;b<c;b++){if("function"==typeof(g=t[b]))if(g=g(a),g=l?e.getTrusted(l,g):e.valueOf(g),null==g)g="";else switch(typeof g){case "string":break;case "number":g=""+g;break;default:g=ta(g)}u[b]=g}return u.join("")}catch(k){a=yc("interr",f,k.toString()),d(a)}},r.exp=f,r.parts=t,r}var g=b.length,k=a.length;f.startSymbol=function(){return b};f.endSymbol=function(){return a};return f}]}function Td(){this.$get=
["$rootScope","$window","$q",function(b,a,c){function d(d,g,k,m){var h=a.setInterval,l=a.clearInterval,p=c.defer(),n=p.promise,r=0,t=B(m)&&!m;k=B(k)?k:0;n.then(null,null,d);n.$$intervalId=h(function(){p.notify(r++);0<k&&r>=k&&(p.resolve(r),l(n.$$intervalId),delete e[n.$$intervalId]);t||b.$apply()},g);e[n.$$intervalId]=p;return n}var e={};d.cancel=function(b){return b&&b.$$intervalId in e?(e[b.$$intervalId].reject("canceled"),a.clearInterval(b.$$intervalId),delete e[b.$$intervalId],!0):!1};return d}]}
function bd(){this.$get=function(){return{id:"en-us",NUMBER_FORMATS:{DECIMAL_SEP:".",GROUP_SEP:",",PATTERNS:[{minInt:1,minFrac:0,maxFrac:3,posPre:"",posSuf:"",negPre:"-",negSuf:"",gSize:3,lgSize:3},{minInt:1,minFrac:2,maxFrac:2,posPre:"\u00a4",posSuf:"",negPre:"(\u00a4",negSuf:")",gSize:3,lgSize:3}],CURRENCY_SYM:"$"},DATETIME_FORMATS:{MONTH:"January February March April May June July August September October November December".split(" "),SHORTMONTH:"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),
DAY:"Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),SHORTDAY:"Sun Mon Tue Wed Thu Fri Sat".split(" "),AMPMS:["AM","PM"],medium:"MMM d, y h:mm:ss a","short":"M/d/yy h:mm a",fullDate:"EEEE, MMMM d, y",longDate:"MMMM d, y",mediumDate:"MMM d, y",shortDate:"M/d/yy",mediumTime:"h:mm:ss a",shortTime:"h:mm a"},pluralCat:function(b){return 1===b?"one":"other"}}}}function Qb(b){b=b.split("/");for(var a=b.length;a--;)b[a]=ib(b[a]);return b.join("/")}function zc(b,a,c){b=ua(b,c);a.$$protocol=
b.protocol;a.$$host=b.hostname;a.$$port=Z(b.port)||xe[b.protocol]||null}function Ac(b,a,c){var d="/"!==b.charAt(0);d&&(b="/"+b);b=ua(b,c);a.$$path=decodeURIComponent(d&&"/"===b.pathname.charAt(0)?b.pathname.substring(1):b.pathname);a.$$search=ec(b.search);a.$$hash=decodeURIComponent(b.hash);a.$$path&&"/"!=a.$$path.charAt(0)&&(a.$$path="/"+a.$$path)}function pa(b,a){if(0===a.indexOf(b))return a.substr(b.length)}function bb(b){var a=b.indexOf("#");return-1==a?b:b.substr(0,a)}function Rb(b){return b.substr(0,
bb(b).lastIndexOf("/")+1)}function Bc(b,a){this.$$html5=!0;a=a||"";var c=Rb(b);zc(b,this,b);this.$$parse=function(a){var e=pa(c,a);if(!z(e))throw Sb("ipthprfx",a,c);Ac(e,this,b);this.$$path||(this.$$path="/");this.$$compose()};this.$$compose=function(){var a=Cb(this.$$search),b=this.$$hash?"#"+ib(this.$$hash):"";this.$$url=Qb(this.$$path)+(a?"?"+a:"")+b;this.$$absUrl=c+this.$$url.substr(1)};this.$$rewrite=function(d){var e;if((e=pa(b,d))!==s)return d=e,(e=pa(a,e))!==s?c+(pa("/",e)||e):b+d;if((e=pa(c,
d))!==s)return c+e;if(c==d+"/")return c}}function Tb(b,a){var c=Rb(b);zc(b,this,b);this.$$parse=function(d){var e=pa(b,d)||pa(c,d),e="#"==e.charAt(0)?pa(a,e):this.$$html5?e:"";if(!z(e))throw Sb("ihshprfx",d,a);Ac(e,this,b);d=this.$$path;var f=/^\/[A-Z]:(\/.*)/;0===e.indexOf(b)&&(e=e.replace(b,""));f.exec(e)||(d=(e=f.exec(d))?e[1]:d);this.$$path=d;this.$$compose()};this.$$compose=function(){var c=Cb(this.$$search),e=this.$$hash?"#"+ib(this.$$hash):"";this.$$url=Qb(this.$$path)+(c?"?"+c:"")+e;this.$$absUrl=
b+(this.$$url?a+this.$$url:"")};this.$$rewrite=function(a){if(bb(b)==bb(a))return a}}function Ub(b,a){this.$$html5=!0;Tb.apply(this,arguments);var c=Rb(b);this.$$rewrite=function(d){var e;if(b==bb(d))return d;if(e=pa(c,d))return b+a+e;if(c===d+"/")return c};this.$$compose=function(){var c=Cb(this.$$search),e=this.$$hash?"#"+ib(this.$$hash):"";this.$$url=Qb(this.$$path)+(c?"?"+c:"")+e;this.$$absUrl=b+a+this.$$url}}function sb(b){return function(){return this[b]}}function Cc(b,a){return function(c){if(v(c))return this[b];
this[b]=a(c);this.$$compose();return this}}function Wd(){var b="",a=!1;this.hashPrefix=function(a){return B(a)?(b=a,this):b};this.html5Mode=function(b){return B(b)?(a=b,this):a};this.$get=["$rootScope","$browser","$sniffer","$rootElement",function(c,d,e,f){function g(a){c.$broadcast("$locationChangeSuccess",k.absUrl(),a)}var k,m,h=d.baseHref(),l=d.url(),p;a?(p=l.substring(0,l.indexOf("/",l.indexOf("//")+2))+(h||"/"),m=e.history?Bc:Ub):(p=bb(l),m=Tb);k=new m(p,"#"+b);k.$$parse(k.$$rewrite(l));f.on("click",
function(a){if(!a.ctrlKey&&!a.metaKey&&2!=a.which){for(var e=x(a.target);"a"!==K(e[0].nodeName);)if(e[0]===f[0]||!(e=e.parent())[0])return;var g=e.prop("href");S(g)&&"[object SVGAnimatedString]"===g.toString()&&(g=ua(g.animVal).href);if(m===Ub){var h=e.attr("href")||e.attr("xlink:href");if(0>h.indexOf("://"))if(g="#"+b,"/"==h[0])g=p+g+h;else if("#"==h[0])g=p+g+(k.path()||"/")+h;else{for(var l=k.path().split("/"),h=h.split("/"),n=0;n<h.length;n++)"."!=h[n]&&(".."==h[n]?l.pop():h[n].length&&l.push(h[n]));
g=p+g+l.join("/")}}l=k.$$rewrite(g);g&&(!e.attr("target")&&l&&!a.isDefaultPrevented())&&(a.preventDefault(),l!=d.url()&&(k.$$parse(l),c.$apply(),P.angular["ff-684208-preventDefault"]=!0))}});k.absUrl()!=l&&d.url(k.absUrl(),!0);d.onUrlChange(function(a){k.absUrl()!=a&&(c.$evalAsync(function(){var b=k.absUrl();k.$$parse(a);c.$broadcast("$locationChangeStart",a,b).defaultPrevented?(k.$$parse(b),d.url(b)):g(b)}),c.$$phase||c.$digest())});var n=0;c.$watch(function(){var a=d.url(),b=k.$$replace;n&&a==k.absUrl()||
(n++,c.$evalAsync(function(){c.$broadcast("$locationChangeStart",k.absUrl(),a).defaultPrevented?k.$$parse(a):(d.url(k.absUrl(),b),g(a))}));k.$$replace=!1;return n});return k}]}function Xd(){var b=!0,a=this;this.debugEnabled=function(a){return B(a)?(b=a,this):b};this.$get=["$window",function(c){function d(a){a instanceof Error&&(a.stack?a=a.message&&-1===a.stack.indexOf(a.message)?"Error: "+a.message+"\n"+a.stack:a.stack:a.sourceURL&&(a=a.message+"\n"+a.sourceURL+":"+a.line));return a}function e(a){var b=
c.console||{},e=b[a]||b.log||D;a=!1;try{a=!!e.apply}catch(m){}return a?function(){var a=[];q(arguments,function(b){a.push(d(b))});return e.apply(b,a)}:function(a,b){e(a,null==b?"":b)}}return{log:e("log"),info:e("info"),warn:e("warn"),error:e("error"),debug:function(){var c=e("debug");return function(){b&&c.apply(a,arguments)}}()}}]}function qa(b,a){if("__defineGetter__"===b||"__defineSetter__"===b||"__lookupGetter__"===b||"__lookupSetter__"===b||"__proto__"===b)throw ja("isecfld",a);return b}function Na(b,
a){if(b){if(b.constructor===b)throw ja("isecfn",a);if(b.document&&b.location&&b.alert&&b.setInterval)throw ja("isecwindow",a);if(b.children&&(b.nodeName||b.prop&&b.attr&&b.find))throw ja("isecdom",a);if(b===Object)throw ja("isecobj",a);}return b}function tb(b,a,c,d,e){e=e||{};a=a.split(".");for(var f,g=0;1<a.length;g++){f=qa(a.shift(),d);var k=b[f];k||(k={},b[f]=k);b=k;b.then&&e.unwrapPromises&&(va(d),"$$v"in b||function(a){a.then(function(b){a.$$v=b})}(b),b.$$v===s&&(b.$$v={}),b=b.$$v)}f=qa(a.shift(),
d);Na(b,d);Na(b[f],d);return b[f]=c}function Dc(b,a,c,d,e,f,g){qa(b,f);qa(a,f);qa(c,f);qa(d,f);qa(e,f);return g.unwrapPromises?function(g,m){var h=m&&m.hasOwnProperty(b)?m:g,l;if(null==h)return h;(h=h[b])&&h.then&&(va(f),"$$v"in h||(l=h,l.$$v=s,l.then(function(a){l.$$v=a})),h=h.$$v);if(!a)return h;if(null==h)return s;(h=h[a])&&h.then&&(va(f),"$$v"in h||(l=h,l.$$v=s,l.then(function(a){l.$$v=a})),h=h.$$v);if(!c)return h;if(null==h)return s;(h=h[c])&&h.then&&(va(f),"$$v"in h||(l=h,l.$$v=s,l.then(function(a){l.$$v=
a})),h=h.$$v);if(!d)return h;if(null==h)return s;(h=h[d])&&h.then&&(va(f),"$$v"in h||(l=h,l.$$v=s,l.then(function(a){l.$$v=a})),h=h.$$v);if(!e)return h;if(null==h)return s;(h=h[e])&&h.then&&(va(f),"$$v"in h||(l=h,l.$$v=s,l.then(function(a){l.$$v=a})),h=h.$$v);return h}:function(f,g){var h=g&&g.hasOwnProperty(b)?g:f;if(null==h)return h;h=h[b];if(!a)return h;if(null==h)return s;h=h[a];if(!c)return h;if(null==h)return s;h=h[c];if(!d)return h;if(null==h)return s;h=h[d];return e?null==h?s:h=h[e]:h}}function Ec(b,
a,c){if(Vb.hasOwnProperty(b))return Vb[b];var d=b.split("."),e=d.length,f;if(a.csp)f=6>e?Dc(d[0],d[1],d[2],d[3],d[4],c,a):function(b,f){var g=0,k;do k=Dc(d[g++],d[g++],d[g++],d[g++],d[g++],c,a)(b,f),f=s,b=k;while(g<e);return k};else{var g="var p;\n";q(d,function(b,d){qa(b,c);g+="if(s == null) return undefined;\ns="+(d?"s":'((k&&k.hasOwnProperty("'+b+'"))?k:s)')+'["'+b+'"];\n'+(a.unwrapPromises?'if (s && s.then) {\n pw("'+c.replace(/(["\r\n])/g,"\\$1")+'");\n if (!("$$v" in s)) {\n p=s;\n p.$$v = undefined;\n p.then(function(v) {p.$$v=v;});\n}\n s=s.$$v\n}\n':
"")});var g=g+"return s;",k=new Function("s","k","pw",g);k.toString=$(g);f=a.unwrapPromises?function(a,b){return k(a,b,va)}:k}"hasOwnProperty"!==b&&(Vb[b]=f);return f}function Yd(){var b={},a={csp:!1,unwrapPromises:!1,logPromiseWarnings:!0};this.unwrapPromises=function(b){return B(b)?(a.unwrapPromises=!!b,this):a.unwrapPromises};this.logPromiseWarnings=function(b){return B(b)?(a.logPromiseWarnings=b,this):a.logPromiseWarnings};this.$get=["$filter","$sniffer","$log",function(c,d,e){a.csp=d.csp;va=
function(b){a.logPromiseWarnings&&!Fc.hasOwnProperty(b)&&(Fc[b]=!0,e.warn("[$parse] Promise found in the expression `"+b+"`. Automatic unwrapping of promises in Angular expressions is deprecated."))};return function(d){var e;switch(typeof d){case "string":if(b.hasOwnProperty(d))return b[d];e=new Wb(a);e=(new cb(e,c,a)).parse(d);"hasOwnProperty"!==d&&(b[d]=e);return e;case "function":return d;default:return D}}}]}function $d(){this.$get=["$rootScope","$exceptionHandler",function(b,a){return ye(function(a){b.$evalAsync(a)},
a)}]}function ye(b,a){function c(a){return a}function d(a){return g(a)}var e=function(){var g=[],h,l;return l={resolve:function(a){if(g){var c=g;g=s;h=f(a);c.length&&b(function(){for(var a,b=0,d=c.length;b<d;b++)a=c[b],h.then(a[0],a[1],a[2])})}},reject:function(a){l.resolve(k(a))},notify:function(a){if(g){var c=g;g.length&&b(function(){for(var b,d=0,e=c.length;d<e;d++)b=c[d],b[2](a)})}},promise:{then:function(b,f,k){var l=e(),L=function(d){try{l.resolve((C(b)?b:c)(d))}catch(e){l.reject(e),a(e)}},
w=function(b){try{l.resolve((C(f)?f:d)(b))}catch(c){l.reject(c),a(c)}},u=function(b){try{l.notify((C(k)?k:c)(b))}catch(d){a(d)}};g?g.push([L,w,u]):h.then(L,w,u);return l.promise},"catch":function(a){return this.then(null,a)},"finally":function(a){function b(a,c){var d=e();c?d.resolve(a):d.reject(a);return d.promise}function d(e,f){var g=null;try{g=(a||c)()}catch(k){return b(k,!1)}return g&&C(g.then)?g.then(function(){return b(e,f)},function(a){return b(a,!1)}):b(e,f)}return this.then(function(a){return d(a,
!0)},function(a){return d(a,!1)})}}}},f=function(a){return a&&C(a.then)?a:{then:function(c){var d=e();b(function(){d.resolve(c(a))});return d.promise}}},g=function(a){var b=e();b.reject(a);return b.promise},k=function(c){return{then:function(f,g){var k=e();b(function(){try{k.resolve((C(g)?g:d)(c))}catch(b){k.reject(b),a(b)}});return k.promise}}};return{defer:e,reject:g,when:function(k,h,l,p){var n=e(),r,t=function(b){try{return(C(h)?h:c)(b)}catch(d){return a(d),g(d)}},L=function(b){try{return(C(l)?
l:d)(b)}catch(c){return a(c),g(c)}},w=function(b){try{return(C(p)?p:c)(b)}catch(d){a(d)}};b(function(){f(k).then(function(a){r||(r=!0,n.resolve(f(a).then(t,L,w)))},function(a){r||(r=!0,n.resolve(L(a)))},function(a){r||n.notify(w(a))})});return n.promise},all:function(a){var b=e(),c=0,d=I(a)?[]:{};q(a,function(a,e){c++;f(a).then(function(a){d.hasOwnProperty(e)||(d[e]=a,--c||b.resolve(d))},function(a){d.hasOwnProperty(e)||b.reject(a)})});0===c&&b.resolve(d);return b.promise}}}function ge(){this.$get=
["$window","$timeout",function(b,a){var c=b.requestAnimationFrame||b.webkitRequestAnimationFrame||b.mozRequestAnimationFrame,d=b.cancelAnimationFrame||b.webkitCancelAnimationFrame||b.mozCancelAnimationFrame||b.webkitCancelRequestAnimationFrame,e=!!c,f=e?function(a){var b=c(a);return function(){d(b)}}:function(b){var c=a(b,16.66,!1);return function(){a.cancel(c)}};f.supported=e;return f}]}function Zd(){var b=10,a=y("$rootScope"),c=null;this.digestTtl=function(a){arguments.length&&(b=a);return b};this.$get=
["$injector","$exceptionHandler","$parse","$browser",function(d,e,f,g){function k(){this.$id=fb();this.$$phase=this.$parent=this.$$watchers=this.$$nextSibling=this.$$prevSibling=this.$$childHead=this.$$childTail=null;this["this"]=this.$root=this;this.$$destroyed=!1;this.$$asyncQueue=[];this.$$postDigestQueue=[];this.$$listeners={};this.$$listenerCount={};this.$$isolateBindings={}}function m(b){if(n.$$phase)throw a("inprog",n.$$phase);n.$$phase=b}function h(a,b){var c=f(a);Ua(c,b);return c}function l(a,
b,c){do a.$$listenerCount[c]-=b,0===a.$$listenerCount[c]&&delete a.$$listenerCount[c];while(a=a.$parent)}function p(){}k.prototype={constructor:k,$new:function(a){a?(a=new k,a.$root=this.$root,a.$$asyncQueue=this.$$asyncQueue,a.$$postDigestQueue=this.$$postDigestQueue):(this.$$childScopeClass||(this.$$childScopeClass=function(){this.$$watchers=this.$$nextSibling=this.$$childHead=this.$$childTail=null;this.$$listeners={};this.$$listenerCount={};this.$id=fb();this.$$childScopeClass=null},this.$$childScopeClass.prototype=
this),a=new this.$$childScopeClass);a["this"]=a;a.$parent=this;a.$$prevSibling=this.$$childTail;this.$$childHead?this.$$childTail=this.$$childTail.$$nextSibling=a:this.$$childHead=this.$$childTail=a;return a},$watch:function(a,b,d){var e=h(a,"watch"),f=this.$$watchers,g={fn:b,last:p,get:e,exp:a,eq:!!d};c=null;if(!C(b)){var k=h(b||D,"listener");g.fn=function(a,b,c){k(c)}}if("string"==typeof a&&e.constant){var m=g.fn;g.fn=function(a,b,c){m.call(this,a,b,c);Qa(f,g)}}f||(f=this.$$watchers=[]);f.unshift(g);
return function(){Qa(f,g);c=null}},$watchCollection:function(a,b){var c=this,d,e,g,k=1<b.length,h=0,m=f(a),l=[],n={},p=!0,q=0;return this.$watch(function(){d=m(c);var a,b,f;if(S(d))if(eb(d))for(e!==l&&(e=l,q=e.length=0,h++),a=d.length,q!==a&&(h++,e.length=q=a),b=0;b<a;b++)f=e[b]!==e[b]&&d[b]!==d[b],f||e[b]===d[b]||(h++,e[b]=d[b]);else{e!==n&&(e=n={},q=0,h++);a=0;for(b in d)d.hasOwnProperty(b)&&(a++,e.hasOwnProperty(b)?(f=e[b]!==e[b]&&d[b]!==d[b],f||e[b]===d[b]||(h++,e[b]=d[b])):(q++,e[b]=d[b],h++));
if(q>a)for(b in h++,e)e.hasOwnProperty(b)&&!d.hasOwnProperty(b)&&(q--,delete e[b])}else e!==d&&(e=d,h++);return h},function(){p?(p=!1,b(d,d,c)):b(d,g,c);if(k)if(S(d))if(eb(d)){g=Array(d.length);for(var a=0;a<d.length;a++)g[a]=d[a]}else for(a in g={},d)hb.call(d,a)&&(g[a]=d[a]);else g=d})},$digest:function(){var d,f,g,k,h=this.$$asyncQueue,l=this.$$postDigestQueue,q,A,s=b,J,T=[],x,O,E;m("$digest");c=null;do{A=!1;for(J=this;h.length;){try{E=h.shift(),E.scope.$eval(E.expression)}catch(H){n.$$phase=null,
e(H)}c=null}a:do{if(k=J.$$watchers)for(q=k.length;q--;)try{if(d=k[q])if((f=d.get(J))!==(g=d.last)&&!(d.eq?za(f,g):"number"===typeof f&&"number"===typeof g&&isNaN(f)&&isNaN(g)))A=!0,c=d,d.last=d.eq?Ha(f,null):f,d.fn(f,g===p?f:g,J),5>s&&(x=4-s,T[x]||(T[x]=[]),O=C(d.exp)?"fn: "+(d.exp.name||d.exp.toString()):d.exp,O+="; newVal: "+ta(f)+"; oldVal: "+ta(g),T[x].push(O));else if(d===c){A=!1;break a}}catch(B){n.$$phase=null,e(B)}if(!(k=J.$$childHead||J!==this&&J.$$nextSibling))for(;J!==this&&!(k=J.$$nextSibling);)J=
J.$parent}while(J=k);if((A||h.length)&&!s--)throw n.$$phase=null,a("infdig",b,ta(T));}while(A||h.length);for(n.$$phase=null;l.length;)try{l.shift()()}catch(y){e(y)}},$destroy:function(){if(!this.$$destroyed){var a=this.$parent;this.$broadcast("$destroy");this.$$destroyed=!0;this!==n&&(q(this.$$listenerCount,Bb(null,l,this)),a.$$childHead==this&&(a.$$childHead=this.$$nextSibling),a.$$childTail==this&&(a.$$childTail=this.$$prevSibling),this.$$prevSibling&&(this.$$prevSibling.$$nextSibling=this.$$nextSibling),
this.$$nextSibling&&(this.$$nextSibling.$$prevSibling=this.$$prevSibling),this.$parent=this.$$nextSibling=this.$$prevSibling=this.$$childHead=this.$$childTail=this.$root=null,this.$$listeners={},this.$$watchers=this.$$asyncQueue=this.$$postDigestQueue=[],this.$destroy=this.$digest=this.$apply=D,this.$on=this.$watch=function(){return D})}},$eval:function(a,b){return f(a)(this,b)},$evalAsync:function(a){n.$$phase||n.$$asyncQueue.length||g.defer(function(){n.$$asyncQueue.length&&n.$digest()});this.$$asyncQueue.push({scope:this,
expression:a})},$$postDigest:function(a){this.$$postDigestQueue.push(a)},$apply:function(a){try{return m("$apply"),this.$eval(a)}catch(b){e(b)}finally{n.$$phase=null;try{n.$digest()}catch(c){throw e(c),c;}}},$on:function(a,b){var c=this.$$listeners[a];c||(this.$$listeners[a]=c=[]);c.push(b);var d=this;do d.$$listenerCount[a]||(d.$$listenerCount[a]=0),d.$$listenerCount[a]++;while(d=d.$parent);var e=this;return function(){c[Pa(c,b)]=null;l(e,1,a)}},$emit:function(a,b){var c=[],d,f=this,g=!1,k={name:a,
targetScope:f,stopPropagation:function(){g=!0},preventDefault:function(){k.defaultPrevented=!0},defaultPrevented:!1},h=[k].concat(Aa.call(arguments,1)),m,l;do{d=f.$$listeners[a]||c;k.currentScope=f;m=0;for(l=d.length;m<l;m++)if(d[m])try{d[m].apply(null,h)}catch(n){e(n)}else d.splice(m,1),m--,l--;if(g)break;f=f.$parent}while(f);return k},$broadcast:function(a,b){for(var c=this,d=this,f={name:a,targetScope:this,preventDefault:function(){f.defaultPrevented=!0},defaultPrevented:!1},g=[f].concat(Aa.call(arguments,
1)),k,h;c=d;){f.currentScope=c;d=c.$$listeners[a]||[];k=0;for(h=d.length;k<h;k++)if(d[k])try{d[k].apply(null,g)}catch(m){e(m)}else d.splice(k,1),k--,h--;if(!(d=c.$$listenerCount[a]&&c.$$childHead||c!==this&&c.$$nextSibling))for(;c!==this&&!(d=c.$$nextSibling);)c=c.$parent}return f}};var n=new k;return n}]}function cd(){var b=/^\s*(https?|ftp|mailto|tel|file):/,a=/^\s*(https?|ftp|file):|data:image\//;this.aHrefSanitizationWhitelist=function(a){return B(a)?(b=a,this):b};this.imgSrcSanitizationWhitelist=
function(b){return B(b)?(a=b,this):a};this.$get=function(){return function(c,d){var e=d?a:b,f;if(!Q||8<=Q)if(f=ua(c).href,""!==f&&!f.match(e))return"unsafe:"+f;return c}}}function ze(b){if("self"===b)return b;if(z(b)){if(-1<b.indexOf("***"))throw wa("iwcard",b);b=b.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g,"\\$1").replace(/\x08/g,"\\x08").replace("\\*\\*",".*").replace("\\*","[^:/.?&;]*");return RegExp("^"+b+"$")}if(gb(b))return RegExp("^"+b.source+"$");throw wa("imatcher");}function Gc(b){var a=[];
B(b)&&q(b,function(b){a.push(ze(b))});return a}function be(){this.SCE_CONTEXTS=fa;var b=["self"],a=[];this.resourceUrlWhitelist=function(a){arguments.length&&(b=Gc(a));return b};this.resourceUrlBlacklist=function(b){arguments.length&&(a=Gc(b));return a};this.$get=["$injector",function(c){function d(a){var b=function(a){this.$$unwrapTrustedValue=function(){return a}};a&&(b.prototype=new a);b.prototype.valueOf=function(){return this.$$unwrapTrustedValue()};b.prototype.toString=function(){return this.$$unwrapTrustedValue().toString()};
return b}var e=function(a){throw wa("unsafe");};c.has("$sanitize")&&(e=c.get("$sanitize"));var f=d(),g={};g[fa.HTML]=d(f);g[fa.CSS]=d(f);g[fa.URL]=d(f);g[fa.JS]=d(f);g[fa.RESOURCE_URL]=d(g[fa.URL]);return{trustAs:function(a,b){var c=g.hasOwnProperty(a)?g[a]:null;if(!c)throw wa("icontext",a,b);if(null===b||b===s||""===b)return b;if("string"!==typeof b)throw wa("itype",a);return new c(b)},getTrusted:function(c,d){if(null===d||d===s||""===d)return d;var f=g.hasOwnProperty(c)?g[c]:null;if(f&&d instanceof
f)return d.$$unwrapTrustedValue();if(c===fa.RESOURCE_URL){var f=ua(d.toString()),l,p,n=!1;l=0;for(p=b.length;l<p;l++)if("self"===b[l]?Pb(f):b[l].exec(f.href)){n=!0;break}if(n)for(l=0,p=a.length;l<p;l++)if("self"===a[l]?Pb(f):a[l].exec(f.href)){n=!1;break}if(n)return d;throw wa("insecurl",d.toString());}if(c===fa.HTML)return e(d);throw wa("unsafe");},valueOf:function(a){return a instanceof f?a.$$unwrapTrustedValue():a}}}]}function ae(){var b=!0;this.enabled=function(a){arguments.length&&(b=!!a);return b};
this.$get=["$parse","$sniffer","$sceDelegate",function(a,c,d){if(b&&c.msie&&8>c.msieDocumentMode)throw wa("iequirks");var e=ga(fa);e.isEnabled=function(){return b};e.trustAs=d.trustAs;e.getTrusted=d.getTrusted;e.valueOf=d.valueOf;b||(e.trustAs=e.getTrusted=function(a,b){return b},e.valueOf=Ga);e.parseAs=function(b,c){var d=a(c);return d.literal&&d.constant?d:function(a,c){return e.getTrusted(b,d(a,c))}};var f=e.parseAs,g=e.getTrusted,k=e.trustAs;q(fa,function(a,b){var c=K(b);e[Xa("parse_as_"+c)]=
function(b){return f(a,b)};e[Xa("get_trusted_"+c)]=function(b){return g(a,b)};e[Xa("trust_as_"+c)]=function(b){return k(a,b)}});return e}]}function ce(){this.$get=["$window","$document",function(b,a){var c={},d=Z((/android (\d+)/.exec(K((b.navigator||{}).userAgent))||[])[1]),e=/Boxee/i.test((b.navigator||{}).userAgent),f=a[0]||{},g=f.documentMode,k,m=/^(Moz|webkit|O|ms)(?=[A-Z])/,h=f.body&&f.body.style,l=!1,p=!1;if(h){for(var n in h)if(l=m.exec(n)){k=l[0];k=k.substr(0,1).toUpperCase()+k.substr(1);
break}k||(k="WebkitOpacity"in h&&"webkit");l=!!("transition"in h||k+"Transition"in h);p=!!("animation"in h||k+"Animation"in h);!d||l&&p||(l=z(f.body.style.webkitTransition),p=z(f.body.style.webkitAnimation))}return{history:!(!b.history||!b.history.pushState||4>d||e),hashchange:"onhashchange"in b&&(!g||7<g),hasEvent:function(a){if("input"==a&&9==Q)return!1;if(v(c[a])){var b=f.createElement("div");c[a]="on"+a in b}return c[a]},csp:Va(),vendorPrefix:k,transitions:l,animations:p,android:d,msie:Q,msieDocumentMode:g}}]}
function ee(){this.$get=["$rootScope","$browser","$q","$exceptionHandler",function(b,a,c,d){function e(e,k,m){var h=c.defer(),l=h.promise,p=B(m)&&!m;k=a.defer(function(){try{h.resolve(e())}catch(a){h.reject(a),d(a)}finally{delete f[l.$$timeoutId]}p||b.$apply()},k);l.$$timeoutId=k;f[k]=h;return l}var f={};e.cancel=function(b){return b&&b.$$timeoutId in f?(f[b.$$timeoutId].reject("canceled"),delete f[b.$$timeoutId],a.defer.cancel(b.$$timeoutId)):!1};return e}]}function ua(b,a){var c=b;Q&&(V.setAttribute("href",
c),c=V.href);V.setAttribute("href",c);return{href:V.href,protocol:V.protocol?V.protocol.replace(/:$/,""):"",host:V.host,search:V.search?V.search.replace(/^\?/,""):"",hash:V.hash?V.hash.replace(/^#/,""):"",hostname:V.hostname,port:V.port,pathname:"/"===V.pathname.charAt(0)?V.pathname:"/"+V.pathname}}function Pb(b){b=z(b)?ua(b):b;return b.protocol===Hc.protocol&&b.host===Hc.host}function fe(){this.$get=$(P)}function mc(b){function a(d,e){if(S(d)){var f={};q(d,function(b,c){f[c]=a(c,b)});return f}return b.factory(d+
c,e)}var c="Filter";this.register=a;this.$get=["$injector",function(a){return function(b){return a.get(b+c)}}];a("currency",Ic);a("date",Jc);a("filter",Ae);a("json",Be);a("limitTo",Ce);a("lowercase",De);a("number",Kc);a("orderBy",Lc);a("uppercase",Ee)}function Ae(){return function(b,a,c){if(!I(b))return b;var d=typeof c,e=[];e.check=function(a){for(var b=0;b<e.length;b++)if(!e[b](a))return!1;return!0};"function"!==d&&(c="boolean"===d&&c?function(a,b){return Ta.equals(a,b)}:function(a,b){if(a&&b&&
"object"===typeof a&&"object"===typeof b){for(var d in a)if("$"!==d.charAt(0)&&hb.call(a,d)&&c(a[d],b[d]))return!0;return!1}b=(""+b).toLowerCase();return-1<(""+a).toLowerCase().indexOf(b)});var f=function(a,b){if("string"==typeof b&&"!"===b.charAt(0))return!f(a,b.substr(1));switch(typeof a){case "boolean":case "number":case "string":return c(a,b);case "object":switch(typeof b){case "object":return c(a,b);default:for(var d in a)if("$"!==d.charAt(0)&&f(a[d],b))return!0}return!1;case "array":for(d=0;d<
a.length;d++)if(f(a[d],b))return!0;return!1;default:return!1}};switch(typeof a){case "boolean":case "number":case "string":a={$:a};case "object":for(var g in a)(function(b){"undefined"!==typeof a[b]&&e.push(function(c){return f("$"==b?c:c&&c[b],a[b])})})(g);break;case "function":e.push(a);break;default:return b}d=[];for(g=0;g<b.length;g++){var k=b[g];e.check(k)&&d.push(k)}return d}}function Ic(b){var a=b.NUMBER_FORMATS;return function(b,d){v(d)&&(d=a.CURRENCY_SYM);return Mc(b,a.PATTERNS[1],a.GROUP_SEP,
a.DECIMAL_SEP,2).replace(/\u00A4/g,d)}}function Kc(b){var a=b.NUMBER_FORMATS;return function(b,d){return Mc(b,a.PATTERNS[0],a.GROUP_SEP,a.DECIMAL_SEP,d)}}function Mc(b,a,c,d,e){if(null==b||!isFinite(b)||S(b))return"";var f=0>b;b=Math.abs(b);var g=b+"",k="",m=[],h=!1;if(-1!==g.indexOf("e")){var l=g.match(/([\d\.]+)e(-?)(\d+)/);l&&"-"==l[2]&&l[3]>e+1?(g="0",b=0):(k=g,h=!0)}if(h)0<e&&(-1<b&&1>b)&&(k=b.toFixed(e));else{g=(g.split(Nc)[1]||"").length;v(e)&&(e=Math.min(Math.max(a.minFrac,g),a.maxFrac));
b=+(Math.round(+(b.toString()+"e"+e)).toString()+"e"+-e);b=(""+b).split(Nc);g=b[0];b=b[1]||"";var l=0,p=a.lgSize,n=a.gSize;if(g.length>=p+n)for(l=g.length-p,h=0;h<l;h++)0===(l-h)%n&&0!==h&&(k+=c),k+=g.charAt(h);for(h=l;h<g.length;h++)0===(g.length-h)%p&&0!==h&&(k+=c),k+=g.charAt(h);for(;b.length<e;)b+="0";e&&"0"!==e&&(k+=d+b.substr(0,e))}m.push(f?a.negPre:a.posPre);m.push(k);m.push(f?a.negSuf:a.posSuf);return m.join("")}function Xb(b,a,c){var d="";0>b&&(d="-",b=-b);for(b=""+b;b.length<a;)b="0"+b;
c&&(b=b.substr(b.length-a));return d+b}function Y(b,a,c,d){c=c||0;return function(e){e=e["get"+b]();if(0<c||e>-c)e+=c;0===e&&-12==c&&(e=12);return Xb(e,a,d)}}function ub(b,a){return function(c,d){var e=c["get"+b](),f=Ia(a?"SHORT"+b:b);return d[f][e]}}function Jc(b){function a(a){var b;if(b=a.match(c)){a=new Date(0);var f=0,g=0,k=b[8]?a.setUTCFullYear:a.setFullYear,m=b[8]?a.setUTCHours:a.setHours;b[9]&&(f=Z(b[9]+b[10]),g=Z(b[9]+b[11]));k.call(a,Z(b[1]),Z(b[2])-1,Z(b[3]));f=Z(b[4]||0)-f;g=Z(b[5]||0)-
g;k=Z(b[6]||0);b=Math.round(1E3*parseFloat("0."+(b[7]||0)));m.call(a,f,g,k,b)}return a}var c=/^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;return function(c,e){var f="",g=[],k,m;e=e||"mediumDate";e=b.DATETIME_FORMATS[e]||e;z(c)&&(c=Fe.test(c)?Z(c):a(c));Ab(c)&&(c=new Date(c));if(!sa(c))return c;for(;e;)(m=Ge.exec(e))?(g=g.concat(Aa.call(m,1)),e=g.pop()):(g.push(e),e=null);q(g,function(a){k=He[a];f+=k?k(c,b.DATETIME_FORMATS):a.replace(/(^'|'$)/g,
"").replace(/''/g,"'")});return f}}function Be(){return function(b){return ta(b,!0)}}function Ce(){return function(b,a){if(!I(b)&&!z(b))return b;a=Infinity===Math.abs(Number(a))?Number(a):Z(a);if(z(b))return a?0<=a?b.slice(0,a):b.slice(a,b.length):"";var c=[],d,e;a>b.length?a=b.length:a<-b.length&&(a=-b.length);0<a?(d=0,e=a):(d=b.length+a,e=b.length);for(;d<e;d++)c.push(b[d]);return c}}function Lc(b){return function(a,c,d){function e(a,b){return Sa(b)?function(b,c){return a(c,b)}:a}function f(a,b){var c=
typeof a,d=typeof b;return c==d?(sa(a)&&sa(b)&&(a=a.valueOf(),b=b.valueOf()),"string"==c&&(a=a.toLowerCase(),b=b.toLowerCase()),a===b?0:a<b?-1:1):c<d?-1:1}if(!I(a)||!c)return a;c=I(c)?c:[c];c=Vc(c,function(a){var c=!1,d=a||Ga;if(z(a)){if("+"==a.charAt(0)||"-"==a.charAt(0))c="-"==a.charAt(0),a=a.substring(1);d=b(a);if(d.constant){var g=d();return e(function(a,b){return f(a[g],b[g])},c)}}return e(function(a,b){return f(d(a),d(b))},c)});for(var g=[],k=0;k<a.length;k++)g.push(a[k]);return g.sort(e(function(a,
b){for(var d=0;d<c.length;d++){var e=c[d](a,b);if(0!==e)return e}return 0},d))}}function xa(b){C(b)&&(b={link:b});b.restrict=b.restrict||"AC";return $(b)}function Oc(b,a,c,d){function e(a,c){c=c?"-"+jb(c,"-"):"";d.removeClass(b,(a?vb:wb)+c);d.addClass(b,(a?wb:vb)+c)}var f=this,g=b.parent().controller("form")||xb,k=0,m=f.$error={},h=[];f.$name=a.name||a.ngForm;f.$dirty=!1;f.$pristine=!0;f.$valid=!0;f.$invalid=!1;g.$addControl(f);b.addClass(Oa);e(!0);f.$addControl=function(a){Ca(a.$name,"input");h.push(a);
a.$name&&(f[a.$name]=a)};f.$removeControl=function(a){a.$name&&f[a.$name]===a&&delete f[a.$name];q(m,function(b,c){f.$setValidity(c,!0,a)});Qa(h,a)};f.$setValidity=function(a,b,c){var d=m[a];if(b)d&&(Qa(d,c),d.length||(k--,k||(e(b),f.$valid=!0,f.$invalid=!1),m[a]=!1,e(!0,a),g.$setValidity(a,!0,f)));else{k||e(b);if(d){if(-1!=Pa(d,c))return}else m[a]=d=[],k++,e(!1,a),g.$setValidity(a,!1,f);d.push(c);f.$valid=!1;f.$invalid=!0}};f.$setDirty=function(){d.removeClass(b,Oa);d.addClass(b,yb);f.$dirty=!0;
f.$pristine=!1;g.$setDirty()};f.$setPristine=function(){d.removeClass(b,yb);d.addClass(b,Oa);f.$dirty=!1;f.$pristine=!0;q(h,function(a){a.$setPristine()})}}function ra(b,a,c,d){b.$setValidity(a,c);return c?d:s}function Pc(b,a){var c,d;if(a)for(c=0;c<a.length;++c)if(d=a[c],b[d])return!0;return!1}function Ie(b,a,c,d,e){S(e)&&(b.$$hasNativeValidators=!0,b.$parsers.push(function(f){if(b.$error[a]||Pc(e,d)||!Pc(e,c))return f;b.$setValidity(a,!1)}))}function zb(b,a,c,d,e,f){var g=a.prop(Je),k=a[0].placeholder,
m={};d.$$validityState=g;if(!e.android){var h=!1;a.on("compositionstart",function(a){h=!0});a.on("compositionend",function(){h=!1;l()})}var l=function(e){if(!h){var f=a.val();if(Q&&"input"===(e||m).type&&a[0].placeholder!==k)k=a[0].placeholder;else if(Sa(c.ngTrim||"T")&&(f=aa(f)),e=g&&d.$$hasNativeValidators,d.$viewValue!==f||""===f&&e)b.$$phase?d.$setViewValue(f):b.$apply(function(){d.$setViewValue(f)})}};if(e.hasEvent("input"))a.on("input",l);else{var p,n=function(){p||(p=f.defer(function(){l();
p=null}))};a.on("keydown",function(a){a=a.keyCode;91===a||(15<a&&19>a||37<=a&&40>=a)||n()});if(e.hasEvent("paste"))a.on("paste cut",n)}a.on("change",l);d.$render=function(){a.val(d.$isEmpty(d.$viewValue)?"":d.$viewValue)};var r=c.ngPattern;r&&((e=r.match(/^\/(.*)\/([gim]*)$/))?(r=RegExp(e[1],e[2]),e=function(a){return ra(d,"pattern",d.$isEmpty(a)||r.test(a),a)}):e=function(c){var e=b.$eval(r);if(!e||!e.test)throw y("ngPattern")("noregexp",r,e,ha(a));return ra(d,"pattern",d.$isEmpty(c)||e.test(c),
c)},d.$formatters.push(e),d.$parsers.push(e));if(c.ngMinlength){var t=Z(c.ngMinlength);e=function(a){return ra(d,"minlength",d.$isEmpty(a)||a.length>=t,a)};d.$parsers.push(e);d.$formatters.push(e)}if(c.ngMaxlength){var q=Z(c.ngMaxlength);e=function(a){return ra(d,"maxlength",d.$isEmpty(a)||a.length<=q,a)};d.$parsers.push(e);d.$formatters.push(e)}}function Yb(b,a){b="ngClass"+b;return["$animate",function(c){function d(a,b){var c=[],d=0;a:for(;d<a.length;d++){for(var e=a[d],l=0;l<b.length;l++)if(e==
b[l])continue a;c.push(e)}return c}function e(a){if(!I(a)){if(z(a))return a.split(" ");if(S(a)){var b=[];q(a,function(a,c){a&&(b=b.concat(c.split(" ")))});return b}}return a}return{restrict:"AC",link:function(f,g,k){function m(a,b){var c=g.data("$classCounts")||{},d=[];q(a,function(a){if(0<b||c[a])c[a]=(c[a]||0)+b,c[a]===+(0<b)&&d.push(a)});g.data("$classCounts",c);return d.join(" ")}function h(b){if(!0===a||f.$index%2===a){var h=e(b||[]);if(!l){var r=m(h,1);k.$addClass(r)}else if(!za(b,l)){var q=
e(l),r=d(h,q),h=d(q,h),h=m(h,-1),r=m(r,1);0===r.length?c.removeClass(g,h):0===h.length?c.addClass(g,r):c.setClass(g,r,h)}}l=ga(b)}var l;f.$watch(k[b],h,!0);k.$observe("class",function(a){h(f.$eval(k[b]))});"ngClass"!==b&&f.$watch("$index",function(c,d){var g=c&1;if(g!==(d&1)){var h=e(f.$eval(k[b]));g===a?(g=m(h,1),k.$addClass(g)):(g=m(h,-1),k.$removeClass(g))}})}}}]}var Je="validity",K=function(b){return z(b)?b.toLowerCase():b},hb=Object.prototype.hasOwnProperty,Ia=function(b){return z(b)?b.toUpperCase():
b},Q,x,Da,Aa=[].slice,Ke=[].push,ya=Object.prototype.toString,Ra=y("ng"),Ta=P.angular||(P.angular={}),Wa,Ma,ka=["0","0","0"];Q=Z((/msie (\d+)/.exec(K(navigator.userAgent))||[])[1]);isNaN(Q)&&(Q=Z((/trident\/.*; rv:(\d+)/.exec(K(navigator.userAgent))||[])[1]));D.$inject=[];Ga.$inject=[];var I=function(){return C(Array.isArray)?Array.isArray:function(b){return"[object Array]"===ya.call(b)}}(),aa=function(){return String.prototype.trim?function(b){return z(b)?b.trim():b}:function(b){return z(b)?b.replace(/^\s\s*/,
"").replace(/\s\s*$/,""):b}}();Ma=9>Q?function(b){b=b.nodeName?b:b[0];return b.scopeName&&"HTML"!=b.scopeName?Ia(b.scopeName+":"+b.nodeName):b.nodeName}:function(b){return b.nodeName?b.nodeName:b[0].nodeName};var Va=function(){if(B(Va.isActive_))return Va.isActive_;var b=!(!W.querySelector("[ng-csp]")&&!W.querySelector("[data-ng-csp]"));if(!b)try{new Function("")}catch(a){b=!0}return Va.isActive_=b},Yc=/[A-Z]/g,ad={full:"1.2.21",major:1,minor:2,dot:21,codeName:"wizard-props"};R.expando="ng339";var Za=
R.cache={},ne=1,rb=P.document.addEventListener?function(b,a,c){b.addEventListener(a,c,!1)}:function(b,a,c){b.attachEvent("on"+a,c)},Ya=P.document.removeEventListener?function(b,a,c){b.removeEventListener(a,c,!1)}:function(b,a,c){b.detachEvent("on"+a,c)};R._data=function(b){return this.cache[b[this.expando]]||{}};var ie=/([\:\-\_]+(.))/g,je=/^moz([A-Z])/,Hb=y("jqLite"),ke=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,Ib=/<|&#?\w+;/,le=/<([\w:]+)/,me=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
ba={option:[1,'<select multiple="multiple">',"</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ba.optgroup=ba.option;ba.tbody=ba.tfoot=ba.colgroup=ba.caption=ba.thead;ba.th=ba.td;var La=R.prototype={ready:function(b){function a(){c||(c=!0,b())}var c=!1;"complete"===W.readyState?setTimeout(a):(this.on("DOMContentLoaded",a),R(P).on("load",a))},
toString:function(){var b=[];q(this,function(a){b.push(""+a)});return"["+b.join(", ")+"]"},eq:function(b){return 0<=b?x(this[b]):x(this[this.length+b])},length:0,push:Ke,sort:[].sort,splice:[].splice},nb={};q("multiple selected checked disabled readOnly required open".split(" "),function(b){nb[K(b)]=b});var rc={};q("input select option textarea button form details".split(" "),function(b){rc[Ia(b)]=!0});q({data:Mb,removeData:Lb},function(b,a){R[a]=b});q({data:Mb,inheritedData:mb,scope:function(b){return x.data(b,
"$scope")||mb(b.parentNode||b,["$isolateScope","$scope"])},isolateScope:function(b){return x.data(b,"$isolateScope")||x.data(b,"$isolateScopeNoTemplate")},controller:oc,injector:function(b){return mb(b,"$injector")},removeAttr:function(b,a){b.removeAttribute(a)},hasClass:Nb,css:function(b,a,c){a=Xa(a);if(B(c))b.style[a]=c;else{var d;8>=Q&&(d=b.currentStyle&&b.currentStyle[a],""===d&&(d="auto"));d=d||b.style[a];8>=Q&&(d=""===d?s:d);return d}},attr:function(b,a,c){var d=K(a);if(nb[d])if(B(c))c?(b[a]=
!0,b.setAttribute(a,d)):(b[a]=!1,b.removeAttribute(d));else return b[a]||(b.attributes.getNamedItem(a)||D).specified?d:s;else if(B(c))b.setAttribute(a,c);else if(b.getAttribute)return b=b.getAttribute(a,2),null===b?s:b},prop:function(b,a,c){if(B(c))b[a]=c;else return b[a]},text:function(){function b(b,d){var e=a[b.nodeType];if(v(d))return e?b[e]:"";b[e]=d}var a=[];9>Q?(a[1]="innerText",a[3]="nodeValue"):a[1]=a[3]="textContent";b.$dv="";return b}(),val:function(b,a){if(v(a)){if("SELECT"===Ma(b)&&b.multiple){var c=
[];q(b.options,function(a){a.selected&&c.push(a.value||a.text)});return 0===c.length?null:c}return b.value}b.value=a},html:function(b,a){if(v(a))return b.innerHTML;for(var c=0,d=b.childNodes;c<d.length;c++)Ja(d[c]);b.innerHTML=a},empty:pc},function(b,a){R.prototype[a]=function(a,d){var e,f,g=this.length;if(b!==pc&&(2==b.length&&b!==Nb&&b!==oc?a:d)===s){if(S(a)){for(e=0;e<g;e++)if(b===Mb)b(this[e],a);else for(f in a)b(this[e],f,a[f]);return this}e=b.$dv;g=e===s?Math.min(g,1):g;for(f=0;f<g;f++){var k=
b(this[f],a,d);e=e?e+k:k}return e}for(e=0;e<g;e++)b(this[e],a,d);return this}});q({removeData:Lb,dealoc:Ja,on:function a(c,d,e,f){if(B(f))throw Hb("onargs");var g=la(c,"events"),k=la(c,"handle");g||la(c,"events",g={});k||la(c,"handle",k=oe(c,g));q(d.split(" "),function(d){var f=g[d];if(!f){if("mouseenter"==d||"mouseleave"==d){var l=W.body.contains||W.body.compareDocumentPosition?function(a,c){var d=9===a.nodeType?a.documentElement:a,e=c&&c.parentNode;return a===e||!!(e&&1===e.nodeType&&(d.contains?
d.contains(e):a.compareDocumentPosition&&a.compareDocumentPosition(e)&16))}:function(a,c){if(c)for(;c=c.parentNode;)if(c===a)return!0;return!1};g[d]=[];a(c,{mouseleave:"mouseout",mouseenter:"mouseover"}[d],function(a){var c=a.relatedTarget;c&&(c===this||l(this,c))||k(a,d)})}else rb(c,d,k),g[d]=[];f=g[d]}f.push(e)})},off:nc,one:function(a,c,d){a=x(a);a.on(c,function f(){a.off(c,d);a.off(c,f)});a.on(c,d)},replaceWith:function(a,c){var d,e=a.parentNode;Ja(a);q(new R(c),function(c){d?e.insertBefore(c,
d.nextSibling):e.replaceChild(c,a);d=c})},children:function(a){var c=[];q(a.childNodes,function(a){1===a.nodeType&&c.push(a)});return c},contents:function(a){return a.contentDocument||a.childNodes||[]},append:function(a,c){q(new R(c),function(c){1!==a.nodeType&&11!==a.nodeType||a.appendChild(c)})},prepend:function(a,c){if(1===a.nodeType){var d=a.firstChild;q(new R(c),function(c){a.insertBefore(c,d)})}},wrap:function(a,c){c=x(c)[0];var d=a.parentNode;d&&d.replaceChild(c,a);c.appendChild(a)},remove:function(a){Ja(a);
var c=a.parentNode;c&&c.removeChild(a)},after:function(a,c){var d=a,e=a.parentNode;q(new R(c),function(a){e.insertBefore(a,d.nextSibling);d=a})},addClass:lb,removeClass:kb,toggleClass:function(a,c,d){c&&q(c.split(" "),function(c){var f=d;v(f)&&(f=!Nb(a,c));(f?lb:kb)(a,c)})},parent:function(a){return(a=a.parentNode)&&11!==a.nodeType?a:null},next:function(a){if(a.nextElementSibling)return a.nextElementSibling;for(a=a.nextSibling;null!=a&&1!==a.nodeType;)a=a.nextSibling;return a},find:function(a,c){return a.getElementsByTagName?
a.getElementsByTagName(c):[]},clone:Kb,triggerHandler:function(a,c,d){c=(la(a,"events")||{})[c];c=ga(c||[]);d=d||[];var e=[{preventDefault:D,stopPropagation:D}];q(c,function(c){c.apply(a,e.concat(d))})}},function(a,c){R.prototype[c]=function(c,e,f){for(var g,k=0;k<this.length;k++)v(g)?(g=a(this[k],c,e,f),B(g)&&(g=x(g))):Jb(g,a(this[k],c,e,f));return B(g)?g:this};R.prototype.bind=R.prototype.on;R.prototype.unbind=R.prototype.off});$a.prototype={put:function(a,c){this[Ka(a,this.nextUid)]=c},get:function(a){return this[Ka(a,
this.nextUid)]},remove:function(a){var c=this[a=Ka(a,this.nextUid)];delete this[a];return c}};var qe=/^function\s*[^\(]*\(\s*([^\)]*)\)/m,re=/,/,se=/^\s*(_?)(\S+?)\1\s*$/,pe=/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,ab=y("$injector"),Le=y("$animate"),Md=["$provide",function(a){this.$$selectors={};this.register=function(c,d){var e=c+"-animation";if(c&&"."!=c.charAt(0))throw Le("notcsel",c);this.$$selectors[c.substr(1)]=e;a.factory(e,d)};this.classNameFilter=function(a){1===arguments.length&&(this.$$classNameFilter=
a instanceof RegExp?a:null);return this.$$classNameFilter};this.$get=["$timeout","$$asyncCallback",function(a,d){return{enter:function(a,c,g,k){g?g.after(a):(c&&c[0]||(c=g.parent()),c.append(a));k&&d(k)},leave:function(a,c){a.remove();c&&d(c)},move:function(a,c,d,k){this.enter(a,c,d,k)},addClass:function(a,c,g){c=z(c)?c:I(c)?c.join(" "):"";q(a,function(a){lb(a,c)});g&&d(g)},removeClass:function(a,c,g){c=z(c)?c:I(c)?c.join(" "):"";q(a,function(a){kb(a,c)});g&&d(g)},setClass:function(a,c,g,k){q(a,function(a){lb(a,
c);kb(a,g)});k&&d(k)},enabled:D}}]}],ia=y("$compile");ic.$inject=["$provide","$$sanitizeUriProvider"];var ue=/^(x[\:\-_]|data[\:\-_])/i,yc=y("$interpolate"),Me=/^([^\?#]*)(\?([^#]*))?(#(.*))?$/,xe={http:80,https:443,ftp:21},Sb=y("$location");Ub.prototype=Tb.prototype=Bc.prototype={$$html5:!1,$$replace:!1,absUrl:sb("$$absUrl"),url:function(a,c){if(v(a))return this.$$url;var d=Me.exec(a);d[1]&&this.path(decodeURIComponent(d[1]));(d[2]||d[1])&&this.search(d[3]||"");this.hash(d[5]||"",c);return this},
protocol:sb("$$protocol"),host:sb("$$host"),port:sb("$$port"),path:Cc("$$path",function(a){return"/"==a.charAt(0)?a:"/"+a}),search:function(a,c){switch(arguments.length){case 0:return this.$$search;case 1:if(z(a))this.$$search=ec(a);else if(S(a))q(a,function(c,e){null==c&&delete a[e]}),this.$$search=a;else throw Sb("isrcharg");break;default:v(c)||null===c?delete this.$$search[a]:this.$$search[a]=c}this.$$compose();return this},hash:Cc("$$hash",Ga),replace:function(){this.$$replace=!0;return this}};
var ja=y("$parse"),Fc={},va,Ne=Function.prototype.call,Oe=Function.prototype.apply,Qc=Function.prototype.bind,db={"null":function(){return null},"true":function(){return!0},"false":function(){return!1},undefined:D,"+":function(a,c,d,e){d=d(a,c);e=e(a,c);return B(d)?B(e)?d+e:d:B(e)?e:s},"-":function(a,c,d,e){d=d(a,c);e=e(a,c);return(B(d)?d:0)-(B(e)?e:0)},"*":function(a,c,d,e){return d(a,c)*e(a,c)},"/":function(a,c,d,e){return d(a,c)/e(a,c)},"%":function(a,c,d,e){return d(a,c)%e(a,c)},"^":function(a,
c,d,e){return d(a,c)^e(a,c)},"=":D,"===":function(a,c,d,e){return d(a,c)===e(a,c)},"!==":function(a,c,d,e){return d(a,c)!==e(a,c)},"==":function(a,c,d,e){return d(a,c)==e(a,c)},"!=":function(a,c,d,e){return d(a,c)!=e(a,c)},"<":function(a,c,d,e){return d(a,c)<e(a,c)},">":function(a,c,d,e){return d(a,c)>e(a,c)},"<=":function(a,c,d,e){return d(a,c)<=e(a,c)},">=":function(a,c,d,e){return d(a,c)>=e(a,c)},"&&":function(a,c,d,e){return d(a,c)&&e(a,c)},"||":function(a,c,d,e){return d(a,c)||e(a,c)},"&":function(a,
c,d,e){return d(a,c)&e(a,c)},"|":function(a,c,d,e){return e(a,c)(a,c,d(a,c))},"!":function(a,c,d){return!d(a,c)}},Pe={n:"\n",f:"\f",r:"\r",t:"\t",v:"\v","'":"'",'"':'"'},Wb=function(a){this.options=a};Wb.prototype={constructor:Wb,lex:function(a){this.text=a;this.index=0;this.ch=s;this.lastCh=":";for(this.tokens=[];this.index<this.text.length;){this.ch=this.text.charAt(this.index);if(this.is("\"'"))this.readString(this.ch);else if(this.isNumber(this.ch)||this.is(".")&&this.isNumber(this.peek()))this.readNumber();
else if(this.isIdent(this.ch))this.readIdent();else if(this.is("(){}[].,;:?"))this.tokens.push({index:this.index,text:this.ch}),this.index++;else if(this.isWhitespace(this.ch)){this.index++;continue}else{a=this.ch+this.peek();var c=a+this.peek(2),d=db[this.ch],e=db[a],f=db[c];f?(this.tokens.push({index:this.index,text:c,fn:f}),this.index+=3):e?(this.tokens.push({index:this.index,text:a,fn:e}),this.index+=2):d?(this.tokens.push({index:this.index,text:this.ch,fn:d}),this.index+=1):this.throwError("Unexpected next character ",
this.index,this.index+1)}this.lastCh=this.ch}return this.tokens},is:function(a){return-1!==a.indexOf(this.ch)},was:function(a){return-1!==a.indexOf(this.lastCh)},peek:function(a){a=a||1;return this.index+a<this.text.length?this.text.charAt(this.index+a):!1},isNumber:function(a){return"0"<=a&&"9">=a},isWhitespace:function(a){return" "===a||"\r"===a||"\t"===a||"\n"===a||"\v"===a||"\u00a0"===a},isIdent:function(a){return"a"<=a&&"z">=a||"A"<=a&&"Z">=a||"_"===a||"$"===a},isExpOperator:function(a){return"-"===
a||"+"===a||this.isNumber(a)},throwError:function(a,c,d){d=d||this.index;c=B(c)?"s "+c+"-"+this.index+" ["+this.text.substring(c,d)+"]":" "+d;throw ja("lexerr",a,c,this.text);},readNumber:function(){for(var a="",c=this.index;this.index<this.text.length;){var d=K(this.text.charAt(this.index));if("."==d||this.isNumber(d))a+=d;else{var e=this.peek();if("e"==d&&this.isExpOperator(e))a+=d;else if(this.isExpOperator(d)&&e&&this.isNumber(e)&&"e"==a.charAt(a.length-1))a+=d;else if(!this.isExpOperator(d)||
e&&this.isNumber(e)||"e"!=a.charAt(a.length-1))break;else this.throwError("Invalid exponent")}this.index++}a*=1;this.tokens.push({index:c,text:a,literal:!0,constant:!0,fn:function(){return a}})},readIdent:function(){for(var a=this,c="",d=this.index,e,f,g,k;this.index<this.text.length;){k=this.text.charAt(this.index);if("."===k||this.isIdent(k)||this.isNumber(k))"."===k&&(e=this.index),c+=k;else break;this.index++}if(e)for(f=this.index;f<this.text.length;){k=this.text.charAt(f);if("("===k){g=c.substr(e-
d+1);c=c.substr(0,e-d);this.index=f;break}if(this.isWhitespace(k))f++;else break}d={index:d,text:c};if(db.hasOwnProperty(c))d.fn=db[c],d.literal=!0,d.constant=!0;else{var m=Ec(c,this.options,this.text);d.fn=F(function(a,c){return m(a,c)},{assign:function(d,e){return tb(d,c,e,a.text,a.options)}})}this.tokens.push(d);g&&(this.tokens.push({index:e,text:"."}),this.tokens.push({index:e+1,text:g}))},readString:function(a){var c=this.index;this.index++;for(var d="",e=a,f=!1;this.index<this.text.length;){var g=
this.text.charAt(this.index),e=e+g;if(f)"u"===g?(f=this.text.substring(this.index+1,this.index+5),f.match(/[\da-f]{4}/i)||this.throwError("Invalid unicode escape [\\u"+f+"]"),this.index+=4,d+=String.fromCharCode(parseInt(f,16))):d+=Pe[g]||g,f=!1;else if("\\"===g)f=!0;else{if(g===a){this.index++;this.tokens.push({index:c,text:e,string:d,literal:!0,constant:!0,fn:function(){return d}});return}d+=g}this.index++}this.throwError("Unterminated quote",c)}};var cb=function(a,c,d){this.lexer=a;this.$filter=
c;this.options=d};cb.ZERO=F(function(){return 0},{constant:!0});cb.prototype={constructor:cb,parse:function(a){this.text=a;this.tokens=this.lexer.lex(a);a=this.statements();0!==this.tokens.length&&this.throwError("is an unexpected token",this.tokens[0]);a.literal=!!a.literal;a.constant=!!a.constant;return a},primary:function(){var a;if(this.expect("("))a=this.filterChain(),this.consume(")");else if(this.expect("["))a=this.arrayDeclaration();else if(this.expect("{"))a=this.object();else{var c=this.expect();
(a=c.fn)||this.throwError("not a primary expression",c);a.literal=!!c.literal;a.constant=!!c.constant}for(var d;c=this.expect("(","[",".");)"("===c.text?(a=this.functionCall(a,d),d=null):"["===c.text?(d=a,a=this.objectIndex(a)):"."===c.text?(d=a,a=this.fieldAccess(a)):this.throwError("IMPOSSIBLE");return a},throwError:function(a,c){throw ja("syntax",c.text,a,c.index+1,this.text,this.text.substring(c.index));},peekToken:function(){if(0===this.tokens.length)throw ja("ueoe",this.text);return this.tokens[0]},
peek:function(a,c,d,e){if(0<this.tokens.length){var f=this.tokens[0],g=f.text;if(g===a||g===c||g===d||g===e||!(a||c||d||e))return f}return!1},expect:function(a,c,d,e){return(a=this.peek(a,c,d,e))?(this.tokens.shift(),a):!1},consume:function(a){this.expect(a)||this.throwError("is unexpected, expecting ["+a+"]",this.peek())},unaryFn:function(a,c){return F(function(d,e){return a(d,e,c)},{constant:c.constant})},ternaryFn:function(a,c,d){return F(function(e,f){return a(e,f)?c(e,f):d(e,f)},{constant:a.constant&&
c.constant&&d.constant})},binaryFn:function(a,c,d){return F(function(e,f){return c(e,f,a,d)},{constant:a.constant&&d.constant})},statements:function(){for(var a=[];;)if(0<this.tokens.length&&!this.peek("}",")",";","]")&&a.push(this.filterChain()),!this.expect(";"))return 1===a.length?a[0]:function(c,d){for(var e,f=0;f<a.length;f++){var g=a[f];g&&(e=g(c,d))}return e}},filterChain:function(){for(var a=this.expression(),c;;)if(c=this.expect("|"))a=this.binaryFn(a,c.fn,this.filter());else return a},filter:function(){for(var a=
this.expect(),c=this.$filter(a.text),d=[];;)if(a=this.expect(":"))d.push(this.expression());else{var e=function(a,e,k){k=[k];for(var m=0;m<d.length;m++)k.push(d[m](a,e));return c.apply(a,k)};return function(){return e}}},expression:function(){return this.assignment()},assignment:function(){var a=this.ternary(),c,d;return(d=this.expect("="))?(a.assign||this.throwError("implies assignment but ["+this.text.substring(0,d.index)+"] can not be assigned to",d),c=this.ternary(),function(d,f){return a.assign(d,
c(d,f),f)}):a},ternary:function(){var a=this.logicalOR(),c,d;if(this.expect("?")){c=this.ternary();if(d=this.expect(":"))return this.ternaryFn(a,c,this.ternary());this.throwError("expected :",d)}else return a},logicalOR:function(){for(var a=this.logicalAND(),c;;)if(c=this.expect("||"))a=this.binaryFn(a,c.fn,this.logicalAND());else return a},logicalAND:function(){var a=this.equality(),c;if(c=this.expect("&&"))a=this.binaryFn(a,c.fn,this.logicalAND());return a},equality:function(){var a=this.relational(),
c;if(c=this.expect("==","!=","===","!=="))a=this.binaryFn(a,c.fn,this.equality());return a},relational:function(){var a=this.additive(),c;if(c=this.expect("<",">","<=",">="))a=this.binaryFn(a,c.fn,this.relational());return a},additive:function(){for(var a=this.multiplicative(),c;c=this.expect("+","-");)a=this.binaryFn(a,c.fn,this.multiplicative());return a},multiplicative:function(){for(var a=this.unary(),c;c=this.expect("*","/","%");)a=this.binaryFn(a,c.fn,this.unary());return a},unary:function(){var a;
return this.expect("+")?this.primary():(a=this.expect("-"))?this.binaryFn(cb.ZERO,a.fn,this.unary()):(a=this.expect("!"))?this.unaryFn(a.fn,this.unary()):this.primary()},fieldAccess:function(a){var c=this,d=this.expect().text,e=Ec(d,this.options,this.text);return F(function(c,d,k){return e(k||a(c,d))},{assign:function(e,g,k){return tb(a(e,k),d,g,c.text,c.options)}})},objectIndex:function(a){var c=this,d=this.expression();this.consume("]");return F(function(e,f){var g=a(e,f),k=d(e,f),m;qa(k,c.text);
if(!g)return s;(g=Na(g[k],c.text))&&(g.then&&c.options.unwrapPromises)&&(m=g,"$$v"in g||(m.$$v=s,m.then(function(a){m.$$v=a})),g=g.$$v);return g},{assign:function(e,f,g){var k=d(e,g);return Na(a(e,g),c.text)[k]=f}})},functionCall:function(a,c){var d=[];if(")"!==this.peekToken().text){do d.push(this.expression());while(this.expect(","))}this.consume(")");var e=this;return function(f,g){for(var k=[],m=c?c(f,g):f,h=0;h<d.length;h++)k.push(d[h](f,g));h=a(f,g,m)||D;Na(m,e.text);var l=e.text;if(h){if(h.constructor===
h)throw ja("isecfn",l);if(h===Ne||h===Oe||Qc&&h===Qc)throw ja("isecff",l);}k=h.apply?h.apply(m,k):h(k[0],k[1],k[2],k[3],k[4]);return Na(k,e.text)}},arrayDeclaration:function(){var a=[],c=!0;if("]"!==this.peekToken().text){do{if(this.peek("]"))break;var d=this.expression();a.push(d);d.constant||(c=!1)}while(this.expect(","))}this.consume("]");return F(function(c,d){for(var g=[],k=0;k<a.length;k++)g.push(a[k](c,d));return g},{literal:!0,constant:c})},object:function(){var a=[],c=!0;if("}"!==this.peekToken().text){do{if(this.peek("}"))break;
var d=this.expect(),d=d.string||d.text;this.consume(":");var e=this.expression();a.push({key:d,value:e});e.constant||(c=!1)}while(this.expect(","))}this.consume("}");return F(function(c,d){for(var e={},m=0;m<a.length;m++){var h=a[m];e[h.key]=h.value(c,d)}return e},{literal:!0,constant:c})}};var Vb={},wa=y("$sce"),fa={HTML:"html",CSS:"css",URL:"url",RESOURCE_URL:"resourceUrl",JS:"js"},V=W.createElement("a"),Hc=ua(P.location.href,!0);mc.$inject=["$provide"];Ic.$inject=["$locale"];Kc.$inject=["$locale"];
var Nc=".",He={yyyy:Y("FullYear",4),yy:Y("FullYear",2,0,!0),y:Y("FullYear",1),MMMM:ub("Month"),MMM:ub("Month",!0),MM:Y("Month",2,1),M:Y("Month",1,1),dd:Y("Date",2),d:Y("Date",1),HH:Y("Hours",2),H:Y("Hours",1),hh:Y("Hours",2,-12),h:Y("Hours",1,-12),mm:Y("Minutes",2),m:Y("Minutes",1),ss:Y("Seconds",2),s:Y("Seconds",1),sss:Y("Milliseconds",3),EEEE:ub("Day"),EEE:ub("Day",!0),a:function(a,c){return 12>a.getHours()?c.AMPMS[0]:c.AMPMS[1]},Z:function(a){a=-1*a.getTimezoneOffset();return a=(0<=a?"+":"")+(Xb(Math[0<
a?"floor":"ceil"](a/60),2)+Xb(Math.abs(a%60),2))}},Ge=/((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,Fe=/^\-?\d+$/;Jc.$inject=["$locale"];var De=$(K),Ee=$(Ia);Lc.$inject=["$parse"];var dd=$({restrict:"E",compile:function(a,c){8>=Q&&(c.href||c.name||c.$set("href",""),a.append(W.createComment("IE fix")));if(!c.href&&!c.xlinkHref&&!c.name)return function(a,c){var f="[object SVGAnimatedString]"===ya.call(c.prop("href"))?"xlink:href":"href";c.on("click",function(a){c.attr(f)||
a.preventDefault()})}}}),Fb={};q(nb,function(a,c){if("multiple"!=a){var d=ma("ng-"+c);Fb[d]=function(){return{priority:100,link:function(a,f,g){a.$watch(g[d],function(a){g.$set(c,!!a)})}}}}});q(["src","srcset","href"],function(a){var c=ma("ng-"+a);Fb[c]=function(){return{priority:99,link:function(d,e,f){var g=a,k=a;"href"===a&&"[object SVGAnimatedString]"===ya.call(e.prop("href"))&&(k="xlinkHref",f.$attr[k]="xlink:href",g=null);f.$observe(c,function(a){a&&(f.$set(k,a),Q&&g&&e.prop(g,f[k]))})}}}});
var xb={$addControl:D,$removeControl:D,$setValidity:D,$setDirty:D,$setPristine:D};Oc.$inject=["$element","$attrs","$scope","$animate"];var Rc=function(a){return["$timeout",function(c){return{name:"form",restrict:a?"EAC":"E",controller:Oc,compile:function(){return{pre:function(a,e,f,g){if(!f.action){var k=function(a){a.preventDefault?a.preventDefault():a.returnValue=!1};rb(e[0],"submit",k);e.on("$destroy",function(){c(function(){Ya(e[0],"submit",k)},0,!1)})}var m=e.parent().controller("form"),h=f.name||
f.ngForm;h&&tb(a,h,g,h);if(m)e.on("$destroy",function(){m.$removeControl(g);h&&tb(a,h,s,h);F(g,xb)})}}}}}]},ed=Rc(),rd=Rc(!0),Qe=/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,Re=/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i,Se=/^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/,Sc={text:zb,number:function(a,c,d,e,f,g){zb(a,c,d,e,f,g);e.$parsers.push(function(a){var c=e.$isEmpty(a);if(c||Se.test(a))return e.$setValidity("number",
!0),""===a?null:c?a:parseFloat(a);e.$setValidity("number",!1);return s});Ie(e,"number",Te,null,e.$$validityState);e.$formatters.push(function(a){return e.$isEmpty(a)?"":""+a});d.min&&(a=function(a){var c=parseFloat(d.min);return ra(e,"min",e.$isEmpty(a)||a>=c,a)},e.$parsers.push(a),e.$formatters.push(a));d.max&&(a=function(a){var c=parseFloat(d.max);return ra(e,"max",e.$isEmpty(a)||a<=c,a)},e.$parsers.push(a),e.$formatters.push(a));e.$formatters.push(function(a){return ra(e,"number",e.$isEmpty(a)||
Ab(a),a)})},url:function(a,c,d,e,f,g){zb(a,c,d,e,f,g);a=function(a){return ra(e,"url",e.$isEmpty(a)||Qe.test(a),a)};e.$formatters.push(a);e.$parsers.push(a)},email:function(a,c,d,e,f,g){zb(a,c,d,e,f,g);a=function(a){return ra(e,"email",e.$isEmpty(a)||Re.test(a),a)};e.$formatters.push(a);e.$parsers.push(a)},radio:function(a,c,d,e){v(d.name)&&c.attr("name",fb());c.on("click",function(){c[0].checked&&a.$apply(function(){e.$setViewValue(d.value)})});e.$render=function(){c[0].checked=d.value==e.$viewValue};
d.$observe("value",e.$render)},checkbox:function(a,c,d,e){var f=d.ngTrueValue,g=d.ngFalseValue;z(f)||(f=!0);z(g)||(g=!1);c.on("click",function(){a.$apply(function(){e.$setViewValue(c[0].checked)})});e.$render=function(){c[0].checked=e.$viewValue};e.$isEmpty=function(a){return a!==f};e.$formatters.push(function(a){return a===f});e.$parsers.push(function(a){return a?f:g})},hidden:D,button:D,submit:D,reset:D,file:D},Te=["badInput"],jc=["$browser","$sniffer",function(a,c){return{restrict:"E",require:"?ngModel",
link:function(d,e,f,g){g&&(Sc[K(f.type)]||Sc.text)(d,e,f,g,c,a)}}}],wb="ng-valid",vb="ng-invalid",Oa="ng-pristine",yb="ng-dirty",Ue=["$scope","$exceptionHandler","$attrs","$element","$parse","$animate",function(a,c,d,e,f,g){function k(a,c){c=c?"-"+jb(c,"-"):"";g.removeClass(e,(a?vb:wb)+c);g.addClass(e,(a?wb:vb)+c)}this.$modelValue=this.$viewValue=Number.NaN;this.$parsers=[];this.$formatters=[];this.$viewChangeListeners=[];this.$pristine=!0;this.$dirty=!1;this.$valid=!0;this.$invalid=!1;this.$name=
d.name;var m=f(d.ngModel),h=m.assign;if(!h)throw y("ngModel")("nonassign",d.ngModel,ha(e));this.$render=D;this.$isEmpty=function(a){return v(a)||""===a||null===a||a!==a};var l=e.inheritedData("$formController")||xb,p=0,n=this.$error={};e.addClass(Oa);k(!0);this.$setValidity=function(a,c){n[a]!==!c&&(c?(n[a]&&p--,p||(k(!0),this.$valid=!0,this.$invalid=!1)):(k(!1),this.$invalid=!0,this.$valid=!1,p++),n[a]=!c,k(c,a),l.$setValidity(a,c,this))};this.$setPristine=function(){this.$dirty=!1;this.$pristine=
!0;g.removeClass(e,yb);g.addClass(e,Oa)};this.$setViewValue=function(d){this.$viewValue=d;this.$pristine&&(this.$dirty=!0,this.$pristine=!1,g.removeClass(e,Oa),g.addClass(e,yb),l.$setDirty());q(this.$parsers,function(a){d=a(d)});this.$modelValue!==d&&(this.$modelValue=d,h(a,d),q(this.$viewChangeListeners,function(a){try{a()}catch(d){c(d)}}))};var r=this;a.$watch(function(){var c=m(a);if(r.$modelValue!==c){var d=r.$formatters,e=d.length;for(r.$modelValue=c;e--;)c=d[e](c);r.$viewValue!==c&&(r.$viewValue=
c,r.$render())}return c})}],Gd=function(){return{require:["ngModel","^?form"],controller:Ue,link:function(a,c,d,e){var f=e[0],g=e[1]||xb;g.$addControl(f);a.$on("$destroy",function(){g.$removeControl(f)})}}},Id=$({require:"ngModel",link:function(a,c,d,e){e.$viewChangeListeners.push(function(){a.$eval(d.ngChange)})}}),kc=function(){return{require:"?ngModel",link:function(a,c,d,e){if(e){d.required=!0;var f=function(a){if(d.required&&e.$isEmpty(a))e.$setValidity("required",!1);else return e.$setValidity("required",
!0),a};e.$formatters.push(f);e.$parsers.unshift(f);d.$observe("required",function(){f(e.$viewValue)})}}}},Hd=function(){return{require:"ngModel",link:function(a,c,d,e){var f=(a=/\/(.*)\//.exec(d.ngList))&&RegExp(a[1])||d.ngList||",";e.$parsers.push(function(a){if(!v(a)){var c=[];a&&q(a.split(f),function(a){a&&c.push(aa(a))});return c}});e.$formatters.push(function(a){return I(a)?a.join(", "):s});e.$isEmpty=function(a){return!a||!a.length}}}},Ve=/^(true|false|\d+)$/,Jd=function(){return{priority:100,
compile:function(a,c){return Ve.test(c.ngValue)?function(a,c,f){f.$set("value",a.$eval(f.ngValue))}:function(a,c,f){a.$watch(f.ngValue,function(a){f.$set("value",a)})}}}},jd=xa({compile:function(a){a.addClass("ng-binding");return function(a,d,e){d.data("$binding",e.ngBind);a.$watch(e.ngBind,function(a){d.text(a==s?"":a)})}}}),ld=["$interpolate",function(a){return function(c,d,e){c=a(d.attr(e.$attr.ngBindTemplate));d.addClass("ng-binding").data("$binding",c);e.$observe("ngBindTemplate",function(a){d.text(a)})}}],
kd=["$sce","$parse",function(a,c){return{compile:function(d){d.addClass("ng-binding");return function(d,f,g){f.data("$binding",g.ngBindHtml);var k=c(g.ngBindHtml);d.$watch(function(){return(k(d)||"").toString()},function(c){f.html(a.getTrustedHtml(k(d))||"")})}}}}],md=Yb("",!0),od=Yb("Odd",0),nd=Yb("Even",1),pd=xa({compile:function(a,c){c.$set("ngCloak",s);a.removeClass("ng-cloak")}}),qd=[function(){return{scope:!0,controller:"@",priority:500}}],lc={};q("click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup keypress submit focus blur copy cut paste".split(" "),
function(a){var c=ma("ng-"+a);lc[c]=["$parse",function(d){return{compile:function(e,f){var g=d(f[c]);return function(c,d){d.on(K(a),function(a){c.$apply(function(){g(c,{$event:a})})})}}}}]});var td=["$animate",function(a){return{transclude:"element",priority:600,terminal:!0,restrict:"A",$$tlb:!0,link:function(c,d,e,f,g){var k,m,h;c.$watch(e.ngIf,function(f){Sa(f)?m||(m=c.$new(),g(m,function(c){c[c.length++]=W.createComment(" end ngIf: "+e.ngIf+" ");k={clone:c};a.enter(c,d.parent(),d)})):(h&&(h.remove(),
h=null),m&&(m.$destroy(),m=null),k&&(h=Eb(k.clone),a.leave(h,function(){h=null}),k=null))})}}}],ud=["$http","$templateCache","$anchorScroll","$animate","$sce",function(a,c,d,e,f){return{restrict:"ECA",priority:400,terminal:!0,transclude:"element",controller:Ta.noop,compile:function(g,k){var m=k.ngInclude||k.src,h=k.onload||"",l=k.autoscroll;return function(g,k,r,q,L){var w=0,u,s,x,A=function(){s&&(s.remove(),s=null);u&&(u.$destroy(),u=null);x&&(e.leave(x,function(){s=null}),s=x,x=null)};g.$watch(f.parseAsResourceUrl(m),
function(f){var m=function(){!B(l)||l&&!g.$eval(l)||d()},r=++w;f?(a.get(f,{cache:c}).success(function(a){if(r===w){var c=g.$new();q.template=a;a=L(c,function(a){A();e.enter(a,null,k,m)});u=c;x=a;u.$emit("$includeContentLoaded");g.$eval(h)}}).error(function(){r===w&&A()}),g.$emit("$includeContentRequested")):(A(),q.template=null)})}}}}],Kd=["$compile",function(a){return{restrict:"ECA",priority:-400,require:"ngInclude",link:function(c,d,e,f){d.html(f.template);a(d.contents())(c)}}}],vd=xa({priority:450,
compile:function(){return{pre:function(a,c,d){a.$eval(d.ngInit)}}}}),wd=xa({terminal:!0,priority:1E3}),xd=["$locale","$interpolate",function(a,c){var d=/{}/g;return{restrict:"EA",link:function(e,f,g){var k=g.count,m=g.$attr.when&&f.attr(g.$attr.when),h=g.offset||0,l=e.$eval(m)||{},p={},n=c.startSymbol(),r=c.endSymbol(),t=/^when(Minus)?(.+)$/;q(g,function(a,c){t.test(c)&&(l[K(c.replace("when","").replace("Minus","-"))]=f.attr(g.$attr[c]))});q(l,function(a,e){p[e]=c(a.replace(d,n+k+"-"+h+r))});e.$watch(function(){var c=
parseFloat(e.$eval(k));if(isNaN(c))return"";c in l||(c=a.pluralCat(c-h));return p[c](e,f,!0)},function(a){f.text(a)})}}}],yd=["$parse","$animate",function(a,c){var d=y("ngRepeat");return{transclude:"element",priority:1E3,terminal:!0,$$tlb:!0,link:function(e,f,g,k,m){var h=g.ngRepeat,l=h.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/),p,n,r,t,s,w,u={$id:Ka};if(!l)throw d("iexp",h);g=l[1];k=l[2];(l=l[3])?(p=a(l),n=function(a,c,d){w&&(u[w]=a);u[s]=c;u.$index=d;return p(e,
u)}):(r=function(a,c){return Ka(c)},t=function(a){return a});l=g.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);if(!l)throw d("iidexp",g);s=l[3]||l[1];w=l[2];var B={};e.$watchCollection(k,function(a){var g,k,l=f[0],p,u={},y,E,H,z,D,v,I=[];if(eb(a))D=a,p=n||r;else{p=n||t;D=[];for(H in a)a.hasOwnProperty(H)&&"$"!=H.charAt(0)&&D.push(H);D.sort()}y=D.length;k=I.length=D.length;for(g=0;g<k;g++)if(H=a===D?g:D[g],z=a[H],z=p(H,z,g),Ca(z,"`track by` id"),B.hasOwnProperty(z))v=B[z],delete B[z],u[z]=
v,I[g]=v;else{if(u.hasOwnProperty(z))throw q(I,function(a){a&&a.scope&&(B[a.id]=a)}),d("dupes",h,z);I[g]={id:z};u[z]=!1}for(H in B)B.hasOwnProperty(H)&&(v=B[H],g=Eb(v.clone),c.leave(g),q(g,function(a){a.$$NG_REMOVED=!0}),v.scope.$destroy());g=0;for(k=D.length;g<k;g++){H=a===D?g:D[g];z=a[H];v=I[g];I[g-1]&&(l=I[g-1].clone[I[g-1].clone.length-1]);if(v.scope){E=v.scope;p=l;do p=p.nextSibling;while(p&&p.$$NG_REMOVED);v.clone[0]!=p&&c.move(Eb(v.clone),null,x(l));l=v.clone[v.clone.length-1]}else E=e.$new();
E[s]=z;w&&(E[w]=H);E.$index=g;E.$first=0===g;E.$last=g===y-1;E.$middle=!(E.$first||E.$last);E.$odd=!(E.$even=0===(g&1));v.scope||m(E,function(a){a[a.length++]=W.createComment(" end ngRepeat: "+h+" ");c.enter(a,null,x(l));l=a;v.scope=E;v.clone=a;u[v.id]=v})}B=u})}}}],zd=["$animate",function(a){return function(c,d,e){c.$watch(e.ngShow,function(c){a[Sa(c)?"removeClass":"addClass"](d,"ng-hide")})}}],sd=["$animate",function(a){return function(c,d,e){c.$watch(e.ngHide,function(c){a[Sa(c)?"addClass":"removeClass"](d,
"ng-hide")})}}],Ad=xa(function(a,c,d){a.$watch(d.ngStyle,function(a,d){d&&a!==d&&q(d,function(a,d){c.css(d,"")});a&&c.css(a)},!0)}),Bd=["$animate",function(a){return{restrict:"EA",require:"ngSwitch",controller:["$scope",function(){this.cases={}}],link:function(c,d,e,f){var g=[],k=[],m=[],h=[];c.$watch(e.ngSwitch||e.on,function(d){var p,n;p=0;for(n=m.length;p<n;++p)m[p].remove();p=m.length=0;for(n=h.length;p<n;++p){var r=k[p];h[p].$destroy();m[p]=r;a.leave(r,function(){m.splice(p,1)})}k.length=0;h.length=
0;if(g=f.cases["!"+d]||f.cases["?"])c.$eval(e.change),q(g,function(d){var e=c.$new();h.push(e);d.transclude(e,function(c){var e=d.element;k.push(c);a.enter(c,e.parent(),e)})})})}}}],Cd=xa({transclude:"element",priority:800,require:"^ngSwitch",link:function(a,c,d,e,f){e.cases["!"+d.ngSwitchWhen]=e.cases["!"+d.ngSwitchWhen]||[];e.cases["!"+d.ngSwitchWhen].push({transclude:f,element:c})}}),Dd=xa({transclude:"element",priority:800,require:"^ngSwitch",link:function(a,c,d,e,f){e.cases["?"]=e.cases["?"]||
[];e.cases["?"].push({transclude:f,element:c})}}),Fd=xa({link:function(a,c,d,e,f){if(!f)throw y("ngTransclude")("orphan",ha(c));f(function(a){c.empty();c.append(a)})}}),fd=["$templateCache",function(a){return{restrict:"E",terminal:!0,compile:function(c,d){"text/ng-template"==d.type&&a.put(d.id,c[0].text)}}}],We=y("ngOptions"),Ed=$({terminal:!0}),gd=["$compile","$parse",function(a,c){var d=/^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/,
e={$setViewValue:D};return{restrict:"E",require:["select","?ngModel"],controller:["$element","$scope","$attrs",function(a,c,d){var m=this,h={},l=e,p;m.databound=d.ngModel;m.init=function(a,c,d){l=a;p=d};m.addOption=function(c){Ca(c,'"option value"');h[c]=!0;l.$viewValue==c&&(a.val(c),p.parent()&&p.remove())};m.removeOption=function(a){this.hasOption(a)&&(delete h[a],l.$viewValue==a&&this.renderUnknownOption(a))};m.renderUnknownOption=function(c){c="? "+Ka(c)+" ?";p.val(c);a.prepend(p);a.val(c);p.prop("selected",
!0)};m.hasOption=function(a){return h.hasOwnProperty(a)};c.$on("$destroy",function(){m.renderUnknownOption=D})}],link:function(e,g,k,m){function h(a,c,d,e){d.$render=function(){var a=d.$viewValue;e.hasOption(a)?(y.parent()&&y.remove(),c.val(a),""===a&&w.prop("selected",!0)):v(a)&&w?c.val(""):e.renderUnknownOption(a)};c.on("change",function(){a.$apply(function(){y.parent()&&y.remove();d.$setViewValue(c.val())})})}function l(a,c,d){var e;d.$render=function(){var a=new $a(d.$viewValue);q(c.find("option"),
function(c){c.selected=B(a.get(c.value))})};a.$watch(function(){za(e,d.$viewValue)||(e=ga(d.$viewValue),d.$render())});c.on("change",function(){a.$apply(function(){var a=[];q(c.find("option"),function(c){c.selected&&a.push(c.value)});d.$setViewValue(a)})})}function p(e,f,g){function k(){var a={"":[]},c=[""],d,h,s,t,v;t=g.$modelValue;v=x(e)||[];var A=n?Zb(v):v,E,N,C;N={};s=!1;var F,K;if(r)if(w&&I(t))for(s=new $a([]),C=0;C<t.length;C++)N[m]=t[C],s.put(w(e,N),t[C]);else s=new $a(t);for(C=0;E=A.length,
C<E;C++){h=C;if(n){h=A[C];if("$"===h.charAt(0))continue;N[n]=h}N[m]=v[h];d=p(e,N)||"";(h=a[d])||(h=a[d]=[],c.push(d));r?d=B(s.remove(w?w(e,N):q(e,N))):(w?(d={},d[m]=t,d=w(e,d)===w(e,N)):d=t===q(e,N),s=s||d);F=l(e,N);F=B(F)?F:"";h.push({id:w?w(e,N):n?A[C]:C,label:F,selected:d})}r||(z||null===t?a[""].unshift({id:"",label:"",selected:!s}):s||a[""].unshift({id:"?",label:"",selected:!0}));N=0;for(A=c.length;N<A;N++){d=c[N];h=a[d];y.length<=N?(t={element:D.clone().attr("label",d),label:h.label},v=[t],y.push(v),
f.append(t.element)):(v=y[N],t=v[0],t.label!=d&&t.element.attr("label",t.label=d));F=null;C=0;for(E=h.length;C<E;C++)s=h[C],(d=v[C+1])?(F=d.element,d.label!==s.label&&F.text(d.label=s.label),d.id!==s.id&&F.val(d.id=s.id),d.selected!==s.selected&&(F.prop("selected",d.selected=s.selected),Q&&F.prop("selected",d.selected))):(""===s.id&&z?K=z:(K=u.clone()).val(s.id).prop("selected",s.selected).text(s.label),v.push({element:K,label:s.label,id:s.id,selected:s.selected}),F?F.after(K):t.element.append(K),
F=K);for(C++;v.length>C;)v.pop().element.remove()}for(;y.length>N;)y.pop()[0].element.remove()}var h;if(!(h=t.match(d)))throw We("iexp",t,ha(f));var l=c(h[2]||h[1]),m=h[4]||h[6],n=h[5],p=c(h[3]||""),q=c(h[2]?h[1]:m),x=c(h[7]),w=h[8]?c(h[8]):null,y=[[{element:f,label:""}]];z&&(a(z)(e),z.removeClass("ng-scope"),z.remove());f.empty();f.on("change",function(){e.$apply(function(){var a,c=x(e)||[],d={},h,k,l,p,t,u,v;if(r)for(k=[],p=0,u=y.length;p<u;p++)for(a=y[p],l=1,t=a.length;l<t;l++){if((h=a[l].element)[0].selected){h=
h.val();n&&(d[n]=h);if(w)for(v=0;v<c.length&&(d[m]=c[v],w(e,d)!=h);v++);else d[m]=c[h];k.push(q(e,d))}}else{h=f.val();if("?"==h)k=s;else if(""===h)k=null;else if(w)for(v=0;v<c.length;v++){if(d[m]=c[v],w(e,d)==h){k=q(e,d);break}}else d[m]=c[h],n&&(d[n]=h),k=q(e,d);1<y[0].length&&y[0][1].id!==h&&(y[0][1].selected=!1)}g.$setViewValue(k)})});g.$render=k;e.$watch(k)}if(m[1]){var n=m[0];m=m[1];var r=k.multiple,t=k.ngOptions,z=!1,w,u=x(W.createElement("option")),D=x(W.createElement("optgroup")),y=u.clone();
k=0;for(var A=g.children(),C=A.length;k<C;k++)if(""===A[k].value){w=z=A.eq(k);break}n.init(m,z,y);r&&(m.$isEmpty=function(a){return!a||0===a.length});t?p(e,g,m):r?l(e,g,m):h(e,g,m,n)}}}}],id=["$interpolate",function(a){var c={addOption:D,removeOption:D};return{restrict:"E",priority:100,compile:function(d,e){if(v(e.value)){var f=a(d.text(),!0);f||e.$set("value",d.text())}return function(a,d,e){var h=d.parent(),l=h.data("$selectController")||h.parent().data("$selectController");l&&l.databound?d.prop("selected",
!1):l=c;f?a.$watch(f,function(a,c){e.$set("value",a);a!==c&&l.removeOption(c);l.addOption(a)}):l.addOption(e.value);d.on("$destroy",function(){l.removeOption(e.value)})}}}}],hd=$({restrict:"E",terminal:!0});P.angular.bootstrap?console.log("WARNING: Tried to load angular more than once."):((Da=P.jQuery)&&Da.fn.on?(x=Da,F(Da.fn,{scope:La.scope,isolateScope:La.isolateScope,controller:La.controller,injector:La.injector,inheritedData:La.inheritedData}),Gb("remove",!0,!0,!1),Gb("empty",!1,!1,!1),Gb("html",
!1,!1,!0)):x=R,Ta.element=x,$c(Ta),x(W).ready(function(){Xc(W,fc)}))})(window,document);!window.angular.$$csp()&&window.angular.element(document).find("head").prepend('<style type="text/css">@charset "UTF-8";[ng\\:cloak],[ng-cloak],[data-ng-cloak],[x-ng-cloak],.ng-cloak,.x-ng-cloak,.ng-hide{display:none !important;}ng\\:form{display:block;}.ng-animate-block-transitions{transition:0s all!important;-webkit-transition:0s all!important;}.ng-hide-add-active,.ng-hide-remove{display:block!important;}</style>');
//# sourceMappingURL=angular.min.js.map
;
// Source: src/main/js/lib/angular/v1.2/angular-route.min.js
/*
 AngularJS v1.2.21
 (c) 2010-2014 Google, Inc. http://angularjs.org
 License: MIT
*/
(function(n,e,A){'use strict';function x(s,g,h){return{restrict:"ECA",terminal:!0,priority:400,transclude:"element",link:function(a,c,b,f,w){function y(){p&&(p.remove(),p=null);k&&(k.$destroy(),k=null);l&&(h.leave(l,function(){p=null}),p=l,l=null)}function v(){var b=s.current&&s.current.locals;if(e.isDefined(b&&b.$template)){var b=a.$new(),d=s.current;l=w(b,function(d){h.enter(d,null,l||c,function(){!e.isDefined(t)||t&&!a.$eval(t)||g()});y()});k=d.scope=b;k.$emit("$viewContentLoaded");k.$eval(u)}else y()}
var k,l,p,t=b.autoscroll,u=b.onload||"";a.$on("$routeChangeSuccess",v);v()}}}function z(e,g,h){return{restrict:"ECA",priority:-400,link:function(a,c){var b=h.current,f=b.locals;c.html(f.$template);var w=e(c.contents());b.controller&&(f.$scope=a,f=g(b.controller,f),b.controllerAs&&(a[b.controllerAs]=f),c.data("$ngControllerController",f),c.children().data("$ngControllerController",f));w(a)}}}n=e.module("ngRoute",["ng"]).provider("$route",function(){function s(a,c){return e.extend(new (e.extend(function(){},
{prototype:a})),c)}function g(a,e){var b=e.caseInsensitiveMatch,f={originalPath:a,regexp:a},h=f.keys=[];a=a.replace(/([().])/g,"\\$1").replace(/(\/)?:(\w+)([\?\*])?/g,function(a,e,b,c){a="?"===c?c:null;c="*"===c?c:null;h.push({name:b,optional:!!a});e=e||"";return""+(a?"":e)+"(?:"+(a?e:"")+(c&&"(.+?)"||"([^/]+)")+(a||"")+")"+(a||"")}).replace(/([\/$\*])/g,"\\$1");f.regexp=RegExp("^"+a+"$",b?"i":"");return f}var h={};this.when=function(a,c){h[a]=e.extend({reloadOnSearch:!0},c,a&&g(a,c));if(a){var b=
"/"==a[a.length-1]?a.substr(0,a.length-1):a+"/";h[b]=e.extend({redirectTo:a},g(b,c))}return this};this.otherwise=function(a){this.when(null,a);return this};this.$get=["$rootScope","$location","$routeParams","$q","$injector","$http","$templateCache","$sce",function(a,c,b,f,g,n,v,k){function l(){var d=p(),m=r.current;if(d&&m&&d.$$route===m.$$route&&e.equals(d.pathParams,m.pathParams)&&!d.reloadOnSearch&&!u)m.params=d.params,e.copy(m.params,b),a.$broadcast("$routeUpdate",m);else if(d||m)u=!1,a.$broadcast("$routeChangeStart",
d,m),(r.current=d)&&d.redirectTo&&(e.isString(d.redirectTo)?c.path(t(d.redirectTo,d.params)).search(d.params).replace():c.url(d.redirectTo(d.pathParams,c.path(),c.search())).replace()),f.when(d).then(function(){if(d){var a=e.extend({},d.resolve),c,b;e.forEach(a,function(d,c){a[c]=e.isString(d)?g.get(d):g.invoke(d)});e.isDefined(c=d.template)?e.isFunction(c)&&(c=c(d.params)):e.isDefined(b=d.templateUrl)&&(e.isFunction(b)&&(b=b(d.params)),b=k.getTrustedResourceUrl(b),e.isDefined(b)&&(d.loadedTemplateUrl=
b,c=n.get(b,{cache:v}).then(function(a){return a.data})));e.isDefined(c)&&(a.$template=c);return f.all(a)}}).then(function(c){d==r.current&&(d&&(d.locals=c,e.copy(d.params,b)),a.$broadcast("$routeChangeSuccess",d,m))},function(c){d==r.current&&a.$broadcast("$routeChangeError",d,m,c)})}function p(){var a,b;e.forEach(h,function(f,h){var q;if(q=!b){var g=c.path();q=f.keys;var l={};if(f.regexp)if(g=f.regexp.exec(g)){for(var k=1,p=g.length;k<p;++k){var n=q[k-1],r=g[k];n&&r&&(l[n.name]=r)}q=l}else q=null;
else q=null;q=a=q}q&&(b=s(f,{params:e.extend({},c.search(),a),pathParams:a}),b.$$route=f)});return b||h[null]&&s(h[null],{params:{},pathParams:{}})}function t(a,c){var b=[];e.forEach((a||"").split(":"),function(a,d){if(0===d)b.push(a);else{var e=a.match(/(\w+)(.*)/),f=e[1];b.push(c[f]);b.push(e[2]||"");delete c[f]}});return b.join("")}var u=!1,r={routes:h,reload:function(){u=!0;a.$evalAsync(l)}};a.$on("$locationChangeSuccess",l);return r}]});n.provider("$routeParams",function(){this.$get=function(){return{}}});
n.directive("ngView",x);n.directive("ngView",z);x.$inject=["$route","$anchorScroll","$animate"];z.$inject=["$compile","$controller","$route"]})(window,window.angular);
//# sourceMappingURL=angular-route.min.js.map
;
// Source: src/main/js/lib/angular/v1.2/angular-touch.min.js
/*
 AngularJS v1.2.21
 (c) 2010-2014 Google, Inc. http://angularjs.org
 License: MIT
*/
(function(y,w,z){'use strict';function u(f,a,c){r.directive(f,["$parse","$swipe",function(m,p){var q=75,g=0.3,e=30;return function(h,n,l){function k(d){if(!b)return!1;var s=Math.abs(d.y-b.y);d=(d.x-b.x)*a;return v&&s<q&&0<d&&d>e&&s/d<g}var s=m(l[f]),b,v;p.bind(n,{start:function(d,s){b=d;v=!0},cancel:function(b){v=!1},end:function(b,a){k(b)&&h.$apply(function(){n.triggerHandler(c);s(h,{$event:a})})}})}}])}var r=w.module("ngTouch",[]);r.factory("$swipe",[function(){function f(a){var c=a.touches&&a.touches.length?
a.touches:[a];a=a.changedTouches&&a.changedTouches[0]||a.originalEvent&&a.originalEvent.changedTouches&&a.originalEvent.changedTouches[0]||c[0].originalEvent||c[0];return{x:a.clientX,y:a.clientY}}return{bind:function(a,c){var m,p,q,g,e=!1;a.on("touchstart mousedown",function(a){q=f(a);e=!0;p=m=0;g=q;c.start&&c.start(q,a)});a.on("touchcancel",function(a){e=!1;c.cancel&&c.cancel(a)});a.on("touchmove mousemove",function(a){if(e&&q){var n=f(a);m+=Math.abs(n.x-g.x);p+=Math.abs(n.y-g.y);g=n;10>m&&10>p||
(p>m?(e=!1,c.cancel&&c.cancel(a)):(a.preventDefault(),c.move&&c.move(n,a)))}});a.on("touchend mouseup",function(a){e&&(e=!1,c.end&&c.end(f(a),a))})}}}]);r.config(["$provide",function(f){f.decorator("ngClickDirective",["$delegate",function(a){a.shift();return a}])}]);r.directive("ngClick",["$parse","$timeout","$rootElement",function(f,a,c){function m(a,b,c){for(var d=0;d<a.length;d+=2)if(Math.abs(a[d]-b)<e&&Math.abs(a[d+1]-c)<e)return a.splice(d,d+2),!0;return!1}function p(a){if(!(Date.now()-n>g)){var b=
a.touches&&a.touches.length?a.touches:[a],c=b[0].clientX,b=b[0].clientY;1>c&&1>b||k&&k[0]===c&&k[1]===b||(k&&(k=null),"label"===a.target.tagName.toLowerCase()&&(k=[c,b]),m(l,c,b)||(a.stopPropagation(),a.preventDefault(),a.target&&a.target.blur()))}}function q(c){c=c.touches&&c.touches.length?c.touches:[c];var b=c[0].clientX,e=c[0].clientY;l.push(b,e);a(function(){for(var a=0;a<l.length;a+=2)if(l[a]==b&&l[a+1]==e){l.splice(a,a+2);break}},g,!1)}var g=2500,e=25,h="ng-click-active",n,l,k;return function(a,
b,e){function d(){k=!1;b.removeClass(h)}var g=f(e.ngClick),k=!1,t,r,u,x;b.on("touchstart",function(a){k=!0;t=a.target?a.target:a.srcElement;3==t.nodeType&&(t=t.parentNode);b.addClass(h);r=Date.now();a=a.touches&&a.touches.length?a.touches:[a];a=a[0].originalEvent||a[0];u=a.clientX;x=a.clientY});b.on("touchmove",function(a){d()});b.on("touchcancel",function(a){d()});b.on("touchend",function(a){var g=Date.now()-r,f=a.changedTouches&&a.changedTouches.length?a.changedTouches:a.touches&&a.touches.length?
a.touches:[a],h=f[0].originalEvent||f[0],f=h.clientX,h=h.clientY,s=Math.sqrt(Math.pow(f-u,2)+Math.pow(h-x,2));k&&(750>g&&12>s)&&(l||(c[0].addEventListener("click",p,!0),c[0].addEventListener("touchstart",q,!0),l=[]),n=Date.now(),m(l,f,h),t&&t.blur(),w.isDefined(e.disabled)&&!1!==e.disabled||b.triggerHandler("click",[a]));d()});b.onclick=function(a){};b.on("click",function(b,c){a.$apply(function(){g(a,{$event:c||b})})});b.on("mousedown",function(a){b.addClass(h)});b.on("mousemove mouseup",function(a){b.removeClass(h)})}}]);
u("ngSwipeLeft",-1,"swipeleft");u("ngSwipeRight",1,"swiperight")})(window,window.angular);
//# sourceMappingURL=angular-touch.min.js.map
;
// Source: src/main/js/lib/angular/v1.2/angular-animate.min.js
/*
 AngularJS v1.2.21
 (c) 2010-2014 Google, Inc. http://angularjs.org
 License: MIT
*/
(function(F,e,O){'use strict';e.module("ngAnimate",["ng"]).directive("ngAnimateChildren",function(){return function(G,s,g){g=g.ngAnimateChildren;e.isString(g)&&0===g.length?s.data("$$ngAnimateChildren",!0):G.$watch(g,function(e){s.data("$$ngAnimateChildren",!!e)})}}).factory("$$animateReflow",["$$rAF","$document",function(e,s){return function(g){return e(function(){g()})}}]).config(["$provide","$animateProvider",function(G,s){function g(e){for(var g=0;g<e.length;g++){var l=e[g];if(l.nodeType==aa)return l}}
function B(l){return e.element(g(l))}var m=e.noop,u=e.forEach,P=s.$$selectors,aa=1,l="$$ngAnimateState",V="$$ngAnimateChildren",J="ng-animate",n={running:!0};G.decorator("$animate",["$delegate","$injector","$sniffer","$rootElement","$$asyncCallback","$rootScope","$document",function(z,F,$,R,E,H,O){function K(a){var b=a.data(l)||{};b.running=!0;a.data(l,b)}function L(a){if(a){var b=[],c={};a=a.substr(1).split(".");($.transitions||$.animations)&&b.push(F.get(P[""]));for(var d=0;d<a.length;d++){var f=
a[d],e=P[f];e&&!c[f]&&(b.push(F.get(e)),c[f]=!0)}return b}}function G(a,b,c){function d(a,b){var c=a[b],d=a["before"+b.charAt(0).toUpperCase()+b.substr(1)];if(c||d)return"leave"==b&&(d=c,c=null),n.push({event:b,fn:c}),h.push({event:b,fn:d}),!0}function f(b,d,e){var f=[];u(b,function(a){a.fn&&f.push(a)});var g=0;u(f,function(b,l){var C=function(){a:{if(d){(d[l]||m)();if(++g<f.length)break a;d=null}e()}};switch(b.event){case "setClass":d.push(b.fn(a,A,k,C));break;case "addClass":d.push(b.fn(a,A||c,
C));break;case "removeClass":d.push(b.fn(a,k||c,C));break;default:d.push(b.fn(a,C))}});d&&0===d.length&&e()}var g=a[0];if(g){var l="setClass"==b,p=l||"addClass"==b||"removeClass"==b,A,k;e.isArray(c)&&(A=c[0],k=c[1],c=A+" "+k);var x=a.attr("class")+" "+c;if(M(x)){var t=m,w=[],h=[],q=m,y=[],n=[],x=(" "+x).replace(/\s+/g,".");u(L(x),function(a){!d(a,b)&&l&&(d(a,"addClass"),d(a,"removeClass"))});return{node:g,event:b,className:c,isClassBased:p,isSetClassOperation:l,before:function(a){t=a;f(h,w,function(){t=
m;a()})},after:function(a){q=a;f(n,y,function(){q=m;a()})},cancel:function(){w&&(u(w,function(a){(a||m)(!0)}),t(!0));y&&(u(y,function(a){(a||m)(!0)}),q(!0))}}}}}function r(a,b,c,d,f,g,n){function p(d){var e="$animate:"+d;q&&(q[e]&&0<q[e].length)&&E(function(){c.triggerHandler(e,{event:a,className:b})})}function A(){p("before")}function m(){p("after")}function x(){p("close");n&&E(function(){n()})}function t(){t.hasBeenRun||(t.hasBeenRun=!0,g())}function w(){if(!w.hasBeenRun){w.hasBeenRun=!0;var d=
c.data(l);d&&(h&&h.isClassBased?k(c,b):(E(function(){var d=c.data(l)||{};r==d.index&&k(c,b,a)}),c.data(l,d)));x()}}var h=G(c,a,b);if(h){b=h.className;var q=e.element._data(h.node),q=q&&q.events;d||(d=f?f.parent():c.parent());var y=c.data(l)||{};f=y.active||{};var z=y.totalActive||0,C=y.last,D;h.isClassBased&&(D=y.running||y.disabled||C&&!C.isClassBased);if(D||N(c,d))t(),A(),m(),w();else{d=!1;if(0<z){D=[];if(h.isClassBased)"setClass"==C.event?(D.push(C),k(c,b)):f[b]&&(v=f[b],v.event==a?d=!0:(D.push(v),
k(c,b)));else if("leave"==a&&f["ng-leave"])d=!0;else{for(var v in f)D.push(f[v]),k(c,v);f={};z=0}0<D.length&&u(D,function(a){a.cancel()})}!h.isClassBased||(h.isSetClassOperation||d)||(d="addClass"==a==c.hasClass(b));if(d)t(),A(),m(),x();else{if("leave"==a)c.one("$destroy",function(a){a=e.element(this);var b=a.data(l);b&&(b=b.active["ng-leave"])&&(b.cancel(),k(a,"ng-leave"))});c.addClass(J);var r=Y++;z++;f[b]=h;c.data(l,{last:h,active:f,index:r,totalActive:z});A();h.before(function(d){var e=c.data(l);
d=d||!e||!e.active[b]||h.isClassBased&&e.active[b].event!=a;t();!0===d?w():(m(),h.after(w))})}}}else t(),A(),m(),w()}function T(a){if(a=g(a))a=e.isFunction(a.getElementsByClassName)?a.getElementsByClassName(J):a.querySelectorAll("."+J),u(a,function(a){a=e.element(a);(a=a.data(l))&&a.active&&u(a.active,function(a){a.cancel()})})}function k(a,b){if(g(a)==g(R))n.disabled||(n.running=!1,n.structural=!1);else if(b){var c=a.data(l)||{},d=!0===b;!d&&(c.active&&c.active[b])&&(c.totalActive--,delete c.active[b]);
if(d||!c.totalActive)a.removeClass(J),a.removeData(l)}}function N(a,b){if(n.disabled)return!0;if(g(a)==g(R))return n.running;var c,d,f;do{if(0===b.length)break;var m=g(b)==g(R),k=m?n:b.data(l)||{};if(k.disabled)return!0;m&&(f=!0);!1!==c&&(m=b.data(V),e.isDefined(m)&&(c=m));d=d||k.running||k.last&&!k.last.isClassBased}while(b=b.parent());return!f||!c&&d}var Y=0;R.data(l,n);H.$$postDigest(function(){H.$$postDigest(function(){n.running=!1})});var Q=s.classNameFilter(),M=Q?function(a){return Q.test(a)}:
function(){return!0};return{enter:function(a,b,c,d){a=e.element(a);b=b&&e.element(b);c=c&&e.element(c);K(a);z.enter(a,b,c);H.$$postDigest(function(){a=B(a);r("enter","ng-enter",a,b,c,m,d)})},leave:function(a,b){a=e.element(a);T(a);K(a);H.$$postDigest(function(){r("leave","ng-leave",B(a),null,null,function(){z.leave(a)},b)})},move:function(a,b,c,d){a=e.element(a);b=b&&e.element(b);c=c&&e.element(c);T(a);K(a);z.move(a,b,c);H.$$postDigest(function(){a=B(a);r("move","ng-move",a,b,c,m,d)})},addClass:function(a,
b,c){a=e.element(a);a=B(a);r("addClass",b,a,null,null,function(){z.addClass(a,b)},c)},removeClass:function(a,b,c){a=e.element(a);a=B(a);r("removeClass",b,a,null,null,function(){z.removeClass(a,b)},c)},setClass:function(a,b,c,d){a=e.element(a);a=B(a);r("setClass",[b,c],a,null,null,function(){z.setClass(a,b,c)},d)},enabled:function(a,b){switch(arguments.length){case 2:if(a)k(b);else{var c=b.data(l)||{};c.disabled=!0;b.data(l,c)}break;case 1:n.disabled=!a;break;default:a=!n.disabled}return!!a}}}]);s.register("",
["$window","$sniffer","$timeout","$$animateReflow",function(l,n,s,B){function E(a,U){S&&S();W.push(U);S=B(function(){u(W,function(a){a()});W=[];S=null;v={}})}function H(a,U){var b=g(a);a=e.element(b);Z.push(a);b=Date.now()+U;b<=da||(s.cancel(ca),da=b,ca=s(function(){G(Z);Z=[]},U,!1))}function G(a){u(a,function(a){(a=a.data(q))&&(a.closeAnimationFn||m)()})}function K(a,b){var c=b?v[b]:null;if(!c){var d=0,e=0,f=0,g=0,m,k,h,q;u(a,function(a){if(a.nodeType==aa){a=l.getComputedStyle(a)||{};h=a[I+P];d=
Math.max(L(h),d);q=a[I+x];m=a[I+t];e=Math.max(L(m),e);k=a[p+t];g=Math.max(L(k),g);var b=L(a[p+P]);0<b&&(b*=parseInt(a[p+w],10)||1);f=Math.max(b,f)}});c={total:0,transitionPropertyStyle:q,transitionDurationStyle:h,transitionDelayStyle:m,transitionDelay:e,transitionDuration:d,animationDelayStyle:k,animationDelay:g,animationDuration:f};b&&(v[b]=c)}return c}function L(a){var b=0;a=e.isString(a)?a.split(/\s*,\s*/):[];u(a,function(a){b=Math.max(parseFloat(a)||0,b)});return b}function J(a){var b=a.parent(),
c=b.data(h);c||(b.data(h,++ba),c=ba);return c+"-"+g(a).getAttribute("class")}function r(a,b,c,d){var e=J(b),f=e+" "+c,l=v[f]?++v[f].total:0,k={};if(0<l){var h=c+"-stagger",k=e+" "+h;(e=!v[k])&&b.addClass(h);k=K(b,k);e&&b.removeClass(h)}d=d||function(a){return a()};b.addClass(c);var h=b.data(q)||{},n=d(function(){return K(b,f)});d=n.transitionDuration;e=n.animationDuration;if(0===d&&0===e)return b.removeClass(c),!1;b.data(q,{running:h.running||0,itemIndex:l,stagger:k,timings:n,closeAnimationFn:m});
a=0<h.running||"setClass"==a;0<d&&T(b,c,a);0<e&&(0<k.animationDelay&&0===k.animationDuration)&&(g(b).style[p]="none 0s");return!0}function T(a,b,c){"ng-enter"!=b&&("ng-move"!=b&&"ng-leave"!=b)&&c?a.addClass(y):g(a).style[I+x]="none"}function k(a,b){var c=I+x,d=g(a);d.style[c]&&0<d.style[c].length&&(d.style[c]="");a.removeClass(y)}function N(a){var b=p;a=g(a);a.style[b]&&0<a.style[b].length&&(a.style[b]="")}function Y(a,b,d,e){function k(a){b.off(x,l);b.removeClass(m);c(b,d);a=g(b);for(var e in s)a.style.removeProperty(s[e])}
function l(a){a.stopPropagation();var b=a.originalEvent||a;a=b.$manualTimeStamp||b.timeStamp||Date.now();b=parseFloat(b.elapsedTime.toFixed(V));Math.max(a-z,0)>=y&&b>=v&&e()}var h=g(b);a=b.data(q);if(-1!=h.getAttribute("class").indexOf(d)&&a){var m="";u(d.split(" "),function(a,b){m+=(0<b?" ":"")+a+"-active"});var n=a.stagger,p=a.timings,t=a.itemIndex,v=Math.max(p.transitionDuration,p.animationDuration),w=Math.max(p.transitionDelay,p.animationDelay),y=w*D,z=Date.now(),x=A+" "+X,r="",s=[];if(0<p.transitionDuration){var B=
p.transitionPropertyStyle;-1==B.indexOf("all")&&(r+=f+"transition-property: "+B+";",r+=f+"transition-duration: "+p.transitionDurationStyle+";",s.push(f+"transition-property"),s.push(f+"transition-duration"))}0<t&&(0<n.transitionDelay&&0===n.transitionDuration&&(r+=f+"transition-delay: "+Q(p.transitionDelayStyle,n.transitionDelay,t)+"; ",s.push(f+"transition-delay")),0<n.animationDelay&&0===n.animationDuration&&(r+=f+"animation-delay: "+Q(p.animationDelayStyle,n.animationDelay,t)+"; ",s.push(f+"animation-delay")));
0<s.length&&(p=h.getAttribute("style")||"",h.setAttribute("style",p+"; "+r));b.on(x,l);b.addClass(m);a.closeAnimationFn=function(){k();e()};h=(t*(Math.max(n.animationDelay,n.transitionDelay)||0)+(w+v)*C)*D;a.running++;H(b,h);return k}e()}function Q(a,b,c){var d="";u(a.split(","),function(a,e){d+=(0<e?",":"")+(c*b+parseInt(a,10))+"s"});return d}function M(a,b,d,e){if(r(a,b,d,e))return function(a){a&&c(b,d)}}function a(a,b,d,e){if(b.data(q))return Y(a,b,d,e);c(b,d);e()}function b(b,c,d,e){var f=M(b,
c,d);if(f){var g=f;E(c,function(){k(c,d);N(c);g=a(b,c,d,e)});return function(a){(g||m)(a)}}e()}function c(a,b){a.removeClass(b);var c=a.data(q);c&&(c.running&&c.running--,c.running&&0!==c.running||a.removeData(q))}function d(a,b){var c="";a=e.isArray(a)?a:a.split(/\s+/);u(a,function(a,d){a&&0<a.length&&(c+=(0<d?" ":"")+a+b)});return c}var f="",I,X,p,A;F.ontransitionend===O&&F.onwebkittransitionend!==O?(f="-webkit-",I="WebkitTransition",X="webkitTransitionEnd transitionend"):(I="transition",X="transitionend");
F.onanimationend===O&&F.onwebkitanimationend!==O?(f="-webkit-",p="WebkitAnimation",A="webkitAnimationEnd animationend"):(p="animation",A="animationend");var P="Duration",x="Property",t="Delay",w="IterationCount",h="$$ngAnimateKey",q="$$ngAnimateCSS3Data",y="ng-animate-block-transitions",V=3,C=1.5,D=1E3,v={},ba=0,W=[],S,ca=null,da=0,Z=[];return{enter:function(a,c){return b("enter",a,"ng-enter",c)},leave:function(a,c){return b("leave",a,"ng-leave",c)},move:function(a,c){return b("move",a,"ng-move",
c)},beforeSetClass:function(a,b,c,e){var f=d(c,"-remove")+" "+d(b,"-add"),g=M("setClass",a,f,function(d){var e=a.attr("class");a.removeClass(c);a.addClass(b);d=d();a.attr("class",e);return d});if(g)return E(a,function(){k(a,f);N(a);e()}),g;e()},beforeAddClass:function(a,b,c){var e=M("addClass",a,d(b,"-add"),function(c){a.addClass(b);c=c();a.removeClass(b);return c});if(e)return E(a,function(){k(a,b);N(a);c()}),e;c()},setClass:function(b,c,e,f){e=d(e,"-remove");c=d(c,"-add");return a("setClass",b,
e+" "+c,f)},addClass:function(b,c,e){return a("addClass",b,d(c,"-add"),e)},beforeRemoveClass:function(a,b,c){var e=M("removeClass",a,d(b,"-remove"),function(c){var d=a.attr("class");a.removeClass(b);c=c();a.attr("class",d);return c});if(e)return E(a,function(){k(a,b);N(a);c()}),e;c()},removeClass:function(b,c,e){return a("removeClass",b,d(c,"-remove"),e)}}}])}])})(window,window.angular);
//# sourceMappingURL=angular-animate.min.js.map
;
// Source: src/main/js/lib/angular/v1.2/angular-resource.min.js
/*
 AngularJS v1.2.21
 (c) 2010-2014 Google, Inc. http://angularjs.org
 License: MIT
*/
(function(H,a,A){'use strict';function D(p,g){g=g||{};a.forEach(g,function(a,c){delete g[c]});for(var c in p)!p.hasOwnProperty(c)||"$"===c.charAt(0)&&"$"===c.charAt(1)||(g[c]=p[c]);return g}var v=a.$$minErr("$resource"),C=/^(\.[a-zA-Z_$][0-9a-zA-Z_$]*)+$/;a.module("ngResource",["ng"]).factory("$resource",["$http","$q",function(p,g){function c(a,c){this.template=a;this.defaults=c||{};this.urlParams={}}function t(n,w,l){function r(h,d){var e={};d=x({},w,d);s(d,function(b,d){u(b)&&(b=b());var k;if(b&&
b.charAt&&"@"==b.charAt(0)){k=h;var a=b.substr(1);if(null==a||""===a||"hasOwnProperty"===a||!C.test("."+a))throw v("badmember",a);for(var a=a.split("."),f=0,c=a.length;f<c&&k!==A;f++){var g=a[f];k=null!==k?k[g]:A}}else k=b;e[d]=k});return e}function e(a){return a.resource}function f(a){D(a||{},this)}var F=new c(n);l=x({},B,l);s(l,function(h,d){var c=/^(POST|PUT|PATCH)$/i.test(h.method);f[d]=function(b,d,k,w){var q={},n,l,y;switch(arguments.length){case 4:y=w,l=k;case 3:case 2:if(u(d)){if(u(b)){l=
b;y=d;break}l=d;y=k}else{q=b;n=d;l=k;break}case 1:u(b)?l=b:c?n=b:q=b;break;case 0:break;default:throw v("badargs",arguments.length);}var t=this instanceof f,m=t?n:h.isArray?[]:new f(n),z={},B=h.interceptor&&h.interceptor.response||e,C=h.interceptor&&h.interceptor.responseError||A;s(h,function(a,b){"params"!=b&&("isArray"!=b&&"interceptor"!=b)&&(z[b]=G(a))});c&&(z.data=n);F.setUrlParams(z,x({},r(n,h.params||{}),q),h.url);q=p(z).then(function(b){var d=b.data,k=m.$promise;if(d){if(a.isArray(d)!==!!h.isArray)throw v("badcfg",
h.isArray?"array":"object",a.isArray(d)?"array":"object");h.isArray?(m.length=0,s(d,function(b){"object"===typeof b?m.push(new f(b)):m.push(b)})):(D(d,m),m.$promise=k)}m.$resolved=!0;b.resource=m;return b},function(b){m.$resolved=!0;(y||E)(b);return g.reject(b)});q=q.then(function(b){var a=B(b);(l||E)(a,b.headers);return a},C);return t?q:(m.$promise=q,m.$resolved=!1,m)};f.prototype["$"+d]=function(b,a,k){u(b)&&(k=a,a=b,b={});b=f[d].call(this,b,this,a,k);return b.$promise||b}});f.bind=function(a){return t(n,
x({},w,a),l)};return f}var B={get:{method:"GET"},save:{method:"POST"},query:{method:"GET",isArray:!0},remove:{method:"DELETE"},"delete":{method:"DELETE"}},E=a.noop,s=a.forEach,x=a.extend,G=a.copy,u=a.isFunction;c.prototype={setUrlParams:function(c,g,l){var r=this,e=l||r.template,f,p,h=r.urlParams={};s(e.split(/\W/),function(a){if("hasOwnProperty"===a)throw v("badname");!/^\d+$/.test(a)&&(a&&RegExp("(^|[^\\\\]):"+a+"(\\W|$)").test(e))&&(h[a]=!0)});e=e.replace(/\\:/g,":");g=g||{};s(r.urlParams,function(d,
c){f=g.hasOwnProperty(c)?g[c]:r.defaults[c];a.isDefined(f)&&null!==f?(p=encodeURIComponent(f).replace(/%40/gi,"@").replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"%20").replace(/%26/gi,"&").replace(/%3D/gi,"=").replace(/%2B/gi,"+"),e=e.replace(RegExp(":"+c+"(\\W|$)","g"),function(a,c){return p+c})):e=e.replace(RegExp("(/?):"+c+"(\\W|$)","g"),function(a,c,d){return"/"==d.charAt(0)?d:c+d})});e=e.replace(/\/+$/,"")||"/";e=e.replace(/\/\.(?=\w+($|\?))/,".");c.url=e.replace(/\/\\\./,
"/.");s(g,function(a,e){r.urlParams[e]||(c.params=c.params||{},c.params[e]=a)})}};return t}])})(window,window.angular);
//# sourceMappingURL=angular-resource.min.js.map
;
// Source: src/main/js/lib/angular/v1.2/angular-sanitize.min.js
/*
 AngularJS v1.2.21
 (c) 2010-2014 Google, Inc. http://angularjs.org
 License: MIT
*/
(function(q,g,r){'use strict';function F(a){var d=[];t(d,g.noop).chars(a);return d.join("")}function m(a){var d={};a=a.split(",");var b;for(b=0;b<a.length;b++)d[a[b]]=!0;return d}function G(a,d){function b(a,c,b,h){c=g.lowercase(c);if(u[c])for(;f.last()&&v[f.last()];)e("",f.last());w[c]&&f.last()==c&&e("",c);(h=x[c]||!!h)||f.push(c);var n={};b.replace(H,function(a,c,d,b,e){n[c]=s(d||b||e||"")});d.start&&d.start(c,n,h)}function e(a,c){var b=0,e;if(c=g.lowercase(c))for(b=f.length-1;0<=b&&f[b]!=c;b--);
if(0<=b){for(e=f.length-1;e>=b;e--)d.end&&d.end(f[e]);f.length=b}}var c,l,f=[],n=a,h;for(f.last=function(){return f[f.length-1]};a;){h="";l=!0;if(f.last()&&y[f.last()])a=a.replace(RegExp("(.*)<\\s*\\/\\s*"+f.last()+"[^>]*>","i"),function(c,a){a=a.replace(I,"$1").replace(J,"$1");d.chars&&d.chars(s(a));return""}),e("",f.last());else{if(0===a.indexOf("\x3c!--"))c=a.indexOf("--",4),0<=c&&a.lastIndexOf("--\x3e",c)===c&&(d.comment&&d.comment(a.substring(4,c)),a=a.substring(c+3),l=!1);else if(z.test(a)){if(c=
a.match(z))a=a.replace(c[0],""),l=!1}else if(K.test(a)){if(c=a.match(A))a=a.substring(c[0].length),c[0].replace(A,e),l=!1}else L.test(a)&&((c=a.match(B))?(c[4]&&(a=a.substring(c[0].length),c[0].replace(B,b)),l=!1):(h+="<",a=a.substring(1)));l&&(c=a.indexOf("<"),h+=0>c?a:a.substring(0,c),a=0>c?"":a.substring(c),d.chars&&d.chars(s(h)))}if(a==n)throw M("badparse",a);n=a}e()}function s(a){if(!a)return"";var d=N.exec(a);a=d[1];var b=d[3];if(d=d[2])p.innerHTML=d.replace(/</g,"&lt;"),d="textContent"in p?
p.textContent:p.innerText;return a+d+b}function C(a){return a.replace(/&/g,"&amp;").replace(O,function(a){var b=a.charCodeAt(0);a=a.charCodeAt(1);return"&#"+(1024*(b-55296)+(a-56320)+65536)+";"}).replace(P,function(a){return"&#"+a.charCodeAt(0)+";"}).replace(/</g,"&lt;").replace(/>/g,"&gt;")}function t(a,d){var b=!1,e=g.bind(a,a.push);return{start:function(a,l,f){a=g.lowercase(a);!b&&y[a]&&(b=a);b||!0!==D[a]||(e("<"),e(a),g.forEach(l,function(b,f){var k=g.lowercase(f),l="img"===a&&"src"===k||"background"===
k;!0!==Q[k]||!0===E[k]&&!d(b,l)||(e(" "),e(f),e('="'),e(C(b)),e('"'))}),e(f?"/>":">"))},end:function(a){a=g.lowercase(a);b||!0!==D[a]||(e("</"),e(a),e(">"));a==b&&(b=!1)},chars:function(a){b||e(C(a))}}}var M=g.$$minErr("$sanitize"),B=/^<((?:[a-zA-Z])[\w:-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*(>?)/,A=/^<\/\s*([\w:-]+)[^>]*>/,H=/([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,L=/^</,K=/^<\//,I=/\x3c!--(.*?)--\x3e/g,z=/<!DOCTYPE([^>]*?)>/i,
J=/<!\[CDATA\[(.*?)]]\x3e/g,O=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,P=/([^\#-~| |!])/g,x=m("area,br,col,hr,img,wbr");q=m("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr");r=m("rp,rt");var w=g.extend({},r,q),u=g.extend({},q,m("address,article,aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul")),v=g.extend({},r,m("a,abbr,acronym,b,bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,samp,small,span,strike,strong,sub,sup,time,tt,u,var")),
y=m("script,style"),D=g.extend({},x,u,v,w),E=m("background,cite,href,longdesc,src,usemap"),Q=g.extend({},E,m("abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,scope,scrolling,shape,size,span,start,summary,target,title,type,valign,value,vspace,width")),p=document.createElement("pre"),N=/^(\s*)([\s\S]*?)(\s*)$/;g.module("ngSanitize",[]).provider("$sanitize",
function(){this.$get=["$$sanitizeUri",function(a){return function(d){var b=[];G(d,t(b,function(b,c){return!/^unsafe/.test(a(b,c))}));return b.join("")}}]});g.module("ngSanitize").filter("linky",["$sanitize",function(a){var d=/((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>]/,b=/^mailto:/;return function(e,c){function l(a){a&&k.push(F(a))}function f(a,b){k.push("<a ");g.isDefined(c)&&(k.push('target="'),k.push(c),k.push('" '));k.push('href="');k.push(a);k.push('">');l(b);k.push("</a>")}
if(!e)return e;for(var n,h=e,k=[],m,p;n=h.match(d);)m=n[0],n[2]==n[3]&&(m="mailto:"+m),p=n.index,l(h.substr(0,p)),f(m,n[0].replace(b,"")),h=h.substring(p+n[0].length);l(h);return a(k.join(""))}}])})(window,window.angular);
//# sourceMappingURL=angular-sanitize.min.js.map
;
// Source: src/main/js/lib/angular-scroll.js
/**
 * x is a value between 0 and 1, indicating where in the animation you are.
 */
var duScrollDefaultEasing = function (x) {
if (x < 0.5) {
        return Math.pow(x * 2, 2) / 2;
    }
    return 1 - Math.pow((1 - x) * 2, 2) / 2;
};
angular.module('duScroll', [
    'duScroll.scrollHelpers'
]).value('duScrollDuration', 350).value('duScrollGreedy', false).value('duScrollEasing', duScrollDefaultEasing);
angular.module('duScroll.scrollHelpers', ['duScroll.requestAnimation']).run([
    '$window',
    '$q',
    'cancelAnimation',
    'requestAnimation',
    'duScrollEasing',
    function ($window, $q, cancelAnimation, requestAnimation, duScrollEasing) {
var proto = angular.element.prototype;
        var isDocument = function (el) {
            return typeof HTMLDocument !== 'undefined' && el instanceof HTMLDocument || el.nodeType && el.nodeType === el.DOCUMENT_NODE;
        };
        var isElement = function (el) {
            return typeof HTMLElement !== 'undefined' && el instanceof HTMLElement || el.nodeType && el.nodeType === el.ELEMENT_NODE;
        };
        var unwrap = function (el) {
            return isElement(el) || isDocument(el) ? el : el[0];
        };
        proto.scrollTo = function (left, top, duration, easing) {
            var aliasFn;
            if (angular.isElement(left)) {
                aliasFn = this.scrollToElement;
            } else if (duration) {
                aliasFn = this.scrollToAnimated;
            }
            if (aliasFn) {
                return aliasFn.apply(this, arguments);
            }
            var el = unwrap(this);
            if (isDocument(el)) {
                return $window.scrollTo(left, top);
            }
            el.scrollLeft = left;
            el.scrollTop = top;
        };
        var scrollAnimation, deferred;
        proto.scrollToAnimated = function (left, top, duration, easing) {
            if (duration && !easing) {
                easing = duScrollEasing;
            }
            var startLeft = this.scrollLeft(), startTop = this.scrollTop(), deltaLeft = Math.round(left - startLeft), deltaTop = Math.round(top - startTop);
            var startTime = null;
            var el = this;
            var cancelOnEvents = 'scroll mousedown mousewheel touchmove keydown';
            var cancelScrollAnimation = function ($event) {
                if (!$event || $event.which > 0) {
                    el.unbind(cancelOnEvents, cancelScrollAnimation);
                    cancelAnimation(scrollAnimation);
                    deferred.reject();
                    scrollAnimation = null;
                }
            };
            if (scrollAnimation) {
                cancelScrollAnimation();
            }
            deferred = $q.defer();
            if (!deltaLeft && !deltaTop) {
                deferred.resolve();
                return deferred.promise;
            }
            var animationStep = function (timestamp) {
                if (startTime === null) {
                    startTime = timestamp;
                }
                var progress = timestamp - startTime;
                var percent = progress >= duration ? 1 : easing(progress / duration);
                el.scrollTo(startLeft + Math.ceil(deltaLeft * percent), startTop + Math.ceil(deltaTop * percent));
                if (percent < 1) {
                    scrollAnimation = requestAnimation(animationStep);
                } else {
                    el.unbind(cancelOnEvents, cancelScrollAnimation);
                    scrollAnimation = null;
                    deferred.resolve();
                }
            };
            //Fix random mobile safari bug when scrolling to top by hitting status bar
            el.scrollTo(startLeft, startTop);
            el.bind(cancelOnEvents, cancelScrollAnimation);
            scrollAnimation = requestAnimation(animationStep);
            return deferred.promise;
        };
        proto.scrollToElement = function (target, offset, duration, easing) {
            var el = unwrap(this);
            var top = this.scrollTop() + unwrap(target).getBoundingClientRect().top - (offset || 0);
            if (isElement(el)) {
                top -= el.getBoundingClientRect().top;
            }
            return this.scrollTo(0, top, duration, easing);
        };
        var overloaders = {
            scrollLeft: function (value, duration, easing) {
                if (angular.isNumber(value)) {
                    return this.scrollTo(value, this.scrollTop(), duration, easing);
                }
                var el = unwrap(this);
                if (isDocument(el)) {
                    return $window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;
                }
                return el.scrollLeft;
            },
            scrollTop: function (value, duration, easing) {
                if (angular.isNumber(value)) {
                    return this.scrollTo(this.scrollTop(), value, duration, easing);
                }
                var el = unwrap(this);
                if (isDocument(el)) {
                    return $window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
                }
                return el.scrollTop;
            }
        };
        //Add duration and easing functionality to existing jQuery getter/setters
        var overloadScrollPos = function (superFn, overloadFn) {
            return function (value, duration, easing) {
                if (duration) {
                    return overloadFn.apply(this, arguments);
                }
                return superFn.apply(this, arguments);
            };
        };
        for (var methodName in overloaders) {
            proto[methodName] = proto[methodName] ? overloadScrollPos(proto[methodName], overloaders[methodName]) : overloaders[methodName];
        }
    }
]);
//Adapted from https://gist.github.com/paulirish/1579671
angular.module('duScroll.polyfill', []).factory('polyfill', [
    '$window',
    function ($window) {
var vendors = [
            'webkit',
            'moz',
            'o',
            'ms'
        ];
        return function (fnName, fallback) {
            if ($window[fnName]) {
                return $window[fnName];
            }
            var suffix = fnName.substr(0, 1).toUpperCase() + fnName.substr(1);
            for (var key, i = 0; i < vendors.length; i++) {
                key = vendors[i] + suffix;
                if ($window[key]) {
                    return $window[key];
                }
            }
            return fallback;
        };
    }
]);
angular.module('duScroll.requestAnimation', ['duScroll.polyfill']).factory('requestAnimation', [
    'polyfill',
    '$timeout',
    function (polyfill, $timeout) {
var lastTime = 0;
        var fallback = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = $timeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        return polyfill('requestAnimationFrame', fallback);
    }
]).factory('cancelAnimation', [
    'polyfill',
    '$timeout',
    function (polyfill, $timeout) {
var fallback = function (promise) {
            $timeout.cancel(promise);
        };
        return polyfill('cancelAnimationFrame', fallback);
    }
]);
;
// Source: src/main/js/lib/fastclick.js
/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 1.0.1
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
function FastClick(layer, options) {
var oldOnClick;

    options = options || {};

    /**
     * Whether a click is currently being tracked.
     *
     * @type boolean
     */
    this.trackingClick = false;


    /**
     * Timestamp for when click tracking started.
     *
     * @type number
     */
    this.trackingClickStart = 0;


    /**
     * The element being tracked for a click.
     *
     * @type EventTarget
     */
    this.targetElement = null;


    /**
     * X-coordinate of touch start event.
     *
     * @type number
     */
    this.touchStartX = 0;


    /**
     * Y-coordinate of touch start event.
     *
     * @type number
     */
    this.touchStartY = 0;


    /**
     * ID of the last touch, retrieved from Touch.identifier.
     *
     * @type number
     */
    this.lastTouchIdentifier = 0;


    /**
     * Touchmove boundary, beyond which a click will be cancelled.
     *
     * @type number
     */
    this.touchBoundary = options.touchBoundary || 10;


    /**
     * The FastClick layer.
     *
     * @type Element
     */
    this.layer = layer;

    /**
     * The minimum time between tap(touchstart and touchend) events
     *
     * @type number
     */
    this.tapDelay = options.tapDelay || 200;

    if (FastClick.notNeeded(layer)) {
        return;
    }

    // Some old versions of Android don't have Function.prototype.bind
    function bind(method, context) {
        return function() { return method.apply(context, arguments); };
    }


    var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
    var context = this;
    for (var i = 0, l = methods.length; i < l; i++) {
        context[methods[i]] = bind(context[methods[i]], context);
    }

    // Set up event handlers as required
    if (deviceIsAndroid) {
        layer.addEventListener('mouseover', this.onMouse, true);
        layer.addEventListener('mousedown', this.onMouse, true);
        layer.addEventListener('mouseup', this.onMouse, true);
    }

    layer.addEventListener('click', this.onClick, true);
    layer.addEventListener('touchstart', this.onTouchStart, false);
    layer.addEventListener('touchmove', this.onTouchMove, false);
    layer.addEventListener('touchend', this.onTouchEnd, false);
    layer.addEventListener('touchcancel', this.onTouchCancel, false);

    // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
    // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
    // layer when they are cancelled.
    if (!Event.prototype.stopImmediatePropagation) {
        layer.removeEventListener = function(type, callback, capture) {
            var rmv = Node.prototype.removeEventListener;
            if (type === 'click') {
                rmv.call(layer, type, callback.hijacked || callback, capture);
            } else {
                rmv.call(layer, type, callback, capture);
            }
        };

        layer.addEventListener = function(type, callback, capture) {
            var adv = Node.prototype.addEventListener;
            if (type === 'click') {
                adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
                    if (!event.propagationStopped) {
                        callback(event);
                    }
                }), capture);
            } else {
                adv.call(layer, type, callback, capture);
            }
        };
    }

    // If a handler is already declared in the element's onclick attribute, it will be fired before
    // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
    // adding it as listener.
    if (typeof layer.onclick === 'function') {

        // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
        // - the old one won't work if passed to addEventListener directly.
        oldOnClick = layer.onclick;
        layer.addEventListener('click', function(event) {
            oldOnClick(event);
        }, false);
        layer.onclick = null;
    }
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
switch (target.nodeName.toLowerCase()) {

    // Don't send a synthetic click to disabled inputs (issue #62)
    case 'button':
    case 'select':
    case 'textarea':
        if (target.disabled) {
            return true;
        }

        break;
    case 'input':

        // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
        if ((deviceIsIOS && target.type === 'file') || target.disabled) {
            return true;
        }

        break;
    case 'label':
    case 'video':
        return true;
    }

    return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
switch (target.nodeName.toLowerCase()) {
    case 'textarea':
        return true;
    case 'select':
        return !deviceIsAndroid;
    case 'input':
        switch (target.type) {
        case 'button':
        case 'checkbox':
        case 'file':
        case 'image':
        case 'radio':
        case 'submit':
            return false;
        }

        // No point in attempting to focus disabled inputs
        return !target.disabled && !target.readOnly;
    default:
        return (/\bneedsfocus\b/).test(target.className);
    }
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
var clickEvent, touch;

    // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
    if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur();
    }

    touch = event.changedTouches[0];

    // Synthesise a click event, with an extra attribute so it can be tracked
    clickEvent = document.createEvent('MouseEvents');
    clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    clickEvent.forwardedTouchEvent = true;
    targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
//Issue #159: Android Chrome Select Box does not open with a synthetic click event
    if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
        return 'mousedown';
    }

    return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
var length;

    // Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
    if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
        length = targetElement.value.length;
        targetElement.setSelectionRange(length, length);
    } else {
        targetElement.focus();
    }
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
var scrollParent, parentElement;

    scrollParent = targetElement.fastClickScrollParent;

    // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
    // target element was moved to another parent.
    if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
            if (parentElement.scrollHeight > parentElement.offsetHeight) {
                scrollParent = parentElement;
                targetElement.fastClickScrollParent = parentElement;
                break;
            }

            parentElement = parentElement.parentElement;
        } while (parentElement);
    }

    // Always update the scroll top tracker if possible.
    if (scrollParent) {
        scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
    }
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
    if (eventTarget.nodeType === Node.TEXT_NODE) {
        return eventTarget.parentNode;
    }

    return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
var targetElement, touch, selection;

    // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
    if (event.targetTouches.length > 1) {
        return true;
    }

    targetElement = this.getTargetElementFromEventTarget(event.target);
    touch = event.targetTouches[0];

    if (deviceIsIOS) {

        // Only trusted events will deselect text on iOS (issue #49)
        selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
            return true;
        }

        if (!deviceIsIOS4) {

            // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
            // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
            // with the same identifier as the touch event that previously triggered the click that triggered the alert.
            // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
            // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
            if (touch.identifier === this.lastTouchIdentifier) {
                event.preventDefault();
                return false;
            }

            this.lastTouchIdentifier = touch.identifier;

            // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
            // 1) the user does a fling scroll on the scrollable layer
            // 2) the user stops the fling scroll with another tap
            // then the event.target of the last 'touchend' event will be the element that was under the user's finger
            // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
            // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
            this.updateScrollParent(targetElement);
        }
    }

    this.trackingClick = true;
    this.trackingClickStart = event.timeStamp;
    this.targetElement = targetElement;

    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        event.preventDefault();
    }

    return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
var touch = event.changedTouches[0], boundary = this.touchBoundary;

    if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true;
    }

    return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
if (!this.trackingClick) {
        return true;
    }

    // If the touch has moved, cancel the click tracking
    if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null;
    }

    return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
// Fast path for newer browsers supporting the HTML5 control attribute
    if (labelElement.control !== undefined) {
        return labelElement.control;
    }

    // All browsers under test that support touch events also support the HTML5 htmlFor attribute
    if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor);
    }

    // If no for attribute exists, attempt to retrieve the first labellable descendant element
    // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
    return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

    if (!this.trackingClick) {
        return true;
    }

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        this.cancelNextClick = true;
        return true;
    }

    // Reset to prevent wrong click cancel on input (issue #156).
    this.cancelNextClick = false;

    this.lastClickTime = event.timeStamp;

    trackingClickStart = this.trackingClickStart;
    this.trackingClick = false;
    this.trackingClickStart = 0;

    // On some iOS devices, the targetElement supplied with the event is invalid if the layer
    // is performing a transition or scroll, and has to be re-detected manually. Note that
    // for this to function correctly, it must be called *after* the event target is checked!
    // See issue #57; also filed as rdar://13048589 .
    if (deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];

        // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
    }

    targetTagName = targetElement.tagName.toLowerCase();
    if (targetTagName === 'label') {
        forElement = this.findControl(targetElement);
        if (forElement) {
            this.focus(targetElement);
            if (deviceIsAndroid) {
                return false;
            }

            targetElement = forElement;
        }
    } else if (this.needsFocus(targetElement)) {

        // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
        // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
        if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
            this.targetElement = null;
            return false;
        }

        this.focus(targetElement);
        this.sendClick(targetElement, event);

        // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
        // Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
        if (!deviceIsIOS || targetTagName !== 'select') {
            this.targetElement = null;
            event.preventDefault();
        }

        return false;
    }

    if (deviceIsIOS && !deviceIsIOS4) {

        // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
        // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
        scrollParent = targetElement.fastClickScrollParent;
        if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
            return true;
        }
    }

    // Prevent the actual click from going though - unless the target node is marked as requiring
    // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
    if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event);
    }

    return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
this.trackingClick = false;
    this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
// If a target element was never set (because a touch event was never fired) allow the event
    if (!this.targetElement) {
        return true;
    }

    if (event.forwardedTouchEvent) {
        return true;
    }

    // Programmatically generated events targeting a specific element should be permitted
    if (!event.cancelable) {
        return true;
    }

    // Derive and check the target element to see whether the mouse event needs to be permitted;
    // unless explicitly enabled, prevent non-touch click events from triggering actions,
    // to prevent ghost/doubleclicks.
    if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

        // Prevent any user-added listeners declared on FastClick element from being fired.
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        } else {

            // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
            event.propagationStopped = true;
        }

        // Cancel the event
        event.stopPropagation();
        event.preventDefault();

        return false;
    }

    // If the mouse event is permitted, return true for the action to go through.
    return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
var permitted;

    // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
    if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true;
    }

    // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
    if (event.target.type === 'submit' && event.detail === 0) {
        return true;
    }

    permitted = this.onMouse(event);

    // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
    if (!permitted) {
        this.targetElement = null;
    }

    // If clicks are permitted, return true for the action to go through.
    return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
var layer = this.layer;

    if (deviceIsAndroid) {
        layer.removeEventListener('mouseover', this.onMouse, true);
        layer.removeEventListener('mousedown', this.onMouse, true);
        layer.removeEventListener('mouseup', this.onMouse, true);
    }

    layer.removeEventListener('click', this.onClick, true);
    layer.removeEventListener('touchstart', this.onTouchStart, false);
    layer.removeEventListener('touchmove', this.onTouchMove, false);
    layer.removeEventListener('touchend', this.onTouchEnd, false);
    layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
var metaViewport;
    var chromeVersion;

    // Devices that don't support touch don't need FastClick
    if (typeof window.ontouchstart === 'undefined') {
        return true;
    }

    // Chrome version - zero for other browsers
    chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

    if (chromeVersion) {

        if (deviceIsAndroid) {
            metaViewport = document.querySelector('meta[name=viewport]');

            if (metaViewport) {
                // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
                if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                    return true;
                }
                // Chrome 32 and above with width=device-width or less don't need FastClick
                if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
                    return true;
                }
            }

        // Chrome desktop doesn't need FastClick (issue #15)
        } else {
            return true;
        }
    }

    // IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
    if (layer.style.msTouchAction === 'none') {
        return true;
    }

    return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
FastClick.attach = function(layer, options) {
return new FastClick(layer, options);
};


if (typeof define !== 'undefined' && define.amd) {

    // AMD. Register as an anonymous module.
    define(function() {
return FastClick;
    });
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = FastClick.attach;
    module.exports.FastClick = FastClick;
} else {
    window.FastClick = FastClick;
};
// Source: src/main/js/app/config/config.js
angular.module( 'config', [] )

    .constant( "API_KEY", appConfig.apiKey )
    .constant( 'CHECKSUM_STORE', (typeof checksumStore) !== 'undefined' ? checksumStore : null );
;
// Source: src/main/js/lib/ng-map.js
/*! angular-google-maps 1.1.4 2014-06-19
 *  AngularJS directives for Google Maps
 *  git: https://github.com/nlaplante/angular-google-maps.git
 */
/*
 !
 The MIT License

 Copyright (c) 2010-2013 Google, Inc. http://angularjs.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 angular-google-maps
 https://github.com/nlaplante/angular-google-maps

 @authors
 Nicolas Laplante - https://plus.google.com/108189012221374960701
 Nicholas McCready - https://twitter.com/nmccready
 */


(function() {
    angular.module("google-maps.directives.api.utils", []);

    angular.module("google-maps.directives.api.managers", []);

    angular.module("google-maps.directives.api.models.child", ["google-maps.directives.api.utils"]);

    angular.module("google-maps.directives.api.models.parent", ["google-maps.directives.api.managers", "google-maps.directives.api.models.child"]);

    angular.module("google-maps.directives.api", ["google-maps.directives.api.models.parent"]);

    angular.module("google-maps", ["google-maps.directives.api"]).factory("debounce", [
        "$timeout", function($timeout) {
            return function(fn) {
                var nthCall;
                nthCall = 0;
                return function() {
                    var argz, later, that;
                    that = this;
                    argz = arguments;
                    nthCall++;
                    later = (function(version) {
                        return function() {
                            if (version === nthCall) {
                                return fn.apply(that, argz);
                            }
                        };
                    })(nthCall);
                    return $timeout(later, 0, true);
                };
            };
        }
    ]);

}).call(this);

(function() {
    angular.element(document).ready(function() {
        if (!(google || (typeof google !== "undefined" && google !== null ? google.maps : void 0) || (google.maps.InfoWindow != null))) {
            return;
        }
        google.maps.InfoWindow.prototype._open = google.maps.InfoWindow.prototype.open;
        google.maps.InfoWindow.prototype._close = google.maps.InfoWindow.prototype.close;
        google.maps.InfoWindow.prototype._isOpen = false;
        google.maps.InfoWindow.prototype.open = function(map, anchor) {
            this._isOpen = true;
            this._open(map, anchor);
        };
        google.maps.InfoWindow.prototype.close = function() {
            this._isOpen = false;
            this._close();
        };
        google.maps.InfoWindow.prototype.isOpen = function(val) {
            if (val == null) {
                val = void 0;
            }
            if (val == null) {
                return this._isOpen;
            } else {
                return this._isOpen = val;
            }
        };
        /*
         Do the same for InfoBox
         TODO: Clean this up so the logic is defined once, wait until develop becomes master as this will be easier
         */

        if (!window.InfoBox) {
            return;
        }
        window.InfoBox.prototype._open = window.InfoBox.prototype.open;
        window.InfoBox.prototype._close = window.InfoBox.prototype.close;
        window.InfoBox.prototype._isOpen = false;
        window.InfoBox.prototype.open = function(map, anchor) {
            this._isOpen = true;
            this._open(map, anchor);
        };
        window.InfoBox.prototype.close = function() {
            this._isOpen = false;
            this._close();
        };
        return window.InfoBox.prototype.isOpen = function(val) {
            if (val == null) {
                val = void 0;
            }
            if (val == null) {
                return this._isOpen;
            } else {
                return this._isOpen = val;
            }
        };
    });

}).call(this);

/*
 Author Nick McCready
 Intersection of Objects if the arrays have something in common each intersecting object will be returned
 in an new array.
 */


(function() {
    _.intersectionObjects = function(array1, array2, comparison) {
        var res,
            _this = this;
        if (comparison == null) {
            comparison = void 0;
        }
        res = _.map(array1, function(obj1) {
            return _.find(array2, function(obj2) {
                if (comparison != null) {
                    return comparison(obj1, obj2);
                } else {
                    return _.isEqual(obj1, obj2);
                }
            });
        });
        return _.filter(res, function(o) {
            return o != null;
        });
    };

    _.containsObject = _.includeObject = function(obj, target, comparison) {
        var _this = this;
        if (comparison == null) {
            comparison = void 0;
        }
        if (obj === null) {
            return false;
        }
        return _.any(obj, function(value) {
            if (comparison != null) {
                return comparison(value, target);
            } else {
                return _.isEqual(value, target);
            }
        });
    };

    _.differenceObjects = function(array1, array2, comparison) {
        if (comparison == null) {
            comparison = void 0;
        }
        return _.filter(array1, function(value) {
            return !_.containsObject(array2, value);
        });
    };

    _.withoutObjects = function(array, array2) {
        return _.differenceObjects(array, array2);
    };

    _.indexOfObject = function(array, item, comparison, isSorted) {
        var i, length;
        if (array == null) {
            return -1;
        }
        i = 0;
        length = array.length;
        if (isSorted) {
            if (typeof isSorted === "number") {
                i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
            } else {
                i = _.sortedIndex(array, item);
                return (array[i] === item ? i : -1);
            }
        }
        while (i < length) {
            if (comparison != null) {
                if (comparison(array[i], item)) {
                    return i;
                }
            } else {
                if (_.isEqual(array[i], item)) {
                    return i;
                }
            }
            i++;
        }
        return -1;
    };

    _["extends"] = function(arrayOfObjectsToCombine) {
        return _.reduce(arrayOfObjectsToCombine, function(combined, toAdd) {
            return _.extend(combined, toAdd);
        }, {});
    };

}).call(this);

/*
 Author: Nicholas McCready & jfriend00
 _async handles things asynchronous-like :), to allow the UI to be free'd to do other things
 Code taken from http://stackoverflow.com/questions/10344498/best-way-to-iterate-over-an-array-without-blocking-the-ui

 The design of any funcitonality of _async is to be like lodash/underscore and replicate it but call things
 asynchronously underneath. Each should be sufficient for most things to be derrived from.

 TODO: Handle Object iteration like underscore and lodash as well.. not that important right now
 */


(function() {
    var async;

    async = {
        each: function(array, callback, doneCallBack, pausedCallBack, chunk, index, pause) {
            var doChunk;
            if (chunk == null) {
                chunk = 20;
            }
            if (index == null) {
                index = 0;
            }
            if (pause == null) {
                pause = 1;
            }
            if (!pause) {
                throw "pause (delay) must be set from _async!";
                return;
            }
            if (array === void 0 || (array != null ? array.length : void 0) <= 0) {
                doneCallBack();
                return;
            }
            doChunk = function() {
                var cnt, i;
                cnt = chunk;
                i = index;
                while (cnt-- && i < (array ? array.length : i + 1)) {
                    callback(array[i], i);
                    ++i;
                }
                if (array) {
                    if (i < array.length) {
                        index = i;
                        if (pausedCallBack != null) {
                            pausedCallBack();
                        }
                        return setTimeout(doChunk, pause);
                    } else {
                        if (doneCallBack) {
                            return doneCallBack();
                        }
                    }
                }
            };
            return doChunk();
        },
        map: function(objs, iterator, doneCallBack, pausedCallBack, chunk) {
            var results;
            results = [];
            if (objs == null) {
                return results;
            }
            return _async.each(objs, function(o) {
                return results.push(iterator(o));
            }, function() {
                return doneCallBack(results);
            }, pausedCallBack, chunk);
        }
    };

    window._async = async;

    angular.module("google-maps.directives.api.utils").factory("async", function() {
        return window._async;
    });

}).call(this);

(function() {
    var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

    angular.module("google-maps.directives.api.utils").factory("BaseObject", function() {
        var BaseObject, baseObjectKeywords;
        baseObjectKeywords = ['extended', 'included'];
        BaseObject = (function() {
            function BaseObject() {}

            BaseObject.extend = function(obj) {
                var key, value, _ref;
                for (key in obj) {
                    value = obj[key];
                    if (__indexOf.call(baseObjectKeywords, key) < 0) {
                        this[key] = value;
                    }
                }
                if ((_ref = obj.extended) != null) {
                    _ref.apply(this);
                }
                return this;
            };

            BaseObject.include = function(obj) {
                var key, value, _ref;
                for (key in obj) {
                    value = obj[key];
                    if (__indexOf.call(baseObjectKeywords, key) < 0) {
                        this.prototype[key] = value;
                    }
                }
                if ((_ref = obj.included) != null) {
                    _ref.apply(this);
                }
                return this;
            };

            return BaseObject;

        })();
        return BaseObject;
    });

}).call(this);

/*
 Useful function callbacks that should be defined at later time.
 Mainly to be used for specs to verify creation / linking.

 This is to lead a common design in notifying child stuff.
 */


(function() {
    angular.module("google-maps.directives.api.utils").factory("ChildEvents", function() {
        return {
            onChildCreation: function(child) {}
        };
    });

}).call(this);

(function() {
    angular.module("google-maps.directives.api.utils").service("EventsHelper", [
        "Logger", function($log) {
            return {
                setEvents: function(marker, scope, model) {
                    if (angular.isDefined(scope.events) && (scope.events != null) && angular.isObject(scope.events)) {
                        return _.compact(_.map(scope.events, function(eventHandler, eventName) {
                            if (scope.events.hasOwnProperty(eventName) && angular.isFunction(scope.events[eventName])) {
                                return google.maps.event.addListener(marker, eventName, function() {
                                    return eventHandler.apply(scope, [marker, eventName, model, arguments]);
                                });
                            } else {
                                return $log.info("MarkerEventHelper: invalid event listener " + eventName);
                            }
                        }));
                    }
                }
            };
        }
    ]);

}).call(this);

(function() {
    var __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.utils").factory("FitHelper", [
        "BaseObject", "Logger", function(BaseObject, $log) {
            var FitHelper, _ref;
            return FitHelper = (function(_super) {
                __extends(FitHelper, _super);

                function FitHelper() {
                    _ref = FitHelper.__super__.constructor.apply(this, arguments);
                    return _ref;
                }

                FitHelper.prototype.fit = function(gMarkers, gMap) {
                    var bounds, everSet,
                        _this = this;
                    if (gMap && gMarkers && gMarkers.length > 0) {
                        bounds = new google.maps.LatLngBounds();
                        everSet = false;
                        return _async.each(gMarkers, function(gMarker) {
                            if (gMarker) {
                                if (!everSet) {
                                    everSet = true;
                                }
                                return bounds.extend(gMarker.getPosition());
                            }
                        }, function() {
                            if (everSet) {
                                return gMap.fitBounds(bounds);
                            }
                        });
                    }
                };

                return FitHelper;

            })(BaseObject);
        }
    ]);

}).call(this);

(function() {
    angular.module("google-maps.directives.api.utils").service("GmapUtil", [
        "Logger", "$compile", function(Logger, $compile) {
            var getCoords, validateCoords;
            getCoords = function(value) {
                if (Array.isArray(value) && value.length === 2) {
                    return new google.maps.LatLng(value[1], value[0]);
                } else if (angular.isDefined(value.type) && value.type === "Point") {
                    return new google.maps.LatLng(value.coordinates[1], value.coordinates[0]);
                } else {
                    return new google.maps.LatLng(value.latitude, value.longitude);
                }
            };
            validateCoords = function(coords) {
                if (angular.isUndefined(coords)) {
                    return false;
                }
                if (_.isArray(coords)) {
                    if (coords.length === 2) {
                        return true;
                    }
                } else if ((coords != null) && (coords != null ? coords.type : void 0)) {
                    if (coords.type === "Point" && _.isArray(coords.coordinates) && coords.coordinates.length === 2) {
                        return true;
                    }
                }
                if (coords && angular.isDefined((coords != null ? coords.latitude : void 0) && angular.isDefined(coords != null ? coords.longitude : void 0))) {
                    return true;
                }
                return false;
            };
            return {
                getLabelPositionPoint: function(anchor) {
                    var xPos, yPos;
                    if (anchor === void 0) {
                        return void 0;
                    }
                    anchor = /^([-\d\.]+)\s([-\d\.]+)$/.exec(anchor);
                    xPos = parseFloat(anchor[1]);
                    yPos = parseFloat(anchor[2]);
                    if ((xPos != null) && (yPos != null)) {
                        return new google.maps.Point(xPos, yPos);
                    }
                },
                createMarkerOptions: function(coords, icon, defaults, map) {
                    var opts;
                    if (map == null) {
                        map = void 0;
                    }
                    if (defaults == null) {
                        defaults = {};
                    }
                    opts = angular.extend({}, defaults, {
                        position: defaults.position != null ? defaults.position : getCoords(coords),
                        icon: defaults.icon != null ? defaults.icon : icon,
                        visible: defaults.visible != null ? defaults.visible : validateCoords(coords)
                    });
                    if (map != null) {
                        opts.map = map;
                    }
                    return opts;
                },
                createWindowOptions: function(gMarker, scope, content, defaults) {
                    if ((content != null) && (defaults != null) && ($compile != null)) {
                        return angular.extend({}, defaults, {
                            content: this.buildContent(scope, defaults, content),
                            position: defaults.position != null ? defaults.position : angular.isObject(gMarker) ? gMarker.getPosition() : getCoords(scope.coords)
                        });
                    } else {
                        if (!defaults) {
                            Logger.error("infoWindow defaults not defined");
                            if (!content) {
                                return Logger.error("infoWindow content not defined");
                            }
                        } else {
                            return defaults;
                        }
                    }
                },
                buildContent: function(scope, defaults, content) {
                    var parsed, ret;
                    if (defaults.content != null) {
                        ret = defaults.content;
                    } else {
                        if ($compile != null) {
                            parsed = $compile(content)(scope);
                            if (parsed.length > 0) {
                                ret = parsed[0];
                            }
                        } else {
                            ret = content;
                        }
                    }
                    return ret;
                },
                defaultDelay: 50,
                isTrue: function(val) {
                    return angular.isDefined(val) && val !== null && val === true || val === "1" || val === "y" || val === "true";
                },
                isFalse: function(value) {
                    return ['false', 'FALSE', 0, 'n', 'N', 'no', 'NO'].indexOf(value) !== -1;
                },
                getCoords: getCoords,
                validateCoords: validateCoords,
                validatePath: function(path) {
                    var array, i, polygon, trackMaxVertices;
                    i = 0;
                    if (angular.isUndefined(path.type)) {
                        if (!Array.isArray(path) || path.length < 2) {
                            return false;
                        }
                        while (i < path.length) {
                            if (!((angular.isDefined(path[i].latitude) && angular.isDefined(path[i].longitude)) || (typeof path[i].lat === "function" && typeof path[i].lng === "function"))) {
                                return false;
                            }
                            i++;
                        }
                        return true;
                    } else {
                        if (angular.isUndefined(path.coordinates)) {
                            return false;
                        }
                        if (path.type === "Polygon") {
                            if (path.coordinates[0].length < 4) {
                                return false;
                            }
                            array = path.coordinates[0];
                        } else if (path.type === "MultiPolygon") {
                            trackMaxVertices = {
                                max: 0,
                                index: 0
                            };
                            _.forEach(path.coordinates, function(polygon, index) {
                                if (polygon[0].length > this.max) {
                                    this.max = polygon[0].length;
                                    return this.index = index;
                                }
                            }, trackMaxVertices);
                            polygon = path.coordinates[trackMaxVertices.index];
                            array = polygon[0];
                            if (array.length < 4) {
                                return false;
                            }
                        } else if (path.type === "LineString") {
                            if (path.coordinates.length < 2) {
                                return false;
                            }
                            array = path.coordinates;
                        } else {
                            return false;
                        }
                        while (i < array.length) {
                            if (array[i].length !== 2) {
                                return false;
                            }
                            i++;
                        }
                        return true;
                    }
                },
                convertPathPoints: function(path) {
                    var array, i, latlng, result, trackMaxVertices;
                    i = 0;
                    result = new google.maps.MVCArray();
                    if (angular.isUndefined(path.type)) {
                        while (i < path.length) {
                            latlng;
                            if (angular.isDefined(path[i].latitude) && angular.isDefined(path[i].longitude)) {
                                latlng = new google.maps.LatLng(path[i].latitude, path[i].longitude);
                            } else if (typeof path[i].lat === "function" && typeof path[i].lng === "function") {
                                latlng = path[i];
                            }
                            result.push(latlng);
                            i++;
                        }
                    } else {
                        array;
                        if (path.type === "Polygon") {
                            array = path.coordinates[0];
                        } else if (path.type === "MultiPolygon") {
                            trackMaxVertices = {
                                max: 0,
                                index: 0
                            };
                            _.forEach(path.coordinates, function(polygon, index) {
                                if (polygon[0].length > this.max) {
                                    this.max = polygon[0].length;
                                    return this.index = index;
                                }
                            }, trackMaxVertices);
                            array = path.coordinates[trackMaxVertices.index][0];
                        } else if (path.type === "LineString") {
                            array = path.coordinates;
                        }
                        while (i < array.length) {
                            result.push(new google.maps.LatLng(array[i][1], array[i][0]));
                            i++;
                        }
                    }
                    return result;
                },
                extendMapBounds: function(map, points) {
                    var bounds, i;
                    bounds = new google.maps.LatLngBounds();
                    i = 0;
                    while (i < points.length) {
                        bounds.extend(points.getAt(i));
                        i++;
                    }
                    return map.fitBounds(bounds);
                }
            };
        }
    ]);

}).call(this);

(function() {
    var __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.utils").factory("Linked", [
        "BaseObject", function(BaseObject) {
            var Linked;
            Linked = (function(_super) {
                __extends(Linked, _super);

                function Linked(scope, element, attrs, ctrls) {
                    this.scope = scope;
                    this.element = element;
                    this.attrs = attrs;
                    this.ctrls = ctrls;
                }

                return Linked;

            })(BaseObject);
            return Linked;
        }
    ]);

}).call(this);

(function() {
    angular.module("google-maps.directives.api.utils").service("Logger", [
        "$log", function($log) {
            return {
                logger: $log,
                doLog: false,
                info: function(msg) {
                    if (this.doLog) {
                        if (this.logger != null) {
                            return this.logger.info(msg);
                        } else {
                            return console.info(msg);
                        }
                    }
                },
                error: function(msg) {
                    if (this.doLog) {
                        if (this.logger != null) {
                            return this.logger.error(msg);
                        } else {
                            return console.error(msg);
                        }
                    }
                },
                warn: function(msg) {
                    if (this.doLog) {
                        if (this.logger != null) {
                            return this.logger.warn(msg);
                        } else {
                            return console.warn(msg);
                        }
                    }
                }
            };
        }
    ]);

}).call(this);

(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.utils").factory("ModelKey", [
        "BaseObject", function(BaseObject) {
            var ModelKey;
            return ModelKey = (function(_super) {
                __extends(ModelKey, _super);

                function ModelKey(scope) {
                    this.scope = scope;
                    this.setIdKey = __bind(this.setIdKey, this);
                    this.modelKeyComparison = __bind(this.modelKeyComparison, this);
                    ModelKey.__super__.constructor.call(this);
                    this.defaultIdKey = "id";
                    this.idKey = void 0;
                }

                ModelKey.prototype.evalModelHandle = function(model, modelKey) {
                    if (model === void 0) {
                        return void 0;
                    }
                    if (modelKey === 'self') {
                        return model;
                    } else {
                        return model[modelKey];
                    }
                };

                ModelKey.prototype.modelKeyComparison = function(model1, model2) {
                    var scope;
                    scope = this.scope.coords != null ? this.scope : this.parentScope;
                    if (scope == null) {
                        throw "No scope or parentScope set!";
                    }
                    return this.evalModelHandle(model1, scope.coords).latitude === this.evalModelHandle(model2, scope.coords).latitude && this.evalModelHandle(model1, scope.coords).longitude === this.evalModelHandle(model2, scope.coords).longitude;
                };

                ModelKey.prototype.setIdKey = function(scope) {
                    return this.idKey = scope.idKey != null ? scope.idKey : this.defaultIdKey;
                };

                return ModelKey;

            })(BaseObject);
        }
    ]);

}).call(this);

(function() {
    angular.module("google-maps.directives.api.utils").factory("ModelsWatcher", [
        "Logger", function(Logger) {
            return {
                figureOutState: function(idKey, scope, childObjects, comparison, callBack) {
                    var adds, mappedScopeModelIds, removals,
                        _this = this;
                    adds = [];
                    mappedScopeModelIds = {};
                    removals = [];
                    return _async.each(scope.models, function(m) {
                        var child;
                        if (m[idKey] != null) {
                            mappedScopeModelIds[m[idKey]] = {};
                            if (childObjects[m[idKey]] == null) {
                                return adds.push(m);
                            } else {
                                child = childObjects[m[idKey]];
                                if (!comparison(m, child.model)) {
                                    adds.push(m);
                                    return removals.push(child.model);
                                }
                            }
                        } else {
                            return Logger.error("id missing for model " + (m.toString()) + ", can not use do comparison/insertion");
                        }
                    }, function() {
                        return _async.each(childObjects.values(), function(c) {
                            var id;
                            if (c == null) {
                                Logger.error("child undefined in ModelsWatcher.");
                                return;
                            }
                            if (c.model == null) {
                                Logger.error("child.model undefined in ModelsWatcher.");
                                return;
                            }
                            id = c.model[idKey];
                            if (mappedScopeModelIds[id] == null) {
                                return removals.push(c.model[idKey]);
                            }
                        }, function() {
                            return callBack({
                                adds: adds,
                                removals: removals
                            });
                        });
                    });
                }
            };
        }
    ]);

}).call(this);

/*
 Simple Object Map with a lenght property to make it easy to track length/size
 */


(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    angular.module("google-maps.directives.api.utils").factory("PropMap", function() {
        var PropMap, propsToPop;
        propsToPop = ['get', 'put', 'remove', 'values', 'keys', 'length'];
        PropMap = (function() {
            function PropMap() {
                this.keys = __bind(this.keys, this);
                this.values = __bind(this.values, this);
                this.remove = __bind(this.remove, this);
                this.put = __bind(this.put, this);
                this.get = __bind(this.get, this);
                this.length = 0;
            }

            PropMap.prototype.get = function(key) {
                return this[key];
            };

            PropMap.prototype.put = function(key, value) {
                if (this[key] == null) {
                    this.length++;
                }
                return this[key] = value;
            };

            PropMap.prototype.remove = function(key) {
                delete this[key];
                return this.length--;
            };

            PropMap.prototype.values = function() {
                var all, keys,
                    _this = this;
                all = [];
                keys = _.keys(this);
                _.each(keys, function(value) {
                    if (_.indexOf(propsToPop, value) === -1) {
                        return all.push(_this[value]);
                    }
                });
                return all;
            };

            PropMap.prototype.keys = function() {
                var all, keys,
                    _this = this;
                keys = _.keys(this);
                all = [];
                _.each(keys, function(prop) {
                    if (_.indexOf(propsToPop, prop) === -1) {
                        return all.push(prop);
                    }
                });
                return all;
            };

            return PropMap;

        })();
        return PropMap;
    });

}).call(this);

(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.managers").factory("MarkerManager", [
        "Logger", "FitHelper", function(Logger, FitHelper) {
            var MarkerManager;
            MarkerManager = (function(_super) {
                __extends(MarkerManager, _super);

                MarkerManager.include(FitHelper);

                function MarkerManager(gMap, opt_markers, opt_options) {
                    this.fit = __bind(this.fit, this);
                    this.handleOptDraw = __bind(this.handleOptDraw, this);
                    this.clear = __bind(this.clear, this);
                    this.draw = __bind(this.draw, this);
                    this.removeMany = __bind(this.removeMany, this);
                    this.remove = __bind(this.remove, this);
                    this.addMany = __bind(this.addMany, this);
                    this.add = __bind(this.add, this);
                    var self;
                    MarkerManager.__super__.constructor.call(this);
                    self = this;
                    this.gMap = gMap;
                    this.gMarkers = [];
                    this.$log = Logger;
                    this.$log.info(this);
                }

                MarkerManager.prototype.add = function(gMarker, optDraw) {
                    this.handleOptDraw(gMarker, optDraw, true);
                    return this.gMarkers.push(gMarker);
                };

                MarkerManager.prototype.addMany = function(gMarkers) {
                    var gMarker, _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = gMarkers.length; _i < _len; _i++) {
                        gMarker = gMarkers[_i];
                        _results.push(this.add(gMarker));
                    }
                    return _results;
                };

                MarkerManager.prototype.remove = function(gMarker, optDraw) {
                    var index, tempIndex;
                    this.handleOptDraw(gMarker, optDraw, false);
                    if (!optDraw) {
                        return;
                    }
                    index = void 0;
                    if (this.gMarkers.indexOf != null) {
                        index = this.gMarkers.indexOf(gMarker);
                    } else {
                        tempIndex = 0;
                        _.find(this.gMarkers, function(marker) {
                            tempIndex += 1;
                            if (marker === gMarker) {
                                index = tempIndex;
                            }
                        });
                    }
                    if (index != null) {
                        return this.gMarkers.splice(index, 1);
                    }
                };

                MarkerManager.prototype.removeMany = function(gMarkers) {
                    var _this = this;
                    return this.gMarkers.forEach(function(marker) {
                        return _this.remove(marker);
                    });
                };

                MarkerManager.prototype.draw = function() {
                    var deletes,
                        _this = this;
                    deletes = [];
                    this.gMarkers.forEach(function(gMarker) {
                        if (!gMarker.isDrawn) {
                            if (gMarker.doAdd) {
                                return gMarker.setMap(_this.gMap);
                            } else {
                                return deletes.push(gMarker);
                            }
                        }
                    });
                    return deletes.forEach(function(gMarker) {
                        return _this.remove(gMarker, true);
                    });
                };

                MarkerManager.prototype.clear = function() {
                    var gMarker, _i, _len, _ref;
                    _ref = this.gMarkers;
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        gMarker = _ref[_i];
                        gMarker.setMap(null);
                    }
                    delete this.gMarkers;
                    return this.gMarkers = [];
                };

                MarkerManager.prototype.handleOptDraw = function(gMarker, optDraw, doAdd) {
                    if (optDraw === true) {
                        if (doAdd) {
                            gMarker.setMap(this.gMap);
                        } else {
                            gMarker.setMap(null);
                        }
                        return gMarker.isDrawn = true;
                    } else {
                        gMarker.isDrawn = false;
                        return gMarker.doAdd = doAdd;
                    }
                };

                MarkerManager.prototype.fit = function() {
                    return MarkerManager.__super__.fit.call(this, this.gMarkers, this.gMap);
                };

                return MarkerManager;

            })(FitHelper);
            return MarkerManager;
        }
    ]);

}).call(this);

(function() {
    angular.module("google-maps").factory("array-sync", [
        "add-events", function(mapEvents) {
            return function(mapArray, scope, pathEval, pathChangedFn) {
                var geojsonArray, geojsonHandlers, geojsonWatcher, isSetFromScope, legacyHandlers, legacyWatcher, mapArrayListener, scopePath, watchListener;
                isSetFromScope = false;
                scopePath = scope.$eval(pathEval);
                if (!scope["static"]) {
                    legacyHandlers = {
                        set_at: function(index) {
                            var value;
                            if (isSetFromScope) {
                                return;
                            }
                            value = mapArray.getAt(index);
                            if (!value) {
                                return;
                            }
                            if (!value.lng || !value.lat) {
                                return scopePath[index] = value;
                            } else {
                                scopePath[index].latitude = value.lat();
                                return scopePath[index].longitude = value.lng();
                            }
                        },
                        insert_at: function(index) {
                            var value;
                            if (isSetFromScope) {
                                return;
                            }
                            value = mapArray.getAt(index);
                            if (!value) {
                                return;
                            }
                            if (!value.lng || !value.lat) {
                                return scopePath.splice(index, 0, value);
                            } else {
                                return scopePath.splice(index, 0, {
                                    latitude: value.lat(),
                                    longitude: value.lng()
                                });
                            }
                        },
                        remove_at: function(index) {
                            if (isSetFromScope) {
                                return;
                            }
                            return scopePath.splice(index, 1);
                        }
                    };
                    geojsonArray;
                    if (scopePath.type === "Polygon") {
                        geojsonArray = scopePath.coordinates[0];
                    } else if (scopePath.type === "LineString") {
                        geojsonArray = scopePath.coordinates;
                    }
                    geojsonHandlers = {
                        set_at: function(index) {
                            var value;
                            if (isSetFromScope) {
                                return;
                            }
                            value = mapArray.getAt(index);
                            if (!value) {
                                return;
                            }
                            if (!value.lng || !value.lat) {
                                return;
                            }
                            geojsonArray[index][1] = value.lat();
                            return geojsonArray[index][0] = value.lng();
                        },
                        insert_at: function(index) {
                            var value;
                            if (isSetFromScope) {
                                return;
                            }
                            value = mapArray.getAt(index);
                            if (!value) {
                                return;
                            }
                            if (!value.lng || !value.lat) {
                                return;
                            }
                            return geojsonArray.splice(index, 0, [value.lng(), value.lat()]);
                        },
                        remove_at: function(index) {
                            if (isSetFromScope) {
                                return;
                            }
                            return geojsonArray.splice(index, 1);
                        }
                    };
                    mapArrayListener = mapEvents(mapArray, angular.isUndefined(scopePath.type) ? legacyHandlers : geojsonHandlers);
                }
                legacyWatcher = function(newPath) {
                    var i, l, newLength, newValue, oldArray, oldLength, oldValue;
                    isSetFromScope = true;
                    oldArray = mapArray;
                    if (newPath) {
                        i = 0;
                        oldLength = oldArray.getLength();
                        newLength = newPath.length;
                        l = Math.min(oldLength, newLength);
                        newValue = void 0;
                        while (i < l) {
                            oldValue = oldArray.getAt(i);
                            newValue = newPath[i];
                            if (typeof newValue.equals === "function") {
                                if (!newValue.equals(oldValue)) {
                                    oldArray.setAt(i, newValue);
                                }
                            } else {
                                if ((oldValue.lat() !== newValue.latitude) || (oldValue.lng() !== newValue.longitude)) {
                                    oldArray.setAt(i, new google.maps.LatLng(newValue.latitude, newValue.longitude));
                                }
                            }
                            i++;
                        }
                        while (i < newLength) {
                            newValue = newPath[i];
                            if (typeof newValue.lat === "function" && typeof newValue.lng === "function") {
                                oldArray.push(newValue);
                            } else {
                                oldArray.push(new google.maps.LatLng(newValue.latitude, newValue.longitude));
                            }
                            i++;
                        }
                        while (i < oldLength) {
                            oldArray.pop();
                            i++;
                        }
                    }
                    return isSetFromScope = false;
                };
                geojsonWatcher = function(newPath) {
                    var array, i, l, newLength, newValue, oldArray, oldLength, oldValue;
                    isSetFromScope = true;
                    oldArray = mapArray;
                    if (newPath) {
                        array;
                        if (scopePath.type === "Polygon") {
                            array = newPath.coordinates[0];
                        } else if (scopePath.type === "LineString") {
                            array = newPath.coordinates;
                        }
                        i = 0;
                        oldLength = oldArray.getLength();
                        newLength = array.length;
                        l = Math.min(oldLength, newLength);
                        newValue = void 0;
                        while (i < l) {
                            oldValue = oldArray.getAt(i);
                            newValue = array[i];
                            if ((oldValue.lat() !== newValue[1]) || (oldValue.lng() !== newValue[0])) {
                                oldArray.setAt(i, new google.maps.LatLng(newValue[1], newValue[0]));
                            }
                            i++;
                        }
                        while (i < newLength) {
                            newValue = array[i];
                            oldArray.push(new google.maps.LatLng(newValue[1], newValue[0]));
                            i++;
                        }
                        while (i < oldLength) {
                            oldArray.pop();
                            i++;
                        }
                    }
                    return isSetFromScope = false;
                };
                watchListener;
                if (!scope["static"]) {
                    if (angular.isUndefined(scopePath.type)) {
                        watchListener = scope.$watchCollection(pathEval, legacyWatcher);
                    } else {
                        watchListener = scope.$watch(pathEval, geojsonWatcher, true);
                    }
                }
                return function() {
                    if (mapArrayListener) {
                        mapArrayListener();
                        mapArrayListener = null;
                    }
                    if (watchListener) {
                        watchListener();
                        return watchListener = null;
                    }
                };
            };
        }
    ]);

}).call(this);

(function() {
    angular.module("google-maps").factory("add-events", [
        "$timeout", function($timeout) {
            var addEvent, addEvents;
            addEvent = function(target, eventName, handler) {
                return google.maps.event.addListener(target, eventName, function() {
                    handler.apply(this, arguments);
                    return $timeout((function() {}), true);
                });
            };
            addEvents = function(target, eventName, handler) {
                var remove;
                if (handler) {
                    return addEvent(target, eventName, handler);
                }
                remove = [];
                angular.forEach(eventName, function(_handler, key) {
                    return remove.push(addEvent(target, key, _handler));
                });
                return function() {
                    angular.forEach(remove, function(listener) {
                        return google.maps.event.removeListener(listener);
                    });
                    return remove = null;
                };
            };
            return addEvents;
        }
    ]);

}).call(this);

(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.models.child").factory("MarkerChildModel", [
        "ModelKey", "GmapUtil", "Logger", "$injector", "EventsHelper", function(ModelKey, GmapUtil, Logger, $injector, EventsHelper) {
            var MarkerChildModel;
            MarkerChildModel = (function(_super) {
                __extends(MarkerChildModel, _super);

                MarkerChildModel.include(GmapUtil);

                MarkerChildModel.include(EventsHelper);

                function MarkerChildModel(model, parentScope, gMap, $timeout, defaults, doClick, gMarkerManager, idKey) {
                    var self,
                        _this = this;
                    this.model = model;
                    this.parentScope = parentScope;
                    this.gMap = gMap;
                    this.$timeout = $timeout;
                    this.defaults = defaults;
                    this.doClick = doClick;
                    this.gMarkerManager = gMarkerManager;
                    this.idKey = idKey;
                    this.watchDestroy = __bind(this.watchDestroy, this);
                    this.setLabelOptions = __bind(this.setLabelOptions, this);
                    this.isLabelDefined = __bind(this.isLabelDefined, this);
                    this.setOptions = __bind(this.setOptions, this);
                    this.setIcon = __bind(this.setIcon, this);
                    this.setCoords = __bind(this.setCoords, this);
                    this.destroy = __bind(this.destroy, this);
                    this.maybeSetScopeValue = __bind(this.maybeSetScopeValue, this);
                    this.createMarker = __bind(this.createMarker, this);
                    this.setMyScope = __bind(this.setMyScope, this);
                    self = this;
                    if (this.model[this.idKey]) {
                        this.id = this.model[this.idKey];
                    }
                    this.iconKey = this.parentScope.icon;
                    this.coordsKey = this.parentScope.coords;
                    this.clickKey = this.parentScope.click();
                    this.labelContentKey = this.parentScope.labelContent;
                    this.optionsKey = this.parentScope.options;
                    this.labelOptionsKey = this.parentScope.labelOptions;
                    MarkerChildModel.__super__.constructor.call(this, this.parentScope.$new(false));
                    this.scope.model = this.model;
                    this.setMyScope(this.model, void 0, true);
                    this.createMarker(this.model);
                    this.scope.$watch('model', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            return _this.setMyScope(newValue, oldValue);
                        }
                    }, true);
                    this.$log = Logger;
                    this.$log.info(self);
                    this.watchDestroy(this.scope);
                }

                MarkerChildModel.prototype.setMyScope = function(model, oldModel, isInit) {
                    var _this = this;
                    if (oldModel == null) {
                        oldModel = void 0;
                    }
                    if (isInit == null) {
                        isInit = false;
                    }
                    this.maybeSetScopeValue('icon', model, oldModel, this.iconKey, this.evalModelHandle, isInit, this.setIcon);
                    this.maybeSetScopeValue('coords', model, oldModel, this.coordsKey, this.evalModelHandle, isInit, this.setCoords);
                    this.maybeSetScopeValue('labelContent', model, oldModel, this.labelContentKey, this.evalModelHandle, isInit);
                    if (_.isFunction(this.clickKey) && $injector) {
                        return this.scope.click = function() {
                            return $injector.invoke(_this.clickKey, void 0, {
                                "$markerModel": model
                            });
                        };
                    } else {
                        this.maybeSetScopeValue('click', model, oldModel, this.clickKey, this.evalModelHandle, isInit);
                        return this.createMarker(model, oldModel, isInit);
                    }
                };

                MarkerChildModel.prototype.createMarker = function(model, oldModel, isInit) {
                    var _this = this;
                    if (oldModel == null) {
                        oldModel = void 0;
                    }
                    if (isInit == null) {
                        isInit = false;
                    }
                    return this.maybeSetScopeValue('options', model, oldModel, this.optionsKey, function(lModel, lModelKey) {
                        var value;
                        if (lModel === void 0) {
                            return void 0;
                        }
                        value = lModelKey === 'self' ? lModel : lModel[lModelKey];
                        if (value === void 0) {
                            return value = lModelKey === void 0 ? _this.defaults : _this.scope.options;
                        } else {
                            return value;
                        }
                    }, isInit, this.setOptions);
                };

                MarkerChildModel.prototype.maybeSetScopeValue = function(scopePropName, model, oldModel, modelKey, evaluate, isInit, gSetter) {
                    var newValue, oldVal;
                    if (gSetter == null) {
                        gSetter = void 0;
                    }
                    if (oldModel === void 0) {
                        this.scope[scopePropName] = evaluate(model, modelKey);
                        if (!isInit) {
                            if (gSetter != null) {
                                gSetter(this.scope);
                            }
                        }
                        return;
                    }
                    oldVal = evaluate(oldModel, modelKey);
                    newValue = evaluate(model, modelKey);
                    if (newValue !== oldVal && this.scope[scopePropName] !== newValue) {
                        this.scope[scopePropName] = newValue;
                        if (!isInit) {
                            if (gSetter != null) {
                                gSetter(this.scope);
                            }
                            return this.gMarkerManager.draw();
                        }
                    }
                };

                MarkerChildModel.prototype.destroy = function() {
                    return this.scope.$destroy();
                };

                MarkerChildModel.prototype.setCoords = function(scope) {
                    if (scope.$id !== this.scope.$id || this.gMarker === void 0) {
                        return;
                    }
                    if ((scope.coords != null)) {
                        if (!this.validateCoords(this.scope.coords)) {
                            this.$log.error("MarkerChildMarker cannot render marker as scope.coords as no position on marker: " + (JSON.stringify(this.model)));
                            return;
                        }
                        this.gMarker.setPosition(this.getCoords(scope.coords));
                        this.gMarker.setVisible(this.validateCoords(scope.coords));
                        this.gMarkerManager.remove(this.gMarker);
                        return this.gMarkerManager.add(this.gMarker);
                    } else {
                        return this.gMarkerManager.remove(this.gMarker);
                    }
                };

                MarkerChildModel.prototype.setIcon = function(scope) {
                    if (scope.$id !== this.scope.$id || this.gMarker === void 0) {
                        return;
                    }
                    this.gMarkerManager.remove(this.gMarker);
                    this.gMarker.setIcon(scope.icon);
                    this.gMarkerManager.add(this.gMarker);
                    this.gMarker.setPosition(this.getCoords(scope.coords));
                    return this.gMarker.setVisible(this.validateCoords(scope.coords));
                };

                MarkerChildModel.prototype.setOptions = function(scope) {
                    var _ref,
                        _this = this;
                    if (scope.$id !== this.scope.$id) {
                        return;
                    }
                    if (this.gMarker != null) {
                        this.gMarkerManager.remove(this.gMarker);
                        delete this.gMarker;
                    }
                    if (!((_ref = scope.coords) != null ? _ref : typeof scope.icon === "function" ? scope.icon(scope.options != null) : void 0)) {
                        return;
                    }
                    this.opts = this.createMarkerOptions(scope.coords, scope.icon, scope.options);
                    delete this.gMarker;
                    if (this.isLabelDefined(scope)) {
                        this.gMarker = new MarkerWithLabel(this.setLabelOptions(this.opts, scope));
                    } else {
                        this.gMarker = new google.maps.Marker(this.opts);
                    }
                    this.setEvents(this.gMarker, this.parentScope, this.model);
                    if (this.id) {
                        this.gMarker.key = this.id;
                    }
                    this.gMarkerManager.add(this.gMarker);
                    return google.maps.event.addListener(this.gMarker, 'click', function() {
                        if (_this.doClick && (_this.scope.click != null)) {
                            return _this.scope.click();
                        }
                    });
                };

                MarkerChildModel.prototype.isLabelDefined = function(scope) {
                    return scope.labelContent != null;
                };

                MarkerChildModel.prototype.setLabelOptions = function(opts, scope) {
                    opts.labelAnchor = this.getLabelPositionPoint(scope.labelAnchor);
                    opts.labelClass = scope.labelClass;
                    opts.labelContent = scope.labelContent;
                    return opts;
                };

                MarkerChildModel.prototype.watchDestroy = function(scope) {
                    var _this = this;
                    return scope.$on("$destroy", function() {
                        var self, _ref;
                        if (_this.gMarker != null) {
                            google.maps.event.clearListeners(_this.gMarker, 'click');
                            if (((_ref = _this.parentScope) != null ? _ref.events : void 0) && _.isArray(_this.parentScope.events)) {
                                _this.parentScope.events.forEach(function(event, eventName) {
                                    return google.maps.event.clearListeners(this.gMarker, eventName);
                                });
                            }
                            _this.gMarkerManager.remove(_this.gMarker, true);
                            delete _this.gMarker;
                        }
                        return self = void 0;
                    });
                };

                return MarkerChildModel;

            })(ModelKey);
            return MarkerChildModel;
        }
    ]);

}).call(this);

(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.models.child").factory("MarkerLabelChildModel", [
        "BaseObject", "GmapUtil", function(BaseObject, GmapUtil) {
            var MarkerLabelChildModel;
            MarkerLabelChildModel = (function(_super) {
                __extends(MarkerLabelChildModel, _super);

                MarkerLabelChildModel.include(GmapUtil);

                function MarkerLabelChildModel(gMarker, opt_options) {
                    this.destroy = __bind(this.destroy, this);
                    this.draw = __bind(this.draw, this);
                    this.setPosition = __bind(this.setPosition, this);
                    this.setZIndex = __bind(this.setZIndex, this);
                    this.setVisible = __bind(this.setVisible, this);
                    this.setAnchor = __bind(this.setAnchor, this);
                    this.setMandatoryStyles = __bind(this.setMandatoryStyles, this);
                    this.setStyles = __bind(this.setStyles, this);
                    this.setContent = __bind(this.setContent, this);
                    this.setTitle = __bind(this.setTitle, this);
                    this.getSharedCross = __bind(this.getSharedCross, this);
                    var self, _ref, _ref1;
                    MarkerLabelChildModel.__super__.constructor.call(this);
                    self = this;
                    this.marker = gMarker;
                    this.marker.set("labelContent", opt_options.labelContent);
                    this.marker.set("labelAnchor", this.getLabelPositionPoint(opt_options.labelAnchor));
                    this.marker.set("labelClass", opt_options.labelClass || 'labels');
                    this.marker.set("labelStyle", opt_options.labelStyle || {
                        opacity: 100
                    });
                    this.marker.set("labelInBackground", opt_options.labelInBackground || false);
                    if (!opt_options.labelVisible) {
                        this.marker.set("labelVisible", true);
                    }
                    if (!opt_options.raiseOnDrag) {
                        this.marker.set("raiseOnDrag", true);
                    }
                    if (!opt_options.clickable) {
                        this.marker.set("clickable", true);
                    }
                    if (!opt_options.draggable) {
                        this.marker.set("draggable", false);
                    }
                    if (!opt_options.optimized) {
                        this.marker.set("optimized", false);
                    }
                    opt_options.crossImage = (_ref = opt_options.crossImage) != null ? _ref : document.location.protocol + "//maps.gstatic.com/intl/en_us/mapfiles/drag_cross_67_16.png";
                    opt_options.handCursor = (_ref1 = opt_options.handCursor) != null ? _ref1 : document.location.protocol + "//maps.gstatic.com/intl/en_us/mapfiles/closedhand_8_8.cur";
                    this.markerLabel = new MarkerLabel_(this.marker, opt_options.crossImage, opt_options.handCursor);
                    this.marker.set("setMap", function(theMap) {
                        google.maps.Marker.prototype.setMap.apply(this, arguments);
                        return self.markerLabel.setMap(theMap);
                    });
                    this.marker.setMap(this.marker.getMap());
                }

                MarkerLabelChildModel.prototype.getSharedCross = function(crossUrl) {
                    return this.markerLabel.getSharedCross(crossUrl);
                };

                MarkerLabelChildModel.prototype.setTitle = function() {
                    return this.markerLabel.setTitle();
                };

                MarkerLabelChildModel.prototype.setContent = function() {
                    return this.markerLabel.setContent();
                };

                MarkerLabelChildModel.prototype.setStyles = function() {
                    return this.markerLabel.setStyles();
                };

                MarkerLabelChildModel.prototype.setMandatoryStyles = function() {
                    return this.markerLabel.setMandatoryStyles();
                };

                MarkerLabelChildModel.prototype.setAnchor = function() {
                    return this.markerLabel.setAnchor();
                };

                MarkerLabelChildModel.prototype.setVisible = function() {
                    return this.markerLabel.setVisible();
                };

                MarkerLabelChildModel.prototype.setZIndex = function() {
                    return this.markerLabel.setZIndex();
                };

                MarkerLabelChildModel.prototype.setPosition = function() {
                    return this.markerLabel.setPosition();
                };

                MarkerLabelChildModel.prototype.draw = function() {
                    return this.markerLabel.draw();
                };

                MarkerLabelChildModel.prototype.destroy = function() {
                    if ((this.markerLabel.labelDiv_.parentNode != null) && (this.markerLabel.eventDiv_.parentNode != null)) {
                        return this.markerLabel.onRemove();
                    }
                };

                return MarkerLabelChildModel;

            })(BaseObject);
            return MarkerLabelChildModel;
        }
    ]);

}).call(this);

/*
 - interface for all markers to derrive from
 - to enforce a minimum set of requirements
 - attributes
 - coords
 - icon
 - implementation needed on watches
 */


(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.models.parent").factory("IMarkerParentModel", [
        "ModelKey", "Logger", function(ModelKey, Logger) {
            var IMarkerParentModel;
            IMarkerParentModel = (function(_super) {
                __extends(IMarkerParentModel, _super);

                IMarkerParentModel.prototype.DEFAULTS = {};

                function IMarkerParentModel(scope, element, attrs, mapCtrl, $timeout) {
                    var self,
                        _this = this;
                    this.scope = scope;
                    this.element = element;
                    this.attrs = attrs;
                    this.mapCtrl = mapCtrl;
                    this.$timeout = $timeout;
                    this.linkInit = __bind(this.linkInit, this);
                    this.onDestroy = __bind(this.onDestroy, this);
                    this.onWatch = __bind(this.onWatch, this);
                    this.watch = __bind(this.watch, this);
                    this.validateScope = __bind(this.validateScope, this);
                    this.onTimeOut = __bind(this.onTimeOut, this);
                    IMarkerParentModel.__super__.constructor.call(this, this.scope);
                    self = this;
                    this.$log = Logger;
                    if (!this.validateScope(scope)) {
                        throw new String("Unable to construct IMarkerParentModel due to invalid scope");
                    }
                    this.doClick = angular.isDefined(attrs.click);
                    if (scope.options != null) {
                        this.DEFAULTS = scope.options;
                    }
                    this.$timeout(function() {
                        _this.onTimeOut(scope);
                        _this.watch('coords', _this.scope);
                        _this.watch('icon', _this.scope);
                        _this.watch('options', _this.scope);
                        return scope.$on("$destroy", function() {
                            return _this.onDestroy(scope);
                        });
                    });
                }

                IMarkerParentModel.prototype.onTimeOut = function(scope) {};

                IMarkerParentModel.prototype.validateScope = function(scope) {
                    var ret;
                    if (scope == null) {
                        this.$log.error(this.constructor.name + ": invalid scope used");
                        return false;
                    }
                    ret = scope.coords != null;
                    if (!ret) {
                        this.$log.error(this.constructor.name + ": no valid coords attribute found");
                        return false;
                    }
                    return ret;
                };

                IMarkerParentModel.prototype.watch = function(propNameToWatch, scope) {
                    var watchFunc,
                        _this = this;
                    watchFunc = function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            return _this.onWatch(propNameToWatch, scope, newValue, oldValue);
                        }
                    };
                    return scope.$watch(propNameToWatch, watchFunc, true);
                };

                IMarkerParentModel.prototype.onWatch = function(propNameToWatch, scope, newValue, oldValue) {
                    throw new String("OnWatch Not Implemented!!");
                };

                IMarkerParentModel.prototype.onDestroy = function(scope) {
                    throw new String("OnDestroy Not Implemented!!");
                };

                IMarkerParentModel.prototype.linkInit = function(element, mapCtrl, scope, animate) {
                    throw new String("LinkInit Not Implemented!!");
                };

                return IMarkerParentModel;

            })(ModelKey);
            return IMarkerParentModel;
        }
    ]);

}).call(this);

/*
 Basic Directive api for a marker. Basic in the sense that this directive contains 1:1 on scope and model.
 Thus there will be one html element per marker within the directive.
 */


(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.models.parent").factory("MarkerParentModel", [
        "IMarkerParentModel", "GmapUtil", "EventsHelper", function(IMarkerParentModel, GmapUtil, EventsHelper) {
            var MarkerParentModel;
            MarkerParentModel = (function(_super) {
                __extends(MarkerParentModel, _super);

                MarkerParentModel.include(GmapUtil);

                MarkerParentModel.include(EventsHelper);

                function MarkerParentModel(scope, element, attrs, mapCtrl, $timeout, gMarkerManager, doFit) {
                    var self;
                    this.gMarkerManager = gMarkerManager;
                    this.doFit = doFit;
                    this.onDestroy = __bind(this.onDestroy, this);
                    this.setGMarker = __bind(this.setGMarker, this);
                    this.onWatch = __bind(this.onWatch, this);
                    this.onTimeOut = __bind(this.onTimeOut, this);
                    MarkerParentModel.__super__.constructor.call(this, scope, element, attrs, mapCtrl, $timeout);
                    self = this;
                }

                MarkerParentModel.prototype.onTimeOut = function(scope) {
                    var opts,
                        _this = this;
                    opts = this.createMarkerOptions(scope.coords, scope.icon, scope.options, this.mapCtrl.getMap());
                    this.setGMarker(new google.maps.Marker(opts));
                    google.maps.event.addListener(this.scope.gMarker, 'click', function() {
                        if (_this.doClick && (scope.click != null)) {
                            return _this.$timeout(function() {
                                return _this.scope.click();
                            });
                        }
                    });
                    this.setEvents(this.scope.gMarker, scope, scope);
                    return this.$log.info(this);
                };

                MarkerParentModel.prototype.onWatch = function(propNameToWatch, scope) {
                    switch (propNameToWatch) {
                        case 'coords':
                            if (this.validateCoords(scope.coords) && (this.scope.gMarker != null)) {
                                this.scope.gMarker.setMap(this.mapCtrl.getMap());
                                this.scope.gMarker.setPosition(this.getCoords(scope.coords));
                                this.scope.gMarker.setVisible(this.validateCoords(scope.coords));
                                return this.scope.gMarker.setOptions(scope.options);
                            } else {
                                return this.scope.gMarker.setMap(null);
                            }
                            break;
                        case 'icon':
                            if ((scope.icon != null) && this.validateCoords(scope.coords) && (this.scope.gMarker != null)) {
                                this.scope.gMarker.setOptions(scope.options);
                                this.scope.gMarker.setIcon(scope.icon);
                                this.scope.gMarker.setMap(null);
                                this.scope.gMarker.setMap(this.mapCtrl.getMap());
                                this.scope.gMarker.setPosition(this.getCoords(scope.coords));
                                return this.scope.gMarker.setVisible(this.validateCoords(scope.coords));
                            }
                            break;
                        case 'options':
                            if (this.validateCoords(scope.coords) && (scope.icon != null) && scope.options) {
                                if (this.scope.gMarker != null) {
                                    this.scope.gMarker.setMap(null);
                                }
                                return this.setGMarker(new google.maps.Marker(this.createMarkerOptions(scope.coords, scope.icon, scope.options, this.mapCtrl.getMap())));
                            }
                    }
                };

                MarkerParentModel.prototype.setGMarker = function(gMarker) {
                    if (this.scope.gMarker) {
                        delete this.scope.gMarker;
                        this.gMarkerManager.remove(this.scope.gMarker, false);
                    }
                    this.scope.gMarker = gMarker;
                    if (this.scope.gMarker) {
                        this.gMarkerManager.add(this.scope.gMarker, false);
                        if (this.doFit) {
                            return this.gMarkerManager.fit();
                        }
                    }
                };

                MarkerParentModel.prototype.onDestroy = function(scope) {
                    var self;
                    if (!this.scope.gMarker) {
                        self = void 0;
                        return;
                    }
                    this.scope.gMarker.setMap(null);
                    this.gMarkerManager.remove(this.scope.gMarker, false);
                    delete this.scope.gMarker;
                    return self = void 0;
                };

                return MarkerParentModel;

            })(IMarkerParentModel);
            return MarkerParentModel;
        }
    ]);

}).call(this);

(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api.models.parent").factory("MarkersParentModel", [
        "IMarkerParentModel", "ModelsWatcher", "PropMap", "MarkerChildModel", "ClustererMarkerManager", "MarkerManager", function(IMarkerParentModel, ModelsWatcher, PropMap, MarkerChildModel, ClustererMarkerManager, MarkerManager) {
            var MarkersParentModel;
            MarkersParentModel = (function(_super) {
                __extends(MarkersParentModel, _super);

                MarkersParentModel.include(ModelsWatcher);

                function MarkersParentModel(scope, element, attrs, mapCtrl, $timeout) {
                    this.onDestroy = __bind(this.onDestroy, this);
                    this.newChildMarker = __bind(this.newChildMarker, this);
                    this.pieceMealMarkers = __bind(this.pieceMealMarkers, this);
                    this.reBuildMarkers = __bind(this.reBuildMarkers, this);
                    this.createMarkersFromScratch = __bind(this.createMarkersFromScratch, this);
                    this.validateScope = __bind(this.validateScope, this);
                    this.onWatch = __bind(this.onWatch, this);
                    this.onTimeOut = __bind(this.onTimeOut, this);
                    var self,
                        _this = this;
                    MarkersParentModel.__super__.constructor.call(this, scope, element, attrs, mapCtrl, $timeout);
                    self = this;
                    this.scope.markerModels = new PropMap();
                    this.$timeout = $timeout;
                    this.$log.info(this);
                    this.doRebuildAll = this.scope.doRebuildAll != null ? this.scope.doRebuildAll : true;
                    this.setIdKey(scope);
                    this.scope.$watch('doRebuildAll', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            return _this.doRebuildAll = newValue;
                        }
                    });
                }

                MarkersParentModel.prototype.onTimeOut = function(scope) {
                    this.watch('models', scope);
                    this.watch('doCluster', scope);
                    this.watch('clusterOptions', scope);
                    this.watch('clusterEvents', scope);
                    this.watch('fit', scope);
                    this.watch('idKey', scope);
                    this.gMarkerManager = void 0;
                    return this.createMarkersFromScratch(scope);
                };

                MarkersParentModel.prototype.onWatch = function(propNameToWatch, scope, newValue, oldValue) {
                    if (propNameToWatch === "idKey" && newValue !== oldValue) {
                        this.idKey = newValue;
                    }
                    if (this.doRebuildAll) {
                        return this.reBuildMarkers(scope);
                    } else {
                        return this.pieceMealMarkers(scope);
                    }
                };

                MarkersParentModel.prototype.validateScope = function(scope) {
                    var modelsNotDefined;
                    modelsNotDefined = angular.isUndefined(scope.models) || scope.models === void 0;
                    if (modelsNotDefined) {
                        this.$log.error(this.constructor.name + ": no valid models attribute found");
                    }
                    return MarkersParentModel.__super__.validateScope.call(this, scope) || modelsNotDefined;
                };

                MarkersParentModel.prototype.createMarkersFromScratch = function(scope) {
                    var _this = this;
                    if (scope.doCluster) {
                        if (scope.clusterEvents) {
                            this.clusterInternalOptions = _.once(function() {
                                var self, _ref, _ref1, _ref2;
                                self = _this;
                                if (!_this.origClusterEvents) {
                                    _this.origClusterEvents = {
                                        click: (_ref = scope.clusterEvents) != null ? _ref.click : void 0,
                                        mouseout: (_ref1 = scope.clusterEvents) != null ? _ref1.mouseout : void 0,
                                        mouseover: (_ref2 = scope.clusterEvents) != null ? _ref2.mouseover : void 0
                                    };
                                    return _.extend(scope.clusterEvents, {
                                        click: function(cluster) {
                                            return self.maybeExecMappedEvent(cluster, "click");
                                        },
                                        mouseout: function(cluster) {
                                            return self.maybeExecMappedEvent(cluster, "mouseout");
                                        },
                                        mouseover: function(cluster) {
                                            return self.maybeExecMappedEvent(cluster, "mouseover");
                                        }
                                    });
                                }
                            })();
                        }
                        if (scope.clusterOptions || scope.clusterEvents) {
                            if (this.gMarkerManager === void 0) {
                                this.gMarkerManager = new ClustererMarkerManager(this.mapCtrl.getMap(), void 0, scope.clusterOptions, this.clusterInternalOptions);
                            } else {
                                if (this.gMarkerManager.opt_options !== scope.clusterOptions) {
                                    this.gMarkerManager = new ClustererMarkerManager(this.mapCtrl.getMap(), void 0, scope.clusterOptions, this.clusterInternalOptions);
                                }
                            }
                        } else {
                            this.gMarkerManager = new ClustererMarkerManager(this.mapCtrl.getMap());
                        }
                    } else {
                        this.gMarkerManager = new MarkerManager(this.mapCtrl.getMap());
                    }
                    return _async.each(scope.models, function(model) {
                        return _this.newChildMarker(model, scope);
                    }, function() {
                        _this.gMarkerManager.draw();
                        if (scope.fit) {
                            return _this.gMarkerManager.fit();
                        }
                    });
                };

                MarkersParentModel.prototype.reBuildMarkers = function(scope) {
                    if (!scope.doRebuild && scope.doRebuild !== void 0) {
                        return;
                    }
                    this.onDestroy(scope);
                    return this.createMarkersFromScratch(scope);
                };

                MarkersParentModel.prototype.pieceMealMarkers = function(scope) {
                    var _this = this;
                    if ((this.scope.models != null) && this.scope.models.length > 0 && this.scope.markerModels.length > 0) {
                        return this.figureOutState(this.idKey, scope, this.scope.markerModels, this.modelKeyComparison, function(state) {
                            var payload;
                            payload = state;
                            return _async.each(payload.removals, function(child) {
                                if (child != null) {
                                    child.destroy();
                                    return _this.scope.markerModels.remove(child.id);
                                }
                            }, function() {
                                return _async.each(payload.adds, function(modelToAdd) {
                                    return _this.newChildMarker(modelToAdd, scope);
                                }, function() {
                                    _this.gMarkerManager.draw();
                                    return scope.markerModels = _this.scope.markerModels;
                                });
                            });
                        });
                    } else {
                        return this.reBuildMarkers(scope);
                    }
                };

                MarkersParentModel.prototype.newChildMarker = function(model, scope) {
                    var child;
                    if (model[this.idKey] == null) {
                        this.$log.error("Marker model has no id to assign a child to. This is required for performance. Please assign id, or redirect id to a different key.");
                        return;
                    }
                    this.$log.info('child', child, 'markers', this.scope.markerModels);
                    child = new MarkerChildModel(model, scope, this.mapCtrl, this.$timeout, this.DEFAULTS, this.doClick, this.gMarkerManager, this.idKey);
                    this.scope.markerModels.put(model[this.idKey], child);
                    return child;
                };

                MarkersParentModel.prototype.onDestroy = function(scope) {
                    _.each(this.scope.markerModels.values(), function(model) {
                        if (model != null) {
                            return model.destroy();
                        }
                    });
                    delete this.scope.markerModels;
                    this.scope.markerModels = new PropMap();
                    if (this.gMarkerManager != null) {
                        return this.gMarkerManager.clear();
                    }
                };

                MarkersParentModel.prototype.maybeExecMappedEvent = function(cluster, fnName) {
                    var pair, _ref;
                    if (_.isFunction((_ref = this.scope.clusterEvents) != null ? _ref[fnName] : void 0)) {
                        pair = this.mapClusterToMarkerModels(cluster);
                        if (this.origClusterEvents[fnName]) {
                            return this.origClusterEvents[fnName](pair.cluster, pair.mapped);
                        }
                    }
                };

                MarkersParentModel.prototype.mapClusterToMarkerModels = function(cluster) {
                    var gMarkers, mapped,
                        _this = this;
                    gMarkers = cluster.getMarkers();
                    mapped = gMarkers.map(function(g) {
                        return _this.scope.markerModels[g.key].model;
                    });
                    return {
                        cluster: cluster,
                        mapped: mapped
                    };
                };

                return MarkersParentModel;

            })(IMarkerParentModel);
            return MarkersParentModel;
        }
    ]);

}).call(this);

/*
 - interface for all labels to derrive from
 - to enforce a minimum set of requirements
 - attributes
 - content
 - anchor
 - implementation needed on watches
 */


(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api").factory("ILabel", [
        "BaseObject", "Logger", function(BaseObject, Logger) {
            var ILabel;
            return ILabel = (function(_super) {
                __extends(ILabel, _super);

                function ILabel($timeout) {
                    this.link = __bind(this.link, this);
                    var self;
                    self = this;
                    this.restrict = 'ECMA';
                    this.replace = true;
                    this.template = void 0;
                    this.require = void 0;
                    this.transclude = true;
                    this.priority = -100;
                    this.scope = {
                        labelContent: '=content',
                        labelAnchor: '@anchor',
                        labelClass: '@class',
                        labelStyle: '=style'
                    };
                    this.$log = Logger;
                    this.$timeout = $timeout;
                }

                ILabel.prototype.link = function(scope, element, attrs, ctrl) {
                    throw new Exception("Not Implemented!!");
                };

                return ILabel;

            })(BaseObject);
        }
    ]);

}).call(this);

/*
 - interface for all markers to derrive from
 - to enforce a minimum set of requirements
 - attributes
 - coords
 - icon
 - implementation needed on watches
 */


(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api").factory("IMarker", [
        "Logger", "BaseObject", function(Logger, BaseObject) {
            var IMarker;
            return IMarker = (function(_super) {
                __extends(IMarker, _super);

                function IMarker($timeout) {
                    this.link = __bind(this.link, this);
                    var self;
                    self = this;
                    this.$log = Logger;
                    this.$timeout = $timeout;
                    this.restrict = 'ECMA';
                    this.require = '^googleMap';
                    this.priority = -1;
                    this.transclude = true;
                    this.replace = true;
                    this.scope = {
                        coords: '=coords',
                        icon: '=icon',
                        click: '&click',
                        options: '=options',
                        events: '=events',
                        fit: '=fit'
                    };
                }

                IMarker.prototype.controller = [
                    '$scope', '$element', function($scope, $element) {
                        throw new Exception("Not Implemented!!");
                    }
                ];

                IMarker.prototype.link = function(scope, element, attrs, ctrl) {
                    throw new Exception("Not implemented!!");
                };

                return IMarker;

            })(BaseObject);
        }
    ]);

}).call(this);

(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api").factory("Map", [
        "$timeout", "Logger", "GmapUtil", "BaseObject", function($timeout, Logger, GmapUtil, BaseObject) {
var $log, DEFAULTS, Map;
            $log = Logger;
            DEFAULTS = {
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            return Map = (function(_super) {
                __extends(Map, _super);

                Map.include(GmapUtil);

                function Map() {
                    this.link = __bind(this.link, this);
                    var self;
                    self = this;
                }

                Map.prototype.restrict = "ECMA";

                Map.prototype.transclude = true;

                Map.prototype.replace = false;

                Map.prototype.template = "<div class=\"angular-google-map\"><div class=\"angular-google-map-container\"></div><div ng-transclude style=\"display: none\"></div></div>";

                Map.prototype.scope = {
                    center: "=center",
                    zoom: "=zoom",
                    dragging: "=dragging",
                    control: "=",
                    windows: "=windows",
                    options: "=options",
                    events: "=events",
                    styles: "=styles",
                    bounds: "=bounds"
                };

                Map.prototype.controller = [
                    "$scope", function($scope) {
                        return {
                            getMap: function() {
                                return $scope.map;
                            }
                        };
                    }
                ];

                /*
                 @param scope
                 @param element
                 @param attrs
                 */


                Map.prototype.link = function(scope, element, attrs) {
                    var dragging, el, eventName, getEventHandler, opts, settingCenterFromScope, type, _m,
                        _this = this;
                    if (!this.validateCoords(scope.center)) {
                        $log.error("angular-google-maps: could not find a valid center property");
                        return;
                    }
                    if (!angular.isDefined(scope.zoom)) {
                        $log.error("angular-google-maps: map zoom property not set");
                        return;
                    }
                    el = angular.element(element);
                    el.addClass("angular-google-map");
                    opts = {
                        options: {}
                    };
                    if (attrs.options) {
                        opts.options = scope.options;
                    }
                    if (attrs.styles) {
                        opts.styles = scope.styles;
                    }
                    if (attrs.type) {
                        type = attrs.type.toUpperCase();
                        if (google.maps.MapTypeId.hasOwnProperty(type)) {
                            opts.mapTypeId = google.maps.MapTypeId[attrs.type.toUpperCase()];
                        } else {
                            $log.error("angular-google-maps: invalid map type \"" + attrs.type + "\"");
                        }
                    }
                    _m = new google.maps.Map(el.find("div")[1], angular.extend({}, DEFAULTS, opts, {
                        center: this.getCoords(scope.center),
                        draggable: this.isTrue(attrs.draggable),
                        zoom: scope.zoom,
                        bounds: scope.bounds
                    }));
                    dragging = false;
                    google.maps.event.addListener(_m, "dragstart", function() {
                        dragging = true;
                        return _.defer(function() {
                            return scope.$apply(function(s) {
                                if (s.dragging != null) {
                                    return s.dragging = dragging;
                                }
                            });
                        });
                    });
                    google.maps.event.addListener(_m, "dragend", function() {
                        dragging = false;
                        return _.defer(function() {
                            return scope.$apply(function(s) {
                                if (s.dragging != null) {
                                    return s.dragging = dragging;
                                }
                            });
                        });
                    });
                    google.maps.event.addListener(_m, "drag", function() {
                        var c;
                        c = _m.center;
                        return _.defer(function() {
                            return scope.$apply(function(s) {
                                if (angular.isDefined(s.center.type)) {
                                    s.center.coordinates[1] = c.lat();
                                    return s.center.coordinates[0] = c.lng();
                                } else {
                                    s.center.latitude = c.lat();
                                    return s.center.longitude = c.lng();
                                }
                            });
                        });
                    });
                    google.maps.event.addListener(_m, "zoom_changed", function() {
                        if (scope.zoom !== _m.zoom) {
                            return _.defer(function() {
                                return scope.$apply(function(s) {
                                    return s.zoom = _m.zoom;
                                });
                            });
                        }
                    });
                    settingCenterFromScope = false;
                    google.maps.event.addListener(_m, "center_changed", function() {
                        var c;
                        c = _m.center;
                        if (settingCenterFromScope) {
                            return;
                        }
                        return _.defer(function() {
                            return scope.$apply(function(s) {
                                if (!_m.dragging) {
                                    if (angular.isDefined(s.center.type)) {
                                        if (s.center.coordinates[1] !== c.lat()) {
                                            s.center.coordinates[1] = c.lat();
                                        }
                                        if (s.center.coordinates[0] !== c.lng()) {
                                            return s.center.coordinates[0] = c.lng();
                                        }
                                    } else {
                                        if (s.center.latitude !== c.lat()) {
                                            s.center.latitude = c.lat();
                                        }
                                        if (s.center.longitude !== c.lng()) {
                                            return s.center.longitude = c.lng();
                                        }
                                    }
                                }
                            });
                        });
                    });
                    google.maps.event.addListener(_m, "idle", function() {
                        var b, ne, sw;
                        b = _m.getBounds();
                        ne = b.getNorthEast();
                        sw = b.getSouthWest();
                        return _.defer(function() {
                            return scope.$apply(function(s) {
                                if (s.bounds !== null && s.bounds !== undefined && s.bounds !== void 0) {
                                    s.bounds.northeast = {
                                        latitude: ne.lat(),
                                        longitude: ne.lng()
                                    };
                                    return s.bounds.southwest = {
                                        latitude: sw.lat(),
                                        longitude: sw.lng()
                                    };
                                }
                            });
                        });
                    });
                    if (angular.isDefined(scope.events) && scope.events !== null && angular.isObject(scope.events)) {
                        getEventHandler = function(eventName) {
                            return function() {
                                return scope.events[eventName].apply(scope, [_m, eventName, arguments]);
                            };
                        };
                        for (eventName in scope.events) {
                            if (scope.events.hasOwnProperty(eventName) && angular.isFunction(scope.events[eventName])) {
                                google.maps.event.addListener(_m, eventName, getEventHandler(eventName));
                            }
                        }
                    }
                    scope.map = _m;
                    if ((attrs.control != null) && (scope.control != null)) {
                        scope.control.refresh = function(maybeCoords) {
                            var coords;
                            if (_m == null) {
                                return;
                            }
                            google.maps.event.trigger(_m, "resize");
                            if (((maybeCoords != null ? maybeCoords.latitude : void 0) != null) && ((maybeCoords != null ? maybeCoords.latitude : void 0) != null)) {
                                coords = _this.getCoords(maybeCoords);
                                if (_this.isTrue(attrs.pan)) {
                                    return _m.panTo(coords);
                                } else {
                                    return _m.setCenter(coords);
                                }
                            }
                        };
                        /*
                         I am sure you all will love this. You want the instance here you go.. BOOM!
                         */

                        scope.control.getGMap = function() {
                            return _m;
                        };
                    }
                    scope.$watch("center", (function(newValue, oldValue) {
                        var coords;
                        coords = _this.getCoords(newValue);
                        if (coords.lat() === _m.center.lat() && coords.lng() === _m.center.lng()) {
                            return;
                        }
                        settingCenterFromScope = true;
                        if (!dragging) {
                            if (!_this.validateCoords(newValue)) {
                                $log.error("Invalid center for newValue: " + (JSON.stringify(newValue)));
                            }
                            if (_this.isTrue(attrs.pan) && scope.zoom === _m.zoom) {
                                _m.panTo(coords);
                            } else {
                                _m.setCenter(coords);
                            }
                        }
                        return settingCenterFromScope = false;
                    }), true);
                    scope.$watch("zoom", function(newValue, oldValue) {
                        if (newValue === _m.zoom) {
                            return;
                        }
                        return _.defer(function() {
                            return _m.setZoom(newValue);
                        });
                    });
                    scope.$watch("bounds", function(newValue, oldValue) {
                        var bounds, ne, sw;
                        if ((newValue.northeast.latitude == null) || (newValue.northeast.longitude == null) || (newValue.southwest.latitude == null) || (newValue.southwest.longitude == null)) {
                            $log.error("Invalid map bounds for new value: " + (JSON.stringify(newValue)));
                            return;
                        }
                        ne = new google.maps.LatLng(newValue.northeast.latitude, newValue.northeast.longitude);
                        sw = new google.maps.LatLng(newValue.southwest.latitude, newValue.southwest.longitude);
                        bounds = new google.maps.LatLngBounds(sw, ne);
                        return _m.fitBounds(bounds);
                    });
                    scope.$watch("options", function(newValue, oldValue) {
                        if (!_.isEqual(newValue, oldValue)) {
                            opts.options = newValue;
                            if (_m != null) {
                                return _m.setOptions(opts);
                            }
                        }
                    }, true);
                    return scope.$watch("styles", function(newValue, oldValue) {
                        if (!_.isEqual(newValue, oldValue)) {
                            opts.styles = newValue;
                            if (_m != null) {
                                return _m.setOptions(opts);
                            }
                        }
                    }, true);
                };

                return Map;

            })(BaseObject);
        }
    ]);

}).call(this);

(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api").factory("Marker", [
        "IMarker", "MarkerParentModel", "MarkerManager", function(IMarker, MarkerParentModel, MarkerManager) {
            var Marker;
            return Marker = (function(_super) {
                __extends(Marker, _super);

                function Marker($timeout) {
                    this.link = __bind(this.link, this);
                    var self;
                    Marker.__super__.constructor.call(this, $timeout);
                    self = this;
                    this.template = '<span class="angular-google-map-marker" ng-transclude></span>';
                    this.$log.info(this);
                }

                Marker.prototype.controller = [
                    '$scope', '$element', function($scope, $element) {
                        return {
                            getMarkerScope: function() {
                                return $scope;
                            }
                        };
                    }
                ];

                Marker.prototype.link = function(scope, element, attrs, ctrl) {
                    var doFit;
                    if (scope.fit) {
                        doFit = true;
                    }
                    if (!this.gMarkerManager) {
                        this.gMarkerManager = new MarkerManager(ctrl.getMap());
                    }
                    return new MarkerParentModel(scope, element, attrs, ctrl, this.$timeout, this.gMarkerManager, doFit);
                };

                return Marker;

            })(IMarker);
        }
    ]);

}).call(this);

(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps.directives.api").factory("Markers", [
        "IMarker", "MarkersParentModel", function(IMarker, MarkersParentModel) {
            var Markers;
            return Markers = (function(_super) {
                __extends(Markers, _super);

                function Markers($timeout) {
                    this.link = __bind(this.link, this);
                    var self;
                    Markers.__super__.constructor.call(this, $timeout);
                    this.template = '<span class="angular-google-map-markers" ng-transclude></span>';
                    this.scope.idKey = '=idkey';
                    this.scope.doRebuildAll = '=dorebuildall';
                    this.scope.models = '=models';
                    this.scope.doCluster = '=docluster';
                    this.scope.clusterOptions = '=clusteroptions';
                    this.scope.clusterEvents = '=clusterevents';
                    this.scope.labelContent = '=labelcontent';
                    this.scope.labelAnchor = '@labelanchor';
                    this.scope.labelClass = '@labelclass';
                    this.$timeout = $timeout;
                    self = this;
                    this.$log.info(this);
                }

                Markers.prototype.controller = [
                    '$scope', '$element', function($scope, $element) {
                        return {
                            getMarkersScope: function() {
                                return $scope;
                            }
                        };
                    }
                ];

                Markers.prototype.link = function(scope, element, attrs, ctrl) {
                    return new MarkersParentModel(scope, element, attrs, ctrl, this.$timeout);
                };

                return Markers;

            })(IMarker);
        }
    ]);

}).call(this);

/*
 !
 The MIT License

 Copyright (c) 2010-2013 Google, Inc. http://angularjs.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 angular-google-maps
 https://github.com/nlaplante/angular-google-maps

 @authors
 Nicolas Laplante - https://plus.google.com/108189012221374960701
 Nicholas McCready - https://twitter.com/nmccready
 Nick Baugh - https://github.com/niftylettuce
 */


(function() {
    angular.module("google-maps").directive("googleMap", [
        "Map", function(Map) {
            return new Map();
        }
    ]);

}).call(this);

/*
 !
 The MIT License

 Copyright (c) 2010-2013 Google, Inc. http://angularjs.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 angular-google-maps
 https://github.com/nlaplante/angular-google-maps

 @authors
 Nicolas Laplante - https://plus.google.com/108189012221374960701
 Nicholas McCready - https://twitter.com/nmccready
 */


/*
 Map marker directive

 This directive is used to create a marker on an existing map.
 This directive creates a new scope.

 {attribute coords required}  object containing latitude and longitude properties
 {attribute icon optional}    string url to image used for marker icon
 {attribute animate optional} if set to false, the marker won't be animated (on by default)
 */


(function() {
    angular.module("google-maps").directive("marker", [
        "$timeout", "Marker", function($timeout, Marker) {
            return new Marker($timeout);
        }
    ]);

}).call(this);

/*
 !
 The MIT License

 Copyright (c) 2010-2013 Google, Inc. http://angularjs.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 angular-google-maps
 https://github.com/nlaplante/angular-google-maps

 @authors
 Nicolas Laplante - https://plus.google.com/108189012221374960701
 Nicholas McCready - https://twitter.com/nmccready
 */


/*
 Map marker directive

 This directive is used to create a marker on an existing map.
 This directive creates a new scope.

 {attribute coords required}  object containing latitude and longitude properties
 {attribute icon optional}    string url to image used for marker icon
 {attribute animate optional} if set to false, the marker won't be animated (on by default)
 */


(function() {
    angular.module("google-maps").directive("markers", [
        "$timeout", "Markers", function($timeout, Markers) {
            return new Markers($timeout);
        }
    ]);

}).call(this);

/*
 !
 The MIT License

 Copyright (c) 2010-2013 Google, Inc. http://angularjs.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 angular-google-maps
 https://github.com/nlaplante/angular-google-maps

 @authors Bruno Queiroz, creativelikeadog@gmail.com
 */


/*
 Marker label directive

 This directive is used to create a marker label on an existing map.

 {attribute content required}  content of the label
 {attribute anchor required}    string that contains the x and y point position of the label
 {attribute class optional} class to DOM object
 {attribute style optional} style for the label
 */


/*
 Basic Directive api for a label. Basic in the sense that this directive contains 1:1 on scope and model.
 Thus there will be one html element per marker within the directive.
 */


(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    angular.module("google-maps").directive("markerLabel", [
        "$timeout", "ILabel", "MarkerLabelChildModel", "GmapUtil", function($timeout, ILabel, MarkerLabelChildModel, GmapUtil) {
            var Label;
            Label = (function(_super) {
                __extends(Label, _super);

                function Label($timeout) {
                    this.link = __bind(this.link, this);
                    var self;
                    Label.__super__.constructor.call(this, $timeout);
                    self = this;
                    this.require = '^marker';
                    this.template = '<span class="angular-google-maps-marker-label" ng-transclude></span>';
                    this.$log.info(this);
                }

                Label.prototype.link = function(scope, element, attrs, ctrl) {
                    var _this = this;
                    return this.$timeout(function() {
                        var label, markerCtrl;
                        markerCtrl = ctrl.getMarkerScope().gMarker;
                        if (markerCtrl != null) {
                            label = new MarkerLabelChildModel(markerCtrl, scope);
                        }
                        return scope.$on("$destroy", function() {
                            return label.destroy();
                        });
                    }, GmapUtil.defaultDelay + 25);
                };

                return Label;

            })(ILabel);
            return new Label($timeout);
        }
    ]);

}).call(this);
;/**
 * @name InfoBox
 * @version 1.1.12 [December 11, 2012]
 * @author Gary Little (inspired by proof-of-concept code from Pamela Fox of Google)
 * @copyright Copyright 2010 Gary Little [gary at luxcentral.com]
 * @fileoverview InfoBox extends the Google Maps JavaScript API V3 <tt>OverlayView</tt> class.
 *  <p>
 *  An InfoBox behaves like a <tt>google.maps.InfoWindow</tt>, but it supports several
 *  additional properties for advanced styling. An InfoBox can also be used as a map label.
 *  <p>
 *  An InfoBox also fires the same events as a <tt>google.maps.InfoWindow</tt>.
 */

/*!
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint browser:true */
/*global google */

/**
 * @name InfoBoxOptions
 * @class This class represents the optional parameter passed to the {@link InfoBox} constructor.
 * @property {string|Node} content The content of the InfoBox (plain text or an HTML DOM node).
 * @property {boolean} [disableAutoPan=false] Disable auto-pan on <tt>open</tt>.
 * @property {number} maxWidth The maximum width (in pixels) of the InfoBox. Set to 0 if no maximum.
 * @property {Size} pixelOffset The offset (in pixels) from the top left corner of the InfoBox
 *  (or the bottom left corner if the <code>alignBottom</code> property is <code>true</code>)
 *  to the map pixel corresponding to <tt>position</tt>.
 * @property {LatLng} position The geographic location at which to display the InfoBox.
 * @property {number} zIndex The CSS z-index style value for the InfoBox.
 *  Note: This value overrides a zIndex setting specified in the <tt>boxStyle</tt> property.
 * @property {string} [boxClass="infoBox"] The name of the CSS class defining the styles for the InfoBox container.
 * @property {Object} [boxStyle] An object literal whose properties define specific CSS
 *  style values to be applied to the InfoBox. Style values defined here override those that may
 *  be defined in the <code>boxClass</code> style sheet. If this property is changed after the
 *  InfoBox has been created, all previously set styles (except those defined in the style sheet)
 *  are removed from the InfoBox before the new style values are applied.
 * @property {string} closeBoxMargin The CSS margin style value for the close box.
 *  The default is "2px" (a 2-pixel margin on all sides).
 * @property {string} closeBoxURL The URL of the image representing the close box.
 *  Note: The default is the URL for Google's standard close box.
 *  Set this property to "" if no close box is required.
 * @property {Size} infoBoxClearance Minimum offset (in pixels) from the InfoBox to the
 *  map edge after an auto-pan.
 * @property {boolean} [isHidden=false] Hide the InfoBox on <tt>open</tt>.
 *  [Deprecated in favor of the <tt>visible</tt> property.]
 * @property {boolean} [visible=true] Show the InfoBox on <tt>open</tt>.
 * @property {boolean} alignBottom Align the bottom left corner of the InfoBox to the <code>position</code>
 *  location (default is <tt>false</tt> which means that the top left corner of the InfoBox is aligned).
 * @property {string} pane The pane where the InfoBox is to appear (default is "floatPane").
 *  Set the pane to "mapPane" if the InfoBox is being used as a map label.
 *  Valid pane names are the property names for the <tt>google.maps.MapPanes</tt> object.
 * @property {boolean} enableEventPropagation Propagate mousedown, mousemove, mouseover, mouseout,
 *  mouseup, click, dblclick, touchstart, touchend, touchmove, and contextmenu events in the InfoBox
 *  (default is <tt>false</tt> to mimic the behavior of a <tt>google.maps.InfoWindow</tt>). Set
 *  this property to <tt>true</tt> if the InfoBox is being used as a map label.
 */

/**
 * Creates an InfoBox with the options specified in {@link InfoBoxOptions}.
 *  Call <tt>InfoBox.open</tt> to add the box to the map.
 * @constructor
 * @param {InfoBoxOptions} [opt_opts]
 */
function InfoBox(opt_opts) {

    opt_opts = opt_opts || {};

    google.maps.OverlayView.apply(this, arguments);

    // Standard options (in common with google.maps.InfoWindow):
    //
    this.content_ = opt_opts.content || "";
    this.disableAutoPan_ = opt_opts.disableAutoPan || false;
    this.maxWidth_ = opt_opts.maxWidth || 0;
    this.pixelOffset_ = opt_opts.pixelOffset || new google.maps.Size(0, 0);
    this.position_ = opt_opts.position || new google.maps.LatLng(0, 0);
    this.zIndex_ = opt_opts.zIndex || null;

    // Additional options (unique to InfoBox):
    //
    this.boxClass_ = opt_opts.boxClass || "infoBox";
    this.boxStyle_ = opt_opts.boxStyle || {};
    this.closeBoxMargin_ = opt_opts.closeBoxMargin || "2px";
    this.closeBoxURL_ = opt_opts.closeBoxURL || "http://www.google.com/intl/en_us/mapfiles/close.gif";
    if (opt_opts.closeBoxURL === "") {
        this.closeBoxURL_ = "";
    }
    this.infoBoxClearance_ = opt_opts.infoBoxClearance || new google.maps.Size(1, 1);

    if (typeof opt_opts.visible === "undefined") {
        if (typeof opt_opts.isHidden === "undefined") {
            opt_opts.visible = true;
        } else {
            opt_opts.visible = !opt_opts.isHidden;
        }
    }
    this.isHidden_ = !opt_opts.visible;

    this.alignBottom_ = opt_opts.alignBottom || false;
    this.pane_ = opt_opts.pane || "floatPane";
    this.enableEventPropagation_ = opt_opts.enableEventPropagation || false;

    this.div_ = null;
    this.closeListener_ = null;
    this.moveListener_ = null;
    this.contextListener_ = null;
    this.eventListeners_ = null;
    this.fixedWidthSet_ = null;
}

/* InfoBox extends OverlayView in the Google Maps API v3.
 */
InfoBox.prototype = new google.maps.OverlayView();

/**
 * Creates the DIV representing the InfoBox.
 * @private
 */
InfoBox.prototype.createInfoBoxDiv_ = function () {

    var i;
    var events;
    var bw;
    var me = this;

    // This handler prevents an event in the InfoBox from being passed on to the map.
    //
    var cancelHandler = function (e) {
        e.cancelBubble = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    };

    // This handler ignores the current event in the InfoBox and conditionally prevents
    // the event from being passed on to the map. It is used for the contextmenu event.
    //
    var ignoreHandler = function (e) {

        e.returnValue = false;

        if (e.preventDefault) {

            e.preventDefault();
        }

        if (!me.enableEventPropagation_) {

            cancelHandler(e);
        }
    };

    if (!this.div_) {

        this.div_ = document.createElement("div");

        this.setBoxStyle_();

        if (typeof this.content_.nodeType === "undefined") {
            this.div_.innerHTML = this.getCloseBoxImg_() + this.content_;
        } else {
            this.div_.innerHTML = this.getCloseBoxImg_();
            this.div_.appendChild(this.content_);
        }

        // Add the InfoBox DIV to the DOM
        this.getPanes()[this.pane_].appendChild(this.div_);

        this.addClickHandler_();

        if (this.div_.style.width) {

            this.fixedWidthSet_ = true;

        } else {

            if (this.maxWidth_ !== 0 && this.div_.offsetWidth > this.maxWidth_) {

                this.div_.style.width = this.maxWidth_;
                this.div_.style.overflow = "auto";
                this.fixedWidthSet_ = true;

            } else { // The following code is needed to overcome problems with MSIE

                bw = this.getBoxWidths_();

                this.div_.style.width = (this.div_.offsetWidth - bw.left - bw.right) + "px";
                this.fixedWidthSet_ = false;
            }
        }

        this.panBox_(this.disableAutoPan_);

        if (!this.enableEventPropagation_) {

            this.eventListeners_ = [];

            // Cancel event propagation.
            //
            // Note: mousemove not included (to resolve Issue 152)
            events = ["mousedown", "mouseover", "mouseout", "mouseup",
                "click", "dblclick", "touchstart", "touchend", "touchmove"];

            for (i = 0; i < events.length; i++) {

                this.eventListeners_.push(google.maps.event.addDomListener(this.div_, events[i], cancelHandler));
            }

            // Workaround for Google bug that causes the cursor to change to a pointer
            // when the mouse moves over a marker underneath InfoBox.
            this.eventListeners_.push(google.maps.event.addDomListener(this.div_, "mouseover", function (e) {
                this.style.cursor = "default";
            }));
        }

        this.contextListener_ = google.maps.event.addDomListener(this.div_, "contextmenu", ignoreHandler);

        /**
         * This event is fired when the DIV containing the InfoBox's content is attached to the DOM.
         * @name InfoBox#domready
         * @event
         */
        google.maps.event.trigger(this, "domready");
    }
};

/**
 * Returns the HTML <IMG> tag for the close box.
 * @private
 */
InfoBox.prototype.getCloseBoxImg_ = function () {

    var img = "";

    if (this.closeBoxURL_ !== "") {

        img  = "<img";
        img += " src='" + this.closeBoxURL_ + "'";
        img += " align=right"; // Do this because Opera chokes on style='float: right;'
        img += " style='";
        img += " position: relative;"; // Required by MSIE
        img += " cursor: pointer;";
        img += " margin: " + this.closeBoxMargin_ + ";";
        img += "'>";
    }

    return img;
};

/**
 * Adds the click handler to the InfoBox close box.
 * @private
 */
InfoBox.prototype.addClickHandler_ = function () {

    var closeBox;

    if (this.closeBoxURL_ !== "") {

        closeBox = this.div_.firstChild;
        this.closeListener_ = google.maps.event.addDomListener(closeBox, "click", this.getCloseClickHandler_());

    } else {

        this.closeListener_ = null;
    }
};

/**
 * Returns the function to call when the user clicks the close box of an InfoBox.
 * @private
 */
InfoBox.prototype.getCloseClickHandler_ = function () {

    var me = this;

    return function (e) {

        // 1.0.3 fix: Always prevent propagation of a close box click to the map:
        e.cancelBubble = true;

        if (e.stopPropagation) {

            e.stopPropagation();
        }

        /**
         * This event is fired when the InfoBox's close box is clicked.
         * @name InfoBox#closeclick
         * @event
         */
        google.maps.event.trigger(me, "closeclick");

        me.close();
    };
};

/**
 * Pans the map so that the InfoBox appears entirely within the map's visible area.
 * @private
 */
InfoBox.prototype.panBox_ = function (disablePan) {

    var map;
    var bounds;
    var xOffset = 0, yOffset = 0;

    if (!disablePan) {

        map = this.getMap();

        if (map instanceof google.maps.Map) { // Only pan if attached to map, not panorama

            if (!map.getBounds().contains(this.position_)) {
                // Marker not in visible area of map, so set center
                // of map to the marker position first.
                map.setCenter(this.position_);
            }

            bounds = map.getBounds();

            var mapDiv = map.getDiv();
            var mapWidth = mapDiv.offsetWidth;
            var mapHeight = mapDiv.offsetHeight;
            var iwOffsetX = this.pixelOffset_.width;
            var iwOffsetY = this.pixelOffset_.height;
            var iwWidth = this.div_.offsetWidth;
            var iwHeight = this.div_.offsetHeight;
            var padX = this.infoBoxClearance_.width;
            var padY = this.infoBoxClearance_.height;
            var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.position_);

            if (pixPosition.x < (-iwOffsetX + padX)) {
                xOffset = pixPosition.x + iwOffsetX - padX;
            } else if ((pixPosition.x + iwWidth + iwOffsetX + padX) > mapWidth) {
                xOffset = pixPosition.x + iwWidth + iwOffsetX + padX - mapWidth;
            }
            if (this.alignBottom_) {
                if (pixPosition.y < (-iwOffsetY + padY + iwHeight)) {
                    yOffset = pixPosition.y + iwOffsetY - padY - iwHeight;
                } else if ((pixPosition.y + iwOffsetY + padY) > mapHeight) {
                    yOffset = pixPosition.y + iwOffsetY + padY - mapHeight;
                }
            } else {
                if (pixPosition.y < (-iwOffsetY + padY)) {
                    yOffset = pixPosition.y + iwOffsetY - padY;
                } else if ((pixPosition.y + iwHeight + iwOffsetY + padY) > mapHeight) {
                    yOffset = pixPosition.y + iwHeight + iwOffsetY + padY - mapHeight;
                }
            }

            if (!(xOffset === 0 && yOffset === 0)) {

                // Move the map to the shifted center.
                //
                var c = map.getCenter();
                map.panBy(xOffset, yOffset);
            }
        }
    }
};

/**
 * Sets the style of the InfoBox by setting the style sheet and applying
 * other specific styles requested.
 * @private
 */
InfoBox.prototype.setBoxStyle_ = function () {

    var i, boxStyle;

    if (this.div_) {

        // Apply style values from the style sheet defined in the boxClass parameter:
        this.div_.className = this.boxClass_;

        // Clear existing inline style values:
        this.div_.style.cssText = "";

        // Apply style values defined in the boxStyle parameter:
        boxStyle = this.boxStyle_;
        for (i in boxStyle) {

            if (boxStyle.hasOwnProperty(i)) {

                this.div_.style[i] = boxStyle[i];
            }
        }

        // Fix up opacity style for benefit of MSIE:
        //
        if (typeof this.div_.style.opacity !== "undefined" && this.div_.style.opacity !== "") {

            this.div_.style.filter = "alpha(opacity=" + (this.div_.style.opacity * 100) + ")";
        }

        // Apply required styles:
        //
        this.div_.style.position = "absolute";
        this.div_.style.visibility = 'hidden';
        if (this.zIndex_ !== null) {

            this.div_.style.zIndex = this.zIndex_;
        }
    }
};

/**
 * Get the widths of the borders of the InfoBox.
 * @private
 * @return {Object} widths object (top, bottom left, right)
 */
InfoBox.prototype.getBoxWidths_ = function () {

    var computedStyle;
    var bw = {top: 0, bottom: 0, left: 0, right: 0};
    var box = this.div_;

    if (document.defaultView && document.defaultView.getComputedStyle) {

        computedStyle = box.ownerDocument.defaultView.getComputedStyle(box, "");

        if (computedStyle) {

            // The computed styles are always in pixel units (good!)
            bw.top = parseInt(computedStyle.borderTopWidth, 10) || 0;
            bw.bottom = parseInt(computedStyle.borderBottomWidth, 10) || 0;
            bw.left = parseInt(computedStyle.borderLeftWidth, 10) || 0;
            bw.right = parseInt(computedStyle.borderRightWidth, 10) || 0;
        }

    } else if (document.documentElement.currentStyle) { // MSIE

        if (box.currentStyle) {

            // The current styles may not be in pixel units, but assume they are (bad!)
            bw.top = parseInt(box.currentStyle.borderTopWidth, 10) || 0;
            bw.bottom = parseInt(box.currentStyle.borderBottomWidth, 10) || 0;
            bw.left = parseInt(box.currentStyle.borderLeftWidth, 10) || 0;
            bw.right = parseInt(box.currentStyle.borderRightWidth, 10) || 0;
        }
    }

    return bw;
};

/**
 * Invoked when <tt>close</tt> is called. Do not call it directly.
 */
InfoBox.prototype.onRemove = function () {

    if (this.div_) {

        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
    }
};

/**
 * Draws the InfoBox based on the current map projection and zoom level.
 */
InfoBox.prototype.draw = function () {

    this.createInfoBoxDiv_();

    var pixPosition = this.getProjection().fromLatLngToDivPixel(this.position_);

    this.div_.style.left = (pixPosition.x + this.pixelOffset_.width) + "px";

    if (this.alignBottom_) {
        this.div_.style.bottom = -(pixPosition.y + this.pixelOffset_.height) + "px";
    } else {
        this.div_.style.top = (pixPosition.y + this.pixelOffset_.height) + "px";
    }

    if (this.isHidden_) {

        this.div_.style.visibility = 'hidden';

    } else {

        this.div_.style.visibility = "visible";
    }
};

/**
 * Sets the options for the InfoBox. Note that changes to the <tt>maxWidth</tt>,
 *  <tt>closeBoxMargin</tt>, <tt>closeBoxURL</tt>, and <tt>enableEventPropagation</tt>
 *  properties have no affect until the current InfoBox is <tt>close</tt>d and a new one
 *  is <tt>open</tt>ed.
 * @param {InfoBoxOptions} opt_opts
 */
InfoBox.prototype.setOptions = function (opt_opts) {
    if (typeof opt_opts.boxClass !== "undefined") { // Must be first

        this.boxClass_ = opt_opts.boxClass;
        this.setBoxStyle_();
    }
    if (typeof opt_opts.boxStyle !== "undefined") { // Must be second

        this.boxStyle_ = opt_opts.boxStyle;
        this.setBoxStyle_();
    }
    if (typeof opt_opts.content !== "undefined") {

        this.setContent(opt_opts.content);
    }
    if (typeof opt_opts.disableAutoPan !== "undefined") {

        this.disableAutoPan_ = opt_opts.disableAutoPan;
    }
    if (typeof opt_opts.maxWidth !== "undefined") {

        this.maxWidth_ = opt_opts.maxWidth;
    }
    if (typeof opt_opts.pixelOffset !== "undefined") {

        this.pixelOffset_ = opt_opts.pixelOffset;
    }
    if (typeof opt_opts.alignBottom !== "undefined") {

        this.alignBottom_ = opt_opts.alignBottom;
    }
    if (typeof opt_opts.position !== "undefined") {

        this.setPosition(opt_opts.position);
    }
    if (typeof opt_opts.zIndex !== "undefined") {

        this.setZIndex(opt_opts.zIndex);
    }
    if (typeof opt_opts.closeBoxMargin !== "undefined") {

        this.closeBoxMargin_ = opt_opts.closeBoxMargin;
    }
    if (typeof opt_opts.closeBoxURL !== "undefined") {

        this.closeBoxURL_ = opt_opts.closeBoxURL;
    }
    if (typeof opt_opts.infoBoxClearance !== "undefined") {

        this.infoBoxClearance_ = opt_opts.infoBoxClearance;
    }
    if (typeof opt_opts.isHidden !== "undefined") {

        this.isHidden_ = opt_opts.isHidden;
    }
    if (typeof opt_opts.visible !== "undefined") {

        this.isHidden_ = !opt_opts.visible;
    }
    if (typeof opt_opts.enableEventPropagation !== "undefined") {

        this.enableEventPropagation_ = opt_opts.enableEventPropagation;
    }

    if (this.div_) {

        this.draw();
    }
};

/**
 * Sets the content of the InfoBox.
 *  The content can be plain text or an HTML DOM node.
 * @param {string|Node} content
 */
InfoBox.prototype.setContent = function (content) {
    this.content_ = content;

    if (this.div_) {

        if (this.closeListener_) {

            google.maps.event.removeListener(this.closeListener_);
            this.closeListener_ = null;
        }

        // Odd code required to make things work with MSIE.
        //
        if (!this.fixedWidthSet_) {

            this.div_.style.width = "";
        }

        if (typeof content.nodeType === "undefined") {
            this.div_.innerHTML = this.getCloseBoxImg_() + content;
        } else {
            this.div_.innerHTML = this.getCloseBoxImg_();
            this.div_.appendChild(content);
        }

        // Perverse code required to make things work with MSIE.
        // (Ensures the close box does, in fact, float to the right.)
        //
        if (!this.fixedWidthSet_) {
            this.div_.style.width = this.div_.offsetWidth + "px";
            if (typeof content.nodeType === "undefined") {
                this.div_.innerHTML = this.getCloseBoxImg_() + content;
            } else {
                this.div_.innerHTML = this.getCloseBoxImg_();
                this.div_.appendChild(content);
            }
        }

        this.addClickHandler_();
    }

    /**
     * This event is fired when the content of the InfoBox changes.
     * @name InfoBox#content_changed
     * @event
     */
    google.maps.event.trigger(this, "content_changed");
};

/**
 * Sets the geographic location of the InfoBox.
 * @param {LatLng} latlng
 */
InfoBox.prototype.setPosition = function (latlng) {

    this.position_ = latlng;

    if (this.div_) {

        this.draw();
    }

    /**
     * This event is fired when the position of the InfoBox changes.
     * @name InfoBox#position_changed
     * @event
     */
    google.maps.event.trigger(this, "position_changed");
};

/**
 * Sets the zIndex style for the InfoBox.
 * @param {number} index
 */
InfoBox.prototype.setZIndex = function (index) {

    this.zIndex_ = index;

    if (this.div_) {

        this.div_.style.zIndex = index;
    }

    /**
     * This event is fired when the zIndex of the InfoBox changes.
     * @name InfoBox#zindex_changed
     * @event
     */
    google.maps.event.trigger(this, "zindex_changed");
};

/**
 * Sets the visibility of the InfoBox.
 * @param {boolean} isVisible
 */
InfoBox.prototype.setVisible = function (isVisible) {

    this.isHidden_ = !isVisible;
    if (this.div_) {
        this.div_.style.visibility = (this.isHidden_ ? "hidden" : "visible");
    }
};

/**
 * Returns the content of the InfoBox.
 * @returns {string}
 */
InfoBox.prototype.getContent = function () {

    return this.content_;
};

/**
 * Returns the geographic location of the InfoBox.
 * @returns {LatLng}
 */
InfoBox.prototype.getPosition = function () {

    return this.position_;
};

/**
 * Returns the zIndex for the InfoBox.
 * @returns {number}
 */
InfoBox.prototype.getZIndex = function () {

    return this.zIndex_;
};

/**
 * Returns a flag indicating whether the InfoBox is visible.
 * @returns {boolean}
 */
InfoBox.prototype.getVisible = function () {

    var isVisible;

    if ((typeof this.getMap() === "undefined") || (this.getMap() === null)) {
        isVisible = false;
    } else {
        isVisible = !this.isHidden_;
    }
    return isVisible;
};

/**
 * Shows the InfoBox. [Deprecated; use <tt>setVisible</tt> instead.]
 */
InfoBox.prototype.show = function () {

    this.isHidden_ = false;
    if (this.div_) {
        this.div_.style.visibility = "visible";
    }
};

/**
 * Hides the InfoBox. [Deprecated; use <tt>setVisible</tt> instead.]
 */
InfoBox.prototype.hide = function () {

    this.isHidden_ = true;
    if (this.div_) {
        this.div_.style.visibility = "hidden";
    }
};

/**
 * Adds the InfoBox to the specified map or Street View panorama. If <tt>anchor</tt>
 *  (usually a <tt>google.maps.Marker</tt>) is specified, the position
 *  of the InfoBox is set to the position of the <tt>anchor</tt>. If the
 *  anchor is dragged to a new location, the InfoBox moves as well.
 * @param {Map|StreetViewPanorama} map
 * @param {MVCObject} [anchor]
 */
InfoBox.prototype.open = function (map, anchor) {

    var me = this;

    if (anchor) {

        this.position_ = anchor.getPosition();
        this.moveListener_ = google.maps.event.addListener(anchor, "position_changed", function () {
            me.setPosition(this.getPosition());
        });
    }

    this.setMap(map);

    if (this.div_) {

        this.panBox_();
    }
};

/**
 * Removes the InfoBox from the map.
 */
InfoBox.prototype.close = function () {

    var i;

    if (this.closeListener_) {

        google.maps.event.removeListener(this.closeListener_);
        this.closeListener_ = null;
    }

    if (this.eventListeners_) {

        for (i = 0; i < this.eventListeners_.length; i++) {

            google.maps.event.removeListener(this.eventListeners_[i]);
        }
        this.eventListeners_ = null;
    }

    if (this.moveListener_) {

        google.maps.event.removeListener(this.moveListener_);
        this.moveListener_ = null;
    }

    if (this.contextListener_) {

        google.maps.event.removeListener(this.contextListener_);
        this.contextListener_ = null;
    }

    this.setMap(null);
};;/**
 * @name MarkerClustererPlus for Google Maps V3
 * @version 2.1.1 [November 4, 2013]
 * @author Gary Little
 * @fileoverview
 * The library creates and manages per-zoom-level clusters for large amounts of markers.
 * <p>
 * This is an enhanced V3 implementation of the
 * <a href="http://gmaps-utility-library-dev.googlecode.com/svn/tags/markerclusterer/"
 * >V2 MarkerClusterer</a> by Xiaoxi Wu. It is based on the
 * <a href="http://google-maps-utility-library-v3.googlecode.com/svn/tags/markerclusterer/"
 * >V3 MarkerClusterer</a> port by Luke Mahe. MarkerClustererPlus was created by Gary Little.
 * <p>
 * v2.0 release: MarkerClustererPlus v2.0 is backward compatible with MarkerClusterer v1.0. It
 *  adds support for the <code>ignoreHidden</code>, <code>title</code>, <code>batchSizeIE</code>,
 *  and <code>calculator</code> properties as well as support for four more events. It also allows
 *  greater control over the styling of the text that appears on the cluster marker. The
 *  documentation has been significantly improved and the overall code has been simplified and
 *  polished. Very large numbers of markers can now be managed without causing Javascript timeout
 *  errors on Internet Explorer. Note that the name of the <code>clusterclick</code> event has been
 *  deprecated. The new name is <code>click</code>, so please change your application code now.
 */

/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * @name ClusterIconStyle
 * @class This class represents the object for values in the <code>styles</code> array passed
 *  to the {@link MarkerClusterer} constructor. The element in this array that is used to
 *  style the cluster icon is determined by calling the <code>calculator</code> function.
 *
 * @property {string} url The URL of the cluster icon image file. Required.
 * @property {number} height The display height (in pixels) of the cluster icon. Required.
 * @property {number} width The display width (in pixels) of the cluster icon. Required.
 * @property {Array} [anchorText] The position (in pixels) from the center of the cluster icon to
 *  where the text label is to be centered and drawn. The format is <code>[yoffset, xoffset]</code>
 *  where <code>yoffset</code> increases as you go down from center and <code>xoffset</code>
 *  increases to the right of center. The default is <code>[0, 0]</code>.
 * @property {Array} [anchorIcon] The anchor position (in pixels) of the cluster icon. This is the
 *  spot on the cluster icon that is to be aligned with the cluster position. The format is
 *  <code>[yoffset, xoffset]</code> where <code>yoffset</code> increases as you go down and
 *  <code>xoffset</code> increases to the right of the top-left corner of the icon. The default
 *  anchor position is the center of the cluster icon.
 * @property {string} [textColor="black"] The color of the label text shown on the
 *  cluster icon.
 * @property {number} [textSize=11] The size (in pixels) of the label text shown on the
 *  cluster icon.
 * @property {string} [textDecoration="none"] The value of the CSS <code>text-decoration</code>
 *  property for the label text shown on the cluster icon.
 * @property {string} [fontWeight="bold"] The value of the CSS <code>font-weight</code>
 *  property for the label text shown on the cluster icon.
 * @property {string} [fontStyle="normal"] The value of the CSS <code>font-style</code>
 *  property for the label text shown on the cluster icon.
 * @property {string} [fontFamily="Arial,sans-serif"] The value of the CSS <code>font-family</code>
 *  property for the label text shown on the cluster icon.
 * @property {string} [backgroundPosition="0 0"] The position of the cluster icon image
 *  within the image defined by <code>url</code>. The format is <code>"xpos ypos"</code>
 *  (the same format as for the CSS <code>background-position</code> property). You must set
 *  this property appropriately when the image defined by <code>url</code> represents a sprite
 *  containing multiple images. Note that the position <i>must</i> be specified in px units.
 */
/**
 * @name ClusterIconInfo
 * @class This class is an object containing general information about a cluster icon. This is
 *  the object that a <code>calculator</code> function returns.
 *
 * @property {string} text The text of the label to be shown on the cluster icon.
 * @property {number} index The index plus 1 of the element in the <code>styles</code>
 *  array to be used to style the cluster icon.
 * @property {string} title The tooltip to display when the mouse moves over the cluster icon.
 *  If this value is <code>undefined</code> or <code>""</code>, <code>title</code> is set to the
 *  value of the <code>title</code> property passed to the MarkerClusterer.
 */
/**
 * A cluster icon.
 *
 * @constructor
 * @extends google.maps.OverlayView
 * @param {Cluster} cluster The cluster with which the icon is to be associated.
 * @param {Array} [styles] An array of {@link ClusterIconStyle} defining the cluster icons
 *  to use for various cluster sizes.
 * @private
 */
function ClusterIcon(cluster, styles) {
    cluster.getMarkerClusterer().extend(ClusterIcon, google.maps.OverlayView);

    this.cluster_ = cluster;
    this.className_ = cluster.getMarkerClusterer().getClusterClass();
    this.styles_ = styles;
    this.center_ = null;
    this.div_ = null;
    this.sums_ = null;
    this.visible_ = false;

    this.setMap(cluster.getMap()); // Note: this causes onAdd to be called
}


/**
 * Adds the icon to the DOM.
 */
ClusterIcon.prototype.onAdd = function () {
    var cClusterIcon = this;
    var cMouseDownInCluster;
    var cDraggingMapByCluster;

    this.div_ = document.createElement("div");
    this.div_.className = this.className_;
    if (this.visible_) {
        this.show();
    }

    this.getPanes().overlayMouseTarget.appendChild(this.div_);

    // Fix for Issue 157
    this.boundsChangedListener_ = google.maps.event.addListener(this.getMap(), "bounds_changed", function () {
        cDraggingMapByCluster = cMouseDownInCluster;
    });

    google.maps.event.addDomListener(this.div_, "mousedown", function () {
        cMouseDownInCluster = true;
        cDraggingMapByCluster = false;
    });

    google.maps.event.addDomListener(this.div_, "click", function (e) {
        cMouseDownInCluster = false;
        if (!cDraggingMapByCluster) {
            var theBounds;
            var mz;
            var mc = cClusterIcon.cluster_.getMarkerClusterer();
            /**
             * This event is fired when a cluster marker is clicked.
             * @name MarkerClusterer#click
             * @param {Cluster} c The cluster that was clicked.
             * @event
             */
            google.maps.event.trigger(mc, "click", cClusterIcon.cluster_);
            google.maps.event.trigger(mc, "clusterclick", cClusterIcon.cluster_); // deprecated name

            // The default click handler follows. Disable it by setting
            // the zoomOnClick property to false.
            if (mc.getZoomOnClick()) {
                // Zoom into the cluster.
                mz = mc.getMaxZoom();
                theBounds = cClusterIcon.cluster_.getBounds();
                mc.getMap().fitBounds(theBounds);
                // There is a fix for Issue 170 here:
                setTimeout(function () {
                    mc.getMap().fitBounds(theBounds);
                    // Don't zoom beyond the max zoom level
                    if (mz !== null && (mc.getMap().getZoom() > mz)) {
                        mc.getMap().setZoom(mz + 1);
                    }
                }, 100);
            }

            // Prevent event propagation to the map:
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
        }
    });

    google.maps.event.addDomListener(this.div_, "mouseover", function () {
        var mc = cClusterIcon.cluster_.getMarkerClusterer();
        /**
         * This event is fired when the mouse moves over a cluster marker.
         * @name MarkerClusterer#mouseover
         * @param {Cluster} c The cluster that the mouse moved over.
         * @event
         */
        google.maps.event.trigger(mc, "mouseover", cClusterIcon.cluster_);
    });

    google.maps.event.addDomListener(this.div_, "mouseout", function () {
        var mc = cClusterIcon.cluster_.getMarkerClusterer();
        /**
         * This event is fired when the mouse moves out of a cluster marker.
         * @name MarkerClusterer#mouseout
         * @param {Cluster} c The cluster that the mouse moved out of.
         * @event
         */
        google.maps.event.trigger(mc, "mouseout", cClusterIcon.cluster_);
    });
};


/**
 * Removes the icon from the DOM.
 */
ClusterIcon.prototype.onRemove = function () {
    if (this.div_ && this.div_.parentNode) {
        this.hide();
        google.maps.event.removeListener(this.boundsChangedListener_);
        google.maps.event.clearInstanceListeners(this.div_);
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
    }
};


/**
 * Draws the icon.
 */
ClusterIcon.prototype.draw = function () {
    if (this.visible_) {
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.top = pos.y + "px";
        this.div_.style.left = pos.x + "px";
    }
};


/**
 * Hides the icon.
 */
ClusterIcon.prototype.hide = function () {
    if (this.div_) {
        this.div_.style.display = "none";
    }
    this.visible_ = false;
};


/**
 * Positions and shows the icon.
 */
ClusterIcon.prototype.show = function () {
    if (this.div_) {
        var img = "";
        // NOTE: values must be specified in px units
        var bp = this.backgroundPosition_.split(" ");
        var spriteH = parseInt(bp[0].trim(), 10);
        var spriteV = parseInt(bp[1].trim(), 10);
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.cssText = this.createCss(pos);
        img = "<img src='" + this.url_ + "' style='position: absolute; top: " + spriteV + "px; left: " + spriteH + "px; ";
        if (!this.cluster_.getMarkerClusterer().enableRetinaIcons_) {
            img += "clip: rect(" + (-1 * spriteV) + "px, " + ((-1 * spriteH) + this.width_) + "px, " +
                ((-1 * spriteV) + this.height_) + "px, " + (-1 * spriteH) + "px);";
        }
        img += "'>";
        this.div_.innerHTML = img + "<div style='" +
            "position: absolute;" +
            "top: " + this.anchorText_[0] + "px;" +
            "left: " + this.anchorText_[1] + "px;" +
            "color: " + this.textColor_ + ";" +
            "font-size: " + this.textSize_ + "px;" +
            "font-family: " + this.fontFamily_ + ";" +
            "font-weight: " + this.fontWeight_ + ";" +
            "font-style: " + this.fontStyle_ + ";" +
            "text-decoration: " + this.textDecoration_ + ";" +
            "text-align: center;" +
            "width: " + this.width_ + "px;" +
            "line-height:" + this.height_ + "px;" +
            "'>" + this.sums_.text + "</div>";
        if (typeof this.sums_.title === "undefined" || this.sums_.title === "") {
            this.div_.title = this.cluster_.getMarkerClusterer().getTitle();
        } else {
            this.div_.title = this.sums_.title;
        }
        this.div_.style.display = "";
    }
    this.visible_ = true;
};


/**
 * Sets the icon styles to the appropriate element in the styles array.
 *
 * @param {ClusterIconInfo} sums The icon label text and styles index.
 */
ClusterIcon.prototype.useStyle = function (sums) {
    this.sums_ = sums;
    var index = Math.max(0, sums.index - 1);
    index = Math.min(this.styles_.length - 1, index);
    var style = this.styles_[index];
    this.url_ = style.url;
    this.height_ = style.height;
    this.width_ = style.width;
    this.anchorText_ = style.anchorText || [0, 0];
    this.anchorIcon_ = style.anchorIcon || [parseInt(this.height_ / 2, 10), parseInt(this.width_ / 2, 10)];
    this.textColor_ = style.textColor || "black";
    this.textSize_ = style.textSize || 11;
    this.textDecoration_ = style.textDecoration || "none";
    this.fontWeight_ = style.fontWeight || "bold";
    this.fontStyle_ = style.fontStyle || "normal";
    this.fontFamily_ = style.fontFamily || "Arial,sans-serif";
    this.backgroundPosition_ = style.backgroundPosition || "0 0";
};


/**
 * Sets the position at which to center the icon.
 *
 * @param {google.maps.LatLng} center The latlng to set as the center.
 */
ClusterIcon.prototype.setCenter = function (center) {
    this.center_ = center;
};


/**
 * Creates the cssText style parameter based on the position of the icon.
 *
 * @param {google.maps.Point} pos The position of the icon.
 * @return {string} The CSS style text.
 */
ClusterIcon.prototype.createCss = function (pos) {
    var style = [];
    style.push("cursor: pointer;");
    style.push("position: absolute; top: " + pos.y + "px; left: " + pos.x + "px;");
    style.push("width: " + this.width_ + "px; height: " + this.height_ + "px;");
    return style.join("");
};


/**
 * Returns the position at which to place the DIV depending on the latlng.
 *
 * @param {google.maps.LatLng} latlng The position in latlng.
 * @return {google.maps.Point} The position in pixels.
 */
ClusterIcon.prototype.getPosFromLatLng_ = function (latlng) {
    var pos = this.getProjection().fromLatLngToDivPixel(latlng);
    pos.x -= this.anchorIcon_[1];
    pos.y -= this.anchorIcon_[0];
    pos.x = parseInt(pos.x, 10);
    pos.y = parseInt(pos.y, 10);
    return pos;
};


/**
 * Creates a single cluster that manages a group of proximate markers.
 *  Used internally, do not call this constructor directly.
 * @constructor
 * @param {MarkerClusterer} mc The <code>MarkerClusterer</code> object with which this
 *  cluster is associated.
 */
function Cluster(mc) {
    this.markerClusterer_ = mc;
    this.map_ = mc.getMap();
    this.gridSize_ = mc.getGridSize();
    this.minClusterSize_ = mc.getMinimumClusterSize();
    this.averageCenter_ = mc.getAverageCenter();
    this.markers_ = [];
    this.center_ = null;
    this.bounds_ = null;
    this.clusterIcon_ = new ClusterIcon(this, mc.getStyles());
}


/**
 * Returns the number of markers managed by the cluster. You can call this from
 * a <code>click</code>, <code>mouseover</code>, or <code>mouseout</code> event handler
 * for the <code>MarkerClusterer</code> object.
 *
 * @return {number} The number of markers in the cluster.
 */
Cluster.prototype.getSize = function () {
    return this.markers_.length;
};


/**
 * Returns the array of markers managed by the cluster. You can call this from
 * a <code>click</code>, <code>mouseover</code>, or <code>mouseout</code> event handler
 * for the <code>MarkerClusterer</code> object.
 *
 * @return {Array} The array of markers in the cluster.
 */
Cluster.prototype.getMarkers = function () {
    return this.markers_;
};


/**
 * Returns the center of the cluster. You can call this from
 * a <code>click</code>, <code>mouseover</code>, or <code>mouseout</code> event handler
 * for the <code>MarkerClusterer</code> object.
 *
 * @return {google.maps.LatLng} The center of the cluster.
 */
Cluster.prototype.getCenter = function () {
    return this.center_;
};


/**
 * Returns the map with which the cluster is associated.
 *
 * @return {google.maps.Map} The map.
 * @ignore
 */
Cluster.prototype.getMap = function () {
    return this.map_;
};


/**
 * Returns the <code>MarkerClusterer</code> object with which the cluster is associated.
 *
 * @return {MarkerClusterer} The associated marker clusterer.
 * @ignore
 */
Cluster.prototype.getMarkerClusterer = function () {
    return this.markerClusterer_;
};


/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 * @ignore
 */
Cluster.prototype.getBounds = function () {
    var i;
    var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
    var markers = this.getMarkers();
    for (i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }
    return bounds;
};


/**
 * Removes the cluster from the map.
 *
 * @ignore
 */
Cluster.prototype.remove = function () {
    this.clusterIcon_.setMap(null);
    this.markers_ = [];
    delete this.markers_;
};


/**
 * Adds a marker to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to be added.
 * @return {boolean} True if the marker was added.
 * @ignore
 */
Cluster.prototype.addMarker = function (marker) {
    var i;
    var mCount;
    var mz;

    if (this.isMarkerAlreadyAdded_(marker)) {
        return false;
    }

    if (!this.center_) {
        this.center_ = marker.getPosition();
        this.calculateBounds_();
    } else {
        if (this.averageCenter_) {
            var l = this.markers_.length + 1;
            var lat = (this.center_.lat() * (l - 1) + marker.getPosition().lat()) / l;
            var lng = (this.center_.lng() * (l - 1) + marker.getPosition().lng()) / l;
            this.center_ = new google.maps.LatLng(lat, lng);
            this.calculateBounds_();
        }
    }

    marker.isAdded = true;
    this.markers_.push(marker);

    mCount = this.markers_.length;
    mz = this.markerClusterer_.getMaxZoom();
    if (mz !== null && this.map_.getZoom() > mz) {
        // Zoomed in past max zoom, so show the marker.
        if (marker.getMap() !== this.map_) {
            marker.setMap(this.map_);
        }
    } else if (mCount < this.minClusterSize_) {
        // Min cluster size not reached so show the marker.
        if (marker.getMap() !== this.map_) {
            marker.setMap(this.map_);
        }
    } else if (mCount === this.minClusterSize_) {
        // Hide the markers that were showing.
        for (i = 0; i < mCount; i++) {
            this.markers_[i].setMap(null);
        }
    } else {
        marker.setMap(null);
    }

    this.updateIcon_();
    return true;
};


/**
 * Determines if a marker lies within the cluster's bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 * @ignore
 */
Cluster.prototype.isMarkerInClusterBounds = function (marker) {
    return this.bounds_.contains(marker.getPosition());
};


/**
 * Calculates the extended bounds of the cluster with the grid.
 */
Cluster.prototype.calculateBounds_ = function () {
    var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
    this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
};


/**
 * Updates the cluster icon.
 */
Cluster.prototype.updateIcon_ = function () {
    var mCount = this.markers_.length;
    var mz = this.markerClusterer_.getMaxZoom();

    if (mz !== null && this.map_.getZoom() > mz) {
        this.clusterIcon_.hide();
        return;
    }

    if (mCount < this.minClusterSize_) {
        // Min cluster size not yet reached.
        this.clusterIcon_.hide();
        return;
    }

    var numStyles = this.markerClusterer_.getStyles().length;
    var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
    this.clusterIcon_.setCenter(this.center_);
    this.clusterIcon_.useStyle(sums);
    this.clusterIcon_.show();
};


/**
 * Determines if a marker has already been added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker has already been added.
 */
Cluster.prototype.isMarkerAlreadyAdded_ = function (marker) {
    var i;
    if (this.markers_.indexOf) {
        return this.markers_.indexOf(marker) !== -1;
    } else {
        for (i = 0; i < this.markers_.length; i++) {
            if (marker === this.markers_[i]) {
                return true;
            }
        }
    }
    return false;
};


/**
 * @name MarkerClustererOptions
 * @class This class represents the optional parameter passed to
 *  the {@link MarkerClusterer} constructor.
 * @property {number} [gridSize=60] The grid size of a cluster in pixels. The grid is a square.
 * @property {number} [maxZoom=null] The maximum zoom level at which clustering is enabled or
 *  <code>null</code> if clustering is to be enabled at all zoom levels.
 * @property {boolean} [zoomOnClick=true] Whether to zoom the map when a cluster marker is
 *  clicked. You may want to set this to <code>false</code> if you have installed a handler
 *  for the <code>click</code> event and it deals with zooming on its own.
 * @property {boolean} [averageCenter=false] Whether the position of a cluster marker should be
 *  the average position of all markers in the cluster. If set to <code>false</code>, the
 *  cluster marker is positioned at the location of the first marker added to the cluster.
 * @property {number} [minimumClusterSize=2] The minimum number of markers needed in a cluster
 *  before the markers are hidden and a cluster marker appears.
 * @property {boolean} [ignoreHidden=false] Whether to ignore hidden markers in clusters. You
 *  may want to set this to <code>true</code> to ensure that hidden markers are not included
 *  in the marker count that appears on a cluster marker (this count is the value of the
 *  <code>text</code> property of the result returned by the default <code>calculator</code>).
 *  If set to <code>true</code> and you change the visibility of a marker being clustered, be
 *  sure to also call <code>MarkerClusterer.repaint()</code>.
 * @property {string} [title=""] The tooltip to display when the mouse moves over a cluster
 *  marker. (Alternatively, you can use a custom <code>calculator</code> function to specify a
 *  different tooltip for each cluster marker.)
 * @property {function} [calculator=MarkerClusterer.CALCULATOR] The function used to determine
 *  the text to be displayed on a cluster marker and the index indicating which style to use
 *  for the cluster marker. The input parameters for the function are (1) the array of markers
 *  represented by a cluster marker and (2) the number of cluster icon styles. It returns a
 *  {@link ClusterIconInfo} object. The default <code>calculator</code> returns a
 *  <code>text</code> property which is the number of markers in the cluster and an
 *  <code>index</code> property which is one higher than the lowest integer such that
 *  <code>10^i</code> exceeds the number of markers in the cluster, or the size of the styles
 *  array, whichever is less. The <code>styles</code> array element used has an index of
 *  <code>index</code> minus 1. For example, the default <code>calculator</code> returns a
 *  <code>text</code> value of <code>"125"</code> and an <code>index</code> of <code>3</code>
 *  for a cluster icon representing 125 markers so the element used in the <code>styles</code>
 *  array is <code>2</code>. A <code>calculator</code> may also return a <code>title</code>
 *  property that contains the text of the tooltip to be used for the cluster marker. If
 *   <code>title</code> is not defined, the tooltip is set to the value of the <code>title</code>
 *   property for the MarkerClusterer.
 * @property {string} [clusterClass="cluster"] The name of the CSS class defining general styles
 *  for the cluster markers. Use this class to define CSS styles that are not set up by the code
 *  that processes the <code>styles</code> array.
 * @property {Array} [styles] An array of {@link ClusterIconStyle} elements defining the styles
 *  of the cluster markers to be used. The element to be used to style a given cluster marker
 *  is determined by the function defined by the <code>calculator</code> property.
 *  The default is an array of {@link ClusterIconStyle} elements whose properties are derived
 *  from the values for <code>imagePath</code>, <code>imageExtension</code>, and
 *  <code>imageSizes</code>.
 * @property {boolean} [enableRetinaIcons=false] Whether to allow the use of cluster icons that
 * have sizes that are some multiple (typically double) of their actual display size. Icons such
 * as these look better when viewed on high-resolution monitors such as Apple's Retina displays.
 * Note: if this property is <code>true</code>, sprites cannot be used as cluster icons.
 * @property {number} [batchSize=MarkerClusterer.BATCH_SIZE] Set this property to the
 *  number of markers to be processed in a single batch when using a browser other than
 *  Internet Explorer (for Internet Explorer, use the batchSizeIE property instead).
 * @property {number} [batchSizeIE=MarkerClusterer.BATCH_SIZE_IE] When Internet Explorer is
 *  being used, markers are processed in several batches with a small delay inserted between
 *  each batch in an attempt to avoid Javascript timeout errors. Set this property to the
 *  number of markers to be processed in a single batch; select as high a number as you can
 *  without causing a timeout error in the browser. This number might need to be as low as 100
 *  if 15,000 markers are being managed, for example.
 * @property {string} [imagePath=MarkerClusterer.IMAGE_PATH]
 *  The full URL of the root name of the group of image files to use for cluster icons.
 *  The complete file name is of the form <code>imagePath</code>n.<code>imageExtension</code>
 *  where n is the image file number (1, 2, etc.).
 * @property {string} [imageExtension=MarkerClusterer.IMAGE_EXTENSION]
 *  The extension name for the cluster icon image files (e.g., <code>"png"</code> or
 *  <code>"jpg"</code>).
 * @property {Array} [imageSizes=MarkerClusterer.IMAGE_SIZES]
 *  An array of numbers containing the widths of the group of
 *  <code>imagePath</code>n.<code>imageExtension</code> image files.
 *  (The images are assumed to be square.)
 */
/**
 * Creates a MarkerClusterer object with the options specified in {@link MarkerClustererOptions}.
 * @constructor
 * @extends google.maps.OverlayView
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>} [opt_markers] The markers to be added to the cluster.
 * @param {MarkerClustererOptions} [opt_options] The optional parameters.
 */
function MarkerClusterer(map, opt_markers, opt_options) {
    // MarkerClusterer implements google.maps.OverlayView interface. We use the
    // extend function to extend MarkerClusterer with google.maps.OverlayView
    // because it might not always be available when the code is defined so we
    // look for it at the last possible moment. If it doesn't exist now then
    // there is no point going ahead :)
    this.extend(MarkerClusterer, google.maps.OverlayView);

    opt_markers = opt_markers || [];
    opt_options = opt_options || {};

    this.markers_ = [];
    this.clusters_ = [];
    this.listeners_ = [];
    this.activeMap_ = null;
    this.ready_ = false;

    this.gridSize_ = opt_options.gridSize || 60;
    this.minClusterSize_ = opt_options.minimumClusterSize || 2;
    this.maxZoom_ = opt_options.maxZoom || null;
    this.styles_ = opt_options.styles || [];
    this.title_ = opt_options.title || "";
    this.zoomOnClick_ = true;
    if (opt_options.zoomOnClick !== undefined) {
        this.zoomOnClick_ = opt_options.zoomOnClick;
    }
    this.averageCenter_ = false;
    if (opt_options.averageCenter !== undefined) {
        this.averageCenter_ = opt_options.averageCenter;
    }
    this.ignoreHidden_ = false;
    if (opt_options.ignoreHidden !== undefined) {
        this.ignoreHidden_ = opt_options.ignoreHidden;
    }
    this.enableRetinaIcons_ = false;
    if (opt_options.enableRetinaIcons !== undefined) {
        this.enableRetinaIcons_ = opt_options.enableRetinaIcons;
    }
    this.imagePath_ = opt_options.imagePath || MarkerClusterer.IMAGE_PATH;
    this.imageExtension_ = opt_options.imageExtension || MarkerClusterer.IMAGE_EXTENSION;
    this.imageSizes_ = opt_options.imageSizes || MarkerClusterer.IMAGE_SIZES;
    this.calculator_ = opt_options.calculator || MarkerClusterer.CALCULATOR;
    this.batchSize_ = opt_options.batchSize || MarkerClusterer.BATCH_SIZE;
    this.batchSizeIE_ = opt_options.batchSizeIE || MarkerClusterer.BATCH_SIZE_IE;
    this.clusterClass_ = opt_options.clusterClass || "cluster";

    if (navigator.userAgent.toLowerCase().indexOf("msie") !== -1) {
        // Try to avoid IE timeout when processing a huge number of markers:
        this.batchSize_ = this.batchSizeIE_;
    }

    this.setupStyles_();

    this.addMarkers(opt_markers, true);
    this.setMap(map); // Note: this causes onAdd to be called
}


/**
 * Implementation of the onAdd interface method.
 * @ignore
 */
MarkerClusterer.prototype.onAdd = function () {
    var cMarkerClusterer = this;

    this.activeMap_ = this.getMap();
    this.ready_ = true;

    this.repaint();

    // Add the map event listeners
    this.listeners_ = [
        google.maps.event.addListener(this.getMap(), "zoom_changed", function () {
            cMarkerClusterer.resetViewport_(false);
            // Workaround for this Google bug: when map is at level 0 and "-" of
            // zoom slider is clicked, a "zoom_changed" event is fired even though
            // the map doesn't zoom out any further. In this situation, no "idle"
            // event is triggered so the cluster markers that have been removed
            // do not get redrawn. Same goes for a zoom in at maxZoom.
            if (this.getZoom() === (this.get("minZoom") || 0) || this.getZoom() === this.get("maxZoom")) {
                google.maps.event.trigger(this, "idle");
            }
        }),
        google.maps.event.addListener(this.getMap(), "idle", function () {
            cMarkerClusterer.redraw_();
        })
    ];
};


/**
 * Implementation of the onRemove interface method.
 * Removes map event listeners and all cluster icons from the DOM.
 * All managed markers are also put back on the map.
 * @ignore
 */
MarkerClusterer.prototype.onRemove = function () {
    var i;

    // Put all the managed markers back on the map:
    for (i = 0; i < this.markers_.length; i++) {
        if (this.markers_[i].getMap() !== this.activeMap_) {
            this.markers_[i].setMap(this.activeMap_);
        }
    }

    // Remove all clusters:
    for (i = 0; i < this.clusters_.length; i++) {
        this.clusters_[i].remove();
    }
    this.clusters_ = [];

    // Remove map event listeners:
    for (i = 0; i < this.listeners_.length; i++) {
        google.maps.event.removeListener(this.listeners_[i]);
    }
    this.listeners_ = [];

    this.activeMap_ = null;
    this.ready_ = false;
};


/**
 * Implementation of the draw interface method.
 * @ignore
 */
MarkerClusterer.prototype.draw = function () {};


/**
 * Sets up the styles object.
 */
MarkerClusterer.prototype.setupStyles_ = function () {
    var i, size;
    if (this.styles_.length > 0) {
        return;
    }

    for (i = 0; i < this.imageSizes_.length; i++) {
        size = this.imageSizes_[i];
        this.styles_.push({
            url: this.imagePath_ + (i + 1) + "." + this.imageExtension_,
            height: size,
            width: size
        });
    }
};


/**
 *  Fits the map to the bounds of the markers managed by the clusterer.
 */
MarkerClusterer.prototype.fitMapToMarkers = function () {
    var i;
    var markers = this.getMarkers();
    var bounds = new google.maps.LatLngBounds();
    for (i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }

    this.getMap().fitBounds(bounds);
};


/**
 * Returns the value of the <code>gridSize</code> property.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getGridSize = function () {
    return this.gridSize_;
};


/**
 * Sets the value of the <code>gridSize</code> property.
 *
 * @param {number} gridSize The grid size.
 */
MarkerClusterer.prototype.setGridSize = function (gridSize) {
    this.gridSize_ = gridSize;
};


/**
 * Returns the value of the <code>minimumClusterSize</code> property.
 *
 * @return {number} The minimum cluster size.
 */
MarkerClusterer.prototype.getMinimumClusterSize = function () {
    return this.minClusterSize_;
};

/**
 * Sets the value of the <code>minimumClusterSize</code> property.
 *
 * @param {number} minimumClusterSize The minimum cluster size.
 */
MarkerClusterer.prototype.setMinimumClusterSize = function (minimumClusterSize) {
    this.minClusterSize_ = minimumClusterSize;
};


/**
 *  Returns the value of the <code>maxZoom</code> property.
 *
 *  @return {number} The maximum zoom level.
 */
MarkerClusterer.prototype.getMaxZoom = function () {
    return this.maxZoom_;
};


/**
 *  Sets the value of the <code>maxZoom</code> property.
 *
 *  @param {number} maxZoom The maximum zoom level.
 */
MarkerClusterer.prototype.setMaxZoom = function (maxZoom) {
    this.maxZoom_ = maxZoom;
};


/**
 *  Returns the value of the <code>styles</code> property.
 *
 *  @return {Array} The array of styles defining the cluster markers to be used.
 */
MarkerClusterer.prototype.getStyles = function () {
    return this.styles_;
};


/**
 *  Sets the value of the <code>styles</code> property.
 *
 *  @param {Array.<ClusterIconStyle>} styles The array of styles to use.
 */
MarkerClusterer.prototype.setStyles = function (styles) {
    this.styles_ = styles;
};


/**
 * Returns the value of the <code>title</code> property.
 *
 * @return {string} The content of the title text.
 */
MarkerClusterer.prototype.getTitle = function () {
    return this.title_;
};


/**
 *  Sets the value of the <code>title</code> property.
 *
 *  @param {string} title The value of the title property.
 */
MarkerClusterer.prototype.setTitle = function (title) {
    this.title_ = title;
};


/**
 * Returns the value of the <code>zoomOnClick</code> property.
 *
 * @return {boolean} True if zoomOnClick property is set.
 */
MarkerClusterer.prototype.getZoomOnClick = function () {
    return this.zoomOnClick_;
};


/**
 *  Sets the value of the <code>zoomOnClick</code> property.
 *
 *  @param {boolean} zoomOnClick The value of the zoomOnClick property.
 */
MarkerClusterer.prototype.setZoomOnClick = function (zoomOnClick) {
    this.zoomOnClick_ = zoomOnClick;
};


/**
 * Returns the value of the <code>averageCenter</code> property.
 *
 * @return {boolean} True if averageCenter property is set.
 */
MarkerClusterer.prototype.getAverageCenter = function () {
    return this.averageCenter_;
};


/**
 *  Sets the value of the <code>averageCenter</code> property.
 *
 *  @param {boolean} averageCenter The value of the averageCenter property.
 */
MarkerClusterer.prototype.setAverageCenter = function (averageCenter) {
    this.averageCenter_ = averageCenter;
};


/**
 * Returns the value of the <code>ignoreHidden</code> property.
 *
 * @return {boolean} True if ignoreHidden property is set.
 */
MarkerClusterer.prototype.getIgnoreHidden = function () {
    return this.ignoreHidden_;
};


/**
 *  Sets the value of the <code>ignoreHidden</code> property.
 *
 *  @param {boolean} ignoreHidden The value of the ignoreHidden property.
 */
MarkerClusterer.prototype.setIgnoreHidden = function (ignoreHidden) {
    this.ignoreHidden_ = ignoreHidden;
};


/**
 * Returns the value of the <code>enableRetinaIcons</code> property.
 *
 * @return {boolean} True if enableRetinaIcons property is set.
 */
MarkerClusterer.prototype.getEnableRetinaIcons = function () {
    return this.enableRetinaIcons_;
};


/**
 *  Sets the value of the <code>enableRetinaIcons</code> property.
 *
 *  @param {boolean} enableRetinaIcons The value of the enableRetinaIcons property.
 */
MarkerClusterer.prototype.setEnableRetinaIcons = function (enableRetinaIcons) {
    this.enableRetinaIcons_ = enableRetinaIcons;
};


/**
 * Returns the value of the <code>imageExtension</code> property.
 *
 * @return {string} The value of the imageExtension property.
 */
MarkerClusterer.prototype.getImageExtension = function () {
    return this.imageExtension_;
};


/**
 *  Sets the value of the <code>imageExtension</code> property.
 *
 *  @param {string} imageExtension The value of the imageExtension property.
 */
MarkerClusterer.prototype.setImageExtension = function (imageExtension) {
    this.imageExtension_ = imageExtension;
};


/**
 * Returns the value of the <code>imagePath</code> property.
 *
 * @return {string} The value of the imagePath property.
 */
MarkerClusterer.prototype.getImagePath = function () {
    return this.imagePath_;
};


/**
 *  Sets the value of the <code>imagePath</code> property.
 *
 *  @param {string} imagePath The value of the imagePath property.
 */
MarkerClusterer.prototype.setImagePath = function (imagePath) {
    this.imagePath_ = imagePath;
};


/**
 * Returns the value of the <code>imageSizes</code> property.
 *
 * @return {Array} The value of the imageSizes property.
 */
MarkerClusterer.prototype.getImageSizes = function () {
    return this.imageSizes_;
};


/**
 *  Sets the value of the <code>imageSizes</code> property.
 *
 *  @param {Array} imageSizes The value of the imageSizes property.
 */
MarkerClusterer.prototype.setImageSizes = function (imageSizes) {
    this.imageSizes_ = imageSizes;
};


/**
 * Returns the value of the <code>calculator</code> property.
 *
 * @return {function} the value of the calculator property.
 */
MarkerClusterer.prototype.getCalculator = function () {
    return this.calculator_;
};


/**
 * Sets the value of the <code>calculator</code> property.
 *
 * @param {function(Array.<google.maps.Marker>, number)} calculator The value
 *  of the calculator property.
 */
MarkerClusterer.prototype.setCalculator = function (calculator) {
    this.calculator_ = calculator;
};


/**
 * Returns the value of the <code>batchSizeIE</code> property.
 *
 * @return {number} the value of the batchSizeIE property.
 */
MarkerClusterer.prototype.getBatchSizeIE = function () {
    return this.batchSizeIE_;
};


/**
 * Sets the value of the <code>batchSizeIE</code> property.
 *
 *  @param {number} batchSizeIE The value of the batchSizeIE property.
 */
MarkerClusterer.prototype.setBatchSizeIE = function (batchSizeIE) {
    this.batchSizeIE_ = batchSizeIE;
};


/**
 * Returns the value of the <code>clusterClass</code> property.
 *
 * @return {string} the value of the clusterClass property.
 */
MarkerClusterer.prototype.getClusterClass = function () {
    return this.clusterClass_;
};


/**
 * Sets the value of the <code>clusterClass</code> property.
 *
 *  @param {string} clusterClass The value of the clusterClass property.
 */
MarkerClusterer.prototype.setClusterClass = function (clusterClass) {
    this.clusterClass_ = clusterClass;
};


/**
 *  Returns the array of markers managed by the clusterer.
 *
 *  @return {Array} The array of markers managed by the clusterer.
 */
MarkerClusterer.prototype.getMarkers = function () {
    return this.markers_;
};


/**
 *  Returns the number of markers managed by the clusterer.
 *
 *  @return {number} The number of markers.
 */
MarkerClusterer.prototype.getTotalMarkers = function () {
    return this.markers_.length;
};


/**
 * Returns the current array of clusters formed by the clusterer.
 *
 * @return {Array} The array of clusters formed by the clusterer.
 */
MarkerClusterer.prototype.getClusters = function () {
    return this.clusters_;
};


/**
 * Returns the number of clusters formed by the clusterer.
 *
 * @return {number} The number of clusters formed by the clusterer.
 */
MarkerClusterer.prototype.getTotalClusters = function () {
    return this.clusters_.length;
};


/**
 * Adds a marker to the clusterer. The clusters are redrawn unless
 *  <code>opt_nodraw</code> is set to <code>true</code>.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @param {boolean} [opt_nodraw] Set to <code>true</code> to prevent redrawing.
 */
MarkerClusterer.prototype.addMarker = function (marker, opt_nodraw) {
    this.pushMarkerTo_(marker);
    if (!opt_nodraw) {
        this.redraw_();
    }
};


/**
 * Adds an array of markers to the clusterer. The clusters are redrawn unless
 *  <code>opt_nodraw</code> is set to <code>true</code>.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to add.
 * @param {boolean} [opt_nodraw] Set to <code>true</code> to prevent redrawing.
 */
MarkerClusterer.prototype.addMarkers = function (markers, opt_nodraw) {
    var key;
    for (key in markers) {
        if (markers.hasOwnProperty(key)) {
            this.pushMarkerTo_(markers[key]);
        }
    }
    if (!opt_nodraw) {
        this.redraw_();
    }
};


/**
 * Pushes a marker to the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to add.
 */
MarkerClusterer.prototype.pushMarkerTo_ = function (marker) {
    // If the marker is draggable add a listener so we can update the clusters on the dragend:
    if (marker.getDraggable()) {
        var cMarkerClusterer = this;
        google.maps.event.addListener(marker, "dragend", function () {
            if (cMarkerClusterer.ready_) {
                this.isAdded = false;
                cMarkerClusterer.repaint();
            }
        });
    }
    marker.isAdded = false;
    this.markers_.push(marker);
};


/**
 * Removes a marker from the cluster.  The clusters are redrawn unless
 *  <code>opt_nodraw</code> is set to <code>true</code>. Returns <code>true</code> if the
 *  marker was removed from the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to remove.
 * @param {boolean} [opt_nodraw] Set to <code>true</code> to prevent redrawing.
 * @return {boolean} True if the marker was removed from the clusterer.
 */
MarkerClusterer.prototype.removeMarker = function (marker, opt_nodraw) {
    var removed = this.removeMarker_(marker);

    if (!opt_nodraw && removed) {
        this.repaint();
    }

    return removed;
};


/**
 * Removes an array of markers from the cluster. The clusters are redrawn unless
 *  <code>opt_nodraw</code> is set to <code>true</code>. Returns <code>true</code> if markers
 *  were removed from the clusterer.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to remove.
 * @param {boolean} [opt_nodraw] Set to <code>true</code> to prevent redrawing.
 * @return {boolean} True if markers were removed from the clusterer.
 */
MarkerClusterer.prototype.removeMarkers = function (markers, opt_nodraw) {
    var i, r;
    var removed = false;

    for (i = 0; i < markers.length; i++) {
        r = this.removeMarker_(markers[i]);
        removed = removed || r;
    }

    if (!opt_nodraw && removed) {
        this.repaint();
    }

    return removed;
};


/**
 * Removes a marker and returns true if removed, false if not.
 *
 * @param {google.maps.Marker} marker The marker to remove
 * @return {boolean} Whether the marker was removed or not
 */
MarkerClusterer.prototype.removeMarker_ = function (marker) {
    var i;
    var index = -1;
    if (this.markers_.indexOf) {
        index = this.markers_.indexOf(marker);
    } else {
        for (i = 0; i < this.markers_.length; i++) {
            if (marker === this.markers_[i]) {
                index = i;
                break;
            }
        }
    }

    if (index === -1) {
        // Marker is not in our list of markers, so do nothing:
        return false;
    }

    marker.setMap(null);
    this.markers_.splice(index, 1); // Remove the marker from the list of managed markers
    return true;
};


/**
 * Removes all clusters and markers from the map and also removes all markers
 *  managed by the clusterer.
 */
MarkerClusterer.prototype.clearMarkers = function () {
    this.resetViewport_(true);
    this.markers_ = [];
};


/**
 * Recalculates and redraws all the marker clusters from scratch.
 *  Call this after changing any properties.
 */
MarkerClusterer.prototype.repaint = function () {
    var oldClusters = this.clusters_.slice();
    this.clusters_ = [];
    this.resetViewport_(false);
    this.redraw_();

    // Remove the old clusters.
    // Do it in a timeout to prevent blinking effect.
    setTimeout(function () {
        var i;
        for (i = 0; i < oldClusters.length; i++) {
            oldClusters[i].remove();
        }
    }, 0);
};


/**
 * Returns the current bounds extended by the grid size.
 *
 * @param {google.maps.LatLngBounds} bounds The bounds to extend.
 * @return {google.maps.LatLngBounds} The extended bounds.
 * @ignore
 */
MarkerClusterer.prototype.getExtendedBounds = function (bounds) {
    var projection = this.getProjection();

    // Turn the bounds into latlng.
    var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
        bounds.getNorthEast().lng());
    var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
        bounds.getSouthWest().lng());

    // Convert the points to pixels and the extend out by the grid size.
    var trPix = projection.fromLatLngToDivPixel(tr);
    trPix.x += this.gridSize_;
    trPix.y -= this.gridSize_;

    var blPix = projection.fromLatLngToDivPixel(bl);
    blPix.x -= this.gridSize_;
    blPix.y += this.gridSize_;

    // Convert the pixel points back to LatLng
    var ne = projection.fromDivPixelToLatLng(trPix);
    var sw = projection.fromDivPixelToLatLng(blPix);

    // Extend the bounds to contain the new bounds.
    bounds.extend(ne);
    bounds.extend(sw);

    return bounds;
};


/**
 * Redraws all the clusters.
 */
MarkerClusterer.prototype.redraw_ = function () {
    this.createClusters_(0);
};


/**
 * Removes all clusters from the map. The markers are also removed from the map
 *  if <code>opt_hide</code> is set to <code>true</code>.
 *
 * @param {boolean} [opt_hide] Set to <code>true</code> to also remove the markers
 *  from the map.
 */
MarkerClusterer.prototype.resetViewport_ = function (opt_hide) {
    var i, marker;
    // Remove all the clusters
    for (i = 0; i < this.clusters_.length; i++) {
        this.clusters_[i].remove();
    }
    this.clusters_ = [];

    // Reset the markers to not be added and to be removed from the map.
    for (i = 0; i < this.markers_.length; i++) {
        marker = this.markers_[i];
        marker.isAdded = false;
        if (opt_hide) {
            marker.setMap(null);
        }
    }
};


/**
 * Calculates the distance between two latlng locations in km.
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 */
MarkerClusterer.prototype.distanceBetweenPoints_ = function (p1, p2) {
    var R = 6371; // Radius of the Earth in km
    var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
    var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
};


/**
 * Determines if a marker is contained in a bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @param {google.maps.LatLngBounds} bounds The bounds to check against.
 * @return {boolean} True if the marker is in the bounds.
 */
MarkerClusterer.prototype.isMarkerInBounds_ = function (marker, bounds) {
    return bounds.contains(marker.getPosition());
};


/**
 * Adds a marker to a cluster, or creates a new cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 */
MarkerClusterer.prototype.addToClosestCluster_ = function (marker) {
    var i, d, cluster, center;
    var distance = 40000; // Some large number
    var clusterToAddTo = null;
    for (i = 0; i < this.clusters_.length; i++) {
        cluster = this.clusters_[i];
        center = cluster.getCenter();
        if (center) {
            d = this.distanceBetweenPoints_(center, marker.getPosition());
            if (d < distance) {
                distance = d;
                clusterToAddTo = cluster;
            }
        }
    }

    if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
        clusterToAddTo.addMarker(marker);
    } else {
        cluster = new Cluster(this);
        cluster.addMarker(marker);
        this.clusters_.push(cluster);
    }
};


/**
 * Creates the clusters. This is done in batches to avoid timeout errors
 *  in some browsers when there is a huge number of markers.
 *
 * @param {number} iFirst The index of the first marker in the batch of
 *  markers to be added to clusters.
 */
MarkerClusterer.prototype.createClusters_ = function (iFirst) {
    var i, marker;
    var mapBounds;
    var cMarkerClusterer = this;
    if (!this.ready_) {
        return;
    }

    // Cancel previous batch processing if we're working on the first batch:
    if (iFirst === 0) {
        /**
         * This event is fired when the <code>MarkerClusterer</code> begins
         *  clustering markers.
         * @name MarkerClusterer#clusteringbegin
         * @param {MarkerClusterer} mc The MarkerClusterer whose markers are being clustered.
         * @event
         */
        google.maps.event.trigger(this, "clusteringbegin", this);

        if (typeof this.timerRefStatic !== "undefined") {
            clearTimeout(this.timerRefStatic);
            delete this.timerRefStatic;
        }
    }

    // Get our current map view bounds.
    // Create a new bounds object so we don't affect the map.
    //
    // See Comments 9 & 11 on Issue 3651 relating to this workaround for a Google Maps bug:
    if (this.getMap().getZoom() > 3) {
        mapBounds = new google.maps.LatLngBounds(this.getMap().getBounds().getSouthWest(),
            this.getMap().getBounds().getNorthEast());
    } else {
        mapBounds = new google.maps.LatLngBounds(new google.maps.LatLng(85.02070771743472, -178.48388434375), new google.maps.LatLng(-85.08136444384544, 178.00048865625));
    }
    var bounds = this.getExtendedBounds(mapBounds);

    var iLast = Math.min(iFirst + this.batchSize_, this.markers_.length);

    for (i = iFirst; i < iLast; i++) {
        marker = this.markers_[i];
        if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
            if (!this.ignoreHidden_ || (this.ignoreHidden_ && marker.getVisible())) {
                this.addToClosestCluster_(marker);
            }
        }
    }

    if (iLast < this.markers_.length) {
        this.timerRefStatic = setTimeout(function () {
            cMarkerClusterer.createClusters_(iLast);
        }, 0);
    } else {
        delete this.timerRefStatic;

        /**
         * This event is fired when the <code>MarkerClusterer</code> stops
         *  clustering markers.
         * @name MarkerClusterer#clusteringend
         * @param {MarkerClusterer} mc The MarkerClusterer whose markers are being clustered.
         * @event
         */
        google.maps.event.trigger(this, "clusteringend", this);
    }
};


/**
 * Extends an object's prototype by another's.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
MarkerClusterer.prototype.extend = function (obj1, obj2) {
    return (function (object) {
        var property;
        for (property in object.prototype) {
            this.prototype[property] = object.prototype[property];
        }
        return this;
    }).apply(obj1, [obj2]);
};


/**
 * The default function for determining the label text and style
 * for a cluster icon.
 *
 * @param {Array.<google.maps.Marker>} markers The array of markers represented by the cluster.
 * @param {number} numStyles The number of marker styles available.
 * @return {ClusterIconInfo} The information resource for the cluster.
 * @constant
 * @ignore
 */
MarkerClusterer.CALCULATOR = function (markers, numStyles) {
    var index = 0;
    var title = "";
    var count = markers.length.toString();

    var dv = count;
    while (dv !== 0) {
        dv = parseInt(dv / 10, 10);
        index++;
    }

    index = Math.min(index, numStyles);
    return {
        text: count,
        index: index,
        title: title
    };
};


/**
 * The number of markers to process in one batch.
 *
 * @type {number}
 * @constant
 */
MarkerClusterer.BATCH_SIZE = 2000;


/**
 * The number of markers to process in one batch (IE only).
 *
 * @type {number}
 * @constant
 */
MarkerClusterer.BATCH_SIZE_IE = 500;


/**
 * The default root name for the marker cluster images.
 *
 * @type {string}
 * @constant
 */
MarkerClusterer.IMAGE_PATH = "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclustererplus/images/m";


/**
 * The default extension name for the marker cluster images.
 *
 * @type {string}
 * @constant
 */
MarkerClusterer.IMAGE_EXTENSION = "png";


/**
 * The default array of sizes for the marker cluster images.
 *
 * @type {Array.<number>}
 * @constant
 */
MarkerClusterer.IMAGE_SIZES = [53, 56, 66, 78, 90];

if (typeof String.prototype.trim !== 'function') {
    /**
     * IE hack since trim() doesn't exist in all browsers
     * @return {string} The string with removed whitespace
     */
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}

;/**
 * 1.1.9-patched
 * @name MarkerWithLabel for V3
 * @version 1.1.8 [February 26, 2013]
 * @author Gary Little (inspired by code from Marc Ridey of Google).
 * @copyright Copyright 2012 Gary Little [gary at luxcentral.com]
 * @fileoverview MarkerWithLabel extends the Google Maps JavaScript API V3
 *  <code>google.maps.Marker</code> class.
 *  <p>
 *  MarkerWithLabel allows you to define markers with associated labels. As you would expect,
 *  if the marker is draggable, so too will be the label. In addition, a marker with a label
 *  responds to all mouse events in the same manner as a regular marker. It also fires mouse
 *  events and "property changed" events just as a regular marker would. Version 1.1 adds
 *  support for the raiseOnDrag feature introduced in API V3.3.
 *  <p>
 *  If you drag a marker by its label, you can cancel the drag and return the marker to its
 *  original position by pressing the <code>Esc</code> key. This doesn't work if you drag the marker
 *  itself because this feature is not (yet) supported in the <code>google.maps.Marker</code> class.
 */

/*!
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint browser:true */
/*global document,google */

/**
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
function inherits(childCtor, parentCtor) {
    /** @constructor */
    function tempCtor() {}
    tempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    /** @override */
    childCtor.prototype.constructor = childCtor;
}

/**
 * This constructor creates a label and associates it with a marker.
 * It is for the private use of the MarkerWithLabel class.
 * @constructor
 * @param {Marker} marker The marker with which the label is to be associated.
 * @param {string} crossURL The URL of the cross image =.
 * @param {string} handCursor The URL of the hand cursor.
 * @private
 */
function MarkerLabel_(marker, crossURL, handCursorURL) {
    this.marker_ = marker;
    this.handCursorURL_ = marker.handCursorURL;

    this.labelDiv_ = document.createElement("div");
    this.labelDiv_.style.cssText = "position: absolute; overflow: hidden;";

    // Set up the DIV for handling mouse events in the label. This DIV forms a transparent veil
    // in the "overlayMouseTarget" pane, a veil that covers just the label. This is done so that
    // events can be captured even if the label is in the shadow of a google.maps.InfoWindow.
    // Code is included here to ensure the veil is always exactly the same size as the label.
    this.eventDiv_ = document.createElement("div");
    this.eventDiv_.style.cssText = this.labelDiv_.style.cssText;

    // This is needed for proper behavior on MSIE:
    this.eventDiv_.setAttribute("onselectstart", "return false;");
    this.eventDiv_.setAttribute("ondragstart", "return false;");

    // Get the DIV for the "X" to be displayed when the marker is raised.
    this.crossDiv_ = MarkerLabel_.getSharedCross(crossURL);
}
inherits(MarkerLabel_, google.maps.OverlayView);

/**
 * Returns the DIV for the cross used when dragging a marker when the
 * raiseOnDrag parameter set to true. One cross is shared with all markers.
 * @param {string} crossURL The URL of the cross image =.
 * @private
 */
MarkerLabel_.getSharedCross = function (crossURL) {
    var div;
    if (typeof MarkerLabel_.getSharedCross.crossDiv === "undefined") {
        div = document.createElement("img");
        div.style.cssText = "position: absolute; z-index: 1000002; display: none;";
        // Hopefully Google never changes the standard "X" attributes:
        div.style.marginLeft = "-8px";
        div.style.marginTop = "-9px";
        div.src = crossURL;
        MarkerLabel_.getSharedCross.crossDiv = div;
    }
    return MarkerLabel_.getSharedCross.crossDiv;
};

/**
 * Adds the DIV representing the label to the DOM. This method is called
 * automatically when the marker's <code>setMap</code> method is called.
 * @private
 */
MarkerLabel_.prototype.onAdd = function () {
    var me = this;
    var cMouseIsDown = false;
    var cDraggingLabel = false;
    var cSavedZIndex;
    var cLatOffset, cLngOffset;
    var cIgnoreClick;
    var cRaiseEnabled;
    var cStartPosition;
    var cStartCenter;
    // Constants:
    var cRaiseOffset = 20;
    var cDraggingCursor = "url(" + this.handCursorURL_ + ")";

    // Stops all processing of an event.
    //
    var cAbortEvent = function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.cancelBubble = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    };

    var cStopBounce = function () {
        me.marker_.setAnimation(null);
    };

    this.getPanes().overlayImage.appendChild(this.labelDiv_);
    this.getPanes().overlayMouseTarget.appendChild(this.eventDiv_);
    // One cross is shared with all markers, so only add it once:
    if (typeof MarkerLabel_.getSharedCross.processed === "undefined") {
        this.getPanes().overlayImage.appendChild(this.crossDiv_);
        MarkerLabel_.getSharedCross.processed = true;
    }

    this.listeners_ = [
        google.maps.event.addDomListener(this.eventDiv_, "mouseover", function (e) {
            if (me.marker_.getDraggable() || me.marker_.getClickable()) {
                this.style.cursor = "pointer";
                google.maps.event.trigger(me.marker_, "mouseover", e);
            }
        }),
        google.maps.event.addDomListener(this.eventDiv_, "mouseout", function (e) {
            if ((me.marker_.getDraggable() || me.marker_.getClickable()) && !cDraggingLabel) {
                this.style.cursor = me.marker_.getCursor();
                google.maps.event.trigger(me.marker_, "mouseout", e);
            }
        }),
        google.maps.event.addDomListener(this.eventDiv_, "mousedown", function (e) {
            cDraggingLabel = false;
            if (me.marker_.getDraggable()) {
                cMouseIsDown = true;
                this.style.cursor = cDraggingCursor;
            }
            if (me.marker_.getDraggable() || me.marker_.getClickable()) {
                google.maps.event.trigger(me.marker_, "mousedown", e);
                cAbortEvent(e); // Prevent map pan when starting a drag on a label
            }
        }),
        google.maps.event.addDomListener(document, "mouseup", function (mEvent) {
            var position;
            if (cMouseIsDown) {
                cMouseIsDown = false;
                me.eventDiv_.style.cursor = "pointer";
                google.maps.event.trigger(me.marker_, "mouseup", mEvent);
            }
            if (cDraggingLabel) {
                if (cRaiseEnabled) { // Lower the marker & label
                    position = me.getProjection().fromLatLngToDivPixel(me.marker_.getPosition());
                    position.y += cRaiseOffset;
                    me.marker_.setPosition(me.getProjection().fromDivPixelToLatLng(position));
                    // This is not the same bouncing style as when the marker portion is dragged,
                    // but it will have to do:
                    try { // Will fail if running Google Maps API earlier than V3.3
                        me.marker_.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(cStopBounce, 1406);
                    } catch (e) {}
                }
                me.crossDiv_.style.display = "none";
                me.marker_.setZIndex(cSavedZIndex);
                cIgnoreClick = true; // Set flag to ignore the click event reported after a label drag
                cDraggingLabel = false;
                mEvent.latLng = me.marker_.getPosition();
                google.maps.event.trigger(me.marker_, "dragend", mEvent);
            }
        }),
        google.maps.event.addListener(me.marker_.getMap(), "mousemove", function (mEvent) {
            var position;
            if (cMouseIsDown) {
                if (cDraggingLabel) {
                    // Change the reported location from the mouse position to the marker position:
                    mEvent.latLng = new google.maps.LatLng(mEvent.latLng.lat() - cLatOffset, mEvent.latLng.lng() - cLngOffset);
                    position = me.getProjection().fromLatLngToDivPixel(mEvent.latLng);
                    if (cRaiseEnabled) {
                        me.crossDiv_.style.left = position.x + "px";
                        me.crossDiv_.style.top = position.y + "px";
                        me.crossDiv_.style.display = "";
                        position.y -= cRaiseOffset;
                    }
                    me.marker_.setPosition(me.getProjection().fromDivPixelToLatLng(position));
                    if (cRaiseEnabled) { // Don't raise the veil; this hack needed to make MSIE act properly
                        me.eventDiv_.style.top = (position.y + cRaiseOffset) + "px";
                    }
                    google.maps.event.trigger(me.marker_, "drag", mEvent);
                } else {
                    // Calculate offsets from the click point to the marker position:
                    cLatOffset = mEvent.latLng.lat() - me.marker_.getPosition().lat();
                    cLngOffset = mEvent.latLng.lng() - me.marker_.getPosition().lng();
                    cSavedZIndex = me.marker_.getZIndex();
                    cStartPosition = me.marker_.getPosition();
                    cStartCenter = me.marker_.getMap().getCenter();
                    cRaiseEnabled = me.marker_.get("raiseOnDrag");
                    cDraggingLabel = true;
                    me.marker_.setZIndex(1000000); // Moves the marker & label to the foreground during a drag
                    mEvent.latLng = me.marker_.getPosition();
                    google.maps.event.trigger(me.marker_, "dragstart", mEvent);
                }
            }
        }),
        google.maps.event.addDomListener(document, "keydown", function (e) {
            if (cDraggingLabel) {
                if (e.keyCode === 27) { // Esc key
                    cRaiseEnabled = false;
                    me.marker_.setPosition(cStartPosition);
                    me.marker_.getMap().setCenter(cStartCenter);
                    google.maps.event.trigger(document, "mouseup", e);
                }
            }
        }),
        google.maps.event.addDomListener(this.eventDiv_, "click", function (e) {
            if (me.marker_.getDraggable() || me.marker_.getClickable()) {
                if (cIgnoreClick) { // Ignore the click reported when a label drag ends
                    cIgnoreClick = false;
                } else {
                    google.maps.event.trigger(me.marker_, "click", e);
                    cAbortEvent(e); // Prevent click from being passed on to map
                }
            }
        }),
        google.maps.event.addDomListener(this.eventDiv_, "dblclick", function (e) {
            if (me.marker_.getDraggable() || me.marker_.getClickable()) {
                google.maps.event.trigger(me.marker_, "dblclick", e);
                cAbortEvent(e); // Prevent map zoom when double-clicking on a label
            }
        }),
        google.maps.event.addListener(this.marker_, "dragstart", function (mEvent) {
            if (!cDraggingLabel) {
                cRaiseEnabled = this.get("raiseOnDrag");
            }
        }),
        google.maps.event.addListener(this.marker_, "drag", function (mEvent) {
            if (!cDraggingLabel) {
                if (cRaiseEnabled) {
                    me.setPosition(cRaiseOffset);
                    // During a drag, the marker's z-index is temporarily set to 1000000 to
                    // ensure it appears above all other markers. Also set the label's z-index
                    // to 1000000 (plus or minus 1 depending on whether the label is supposed
                    // to be above or below the marker).
                    me.labelDiv_.style.zIndex = 1000000 + (this.get("labelInBackground") ? -1 : +1);
                }
            }
        }),
        google.maps.event.addListener(this.marker_, "dragend", function (mEvent) {
            if (!cDraggingLabel) {
                if (cRaiseEnabled) {
                    me.setPosition(0); // Also restores z-index of label
                }
            }
        }),
        google.maps.event.addListener(this.marker_, "position_changed", function () {
            me.setPosition();
        }),
        google.maps.event.addListener(this.marker_, "zindex_changed", function () {
            me.setZIndex();
        }),
        google.maps.event.addListener(this.marker_, "visible_changed", function () {
            me.setVisible();
        }),
        google.maps.event.addListener(this.marker_, "labelvisible_changed", function () {
            me.setVisible();
        }),
        google.maps.event.addListener(this.marker_, "title_changed", function () {
            me.setTitle();
        }),
        google.maps.event.addListener(this.marker_, "labelcontent_changed", function () {
            me.setContent();
        }),
        google.maps.event.addListener(this.marker_, "labelanchor_changed", function () {
            me.setAnchor();
        }),
        google.maps.event.addListener(this.marker_, "labelclass_changed", function () {
            me.setStyles();
        }),
        google.maps.event.addListener(this.marker_, "labelstyle_changed", function () {
            me.setStyles();
        })
    ];
};

/**
 * Removes the DIV for the label from the DOM. It also removes all event handlers.
 * This method is called automatically when the marker's <code>setMap(null)</code>
 * method is called.
 * @private
 */
MarkerLabel_.prototype.onRemove = function () {
    var i;
    if (this.labelDiv_.parentNode !== null)
        this.labelDiv_.parentNode.removeChild(this.labelDiv_);
    if (this.eventDiv_.parentNode !== null)
        this.eventDiv_.parentNode.removeChild(this.eventDiv_);

    // Remove event listeners:
    for (i = 0; i < this.listeners_.length; i++) {
        google.maps.event.removeListener(this.listeners_[i]);
    }
};

/**
 * Draws the label on the map.
 * @private
 */
MarkerLabel_.prototype.draw = function () {
    this.setContent();
    this.setTitle();
    this.setStyles();
};

/**
 * Sets the content of the label.
 * The content can be plain text or an HTML DOM node.
 * @private
 */
MarkerLabel_.prototype.setContent = function () {
    var content = this.marker_.get("labelContent");
    if (typeof content.nodeType === "undefined") {
        this.labelDiv_.innerHTML = content;
        this.eventDiv_.innerHTML = this.labelDiv_.innerHTML;
    } else {
        this.labelDiv_.innerHTML = ""; // Remove current content
        this.labelDiv_.appendChild(content);
        content = content.cloneNode(true);
        this.eventDiv_.appendChild(content);
    }
};

/**
 * Sets the content of the tool tip for the label. It is
 * always set to be the same as for the marker itself.
 * @private
 */
MarkerLabel_.prototype.setTitle = function () {
    this.eventDiv_.title = this.marker_.getTitle() || "";
};

/**
 * Sets the style of the label by setting the style sheet and applying
 * other specific styles requested.
 * @private
 */
MarkerLabel_.prototype.setStyles = function () {
    var i, labelStyle;

    // Apply style values from the style sheet defined in the labelClass parameter:
    this.labelDiv_.className = this.marker_.get("labelClass");
    this.eventDiv_.className = this.labelDiv_.className;

    // Clear existing inline style values:
    this.labelDiv_.style.cssText = "";
    this.eventDiv_.style.cssText = "";
    // Apply style values defined in the labelStyle parameter:
    labelStyle = this.marker_.get("labelStyle");
    for (i in labelStyle) {
        if (labelStyle.hasOwnProperty(i)) {
            this.labelDiv_.style[i] = labelStyle[i];
            this.eventDiv_.style[i] = labelStyle[i];
        }
    }
    this.setMandatoryStyles();
};

/**
 * Sets the mandatory styles to the DIV representing the label as well as to the
 * associated event DIV. This includes setting the DIV position, z-index, and visibility.
 * @private
 */
MarkerLabel_.prototype.setMandatoryStyles = function () {
    this.labelDiv_.style.position = "absolute";
    this.labelDiv_.style.overflow = "hidden";
    // Make sure the opacity setting causes the desired effect on MSIE:
    if (typeof this.labelDiv_.style.opacity !== "undefined" && this.labelDiv_.style.opacity !== "") {
        this.labelDiv_.style.MsFilter = "\"progid:DXImageTransform.Microsoft.Alpha(opacity=" + (this.labelDiv_.style.opacity * 100) + ")\"";
        this.labelDiv_.style.filter = "alpha(opacity=" + (this.labelDiv_.style.opacity * 100) + ")";
    }

    this.eventDiv_.style.position = this.labelDiv_.style.position;
    this.eventDiv_.style.overflow = this.labelDiv_.style.overflow;
    this.eventDiv_.style.opacity = 0.01; // Don't use 0; DIV won't be clickable on MSIE
    this.eventDiv_.style.MsFilter = "\"progid:DXImageTransform.Microsoft.Alpha(opacity=1)\"";
    this.eventDiv_.style.filter = "alpha(opacity=1)"; // For MSIE

    this.setAnchor();
    this.setPosition(); // This also updates z-index, if necessary.
    this.setVisible();
};

/**
 * Sets the anchor point of the label.
 * @private
 */
MarkerLabel_.prototype.setAnchor = function () {
    var anchor = this.marker_.get("labelAnchor");
    this.labelDiv_.style.marginLeft = -anchor.x + "px";
    this.labelDiv_.style.marginTop = -anchor.y + "px";
    this.eventDiv_.style.marginLeft = -anchor.x + "px";
    this.eventDiv_.style.marginTop = -anchor.y + "px";
};

/**
 * Sets the position of the label. The z-index is also updated, if necessary.
 * @private
 */
MarkerLabel_.prototype.setPosition = function (yOffset) {
    var position = this.getProjection().fromLatLngToDivPixel(this.marker_.getPosition());
    if (typeof yOffset === "undefined") {
        yOffset = 0;
    }
    this.labelDiv_.style.left = Math.round(position.x) + "px";
    this.labelDiv_.style.top = Math.round(position.y - yOffset) + "px";
    this.eventDiv_.style.left = this.labelDiv_.style.left;
    this.eventDiv_.style.top = this.labelDiv_.style.top;

    this.setZIndex();
};

/**
 * Sets the z-index of the label. If the marker's z-index property has not been defined, the z-index
 * of the label is set to the vertical coordinate of the label. This is in keeping with the default
 * stacking order for Google Maps: markers to the south are in front of markers to the north.
 * @private
 */
MarkerLabel_.prototype.setZIndex = function () {
    var zAdjust = (this.marker_.get("labelInBackground") ? -1 : +1);
    if (typeof this.marker_.getZIndex() === "undefined") {
        this.labelDiv_.style.zIndex = parseInt(this.labelDiv_.style.top, 10) + zAdjust;
        this.eventDiv_.style.zIndex = this.labelDiv_.style.zIndex;
    } else {
        this.labelDiv_.style.zIndex = this.marker_.getZIndex() + zAdjust;
        this.eventDiv_.style.zIndex = this.labelDiv_.style.zIndex;
    }
};

/**
 * Sets the visibility of the label. The label is visible only if the marker itself is
 * visible (i.e., its visible property is true) and the labelVisible property is true.
 * @private
 */
MarkerLabel_.prototype.setVisible = function () {
    if (this.marker_.get("labelVisible")) {
        this.labelDiv_.style.display = this.marker_.getVisible() ? "block" : "none";
    } else {
        this.labelDiv_.style.display = "none";
    }
    this.eventDiv_.style.display = this.labelDiv_.style.display;
};

/**
 * @name MarkerWithLabelOptions
 * @class This class represents the optional parameter passed to the {@link MarkerWithLabel} constructor.
 *  The properties available are the same as for <code>google.maps.Marker</code> with the addition
 *  of the properties listed below. To change any of these additional properties after the labeled
 *  marker has been created, call <code>google.maps.Marker.set(propertyName, propertyValue)</code>.
 *  <p>
 *  When any of these properties changes, a property changed event is fired. The names of these
 *  events are derived from the name of the property and are of the form <code>propertyname_changed</code>.
 *  For example, if the content of the label changes, a <code>labelcontent_changed</code> event
 *  is fired.
 *  <p>
 * @property {string|Node} [labelContent] The content of the label (plain text or an HTML DOM node).
 * @property {Point} [labelAnchor] By default, a label is drawn with its anchor point at (0,0) so
 *  that its top left corner is positioned at the anchor point of the associated marker. Use this
 *  property to change the anchor point of the label. For example, to center a 50px-wide label
 *  beneath a marker, specify a <code>labelAnchor</code> of <code>google.maps.Point(25, 0)</code>.
 *  (Note: x-values increase to the right and y-values increase to the top.)
 * @property {string} [labelClass] The name of the CSS class defining the styles for the label.
 *  Note that style values for <code>position</code>, <code>overflow</code>, <code>top</code>,
 *  <code>left</code>, <code>zIndex</code>, <code>display</code>, <code>marginLeft</code>, and
 *  <code>marginTop</code> are ignored; these styles are for internal use only.
 * @property {Object} [labelStyle] An object literal whose properties define specific CSS
 *  style values to be applied to the label. Style values defined here override those that may
 *  be defined in the <code>labelClass</code> style sheet. If this property is changed after the
 *  label has been created, all previously set styles (except those defined in the style sheet)
 *  are removed from the label before the new style values are applied.
 *  Note that style values for <code>position</code>, <code>overflow</code>, <code>top</code>,
 *  <code>left</code>, <code>zIndex</code>, <code>display</code>, <code>marginLeft</code>, and
 *  <code>marginTop</code> are ignored; these styles are for internal use only.
 * @property {boolean} [labelInBackground] A flag indicating whether a label that overlaps its
 *  associated marker should appear in the background (i.e., in a plane below the marker).
 *  The default is <code>false</code>, which causes the label to appear in the foreground.
 * @property {boolean} [labelVisible] A flag indicating whether the label is to be visible.
 *  The default is <code>true</code>. Note that even if <code>labelVisible</code> is
 *  <code>true</code>, the label will <i>not</i> be visible unless the associated marker is also
 *  visible (i.e., unless the marker's <code>visible</code> property is <code>true</code>).
 * @property {boolean} [raiseOnDrag] A flag indicating whether the label and marker are to be
 *  raised when the marker is dragged. The default is <code>true</code>. If a draggable marker is
 *  being created and a version of Google Maps API earlier than V3.3 is being used, this property
 *  must be set to <code>false</code>.
 * @property {boolean} [optimized] A flag indicating whether rendering is to be optimized for the
 *  marker. <b>Important: The optimized rendering technique is not supported by MarkerWithLabel,
 *  so the value of this parameter is always forced to <code>false</code>.
 * @property {string} [crossImage="http://maps.gstatic.com/intl/en_us/mapfiles/drag_cross_67_16.png"]
 *  The URL of the cross image to be displayed while dragging a marker.
 * @property {string} [handCursor="http://maps.gstatic.com/intl/en_us/mapfiles/closedhand_8_8.cur"]
 *  The URL of the cursor to be displayed while dragging a marker.
 */
/**
 * Creates a MarkerWithLabel with the options specified in {@link MarkerWithLabelOptions}.
 * @constructor
 * @param {MarkerWithLabelOptions} [opt_options] The optional parameters.
 */
function MarkerWithLabel(opt_options) {
    opt_options = opt_options || {};
    opt_options.labelContent = opt_options.labelContent || "";
    opt_options.labelAnchor = opt_options.labelAnchor || new google.maps.Point(0, 0);
    opt_options.labelClass = opt_options.labelClass || "markerLabels";
    opt_options.labelStyle = opt_options.labelStyle || {};
    opt_options.labelInBackground = opt_options.labelInBackground || false;
    if (typeof opt_options.labelVisible === "undefined") {
        opt_options.labelVisible = true;
    }
    if (typeof opt_options.raiseOnDrag === "undefined") {
        opt_options.raiseOnDrag = true;
    }
    if (typeof opt_options.clickable === "undefined") {
        opt_options.clickable = true;
    }
    if (typeof opt_options.draggable === "undefined") {
        opt_options.draggable = false;
    }
    if (typeof opt_options.optimized === "undefined") {
        opt_options.optimized = false;
    }
    opt_options.crossImage = opt_options.crossImage || "http" + (document.location.protocol === "https:" ? "s" : "") + "://maps.gstatic.com/intl/en_us/mapfiles/drag_cross_67_16.png";
    opt_options.handCursor = opt_options.handCursor || "http" + (document.location.protocol === "https:" ? "s" : "") + "://maps.gstatic.com/intl/en_us/mapfiles/closedhand_8_8.cur";
    opt_options.optimized = false; // Optimized rendering is not supported

    this.label = new MarkerLabel_(this, opt_options.crossImage, opt_options.handCursor); // Bind the label to the marker

    // Call the parent constructor. It calls Marker.setValues to initialize, so all
    // the new parameters are conveniently saved and can be accessed with get/set.
    // Marker.set triggers a property changed event (called "propertyname_changed")
    // that the marker label listens for in order to react to state changes.
    google.maps.Marker.apply(this, arguments);
}
inherits(MarkerWithLabel, google.maps.Marker);

/**
 * Overrides the standard Marker setMap function.
 * @param {Map} theMap The map to which the marker is to be added.
 * @private
 */
MarkerWithLabel.prototype.setMap = function (theMap) {

    // Call the inherited function...
    google.maps.Marker.prototype.setMap.apply(this, arguments);

    // ... then deal with the label:
    this.label.setMap(theMap);
};;
// Source: src/main/js/app/components/accordion/accordion.js
// ==========================================================================
// TASKS : That can be used and configured in the intiConfigs
// ==========================================================================

angular.module('accordion', ['collapse'])

    .constant('accordionConfig', {
        closeOthers: true
    })

    .controller('AccordionController', ['$scope', '$attrs', 'accordionConfig', function ($scope, $attrs, accordionConfig) {

        // This array keeps track of the accordion groups
        this.groups = [];

        // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
        this.closeOthers = function(openGroup) {
            var closeOthers = angular.isDefined($attrs.closeOthers) ? $scope.$eval($attrs.closeOthers) : accordionConfig.closeOthers;
            if ( closeOthers ) {
                angular.forEach(this.groups, function (group) {
                    if ( group !== openGroup ) {
                        group.isOpen = false;
                    }
                });
            }
        };

        // This is called from the accordion-group directive to add itself to the accordion
        this.addGroup = function(groupScope) {
            var that = this;
            this.groups.push(groupScope);

            groupScope.$on('$destroy', function () {
                that.removeGroup(groupScope);
            });
        };

        // This is called from the accordion-group directive when to remove itself
        this.removeGroup = function(group) {
            var index = this.groups.indexOf(group);
            if ( index !== -1 ) {
                this.groups.splice(index, 1);
            }
        };

    }])

/**
 * @ngdoc directive
 * @name accordion.directive:accordion
 * @priority default
 * @restrict EA
 *
 * @description This directive simply sets up the directive controller
 * and adds an accordion CSS class to the element itself.
 *
 * @param {boolean=} closeOthers This tells the controller whether it should close all active groups before
 * opening the next.
 *
 * @example
 <doc:source>
     <accordion>
         <accordion-group>
             <accordion-heading>
             Title content
             </accordion-heading>

             Content of accordion

         </accordion-group>
         <accordion-group>
             <accordion-heading>
             Title content 2
             </accordion-heading>

             Content of accordion 2

         </accordion-group>
     </accordion>
     <accordion>
         <accordion-group heading="title content">

             Content of accordion

         </accordion-group>
         <accordion-group heading="title content 2">

             Content of accordion 2

         </accordion-group>
     </accordion>
 </doc:source>
 */
    .directive('accordion', function () {
        return {
            restrict:'EA',
            controller:'AccordionController',
            transclude: true,
            replace: false,
            templateUrl: 'site/templates/accordion/accordion.html'
        };
    })

/**
 * @ngdoc directive
 * @name accordion.directive:accordionGroup
 * @priority default
 * @restrict EA
 *
 * @param {boolean=} isOpen Condition for when this group should be open
 * @param {string=} heading Text for header if no dom structure is required.  For more complex header markup or dynamic text resolution
 * use {@link accordion.directive:accordionHeader accordionHeader}
 *
 * @example
 * See {@link accordion.directive:accordion accordion}
 */

    .directive('accordionGroup', function() {
        return {
            require:'^accordion',         // We need this directive to be inside an accordion
            restrict:'EA',
            transclude:true,              // It transcludes the contents of the directive into the template
            replace: true,                // The element containing the directive will be replaced with the template
            templateUrl:'site/templates/accordion/accordion_group.html',
            scope: {
                heading: '@',               // Interpolate the heading attribute onto this scope
                isOpen: '=?',
                isDisabled: '=?'
            },
            controller: function() {
                this.setHeading = function(element) {
                    this.heading = element;
                };
            },
            link: function(scope, element, attrs, accordionCtrl) {
                accordionCtrl.addGroup(scope);

                scope.$watch('isOpen', function(value) {
                    if ( value ) {
                        accordionCtrl.closeOthers(scope);
                    }
                });

                scope.toggleOpen = function() {
                    if ( !scope.isDisabled ) {
                        scope.isOpen = !scope.isOpen;
                    }
                };
            }
        };
    })

/**
 * @ngdoc directive
 * @name accordion.directive:accordionHeader
 * @priority default
 * @restrict EA
 * @description Use accordion-heading below an accordion-group to provide a heading containing HTML
 *
 * @example
 * See {@link accordion.directive:accordion accordion}
 */

    .directive('accordionHeading', function() {
        return {
            restrict: 'EA',
            transclude: true,   // Grab the contents to be used as the heading
            template: '',       // In effect remove this element!
            replace: true,
            require: '^accordionGroup',
            link: function(scope, element, attr, accordionGroupCtrl, transclude) {
                // Pass the heading to the accordion-group controller
                // so that it can be transcluded into the right place in the template
                // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
                accordionGroupCtrl.setHeading(transclude(scope, function() {}));
            }
        };
    })

// Use in the accordion-group template to indicate where you want the heading to be transcluded
// You must provide the property on the accordion-group controller that will hold the transcluded element
// <div class="accordion-group">
//   <div class="accordion-heading" ><a ... accordion-transclude="heading">...</a></div>
//   ...
// </div>
    .directive('accordionTransclude', function() {
        return {
            require: '^accordionGroup',
            link: function(scope, element, attr, controller) {
                scope.$watch(function() { return controller[attr.accordionTransclude]; }, function(heading) {
                    if ( heading ) {
                        element.html('');
                        element.append(heading);
                    }
                });
            }
        };
    });




;
// Source: src/main/js/app/components/auth/auth-factory.js
angular.module('auth', [ 'ngResource' ] )

/**
 * @ngdoc service
 * @name user.factory:UserStatusFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
    @property {$resource} $resource
    This factory returns the following resource:
    <pre>
        $resource('/api/v2.0/user/status',
            {},
            {
                'get': {
                    method: 'GET',
                    isArray: false,
                    params: {}
                }
            })
    </pre>

 */

.factory('UserStatusFactory', [ '$http', '$q', '$resource', function($http, $q, $resource) {

    return $resource('/api/v2.0/user/status',
            {},
            {
                'get': {
                    method: 'GET',
                    isArray: false,
                    params: {}
                }
            });

}])

/**
 * @ngdoc service
 * @name login.factory:GuestLoginFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
    @property {$resource} $resource
    This factory returns the following resource:
    <pre>
     $resource('/api/v2.0/user/guest',
         {},
         {
             'sendGuestUser': {
                 method: 'POST',
                 isArray: false,
                 params: {
                     zip: '@zip',
                     customerType: '@customerType',
                     cityId: '@cityId',
                     email: '@email'
                 }
         }
     });
    </pre>
 *
 */
    .factory('GuestLoginFactory', ['$http', '$q', '$resource', function($http, $q, $resource) {

        return $resource('/api/v2.0/user/guest',
            {},
            {
                'sendGuestUser': {
                    method: 'POST',
                    isArray: false,
                    params: {
                        zip: '@zip',
                        customerType: '@customerType',
                        cityId: '@cityId',
                        email: '@email'
                    }
                }
            });
    }])

/**
 * @ngdoc service
 * @name login.factory:UserLoginFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
     $resource('/api/v2.0/user/login',
     {},
     {
         'sendUser': {
            method: 'POST',
            isArray: false,
            params: {
                loginName: '@loginName',
                 password: '@password',
                 rememberMe: '@rememberMe'
            }
         }
     });
 </pre>
 *
 */
    .factory('UserLoginFactory', ['$http', '$q', '$resource', function( $http, $q, $resource ) {

        return $resource('/api/v2.0/user/login',
            {
            },
            {
                'sendUser': {
                    method: 'POST',
                    isArray: false,
                    params: {
                        loginName: '@loginName',
                        password: '@password',
                        rememberMe: '@rememberMe',
                        zip: '@zip',
                        customerType: '@customerType',
                        cityId: '@cityId',
                        email: '@email'
                    }
                }
            });
    }])

/**
 * @ngdoc service
 * @name login.factory:UserLogoutFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
     $resource('/api/v2.0/user/logout',
     {},
     {
         'logout': {
            method: 'POST',
            isArray: false,
         }
     });
 </pre>
 *
 */
    .factory('LogoutFactory', ['$http', '$q', '$resource', function( $http, $q, $resource ) {

        return $resource('/api/v2.0/user/logout',
            {
            },
            {
                'logout': {
                    method: 'POST',
                    isArray: false
                }
            });
    }]);;
// Source: src/main/js/app/components/auth/login/login-controllers.js
angular.module('login', [ 'ngRoute', 'AuthHelpers', 'form' ])

    .constant( 'GUEST_CITIES', 'guestCities' )
    .constant( 'GUEST_USER', 'guestUser' )

/**
 * @ngdoc overview
 * @name login
 *
 * @description This module contains all relevant code to guest and user login
 *
 * @example
 *
 * <ul>
 *     <li>User submits form with zip code -> LoginController.user.zip = 60089</li>
 *     <li>Trigger event listen for key id 13 -> submitUser($event, userForm)</li>
 *     <li>Calls sendUser from submitUser</li>
 *     <li>Calls sendGuestUser</li>
 *     <li>Response is returned from rest api which calls handleGuestError</li>
 *     <li>Cities property is injected into the scope</li>
 *     <li>User selects a city and then will repeat steps 2 - 4</li>
 *     <li>Response is returned from rest api which calls handleGuestSuccess</li>
 *     <li>User is logged in</li>
 * </ul>
 */
    .config([ '$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: 'site/pages/login/login.html',
                controller: 'LoginController',
                animate: 'fadeIn'
            })
            .when('/', {
                templateUrl: 'site/pages/login/login.html',
                controller: 'LoginController',
                animate: 'fadeIn'
            });
    }])

/**
 * @ngdoc controller
 * @name login.controller:LoginController
 * @scope true
 *
 * @property {string} loginStep - used in the switch block within the template to determine which content the fragment should display
 * @property {string} hiddenPassword used to switch between masking the password and showing the password in the login form
 * @property {string} guestUser object used to store the properties for the guest user form
 * @property {string} user object used to store the properties for the user form
 *
 * @property {function} sendGuestUser(guestUser,guestUserForm) used to post the guest user object to the Peapod rest services
 * @property {function} submitGuestUser($event,guestUserForm) method to handle the callback from the form if the user hits enter or 'go' on a mobile device. This method calls sendGuestUser as a delegate
 * @property {function} sendUser(user,userForm) used to post the user object to the Peapod rest services
 * @property {function} submitUser($event,userForm) method to handle the callback from the form if the user hits enter or 'go' on a mobile device. This method calls sendUser as a delegate.
 */
    .controller('LoginController', [ '$rootScope', '$scope', 'GuestLoginFactory', 'UserLoginFactory', 'LoginControllerService', 'FormHelperService', function($rootScope, $scope, GuestLoginFactory, UserLoginFactory, LoginControllerService, FormHelperService ) {

        var resetUserObjects = function() {
            $scope.guestUser = {
                customerType: 'C'
            };
            $scope.user = {};
            $scope.hiddenPassword = false;
            $scope.hasError = false;
            $scope.errorMessage = undefined;
            $scope.cities = undefined;
        };

        $scope.setLoginStep = function(loginStep) {
            if( loginStep === '' ) {
                LoginControllerService.reset();
            }

            if( loginStep === '' || loginStep === 'guest' || loginStep === 'user' ) {
                resetUserObjects();
            }
            $scope.loginStep = loginStep;
        };

        $scope.resetLoginStep = function() {
            $scope.setLoginStep('');
        };

        $scope.resetLoginStep();
        resetUserObjects();

        $scope.sendGuestUser = function(guestUser, guestUserForm) {
            $scope.formSubmitted = true;

            var $promise = LoginControllerService.isMissingStore ? UserLoginFactory.sendUser(guestUser).$promise : GuestLoginFactory.sendGuestUser(guestUser).$promise;

            $promise
                .then( function(response) {
                    var loginStep = LoginControllerService.handleGuestSuccess( response );
                    if(loginStep !== 'guest' && loginStep !== 'guest-ambiguous') {
                        $scope.setLoginStep(loginStep);
                    }
                    LoginControllerService.reset();
                    resetUserObjects();
                })
                .catch( function(response) {
                    $scope.setLoginStep( LoginControllerService.handleGuestError( guestUser, guestUserForm, response ) );
                    FormHelperService.resetFormErrorsForCode(guestUserForm, $scope.code);
                    LoginControllerService.injectGuestErrorPropsToScope($scope);
                });
        };

        $scope.submitGuestUser = function( $event, guestUserForm ) {
            $event.preventDefault();
            $scope.sendGuestUser( $scope.guestUser, guestUserForm );
        };

        $scope.sendUser = function(user, userForm) {
            $scope.formSubmitted = true;
            user.rememberMe = true;

            var $promise = UserLoginFactory.sendUser(user).$promise;
            $promise
                .then( function(response) {
                    LoginControllerService.handleUserSuccess( user, response );
                    LoginControllerService.reset();
                    resetUserObjects();
                })
                .catch( function(response) {
                    FormHelperService.resetFormErrorsForCode(userForm, $scope.code);
                    $scope.code = response.data.response.code;

                    LoginControllerService.isGlobalError = false;
                    $scope.errorMessage = LoginControllerService.handleUserError( user, userForm, response );
                    $scope.isGlobalError = LoginControllerService.isGlobalError;
                    $scope.$broadcast('ppdLoadingActionFinish');

                    if(LoginControllerService.isMissingStore ) {
                        $scope.setLoginStep('guest');
                    }
                });
        };

        $scope.submitUser = function( $event, userForm ) {
            $event.preventDefault();
            $scope.sendUser( $scope.user, userForm );
        };

        $scope.setFocus = function() {
            setTimeout( function() {
                // find first element with tabindex
                angular.element(
                    document.querySelectorAll('[tabindex]')
                )[0].focus();
            },300);
        };

        $scope.$on('$locationChangeSuccess', function() {
            $scope.setFocus();
        });

        $scope.$on('$destroy', function() {
            LoginControllerService.clearGuestProps();
        });

    }])

    .directive('animClass',function($route){
        return {
            link: function(scope, elm){
                var enterClass = $route.current.animate;
                elm.addClass(enterClass);
                scope.$on('$destroy',function(){
                    elm.removeClass(enterClass);
                    elm.addClass($route.current.animate);
                });
            }
        };
    })

/**
 * @ngdoc service
 * @name login.service:LoginControllerService
 *
 * @description This service contains functions to handle various error/success cases for guest and full user login
 *
 * @property {function} handleGuestError(guestUser,guestUserForm,response)
 *  <h2>Description:</h2>
 *
 *  <p>this method reads the response from the Peapod rest api and then sends the guest user to the correct error result page within the guest login sequence.</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>guestUser</b> - guestUser model object</li>
 *      <li><b>guestUserForm</b> - guestUserForm form object with validation messaging</li>
 *      <li><b>response</b> - response from guest login api service</li>
 *  </ul>
 *
 * @property {function} handleGuestSuccess(response)
 *  <h2>Description:</h2>
 *
 *  <p>this method reads the response from the Peapod rest api and then sends the guest user to the authenticated user home page ( index.jhtml#/home ). This method also handles the case where a user that we don't service submits their email to our rest api successfully.</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>response</b> - response from guest login api service</li>
 *  </ul>
 *
 * @property {function} handleUserError(user,userForm,response)
 *  <h2>Description:</h2>
 *
 *  <p> this method handles all error cases from the login apis. It will result an object representing the error message to be displayed to the user</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>user</b> - user model object</li>
 *      <li><b>userForm</b> - userform form object with validation messaging</li>
 *      <li><b>response</b> - response from guest login api service</li>
 *  </ul>
 *
 * @property {function} handleUserSuccess(user,response)
 *  <h2>Description:</h2>
 *
 *  <p>this method checks the result code from the Peapod rest api to check if they logged in successfully and then forwards them to the authenticated user home page ( index.jhtml#/home ).</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>user</b> - user model object</li>
 *      <li><b>response</b> - response from user login api service</li>
 *  </ul>
 *
 * @property {function} injectGuestErrorPropsToScope($scope)
 *  <h2>Description:</h2>
 *
 *  <p>this method given the current $scope object from the LoginController will add the cities object using the SharedProperties service with the key guestCities to be used with the select list of the ambiguous city selector</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>guestUser</b> - guestUser model object</li>
 *      <li><b>guestUserForm</b> - guestUserForm form object with validation messaging</li>
 *      <li><b>response</b> - response from guest login api service</li>
 *  </ul>
 *
 *  @property {function} clearGuestProps()
 *  <h2>Description:</h2>
 *
 *  <p>this method clears the values for guestCities and guestUser in the SharedProperties service. This method is called on destroy of the LoginController</p>
 */
    .service('LoginControllerService', [ '$sce', 'AuthHelperService', function( $sce, AuthHelperService ) {

        var service = this;
        service.isMissingStore = false;
        service.guestUser = null;
        service.guestCities = null;
        service.isGlobalError = false;

        service.handleGuestError = function( guestUser, guestUserForm, response) {
            var loginStep;
            var result = response.data.response.result;
            var code = result.code;

            switch(code) {
                case 'GUEST_MULTIPLE_CITIES':
                case 'MULTIPLE_CITIES':
                    loginStep = 'guest-ambiguous';
                    service.guestCities = response.data.response.cities;
                break;
                case 'GUEST_NOT_IN_AREA':
                case 'ZIP_NOT_IN_AREA':
                    loginStep = 'guest-submit-email';
                break;
                default:
                    loginStep = 'guest';
                break;
            }

            service.guestUser = guestUser;

            return loginStep;
        };

        service.handleGuestSuccess = function( response ) {

            var code = response.response.result.code;
            var loginStep = 'guest';

            switch( code ) {
                case 'GUEST_ACCOUNT_CREATED':
                case 'OPCO_ACCOUNT_UPDATED':
                    AuthHelperService.redirectToHome();
                break;
                case 'GUEST_EMAIL_SAVED':
                case 'NO_SERVICE_EMAIL_SAVED':
                    loginStep = 'guest-submit-email-success';
                break;
            }

            return loginStep;
        };

        service.handleUserSuccess = function( user, response ) {
            if( angular.isDefined( response ) &&
                angular.isDefined( response.response ) && 
                angular.isDefined( response.response.code ) ) {

                var code = response.response.code;

                if( angular.equals( code, 'LOGIN_SUCCESS' ) ) {
                    AuthHelperService.redirectToHome();
                }
            }
        };

        service.handleUserError = function( user, userForm, response ) {
            if( angular.isDefined(response.data ) && 
                angular.isDefined( response.data.response ) && 
                angular.isDefined( response.data.response.code ) ) {

                var code = response.data.response.code;

                var errorMessage = null;

                switch( code ) {
                    case 'LOGIN_USERNAME_INVALID':
                        userForm.loginName.setCustomValidity(code, false);

                        errorMessage = '';
                    break;
                    case 'LOGIN_PASSWORD_INVALID':

                        userForm.password.setCustomValidity(code, false);

                        errorMessage = '';
                    break;
                    case 'LOGIN_INACTIVE':
                        userForm.setCustomValidity(code, false);
                        service.isGlobalError = true;
                        errorMessage = 'Your account is currently not active. Please call Peapod Customer Care at 1-800-573-2763 for assistance.';
                    break;
                    case 'LOGIN_UNCV':
                        userForm.setCustomValidity(code, false);
                        service.isGlobalError = true;
                        errorMessage = 'We\'re sorry, the username and password you entered are no longer valid.  Sign up for a new account by closing this box & entering your zip code in the "New to Peapod?" box.';
                    break;
                    case 'LOGIN_ST_CL':
                        userForm.setCustomValidity(code, false);
                        service.isGlobalError = true;
                        errorMessage = 'The store you\'ve selected is currently unavailable. Contact our Customer Care Center by  <a href="mailto:service@peapod.com">email</a> or phone, <b>1-800-5-PEAPOD</b> (1-800-573-2763).';
                    break;
                    case 'LOGIN_MISS_DLV_ST':
                        service.isMissingStore = true;
                    break;
                    default:
                        userForm.setCustomValidity(code, false);
                        service.isGlobalError = true;
                        errorMessage = 'We were unable to log you into the Peapod store. Please call Peapod Customer Care at 1-800-573-2763 for assistance.';
                    break;
                }

                errorMessage = $sce.trustAsHtml( errorMessage );

                return errorMessage;
            }

        };

        service.injectGuestErrorPropsToScope = function( $scope ) {
            $scope.cities = service.guestCities;
        };

        service.clearGuestProps = function() {
            service.guestCities = null;
            service.guestUser = null;
        };

        service.reset = function() {
            service.clearGuestProps();
            service.isMissingStore = false;
        };

    }]);;
// Source: src/main/js/app/components/auth/logout/logout-controllers.js
angular.module('logout', [ 'auth' ])

/**
 * @ngdoc controller
 * @name logout.controller:LogoutController
 * @description This controller handles logging out the user
 *
 * @property {function} logoutUser calls the LogoutFactory.logout method. If response is successful then the user is logged out and is redirected to login.jhtml#/login
 */
    .controller('LogoutController', [ '$scope', 'LogoutFactory', '$log', 'AuthHelperService', function( $scope, LogoutFactory, $log, AuthHelperService ) {

        $scope.logoutUser = function() {
            var $promise = LogoutFactory.logout().$promise;

            $promise
                .then(function() {
                    AuthHelperService.redirectToLogin();
                })
                .catch(function(error) {
                    $log.info("An error occurred while logging the user out." + error);
                });
        };

    }]);;
// Source: src/main/js/app/components/auth/status/auth-status-service.js
angular.module('AuthHelpers', [ 'auth' ])

// TODO: Move these to a common place
.constant('LOGIN_PAGE', 'auth.jhtml')
.constant('HOME_PAGE', 'index.jhtml')
.constant('BASE_PAGE_URL', '/shop/')

.service('AuthHelperService', [ '$window', 'LOGIN_PAGE', 'HOME_PAGE', 'BASE_PAGE_URL', function($window, loginPage, homePage, basePageUrl ) {
    var service = this;

    service.shouldValidateLogin = true;

    service.isLoggedForUserStatus = function( userStatusData ) {
        if(angular.isDefined(userStatusData.response) === false) {
            return false;
        }

        return userStatusData.response.userStatus !== 'N';
    };

    service.isUserOnLoginPage = function() {

        var regex = new RegExp(loginPage, 'gi');

        return regex.test($window.location.pathname);
    };

    service.isUserOnHomePage = function() {
        return ! service.isUserOnLoginPage();
    };

    service.redirectToHome = function() {
        $window.location = basePageUrl + homePage;
    };

    service.redirectToLogin = function() {
        $window.location = basePageUrl + loginPage;
    };

    service.redirectToLoginWithErrorCode = function(errorCode) {
        $window.location = basePageUrl + loginPage + '?error=' + errorCode;
    };

}]);


;
// Source: src/main/js/app/components/callback/callback-factory.js
angular.module('ppdCallback', [ ])

/**
 * @ngdoc service
 * @name callback.factory:callback
 *
 * @description This factory will create an instance of a callback promise using the createCallback method.
 * It will follow the following flow:
 * <ol>
 *     <li>Create a callback instance which will create a unique property in the stored cache of callbacks</li>
 *     <li>Return an object representing the created callback</li>
 * </ol>
 * <div>
 *     <em>*Note: This factory currently only supports single parameter callback functions</em>
 * </div>
 *
 * @param {object=} [options={}] This is an object used as a set of options for the created callback.
 *
 * @returns {object} An object representing the stored value in the map and the promise to gain access to the response
 *          <ul>
 *              <li>key (e.g. callback1238940050)</li>
 *              <li>stringifiedCallbackFunction (e.g. callbacks.callback1238940050)</li>
 *              <li>promise - This is the promise that will be resolved when the callback has received data.</li>
 *          </ul>
 */
.factory('callback', [ '$q', function( $q ) {

    var createUniqueKey = function() {
        var key = 'callback' + (new Date()).getTime();
        return key;
    };

    var createStringifiedKeyFromUniqueKey = function(key) {
        return 'callbacks.' + key;
    };

    var factory = {};
    factory.createCallback = function(options) {

        var uniqueKey = createUniqueKey(),
            prefix = options.prefix || '';

        uniqueKey = prefix + uniqueKey;

        var callbackResponse = {
                key: uniqueKey,
                stringifiedCallbackFunction: createStringifiedKeyFromUniqueKey(uniqueKey)
            };

        var promiseResolutionClosure = function() {

            var deferred = $q.defer();

            callbackResponse.promise = deferred.promise;

            return function(data) {
                deferred.resolve(data);
            };
        };

        callbacks[uniqueKey] = promiseResolutionClosure();

        return callbackResponse;
    };

    return factory.createCallback;
}])

.run([ function() {
    callbacks = {};
}]);;
// Source: src/main/js/app/components/cart/cart.js
angular.module( 'cart', [ 'CartControllers' ])

.run( ['CartManagementService', function(CartManagementService) {
    CartManagementService.queryResults()
        .then( function( results ) {
            if( angular.isDefined( results.response ) && angular.isDefined( results.response.items ) ) {
                CartManagementService.setStoredCartData( results.response );
            }
        });
}]);;
// Source: src/main/js/app/components/cart/controllers/cart-controllers.js
angular.module( 'CartControllers', [ 'CartServices', 'ProductServices', 'ProductFilters' ] )

/**
 * @ngdoc directive
 * @name cart.directive:ppdAddToCart
 *
 * @description used with {@link cart.controller:AddToCartController AddToCartController} to provide the add to
 * cart button
 * @restrict AE
 * @param {object} product provides the product to be used with the button
 * @param {boolean=} [trashButton=false] shows the trash button to remove the item from the cart
 * @param {boolean=} [showSubtotalTooltip=false] shows a tooltip with the current subtotal when an
 * interaction is made with the button
 */
.directive( 'ppdAddToCart', [ function() {
    return {
        restrict: 'AE',
        replace: true,
        scope: {
            product: "=productObject",
            showTrashButton: "=trashButton",
            showSubtotalTooltip: "=subtotalTooltip"
        },
        templateUrl: 'site/templates/cart/add_to_cart.html',
        controller: 'AddToCartController'
    };
}])

// TODO: should possibly be consumed by an order summary directive
.directive( 'ppdCartSubTotal', [ 'OrderSummaryService', '$animate', function(OrderSummaryService, $animate) {

    return {
        restrict: 'AE',
        compile: function() {
            return function postLink( scope, element, attrs ) {

                var isNotFirstLoad = false; // used to halt animations on load of the controller

                scope.subTotal = OrderSummaryService.getSubTotal();

                scope.$watch( function() {
                    return OrderSummaryService.getSubTotal();
                },
                function( updatedSubTotal ) {
                    if( angular.isNumber( updatedSubTotal ) ) {
                        isNotFirstLoad && $animate.addClass(element, 'active');

                        scope.subTotal = updatedSubTotal;

                        if( isNaN( parseInt( attrs.animationDelay, 10 ) ) ) {
                            isNotFirstLoad && $animate.removeClass(element, 'active');
                        } else {
                            isNotFirstLoad && setTimeout( function() {
                                $animate.removeClass(element, 'active');
                            }, parseInt( attrs.animationDelay, 10 ) );
                        }
                        isNotFirstLoad = true;
                    }
                });

            };
        }
    };

} ])

//.directive( 'ppdCartSummaryDirective', [])

/**
 * @ngdoc controller
 * @name cart.controller:AddToCartController
 *
 * @description Handles operations to do with the add to cart button.
 *
 * @property {function} decrementQuantity(qty) used to decrement the quantity of a given product in the cart
 * @property {function} incrementQuantity(qty) used to increment the quantity of a given product in the cart
 * @property {function} addToCart() used to add an item to the cart
 * @property {function} closeDialog() used to dismiss a product warning or restriction message
 * @property {function} removeFromCart() used to remove a product from the cart
 */
.controller( 'AddToCartController', [ '$scope', '$log', 'CartResourceFactory', 'CartManagementService', 'CartStatusMessageService', 'CertonaRecommendationsService', function( $scope, $log, CartResourceFactory, CartManagementService, CartStatusMessageService, CertonaRecommendationsService ) {

    function removeOrUpdateProduct( prodId, quantity, methodName ) {

        var $promise = CartResourceFactory[methodName]({ productId: prodId, qty: quantity }).$promise;
        $promise
            .then(function( results ) {
                CartStatusMessageService.populateStatusMessagesFromResponse( results );
                return CartManagementService.queryResults();
            })
            .then(function( results ) {
                if( angular.isDefined( results.response ) && angular.isDefined( results.response.items ) ) {
                    CartManagementService.setStoredCartData( results.response );
                }
                return true;
            })
            .catch(function( results ) {
                CartStatusMessageService.populateStatusMessagesFromResponse( results.data );
            })
            ['finally'](function() {
                $scope.$broadcast('ppdLoadingActionFinish', {});
            });
    }

    function updateQuantity( prodId, quantity ) {
        removeOrUpdateProduct( prodId, quantity, 'update');
    }

    function removeProduct( prodId ) {
        removeOrUpdateProduct( prodId, null, 'delete' );
    }

    var updatedQuantity = 0,
        updateTimeout = null,
        decrementFunction = function() {
            if (updatedQuantity === 0) {
                removeProduct($scope.product.prodId);
            } else {
                updateQuantity($scope.product.prodId, updatedQuantity);
            }
        },
        incrementFunction = function() {
            updateQuantity( $scope.product.prodId, updatedQuantity );
        },
        updateTimeoutValue = 500;

    var handleIncrementOrDecrement = function( curQuantity, isIncrement, updateFunction ) {

        if( updateTimeout !== null ) {
            clearTimeout( updateTimeout );
        } else {
            updatedQuantity = curQuantity;
        }

        if( isIncrement ) {
            updatedQuantity++;
        } else {
            updatedQuantity > 0 && updatedQuantity--;
        }

        updateTimeout = setTimeout( updateFunction, updateTimeoutValue );
    };

    var sendRecommendationsData = function(prodId) {
        var payload = {
            event: 'cart',
            itemid: prodId
        };

        CertonaRecommendationsService.sendData(payload)
            .then(function(responseData) {
                $log.info(responseData.code + ': ' + responseData.msg);
            });
    };

    $scope.decrementQuantity = function( curQuantity ) {
        handleIncrementOrDecrement( curQuantity, false, decrementFunction );
    };

    $scope.incrementQuantity = function( curQuantity ) {
        sendRecommendationsData( $scope.product.prodId );
        handleIncrementOrDecrement( curQuantity, true, incrementFunction );
    };

    $scope.addToCart = function() {
        sendRecommendationsData( $scope.product.prodId );
        updateQuantity( $scope.product.prodId, 1 );
    };

    $scope.closeDialog = function() {
        CartStatusMessageService.clearStatusMessageForProdId( $scope.product.prodId );
    };

    $scope.removeFromCart = function() {
        removeProduct( $scope.product.prodId );
    };

    // Instantiate product cart object and product cart status message object
    $scope.cartProductObject = CartManagementService.lookupProductData( $scope.product.prodId );

    $scope.messages = CartStatusMessageService.lookupStatusMessageForProdId( $scope.product.prodId );

    $scope.$watch( function() {
        return CartStatusMessageService.lookupStatusMessageForProdId( $scope.product.prodId );
    },
    function( newStatusMessageObject ) {
        $scope.messages = newStatusMessageObject;
    }, true);

    $scope.$watch( function() {
        return CartManagementService.lookupProductData( $scope.product.prodId );
    },
    function( newProductObject ) {
        $scope.cartProductObject = newProductObject;
    }, true );

}])

/**
 * @ngdoc controller
 * @name cart.controller:ViewCartController
 * @description used to inject the categorized products into the scope of this controller
 */
.controller( 'ViewCartController', [ '$scope', '$filter', 'CartManagementService', 'ProductItemDetailService', function( $scope, $filter, CartManagementService, ProductItemDetailService ) {
    
    $scope.cartData = $filter('CategoryFilter')( CartManagementService.getStoredCartData() );

    $scope.openItemDetail = function( productId ) {
        ProductItemDetailService.openItemDetail( $scope, productId );
    };

    $scope.$watch( function() {
        return CartManagementService.storedDataUpdated;
    },
    function( isUpdated ) {
        if( isUpdated ) {
            CartManagementService.storedDataUpdated = false;
            $scope.cartData = $filter('CategoryFilter')( CartManagementService.getStoredCartData() );
        }
    });

}]);




;
// Source: src/main/js/app/components/cart/factories/cart-factories.js
angular.module( 'CartFactories', [ 'ngResource' ] )

/**
 * @ngdoc service
 * @name cart.factory:CartResourceFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 <pre>
$resource('/api/v2.0/user/cart',
    {},
    {
        'query': {
            method: 'GET',
            isArray: false,
            params: {
                image: true,
                flags: true,
                sort: 'consumCatId desc'
            }
        },
        'add': {
            method: 'POST',
            isArray: false,
            params: {
                productId: '@productId',
                qty: '@qty'
            }
        },
        'update': {
            method: 'PUT',
            isArray: false,
            params: {
                productId: '@productId',
                qty: '@qty'
            }
        },
        'delete': {
            method: 'DELETE',
            isArray: false,
            params:{
                productId: '@productId'
            }
        }
    });
 </pre>
 *
 */
.factory('CartResourceFactory', ['$http', '$q', '$resource', function($http, $q, $resource) {

    return $resource('/api/v2.0/user/cart',
        {},
        {
            'query': {
                method: 'GET',
                isArray: false,
                params: {
                    image: true,
                    flags: true,
                    sort: 'consumCatId desc'
                }
            },
            'add': {
                method: 'POST',
                isArray: false,
                params: {
                    productId: '@productId',
                    qty: '@qty'
                }
            },
            'update': {
                method: 'PUT',
                isArray: false,
                params: {
                    productId: '@productId',
                    qty: '@qty'
                }
            },
            'delete': {
                method: 'DELETE',
                isArray: false,
                params:{
                    productId: '@productId'
                }
            }
        });
}]);;
// Source: src/main/js/app/components/cart/services/cart-services.js
angular.module( 'CartServices', [ 'CartFactories', 'ProductFilters' ] )

/**
 * @ngdoc service
 * @name cart.service:CartStatusMessageService
 *
 * @description This service manages status messages from the response of adding an item to a cart
 *
 * @property {object} cartStatusMessages a managed object to cache all error messages for cart addition
 * @property {function} clearStatusMessageForProdId(prodId) clears the error message for a prod id from the cartStatusMessages cache
 * @property {function} lookupStatusMessageForProdId(prodId) lookup the associated error message for a prodId
 * @property {function} setStatusMessages(resultArray) given a response from adding/removing an item to/from the cart
 * it will preprocess those messages to instantiate or add to the cartStatusMessages cache
 */
.service( 'CartStatusMessageService', [ function() {

    var cartStatusMessageService = this;

    cartStatusMessageService.cartStatusMessages = {};

    cartStatusMessageService.clearStatusMessageForProdId = function( prodId ) {
        if( angular.isNumber(prodId) === false ) {
            return;
        }

        cartStatusMessageService.cartStatusMessages[prodId] = {};
    };

    cartStatusMessageService.lookupStatusMessageForProdId = function( prodId ) {

        if( angular.isNumber(prodId) === false ) {
            return {};
        }

        if( angular.isDefined( cartStatusMessageService.cartStatusMessages[prodId] ) === false ) {
            return {};
        }

        return cartStatusMessageService.cartStatusMessages[prodId];

    };

    cartStatusMessageService.setStatusMessages = function( resultArray ) {

        angular.forEach( resultArray, function( result ) {

            var resultObj = {};

            if( angular.isDefined( result.msg ) && result.msg.split(":").length === 2 ) {
                var message = result.msg;
                var messageProperties = message.split(":");

                resultObj.message = messageProperties[1];
                resultObj.code = result.code;

                this[messageProperties[0]] = resultObj;
            }

        }, this.cartStatusMessages );

    };

    cartStatusMessageService.populateStatusMessagesFromResponse = function( response ) {

        if( angular.isDefined( response.response ) === false ) {
            return;
        }

        cartStatusMessageService.setStatusMessages( response.response );
    };

}])

.service( 'OrderSummaryService', [ 'CartManagementService', function( CartManagementService ) {

    var orderSummaryService = this;

    orderSummaryService.getSubTotal = function() {
        if( angular.isNumber( CartManagementService.getCartResponse().subTotalPrice ) ) {
            return CartManagementService.getCartResponse().subTotalPrice;
        }

        return 0.0;
    };
    
    orderSummaryService.getTotal = function() {
        if( angular.isNumber( CartManagementService.getCartResponse().total ) ) {
            return CartManagementService.getCartResponse().subTotalPrice;
        }

        return 0.0;
    };
    
    orderSummaryService.getTax = function() {
        if( angular.isNumber( CartManagementService.getCartResponse().tax ) ) {
            return CartManagementService.getCartResponse().tax;
        }

        return 0.0;
    };

    orderSummaryService.getDriverTip = function() {
        if( angular.isNumber( CartManagementService.getCartResponse().driverTip ) ) {
            return CartManagementService.getCartResponse().driverTip;
        }

        return 0.0;
    };

    orderSummaryService.getFees = function() {
        if( angular.isDefined( CartManagementService.getCartResponse().fees ) ) {
            return CartManagementService.getCartResponse().fees;
        }

        return {};
    };

}])

/**
 * @ngdoc service
 * @name cart.service:CartManagementService
 *
 * @description This is a service to manage the items in the cart
 *
 * @property {boolean} storedDataUpdated a boolean flag to tell other components that are watching it that the
 * cart has been updated.  This is a convenience property to avoid having to watch the entire cart cache, which would
 * be an expensive operation
 * @property {function} setStoredCartData a setter for storedCartData
 * @property {function} getStoredCartData a getter for storedCartData
 * @property {function} retrieveTransformedStoredCartData retrieve a product set
 * categorized by consumCatId.
 * @property {function} lookupProductData(prodId) will lookup if the cached cart object
 * has this product
 */
.service( 'CartManagementService', [ '$filter', 'CartResourceFactory', function( $filter, CartResourceFactory ) {

    var cartManagementService = this,
        storedCartData = [],
        cartResponse = {};

    cartManagementService.storedDataUpdated = true;

    cartManagementService.queryResults = function() {
        var $promise = CartResourceFactory.query().$promise;
        return $promise;
    };

    cartManagementService.setStoredCartData = function( _storedCartData ) {
        cartResponse = _storedCartData;

        if( angular.isDefined(_storedCartData.items) ) {
            storedCartData = _storedCartData.items;
        } else {
            storedCartData = [];
        }
        cartManagementService.storedDataUpdated = true;
    };

    cartManagementService.getStoredCartData = function() {
        return storedCartData;
    };

    cartManagementService.getCartResponse = function() {
        return cartResponse;
    };

    cartManagementService.lookupProductData = function( prodId ) {

        var product = {};

        // used for switching of content in the add to cart button directive
        product.found = false;

        angular.forEach( storedCartData, function( _product ) {
            if( _product.prodId === prodId ) {
                product = _product;
                product.found = true;
            }
        } );

        return product;
    };

}] );;
// Source: src/main/js/app/components/collapse/collapse.js
angular.module('collapse', ['transition'])
/**
 * @ngdoc directive
 * @name collapse.directive:collapse
 * @restrict EAC
 * @priority default
 * @description Provides a simple way to hide and show an element with a css transition
 *
 * @example
   <doc:example>
       <doc:source>
           <script>
               function CollapseDemoCtrl($scope) {
                  $scope.isCollapsed = false;
                }
           </script>
           <div ng-controller="CollapseDemoCtrl">
               <button class="btn btn-default" ng-click="isCollapsed = !isCollapsed">Toggle collapse</button>
               <hr>
               <div collapse="isCollapsed">
                   <div class="well well-lg">Some content</div>
               </div>
           </div>
       </doc:source>
   </doc:example>
 */
    .directive('collapse', ['$transition', function ($transition) {

        return {
            link: function (scope, element, attrs) {

                var initialAnimSkip = true;
                var currentTransition;

                function doTransition(change) {

                    function newTransitionDone() {
                        // Make sure it's this transition, otherwise, leave it alone.
                        if (currentTransition === newTransition) {
                            currentTransition = undefined;
                        }
                    }

                    var newTransition = $transition(element, change);
                    if (currentTransition) {
                        currentTransition.cancel();
                    }
                    currentTransition = newTransition;
                    newTransition.then(newTransitionDone, newTransitionDone);
                    return newTransition;
                }

                function expand() {
                    if (initialAnimSkip) {
                        initialAnimSkip = false;
                        expandDone();
                    } else {
                        element.removeClass('collapse').addClass('collapsing');
                        doTransition({ height: element[0].scrollHeight + 'px' }).then(expandDone);
                    }
                }

                function expandDone() {
                    element.removeClass('collapsing');
                    element.addClass('collapse in');
                    element.css({height: 'auto'});
                }

                function collapse() {
                    if (initialAnimSkip) {
                        initialAnimSkip = false;
                        collapseDone();
                        element.css({height: 0});
                    } else {
                        // CSS transitions don't work with height: auto, so we have to manually change the height to a specific value
                        element.css({ height: element[0].scrollHeight + 'px' });
                        //trigger reflow so a browser realizes that height was updated from auto to a specific value
                        /* jshint -W098 */
                        element[0].offsetWidth;

                        element.removeClass('collapse in').addClass('collapsing');

                        doTransition({ height: 0 }).then(collapseDone);
                    }
                }

                function collapseDone() {
                    element.removeClass('collapsing');
                    element.addClass('collapse');
                }

                scope.$watch(attrs.collapse, function (shouldCollapse) {
                    if (shouldCollapse) {
                        collapse();
                    } else {
                        expand();
                    }
                });
            }
        };
    }]);;
// Source: src/main/js/app/components/form/form-services.js
angular.module('form', [])

/**
 * @ngdoc service
 * @name form.service:FormHelperService
 *
 * @description Contains a set of methods to be injected into the scope of a controller using the injectFormHelperMethodsToScope method.
 *
 * @property {function} injectFormHelperMethodsToScope($scope) given a scope it will inject all the helper methods to that scope
 *
 * @property {function} isControllerInErrorState(ngModelController) [helperMethod] checks if a controller is in an error state.
 * @property {function} getCssClasses(ngModelController) [helperMethod] used to add/remove error state classes from the form elements within all login forms
 * @property {function} showError(ngModelController,error) [helperMethod] used to get an error message for a specified FormFieldController
 */
.service('FormHelperService', [ function() {
    var service = this;

    service.resetFormErrorsForCode = function(ngFormController, code) {

        var angularFormControllerComponentRegex = /^\$.*$/;

        if( angular.isDefined(code) ) {
            for( var key in ngFormController ) {
                if( angularFormControllerComponentRegex.test(key) === false && !!( ngFormController[key]['setCustomValidity']) ) {
                    ngFormController[key].setCustomValidity(code,true);
                }
            }

            ngFormController.setCustomValidity(code,true);
        }
    };

}])

.directive('form', [ function() {
    return {
        restrict: 'EAC',
        require: 'form',
        priority: 1, // should run after the default directive
        link: function(scope, element, attr, ctrl) {
            if(ctrl) {
                var recheckCustomErrors = function() {
                    var newValue = false;
                    _.each(_.values(ctrl.$customError), function(error) {
                        if( error === true ) {
                            newValue = true;
                        }
                    });
                    ctrl.$customInvalid = newValue;

                    ctrl.$customValid = ! ctrl.$customInvalid;
                };

                ctrl.$customError = {};

                ctrl.setCustomValidity = function(code, value) {
                    ctrl.$customError[code] = ! value;

                    recheckCustomErrors();
                };

                recheckCustomErrors();

                scope.isInvalid = function(ngModelController) {
                    if(ngModelController) {
                        return ngModelController.$invalid;
                    }
                };

                scope.getCssClasses = function(ngModelController) {
                    return {
                        error: (ngModelController.$invalid || ngModelController.$customInvalid) && ngModelController.$dirty && scope.formSubmitted,
                        success: ngModelController.$valid && ngModelController.$customValid && ngModelController.$dirty && scope.formSubmitted
                    };
                };

                scope.isControllerInErrorState = function(ngModelController) {
                    if(ngModelController) {
                        return (ngModelController.$invalid || ngModelController.$customInvalid) && ngModelController.$dirty && scope.formSubmitted;
                    }
                };

                scope.showError = function(ngModelController, error) {
                    return ngModelController.$error[error] || ngModelController.$customError[error];
                };
            }
        }
    };
}])

.directive('input', [ function() {
    return {
        restrict: 'E',
        require: '?ngModel',
        priority: 1, // should run after the default directive
        link: function(scope, element, attr, ctrl) {
            if(ctrl) {
                var parentForm = element.inheritedData('$formController') || null;

                var recheckCustomErrors = function() {
                    var newValue = false;
                    _.each(_.values(ctrl.$customError), function(error) {
                        if( error === true ) {
                            newValue = true;
                        }
                    });
                    ctrl.$customInvalid = newValue;

                    ctrl.$customValid = ! ctrl.$customInvalid;
                };

                ctrl.$customError = {};

                ctrl.setCustomValidity = function(code, value) {
                    ctrl.$customError[code] = ! value;

                    if( parentForm !== null ) {
                        parentForm.setCustomValidity(code, value);
                    }
                    recheckCustomErrors();
                };

                recheckCustomErrors();
            }
        }
    };
}]);;
// Source: src/main/js/app/components/geocode/geocoding-service.js
angular.module('GeoCodingServices', [])

/**
 * @ngdoc service
 * @name geocoder.service:GeoCoder
 *
 * @description provides a geocode method to fetch the current browser/device location via google's
 * geolocation service
 */
.service('GeoCoder', ['$q', function($q) {
    return {
        geocode : function(options) {
            var deferred = $q.defer();
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode(options, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    deferred.resolve(results);
                } else {
                    deferred.reject('Geocoder failed due to: '+ status);
                }
            });
            return deferred.promise;
        }
    };
}])

/**
 * @ngdoc service
 * @name geocoder.service:GeoCoder
 *
 * @description provides a composite getCurrentPosition of {@link geocoder.service:NavigatorGeolocation NavigatorGeolocation} and
 * google's location apis in order to resolve the user's lat,lng, and zip code.
 */
.service('NavigatorGeoCoderGeoLocation', [ '$q', 'NavigatorGeolocation', function( $q, NavigatorGeolocation ) {
    return {
        getCurrentPosition: function() {
            var deferred = $q.defer();

            NavigatorGeolocation.getCurrentPosition()
                .then(function(position) {

                    var locale = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                    new google.maps.Geocoder().geocode({'latLng': locale}, function( results, status ) {

                        if( status === google.maps.GeocoderStatus.OK && results.length > 0) {
                            for( var i = 0; i < results.length; i++ ) {
                                var result = results[i];

                                for( var j = 0; j < result.types.length; j++ ) {
                                    var type = result.types[j],
                                        regex = /^.*(\d{5}).*$/;
                                    if( type === 'postal_code' && regex.test(result.formatted_address ) ) {

                                        position.zip = result.formatted_address.match(regex)[1];

                                        deferred.resolve(position);
                                    }
                                }
                            }

                            deferred.reject('Failed to retrieve position due to: ZIP_NOT_PRESENT_IN_RESULTS');
                        } else {
                            deferred.reject('Geocoder failed due to: ' + status );
                        }
                    });
                })
                .catch(function(error) {
                    console.dir(error);
                });

            return deferred.promise;
        }
    };
}])

/**
 * @ngdoc service
 * @name geocoder.service:NavigatorGeolocation
 *
 * @description fetches the user's current location via the html5 browser api
 */
.service('NavigatorGeolocation', ['$q', function($q) {
    return {
        getCurrentPosition: function() {
            var deferred = $q.defer();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        deferred.resolve(position);
                    }, function(evt) {
                        console.error(evt);
                        deferred.reject(evt);
                    }
                );
            } else {
                deferred.reject("Browser Geolocation service failed.");
            }
            return deferred.promise;
        }
    };
}]);
;
// Source: src/main/js/app/components/home/controllers/home-controllers.js
angular.module('home', ['ngRoute', 'ngAnimate'])

/**
 * @ngdoc overview
 * @name home
 *
 * @description This module contains the routes specified for the home page of
 * the application. It also contains a mapping for a catch all route to automatically
 * redirect the user to the home page if an invalid url is given.  Currently the controller
 * is blank since no functionality is currently in the home page.  Any added functionality
 * should be added via directives
 */

    .config([   '$routeProvider',
        function($routeProvider) {
            $routeProvider
                .when('/home', {
                    controller: 'HomeController',
                    reloadOnSearch: false,
                    templateUrl: 'site/pages/home/home.html'
                })
                .when('/', {
                    controller: 'HomeController',
                    reloadOnSearch: false,
                    templateUrl: 'site/pages/home/home.html'
                })
                .otherwise('/home');
    }])


    .controller('HomeController', [function( ) {
    }]);;
// Source: src/main/js/app/components/http/interceptors/http-interceptor.js
angular.module( 'httpInterceptor', [ 'ngResource', 'config', 'AuthHelpers' ])

/**
 * @ngdoc overview
 * @name httpInterceptor
 * @description This component manages a chain of responsibility for each async request
 * made from angular
 */

/**
 *
 * @ngdoc service
 * @name httpInterceptor.factory:SessionHttpInterceptor
 *
 * @description This interceptor will check the response code of a failed $http promise
 * and check if it has a response code of either 401 or 403.  If it does it should
 * retry the promise once.  This is used so that if a user's cookie expires it will cause
 * the 401/403, however on the failed request the cookie will be recreated.
 *
 * Therefore, it is safe to then just rerun the request since the cookie will be there for
 * any subsequent requests.  However, if the cookie is not created for once reason or another
 * then it should not rerun the request more than once.  This is configurable via the maxInterceptions
 * variable.
 *
 * @require $q
 * @require $injector
 * @require API_KEY
 */
.factory( 'SessionHttpInterceptor', [ '$q', '$injector', 'API_KEY', function($q, $injector, API_KEY) {

    var factory = this;
    factory.maxInterceptions = 1;
    factory.interceptions = 0;

    return {
        'responseError': function(rejection) {

            if( ( rejection.status === 403 || rejection.status === 401 ) && ( rejection.data.response.code === 'SESSION_INVALID' || rejection.data.response.code === 'REQUEST_INVALID' ) && factory.interceptions <= factory.maxInterceptions ) {

                var $http = $injector.get('$http');

                var sessionIdPromise = $http({
                    url: '/api/v2.0/sessionid',
                    method: 'GET',
                    isArray: false,
                    headers: {
                        'Authorization': 'Basic ' + btoa(API_KEY)
                    }
                });

                return sessionIdPromise.then(function() {
                    return $http( rejection.config );
                });
            }

            factory.interceptions = 0;

            return $q.reject(rejection);
        }
    };
}])

/**
 *
 * @ngdoc service
 * @name httpInterceptor.factory:AuthHttpInterceptor
 *
 * @description This interceptor will check once if the user is logged in at the start
 * of the angular application by chaining a login check promise onto the promise made.
 *
 * If a request results in a failure response code of either 401 or 403 and has a response
 * string code of LOGIN_REQUIRED then it will redirect the user to the login page.
 *
 * @require $q
 * @require $injector
 * @require API_KEY
 */
.factory('AuthHttpInterceptor', [ '$q', '$injector', 'AuthHelperService', function($q, $injector, AuthHelperService) {

    return {
        'response': function(response) {

            var $http = $injector.get('$http');

            if( AuthHelperService.shouldValidateLogin === false ) {
                return response;
            }
            AuthHelperService.shouldValidateLogin = false;

            var userStatusPromise = $http(
                    {
                        url: '/api/v2.0/user/status',
                        method: 'GET',
                        isArray: false
                    });

            return userStatusPromise.then(function(responseData) {

                var isUserLoggedIn = AuthHelperService.isLoggedForUserStatus(responseData.data);

                if(isUserLoggedIn && AuthHelperService.isUserOnLoginPage()) {
                    AuthHelperService.redirectToHome();
                } else if (isUserLoggedIn === false && AuthHelperService.isUserOnHomePage()) {
                    AuthHelperService.redirectToLogin();
                }

                return response;
            });
        },

        'responseError': function(rejection) {

            if( angular.isDefined(rejection.data) === false || angular.isDefined(rejection.data.response) === false || angular.isDefined(rejection.data.response.code) === false ) {
                return $q.reject(rejection);
            }

            var $http = $injector.get('$http');

            if( rejection.status === 409 && rejection.data.response.code === 'SESSION_ABORTED' ) {
                // TODO: handle aborted flow with confirmation dialog
                // AuthHelperService.queueRequest(rejection.config);


                // For now we will simply retry to boot out the other user
                return $http(rejection.config);
            }

            if( rejection.status === 409 && rejection.data.response.code === 'SESSION_LOCKED' ) {
                // handle locked flow with status dialog
                // AuthHelperService.retryRequestWithInterval(rejection.config, 30000);
            }

            if( rejection.status === 401 && rejection.data.response.code === 'LOGIN_REQUIRED' ) {
                AuthHelperService.redirectToLoginWithErrorCode(rejection.data.response.code);
            }

            return $q.reject(rejection);
        }
    };
}])

.factory('CacheBustInterceptor', [ 'CHECKSUM_STORE',function(checkSumStore) {

    var injectCheckSummedUrlToRequest = function(request) {
        var checkSummedUrl = checkSumStore[request.url];
        request.url = checkSummedUrl;
    };

    return {
        'request': function(request) {

            var urlRegex = /^.*\.html$/;

            if (urlRegex.test(request.url)) {

                if(angular.isDefined(checkSumStore) && checkSumStore !== null ) {
                    injectCheckSummedUrlToRequest(request);

                    return request;
                }
            }

            return request;
        }
    };
}])

.config( [ '$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('SessionHttpInterceptor');
    $httpProvider.interceptors.push('AuthHttpInterceptor');
    $httpProvider.interceptors.push('CacheBustInterceptor');
}]);
;
// Source: src/main/js/app/components/keyedRoutes/keyedRouteService.js
angular.module('keyedRoute', [] )

/**
 * @ngdoc service
 * @name util.service:keyedRouteService
 *
 * @property {function} getKeyedArray(params)
 *
 * <h2>Description:</h2>
 *
 * Will take a string in the form of a url and produce a map of arrays.
 *
 * <h2>Parameters:</h2>
 * <ul>
 *     <li><b>params</b> - a url string</li>
 * </ul>
 *
 * <h2>Example:</h2>
 * <pre>
 *     keyedRouteService.getKeyedArray( '/categories/0/categories/1/categories/2/products/1' );
 *
 *     {
 *         'categories': [ 0,1,2 ],
 *         'products': [1]
 *     }
 * </pre>
 */
    .service( 'keyedRouteService', function() {

        this.getKeyedArray = function( params ) {

            var keyedArray = {};

            if( typeof params === 'undefined' ) {
                return keyedArray;
            }

            if( params.lastIndexOf("/") === params.length - 1 ) {
                params = params.substring(0, params.lastIndexOf("/"));
            }
            if( params.indexOf("/") === 0 ) {
                params = params.substring( 1, params.length );
            }

            var paramParts = params.split("/");

            if( paramParts.length % 2 !== 0 ) {
                return keyedArray;
            }

            for( var i = 0; i < paramParts.length; i+=2 ) {

                var name = paramParts[i];
                var value = paramParts[i+1];

                if( typeof keyedArray[name] === 'undefined' ) {
                    keyedArray[name] = [];
                }

                keyedArray[name].push( value );
            }

            return keyedArray;

        };

    });;
// Source: src/main/js/app/components/keypress/keypress-directives.js
// Taken from angular ui bootstrap

// http://angular-ui.github.io/ui-utils/#/keypress

angular.module('ui.keypress',[])
.factory('keypressHelper', ['$parse', function keypress($parse){
  var keysByCode = {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    27: 'esc',
    32: 'space',
    33: 'pageup',
    34: 'pagedown',
    35: 'end',
    36: 'home',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    45: 'insert',
    46: 'delete'
  };

  var capitaliseFirstLetter = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return function(mode, scope, elm, attrs) {
    var params, combinations = [];
    params = scope.$eval(attrs['ui'+capitaliseFirstLetter(mode)]);

    // Prepare combinations for simple checking
    angular.forEach(params, function (v, k) {
      var combination, expression;
      expression = $parse(v);

      angular.forEach(k.split(' '), function(variation) {
        combination = {
          expression: expression,
          keys: {}
        };
        angular.forEach(variation.split('-'), function (value) {
          combination.keys[value] = true;
        });
        combinations.push(combination);
      });
    });

    // Check only matching of pressed keys one of the conditions
    elm.bind(mode, function (event) {
      // No need to do that inside the cycle
      var metaPressed = !!(event.metaKey && !event.ctrlKey);
      var altPressed = !!event.altKey;
      var ctrlPressed = !!event.ctrlKey;
      var shiftPressed = !!event.shiftKey;
      var keyCode = event.keyCode;

      // normalize keycodes
      if (mode === 'keypress' && !shiftPressed && keyCode >= 97 && keyCode <= 122) {
        keyCode = keyCode - 32;
      }

      // Iterate over prepared combinations
      angular.forEach(combinations, function (combination) {

        var mainKeyPressed = combination.keys[keysByCode[keyCode]] || combination.keys[keyCode.toString()];

        var metaRequired = !!combination.keys.meta;
        var altRequired = !!combination.keys.alt;
        var ctrlRequired = !!combination.keys.ctrl;
        var shiftRequired = !!combination.keys.shift;

        if (
          mainKeyPressed &&
          ( metaRequired === metaPressed ) &&
          ( altRequired === altPressed ) &&
          ( ctrlRequired === ctrlPressed ) &&
          ( shiftRequired === shiftPressed )
        ) {
          // Run the function
          scope.$apply(function () {
            combination.expression(scope, { '$event': event });
          });
        }
      });
    });
  };
}]);

/**
 * @ngdoc directive
 * @name keypress.directive:uiKeydown
 *
 * @description The directive takes a hash (object) with the key code as the key and the callback function to fire as the value. The callback function takes an 'event' param
 * @param {hash} hash keycode to callback relation
 *
 * @example
 * <doc:example>
 *     <doc:source>
 *         <script>
 *              $scope.keypressCallback = function($event) {
 *                  alert('Voila!');
 *                  $event.preventDefault();
 *              }
 *         </script>
 *
 *         <textarea
 *             ui-keydown="{'enter alt-space':'keypressCallback($event)'}">
 *         </textarea>
 *     </doc:source>
 * </doc:example>
 **/
angular.module('ui.keypress').directive('uiKeydown', ['keypressHelper', function(keypressHelper){
  return {
    link: function (scope, elm, attrs) {
      keypressHelper('keydown', scope, elm, attrs);
    }
  };
}]);

/**
 * @ngdoc directive
 * @name keypress.directive:uiKeypress
 *
 * @description The directive takes a hash (object) with the key code as the key and the callback function to fire as the value. The callback function takes an 'event' param
 * @param {hash} hash keycode to callback relation
 *
 * @example
 * <doc:example>
 *     <doc:source>
 *         <script>
 *              $scope.keypressCallback = function($event) {
 *                  alert('Voila!');
 *                  $event.preventDefault();
 *              }
 *         </script>
 *
 *         <textarea
 *             ui-keypress="{'enter alt-space':'keypressCallback($event)'}">
 *         </textarea>
 *     </doc:source>
 * </doc:example>
 *
 **/
angular.module('ui.keypress').directive('uiKeypress', ['keypressHelper', function(keypressHelper){
  return {
    link: function (scope, elm, attrs) {
      keypressHelper('keypress', scope, elm, attrs);
    }
  };
}]);

/**
 * @ngdoc directive
 * @name keypress.directive:uiKeyup
 *
 * @description The directive takes a hash (object) with the key code as the key and the callback function to fire as the value. The callback function takes an 'event' param
 * @param {hash} hash keycode to callback relation
 * @example
 * <doc:example>
 *     <doc:source>
 *         <script>
 *              $scope.keypressCallback = function($event) {
 *                  alert('Voila!');
 *                  $event.preventDefault();
 *              }
 *         </script>
 *
 *         <textarea
 *             ui-keyup="{'enter alt-space':'keypressCallback($event)'}">
 *         </textarea>
 *     </doc:source>
 * </doc:example>
 *
 **/
angular.module('ui.keypress').directive('uiKeyup', ['keypressHelper', function(keypressHelper){
  return {
    link: function (scope, elm, attrs) {
      keypressHelper('keyup', scope, elm, attrs);
    }
  };
}]);;
// Source: src/main/js/app/components/loading/loading-directive.js
angular.module( 'loading', [] )

.config(['$provide', function($provide) {
    $provide.decorator('ngClickDirective', ['$delegate', function($delegate) {
        // drop the default ngClick directive
        $delegate.shift();
        return $delegate;
    }]);
}])
/**
 * @ngdoc directive
 * @name loading.directive:ppdLoadingClick
 *
 * @description This directive is used to display loading animations in a button or elsewhere.
 * It will also add in necessary dom when specified within the given element.
 *
 * In the case where this is not a route change request you must broadcast/emit the event depending on the locations
 * of the loading element and controller using the ppdLoadingActionFinish event.
 *
 * @restrict A
 *
 * @param {function} ppd-loading-click option must contain a scope method callback for when
 * this is clicked. It should usually be a route change request.
 * @param {string=} [animation-target=self] option must be given a valid selector (preferably an id) to send the animation
 * classes to
 * @param {string=} [animation-class=loading] class to apply when loading
 * @param {string=} [loading-style=null] class to apply on top of the animation class
 * @param {boolean=} [disable-clicks=false] flag to disable click of all other ppdLoadingClick directives
 * @param {boolean=} [create-child-element=false] flag to add a child element to itself of <pre><span class='loading-spinner'></span></pre>
 * @param {function=} [done-callback=function(){}] callback to be triggered when expression in ppd-loading-click has completed
 * @param {boolean=} [prevent-bubbling=false] flag to enable/disable stopPropagation on click event
 *
 * @example
 * <doc:example>
 *     <doc:source>
 *         Simple loading animation
 *         <a ppd-loading-click="loadAsyncData()">demo</a>
 *
 *         Create loading animation element and add child element
 *         <a ppd-loading-click="loadAsyncData()" create-child-element></a>
 *     </doc:source>
 * </doc:example>
 */
    .directive( 'ngClick', [ 'ppdLoadingFactory', 'ppdLoadingService', '$animate', '$parse', '$timeout', '$rootElement', function(ppdLoadingFactory, ppdLoadingService, $animate, $parse, $timeout, $rootElement) {

        return {
            restrict: 'A',
            compile: function( element, attributes ) {
                var defaults = {
                    animationTarget: element,
                    animationClass: 'loading',
                    disableClicks: true,
                    loadingStyle: 'dark',
                    createChildElement: false
                };

                var TAP_DURATION = 750; // Shorter than 750ms is a tap, longer is a taphold or drag.
                var MOVE_TOLERANCE = 12; // 12px seems to work in most mobile browsers.
                var PREVENT_DURATION = 2500; // 2.5 seconds maximum from preventGhostClick call to click
                var CLICKBUSTER_THRESHOLD = 25; // 25 pixels in any dimension is the limit for busting clicks.

                var ACTIVE_CLASS_NAME = 'ng-click-active';
                var lastPreventedTime;
                var touchCoordinates;
                var lastLabelClickCoordinates;


                // TAP EVENTS AND GHOST CLICKS
                //
                // Why tap events?
                // Mobile browsers detect a tap, then wait a moment (usually ~300ms) to see if you're
                // double-tapping, and then fire a click event.
                //
                // This delay sucks and makes mobile apps feel unresponsive.
                // So we detect touchstart, touchmove, touchcancel and touchend ourselves and determine when
                // the user has tapped on something.
                //
                // What happens when the browser then generates a click event?
                // The browser, of course, also detects the tap and fires a click after a delay. This results in
                // tapping/clicking twice. We do "clickbusting" to prevent it.
                //
                // How does it work?
                // We attach global touchstart and click handlers, that run during the capture (early) phase.
                // So the sequence for a tap is:
                // - global touchstart: Sets an "allowable region" at the point touched.
                // - element's touchstart: Starts a touch
                // (- touchmove or touchcancel ends the touch, no click follows)
                // - element's touchend: Determines if the tap is valid (didn't move too far away, didn't hold
                //   too long) and fires the user's tap handler. The touchend also calls preventGhostClick().
                // - preventGhostClick() removes the allowable region the global touchstart created.
                // - The browser generates a click event.
                // - The global click handler catches the click, and checks whether it was in an allowable region.
                //     - If preventGhostClick was called, the region will have been removed, the click is busted.
                //     - If the region is still there, the click proceeds normally. Therefore clicks on links and
                //       other elements without ngTap on them work normally.
                //
                // This is an ugly, terrible hack!
                // Yeah, tell me about it. The alternatives are using the slow click events, or making our users
                // deal with the ghost clicks, so I consider this the least of evils. Fortunately Angular
                // encapsulates this ugly logic away from the user.
                //
                // Why not just put click handlers on the element?
                // We do that too, just to be sure. If the tap event caused the DOM to change,
                // it is possible another element is now in that position. To take account for these possibly
                // distinct elements, the handlers are global and care only about coordinates.

                // Checks if the coordinates are close enough to be within the region.
                function hit(x1, y1, x2, y2) {
                    return Math.abs(x1 - x2) < CLICKBUSTER_THRESHOLD && Math.abs(y1 - y2) < CLICKBUSTER_THRESHOLD;
                }

                // Checks a list of allowable regions against a click location.
                // Returns true if the click should be allowed.
                // Splices out the allowable region from the list after it has been used.
                function checkAllowableRegions(touchCoordinates, x, y) {
                    for (var i = 0; i < touchCoordinates.length; i += 2) {
                        if (hit(touchCoordinates[i], touchCoordinates[i+1], x, y)) {
                            touchCoordinates.splice(i, i + 2);
                            return true; // allowable region
                        }
                    }
                    return false; // No allowable region; bust it.
                }

                // Global click handler that prevents the click if it's in a bustable zone and preventGhostClick
                // was called recently.
                function onClick(event) {
                    if (Date.now() - lastPreventedTime > PREVENT_DURATION) {
                        return; // Too old.
                    }

                    var touches = event.touches && event.touches.length ? event.touches : [event];
                    var x = touches[0].clientX;
                    var y = touches[0].clientY;
                    // Work around desktop Webkit quirk where clicking a label will fire two clicks (on the label
                    // and on the input element). Depending on the exact browser, this second click we don't want
                    // to bust has either (0,0), negative coordinates, or coordinates equal to triggering label
                    // click event
                    if (x < 1 && y < 1) {
                        return; // offscreen
                    }
                    if (lastLabelClickCoordinates &&
                        lastLabelClickCoordinates[0] === x && lastLabelClickCoordinates[1] === y) {
                        return; // input click triggered by label click
                    }
                    // reset label click coordinates on first subsequent click
                    if (lastLabelClickCoordinates) {
                        lastLabelClickCoordinates = null;
                    }
                    // remember label click coordinates to prevent click busting of trigger click event on input
                    if (event.target.tagName.toLowerCase() === 'label') {
                        lastLabelClickCoordinates = [x, y];
                    }

                    // Look for an allowable region containing this click.
                    // If we find one, that means it was created by touchstart and not removed by
                    // preventGhostClick, so we don't bust it.
                    if (checkAllowableRegions(touchCoordinates, x, y)) {
                        return;
                    }

                    // If we didn't find an allowable region, bust the click.
                    event.stopPropagation();
                    event.preventDefault();

                    // Blur focused form elements
                    event.target && event.target.blur();
                }


                // Global touchstart handler that creates an allowable region for a click event.
                // This allowable region can be removed by preventGhostClick if we want to bust it.
                function onTouchStart(event) {
                    var touches = event.touches && event.touches.length ? event.touches : [event];
                    var x = touches[0].clientX;
                    var y = touches[0].clientY;
                    touchCoordinates.push(x, y);

                    $timeout(function() {
                        // Remove the allowable region.
                        for (var i = 0; i < touchCoordinates.length; i += 2) {
                            if (touchCoordinates[i] === x && touchCoordinates[i+1] === y) {
                                touchCoordinates.splice(i, i + 2);
                                return;
                            }
                        }
                    }, PREVENT_DURATION, false);
                }

                // On the first call, attaches some event handlers. Then whenever it gets called, it creates a
                // zone around the touchstart where clicks will get busted.
                function preventGhostClick(x, y) {
                    if (!touchCoordinates) {
                        $rootElement[0].addEventListener('click', onClick, true);
                        $rootElement[0].addEventListener('touchstart', onTouchStart, true);
                        touchCoordinates = [];
                    }

                    lastPreventedTime = Date.now();

                    checkAllowableRegions(touchCoordinates, x, y);
                }

                var options = angular.extend({}, defaults, ppdLoadingService.retrieveOptionsFromAttribute( attributes ) );
                var clickHandler = options.ngClick,
                    doneCallback = options.doneCallback || function() {};

                return function( scope, element, attr ) {

                    var tapping = false,
                        tapElement,  // Used to blur the element after a tap.
                        startTime,   // Used to check if the tap was held too long.
                        touchStartX,
                        touchStartY;

                    function resetState() {
                        tapping = false;
                        element.removeClass(ACTIVE_CLASS_NAME);
                    }

                    element.on('touchstart', function(event) {
                        tapping = true;
                        tapElement = event.target ? event.target : event.srcElement; // IE uses srcElement.
                        // Hack for Safari, which can target text nodes instead of containers.
                        if(tapElement.nodeType === 3) {
                            tapElement = tapElement.parentNode;
                        }

                        element.addClass(ACTIVE_CLASS_NAME);

                        startTime = Date.now();

                        var touches = event.touches && event.touches.length ? event.touches : [event];
                        var e = touches[0].originalEvent || touches[0];
                        touchStartX = e.clientX;
                        touchStartY = e.clientY;
                    });

                    element.on('touchmove', function() {
                        resetState();
                    });

                    element.on('touchcancel', function() {
                        resetState();
                    });

                    element.on('touchend', function(event) {
                        var diff = Date.now() - startTime;

                        var touches = (event.changedTouches && event.changedTouches.length) ? event.changedTouches :
                            ((event.touches && event.touches.length) ? event.touches : [event]);
                        var e = touches[0].originalEvent || touches[0];
                        var x = e.clientX;
                        var y = e.clientY;
                        var dist = Math.sqrt( Math.pow(x - touchStartX, 2) + Math.pow(y - touchStartY, 2) );

                        if (tapping && diff < TAP_DURATION && dist < MOVE_TOLERANCE) {
                            // Call preventGhostClick so the clickbuster will catch the corresponding click.
                            preventGhostClick(x, y);

                            // Blur the focused element (the button, probably) before firing the callback.
                            // This doesn't work perfectly on Android Chrome, but seems to work elsewhere.
                            // I couldn't get anything to work reliably on Android Chrome.
                            if (tapElement) {
                                tapElement.blur();
                            }

                            if (!angular.isDefined(attr.disabled) || attr.disabled === false) {
                                element.triggerHandler('click', [event]);
                            }
                        }

                        resetState();
                    });

                    // Hack for iOS Safari's benefit. It goes searching for onclick handlers and is liable to click
                    // something else nearby.
                    element.onclick = function() { };

                    // Actual click handler.
                    // There are three different kinds of clicks, only two of which reach this point.
                    // - On desktop browsers without touch events, their clicks will always come here.
                    // - On mobile browsers, the simulated "fast" click will call this.
                    // - But the browser's follow-up slow click will be "busted" before it reaches this handler.
                    // Therefore it's safe to use this directive on both mobile and desktop.
                    element.on('click', function(event, touchend) {
                        // Adds class to target element

                        if( options.loading ) {
                            if( options.preventBubbling ) {
                                event.stopPropagation();
                            }

                            if( attr.disabled === true) {
                                options.preventBubbling = true;
                            }

                            if( ppdLoadingService.isCurrentlyLoading === false ) {

                                if( options.disableClicks ) {
                                    ppdLoadingService.isCurrentlyLoading = true;
                                }

                                $animate.addClass(element, options.animationClass);
                                scope.loading = true;

                                var hasChildElement = false;
                                angular.forEach( element.children(), function( element ) {
                                    if( element.className === 'loading-spinner' ) {
                                        hasChildElement = true;
                                    }
                                });

                                if( hasChildElement === false ) {
                                    element.prepend('<span class=\'loading-spinner\'></span>');
                                }

                                setTimeout( function() {
                                    ppdLoadingService.isCurrentlyLoading = false;
                                }, 1000 );

                                scope.$apply(function() {
                                    clickHandler(scope, {$event: (touchend || event)});
                                });
                            }
                        } else {
                            scope.$apply(function() {
                                clickHandler(scope, {$event: (touchend || event)});
                            });
                        }
                    });

                    element.on('mousedown', function() {
                        element.addClass(ACTIVE_CLASS_NAME);
                    });

                    element.on('mousemove mouseup', function() {
                        element.removeClass(ACTIVE_CLASS_NAME);
                    });

                    scope.$on( 'ppdLoadingActionFinish', function() {
                        $animate.removeClass(element, options.animationClass);

                        // Trigger done callback if exists
                        doneCallback(scope);

                        scope.loading = false;
                        ppdLoadingService.isCurrentlyLoading = false;
                        angular.forEach( element.children(), function( element ) {
                            if( element.className === 'loading-spinner' ) {
                                element.remove();
                            }
                        });
                    });
                };
            }
        };

    }])

    .service( 'ppdLoadingService', [ '$parse', function( $parse ) {

        this.isCurrentlyLoading = false;

        this.retrieveOptionsFromAttribute = function( attributes ) {

            var options = {};

            if( angular.isDefined( attributes.animationTarget ) ) {
                var element = angular.element(
                    document.querySelector( attributes.animationTarget )
                );
                options.animationTarget = element;
            }

            if( angular.isDefined( attributes.animationClass ) ) {
                if( attributes.animationClass !== '' ) {
                    options.animationClass = attributes.animationClass;
                }
            }

            if( angular.isDefined( attributes.loadingStyle ) ) {
                if( attributes.loadingStyle !== '' ) {
                    options.loadingStyle = attributes.loadingStyle;
                }
            }

            if( angular.isDefined( attributes.disableClicks ) ) {
                if( attributes.disableClicks === 'true' || attributes.disableClicks === 'false' ) {
                    options.disableClicks = attributes.disableClicks === 'true';
                }
            }

            if( angular.isDefined( attributes.preventBubbling ) ) {
                if( attributes.preventBubbling === 'true' || attributes.preventBubbling === 'false' ) {
                    options.preventBubbling = attributes.preventBubbling === 'true';
                } else {
                    options.preventBubbling = false;
                }
            }

            if( angular.isDefined( attributes.createChildElement ) ) {
                if( attributes.createChildElement === 'true' || attributes.createChildElement === 'false' ) {
                    options.createChildElement = attributes.createChildElement === 'true';
                }
            }

            if( angular.isDefined( attributes.loading ) ) {
                if( attributes.loading  === 'true' || attributes.loading === 'false' ) {
                    options.loading = attributes.loading === 'true';
                }
            }

            if( angular.isDefined( attributes.ngClick ) ) {
                options.ngClick = $parse(attributes.ngClick);
            }

            if( angular.isDefined( attributes.doneCallback ) ) {
                options.doneCallback = $parse(attributes.doneCallback);
            }

            return options;

        };

    }])

    .factory( 'ppdLoadingFactory', [ function() {

        var clicksEnabled = true;

        var ppdLoadingFactory = {};

        ppdLoadingFactory.enableClicks = function() {
            clicksEnabled = true;
        };

        ppdLoadingFactory.disableClicks = function() {
            clicksEnabled = false;
        };

        return ppdLoadingFactory;

    }]);;
// Source: src/main/js/app/components/overloads/overloads.js
angular.module('overloads', ['loading']);;
// Source: src/main/js/app/components/past-purchases/factories/past-purchases-factory.js
angular.module('PastPurchasesFactory', [ 'ngResource' ])
/**
 * @ngdoc service
 * @name pastPurchase.factory:PastPurchasesFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
     $resource('/api/v2.0/user/past-purchases',{},
         {
             'query': {
                    method: 'GET',
                    isArray: false,
                    params: {
                         sort: "@sort",
                         flags: true,
                         extendedInfo: true,
                         rows: "@rows",
                         start: "@start"
                    },
                    cache: true
             }
         });
 </pre>
 *
 */
    .factory('PastPurchasesFactory', ['$http', '$q', '$resource', function($http, $q, $resource) {

        return $resource('/api/v2.0/user/past-purchases',{},
            {
                'query': {
                    method: 'GET',
                    isArray: false,
                    params: {
                        sort: "@sort",
                        flags: true,
                        extendedInfo: true,
                        rows: "@rows",
                        start: "@start"
                    },
                    cache: true
                }
            });
    }]);;
// Source: src/main/js/app/components/past-purchases/providers/past-purchases-providers.js
angular.module('PastPurchasesProviders', ['PastPurchasesFactory'])
    .provider('PastPurchases', function() {

        this.$get = [ function() {} ];
        this.resolveData = ['$q', '$log','PastPurchasesFactory', function($q, $log, PastPurchasesFactory) {

            var data = {
                config: {
                    isFullWidth: true,

                    headerText: {
                        mobile: 'My Past Purchases',
                        tablet: 'My Past Purchases',
                        desktop: 'My Past Purchases'
                    },
                },
                
                productData: {
                    products: []
                },

                functions: {
                    updateResults: function(options) {
                        return getPastPurchasesPromise(options);
                    },
                }
            };

            var getPastPurchasesPromise = function(options) {
                // create deferred object and instantiate promise
                var deferred = $q.defer();
                var promise = deferred.promise;

                var sortType = options.sortType || '',
                /* filters = options.filter || [], */
                rows = options.rows || 30,
                start = options.start || 0;

                var payload = {
                    sort: sortType,
                    start: start,
                    rows: rows
                };

                // call factory
                var $promise = PastPurchasesFactory.query(payload).$promise;

                $promise.then( function(responseData) {

                    var appendProducts = options.appendProducts || false;

                    // Set product objects
                    if( appendProducts ) {
                        var newProducts = responseData.response.products;

                        for( var i = 0; i < newProducts.length; i++ ) {
                            data.productData.products.push(newProducts[i]);
                        }

                    } else {
                        data.productData.products = responseData.response.products;
                    }

                    // set data object properties to values returned from response
                    data.productData.productGroups = [];
                    data.productData.pagination = responseData.response.pagination;
                    data.productData.facets = responseData.response.facets;
                    data.productData.simpleFacets = responseData.response.simpleFacets;

                    deferred.resolve(data);

                })

                .catch(function(error) {
                    promise.reject("Error in retrieving past purchases: " + error);
                });

                return promise;
            };

            return getPastPurchasesPromise({});

        }];
});
;
// Source: src/main/js/app/components/product-browse/providers/product-browse-providers.js
angular.module('ProductBrowseProviders', ['ProductViewFactories', 'Properties', 'keyedRoute' ])

    .provider('productBrowse', function() {


        this.$get = [ function() {} ];

        this.resolveData = [ '$q', '$log', '$route', 'keyedRouteService', 'BrowseProviderHelperService', 'ProductSearchFactory', 'CategoryFactory', "$location", function( $q, $log, $route, keyedRouteService, BrowseProviderHelperService, ProductFactory, CategoryFactory, $location ) {

            var data = {
                config: {
                    sidebarTemplate: {
                        mobile: 'site/partials/mobile/pages/product-view/product-view-tree/product_view_sidebar.html',
                        tablet: 'site/partials/tablet/pages/product-view/product-view-tree/product_view_sidebar.html',
                        desktop: ''
                    },
                    sortTypes: [
                        {
                            name: 'Name',
                            value: 'name asc'
                        },
                        {
                            name: 'Price',
                            value: 'price asc'
                        },
                        {
                            name: 'Unit Price',
                            value: 'unitPrice asc'
                        },
                        {
                            name: 'Specials',
                            value: 'specials asc, name asc'
                        },
                        {
                            name: 'Most Popular',
                            value: 'itemsPurchased asc'
                        }
                    ]
                },
                productData: {
                    productGroupNameKey: 'categoryName',
                    productGroupId: 'categoryTreeId'
                }
            };

            var categoryParams = angular.isDefined($route.current.params.categories ) === false ? "" : $route.current.params.categories;
            var keyedParams = keyedRouteService.getKeyedArray( categoryParams );
            var isAtCategoryWithoutChildren = false;

            data.functions = {
                selectGroupPromise: function( category ) {
                    var categoryId = category.categoryTreeId;

                    var baseUrl = "/browse-aisles/";


                    for( var i = 0; i < keyedParams.categories.length - (isAtCategoryWithoutChildren ? 1 : 0 ); i++ ) {
                        if( category.isAncestor === true && parseInt(keyedParams.categories[i], 10) === categoryId ) {
                            break;
                        }
                        if( keyedParams.categories[i] !== "" ) {
                            baseUrl += "categories/" + keyedParams.categories[i] + "/";
                        }
                    }

                    BrowseProviderHelperService.isGroupSelection = true;
                    $location.path( baseUrl + 'categories/' + categoryId );
                },
                updateResults: function( options ) {
                    return getBrowsePromise( options );
                }
            };

            var getBrowsePromise = function(options) {

                var deferred = $q.defer();
                var promise = deferred.promise;

                var categoryPromises = [];
                for ( var i = 0; i < keyedParams.categories.length; i++ ) {
                    var categoryObject = {};
                    var item = keyedParams.categories[i];
                    if( item !== "" && ! isNaN(parseInt(item, 10)) && parseInt(item, 10) !== 1 ) {
                        categoryObject.categoryId = item;
                    }
                    categoryPromises.push(
                        CategoryFactory.get(categoryObject).$promise
                    );
                }

                $q.all(categoryPromises)
                    .then( function(categoryResults) {

                        var ancestorProductGroups = [];
                        var productGroups = [];

                        for( var i = 0; i < categoryResults.length; i++ ) {
                            var categoryResult = categoryResults[i].response.category;
                            var childCategories = categoryResults[i].response.childCategories;

                            categoryResult.categoryName = categoryResult.categoryId === 1 ?
                                "All Aisles" :
                                categoryResult.categoryName;


                            // This case will only occur if there are no child categories
                            // This means we are at a leaf node and should show the parent's
                            // child categories.  We should also not push the last ancestor category
                            // to the view
                            if ( childCategories.length > 0 ) {
                                categoryResult.isAncestor = true;
                                ancestorProductGroups.push(categoryResult);
                                productGroups = childCategories;
                                isAtCategoryWithoutChildren = false;
                                data.productData.isProductGroupSelected = false;
                            } else {
                                isAtCategoryWithoutChildren = true;
                                data.productData.isProductGroupSelected = true;
                            }

                        }

                        data.productData.ancestorProductGroups = ancestorProductGroups;
                        data.productData.productGroups = productGroups;
//                        data.currentSubCategories = productGroups;

                        data.config.headerText = {
                            mobile: '',
                            tablet: 'Browse Aisles',
                            desktop: 'Browse Aisles'
                        };

                        if( categoryResults.length === 1 ) {
                            data.productData.isAtRootCategory = true;
                            data.config.headerText.mobile = 'Browse Aisles';
                            return true;
                        }

                        data.productData.isAtSubcategory = true;

                        var leafCategory = categoryResults[ categoryResults.length - 1].response.category;

                        data.config.headerText.mobile = leafCategory.categoryName;
                        data.productData.selectedProductGroup = leafCategory;

                        // Product Search promise with sorting and filtering
                        var sortType = options.sortType || '',
                            filters = options.filter || [],
                            rows = options.rows || 20,
                            start = options.start || 0;

                        var payload = {
                            sort: sortType,
                            filter: filters,
                            catTreeId: leafCategory.categoryTreeId,
                            start: start,
                            rows: rows
                        };

                        var productPromise = ProductFactory.getByCatTreeId(payload).$promise;

                        return productPromise;

                    })
                    .catch( function( error ) {
                        deferred.reject(error );
                    })
                    .then( function( response ) {

                        if( response === true ) {
                            deferred.resolve(data);
                            return;
                        }

                        var appendProducts = options.appendProducts || false;

                        // Set product objects
                        if( appendProducts ) {
                            var newProducts = response.response.products;

                            for( var i = 0; i < newProducts.length; i++ ) {
                                data.productData.products.push(newProducts[i]);
                            }

                        } else {
                            data.productData.products = response.response.products;
                        }

                        data.productData.pagination = response.response.pagination;
                        data.productData.facets = response.response.facets;
                        data.productData.simpleFacets = response.response.simpleFacets;
                        data.config.shouldLoadDataToScopeSynchronously = BrowseProviderHelperService.isGroupSelection === false;
                        BrowseProviderHelperService.isGroupSelection = false;

                        deferred.resolve(data);
                    })
                    .catch( function( error ) {
                        deferred.reject(error );
                    });
                return promise;
            };

            return getBrowsePromise({});

        }];

    })

    .service('BrowseProviderHelperService', [ function() {
        var service = this;

        service.isGroupSelection = false;
    }]);


;
// Source: src/main/js/app/components/product-categories/factories/product-category-factory.js
angular.module('CategoryFactory', [ 'ngResource' ])
/**
 * @ngdoc service
 * @name category.factory:CategoryFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
 $resource('/api/v2.0/user/categories/:categoryId',
 {
 },
 {
     'query': {
         method: 'GET',
         isArray: false,
         cache: true
     },
     'get': {
         method: 'GET',
         isArray: false,
         params: {
             categoryId: '@categoryId'
 },
 cache: true
 }
 });
 </pre>
 *
 */
    .factory('CategoryFactory', ['$http', '$q', '$resource', function($http, $q, $resource) {

        return $resource('/api/v2.0/user/categories/:categoryId',
            {
            },
            {
                'query': {
                    method: 'GET',
                    isArray: false,
                    cache: true
                },
                'get': {
                    method: 'GET',
                    isArray: false,
                    params: {
                        categoryId: '@categoryId'
                    },
                    cache: true
                }
            });
    }]);;
// Source: src/main/js/app/components/product-groups/factories/product-group-factory.js
angular.module('ProductGroupFactories', [ 'ngResource' ])
/**
 * @ngdoc service
 * @name productGroup.factory:ProductGroupFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
 $resource('/api/v2.0/user/products/', {},
 {
     'get': {
         method: 'GET',
         isArray: false,
         params: {
             filter: '@filter',
             rows: '@rows',
             start: '@start'
         },
         cache: true
     }
 });
 </pre>
 *
 */
    .factory('ProductGroupFactory', ['$http', '$q', '$resource', function($http, $q, $resource) {

        return $resource('/api/v2.0/user/products/', {},
            {
                'get': {
                    method: 'GET',
                    isArray: false,
                    params: {
                        filter: '@filter',
                        rows: '@rows',
                        start: '@start'
                    },
                cache: true
            }
        });
    }]);

   ;
// Source: src/main/js/app/components/product-groups/providers/product-group-providers.js
angular.module('ProductGroupProviders', ['ProductGroupFactories'])
    .provider('ProductGroups', function() {

        var fetchGroupIdFromRoute = function($route) {
            var filter = angular.isDefined($route.current.params.filter) === false ? "" : $route.current.params.filter;
            return filter;
        };

        this.$get = [ function() {} ];
        this.resolveData = ['$q', '$log','$route', 'ProductGroupFactory', function($q, $log, $route, ProductGroupFactory) {

            var data = {
                config: {
                    isFullWidth: true
                                    
                },
                
                productData: {
                    product: []
                },

                functions: {
                    updateResults: function(options) {
                        return getProductGroupsPromise(options);
                    },
                }
            };

            var getProductGroupsPromise = function(options) {
                // create deferred object and instantiate promise
                var deferred = $q.defer();
                var promise = deferred.promise;

                var filter = 'productGroups:' + fetchGroupIdFromRoute( $route );

                var sortType = options.sortType || '',
                /* filters = options.filter || [], */
                rows = options.rows || 30,
                start = options.start || 0;

                var payload = {
                    filter: filter,
                    sort: sortType,
                    start: start,
                    rows: rows
                };

                // call factory
                var $promise = ProductGroupFactory.get(payload).$promise;

                $promise.then( function(responseData) {

                    var appendProducts = options.appendProducts || false;

                    // Set product objects
                    if( appendProducts ) {
                        var newProducts = responseData.response.products;

                        for( var i = 0; i < newProducts.length; i++ ) {
                            data.productData.products.push(newProducts[i]);
                        }

                    } else {
                        data.productData.products = responseData.response.products;
                    }

                    // set data object properties to values returned from response
                    data.productData.productGroups = [];
                    data.productData.pagination = responseData.response.pagination;
                    data.productData.facets = responseData.response.facets;

                    deferred.resolve(data);

                    data.config.headerText = {
                        mobile: filter,
                        tablet: filter,
                        desktop: filter
                    };
                })

                .catch(function(error) {
                    promise.reject("Error in retrieving past purchases: " + error);
                });

                return promise;
            };

            return getProductGroupsPromise({});

        }];
});
;
// Source: src/main/js/app/components/product-lists/controllers/product-list-controllers.js
angular.module('ProductListControllers', [ 'ProductListFactories' ] )

/**
 * @ngdoc controller
 * @name productLists.controller:ProductListManagementController
 * @description Used to perform CRUD operations on personal lists
 *
 * @property {boolean} editMode toggle edit mode of lists to rename/delete lists
 * @property {function} submitCreateList($event,list) create a list
 * @property {function} createList(list) create a list
 * @property {function} deleteList(list) delete a list
 * @property {function} submitRenameList($event,list) rename a list
 */
.controller('ProductListManagementController', [ '$scope', 'ProductListManagementService', function( $scope, ProductListService ) {

    $scope.$watch(function() {
        return ProductListService.productListCreateShow;
    }, function( newValue ) {
        if( newValue === true || newValue === false ) {
            $scope.productListCreateShow = newValue;
        }
    });

    $scope.$watch(function() {
        return ProductListService.currentLists;
    }, function( lists ) {
        if( angular.isDefined( lists ) && lists !== null ) {
            $scope.currentLists = lists;

            setTimeout(function() {
                $scope.listEdited = false;
            }, 0);
        }
    });

    $scope.editMode = false;

    $scope.toggleEditMode = function() {
        $scope.editMode = ! $scope.editMode;
        $scope.hideProductListCreate();
    };

    $scope.showProductListCreate = function() {
        $scope.productListCreateShow = true;
        $scope.editMode = false;
    };

    $scope.hideProductListCreate = function() {
        $scope.code = '';
        $scope.message = '';
        $scope.hasError = false;
        $scope.productListCreateShow = false;
    };

    $scope.submitCreateList = function( $event, list ) {
        console.log( $event );
        $scope.createList( list );
    };

    $scope.createList = function( list ) {
        if( ProductListService.isListProcessing === false ) {
            ProductListService.isListProcessing = true;
            ProductListService.createProductListPromise(list)
                .then( function() {
                    $scope.hideProductListCreate();

                    return ProductListService.retrieveProductListPromise();
                })
                .then(function(response) {
                    ProductListService.currentLists = response.response.lists;
                    ProductListService.isListProcessing = false;
                })
                .catch( function( response ) {
                    var data = response.data.response;
                    $scope.code = data.code;
                    $scope.message = data.msg;
                    $scope.hasError = true;
                    ProductListService.isListProcessing = false;
                    $scope.$broadcast('ppdLoadingActionFinish', {});
                });

        }
    };

    $scope.deleteList = function( list ) {
        if( ProductListService.isListProcessing === false ) {
            ProductListService.isListProcessing = true;

            ProductListService.deleteProductListPromise( list )
                .then( function( response ) {
                    console.dir( response );

                    $scope.listEdited = true;
                    return ProductListService.retrieveProductListPromise();
                })
                .then( function( response ) {
                    ProductListService.currentLists = response.response.lists;
                    ProductListService.isListProcessing = false;
                })
                .catch( function( response ) {
                    console.log( "An error occured while deleting list [" + list.listId + "] error: [" + response + "]" );
                    ProductListService.isListProcessing = false;
                });
        }
    };


    $scope.submitRenameList = function( $event, list ) {
        console.log( $event );

        if( ProductListService.isListProcessing === false ) {
            ProductListService.isListProcessing = true;

            ProductListService.renameProductListPromise( list )
                .then( function( response ) {
                    console.dir( response );

                    $scope.listEdited = true;
                    return ProductListService.retrieveProductListPromise();
                })
                .catch( function( response ) {
                    console.log( "An error occured while deleting list [" + list.listId + "] error: [" + response + "]" );
                    ProductListService.isListProcessing = false;
                    $scope.listEdited = true;
                    return ProductListService.retrieveProductListPromise();
                })
                .then( function( response ) {
                    ProductListService.currentLists = response.response.lists;
                    ProductListService.isListProcessing = false;
                });
        }

    };

}])

/**
 * @ngdoc service
 * @name productLists.service:ProductListManagementService
 *
 * @description A service to be used in conjunction with the product list controllers in order
 * to manage cross controller communication
 *
 * @property {function} retrieveProductListPromise
 * @property {function} createProductListPromise
 * @property {function} deleteProductListPromise
 * @property {function} renameProductListPromise
 * @property {boolean} isListProcessing
 * @property {boolean} productListCreateShow
 */
.service('ProductListManagementService', [ 'ProductListFactory', function( ProductListFactory ) {

    var service = this;

    service.retrieveProductListPromise = function() {
        var $promise = ProductListFactory.readLists().$promise;
        return $promise;
    };

    service.createProductListPromise = function( list ) {
        var $promise = ProductListFactory.createList(list).$promise;
        return $promise;
    };

    service.deleteProductListPromise = function( list ) {
        var $promise = ProductListFactory.deleteList( list).$promise;
        return $promise;
    };

    service.renameProductListPromise = function( list ) {
        var $promise = ProductListFactory.renameList( list).$promise;
        return $promise;
    };

    service.isListProcessing = false;
    service.productListCreateShow = false;
}])

/**
 * @ngdoc controller
 * @name productLists.controller:ProductListProductManagementController
 * @description A controller used to perform operations on a given product list.  Handles addition and removal of products from a list as well
 * as retrieval of the lists that a product belongs to.
 *
 * @property {function} getClassIfProductInList(list) should be used with the ng-class directive.
 * @property {function} toggleProductInList(list) used to toggle a product in a list
 * @property {function} removeProductFromListAndRefresh(list,productId) remove a given product from a given
 * list and refresh the products in that list
 */
.controller('ProductListProductManagementController', [ '$scope', 'ProductListProductManagementService', function( $scope, ProductListProductManagementService ) {

    var initController = function( retrieveLists ) {
        if( retrieveLists === true ) {
            var listsWithThisProduct = [];

            var populateProductLists = function( productId ) {
                if( angular.isDefined(productId) ) {
                    ProductListProductManagementService.retrieveCurrentListsWithProductId(productId)
                        .then(function (response) {
                            listsWithThisProduct = response.response.lists;
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                }
            };

            var productId = $scope.productId;

            populateProductLists(productId);

            $scope.$watch('productId', function (productId) {
                populateProductLists(productId);
            });

            $scope.getClassIfProductInList = function( list ) {
                return {
                    active: ProductListProductManagementService.isProductInList( list, listsWithThisProduct )
                };
            };


            $scope.toggleProductInList = function( list ) {

                var productId = $scope.productId;

                ProductListProductManagementService.toggleItemInList( productId, list, listsWithThisProduct )
                    .then( function( productLists ) {
                        listsWithThisProduct = productLists;

                        if( angular.isDefined(list.listId) ) {
                            ProductListProductManagementService.updateLists.push(list.listId);
                        }
                        $scope.$broadcast('ppdLoadingActionFinish', {});
                    })
                    .catch( function( error ) {
                        console.log( error );
                        $scope.$broadcast('ppdLoadingActionFinish', {});
                    });
            };
        } else {

            $scope.removeProductFromListAndRefresh = function( list, productId ) {
                ProductListProductManagementService.removeItemInList( productId, list )
                    .then( function( response ) {

                        $scope.products = response.response.products;

                        $scope.$broadcast('refreshScroller',{});
                    })
                    .catch( function( error ) {
                        console.log( "An error occurred removing the item from the list: " + error );
                    });
            };

            $scope.$watch( function() {
                return ProductListProductManagementService.updateLists;
            }, function() {

                var selectedList = $scope.selectedList;

                if( angular.isDefined( selectedList ) && ProductListProductManagementService.isSelectedListUpdated( selectedList ) ) {

                    ProductListProductManagementService.refreshListProductsPromise( selectedList )
                        .then( function( response ) {
                            $scope.products = response.response.products;
                        })
                        .catch( function( error ) {
                            console.log( "An error occurred removing the item from the list: " + error );
                        });
                }

            }, true );
        }

    };

    $scope.$watch('retrieveLists',function( retrieveLists ) {
        initController(retrieveLists);
    });

}])
/**
 * @ngdoc service
 * @name productLists.service:ProductListProductManagementService
 *
 * @description A service to be used in conjunction with the product list product management controller to perform
 * common operations
 *
 * @property {object} storedProductLists used to sync product lists across multiple components
 * @property {array} updateLists a queue of lists that have been updated
 * @property {function} isSelectedListsUpdated(list) a utility method to see if a given list is in the updateLists property
 * @property {function} checkResponse(response) a utility method used to check if a response is without error
 * @property {function} toggleItemInList(productId,list,productLists) toggle an item in a given list and perform async calls
 * @property {function} refreshListProductsPromise(list) refresh the cached products for a given list
 * @property {function} removeItemInList(productId,list) remove an item from a list and perform async calls
 * @property {function} isProductInList(list,productsLists) returns true if a list is in a set of productLists, else false
 */
.service('ProductListProductManagementService', [ 'ProductListFactory', '$q', function( ProductListFactory, $q ) {
    var service = this;

    service.storedProductLists = {};
    service.updateLists = [];

    var removeAtIndex = function(array, index) {
        if(index === -1 || index >= array.length ) { return; }

        array.splice(index, 1);
    };

    service.isSelectedListUpdated = function( list ) {
        if( angular.isDefined(list.listId) ) {
            var listId = list.listId,
                updateLists = service.updateLists;
            for( var i = 0; i < updateLists.length; i++ ) {
                var curListId = updateLists[i];
                if( curListId === listId ) {
                    removeAtIndex(service.updateLists, i );
                    return true;
                }
            }

            return false;
        }
    };

    service.checkResponse = function( resultSet ) {

        var errorObjectCollection = [];

        for( var i = 0; i < resultSet.length; i++ ) {

            if( resultSet[i].result !== 'SUCCESS' ) {
                var resultArray = resultSet[i].split(':');

                if (resultArray.length === 2) {
                    var productId = resultArray[1];
                    var listId = resultArray[0];

                    var object = {
                        productId: productId,
                        listId: listId,
                        result: resultSet[i].result,
                        code: resultSet[i].code
                    };

                    errorObjectCollection.push(object);
                }
            }
        }

        return errorObjectCollection;
    };

    service.retrieveCurrentListsWithProductId = function( productId ) {
        var $promise = ProductListFactory.readListsWithProductId({ productId: productId }).$promise;
        return $promise;
    };

    service.toggleItemInList = function( productId, list, productLists ) {
        var deferred = $q.defer();
        var promise = deferred.promise;

        var payload = {
            productId: productId,
            listId: list.listId
        };

        ProductListFactory[ service.isProductInList(list, productLists) ? 'removeProduct' : 'addProduct' ](payload).$promise
            .then( function( response ) {

                var errorCollection = service.checkResponse(response.response) ;

                if( errorCollection.length === 0 ) {
                    return service.retrieveCurrentListsWithProductId( productId);
                } else {
                    deferred.reject(errorCollection);
                }
            })
            .catch( function() {
                deferred.reject("An error occurred while removing the product from the list");
            })
            .then( function( response ) {
                var lists = response.response.lists;
                deferred.resolve(lists);
            })
            .catch( function() {
                deferred.reject("An error occurred while retrieving the lists with the productId [" + productId + "]");
            });

        return promise;
    };

    service.refreshListProductsPromise = function( list ) {
        return ProductListFactory.readListById({ listId: list.listId }).$promise;
    };

    service.removeItemInList = function( productId, list ) {
        var deferred = $q.defer();
        var promise = deferred.promise;

        var payload = {
            productId: productId,
            listId: list.listId
        };

        ProductListFactory.removeProduct(payload).$promise
            .then( function() {
                return ProductListFactory.readListById({ listId: list.listId }).$promise;
            })
            .catch( function() {
                deferred.reject("An error occurred while removing the product from the list");
            })
            .then( function( response ) {
                deferred.resolve( response );
            })
            .catch( function() {
                deferred.reject("An error occurred while retrieving the products for listId [" + list.listId + "]");
            });

        return promise;
    };

    service.isProductInList = function( list, productLists ) {
        for( var i = 0; i < productLists.length; i++ ) {
            var productList = productLists[i];

            if( productList.listId === list.listId ) {
                return true;
            }
        }

        return false;
    };

}]);;
// Source: src/main/js/app/components/product-lists/directives/product-list-directives.js
angular.module('ProductListDirectives', [ 'ProductListControllers' ])

/**
 * @ngdoc directive
 * @name productLists.directive:ppdProductListManagement
 *
 * @restrict AE
 * @require productLists.service:ProductListManagementService
 * @description will inject the {@link productLists.controller:ProductListManagementController ProductListManagementController} into the this location
 * to provide necessary functionality to manage a set of product lists.
 */
.directive('ppdProductListManagement', [ 'ProductListManagementService', function( ProductListManagementService ) {

    return {
        restrict: 'AE',
        controller: 'ProductListManagementController',
        link: function( scope, element, attrs ) {
            console.log( element );

            var currentLists = scope.$eval( attrs.currentLists );

            if( angular.isDefined( currentLists ) ) {
                ProductListManagementService.currentLists = currentLists;
            } else {
                ProductListManagementService.retrieveProductListPromise()
                    .then(function(response) {
                        ProductListManagementService.currentLists = response.response.lists;
                    })
                    .catch(function(error) {
                        console.log(error);
                    });
            }
        }
    };

}])
/**
 * @ngdoc directive
 * @name productLists.directive:ppdProductListProductManagement
 *
 * @restrict AE
 * @description will inject the {@link productLists.controller:ProductListProductManagementController ProductListProductManagementController} into the this location
 * to provide necessary functionality to manage a set of products in a product lists.  This directive is adaptive based on the value
 * of retrieve lists and will use the following parameters in each case
 *
 * <h2>retrieve-lists == true</h2>
 *
 * <ul>
 *    <li>productId</li>
 *    <li>productCollection</li>
 * </ul>
 *
 * <h2>retrieve-lists != true</h2>
 *
 * <ul>
 *    <li>currentList</li>
 * </ul>
 *
 * @param {number} [product-id] product id to lookup the product lists for
 * @param {boolean=} [retrieve-lists=true] whether or not the product lists for this product should be resolved
 * @param {array=} [product-collection]  collection of products currently in a list
 * @param {object=} [current-list={}] object representing the current list
 */
.directive('ppdProductListProductManagement', [ function( ) {

    return {
        restrict: 'AE',
        controller: 'ProductListProductManagementController',
        link: function( scope, element, attrs ) {
            var productId = scope.$eval( attrs.productId );
            scope.productId = productId;

            var retrieveLists = scope.$eval( attrs.retrieveLists ) !== false;
            scope.retrieveLists = retrieveLists;

            var productCollection = scope.$eval( attrs.productCollection );
            scope.products = productCollection;

            scope.$watch( attrs.productCollection, function( productCollection ) {
                scope.products = productCollection;
            }, true );

            var selectedList = scope.$eval( attrs.currentList );
            scope.selectedList = selectedList;
        }
    };

}])

.directive('ppdProductListCreateButton', [ 'ProductListManagementService', function( ProductListManagementService ) {

    return {
        restrict: 'AE',
        link: function( $scope ) {

            $scope.$on('$destroy', function() {
                ProductListManagementService.productListCreateShow = false;
            });

            $scope.toggleProductListCreate = function() {
                ProductListManagementService.productListCreateShow = ! ProductListManagementService.productListCreateShow;
            };

        }
    };
}]);;
// Source: src/main/js/app/components/product-lists/factories/product-list-factories.js
angular.module('ProductListFactories', ['ngResource'])
/**
 * @ngdoc service
 * @name productLists.factory:ProductListFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
 $resource('/api/v2.0/user/lists/:listId',
 {},
 {

     // POST - list create/product addition to list
     'addProduct': {
         method: 'POST',
         isArray: false,
         params: {
             listId: '@listId',
             productId: '@productId'
         }
     },
     'createList': {
        method: 'POST',
        isArray: false,
        params: {
            listName: '@listName'
         }
     },

     // GET - list of user lists/list details
     'readLists': {
                    method: 'GET',
                    isArray: false,
                    params: {}
                },
     'readListsWithProductId': {
                method: 'GET',
                isArray: false,
                params: {
                    productId: '@productId'
                }
     },
     'readListById': {
                method: 'GET',
                isArray: false,
                params: {
                    listId: '@listId',
                     sort: '@sort',
                     flags: true,
                     extendedInfo: true,
                     rows: '@rows',
                     start: '@start'
                 }
     },

     // PUT - list renaming
     'renameList': {
                method: 'PUT',
                isArray: false,
                params: {
                    newName: '@listName',
                     listId: '@listId'
                 }
     },

     // DELETE - list deletion/clear/product removal
     'removeProduct': {
                method: 'DELETE',
                isArray: false,
                params: {
                    listId: '@listId',
                     productId: '@productId'
                 }
     },
     'clearList': {
                method: 'DELETE',
                isArray: false,
                params: {
                    listId: '@listId',
                     clear: true
                 }
     },
     'deleteList': {
                method: 'DELETE',
                isArray: false,
                params: {
                    listId: '@listId'
                 }
     }
 });
 </pre>
 *
 */
.factory('ProductListFactory', ['$http', '$q', '$resource', function($http, $q, $resource) {

    return $resource('/api/v2.0/user/lists/:listId',
        {},
        {

            // POST - list create/product addition to list
            'addProduct': {
                method: 'POST',
                isArray: false,
                params: {
                    listId: '@listId',
                    productId: '@productId'
                }
            },
            'createList': {
                method: 'POST',
                isArray: false,
                params: {
                    listName: '@listName'
                }
            },

            // GET - list of user lists/list details
            'readLists': {
                method: 'GET',
                isArray: false,
                params: {}
            },
            'readListsWithProductId': {
                method: 'GET',
                isArray: false,
                params: {
                    productId: '@productId'
                }
            },
            'readListById': {
                method: 'GET',
                isArray: false,
                params: {
                    listId: '@listId',
                    sort: '@sort',
                    flags: true,
                    extendedInfo: true,
                    rows: '@rows',
                    start: '@start'
                }
            },

            // PUT - list renaming
            'renameList': {
                method: 'PUT',
                isArray: false,
                params: {
                    newName: '@listName',
                    listId: '@listId'
                }
            },

            // DELETE - list deletion/clear/product removal
            'removeProduct': {
                method: 'DELETE',
                isArray: false,
                params: {
                    listId: '@listId',
                    productId: '@productId'
                }
            },
            'clearList': {
                method: 'DELETE',
                isArray: false,
                params: {
                    listId: '@listId',
                    clear: true
                }
            },
            'deleteList': {
                method: 'DELETE',
                isArray: false,
                params: {
                    listId: '@listId'
                }
            }
        });
}]);;
// Source: src/main/js/app/components/product-lists/providers/product-lists-providers.js
angular.module('ProductListProviders', ['ProductViewFactories', 'Properties'])

.provider('productList', function() {

    this.$get = [ function() {} ];

    var fetchlistIdFromRoute = function($route) {
        var listId = angular.isDefined($route.current.params.listId) === false ? 0 : $route.current.params.listId;
        return listId;
    };


    this.resolveData = [ '$q', '$log', '$route', 'ProductListFactory', "$location", function( $q, $log, $route, ProductListFactory, $location ) {

        var listId = fetchlistIdFromRoute( $route );

        var data = {
            config: {
                showEditButton: true,
                sidebarTemplate: {
                    mobile:  'site/partials/mobile/pages/product-view/product-list/product_view_sidebar.html',
                    tablet: 'site/partials/tablet/pages/product-view/product-list/product_view_sidebar.html',
                    desktop: ''
                },
                viewTemplate: {
                    mobile:  'site/partials/mobile/pages/product-view/product-list/product_view_main.html',
                    tablet: 'site/partials/tablet/pages/product-view/product-list/product_view_main.html',
                    desktop: ''
                }
            },
            productData: {
            },
            functions: {
                selectGroupPromise: function( list ) {
                    var listId = list.listId;
                    $location.path( 'personal-list/' + listId );
                },
                updateResults: function( options ) {
                    return getProductListPromise( options );
                }
            }
        };

        var getProductListPromise = function( options ) {
            var deferred = $q.defer();
            var promise = deferred.promise;


            var listIdWasZero = false;
            var $promise = ProductListFactory.readLists().$promise;
            $promise
                .then( function( response ) {

                    data.productData.productGroups = response.response.lists;

                    if( listId === 0 ) {
                        listId = response.response.lists[0].listId;
                        listIdWasZero = true;
                    }

                    var sortType = options.sortType || '',
//                        filters = options.filter || [],
                        rows = options.rows || 20,
                        start = options.start || 0;

                    var payload = {
                        sort: sortType,
//                        filter: filters,
                        start: start,
                        rows: rows,
                        listId: listId
                    };

                    return ProductListFactory.readListById(payload).$promise;
                })
                .then( function( response ) {

                    var appendProducts = options.appendProducts || false;

                    // Set product objects
                    if( appendProducts ) {
                        var newProducts = response.response.products;

                        for( var i = 0; i < newProducts.length; i++ ) {
                            data.productData.products.push(newProducts[i]);
                        }

                    } else {
                        data.productData.products = response.response.products;
                    }

                    data.productData.selectedProductGroup = response.response.list;
                    data.productData.isProductGroupSelected = listIdWasZero === false;
                    data.productData.productGroupId = "listId";
                    data.productData.productGroupNameKey = "listName";
                    data.productData.pagination = response.response.pagination;
                    data.productData.facets = response.response.facets;
                    data.productData.simpleFacets = response.response.simpleFacets;

                    // Set header text
                    data.config.headerText = {
                        mobile: listIdWasZero ? 'My Lists' : response.response.list.listName,
                        tablet: "My Lists",
                        desktop: "My Lists"
                    };

                    deferred.resolve(data);
                })
                .catch( function( error ) {
                    deferred.reject("Error in keyword product search " + error);
                    $location.path( 'personal-list' );
                });

            return promise;
        };

        return getProductListPromise( listId );

    }];

});

;
// Source: src/main/js/app/components/product-search/controllers/product-search-controllers.js
angular.module('productSearch', [ 'ngRoute', 'ngAnimate', 'ProductFactory', 'Properties', 'ProductServices' ])

/**
 * @ngdoc controller
 * @name productSearch.controller:ProductSearchController
 *
 * @description This controller manages the view state and the product search overlay.  Also, it handles keyword
 * searching and the autocomplete dropdown.
 *
 *
 */
    .controller('ProductSearchController', [ '$scope', '$log', '$sce', 'ProductTypeaheadFactory', function($scope, $log, $sce, ProductTypeaheadFactory) {

        $scope.searchText = '';

        $scope.results = [];

        var resetSearch = function() {
            $scope.isSearchActive =  false;
            $scope.handleIconClick = function($event) {
                $scope.loadSearch($event);
            };
        };  
        resetSearch();

        $scope.loadSearch = function($event) {
            $event.preventDefault();
            var searchField = document.querySelector('#searchField');
            if( searchField !== null ) {
                setTimeout(function() {
                    searchField.focus();
                }, 0);
            }
            $scope.isSearchActive = true;

            
            $scope.dataIcon = $sce.trustAsHtml("&#x51;");
            $scope.handleIconClick = function() {
                $scope.searchText='';
                $scope.updateResults();
                if( searchField !== null ) {
                    setTimeout(function() {
                        searchField.focus();
                    }, 200);
                }
            };
        };

        $scope.unloadSearch = function() {

            setTimeout(function() {
                var searchField = document.querySelector('#searchField');
                if( searchField !== null ) {
                    searchField.value = "";
                    $scope.results = [];
                    $scope.searchText = '';
                    searchField.blur();
                }
            },200);
            resetSearch();
        };

        var isUpdating = false;

        $scope.updateResults = function() {
            if( ! isUpdating ) {
                var searchText = $scope.searchText;
                if( angular.isDefined(searchText) && searchText !== null && searchText.length >= 2 ) {
                    isUpdating = true;
                    var $promise = ProductTypeaheadFactory.query({ like: $scope.searchText }).$promise;
                    $promise
                        .then( function( resourceResponse ) {
                            var searchText = $scope.searchText;
                            var results = resourceResponse.response;
                            var regex = new RegExp(searchText, "gi");
                            if( angular.isDefined(results) ) {
                                for( var i = 0; i < results.length; i++ ) {
                                    var resultText = results[i];
                                    results[i] = {
                                        text: resultText,
                                        html: $sce.trustAsHtml(resultText.replace(regex, "<span>" + searchText + "</span>"))
                                    };
                                }
                                $scope.results = results;
                            }
                            isUpdating = false;
                        })
                        .catch( function( error ) {
                            $log.error( "Error occurred while retrieving typeahead results." + error );
                        });
                } else {
                    $scope.results = [];
                }
            } 
        };

        $scope.$on('viewChanged', function(viewNum) {
            if( viewNum !== 4) {
                var searchField = document.querySelector('#searchField');
                if( searchField !== null ) {
                    searchField.blur();
                }
            }
        });

    }]);;
// Source: src/main/js/app/components/product-search/providers/product-search-providers.js
angular.module('ProductSearchProviders', ['ProductViewFactories', 'Properties'])

.provider('productSearch', function() {

    var fetchKeywordsFromRoute = function($route) {
        var keywords = angular.isDefined($route.current.params.keywords) === false ? "" : $route.current.params.keywords;
        return keywords;
    };

    this.$get = [ function() {} ];

    this.resolveData = [ '$q', '$log', '$route', 'ProductSearchFactory', function( $q, $log, $route, ProductSearchFactory ) {


        var data = {
            config: {
                isFullWidth: true
            },
            productData: {
            }
        };

        data.functions = {
            updateResults: function(options) {
                return getProductSearchPromise(options);
            }
        };

        var getProductSearchPromise = function( options ) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var keywords = fetchKeywordsFromRoute( $route );

            // Product Search promise with sorting and filtering
            var sortType = options.sortType || '',
                filters = options.filter || [],
                rows = options.rows || 20,
                start = options.start || 0;

            var payload = {
                sort: sortType,
                filter: filters,
                keywords: keywords,
                start: start,
                rows: rows
            };

            ProductSearchFactory.getByKeywords(payload).$promise
                .then( function( response ) {

                    var appendProducts = options.appendProducts || false;

                    // Set product objects
                    if( appendProducts ) {
                        var newProducts = response.response.products;

                        for( var i = 0; i < newProducts.length; i++ ) {
                            data.productData.products.push(newProducts[i]);
                        }

                    } else {
                        data.productData.products = response.response.products;
                    }

                    data.productData.productGroups = [];
                    data.productData.pagination = response.response.pagination;
                    data.productData.facets = response.response.facets;
                    data.productData.simpleFacets = response.response.simpleFacets;

                    // Set header text
                    data.config.headerText = {
                        mobile: "Results for \"" + keywords + "\"",
                        tablet: "Results for \"" + keywords + "\"",
                        desktop: "Results for \"" + keywords + "\""
                    };

                    deferred.resolve(data);
                })
                .catch( function( error ) {
                    deferred.reject("Error in keyword product search " + error);
                });

            return promise;

        };

        return getProductSearchPromise({});
   }];

})

.provider('quickShop', function() {

    this.$get = [ function() {} ];

    this.resolveData = [ '$q', '$log', '$route', 'QuickShopFactory', function( $q, $log, $route, QuickShopFactory) {

        var fetchUserIdFromRoute = function($route) {
            var userId = angular.isDefined($route.current.params.userId) === false ? "" : $route.current.params.userId;
            return userId;
        };

        var data = {
            config: {
                isFullWidth: true,
                viewTemplate: {
                    mobile: 'site/partials/mobile/pages/product-view/propulsion-products/product_view_main.html',
                    tablet: 'site/partials/tablet/pages/product-view/propulsion-products/product_view_main.html',
                    desktop: ''
                }
            },
            productData: {
            }
        };

        data.functions = {
        };

        var getQuickShopPromise = function( ) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var payload = {
                userId: fetchUserIdFromRoute($route),
                howMany: 400
            };

            var $promise = QuickShopFactory.get(payload).$promise;
            $promise
                .then( function( response ) {

                    // Set product objects
                    data.productData.products = response;

                    deferred.resolve(data);
                })
                .catch( function( error ) {
                    promise.reject("Error in keyword product search " + error);
                });

            return promise;

        };

        return getQuickShopPromise();
    }];

});;
// Source: src/main/js/app/components/product-specials/factories/product-specials-factories.js
angular.module('ProductSpecialsFactories', ['ngResource'])

/**
 * @ngdoc service
 * @name specials.factory:TopSpecialsFactory
 *
 * @description This factory returns a resource for the Top Specials api
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 * @param {number=} [numTopSpecials=0] represents number of top specials
 *
 * @returns {$resource} $resource
 */
.factory('TopSpecialsFactory', ['$q', '$http', '$resource', function($q, $http, $resource) {

    return $resource('/api/v2.0/user/top-specials', {}, {
                'get': {
                    method: 'GET',
                    isArray: false,
                    params: {
                        numTopSpecials: '@numTopSpecials'
                    }
                }
            });

}]);;
// Source: src/main/js/app/components/product-specials/providers/product-specials-providers.js
angular.module('ProductSpecialsProviders', [ 'ProductSpecialsServices' ])

    .provider('productSpecials', [ function() {

        this.$get = [ function() {} ];

        this.resolveData = [ '$q', '$log', '$route', 'ProductSearchFactory', function($q, $log, $route, ProductSearchFactory) {

            var specialsTypes = {
                'top-specials': 'topSpecials',
                'all-specials': 'allSpecials',
                'my-specials': 'mySpecials'
            };

            var subShelfTypes = {
                'category': 'category',
                'pod-group': 'podGroup',
                'coupon': 'coupon'
            };

            var id = $route.current.pathParams.id || 0;

            var selectedType = specialsTypes[$route.current.pathParams.specialsType || 'top-specials'];
            var subShelfType = subShelfTypes[$route.current.pathParams.subShelfType || ''];


            var data = {
                config: {
                    sidebarTemplate: {
                        mobile: 'site/partials/mobile/pages/product-view/product-view-tree/product_view_sidebar.html',
                        tablet: 'site/partials/tablet/pages/product-view/product-view-tree/product_view_sidebar.html',
                        desktop: ''
                    }
                },
                productData: {
                    productGroupNameKey: 'name',
                    productGroupId: 'id',
                    ancestorProductGroups: [
                        {
                            id: 'top-specials',
                            name: 'Top Specials',
                            subtext: 'Popular sale items this week',
                            url: '/specials/top-specials'
                        },
                        {
                            id: 'my-specials',
                            name: 'My Specials',
                            subtext: 'Past purchases on sale',
                            url: '/specials/my-specials'
                        },
                        {
                            id: 'all-specials',
                            name: 'All Specials',
                            subtext: 'By department',
                            url: null
                        }
                    ],
                    selectedAncestor: selectedType || 'topSpecials',
                    selectedSubShelf: subShelfType,
                    selectedId: id,
                    selectedType: selectedType,
                    subShelfType: subShelfType
                }
            };

            data.functions = {
                selectGroupPromise: function() {
                },
                updateResults: function( options ) {
                    return getSpecialsPromise( options );
                }
            };

            var getSpecialsPromise = function() {

                var deferred = $q.defer();
                var promise = deferred.promise;

                var payload = {
                    filter: 'specials',
                    facet: 'rootCatTrees'
                };

                ProductSearchFactory.get(payload).$promise
                    .then(function(responseData) {
                        var rootCatTrees = responseData.response.facets.rootCatTrees;

                        rootCatTrees = _.select(rootCatTrees, function(each) {
                            return each.count > 0;
                        });

                        _.map(rootCatTrees, function(each) {
                            var url = '/all-specials/category/' + each.id;
                            each.url = url;
                            return each;
                        });

                        data.productData.productGroups = rootCatTrees;

                        deferred.resolve(data);
                    })
                    .catch(function(errorData) {
                        deferred.reject(errorData);
                    });

                return promise;
            };

            return getSpecialsPromise({});

        }];

    }]);
;
// Source: src/main/js/app/components/product-specials/services/product-specials-services.js
angular.module('ProductSpecialsServices', [ 'ProductSpecialsFactories', 'ProductFactory' ]);;
// Source: src/main/js/app/components/product-views/controllers/product-view-controllers.js
angular.module('ProductView', [ 'ProductViewServices', 'ProductViewProviders', 'ngRoute', 'ProductListDirectives' ] )

/**
 * @ngdoc overview
 * @name productView
 *
 * @description The dependencies for this module are 'ProductViewServices', 'ProductViewProviders', 'ngRoute', 'ProductListDirectives'.

 These dependencies are just used to collect all the product view related factories for the various route configs using this
 module.

 <h2>Config</h2>

 The base config block for any features implemented using this module should be the following:

<pre>
 $routeProvider
 .when( '/url', {
            reloadOnSearch: false,

            controller: 'ProductViewController',

            templateUrl: 'pages/product-view/product_view.html'
        })
</pre>

 An example of a route configuration is below which is the configuration for product lists:

 /personal-lists/:listId -> { resolve: { data: productListsProvider.resolveData } }

 The resolve block should strictly be used to provide the service that will resolve the data parameter.

<h2>Available options for provider</h2>
 <pre>

 data = {
        config: {  // used to specify custom options for this provider
            isFullWidth: [true|false], // used to hide the sidebar if there are no product groups [optional]
            sidebarTemplate: {  // used to override the inner sidebar template in the product view
                mobile: '',
                tablet: '',
                desktop: ''
            },
            viewTemplate: { // used to override the inner main view template in the product view
                mobile: '',
                tablet: '',
                desktop: ''
            },
            headerText: { // used to set the text in the subheader of the product view
                mobile: '' // text for mobile,
                tablet: '' // text for tablet,
                desktop: '' // text for desktop
            },
            sortTypes: [
                    name: 'Alphabetical Ascending', // display name
                    value: 'name asc' // value for option
                ] // if the default sort types should be overridden it should be placed here in the specified format

        },
        productData: { // contains data relevant to the products and product groups
            productGroups: [] // contains product groups (e.g. list from product lists),
            pagination: {} // pagination object from response [optional],
            facets: {} // available facets for refinement of search results using refine button,
            products: [] // products array,
            selectedProductGroup: {} // should be an object representing the currently selected product group,
            isProductGroupSelect: [true|false] // used with the selected product group although is mainly for switching between the list of product groups and the list of products in mobile
            productGroupId: '' // used to extract the product group id from the product group,
            productGroupNameKey: '' // used to extract the product group name from the product group
        },
        functions: { A set of template methods to handle async flows in the product view ( these should all return promises )
            updateResults: function(options) {
                        // code to return promise
                   },
            selectGroupPromise: function( productGroup ) {
                // code to select a product group and return a promise or redirect to page using $location provider
            }
        }
    }
 </pre>

 <h2>Function descriptions</h2>

 <h3>Update Results</h3>

 Delegate method used to update the results of the current result set.

 This method should call the original method that was used to get the promise on the initial page request but should be passed a set of options.  An example implementation of this method is provided from product search below:

 <pre>
 updateResults: function(options) {
        return getProductSearchPromise(options);
    }
 </pre>

 The options will be specific to each provider but should be similar to the following:

 <pre>
 var options = {
        sort: '' // string text representing the sort type
        filter: [] // array of filters in the following format [ 'filterName', [1,2,3,4] ],
        start: [num] // used to specify the start index for the result set,
        rows: [num] // used to specify the number of rows from the start to return,
    }
 </pre>

 <h3>Select Group Promise</h3>

 Delegate method used to select a group when a product group is clicked on in the page

 This method will usually just make a location change as in the following example from product lists:

 <pre>
 selectGroupPromise: function( list ) {
        var listId = list.listId;
        $location.path( 'personal-list/' + listId );
    }
 </pre>

 @example
    .provider('productList', function() {

        this.$get = [ function() {} ];

        var fetchlistIdFromRoute = function($route) {
            var listId = angular.isDefined($route.current.params.listId) === false ? 0 : $route.current.params.listId;
            return listId;
        };


        this.resolveData = [ '$q', '$log', '$route', 'ProductListFactory', "$location", function( $q, $log, $route, ProductListFactory, $location ) {

            var listId = fetchlistIdFromRoute( $route );

            var data = {
                config: {
                    showEditButton: true,
                    sidebarTemplate: {
                        mobile:  'site/partials/mobile/pages/product-view/product-list/product_view_sidebar.html',
                        tablet: 'site/partials/tablet/pages/product-view/product-list/product_view_sidebar.html',
                        desktop: ''
                    },
                    viewTemplate: {
                        mobile:  'site/partials/mobile/pages/product-view/product-list/product_view_main.html',
                        tablet: 'site/partials/tablet/pages/product-view/product-list/product_view_main.html',
                        desktop: ''
                    }
                },
                productData: {
                },
                functions: {
                    selectGroupPromise: function( list ) {
                        var listId = list.listId;
                        $location.path( 'personal-list/' + listId );
                    },
                    updateResults: function( options ) {
                        return getProductListPromise( options );
                    }
                }
            };

            var getProductListPromise = function( options ) {
                var deferred = $q.defer();
                var promise = deferred.promise;


                var listIdWasZero = false;
                var $promise = ProductListFactory.readLists().$promise;
                $promise
                    .then( function( response ) {

                        data.productData.productGroups = response.response.lists;

                        if( listId === 0 ) {
                            listId = response.response.lists[0].listId;
                            listIdWasZero = true;
                        }

                        var sortType = options.sortType || '',
//                        filters = options.filter || [],
                            rows = options.rows || 20,
                            start = options.start || 0;

                        var payload = {
                            sort: sortType,
//                        filter: filters,
                            start: start,
                            rows: rows,
                            listId: listId
                        };

                        return ProductListFactory.readListById(payload).$promise;
                    })
                    .then( function( response ) {

                        var appendProducts = options.appendProducts || false;

                        // Set product objects
                        if( appendProducts ) {
                            var newProducts = response.response.products;

                            for( var i = 0; i < newProducts.length; i++ ) {
                                data.productData.products.push(newProducts[i]);
                            }

                        } else {
                            data.productData.products = response.response.products;
                        }

                        data.productData.selectedProductGroup = response.response.list;
                        data.productData.isProductGroupSelected = listIdWasZero === false;
                        data.productData.productGroupId = "listId";
                        data.productData.productGroupNameKey = "listName";
                        data.productData.pagination = response.response.pagination;
//                data.productData.facets = response.response.facets;

                        // Set header text
                        data.config.headerText = {
                            mobile: listIdWasZero ? 'My Lists' : response.response.list.listName,
                            tablet: "My Lists",
                            desktop: "My Lists"
                        };

                        deferred.resolve(data);
                    })
                    .catch( function( error ) {
                        deferred.reject("Error in keyword product search " + error);
                        $location.path( 'personal-list' );
                    });

                return promise;
            };

            return getProductListPromise( listId );

        }];

    });

 */
.config([ '$routeProvider', 'productBrowseProvider', 'productSearchProvider', 'productListProvider', 'productSpecialsProvider', 'quickShopProvider', 'PastPurchasesProvider', 'ProductGroupsProvider', function( $routeProvider, productBrowseProvider, productSearchProvider, productListProvider, productSpecialsProvider, quickShopProvider, PastPurchasesProvider, ProductGroupProvider ) {

    $routeProvider
        .when( '/product-search/:keywords', {
            reloadOnSearch: false,

            controller: 'ProductViewController',

            resolve: {
                data: productSearchProvider.resolveData
            },

            templateUrl: 'site/pages/product-view/product_view.html'
        })
        .when( '/personal-list/:listId?', {
            reloadOnSearch: false,

            controller: 'ProductViewController',

            resolve: {
                data: productListProvider.resolveData
            },

            templateUrl: 'site/pages/product-view/product_view.html'

        })
        .when( '/past-purchases', {
            reloadOnSearch: false,

            controller: 'ProductViewController',

            resolve: {
                data: PastPurchasesProvider.resolveData
            },

            templateUrl: 'site/pages/product-view/product_view.html'

        })
        .when( '/product-groups/:filter', {
            reloadOnSearch: false,

            controller: 'ProductViewController',

            resolve: {
                data: ProductGroupProvider.resolveData
            },

            templateUrl: 'site/pages/product-view/product_view.html'
        })
        .when( '/specials/:specialsType?/:subShelfType?/:id?', {
            reloadOnSearch: false,

            controller: 'ProductViewController',

            resolve: {
                data: productSpecialsProvider.resolveData
            },

            templateUrl: 'site/pages/product-view/product_view.html'
        })
        .when( '/browse-aisles/:categories*', {
            reloadOnSearch: false,

            controller: 'ProductViewController',

            resolve: {
                data: productBrowseProvider.resolveData
            },

            templateUrl: 'site/pages/product-view/product_view.html'
        });
}])

/**
 * @ngdoc controller
 * @name productView.controller:ProductViewController
 *
 * @description This is the controller that is injected into the main view template on route resolve.
 *
 * @property {function} infiniteScrollHandler() callback send to the infinite scroll directive to be called when the scroll threshold is surpassed
 * @property {function} openItemDetail(productId) call to the product item detail service used to sync the current product to the item detail view before it is opened
 * @property {function} selectGroup(productGroup) used to call the method config.functions.selectGroupPromise and will update the product results on resolve of the returned promise
 * @property {string} viewType this variable is used to toggle between list and grid view.  Values can either be grid or list
 * @property {object} productData retrieved from the resolved data object to load the products into the scope
 * @property {object} config retrieved from the resolved data object to pass configurations into the template
 *
 */
.controller('ProductViewController', [ '$scope', '$filter', 'data', 'ProductViewSubheaderService', 'ProductViewRefineService', 'ProductViewInfiniteScrollService', 'ProductItemDetailService', function($scope, $filter, data, ProductViewSubheaderService, ProductViewRefineService, ProductViewInfiniteScrollService, ProductItemDetailService ) {

    ProductViewSubheaderService.headerText = data.config.headerText;
    ProductViewSubheaderService.showMobileBackButton = data.productData.isProductGroupSelected || data.productData.isAtSubcategory === true;

    if( angular.isDefined( data.productData.pagination ) ) {
        ProductViewInfiniteScrollService.startPosition = data.productData.pagination.start;
        ProductViewInfiniteScrollService.rows = data.productData.pagination.rows;
        ProductViewInfiniteScrollService.totalResults = data.productData.pagination.total;
    }

    var simpleFacetKey = 'simple';

    var checkAndPopulateFacets = function(productData) {
        var facets = productData.facets,
            simpleFacets = productData.simpleFacets;


        if( angular.isDefined( facets ) && angular.equals( facets, {}) === false ) {

            if(angular.isDefined(simpleFacets) && Array.isArray(simpleFacets) && simpleFacets.length > 0) {
                facets[simpleFacetKey] = simpleFacets;
            }

            facets[simpleFacetKey] = _.reject(facets[simpleFacetKey], function(valueObject) {
                return valueObject.count === 0;
            });

            facets[simpleFacetKey] = _.pluck(facets[simpleFacetKey], 'id');

            ProductViewRefineService.facets = facets;
            ProductViewSubheaderService.showRefine = true;
        } else {
            ProductViewSubheaderService.showRefine = false;
        }
    };

    var attachCategoricalData = function(productData) {
        productData.categorizedProductData = $filter('CategoryFilter')(data.productData.products);
        productData.isCategorized = ProductViewSubheaderService.sortType === 'consumCatId asc';
    };

    checkAndPopulateFacets(data.productData);
    attachCategoricalData(data.productData);

    $scope.viewType = ProductViewSubheaderService.viewType;

    $scope.productData = data.productData;
    $scope.config = data.config;

    $scope.$on('$destroy', function() {
        ProductViewSubheaderService.destroy();
        ProductViewRefineService.destroy();
        ProductViewInfiniteScrollService.destroy();
    });

    $scope.infiniteScrollHandler = function() {
        var isAbleToAdvance = ProductViewInfiniteScrollService.nextResultSet();

        if( isAbleToAdvance ) {
            $scope.infiniteScrollActive = true;
            updateResults(true);
        }
    };

    $scope.openProductLists = function( productId ) {
        ProductItemDetailService.openProductLists($scope, productId);
    };

    $scope.openItemDetail = function( productId ) {
        ProductItemDetailService.openItemDetail($scope, productId);
    };

    $scope.selectGroup = function( productGroup ) {

        ProductViewRefineService.resetFilters();

        var promise = data.functions.selectGroupPromise( productGroup );

        if( angular.isDefined( promise ) ) {
            promise
                .then( function( data ) {
                    ProductViewSubheaderService.headerText = data.config.headerText;

                    checkAndPopulateFacets(data.productData);

                    $scope.viewType = ProductViewSubheaderService.viewType;

                    $scope.productData = data.productData;

                    ProductViewInfiniteScrollService.isCurrentlyLoading = false;
                });
        }
    };

    var updateResults = function(appendProducts) {
        var filterStrings = [];
        var filters = ProductViewRefineService.getFilters();
        for( var filterKey in filters )
        {
            var keyedFilters = filters[filterKey];
            if (keyedFilters.length > 0) {

                var typeString = keyedFilters.join( filterKey === simpleFacetKey ? ';' : ',');

                if( filterKey === simpleFacetKey ) {
                    filterStrings.push(typeString);
                } else {
                    filterStrings.push(filterKey + ":" + typeString);
                }
            }
        }

        if( appendProducts === false ) {
            $scope.updatingProductSet = true;
            ProductViewInfiniteScrollService.destroy();
        }

        var options = {
            filter: filterStrings.join(";"),
            sortType: ProductViewSubheaderService.sortType,
            rows: ProductViewInfiniteScrollService.rows,
            start: ProductViewInfiniteScrollService.startPosition,
            appendProducts: appendProducts
        };

        var promise = data.functions.updateResults(options);

        if( angular.isDefined( promise ) ) {
            promise
                .then( function( data ) {
                    ProductViewSubheaderService.headerText = data.config.headerText;

                    checkAndPopulateFacets(data.productData);

                    $scope.viewType = ProductViewSubheaderService.viewType;

                    attachCategoricalData(data.productData);

                    $scope.productData = data.productData;

                    $scope.infiniteScrollActive = false;

                    ProductViewRefineService.isFiltersProcessing = false;
                    ProductViewInfiniteScrollService.isCurrentlyLoading = false;
                    $scope.updatingProductSet = false;
                })
                .catch( function( error ) {
                    console.log( "An error occurred while updating the results" + error );
                    ProductViewRefineService.isFiltersProcessing = false;
                });
        }
    };

    if( angular.isDefined( data.config.sortTypes ) && data.config.sortTypes.length > 0 ) {
        ProductViewSubheaderService.sortTypesOverride = data.config.sortTypes;
    } else {
        ProductViewSubheaderService.sortTypesOverride = [];
    }

    $scope.$watch( function() {
        return ProductViewSubheaderService.viewType;
    }, function( viewType ) {
        $scope.viewType = viewType;
    });

    var isFilterFirstLoad = true,
        isSortTypeFirstLoad = true;

    $scope.$watch( function() {
        return ProductViewRefineService.getFilters();
    }, function( ) {
        if( isFilterFirstLoad === false ) {
            updateResults(false);
        }
        isFilterFirstLoad = false;
    }, true);

    $scope.$watch( function() {
        return ProductViewSubheaderService.sortType;
    }, function( ) {
        if( isSortTypeFirstLoad === false ) {
            updateResults(false);
        }
        isSortTypeFirstLoad = false;
    });

    $scope.$emit('loadSubHeader', 'site/pages/product-view/product_view_subheader.html');

}])

/**
 * @ngdoc controller
 * @name productView.controller:ProductViewSubheaderController
 *
 * @description This controller is used to handle user interactions in the header of the product view page
 *
 * @property {function} toggleViewType - used to toggle the view type stored in the ProductViewSubheaderService
 * @property {function} openRefineView - calls the following method call -> $scope.openNamedModalView( 'modal-right', 'refine' );
 * @property {function} toggleEditMode - used to toggle the edit mode for the product display
 * @property {string} viewType (this variable is watched for changes) - ['grid'|'list']
 * @property {object} headerText (this variable is watched for changes) - object from the config object within the data object
 * @property {boolean} showMobileBackButton (this variable is watched for changes) - used with the ProductViewTreeController
 * @property {boolean} showEditButton (this variable is watched for changes) - used to show or hide the edit button depending on the configuration of the provided service
 * @property {boolean} headerButtonActive (this variable is watched for changes) - used to provide whether or not the edit button is active
 * @property {array} sortTypes - used to provide the sort types the user can choose from (this can be overridden from the provider config)
 */
.controller('ProductViewSubheaderController', [ '$scope', 'ProductViewSubheaderService', function( $scope, ProductViewSubheaderService ) {

    $scope.toggleViewType = ProductViewSubheaderService.toggleViewType;

    $scope.viewType = ProductViewSubheaderService.viewType;

    $scope.headerText = ProductViewSubheaderService.headerText;

    $scope.showMobileBackButton = ProductViewSubheaderService.showMobileBackButton;

    $scope.showRefine = ProductViewSubheaderService.showRefine;

    if( angular.isDefined( ProductViewSubheaderService.sortTypesOverride ) && ProductViewSubheaderService.sortTypesOverride.length > 0 ) {
        $scope.sortTypes = ProductViewSubheaderService.sortTypesOverride;
    } else {
        $scope.sortTypes = ProductViewSubheaderService.sortTypes;
    }

    $scope.openRefineView = function() {
        $scope.openNamedModalView( 'modal-right', 'refine' );
    };

    $scope.sortChange = function(newSortType) {
        if( angular.isDefined( newSortType ) && newSortType !== null && newSortType !== '' ) {
            ProductViewSubheaderService.sortType = newSortType;
        }
    };

    $scope.$watch( function() {
        return ProductViewSubheaderService.sortTypesOverride;
    }, function( sortTypes ) {
        if( angular.isDefined( sortTypes ) && sortTypes.length > 0 ) {
            $scope.sortTypes = sortTypes;
        } else {
            $scope.sortTypes = ProductViewSubheaderService.sortTypes;
        }
    });

    $scope.$watch( function() {
        return ProductViewSubheaderService.headerText;
    }, function( headerText ) {
        $scope.headerText = headerText;
    }, true);

    $scope.$watch( function() {
        return ProductViewSubheaderService.showRefine;
    }, function( showRefine ) {
        $scope.showRefine = showRefine;
    }, true);

    $scope.$watch( function() {
        return ProductViewSubheaderService.showMobileBackButton;
    }, function( showMobileBackButton) {
        $scope.showMobileBackButton = showMobileBackButton;
    }, true);

    $scope.$watch( function() {
        return ProductViewSubheaderService.viewType;
    }, function( viewType ) {
        $scope.viewType = viewType;
    });
}])

/**
 * @ngdoc controller
 * @name productView.controller:ProductViewRefineController
 *
 * @description This controller is used to monitor user interactions and the state of the product result refine overlay
 *
 * @property {function} hasFilter used to check if a filter is active
 * @property {function} hasFacet used to check if the backing service contains a given facet
 * @property {function} resetFilters used to clear all selected filters
 * @property {function} resetFiltersByType - used to clear selected filters by facet name
 * @property {function} toggleFilter(type,filterId) - used to select/deselect a filter
 * @property {array} facets current set of facets available to the user to choose from
 *
 */
.controller('ProductViewRefineController', [ '$scope', 'ProductViewRefineService', function( $scope, ProductViewRefineService ) { 

    $scope.facets = ProductViewRefineService.facets;
    $scope.hasFilter = ProductViewRefineService.hasFilter;
    $scope.hasFacet = ProductViewRefineService.hasFacet;
    $scope.resetFilters = ProductViewRefineService.resetFilters;
    $scope.toggleFilter = ProductViewRefineService.toggleFilter;
    $scope.resetFiltersByType = ProductViewRefineService.resetFiltersByType;

    $scope.$watch( function() {
        return ProductViewRefineService.facets;
    }, function( facets ) {
        $scope.facets = facets;
        $scope.$broadcast('ppdLoadingActionFinish', {});
    }, true);

    $scope.$watch( function() {
        return ProductViewRefineService.isFiltersProcessing;
    }, function(booleanValue) {
        if(booleanValue === false) {
            $scope.$broadcast('ppdLoadingActionFinish', {});
        }
    });

}]);;
// Source: src/main/js/app/components/product-views/factories/product-view-factories.js
angular.module('ProductViewFactories', [ 'CategoryFactory', 'ProductFactory', 'ProductListFactories'  ] );;
// Source: src/main/js/app/components/product-views/providers/product-view-providers.js
angular.module( 'ProductViewProviders', [ 'ProductSpecialsProviders', 'ProductSearchProviders', 'ProductListProviders', 'ProductBrowseProviders','PastPurchasesProviders', 'ProductGroupProviders' ]);


;
// Source: src/main/js/app/components/product-views/services/product-view-services.js
angular.module('ProductViewServices', [] )

/**
 * @ngdoc service
 * @name productView.service:ProductViewSubheaderService
 *
 * @description This service is used to sync data between
 * {@link productView.controller:ProductViewController} and
 * {@link productView.controller:ProductViewSubheaderController}
 */
.service('ProductViewSubheaderService', [function() {
    var service = this;

    var defaultSortTypes = [
        {
            name: 'Name',
            value: 'name asc'
        },
        {
            name: 'Price',
            value: 'price asc'
        },
        {
            name: 'Unit Price',
            value: 'unitPrice asc'
        },
        {
            name: 'Specials',
            value: 'specials asc, name asc'
        },
        {
            name: 'Category',
            value: 'consumCatId asc'
        },
        {
            name: 'Most Popular',
            value: 'itemsPurchased asc'
        }
    ];

    service.viewType = 'grid';
    service.sortType = '';
    service.sortTypes = defaultSortTypes;
    service.headerText = '';
    service.showMobileBackButton = false;
    service.sortTypesOverride = [];
    service.showRefine = true;

    service.destroy = function() {
        service.viewType = 'grid';
        service.sortType = '';
        service.sortTypes = defaultSortTypes;
        service.headerText = '';
        service.showMobileBackButton = false;
        service.sortTypesOverride = [];
        service.showRefine = true;
    };

    service.toggleViewType = function() {
        service.viewType = this.viewType === 'grid' ? 'list' : 'grid';
    };

    service.setSort = function( sortType ) {
        service.sortType = sortType;
    };

}])

/**
 * @ngdoc service
 * @name productView.service:ProductViewInfiniteScrollService
 *
 * @description This service is used to manage the status of the infinite scroller
 * attached to the {@link productView.controller:ProductViewController ProductViewController}.
 *
 * It acts like a sort of iterator pattern
 *
 * @property {function} destroy() This method resets the state of the service.
 * @property {funciton} nextResultSet() This method advances the iterator to the next
 * set and returns true if it was able and false otherwise.
 */
.service('ProductViewInfiniteScrollService', [function() {
    var service = this;

    var reset = function() {
        service.rows = 0;
        service.startPosition = 0;
        service.totalResults = 0;
        service.incrementAmount = 20;
        service.isCurrentlyLoading = false;
    };

    reset();

    service.destroy = function() {
        reset();
    };

    service.nextResultSet = function() {
        if( ( service.startPosition + service.rows ) < service.totalResults && service.isCurrentlyLoading === false ) {

            service.startPosition += service.incrementAmount;
            service.isCurrentlyLoading = true;

            return true;

        } else {
            return false;
        }
    };

}])

/**
 * @ngdoc service
 * @name productView.service:ProductViewRefineService
 *
 * @description This service manages a hash to be used with the product search
 * facets.
 *
 * @property {function} facets This is the set of facets that were returned from the
 * injected provider
 * @property {boolean} isFiltersProcessing This flag should be set to true whenever an update
 * is processing.
 * @property {function} destroy This method resets the state of the service
 * @property {function} resetFiltersByType(type) Will reset the stored type property of
 * filters
 * @property {function} resetFilters() Resets the value of the filters to {}
 * @property {function} toggleFilter(type,id) Will toggle the existence of the
 * id in the array stored in the type property of filters
 * @property {function} hasFilter(type,id) Returns if a type and id is present in the stored
 * filters
 * @property {function} getFilters() Returns the stored filters object
 * @property {function} getFiltersByType(type) Returns the stored type array from the filters
 * object.
 */
.service('ProductViewRefineService', [function() {

    var removeAll = function(array, key) {
        var index = _.indexOf(array, key);

        if(index === -1) { return; }

        array.splice(index, 1);
        removeAll(array,key);
    };

    var service = this,
        filters = {};

    service.facets = {};

    service.isFiltersProcessing = false;

    service.destroy = function() {
        service.resetFilters();
        service.facets = {};
        service.isFiltersProcessing = false;
    };

    service.resetFiltersByType = function( type ) {
        filters[type] = [];
    };

    service.resetFilters = function() {
        filters = {};
    };

    service.toggleFilter = function( type, id ) {

        if( service.isFiltersProcessing === false ) {
            if (angular.isDefined(filters[type]) === false) {
                service.resetFiltersByType(type);
            }

            service.isFiltersProcessing = true;
            if (_.indexOf(filters[type], id) !== -1) {
                removeAll(filters[type], id);
            } else {
                filters[type].push(id);
            }
        }
    };

    service.hasFacet = function(type, id) {

        if( angular.isDefined(service.facets[type]) === false ) {
            return false;
        }

        var facet = service.facets[type];

        return _.indexOf(facet, id) !== -1;
    };

    service.hasFilter = function( type, id ) {

        if( angular.isDefined( filters[type] ) === false ) {
            return false;
        }

        if(_.indexOf(filters[type], id) !== -1 ) {
            return true;
        }

        return false;
    };

    service.getFilters = function() {
        return filters;
    };

    service.getFiltersByType = function( type ) {
        if( angular.isDefined( filters[type] ) === false ) {
            return [];
        }

        return filters[type];
    };

}]);;
// Source: src/main/js/app/components/products/controllers/product-controllers.js
angular.module('products', [ 'ngRoute', 'ngAnimate', 'ProductFactory', 'Properties', 'tabs', 'reviews', 'productDirectives', 'recommendations' ])

    .constant('PRODUCT', "product")

/**
 * @ngdoc controller
 * @name product.controller:ProductItemDetailController
 *
 * @description This controller injects a product object into the scope and watches
 * the product property on the {@link util.service:SharedProperties SharedProperties} service
 */
    .controller('ProductItemDetailController', [ '$scope', 'PRODUCT', 'SharedProperties', function( $scope, PRODUCT, SharedProperties ) {

        // TODO: placeholder content -- DELETE ME
        var reviews = [
                {
                    date: 'April 7, 2014',
                    rating: 4,
                    title: 'The best root beer ever made!',
                    text: 'Gotta have my Barq\'s!!! This root beer, with caffeine in it, is amazing. When I need a little extra but don\'t really want coke or Dr Pepper, I get me a Barq\'s and the "bite" it has in it as opposed to other root beers, is just what I\'m needing. My son loves them, my dad loves them, my husband will even drink one every once in a while - and that\'s saying a lot, because he typically doesn\'t enjoy root beers! A winner with our family, for sure!',
                    author: 'BrianH15'
                },
                {
                    date: 'April 30, 2014',
                    rating: 5,
                    title: 'Barqs Rocks!',
                    text: 'I love this root beer with all my heart but it literally will rot all your teeth out folks! In spite of that, and a very expensive dental bill I can\'t buy anything else. Just know if you drink it the soda will damage your teeth.',
                    author: 'TBone'
                },
                {
                    date: 'April 15, 2014',
                    rating: 5,
                    title: 'BEST ROOT BEER AROUND....HATE THE NEW DESIGN ON THE CAN!',
                    text: 'This is the best root beer around. Has a bite to the taste. Very good. There is a new design on the can. Yuk! Hate it. Someone was lazy with the design. It looks plain. Why change a good thing? When I first opened the 12 can box, I thought I bought the wrong soda. Ok, I know I can get use to it but, I\'d rather not. Why do companies do this? Who makes these decisions? They should have their head examined. :-)',
                    author: 'DanTheMan'
                },
                {
                    date: 'March 15, 2014',
                    rating: 2,
                    title: 'Love root beer, but if you can find locally, it\'s cheaper!',
                    text: 'I agree with other reviewers - this is the BEST root beer, in my opinion. A&W doesn\'t taste right too me, especially when I compare it to this. A nice big iced glass of Barq\'s with extra foam on the top - YUM!! BUT, isn\'t this a little expensive? It could be worse, I\'m sure, but you can get soda on sale for like 3 for $12 or less, plus you don\'t have to pay shipping. So, I gave it 3 stars for the price, not the product. If you can\'t find it in your area, than it\'s worth paying a little more for sure!',
                    author: 'Bobbo'
                }
            ];

        function getAverageRating() {
            var sum = 0;
            for ( var i = 0; i < reviews.length; i++ ) {
                var review = reviews[i];
                sum += review.rating;
            }

            return Math.round( parseFloat( sum ) / parseFloat( reviews.length ) );
        }

        $scope.listManagementActive = false;

        $scope.toggleListManagementPane = function() {
            $scope.listManagementActive = ! $scope.listManagementActive;
        };

        $scope.$on('propertiesUpdated', function(event, newProperties ) {
            if( angular.isDefined(newProperties['product'] ) ) {
                var product = newProperties.product;
                if( angular.isDefined( product['response'] ) ) {
                    product.response.products[0].reviews = reviews;
                    $scope.listManagementActive = false;
                    $scope.product = product.response.products[0];
                    $scope.rating = getAverageRating();
                } else {
                    $scope.product = {};
                }
            }

        });
        var product = SharedProperties.getProperty(PRODUCT);
        if( angular.isDefined( product ) && product !== null && angular.isDefined( product['response'] ) ) {
            product.response.reviews = reviews;
            $scope.product = product.response.products[0];
            $scope.rating = getAverageRating();
        } else {
            $scope.product = {};
        }



    } ]);;
// Source: src/main/js/app/components/products/directives/product-directive.js
angular.module( 'productDirectives', [ 'ProductFactory' ] )

/**
 * @ngdoc controller
 * @name product.controller:SubstituteProductController
 *
 * @description This controller manages a product's substitute preference.  It watches the
 * isSelected property on the scope for changes and triggers an update when it changes via the
 * {@link product.factory:ProductSubstitutionPreferenceFactory ProductSubstitutionPreferenceFactory}.
 */
.controller('SubstituteProductController', ['$scope', '$log', 'ProductSubstitutionPreferenceFactory', function($scope, $log, ProductSubstitutionPreferenceFactory ) {

    $scope.$watch( 'isSelected', function( newValue ) {
        if( angular.isDefined( newValue ) ) {

            var payload = {
                productId: $scope.productId,
                substitutionPreference: newValue
            };
            ProductSubstitutionPreferenceFactory.update( payload ).$promise
                .then( function( responseData ) {
                    if( responseData.response.result !== 'SUCCESS' ) {
                        $log.error('Error while updating product substitution preference: prodId[' + payload.productId + '], sub[' + payload.substitionPreference + '], code[' + responseData.response.result + ']');
                    }
                })
                .catch( function( error ) {
                    $log.error( error );
                });
        }
    });

}])

/**
 * @ngdoc directive
 * @name product.directive:ppdSubProduct
 *
 * @restrict EA
 *
 * @description This directive injects {@link product.controller:SubstituteProductController SubstituteProductController}
 * into this element.
 *
 * @param {object} product injects a product object into the isolated scope to be used for display
 * @param {number} productId used to pass a productId to the controller
 */
.directive('ppdSubProduct', [ function() {
    return {
        restrict: 'EA',
        replace: true,
        scope: {
            product: "=product",
            productId: "=productId"
        },
        controller: 'SubstituteProductController',
        templateUrl: 'site/templates/product/product-substitute.html'
    };
}])

/**
 * @ngdoc directive
 * @name product.directive:ppdProductText
 *
 * @restrict EA
 *
 * @description This directive, given a product text object will inject that object into a
 * template to display a common markup
 *
 * @param {object} extendedInfo a product text object from a returned product
 */
.directive('ppdProductText', [ function() {
    return {
        restrict: 'EA',
        replace: true,
        scope: {
            extendedInfo: "=productTextObject"
        },
        templateUrl: 'site/templates/product/product-text.html'
    };
}])

// TODO: move me to my own component
.controller( 'ProductNutritionController', [ '$scope', function( $scope ) {

    $scope.showHideNutritionDisclaimer = false;

    $scope.toggleNutritionDisclaimer = function() {
        $scope.showHideNutritionDisclaimer = ! $scope.showHideNutritionDisclaimer;
    };
}])

/**
 * @ngdoc directive
 * @name product.directive:ppdNutrition
 *
 * @restrict EA
 *
 * @description This directive, given a nutrition object will inject that object into a
 * template to display a common markup
 *
 * @param {object} nutrition a nutrition object from a returned product
 */
.directive( 'ppdNutrition', [ function( ) {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        controller: 'ProductNutritionController',
        templateUrl: 'site/templates/product/product-nutrition.html',
        scope: {
            nutrition: '=nutritionObject'
        }
    };
}]);;
// Source: src/main/js/app/components/products/factories/product-factory.js
angular.module('ProductFactory', [ 'ngResource' ])
/**
 * @ngdoc service
 * @name product.factory:ProductSubstitutionPreferenceFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
$resource('/api/v2.0/user/substitute-preference/products/:productId', {},
    {
        'get': {
            method: 'GET',
            isArray: false,
            params: {
                productId: '@productId'
            }
        },
        'update': {
            method: 'POST',
            isArray: false,
            params: {
                productId: '@productId',
                sub: '@substitutionPreference'
            }
        },
        'delete': {
            method: 'DELETE',
            isArray: false,
            params: {
                productId: '@productId'
            }
        }
    });
 </pre>
 *
 */
    .factory('ProductSubstitutionPreferenceFactory', [ '$http', '$q', '$resource', function( $http, $q, $resource ) {
        return $resource('/api/v2.0/user/substitute-preference/products/:productId', {},
            {
                 'get': {
                     method: 'GET',
                     isArray: false,
                     params: {
                         productId: '@productId'
                     }
                 },
                'update': {
                    method: 'POST',
                    isArray: false,
                    params: {
                        productId: '@productId',
                        sub: '@substitutionPreference'
                    }
                },
                'delete': {
                    method: 'DELETE',
                    isArray: false,
                    params: {
                        productId: '@productId'
                    }
                }
            });
    }])
/**
 * @ngdoc service
 * @name product.factory:QuickShopFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
$resource('http://akang.dev.peapod.com:8010/ppd-business-app/api/v1/recommendations/:userId',
    {},
    {
        'get': {
            method: 'GET',
            isArray: true,
            params: {
                userId: '@userId',
                howMany: '@howMany'
            }
        }
    });
 </pre>
 *
 */
    .factory('QuickShopFactory', [ '$http', '$q', '$resource', function( $http, $q, $resource ) {
        return $resource('http://akang.dev.peapod.com:8010/ppd-business-app/api/v1/recommendations/:userId',
            {},
            {
                'get': {
                    method: 'GET',
                    isArray: true,
                    params: {
                        userId: '@userId',
                        howMany: '@howMany'
                    }
                }
            });
    }])
/**
 * @ngdoc service
 * @name product.factory:ProductSearchFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
$resource('/api/v2.0/user/products/:productId',
    {
        rows: '@rows',
        start: '@start'
    },
    {
        'getByCatTreeId': {
            method: 'GET',
            isArray: false,
            params: {
                catTreeId: '@catTreeId',
                facet: 'categories,brands,nutrition',
                facetExcludeFilter: true,
                filter: '@filter',
                flags: true,
                rows: '@rows',
                start: '@start',
                sort: '@sort'
            }
        },
        'get': {
            method: 'GET',
            isArray: false,
            params: {
                productId: '@productId',
                nutrition: true,
                extendedInfo: true,
                substitute: true
            }
        },
        'getByKeywords': {
            method: 'GET',
            isArray: false,
            params: {
                keywords: '@keywords',
                facet: 'categories,brands,nutrition',
                facetExcludeFilter: true,
                filter: '@filter',
                flags: true,
                rows: '@rows',
                start: '@start',
                sort: '@sort'
            }
        }
    });
 </pre>
 *
 */
    .factory('ProductSearchFactory', ['$http', '$q', '$resource', function($http, $q, $resource) {

        return $resource('/api/v2.0/user/products/:productId',
                {
                    rows: '@rows',
                    start: '@start'
                },
                {
                    'getByCatTreeId': {
                        method: 'GET',
                        isArray: false,
                        params: {
                            catTreeId: '@catTreeId',
                            facet: 'categories,brands,nutrition,specials,newArrivals',
                            facetExcludeFilter: true,
                            filter: '@filter',
                            flags: true,
                            rows: '@rows',
                            start: '@start',
                            sort: '@sort'
                        }
                    },
                    'get': {
                        method: 'GET',
                        isArray: false,
                        params: {
                            productId: '@productId',
                            nutrition: true,
                            extendedInfo: true,
                            substitute: true,
                            facetExcludeFilter: '@facetExcludeFilter',
                            catTreeId: '@catTreeId',
                            facet: '@facet',
                            filter: '@filter',
                            flags: '@flags',
                            rows: '@rows',
                            start: '@start',
                            sort: '@sort'
                        }
                    },
                    'getByKeywords': {
                        method: 'GET',
                        isArray: false,
                        params: {
                            keywords: '@keywords',
                            facet: 'categories,brands,nutrition,specials,newArrivals',
                            facetExcludeFilter: true,
                            filter: '@filter',
                            flags: true,
                            rows: '@rows',
                            start: '@start',
                            sort: '@sort'
                        }
                    }
                });
    }])

/**
 * @ngdoc service
 * @name product.factory:ProductTypeaheadFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
 <pre>
$resource('/api/v2.0/user/typeahead',
    {
    },
    {
        'query': {
            method: 'GET',
            isArray: false,
            cache: true,
            params: {
                like: '@like'
            }
        }
    });
 </pre>
 *
 */
    .factory('ProductTypeaheadFactory', ['$http', '$q', '$resource', function($http, $q, $resource) {

            return $resource('/api/v2.0/user/typeahead',
                {
                },
                {
                    'query': {
                        method: 'GET',
                        isArray: false,
                        cache: true,
                        params: {
                            like: '@like'
                        }
                    }
                });
    }]);;
// Source: src/main/js/app/components/products/filters/product-filters.js
angular.module('ProductFilters', [])

/**
 * @ngdoc filter
 * @name product.filters:CategoryFilter
 *
 * @description This is a filter to take in a normalized set of products and convert
 * it to a set, keyed by category id, with the properties items(the set of objects in that set)
 * and catName(the descriptive category name for that set).
 *
 * @param {array} data Collection of product objects. Each object must have a value for the consumCatId property
 * @param {boolean} [shouldTransform=true] Boolean parameter that will be evaluated to see if the data should be transformed
 */
.filter('CategoryFilter', function() {

    return function(data, shouldTransform) {
        var transformedData = {},
            enabled = angular.isDefined(shouldTransform) ? shouldTransform : true;

        if( enabled === false ) {
            return data;
        }

        angular.forEach( data, function( item ) {

            if( angular.isDefined( this[ item.consumCatId ]) === false ) {
                this[ item.consumCatId ] = {
                    items: [],
                    catName: item.consumCatName
                };
            }

            this[ item.consumCatId ].items.push( item );

        }, transformedData);

        return transformedData;
    };

});;
// Source: src/main/js/app/components/products/services/product-services.js
angular.module('ProductServices', [ 'ProductFactory', 'Properties' ])

.constant( 'PRODUCT', 'product' )

/**
 * @ngdoc service
 * @name product.service:ProductItemDetailService
 *
 * @description This service stores common implementations to open product lists and to open item detail from a product view
 */
.service('ProductItemDetailService', [ 'ProductSearchFactory', 'SharedProperties', 'PRODUCT', function(ProductSearchFactory, SharedProperties, PRODUCT) {
    var service = this;

    service.openItemDetail = function( $scope, productId ) {
        var $promise = ProductSearchFactory.get({ productId: productId }).$promise;

        $promise
            .then( function(product) {
                SharedProperties.setProperty(PRODUCT, product);
                $scope.openNamedView('item-detail-modal');
            })
            .catch( function(error) {
                console.log("An error occurred while loading product: " + error);
            });
    };

    service.openProductLists = function( $scope, productId ) {
        var $promise = ProductSearchFactory.get({ productId: productId }).$promise;

        $promise
            .then( function(product) {
                SharedProperties.setProperty(PRODUCT, product);
                $scope.openNamedModalView( 'modal-right', 'list' );
            })
            .catch( function(error) {
                console.log("An error occurred while loading product: " + error);
            });

    };
}]);;
// Source: src/main/js/app/components/pup/controllers/pickup-controllers.js
angular.module('PickupControllers', [ 'PickupServices', 'google-maps', 'GeoCodingServices', 'UserPreferenceServices' ])

/**
 * @ngdoc controller
 * @name pickup.controller:PickupLocationController
 *
 * @description This controller is used for retrieving a set pickup locations and displaying it on a map.
 *
 * @property {array} pickupLocations This is a collection of pickup locations
 * @property {array} radii An array of radii to be used as a default.
 * @property {boolean} pupErrorState This is a flag that is set to true when a promise fails
 * @property {string} errorCode This is the associated code with the pupErrorState
 * @property {function} staticMapUrlForLocation(location,width) Retrieves a url for a map with a specified width and location
 * @property {function} directionsUrlForLocation(location) Retrieves a url to direct a user to a google maps url to view it there.
 * @property {function} lookupLocations(zip,radius) Refreshes the pickupLocations for a given zip and radius.
 * @property {function} lookupLocationsNearMe(radius) Using the zip from geolocation will delegate to lookupLocations(zip,radius)
 * @property {function} iconImageForIndexAndState(index,state) Using the index of the pickupLocation and the current state of it which has the following possible values: ['','selected','hover'].
 * This is used to retrieve a different image depending on the state.
 */
.controller('PickupLocationController', [ '$scope', '$log', 'PickupLocationService', 'UserPreferenceService', 'NavigatorGeoCoderGeoLocation', 'GeoCoder', function($scope, $log, PickupLocationService, UserPreferenceService, NavigatorGeolocation, GeoCoder) {

    $scope.pickupLocations = PickupLocationService.pickupLocations;
    $scope.radii = [ 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ];
    $scope.appendMiles = function( value ) {
        return value + ' miles';
    };

    $scope.zip = null;

    $scope.$watch( function() {
        return PickupLocationService.pickupLocations;
    }, function( pickupLocations ) {
        loadPositions();
        $scope.pickupLocations = pickupLocations;
        $scope.$broadcast('ppdLoadingActionFinish', {});
    });

    var indexForMapMarker = function(marker) {
        var pickupLocations = PickupLocationService.pickupLocations;
        for( var i = 0; i < pickupLocations.length; i++ ) {
            var location = pickupLocations[i];

            if( location.id === marker.id ) {
                return i;
            }
        }
    };

    var injectPositionsToScope = function(currentBounds, positions ) {
        var bounds = {
            southwest: {
                latitude: currentBounds.getSouthWest().lat(),
                longitude: currentBounds.getSouthWest().lng()
            },
            northeast: {
                latitude: currentBounds.getNorthEast().lat(),
                longitude: currentBounds.getNorthEast().lng()
            }
        };
        $scope.map = {
            center: {
                // this should default to the searched zip code
                latitude: currentBounds.getCenter().lat(),
                longitude: currentBounds.getCenter().lng()
            },
            zoom: 11,
            positions: positions,
            bounds: bounds,
            markerEvents: {
                mouseover:function(markerModel) {// function( map, eventName, originalEventArgs) {
                    markerModel.setIcon($scope.iconImageForIndexAndState(indexForMapMarker(markerModel) + 1, 'hover'));
                },
                mouseout: function(markerModel) {
                    var preferredPupLocation = UserPreferenceService.getPreference('preferred-pup');

                    var state = preferredPupLocation.id === markerModel.id ? 'selected' : '';

                    markerModel.setIcon($scope.iconImageForIndexAndState(indexForMapMarker(markerModel) + 1, state));
                }
            },
            options: {
                maxZoom: 20,
                minZoom: 3
            }
        };

        setTimeout(function() {
            $scope.$apply(function() {
                $scope.showMap = true;
            });
        },0);
    };

    var loadPositions = function() {
        var positions = [],
            pickupLocations = PickupLocationService.pickupLocations,
            currentBounds = new google.maps.LatLngBounds();

        for( var i = 0; i < pickupLocations.length; i++ ) {
            var location = pickupLocations[i];

            var googleLocation = new google.maps.LatLng(location.latitude, location.longitude);

            currentBounds.extend(googleLocation);
            positions.push(location);
        }

        var zip = null;
        if( angular.isDefined( $scope.zip ) && $scope.zip !== null && /^\d{5}$/.test($scope.zip)) {
            zip = $scope.zip;
        }

        if( zip !== null ) {
            GeoCoder.geocode({ address: zip })
                .then( function(results) {
                    if( positions.length === 0 && results.length > 0 ) {
                        var googleLocation = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
                        currentBounds.extend(googleLocation);
                    }
                    injectPositionsToScope( currentBounds, positions );
                } )
                .catch(function (error) {
                    $log.error('Unable to load map: ' + error);
                });
        } else {
            injectPositionsToScope( currentBounds, positions );
        }
    };


    // TODO:
    // May need some logic in order to limit the number of requests sent to google. Possibly
    // a timeout solution that will queue the requests and only fire the last one every second.
    // Google's api states that it will only return for < 10 requests / s
    $scope.staticMapUrlForLocation = function( location, width ) {
        var baseUrl = 'http://maps.googleapis.com/maps/api/staticmap?' +
                        'maptype=roadmap' +
                        '&size=' + width + 'x170' +
                        '&markers=';

        return baseUrl + location.latitude + ',' + location.longitude;
    };

    $scope.directionsUrlForLocation = function( location ) {
        var baseUrl = 'http://maps.google.com/?q=';

        return baseUrl + location.latitude + ',' + location.longitude;
    };

    $scope.lookupLocations = function( zip, radius ) {

        $scope.pupErrorState = false;

        PickupLocationService.lookupLocations( zip, radius )
            .catch(function(error) {
                $scope.pupErrorState = true;
                $scope.errorCode = error.data.response.code;
                $log.error('An error occurred while retrieving the pickup locations: ' + error.data.response.code);
                PickupLocationService.pickupLocations = [];
            });
    };

    $scope.lookupLocationsNearMe = function( zip, radius ) {

        $scope.zip = zip;

        $scope.lookupLocations( zip, radius );
    };

    $scope.iconImageForIndexAndState = function( index, state ) {
        var baseUrl = "/shop/images/pickupPins/";

        if( index > 0 ) {
            return baseUrl + index + ( state === 'hover' || state === 'selected' ? '-' + state : '' ) + '.png';
        }

        return null;
    };

    // Geocoding initialization
    NavigatorGeolocation.getCurrentPosition()
        .then(function(position) {
            $scope.position = position;
            $scope.geocodingSuccess = true;
        })
        .catch(function(error) {
            $log.error('Error retrieving geolocation: ' + error );
        });

}]);

;
// Source: src/main/js/app/components/pup/directives/pickup-directives.js
;
// Source: src/main/js/app/components/pup/factories/pickup-factories.js
angular.module('PickupFactories', [ 'ngResource' ] )

.factory( 'PickupLocationFactory', [ '$http', '$q', '$resource', function( $http, $q, $resource ) {
    return $resource( '/api/v2.0/user/pup', {},
        {
            'lookup': {
                method: 'GET',
                isArray: false,
                params: {
                    zip: '@zip',
                    radius: '@radius'
                }
            }
        });
}]);;
// Source: src/main/js/app/components/pup/pickup-include.js
angular.module('pickup', [ 'PickupControllers' ]);;
// Source: src/main/js/app/components/pup/services/pickup-services.js
angular.module('PickupServices', ['PickupFactories'])

/**
 * @ngdoc service
 * @name pickup.service:PickupLocationService
 *
 * @description This service is meant to place a facade on top of the async call to update
 * the locations.  This facade layer will also update it's internal cache.
 */
.service('PickupLocationService', [ '$q', '$log', 'PickupLocationFactory', function( $q, $log, PickupLocationFactory ) {
    var service = this;

    service.pickupLocations = null;

    service.lookupLocations = function( zip, radius ) {
        var payload = {
            radius: radius,
            zip: zip
        };

        var deferred = $q.defer();
        var promise = deferred.promise;

        PickupLocationFactory.lookup(payload).$promise
            .then(function(responseData) {
                service.pickupLocations = responseData.response;

                deferred.resolve(true);
            })
            .catch(function(error) {
                $log.error("An error occurred while initializing the pickup locations: " + error );
                deferred.reject(error);
            });

        return promise;
    };

    service.initializePickupLocations = function() {

        return service.lookupLocations( null, 10 );
    };

}]);;
// Source: src/main/js/app/components/recommendations/controller/recommendations-controllers.js
;
// Source: src/main/js/app/components/recommendations/directives/recommendations-directives.js
angular.module('RecommendationsDirectives', [ 'RecommendationsFactories' ] )

/**
 * @ngdoc directive
 * @name recommendations.directive:ppdRecommendations
 *
 * @description This factory provides a callback promise to be used for recommendations.  The options parameters can take a set of options to be passed to certona.
 *
 * @param {number=} [top1=100000] Not sure
 * @param {number=} [top2=100000] Not sure
 * @param {string=} rrelem Recommendations type for certona
 * @param {string=} [rrnum=3] number of recommendations
 * @param {string=} event event for certona recommendations
 * @param {string=|array=} [itemid=''] A semicolon delimited list of item SKUs to be used to do content based recommendations.  If it is an array then it will be joined with ';'
 * @param {string=|array=} [exitemid=''] A semicolon delimited list of item SKUs to be excluded from the results.  If it is an array then it will be joined with ';'
 * @param {number=} [timeout=4000] Timeout for the backing promise of the request to certona.  (This will trigger the call to cancel itself)
 *
 * @returns {promise} Returns a promise to resolve the recommended product ids for a set of options.
 *
 */
.directive('ppdRecommendations', [ '$parse', '$log', 'RecommendationsFactory', function($parse, $log, RecommendationsFactory) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            element.addClass('resolved-recommendations');

            var readValueFromAttribute = function(attributeName) {
                if( angular.isDefined(attrs[attributeName])) {
                    return $parse(attrs[attributeName])(scope);
                }

                return null;
            };

            var readOptionValuesFromAttributes = function() {

                var availableOptions = [
                    'top1',
                    'top2',
                    'rrelem',
                    'rrnum',
                    'itemid',
                    'exitemid',
                    'timeout',
                    'event'
                ];

                var options = {};

                for( var index in availableOptions ) {
                    var attributeName = availableOptions[index];

                    var attributeValue = readValueFromAttribute(attributeName);
                    if( attributeValue !== null ) {
                        options[attributeName] = attributeValue;
                    }
                }

                return options;
            };

            var refreshReturnedRecommendations = function(options) {
                RecommendationsFactory.retrieveRecommendations(options)
                    .then(function(responseData) {
                        scope.products = responseData.response.products;
                    })
                    .catch(function(errorData) {
                        $log.error('An error occurred while retrieving products for recommendations', errorData);
                    });
            };

            scope.$watch(function() {
                return readOptionValuesFromAttributes();
            }, function(newOptions) {
                refreshReturnedRecommendations(newOptions);
            }, true);
        }
    };
}]);;
// Source: src/main/js/app/components/recommendations/factories/recommendations-factories.js
angular.module('RecommendationsFactories', [ 'ppdCallback' ])

.value('RECOMMENDATION_DEFAULT', {
        appid: 'peapod01', // always this value
        top1: 100000, // revisit these values -- left constant for now
        top2: 100000, // revisit these values -- left constant for now
        customerid: '18507432', // customer id from user
        event: 'product', // recommendations event
        itemid: '', // item id(s) to do item based recommendations
        rrnum: 3, // config from directive
        exitemid: '', // config from directive
        rrqs: 'storeid=10&storeprice=10_18&pricezone=18', // config from user
        cv12: '10', // config from user
        timeout: 4000 // global configuration -- overridable from directive
})

.factory('RecommendationsFactory', [ '$q', '$log', 'CertonaRecommendationsService', 'ProductSearchFactory', function( $q, $log, CertonaRecommendationsService, ProductSearchFactory ) {

    var factory = {};

    var processResults = function(deferred, data) {
        var items = data.resonance.schemes[0].items,
            products = [];

        if (items.length === 0 || (typeof items[0].id === 'undefined')) {
            // No items return empty set
            deferred.resolve(products);
        } else {
            for ( var item in items ) {
                products.push(items[item].id);
            }

            var productString = products.join();
            var payload = {
                productId: productString
            };

            ProductSearchFactory.get(payload).$promise
                .then(function(responseData) {
                    deferred.resolve(responseData);
                })
                .catch(function(errorData) {
                    deferred.reject(errorData);
                });
        }
    };

    factory.retrieveRecommendations = function(options) {
        var deferred = $q.defer();
        CertonaRecommendationsService.retrieveRecommendations(options)
            .then(function(data) {
                processResults(deferred, data);
            })
            .catch(function(errorMessage) {
                deferred.reject(errorMessage);
            });

        return deferred.promise;
    };

    return factory;
}])

/**
 * @ngdoc service
 * @name recommendations.service:CertonaRecommendationsService
 *
 * @description This factory provides a callback promise to be used for recommendations.  The options parameters can take a set of options to be passed to certona.
 * There are two exposed methods from this service that both take the same set of parameters.
 * <ol>
 *     <li><b>sendData</b> - simply sends the request data to certona and should timeout without a response.</li>
 *     <li><b>retrieveRecommendations</b> - sends the request data to certona and resolves a promise with the recommendations data.</li>
 * </ol>
 *
 * @param {number=} [top1=100000] Not sure
 * @param {number=} [top2=100000] Not sure
 * @param {string=} rrelem Recommendations type for certona
 * @param {string=} [rrnum=3] number of recommendations
 * @param {string=} event event for certona recommendations
 * @param {string=|array=} [itemid=''] A semicolon delimited list of item SKUs to be used to do content based recommendations.  If it is an array then it will be joined with ';'
 * @param {string=|array=} [exitemid=''] A semicolon delimited list of item SKUs to be excluded from the results.  If it is an array then it will be joined with ';'
 * @param {number=} [timeout=4000] Timeout for the backing promise of the request to certona.  (This will trigger the call to cancel itself)
 * @param {object=} [options={}] This is a map of options to be used with certona's recommendation engine.
 * @returns {promise} Returns a promise to resolve the recommended product ids for a set of options.
 *
 */
.service('CertonaRecommendationsService', [ '$q', '$log', '$timeout', 'callback', 'RECOMMENDATION_DEFAULT', function( $q, $log, $timeout, callback, defaultConstants ) {

    var service = this;

    service.requestQueue = [];
    service.isRequestProcessing = false;

    var queueAndProcessRequest = function(request) {
        service.requestQueue.push(request);

        if( service.isRequestProcessing === false ) {
            processNextRequest();
        }
    };

    var timeoutDeferredClosure = function(request) {

        return function() {
            if(request.rrec) {
                request.deferred.reject('CertonaRecommendationsFactory: Request exceeded specified timeout');
            } else {
                request.deferred.resolve({
                    code: 'CERTONA_DATA_LOAD_SUCCESS',
                    msg: 'CertonaRecommendationsFactory: Request exceeded specified timeout'
                });
            }
        };
    };

    var advanceIterator = function() {
        setTimeout(function() {
            service.requestQueue.splice(0,1);
            service.isRequestProcessing = false;
            processNextRequest();
        }, 100);
    };

    var processNextRequest = function() {
        if( service.requestQueue.length > 0 ) {
            service.isRequestProcessing = true;
            var request = service.requestQueue[0];

            // This extends the global variable resx in order to run the certona recommendations service....
            angular.extend(resx,request);
            certonaResx.run();

            setTimeout(timeoutDeferredClosure(request), request.timeout);

            if( request.rrec ) {
                request.processRecCallback.promise
                    .then(function (data) {
                        $log.info('Recommendation retrieval from certona successful for customer: [' + request.customerid + ']');
                        request.deferred.resolve(data);

                        advanceIterator();
                    })
                    .catch(function () {
                        $log.error('Recommendation retrieval from certona failed for customer: [' + request.customerid + ']');
                        request.deferred.reject('Recommendation retrieval from certona failed');

                        advanceIterator();
                    });
            } else {
                advanceIterator();
            }
        }
    };

    var joinItemAttributesWithSeparator = function(options, attributeName, separator) {
        if(Array.isArray(options[attributeName])) {
            options[attributeName] = options[attributeName].join(separator);
        }
    };

    var sendRequest = function(options) {
        var processRecCallback = callback({ prefix: 'rec' }),
            deferred = $q.defer();

        var defaults = angular.copy(defaultConstants);

        var baseOptions = defaults;
        angular.extend(baseOptions, options);

        joinItemAttributesWithSeparator(options, 'itemid', ';');
        joinItemAttributesWithSeparator(options, 'exitemid', ';');

        baseOptions.rrcall = processRecCallback.stringifiedCallbackFunction;
        baseOptions.processRecCallback = processRecCallback;
        baseOptions.deferred = deferred;

        queueAndProcessRequest(baseOptions);

        return deferred.promise;
    };

    service.sendData = function(options) {
        options.rrec = false;
        options.timeout = 0; // don't wait for request to fail - trigger timeout right away

        return sendRequest(options);
    };

    service.retrieveRecommendations = function(options) {
        options.rrec = true;

        return sendRequest(options);
    };

    return service;
}]);
;
// Source: src/main/js/app/components/recommendations/recommendations-include.js
angular.module('recommendations', ['RecommendationsDirectives']);;
// Source: src/main/js/app/components/reviews/ratings-directive.js
angular.module( 'reviews', [] )
/**
 * @ngdoc directive
 * @name reviews.directive:ppdRatingStars
 *
 * @description This directive takes in a rating and a count.  Given those properties it will
 * pass those to a template to generate a series of stars.
 *
 * @restrict AE
 *
 * @params {number} rating This is the number of stars it should show
 * @params {string=} text This should be the text that will show the number of reviews
 */
    .directive( 'ppdRatingStars', [ '$parse', '$sce', function( $parse, $sce ) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            templateUrl: 'site/templates/reviews/rating.html',
            scope: {
                average: '@rating',
                countText: '@text'
            },
            link: function( scope ) {
                scope.average = $parse( scope.average )();
                scope.countText = $sce.trustAsHtml(scope.countText);
            }
        };
    }]);;
// Source: src/main/js/app/components/scrollable/scrollable.js
angular.module("scrollable", [])

/**
 * @ngdoc directive
 * @name scrollable.directive:ppdInfiniteScroll
 *
 * @description This directives creates a place to put a listener of the current scroll position.  When the threshold is exceeded it will
 * trigger the callback expression in the ppdInfiniteScroll param.
 *
 * @param {number=} [threshold=0] Sets the scroll threshold from the bottom of the scroll pane from which to call the update handler
 * @param {function|expression} [ppdInfiniteScroll] sets a callback expression to be ran when the threshold has been exceeded
 */
    .directive('ppdInfiniteScroll', [ '$parse', function ( $parse ) {
        return {
            link:function (scope, element, attrs) {
                var offset = parseInt(attrs.threshold, 10) || 0;

                var infiniteScrollUpdateHandler = $parse(attrs.ppdInfiniteScroll);

                scope.$on('scrollPositionUpdated', function($event, scrollData) {

                    if( angular.isDefined( scrollData.currentPosition ) && angular.isDefined( scrollData.maxScrollPosition ) ) {
                        var currentScrollPosition = scrollData.currentPosition,
                            maxScroll             = scrollData.maxScrollPosition;


                        if( maxScroll < currentScrollPosition + offset ) {
                            infiniteScrollUpdateHandler( scope );
                        }
                    }
                });
            }
        };
    }])

/**
 * @ngdoc directive
 * @name scrollable.directive:scrollableContent
 *
 * @description This directive adds a scroller trait to this dom element.  It will also
 * support legacy devices by adding the overthrow polyfill to this element.
 *
 * This directive is overloaded and will broadcast the current scroll position.
 *
 * This directive accepts the following events:
 * <br><b>scrollToElement</b> - This will scroll to an element specified in the data parameters (e.g. { element: <element> }.
 *
 * This directive broadcasts the following events:
 * <br><b>scrollPositionUpdated</b> - This broadcasts the current scroll position (e.g. {
                            currentPosition: currentScrollPosition,
                            maxScrollPosition: maxScrollPosition
                        } )
 *
 */
    .directive("scrollableContent", [
        function() {
            return {
                replace: false,
                restrict: "C",
                link: function(scope, element) {

                    scope.$on('scrollToElement', function( $event, data ) {

                        if( angular.isDefined( data['element'] )) {
                            setTimeout(function() {
                                element.scrollToElement(angular.element(data.element), 0, 1000 );
                            }, 0);
                        }
                    });

                    if (overthrow.support !== "native") {
                        element.addClass("overthrow");
                        overthrow.forget();
                        return overthrow.set();
                    }
                }
            };
        }
    ])

    .directive("scrollableContent", [
        function() {
            return {
                replace: false,
                restrict: "C",
                link: function(scope, element) {
                    var broadcastCurrentScroll = function( currentScrollPosition, maxScrollPosition ) {

                        currentScrollPosition = Math.abs( currentScrollPosition < 0 ? 0 : currentScrollPosition );
                        currentScrollPosition = currentScrollPosition > maxScrollPosition ? maxScrollPosition : currentScrollPosition;

                        scope.$broadcast('scrollPositionUpdated', {
                            currentPosition: currentScrollPosition,
                            maxScrollPosition: maxScrollPosition
                        });
                        scope.$apply();
                    };

                    element.on('scroll', function() {
                        broadcastCurrentScroll( element[0].scrollTop + element[0].offsetHeight, element[0].scrollHeight );
                    });
                }
            };
        }
    ])

/**
 * @ngdoc directive
 * @name scrollable.directive:ppdScrollToIf
 *
 * @description This directive is used to trigger a scroll to operation when a condition is met
 *
 * @param {expression} [ppdScrollToIf] Expression to be evaluated and watched for changes
 */
    .directive('ppdScrollToIf', [ '$parse', function($parse) {
        return {
            replace: false,
            restrict: 'A',
            compile: function() {
                return function( scope, element, attr ) {

                    var scrollTo = $parse(attr['scrollTo'])(scope);

                    scope.$watch(attr['ppdScrollToIf'], function(newValue) {
                        if( newValue ) {

                            var data = {
                                element: element,
                                scrollTo: scrollTo
                            };

                            scope.$emit('scrollToElement', data);
                        }
                    });
                };
            }
        };
    }]);
;
// Source: src/main/js/app/components/shared/service/shared-property-service.js
angular.module('Properties', [] )

    // TODO: Create ability to specify which fields are synced with the view controller
/**
 * @ngdoc service
 * @name util.service:SharedProperties
 *
 * @description This service is meant to be a simple service to share
 * properties between components if a specific implementation is not
 * required.
 */
    .service('SharedProperties', function() {
        var sharedProperties = {};

        return {
            getProperty: function(key) {
                if( ! angular.isDefined(sharedProperties[key] ) ) {
                    return null;
                }
                return sharedProperties[key];
            },
            setProperty: function(key, value) {
                sharedProperties[key] = value;
                return value;
            },
            getSharedProperties: function() {
                return sharedProperties;
            }
        };
    });;
// Source: src/main/js/app/components/slots/controllers/slot-controllers.js
angular.module('SlotsControllers', [ 'SlotServices', 'UserPreferenceServices', 'PickupServices' ] )

/**
 * @ngdoc controller
 * @name slot.controller:SlotController
 *
 * @description This controller manages a user's interaction with the delivery/pickup slot flows.  It also
 * handles delegation of a user to pickup locations when necessary
 *
 * @property {function} selectPickupLocation(location) Delegates the user to the pickup location flow
 * @property {function} selectServiceType(type) Selects a service type of either 'P' or 'D' and gets a default set of slots
 * @property {function} toggleServiceType(type) Takes the user's currently selected service type then chooses the other and delegates to selectServiceType
 * @property {function} reserveSlot(slot) Reserves a given slot
 * @property {function} selectHeader(header) Will change the active header and retrieve slots for it
 * @property {function} resetRestrictedSlot() Resets the actively visible restricted items
 * @property {function} setActiveRestrictedSlot(slot) Selects which restricted slot will be visible
 * @property {function} toggleRestrictedSlot(slot) Toggles a restricted slot from open to closed and vice versa
 * @property {function} removeRestrictedItemsForSlot(slot) Removes the restricted items from the cart
 * @property {function} getAggregatedRestrictedItems(slots) Delegates to the aggregatedRestrictedItems method of {@link slot.service:RestrictedSlotService}
 * @property {function} isHeaderSelected(header,viewDate) Checks to see if the selected viewDate matches the viewDate on the header
 * @property {function} isHeaderAvailable(header) Checks if the status code of a header matches a set of status codes that should be seen as unavailable
 * @property {function} getDayClassesForHeader(header,viewDate) Retrieves the set of classes that should be added/removed to the element(used with ng-class directive)
 * @property {function} isSlotRestricted(slot) Checks if a slot is restricted
 * @property {function} restrictedSlotsExist(slot) Utility function to tell if a slot has restricted items
 * @property {function} getRestrictedTypes(slots) Delegates to the getRestrictedTypesFromSlots method of {@link slot.service:RestrictedSlotService}
 * @property {function} getRestrictedTypesString(slots) Given a set of slots it will generate a common list of restrictions for the given header
 * @property {function} getSlotClasses(slot,isLast) Gets the classes for a given slot and the $last parameter from ng-repeat
 * @property {function} hasMessage(slot) Checks if the slot has a message to display
 *
 */
.controller( 'SlotController', [ '$scope', '$log', 'PickupLocationService', 'SlotReservationService', 'SlotRetrievalService', 'SlotInformationService', 'RestrictedSlotService', 'UserPreferenceService', 'USER_PREFERENCE_KEYS', function( $scope, $log, PickupLocationService, SlotReservationService, SlotRetrievalService, SlotInformationService, RestrictedSlotService, UserPreferenceService, USER_PREFERENCE_KEYS ) {

    var deliveryAvailable = SlotInformationService.deliveryAvailable,
        pupAvailable = SlotInformationService.pupAvailable,
        selectedSlotId = SlotInformationService.selectedSlotId,
        selectedSlot = SlotInformationService.selectedSlot;

    $scope.selectedSlot = selectedSlot;
    $scope.selectNewSlot = false;
    $scope.serviceType = SlotRetrievalService.serviceType;

    $scope.headersPage = 0;

    $scope.activeRestrictedSlot = 0;
    $scope.restrictedSlot = null;

    // Don't animate the date picker onload of the controller
    $scope.animateHeaders = false;

    $scope.$on('$viewContentLoaded', function() {
        $scope.animateHeaders = true;
    });
    setTimeout(function() {
        $scope.animateHeaders = true;
    }, 0);

    $scope.togglePage = function() {
        $scope.headersPage = $scope.headersPage === 0 ? 1 : 0;
    };

    $scope.changeReservation = function() {
        $scope.selectNewSlot = true;
    };

    var activeStep = ! deliveryAvailable || ! pupAvailable || selectedSlotId !== 0 ? 1 : 0;
    $scope.activeStep = activeStep;

    $scope.animateNext = false;
    $scope.animatePrev = false;

    $scope.nextStep = function() {
        $scope.animateNext = true;
        $scope.animatePrev = false;
        $scope.activeStep = activeStep < 1 ? activeStep + 1 : activeStep;
    };

    $scope.prevStep = function() {
        $scope.animateNext = false;
        $scope.animatePrev = true;
        $scope.activeStep = activeStep > 0 ? activeStep - 1 : activeStep;

        var hasPupPreference = UserPreferenceService.hasPreference(USER_PREFERENCE_KEYS.PREFERRED_PUP);
        if( activeStep === 2 ) {
            $scope.activeStep = hasPupPreference ? activeStep - 1 : activeStep - 2;
        } else {
            $scope.activeStep = activeStep > 0 ? activeStep - 1 : activeStep;
        }
    };

    $scope.selectPickupLocation = function() {

        PickupLocationService.initializePickupLocations()
            ['finally'](function() {
                $scope.activeStep = 2;
            });
    };

    $scope.stepAtIndex = function( index ) {
        $scope.animateNext = $scope.activeStep < index;
        $scope.animatePrev = $scope.activeStep > index;
        $scope.activeStep = index;
    };

    $scope.hasNonSingularServiceType = deliveryAvailable && pupAvailable;

    $scope.$watch( function() {
        return SlotInformationService.getCurrentSlotInformation();
    }, function(currentSlotInformation) {
        if( currentSlotInformation !== null ) {
            $scope.selectedSlotId = currentSlotInformation.selectedSlotId;
            $scope.deliveryAvailable = currentSlotInformation.deliveryAvailable;
            $scope.pupAvailable = currentSlotInformation.pupAvailable;
            $scope.selectedSlot = currentSlotInformation.selectedSlot;
        }
    }, true);

    var injectResponseDataToScope = function(responseData) {

        $scope.activeRestrictedSlot = 0;
        $scope.restrictedSlot = null;
        var selectedSlotId = responseData.response.selectedSlotId || 0,
            serviceType = responseData.response.serviceType,
            selectedSlot = responseData.response.selectedSlot;

        SlotInformationService.selectedSlotId = selectedSlotId;
        SlotRetrievalService.serviceType = serviceType;
        SlotInformationService.selectedSlot = selectedSlot;

        $scope.headers = responseData.response.headers;

        var headers = responseData.response.headers;
        if( headers.length === 14 ) {
            var headersFirstPage = [],
                headersSecondPage = [];

            for( var i = 0; i < 7; i++ ) {
                var firstPageHeader = headers[i],
                    secondPageHeader = headers[i+7];

                headersFirstPage.push(firstPageHeader);
                headersSecondPage.push(secondPageHeader);
            }

            $scope.headersFirstPage = headersFirstPage;
            $scope.headersSecondPage = headersSecondPage;
        }

        $scope.slots = responseData.response.slots;
        $scope.viewDate = responseData.response.viewDate;
        $scope.serviceType = serviceType;

        $scope.$broadcast('ppdLoadingActionFinish', {});
        $scope.stepAtIndex(1);

        setTimeout(function() {
            $scope.disableAnimations = false;
            $scope.headerCallMade = false;
            $scope.$apply();
        }, 0);
    };

    var handleSlotsRetrieveCall = function( payload ) {
        SlotRetrievalService.retrieveSlotsPromise(payload)
            .then( function(responseData) {
                injectResponseDataToScope(responseData);
                $scope.headerCallMade = true;
            })
            .catch( function( error ) {
                $log.error( "Error occurred when getting slot headers" + error );
            });
    };

    var handleSlotsServiceCall = function( payload ) {
        SlotRetrievalService.retrieveSlotsPromise(payload)
            .then( injectResponseDataToScope )
            .catch( function( error ) {
                $log.error( "Error occurred when getting slot headers" + error );
                if( error.data.response.code === 'SLOTS_NO_PUP_SELECTED' ) {
                    $scope.activeStep = 2;
                }
            });
    };

    var handleSlotsReserveCall = function( slot ) {
        SlotReservationService.reserveTimeSlot(slot)
            .then( injectResponseDataToScope )
            .catch( function( error ) {
                $log.error( "Error occurred when reserving slots" + error );
            });
    };

    $scope.selectServiceType = function( serviceType ) {

        SlotRetrievalService.serviceType = serviceType;

        var payload = {
            selected: true,
            delivAvail: true,
            pupAvail: true,
            headers: true
        };
        $scope.selectNewSlot = false;
        handleSlotsServiceCall(payload);
    };

    $scope.toggleServiceType = function() {
        var serviceType = SlotRetrievalService.serviceType === 'D' ? 'P' : 'D';
        $scope.selectServiceType(serviceType);
    };

    $scope.reserveSlot = function( slot ) {
        $scope.disableAnimations = true;
        handleSlotsReserveCall(slot);
    };

    $scope.selectHeader = function( header ) {

        var payload = {
            selected: true,
            delivAvail: true,
            pupAvail: true,
            headers: true,
            viewDate: header.date
        };

        handleSlotsRetrieveCall(payload);
    };

    $scope.resetRestrictedSlot = function() {
        $scope.activeRestrictedSlot = 0;
        $scope.restrictedSlot = null;
    };

    $scope.setActiveRestrictedSlot = function( slot ) {
        $scope.activeRestrictedSlot = slot.id;
        $scope.restrictedSlot = slot;
    };

    $scope.toggleRestrictedSlot = function( slot ) {
        if( slot.id === $scope.activeRestrictedSlot ) {
            $scope.resetRestrictedSlot();
        } else {
            $scope.setActiveRestrictedSlot(slot);
        }
    };

    $scope.removeRestrictedItemsForSlot = function( slot ) {

        var productIds = RestrictedSlotService.getProductIdsFromRestrictedSlot( slot );
        if( productIds.length > 0 ) {
            RestrictedSlotService.removeProductIdsFromCart(slot, productIds)
                .then( injectResponseDataToScope )
                .catch( function( error ) {
                    $log.error( "Error occurred when deleting restricted items in cart " + error );
                });
        }
    };

    $scope.getAggregatedRestrictedItems = function( slot ) {
        return RestrictedSlotService.aggregateRestrictedItems( slot );
    };

    $scope.isHeaderSelected = function( header, viewDate ) {
        return header.date === viewDate;
    };

    $scope.isHeaderAvailable = function( header ) {
        return header.statusCode !== 'U' && header.statusCode !== 'C';
    };

    $scope.getDayClassesForHeader = function( header, viewDate ) {
        return {
            'unavailable': header.statusCode === 'U',
            'holiday': header.statusCode === 'H',
            'closed': header.statusCode === 'C',
            'weather': header.statusCode === 'W',
            'active': $scope.isHeaderSelected(header,viewDate)
        };
    };

    $scope.isSlotRestricted = function( slot ) {
        return angular.equals(slot.restrict, {} ) === false;
    };

    $scope.restrictedSlotsExist = function( slots ) {

        for( var i = 0; i < slots.length; i++ ) {
            var slot = slots[i];
            if($scope.isSlotRestricted(slot) ) {
                return true;
            }
        }
        return false;
    };

    $scope.getRestrictedTypes = function( slots ) {
        return RestrictedSlotService.getRestrictedTypesFromSlots(slots);
    };

    $scope.getRestrictedTypesString = function( slots ) {
        var restrictedTypes = $scope.getRestrictedTypes(slots);

        return restrictedTypes.join(', ');
    };

    $scope.getSlotClasses = function( slot, isLast ) {
        return {
            'sold-out': slot.statusCode === 'SO',
            'incentive': slot.incentivized,
            'premium': slot.premium,
            'unavailable': slot.statusCode === 'U',
            'value': slot.statusCode === 'V',
            'holiday': slot.statusCode === 'H',
            'closed': slot.statusCode === 'C',
            'weather': slot.statusCode === 'W',
            'unattended': slot.unattended,
            'has-message': $scope.hasMessage(slot),
            'restricted-items-shown': $scope.activeRestrictedSlot === slot.id,
            'has-restrictions': $scope.isSlotRestricted(slot),
            'omega': isLast
        };
    };

    $scope.hasMessage = function(slot) {
        return slot.statusCode === 'SO' ||
                slot.incentivized ||
                slot.premium ||
                slot.statusCode === 'H' ||
                slot.unattended;
    };


    if( activeStep === 1 ) {

        var payload = {
            selected: true,
            delivAvail: true,
            pupAvail: true,
            headers: true
        };

        $scope.enableStepAnimations = false;
        $scope.headerCallMade = true;

        handleSlotsServiceCall(payload);

        setTimeout( function() {
            $scope.enableStepAnimations = true;
        }, 0);
    }

}]);;
// Source: src/main/js/app/components/slots/directives/slot-directives.js
angular.module('SlotDirectives', ['SlotServices'])

/**
 * @ngdoc directive
 * @name slot.directive:slotInformation
 *
 * @description Will insert the currently selected slot id into the scope of this directive
 */
.directive('slotInformation', [ 'SlotInformationService', function(SlotInformationService) {

    return {
        restrict: "AE",
        replace: false,
        link: function( scope ) {
            scope.$watch( function() {
                return SlotInformationService.selectedSlotId;
            }, function( selectedSlotId ) {
                scope.selectedSlotId = selectedSlotId;
                if( selectedSlotId !== 0 ) {
                    scope.selectedSlot = SlotInformationService.selectedSlot;
                }
            });
        }
    };
}]);;
// Source: src/main/js/app/components/slots/factories/slot-factories.js
angular.module('SlotFactories', [ 'ngResource' ] )

/**
 * @ngdoc service
 * @name slot.factory:SlotReservationFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
<pre>
$resource('/api/v2.0/user/slots', {}, {
    'reserveSlot': {
        method: 'POST',
        isArray: false,
        params: {
            slotId: '@slotId',
            serviceType: '@serviceType' // 'P' || 'D'
        }
    }
});
</pre>
*/
.factory('SlotReservationFactory', [ '$http', '$q', '$resource', function( $http, $q, $resource ) {
    return $resource('/api/v2.0/user/slots', {}, {
        'reserveSlot': {
            method: 'POST',
            isArray: false,
            params: {
                slotId: '@slotId',
                serviceType: '@serviceType' // 'P' || 'D'
            }
        }
    });
}])

/**
 * @ngdoc service
 * @name slot.factory:SlotRetrievalFactory
 *
 * @requires $http
 * @requires $q
 * @requires $resource
 *
 @property {$resource} $resource
 This factory returns the following resource:
<pre>
$resource('/api/v2.0/user/slots', {}, {
    'retrieveSlots': {
        method: 'GET',
        isArray: false,
        params: {
            viewDate: '@viewDate',
            serviceType: '@serviceType',
            headers: '@headers',
            selected: '@selected',
            delivAvail: '@delivAvail',
            pupAvail: '@pupAvail'
        }
    }
});
</pre>
*/
.factory('SlotRetrievalFactory', [ '$http', '$q', '$resource', function( $http, $q, $resource ) {
    return $resource('/api/v2.0/user/slots', {}, {
        'retrieveSlots': {
            method: 'GET',
            isArray: false,
            params: {
                viewDate: '@viewDate',
                serviceType: '@serviceType',
                headers: '@headers',
                selected: '@selected',
                delivAvail: '@delivAvail',
                pupAvail: '@pupAvail'
            }
        }
    });
}]);
;
// Source: src/main/js/app/components/slots/services/slot-services.js
angular.module('SlotServices', ['SlotFactories'])

/**
 * @ngdoc object
 * @name slot.object:RestrictionTypes
 *
 * @description A hash of restricted product code to descriptive name
 *
<pre>
{
    'L': 'Alcohol',
    'T': 'Tobacco',
    'H': 'Prescription',
    'G': 'Diner Items',
    'V': 'Cough Medicines',
    'C': 'Certain Medicines',
    'S': 'Sample'
}
</pre>
 */
.constant('RESTRICTED_PRODUCT_TYPES', {
    'L': 'Alcohol',
    'T': 'Tobacco',
    'H': 'Prescription',
    'G': 'Diner Items',
    'V': 'Cough Medicines',
    'C': 'Certain Medicines',
    'S': 'Sample'
})

/**
 * @ngdoc service
 * @name slot.service:SlotInformationService
 *
 * @description Handles caching of the currently selectedSlotId,selectedSlot object, deliveryAvailable and pupAvailable
 *
 * @property {function} getCurrentSlotInformation() retrieves a hash of the currently cached properties
 * @proeprty {function} destroy() Resets the cached properties
 */
.service('SlotInformationService', [ function() {

    var service = this;

    service.selectedSlotId = null;
    service.selectedSlot = null;
    service.deliveryAvailable = null;
    service.pupAvailable = null;

    service.getCurrentSlotInformation = function() {
        if( service.selectedSlot === null && service.selectedSlotId === null && service.deliveryAvailable === null && service.pupAvailable === null ) {
            return null;
        }

        return {
            selectedSlot: service.selectedSlot,
            selectedSlotId: service.selectedSlotId,
            deliveryAvailable: service.deliveryAvailable,
            pupAvailable: service.pupAvailable
        };
    };

    service.destroy = function() {
        service.selectedSlot = null;
        service.selectedSlotId = null;
        service.deliveryAvailable = null;
        service.pupAvailable = null;
    };

}])

/**
 * @ngdoc service
 * @name slot.service:RestrictedSlotService
 *
 * @description This method handles relevant restricted slot functionalities
 *
 * @property {function} getProductIdsFromRestrictedSlot(slot) Given a slot it will retrieve and merge the product ids in the slot
 * @property {function} aggregateRestrictedItems(slot) Aggregates product ids in a restricted slot
 * @property {function} getRestrictedTypesFromSlots(slots) Iterates over the slots and finds the union of all error codes present in the given slots
 * @property {function} lookupRestrictionTypeString(type) Looks up the the corresponding message for a slot restriction in the constant object at {@link slot.object:RestrictionTypes}
 */
.service('RestrictedSlotService', [ '$q', '$log', 'SlotRetrievalService', 'CartStatusMessageService', 'CartManagementService', 'CartResourceFactory', 'RESTRICTED_PRODUCT_TYPES', function( $q, $log, SlotRetrievalService, CartStatusMessageService, CartManagementService, CartResourceFactory, restrictedProductTypes ) {

    var service = this;

    service.getProductIdsFromRestrictedSlot = function( slot ) {

        var productIds = [];

        if( angular.isDefined( slot.restrict ) ) {
            for( var key in slot.restrict ) {
                var restrictedProductsGroup = slot.restrict[key];

                for( var i = 0; i < restrictedProductsGroup.length; i++ ) {
                    var prodId = restrictedProductsGroup[i].prodId;

                    if( productIds.indexOf(prodId) >= 0 === false ) {
                        productIds.push(prodId);
                    }
                }
            }
        }

        return productIds;
    };

    service.aggregateRestrictedItems = function( slot ) {

        var products = [];

        if( angular.isDefined( slot.restrict ) ) {
            for( var key in slot.restrict ) {
                var restrictedProductsGroup = slot.restrict[key];

                products.push.apply(products,restrictedProductsGroup);
            }
        }

        return products;
    };

    service.getRestrictedTypesFromSlots = function( slots ) {
        var restrictedTypes = [];

        for( var i = 0; i < slots.length; i++ ) {
            var slot = slots[i];

            for( var type in slot.restrict ) {
                var typeString = service.lookupRestrictionTypeString(type);

                if( restrictedTypes.indexOf( typeString ) < 0 ) {
                    restrictedTypes.push(typeString);
                }
            }
        }

        return restrictedTypes;
    };

    service.lookupRestrictionTypeString = function( type ) {
        var typeString = restrictedProductTypes[type];

        // Login for sample 0-9
        if( angular.isDefined( typeString ) === false ) {
            var typeNumber = parseInt(type, 10);

            if( isNaN(typeNumber) === false && typeNumber >= 0 && typeNumber <= 9 ) {
                typeString = restrictedProductTypes['S'];
            }
        }

        return typeString;
    };

    service.removeProductIdsFromCart = function( slot, productIds ) {

        var deferred = $q.defer();
        var promise = deferred.promise;

        var payload = {
            slotId: slot.id || 0,
            serviceType: SlotRetrievalService.serviceType
        };

        var $promise = CartResourceFactory.delete({ productId: productIds }).$promise;
        $promise
            .then(function( results ) {
                CartStatusMessageService.populateStatusMessagesFromResponse( results );
                return CartManagementService.queryResults();
            })
            .catch(function( results ) {
                CartStatusMessageService.populateStatusMessagesFromResponse( results.data );
            })
            .then(function( results ) {
                if( angular.isDefined( results.response ) && angular.isDefined( results.response.items ) ) {
                    CartManagementService.setStoredCartData( results.response );
                }
                payload = {
                    selected: true,
                    delivAvail: true,
                    pupAvail: true,
                    headers: true,
                    viewDate: SlotRetrievalService.viewDate
                };

                return SlotRetrievalService.retrieveSlotsPromise(payload);
            })
            .catch( function( error ) {
                deferred.reject(error);
            })
            .then( function( responseData ) {
                deferred.resolve(responseData);
            })
            .catch( function( error ) {
                deferred.reject(error);
            });

        return promise;
    };

}])

/**
 * @ngdoc service
 * @name slot.service:SlotReservationService
 *
 * @description A service to be used to reserve a slot
 *
 * @property {function} reserveTimeSlot(slot) Creates a promise chain to first reserve a slot and then to refresh slot information
 */
.service('SlotReservationService', [ '$q', '$log', 'SlotReservationFactory', 'SlotRetrievalService', function( $q, $log, SlotReservationFactory, SlotRetrievalService ) {

    var service = this;

    service.reserveTimeSlot = function( slot ) {
        var deferred = $q.defer();
        var promise = deferred.promise;

        var payload = {
            slotId: slot.id || 0,
            serviceType: SlotRetrievalService.serviceType
        };

        SlotReservationFactory.reserveSlot(payload).$promise
            .then( function( responseData ) {
                if( responseData.response.code !== 'SLOTS_RESERVE_SUCCESS' ) {
                    deferred.reject(responseData);
                } else {
                    console.log(responseData);
                    payload = {
                        selected: true,
                        delivAvail: true,
                        pupAvail: true,
                        headers: true,
                        viewDate: SlotRetrievalService.viewDate
                    };

                    return SlotRetrievalService.retrieveSlotsPromise(payload);
                }
            }) .catch( function( error ) {
                deferred.reject(error);
            })
            .then( function( responseData ) {
                deferred.resolve(responseData);
            })
            .catch( function( error ) {
                deferred.reject(error);
            });

        return promise;
    };

}])

/**
 * @ngdoc service
 * @name slot.service:SlotRetrievalService
 *
 * @description A service to retrieve slot information
 *
 * @property {string} serviceType A cache for the current type of either 'D' or 'P'
 * @property {string} viewDate A string representing the currently selected viewDate
 * @property {function} retrieveSlotsInformationPromise(payload) Returns the promise for retrieval of slot information for a given payload
 * @property {function} retrieveSlotsPromise(payload) Retrieves a conditional promise chain for retrieving a set of slots. If no viewDate is passed it will
 * select the first available day unless the user has a selected slot then it will select the viewDate of the selectedSlot
 */
.service('SlotRetrievalService', [ '$q', '$log', 'SlotRetrievalFactory', function( $q, $log, SlotRetrievalFactory ) {

    var service = this;

    service.serviceType = 'D';
    service.viewDate = '';

    service.retrieveSlotsInformationPromise = function( payload ) {
        return SlotRetrievalFactory.retrieveSlots( payload).$promise;
    };

    service.retrieveSlotsPromise = function( payload ) {

        payload.serviceType = service.serviceType;

        if( angular.isDefined(payload.viewDate) && payload.viewDate !== '' ) {
            service.viewDate = payload.viewDate;
            return service.retrieveSlotsInformationPromise(payload);
        }

        var deferred = $q.defer();
        var promise = deferred.promise;

        // If no view date is specified parse response to find first available day
        service.retrieveSlotsInformationPromise(payload)
            .then( function(responseData) {
                var headers = responseData.response.headers,
                    selectedSlotId = responseData.response.selectedSlotId,
                    selectedSlot = responseData.response.selectedSlot;

                if( selectedSlotId !== 0 && selectedSlot.serviceType === service.serviceType ) {
                    var viewDate = selectedSlot.date;
                    payload.viewDate = viewDate;
                    return service.retrieveSlotsInformationPromise(payload);
                }

                for( var headerIndex in headers ) {
                    var header = headers[headerIndex];

                    if( header.statusCode !== "U" && header.statusCode !== "H" && header.statusCode !== "C" ) {
                        payload.viewDate = header.date;
                        service.viewDate = payload.viewDate;
                        return service.retrieveSlotsInformationPromise(payload);
                    }
                }

                // If no available days are found just resolve the current dataset
                deferred.resolve(responseData);
            })
            .catch( function( error ) {
                $log.error("Error retrieving slot data " + error );
                deferred.reject(error);
            })
            .then( function( responseData ) {
                deferred.resolve(responseData);
            })
            .catch( function( error ) {
                $log.error("Error retrieving slot data " + error );
                deferred.reject(error);
            });

        return promise;
    };

}]);;
// Source: src/main/js/app/components/slots/slots-include.js
angular.module('slots', [ 'SlotsControllers', 'SlotDirectives' ])

.run([ '$log', 'SlotInformationService', 'SlotRetrievalService', function( $log, SlotInformationService, SlotRetrievalService ) {
    var initialPayload = {
        selected: true,
        delivAvail: true,
        pupAvail: true
    };
    SlotRetrievalService.retrieveSlotsInformationPromise( initialPayload)
    .then( function( responseData ) {
        var deliveryAvailable = responseData.response.delivAvail || false,
            pupAvailable = responseData.response.pupAvail || false,
            selectedSlot = responseData.response.selectedSlot || {},
            selectedSlotId = responseData.response.selectedSlotId || 0,
            serviceType = responseData.response.serviceType;

        SlotInformationService.selectedSlot = selectedSlot;
        SlotInformationService.deliveryAvailable = deliveryAvailable;
        SlotInformationService.pupAvailable = pupAvailable;
        SlotInformationService.selectedSlotId = selectedSlotId;

        SlotRetrievalService.serviceType = serviceType;
    })
    .catch( function( error ) {
        $log.error("Error loading slots modal: " + error);
    });
}]);;
// Source: src/main/js/app/components/tabs/tabs-directive.js
angular.module('tabs', [])
/**
 * @ngdoc overview
 * @name ui.bootstrap.tabs
 *
 * @description
 * AngularJS version of the tabs directive.
 */

.controller('TabsetController', ['$scope', function TabsetCtrl($scope) {
    var ctrl = this,
        tabs = ctrl.tabs = $scope.tabs = [];

    ctrl.select = function(tab) {

        angular.forEach(tabs, function(tab) {
            tab.active = false;
        });
        tab.active = true;
    };

    ctrl.addTab = function addTab(tab) {
        tabs.push(tab);

        if (tabs.length === 1 || tab.active) {
            ctrl.select(tab);
        }
    };

    ctrl.removeTab = function removeTab(tab) {
        var index = tabs.indexOf(tab);
        //Select a new tab if the tab to be removed is selected
        if (tab.active && tabs.length > 1) {
            //If this is the last tab, select the previous tab. else, the next tab.
            var newActiveIndex = index === tabs.length - 1 ? index - 1 : index + 1;
            ctrl.select(tabs[newActiveIndex]);
        }

        tabs.splice(index, 1);
    };
}])
/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tabset
 * @restrict EA
 *
 * @description
 * Tabset is the outer container for the tabs directive
 *
 * @param {boolean=} vertical Whether or not to use vertical styling for the tabs.
 * @param {boolean=} justified Whether or not to use justified styling for the tabs.
 *
 * @example
 <example module="ui.bootstrap">
 <file name="index.html">
 <tabset>
 <tab heading="Tab 1"><b>First</b> Content!</tab>
 <tab heading="Tab 2"><i>Second</i> Content!</tab>
 </tabset>
 <hr />
 <tabset vertical="true">
 <tab heading="Vertical Tab 1"><b>First</b> Vertical Content!</tab>
 <tab heading="Vertical Tab 2"><i>Second</i> Vertical Content!</tab>
 </tabset>
 <tabset justified="true">
 <tab heading="Justified Tab 1"><b>First</b> Justified Content!</tab>
 <tab heading="Justified Tab 2"><i>Second</i> Justified Content!</tab>
 </tabset>
 </file>
 </example>
 */
.directive('tabset', function() {
    return {
        restrict: 'EA',
        transclude: true,
        replace: true,
        scope: {},
        controller: 'TabsetController',
        templateUrl: 'site/templates/tabs/tabset.html',
        link: function(scope, element, attrs) {
            scope.type = angular.isDefined(attrs.type) ? scope.$parent.$eval(attrs.type) : 'tabs';
        }
    };
})
/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tab
 * @restrict EA
 *
 * @param {string=} heading The visible heading, or title, of the tab. Set HTML headings with {@link ui.bootstrap.tabs.directive:tabHeading tabHeading}.
 * @param {string=} select An expression to evaluate when the tab is selected.
 * @param {boolean=} active A binding, telling whether or not this tab is selected.
 * @param {boolean=} disabled A binding, telling whether or not this tab is disabled.
 *
 * @description
 * Creates a tab with a heading and content. Must be placed within a {@link ui.bootstrap.tabs.directive:tabset tabset}.
 *
 * @example
 <example module="ui.bootstrap">
 <file name="index.html">
 <div ng-controller="TabsDemoCtrl">
 <button class="btn btn-small" ng-click="items[0].active = true">
 Select item 1, using active binding
 </button>
 <button class="btn btn-small" ng-click="items[1].disabled = !items[1].disabled">
 Enable/disable item 2, using disabled binding
 </button>
 <br />
 <tabset>
 <tab heading="Tab 1">First Tab</tab>
 <tab select="alertMe()">
 <tab-heading><i class="icon-bell"></i> Alert me!</tab-heading>
 Second Tab, with alert callback and html heading!
 </tab>
 <tab ng-repeat="item in items"
 heading="{{item.title}}"
 disabled="item.disabled"
 active="item.active">
 {{item.content}}
 </tab>
 </tabset>
 </div>
 </file>
 <file name="script.js">
 function TabsDemoCtrl($scope) {
      $scope.items = [
        { title:"Dynamic Title 1", content:"Dynamic Item 0" },
        { title:"Dynamic Title 2", content:"Dynamic Item 1", disabled: true }
      ];

      $scope.alertMe = function() {
        setTimeout(function() {
          alert("You've selected the alert tab!");
        });
      };
    };
 </file>
 </example>
 */

/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tabHeading
 * @restrict EA
 *
 * @description
 * Creates an HTML heading for a {@link ui.bootstrap.tabs.directive:tab tab}. Must be placed as a child of a tab element.
 *
 * @example
 <example module="ui.bootstrap">
 <file name="index.html">
 <tabset>
 <tab>
 <tab-heading><b>HTML</b> in my titles?!</tab-heading>
 And some content, too!
 </tab>
 <tab>
 <tab-heading><i class="icon-heart"></i> Icon heading?!?</tab-heading>
 That's right.
 </tab>
 </tabset>
 </file>
 </example>
 */
.directive('tab', ['$parse', function($parse) {
  return {
    require: '^tabset',
    restrict: 'EA',
    replace: true,
    templateUrl: 'site/templates/tabs/tab.html',
    transclude: true,
    scope: {
        heading: '@',
        onSelect: '&select', //This callback is called in contentHeadingTransclude
                          //once it inserts the tab's content into the dom
        onDeselect: '&deselect'
    },
    controller: function() {
      //Empty controller so other directives can require being 'under' a tab
    },
    compile: function(elm, attrs, transclude) {
        return function postLink(scope, elm, attrs, tabsetCtrl) {
            var getActive, setActive, tabClass;
            if (attrs.active) {
                getActive = $parse(attrs.active);
                setActive = getActive.assign;
                scope.$parent.$watch(getActive, function updateActive(value, oldVal) {
                    // Avoid re-initializing scope.active as it is already initialized
                    // below. (watcher is called async during init with value ===
                    // oldVal)
                    if (value !== oldVal) {
                        scope.active = !!value;
                    }
                });
                scope.active = getActive(scope.$parent);
            } else {
                setActive = getActive = angular.noop;
            }

            if ( attrs.tabClass ) {
                tabClass = attrs.tabClass;
                scope.tabClass = tabClass;
            } else {
                tabClass = '';
            }

            scope.$watch('active', function(active) {
                // Note this watcher also initializes and assigns scope.active to the
                // attrs.active expression.
                setActive(scope.$parent, active);
                if (active) {
                    tabsetCtrl.select(scope);
                    scope.onSelect();
                } else {
                    scope.onDeselect();
                }

            });

            scope.disabled = false;
            if ( attrs.disabled ) {
                scope.$parent.$watch($parse(attrs.disabled), function(value) {
                    scope.disabled = !! value;
                });
            }

            scope.select = function() {
                if ( ! scope.disabled ) {
                    scope.active = true;
                }
            };

            tabsetCtrl.addTab(scope);
            scope.$on('$destroy', function() {
                tabsetCtrl.removeTab(scope);
            });


            //We need to transclude later, once the content container is ready.
            //when this link happens, we're inside a tab heading.
            scope.$transcludeFn = transclude;
        };
    }
  };
}])

.directive('tabHeadingTransclude', [function() {
  return {
    restrict: 'A',
    require: '^tab',
    link: function(scope, elm) {
        scope.$watch('headingElement', function updateHeadingElement(heading) {
            if (heading) {
                elm.html('');
                elm.append(heading);
            }
        });
    }
  };
}])

.directive('tabContentTransclude', function() {
    function isTabHeading(node) {
        return node.tagName &&  (
            node.hasAttribute('tab-heading') ||
            node.hasAttribute('data-tab-heading') ||
            node.tagName.toLowerCase() === 'tab-heading' ||
            node.tagName.toLowerCase() === 'data-tab-heading'
        );
    }
    return {
        restrict: 'A',
        require: '^tabset',
        link: function(scope, elm, attrs) {
            var tab = scope.$eval(attrs.tabContentTransclude);

            //Now our tab is ready to be transcluded: both the tab heading area
            //and the tab content area are loaded.  Transclude 'em both.
            tab.$transcludeFn(tab.$parent, function(contents) {
                angular.forEach(contents, function(node) {
                    if (isTabHeading(node)) {
                        //Let tabHeadingTransclude know.
                        tab.headingElement = node;
                    } else {
                        elm.append(node);
                    }
                });
            });
        }
    };
})

;;
// Source: src/main/js/app/components/transition/transition.js
angular.module('transition', [])

/**
 * @ngdoc service
 * @name transition.service:$transition
 *
 * @description $transition service provides a consistent interface to trigger CSS 3 transitions and to be informed when they complete.
 * @param  {DOMElement} element  The DOMElement that will be animated.
 * @param  {string|object|function} trigger  The thing that will cause the transition to start:
 *   - As a string, it represents the css class to be added to the element.
 *   - As an object, it represents a hash of style attributes to be applied to the element.
 *   - As a function, it represents a function to be called that will cause the transition to occur.
 * @return {Promise}  A promise that is resolved when the transition finishes.
 */
    .factory('$transition', ['$q', '$timeout', '$rootScope', function($q, $timeout, $rootScope) {

        var $transition = function(element, trigger, options) {
            options = options || {};
            var deferred = $q.defer();
            var endEventName = $transition[options.animation ? 'animationEndEventName' : 'transitionEndEventName'];

            var transitionEndHandler = function() {
                $rootScope.$apply(function() {
                    element.unbind(endEventName, transitionEndHandler);
                    deferred.resolve(element);
                });
            };

            if (endEventName) {
                element.bind(endEventName, transitionEndHandler);
            }

            // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
            $timeout(function() {
                if ( angular.isString(trigger) ) {
                    element.addClass(trigger);
                } else if ( angular.isFunction(trigger) ) {
                    trigger(element);
                } else if ( angular.isObject(trigger) ) {
                    element.css(trigger);
                }
                //If browser does not support transitions, instantly resolve
                if ( !endEventName ) {
                    deferred.resolve(element);
                }
            });

            // Add our custom cancel function to the promise that is returned
            // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
            // i.e. it will therefore never raise a transitionEnd event for that transition
            deferred.promise.cancel = function() {
                if ( endEventName ) {
                    element.unbind(endEventName, transitionEndHandler);
                }
                deferred.reject('Transition cancelled');
            };

            return deferred.promise;
        };

        // Work out the name of the transitionEnd event
        var transElement = document.createElement('trans');
        var transitionEndEventNames = {
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'transition': 'transitionend'
        };
        var animationEndEventNames = {
            'WebkitTransition': 'webkitAnimationEnd',
            'MozTransition': 'animationend',
            'OTransition': 'oAnimationEnd',
            'transition': 'animationend'
        };
        function findEndEventName(endEventNames) {
            for (var name in endEventNames){
                if (transElement.style[name] !== undefined) {
                    return endEventNames[name];
                }
            }
        }
        $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
        $transition.animationEndEventName = findEndEventName(animationEndEventNames);
        return $transition;
    }]);;
// Source: src/main/js/app/components/user/controllers/user-forgot-controllers.js
angular.module('ForgotControllers', ['ForgotFactories', 'form' ])

.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/login/forgot/:forgotType?', {
            reloadOnSearch: false,
            templateUrl: 'site/pages/forgot/forgot.html',
            controller: 'ForgotController'
        });
}])
/**
 * @ngdoc controller
 * @name forgot.controller:ForgotController
 *
 * @property {string} forgotType used in the switch block within the template to determine which content the fragment should display
 * @property {string} user object used to store the properties for the user form
 *
 * @property {function} submitSendForgotUsername($event,forgotUsernameForm) method to handle the callback from the form if the user hits enter or 'go' on a mobile device. This method calls sendForgotUsername as a delegate
 * @property {function} sendForgotUsername(user,forgotUsernameForm) sends the forgot username request to the server
 * @property {function} submitSendForgotPassword($event,forgotPasswordForm) method to handle the callback from the form if the user hits enter or 'go' on a mobile device. This method calls sendForgotPassword as a delegate
 * @property {function} sendForgotPassword($event,forgotPasswordForm) sends the forgot password request to the server
 */
.controller('ForgotController', ['$scope', '$routeParams', 'ForgotUsernameFactory', 'ForgotPasswordFactory', 'ForgotUsernameService', 'ForgotPasswordService', 'FormHelperService', function( $scope, $routeParams, ForgotUsernameFactory, ForgotPasswordFactory, ForgotUsernameService, ForgotPasswordService, FormHelperService ) {
    var forgotType = $routeParams.forgotType;

    $scope.forgotType = forgotType;
    $scope.user = {};

    $scope.submitSendForgotUsername = function($event, forgotUsernameForm) {
        $event.preventDefault();
        $scope.sendForgotUsername($scope.user, forgotUsernameForm);
    };

    $scope.sendForgotUsername = function( user, forgotUsernameForm) {
        $scope.formSubmitted = true;

        ForgotUsernameFactory.sendUsernameRequest(user).$promise
            .then(function( response ) {
                $scope.isSuccessful = ForgotUsernameService.handleForgotUsernameSuccess( response );
            })
            .catch(function( response ) {
                FormHelperService.resetFormErrorsForCode(forgotUsernameForm, $scope.code);
                $scope.code = response.data.response.code;
                $scope.errorMessage = response.data.response.msg;
                ForgotUsernameService.handleForgotUsernameError(user, forgotUsernameForm, response);
            })
            ['finally'](function() {
                $scope.$broadcast('ppdLoadingActionFinish', {});
            });
    };

    $scope.submitSendForgotPassword = function($event, forgotPasswordForm) {
        $event.preventDefault();
        $scope.sendForgotPassword($scope.user, forgotPasswordForm );
    };

    $scope.sendForgotPassword = function(user, forgotPasswordForm ) {
        $scope.formSubmitted = true;

        ForgotPasswordFactory.sendPasswordRequest(user).$promise
            .then(function( response ) {
                $scope.isSuccessful = ForgotPasswordService.handleForgotPasswordSuccess( response );
            })
            .catch(function( response ) {
                FormHelperService.resetFormErrorsForCode(forgotPasswordForm, $scope.code);
                $scope.code = response.data.response.code;
                $scope.errorMessage = response.data.response.msg;

                ForgotPasswordService.isGlobalError = false;
                ForgotPasswordService.handleForgotPasswordError(user, forgotPasswordForm, response);
                $scope.isGlobalError = ForgotPasswordService.isGlobalError;
            })
            ['finally'](function() {
                $scope.$broadcast('ppdLoadingActionFinish', {});
            });
    };

    $scope.$on('$destroy', function() {
        ForgotPasswordService.isGlobalError = false;
    });
}])
/**
 * @ngdoc service
 * @name forgot.service:ForgotUsernameService
 *
 * @description This service contains functions to handle various error/success cases for forgot username
 *
 * @property {function} handleForgotUsernameSuccess(response)
 *  <h2>Description:</h2>
 *
 *  <p>this method reads the response from the Peapod rest api and then sends them to the successful forgot page.</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>response</b> - response from forgot username api service</li>
 *  </ul>
 *
 * @property {function} handleForgotUsernameError(user,forgotUsernameForm,response)
 *  <h2>Description:</h2>
 *
 *  <p>this method reads the response from the Peapod rest api and then sends them to the successful forgot page.</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>user</b> - representative object for the data sent to the rest api</li>
 *      <li><b>forgotUsernameForm</b> - the injected form scope object for forgot username
 *      <li><b>response</b> - response from guest login api service</li>
 *  </ul>
 */
.service('ForgotUsernameService', [ '$log', function( $log ) {

    var service = this;

    service.handleForgotUsernameSuccess = function( response ) {
        var code = response.response.code;

        $log.info('ForgotUsername received code: [ ' + code + ' ] with msg: [ ' + response.response.msg + ' ].');

        if( code === 'FORGOT_USERNAME_SUCCESS' ) {
            return true;
        }
        return false;
    };

    service.handleForgotUsernameError = function ( user, forgotUsernameForm, response ) {
        var code = response.data.response.code;

        $log.info('ForgotUsername received code: [ ' + code + ' ] with msg: [ ' + response.data.response.msg + ' ].');

        forgotUsernameForm.email.setCustomValidity(code, false);
    };

}])

/**
 * @ngdoc service
 * @name forgot.service:ForgotPasswordService
 *
 * @description This service contains functions to handle various error/success cases for password
 *
 * @property {function} handleForgotPasswordSuccess(response)
 *  <h2>Description:</h2>
 *
 *  <p>this method reads the response from the Peapod rest api and then sends them to the successful forgot page.</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>response</b> - response from forgot username api service</li>
 *  </ul>
 *
 * @property {function} handleForgotPasswordError(user,forgotPasswordForm,response)
 *  <h2>Description:</h2>
 *
 *  <p>this method reads the response from the Peapod rest api and then sends them to the successful forgot page.</p>
 *
 *  <h2>Parameters:</h2>
 *  <ul>
 *      <li><b>user</b> - representative object for the data sent to the rest api</li>
 *      <li><b>forgotUsernameForm</b> - the injected form scope object for forgot password
 *      <li><b>response</b> - response from guest login api service</li>
 *  </ul>
 */
.service('ForgotPasswordService', ['$log', function( $log ) {

    var service = this;

    service.isGlobalError = false;

    service.handleForgotPasswordSuccess = function( response ) {
        var code = response.response.code;

        $log.info('ForgotUsername received code: [ ' + code + ' ] with msg: [ ' + response.response.msg + ' ].');

        if( code === 'FORGOT_PASSWORD_SUCCESS' ) {
            return true;
        }
        return false;
    };

    service.handleForgotPasswordError = function( user, forgotPasswordForm, response ) {
        var code = response.data.response.code;

        $log.info('ForgotPassword received code: [ ' + code + ' ] with msg: [ ' + response.data.response.msg + ' ].');

        if( code === 'FORGOT_PASSWORD_USERNAME_NOT_FOUND' ) {
            forgotPasswordForm.username.setCustomValidity(code, false);
        } else if (code === 'FORGOT_PASSWORD_EMAIL_NO_MATCH') {
            forgotPasswordForm.email.setCustomValidity(code, false);
        } else {
            forgotPasswordForm.setCustomValidity(code, false);
            service.isGlobalError = true;
        }
    };
}]);

;
// Source: src/main/js/app/components/user/controllers/user-preference-controllers.js
;
// Source: src/main/js/app/components/user/controllers/user-reset-password-controllers.js
angular.module('ResetPasswordControllers', ['ResetPasswordFactories', 'form' ])

.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/reset-password/', {
            controller: 'ResetPasswordController',

            templateUrl: 'site/pages/reset/password-reset.html',

            resolve: {
                validationResponse: ['$location', 'ResetPasswordTokenValidationFactory', function($location, ResetPasswordTokenValidationFactory) {
                    var token = $location.search().token;
                    return ResetPasswordTokenValidationFactory.validate({ token: token }).$promise;
                }],
                token: [ '$location', function( $location ) {
                    var token = $location.search().token;
                    return token;
                }]
            }
        });
}])

.controller('ResetPasswordController', ['$scope', 'token', 'validationResponse', 'ResetPasswordService', 'FormHelperService', 'ResetPasswordFactory', function($scope, token, validationResult, ResetPasswordService, FormHelperService, ResetPasswordFactory ) {
    var tokenValidationObject = validationResult.response;

    $scope.passwordObject = {
        token: token
    };
    $scope.tokenValidation = tokenValidationObject;

    $scope.submitResetPassword = function($event, passwordResetForm) {
        $event.preventDefault();
        $scope.resetPassword($scope.passwordObject, passwordResetForm);
    };

    $scope.resetPassword = function( passwordObject, passwordResetForm) {
        $scope.formSubmitted = true;
        ResetPasswordFactory.send(passwordObject).$promise
            .then(function(responseData) {
                $scope.isSuccessful = ResetPasswordService.handleResetPasswordSuccess(responseData);
            })
            .catch(function(errorData) {
                FormHelperService.resetFormErrorsForCode(passwordResetForm, $scope.code);
                $scope.code = errorData.data.response.code;
                $scope.errorMessage = errorData.data.response.msg;
                ResetPasswordService.handleResetPasswordError(errorData, passwordResetForm);
                $scope.isGlobalError = ResetPasswordService.isGlobalError;
            })
            ['finally'](function() {
                $scope.$broadcast('ppdLoadingActionFinish', {});
            });
    };

    $scope.$on('$destroy', function() {
        ResetPasswordService.isGlobalError = false;
    });
}])

.service('ResetPasswordService', [ '$log', function($log) {
    var service = this;

    service.handleResetPasswordSuccess = function( responseData ) {

        var code = responseData.response.code;
        $log.info('ResetPassword received code: [ ' + code + ' ] with msg: [ ' + responseData.response.msg + ' ].');

        if( code === 'RESET_PASSWORD_SUCCESS' ) {
            return true;
        }

        return false;
    };

    service.handleResetPasswordError = function( errorData, passwordForm ) {

        var code = errorData.data.response.code;

        $log.info('ResetPassword received code: [ ' + code + ' ] with msg: [ ' + errorData.data.response.msg + ' ].');

        service.isGlobalError = false;

        if( code === 'RESET_PASSWORD_MISMATCH' ) {
            passwordForm.confirmPassword.setCustomValidity(code,false);
        } else if ( code === 'RESET_PASSWORD_USER_PW_MATCH' ) {
            passwordForm.password.setCustomValidity(code,false);
        } else {
            service.isGlobalError = true;
            passwordForm.setCustomValidity(code,false);
        }
    };

}]);
;
// Source: src/main/js/app/components/user/directives/user-preference-directives.js
angular.module('UserPreferenceDirectives', ['UserPreferenceServices'])

/**
 * @ngdoc directive
 * @name userPreference.directive:userPreference
 *
 * @description This directive injects update and retrieval operations for user preferences
 *
 * @param {string} preferenceKey The name of the preference that this directive instance will control
 *
 * @property {object} currentPreference the object in the scope representing the current value of the preference
 * @property {function} updatePreference(newPreference) a function to update the preference value for this preference
 */
.directive('userPreference', [ 'UserPreferenceService', '$log', function( UserPreferenceService, $log ) {
    return {
        restrict: 'AE',
        controller: [ '$scope', function( $scope ) {
            $scope.$watch( 'preferenceKey', function( preferenceKey ) {
                $scope.currentPreference = UserPreferenceService.getPreference( preferenceKey );
            });

// FIXME: This causes a digest loop
//            $scope.$watch( function() {
//                return UserPreferenceService.getPreference( $scope.preferenceKey );
//            }, function( newValue ) {
//                $scope.currentPreference = newValue;
//            });

            $scope.updatePreference = function( newPreferenceValue ) {
                UserPreferenceService.updatePreference( $scope.preferenceKey, newPreferenceValue )
                    .then( function( responseData ) {
                        UserPreferenceService.saveResponseDataToCache( responseData );
                        $scope.currentPreference = UserPreferenceService.getPreference( $scope.preferenceKey );
                        $scope.$broadcast('ppdLoadingActionFinish', {});
                    })
                    .catch( function( error ) {
                        $log.error('Error for retrieval of preference: [' + $scope.preferenceKey + '] message: ' + error.message );
                    });
            };
        }],
        compile: function( element, attributes ) {
            element.addClass('user-preference-management');
            return function( scope ) {
                scope.preferenceKey = attributes.userPreference || null;
            };
        }
    };
}]);;
// Source: src/main/js/app/components/user/factories/user-forgot-factories.js
angular.module('ForgotFactories', ['ngResource'])
    .factory('ForgotPasswordFactory', ['$http', '$q', '$resource', function( $http, $q, $resource) {
        return $resource('/api/v2.0/user/password', {}, {
            'sendPasswordRequest': {
                method: 'GET',
                isArray: false,
                params: {
                    email: '@email',
                    username: '@username'
                }
            }
        });    
    }])
    .factory('ForgotUsernameFactory', ['$http', '$q', '$resource', function( $http, $q, $resource) {
        return $resource('/api/v2.0/user/username', {}, {
            'sendUsernameRequest': {
                method: 'GET',
                isArray: false,
                params: {
                    email: '@email'
                }
            }
        });    
}]);;
// Source: src/main/js/app/components/user/factories/user-preference-factories.js
angular.module('UserPreferenceFactories', [ 'ngResource' ])
/**
 * @ngdoc object
 * @name userPreference.object:UserPreferenceKeys
 *
 * @description The current stored object
<pre>
 {
     'PREFERRED_PUP': 'preferred-pup',
     'PRODUCT_SUBSTITUTION': 'product-substitution',
     'EMAIL_CONFIRMATION': 'email-confirmation',
     'PAYMENT_METHOD': 'payment-method'
 }
</pre>
 */
.constant( 'USER_PREFERENCE_KEYS', {
    'PREFERRED_PUP': 'preferred-pup',
    'PRODUCT_SUBSTITUTION': 'product-substitution',
    'EMAIL_CONFIRMATION': 'email-confirmation',
    'PAYMENT_METHOD': 'payment-method'
})

/**
 * @ngdoc service
 * @name userPreference.service:UserPreferenceFactory
 *
 * @description This returns the following resource:
<pre>
$resource('/api/v2.0/user/preferences/:preferenceName', {}, {
    'get': {
        method: 'GET',
        isArray: false,
        params: {
            preferenceName: '@preferenceName'
        }
    },
    'update': {
        method: 'POST',
        isArray: false,
        params: {
            value: '@value',
            preferenceName: '@preferenceName'
        }
    },
    'delete': {
        method: 'DELETE',
        isArray: false,
        params: {
            preferenceName: '@preferenceName'
        }
    }
});
</pre>
 */
.factory( 'UserPreferenceFactory', [ '$http', '$q', '$resource', function( $http, $q, $resource ) {
    return $resource('/api/v2.0/user/preferences/:preferenceName', {}, {
        'get': {
            method: 'GET',
            isArray: false,
            params: {
                preferenceName: '@preferenceName'
            }
        },
        'update': {
            method: 'POST',
            isArray: false,
            params: {
                value: '@value',
                preferenceName: '@preferenceName'
            }
        },
        'delete': {
            method: 'DELETE',
            isArray: false,
            params: {
                preferenceName: '@preferenceName'
            }
        }
    });
}]);;
// Source: src/main/js/app/components/user/factories/user-reset-password-factories.js
angular.module('ResetPasswordFactories', ['ngResource'])

.factory('ResetPasswordTokenValidationFactory', ['$http', '$q', '$resource', function($http, $q, $resource){
    return $resource('/api/v2.0/user/password/validate', {}, {
        'validate': {
            method: 'GET',
            isArray: false,
            params: {
                token: '@token'
            }
        }
    });
}])

.factory('ResetPasswordFactory', ['$http', '$q', '$resource', function($http, $q, $resource){
     return $resource('/api/v2.0/user/password', {}, {
        'send': {
            method: 'POST',
            isArray: false,
            params: {
                token: '@token',
                password: '@password',
                confirm: '@confirmPassword'
            }
        }
    });
}]);;
// Source: src/main/js/app/components/user/forgot-include.js
angular.module('forgot', [ 'ForgotControllers', 'ResetPasswordControllers', 'collapse' ]);
;
// Source: src/main/js/app/components/user/services/user-preference-services.js
angular.module('UserPreferenceServices', ['UserPreferenceFactories'])

/**
 * @ngdoc service
 * @name userPreference.service:UserPreferenceService
 *
 * @description This service contains common CRUD operations for user preferences using {@link userPreference.service:UserPreferenceFactory}
 *
 * @property {function} updatePreference(preferenceName,newValue) promise chain to update and get the new value for a given preference
 * @property {function} saveResponseDataToCache(responseData) given a response data from the user preference api it will retrieve the preference value and save it to the stored cache
 * @property {function} getPreference(preferenceName) given a preference name it will retrieve the stored cache if it exists in the cache, else it will retrieve an empty hash
 * @property {function} hasPreference(preferenceName) given a preference name it will check if the key exists in the cache.
 * @property {function} populateCache() will populate a cache from the ReST apis given the hash of preference names in {@link userPreference.object:UserPreferenceKeys}
 */
.service('UserPreferenceService', [ '$q', '$log', 'UserPreferenceFactory', 'USER_PREFERENCE_KEYS', function( $q, $log, UserPreferenceFactory, UserPreferenceKeys ) {

    var service = this;

    var preferenceCache = {};

    service.updatePreference = function( preferenceName, newValue ) {

        var deferred = $q.defer();
        var promise = deferred.promise;

        UserPreferenceFactory.update({
            preferenceName: preferenceName,
            value: newValue
        }).$promise
            .then( function( responseData ) {
                if( responseData.response.result === 'SUCCESS' ) {
                    return UserPreferenceFactory.get({ preferenceName: preferenceName }).$promise;
                } else {
                    deferred.reject('Update preferred returned code: ' + responseData.response.result );
                }
            }).catch( function( error ) {
                deferred.reject( error);
            })
            .then( function( responseData ) {
                deferred.resolve( responseData );
            })
            .catch( function( error ) {
                deferred.reject(error);
            });

        return promise;
    };

    service.saveResponseDataToCache = function( responseData ) {
        if( angular.isDefined( responseData.response ) && angular.isDefined(responseData.response.preference ) ) {
            var data = responseData.response.preference;
            var name = data.name;
            var value = data.value;
            preferenceCache[name] = value;
        }
    };

    service.retrievePreferenceAndSaveToCache = function( preferenceName ) {
        UserPreferenceFactory.get({ preferenceName: preferenceName }).$promise
            .then( service.saveResponseDataToCache )
            .catch( function( error ) {
                $log.error('Error for retrieval of preference: [' + preferenceName + '] message: ' + error.data.response.msg);
            });
    };

    service.getPreference = function( preferenceName ) {
        if( angular.isDefined(preferenceCache[preferenceName]) ) {
            return preferenceCache[preferenceName];
        }

        return {};
    };

    service.hasPreference = function( preferenceName ) {
        if( angular.equals(service.getPreference( preferenceName ), {} ) === false ) {
            return true;
        }

        return false;
    };

    service.popuplateCache = function() {

        var promises = [];
        for( var cacheKey in UserPreferenceKeys ) {
            var userPreferenceKey = UserPreferenceKeys[cacheKey];
            promises.push( UserPreferenceFactory.get({ preferenceName: userPreferenceKey }).$promise );
        }

        $q.all(promises)
            .then(function(responseDataCollection) {

                for( var i = 0; i < responseDataCollection.length; i++) {
                    var responseData = responseDataCollection[i];

                    service.saveResponseDataToCache( responseData );

                }
            })
            .catch(function(responseDataError) {
                $log.error( "Error populating the preference cache " + responseDataError );
            });
    };
}]);

;
// Source: src/main/js/app/components/user/user-preference-include.js
angular.module('userPreferences', ['UserPreferenceDirectives'])
/**
 * @ngdoc overview
 * @name userPreference
 *
 * @description A module containing functionality for CRUD operations on user preferences.  At injection of this module it will populate the cache of the user's current preferences
 */
.run([ 'UserPreferenceService', function( UserPreferenceService ) {
    UserPreferenceService.popuplateCache();
}]);;
// Source: src/main/js/app/components/view-helper/controllers/view-controller.js
angular.module('viewHelper', [ 'Properties', 'auth' ])

    .constant('SUB_HEADER_URL', 'subHeaderUrl')

    .controller('viewHelperController', ['$animate', '$scope', '$rootScope', '$window', '$location', 'SharedProperties', function ($animate, $scope, $rootScope, $window, $location, SharedProperties ) {
        $scope.subHeader = '';
        $scope.activeView = '';

        $scope.$watch(function () {
            return SharedProperties.getSharedProperties();
        }, function (newProperties) {
            $scope.$broadcast('propertiesUpdated', newProperties);
        }, true);

        $scope.$on('$routeChangeSuccess', function() {
            $scope.subHeader = '';
            $scope.applyAnimations = false;
            $scope.$broadcast( 'ppdLoadingActionFinish', {} );
            $scope.openNamedView('');
        });

        $scope.$on('triggerLoadingFinish', function() {
            $scope.$broadcast( 'ppdLoadingActionFinish', {} );
        });

        $scope.$on('loadSubHeader', function(event, mass) {
            $scope.subHeader = mass;
        });

        $scope.$on('loadDataToViewScope', function(event, mass) {

            if( ! angular.isDefined( mass ) ) {
                return;
            }

            if( angular.isDefined( mass.key ) && angular.isDefined( mass.data ) ) {
                $scope[mass.key] = mass.data;
            }
        });

        function openNamedView(viewName, modalName, subViewId) {

            var mass = {
                key: 'activeView',
                data: viewName
            };

            $scope.activeNamedModal = modalName;
            $scope.activeView = viewName;
            $scope.$emit('loadDataToViewScope', mass);
            $scope.activeSubView = subViewId;
            
            var payload = {
                viewName: viewName,
                modalName: modalName,
                subViewId: subViewId
            };

            $scope.$broadcast( 'viewChanged', payload );
        }

        $scope.openNamedView = function( viewName, subViewId ) {
            openNamedView(viewName, '', subViewId);
        };

        $scope.openNamedView = function( viewName ) {
            openNamedView(viewName, '', 0);
        };

        $scope.openRootView = function() {
            openNamedView('', '', 0);
        };

        $scope.openNamedModalView = function( viewName, modalName, subViewId ) {
            openNamedView(viewName, modalName, subViewId);
        };

        $scope.openNamedModalView = function( viewName, modalName ) {
            openNamedView(viewName, modalName, 0);
        };

        $scope.setActiveSubView = function( activeSubView ) {
            $scope.activeSubView = activeSubView;
        };

        $scope.back = function() {
            $window.history.back();
        };

        $scope.go = function(path){
            $location.url(path);
        };

        $scope.fireSearchLoaded = function() {
            $scope.$broadcast('searchLoaded');
        };

        $rootScope.$on('$locationChangeSuccess', function() {
            $rootScope.actualLocation = $location.path();
        });        

        $rootScope.$watch(function () {
            return $location.path();
        }, function (newLocation) {
            if($rootScope.actualLocation === newLocation) {
                $scope.isBack = true;
                $scope.isForward = false;
            } else {
                $scope.isForward = true;
                $scope.isBack = false;
            }
        });
    }])

    .filter('capitalize', function() {
        return function( input ) {
            if( angular.isDefined(input) && input !== null && input !== '' ) {
                input = input.toLowerCase();
                return input.substring(0,1).toUpperCase() + input.substring(1);
            }
        };
    });;
// Source: src/main/js/app/components/view-helper/directives/view-directives.js
angular.module('viewDirectives', [])
    
    .constant('MOBILE_CLASS', 'mobile')
    .constant('TABLET_CLASS', 'tablet')
    .constant('TABLET_MINI_CLASS', 'mini-tablet')
    .constant('DESKTOP_CLASS', 'desktop')
/**
 * @ngdoc directive
 * @name view.directive:watchWidth
 *
 * @description This directive watches the value of screenType and tabletType and adds and removes classes to change specific styling.  The screenType and tabletType
 * scope properties comes from {@link view.directive:watchWidth-2}
 */
    .directive( 'watchWidth', [function(){
        return {
            restrict: 'A',
            link: function( scope, elem ){

                scope.$watch( 'screenType', function( newType, oldType ){
                    elem.removeClass( oldType );
                    elem.addClass( newType );
                } );

                scope.$watch( 'tabletType', function( newType, oldType ){
                    elem.removeClass( oldType );
                    elem.addClass( newType );
                } );
            }
        };
    }] )
/**
 * @ngdoc directive
 * @name view.directive:watchWidth-2
 *
 * @description Response to the window's resize event and then calculates the new width and sets a scope property to broadcast the current screen type
 */
    .directive( 'watchWidth', [ '$window', 'MOBILE_CLASS', 'TABLET_CLASS', 'TABLET_MINI_CLASS', 'DESKTOP_CLASS', function( $window, MOBILE_CLASS, TABLET_CLASS, TABLET_MINI_CLASS, DESKTOP_CLASS ) {

        return {
            restrict: 'A',
            link: function(scope){
                var mobileClass = MOBILE_CLASS,
                    tabletClass = TABLET_CLASS,
                    tabletMiniClass = TABLET_MINI_CLASS,
                    desktopClass = DESKTOP_CLASS;
                
                var initialState = false;

                // TODO: Desktop media query
                var handleScreenSizeUpdate = function() {
                    var mobileMediaQuery = window.matchMedia( "(max-width: 680px)" );
                    var tabletMediaQuery = window.matchMedia( "(max-width: 1024px)" );

                    var tabletMiniMediaQuery = window.matchMedia( "(max-width: 870px)" );

                    if( mobileMediaQuery.matches) {
                        scope.screenType = mobileClass;
                    } else if (tabletMediaQuery.matches ) {
                        scope.screenType = tabletClass;
                    } else {
                        scope.screenType = desktopClass;
                    }

                    if( tabletMiniMediaQuery.matches) {
                        scope.tabletType = tabletMiniClass;
                    } else {
                        scope.tabletType = '';
                    }

                    scope.width = $window.innerWidth;

                    initialState && scope.$apply();
                    initialState = true;
                };

                angular.element($window).bind("resize", handleScreenSizeUpdate);
                handleScreenSizeUpdate();
            }
        };
    } ] )

    .directive('ppdAnimateOnChange', [ '$animate', function($animate) {
        return {
                transclude: true,
                template: '<span ng-transclude></span>',
                link: function( scope, elem, attrs) {
                    scope.$watch(attrs.ppdAnimateOnChange, function(newValue,oldValue ) {
                        if ( ! angular.equals(newValue, oldValue) ) {
                            var clone = elem.clone();
                            elem.after(clone);
                            $animate.leave(clone);
                            $animate.enter(elem, elem.parent(), clone);
                        }
                    });
                }
            };
    }]);;
// Source: src/main/js/app/components/view-helper/directives/view-management-directives.js
angular.module('viewManagement', [ 'Properties' ] )

    .constant('SIDEBAR_VIEWS', 'sidebarViews' )
    .constant('VIEW_CONTENT_IDS', 'viewContentIds' )

    .service( 'ViewsetService', [ function() {
        var viewsetService = this;
        var propertiesUpdated = false;

        var views = [];
        var viewContentIds = {};
        var target = '';

        viewsetService.generateIdForViewName = function( viewName, element ) {

            var generatedId = 'ppd-view-content-' + viewName;

            while( angular.isDefined( viewContentIds[generatedId] ) ) {
                generatedId = generatedId + "-1"; // this will guarantee that there will
                                                  // be no dup ids
            }

            element[0].id = generatedId;
            viewContentIds[generatedId] = true;

            return generatedId;
        };

        viewsetService.addView = function( view ) {
            views.push( view );
        };

        viewsetService.getViews = function() {
            return views;
        };

        viewsetService.setTarget = function(_target) {
            target = _target;
        };

        viewsetService.getTarget = function() {
            return target;
        };

        viewsetService.destroy = function( ) {
            views = [];
            viewContentIds = {};
            target = '';
        };

        viewsetService.isPropertiesUpdated = function() {
            return propertiesUpdated;
        };

        viewsetService.setPropertiesUpdated = function( _propertiesUpdated ) {
            propertiesUpdated = _propertiesUpdated;
        };

        viewsetService.resetPropertiesUpdated = function() {
            propertiesUpdated = false;
        };

        return viewsetService;

    }] )

    .service( 'ViewContentService', [ function() {
        var viewContentService = this;
        var currentSubView = 0;
        var isAnimating = false;

        viewContentService.nextView = function($scope) {
            $scope.viewAtIndex( currentSubView + 1 );
        };

        viewContentService.prevView = function($scope) {
            $scope.viewAtIndex( currentSubView - 1 );
        };

        viewContentService.viewAtIndex = function($scope, index) {
            if( index >= 0 && index !== currentSubView ) {

                var isNextView = false;
                isAnimating = true;

                if ( index > currentSubView ) {
                    isNextView = true;
                }

                $scope.isNextView = isNextView;
                $scope.isAnimating = isAnimating;
                $scope.activeSubView = index;
                currentSubView = index;

                setTimeout( function() {
                    isAnimating = false;
                    
                    setTimeout( function() {

                        // Must lookup the containing element by id since the genned
                        // element property does not have any content in it
                        angular.element( 
                                document.getElementById( $scope.generatedId )
                            )[0].querySelectorAll('[tabindex]')[0].focus();
                    },100);
                }, 0);
            }
        };

        return viewContentService;
    }])

    .directive('ppdViewSet', [ 'ViewsetService', function(ViewsetService) {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            controller: function() {
              //Empty controller so other directives can require being 'under' a view set
            },
            templateUrl: '',
            compile: function( element, attrs, transclude ) {

                return function(scope, element, attrs) {
                    ViewsetService.destroy();
                    transclude(scope); // this method will compile the child elements and add the transclusions
                                       // from the child elements to the ViewsetService

                    var target = attrs.target;
                    ViewsetService.setTarget( target );

                    if( element.children().length === 0 ) {
                        ViewsetService.setPropertiesUpdated( true );
                    }
                };
            }
        };
    }])

    .directive( 'ppdViewContent', [ 'ViewsetService', function(ViewsetService) {
        return {
            require: '^ppdViewContent',
            restrict: 'AE',
            replace: true,
            transclude: true,
            controller: function() {
              //Empty controller so other directives can require being 'under' a view content
            },
            compile: function(element, attrs, transclude) {

                var view = {};

                return function postLink(scope, element, attrs ) {
                    if( angular.isDefined(attrs.viewName) ) {
                        var viewName = attrs.viewName;
                        view = {
                            transcludeFn : transclude,
                            timestamp : new Date(),
                            viewName : viewName
                        };

                        ViewsetService.addView( view );
                    }

                    element[0].remove();
                };
            }
        };
    }])

    .directive( 'ppdStaticViewContent', [ 'ViewsetService', 'ViewContentService', function(ViewsetService, ViewContentService) {
        return {
            restrict: 'AE',
            replace: true,
            compile: function(element, attrs) {

                var viewName = '';
                var currentSubView = 0;

                if( angular.isDefined(attrs.viewName) && attrs.viewName !== null && attrs.viewName !== '' ) {
                    viewName = attrs.viewName;
                }


                return function link($scope, element) {

                    var generatedId = ViewsetService.generateIdForViewName(viewName, element);

                    $scope.generatedId = generatedId;
                    $scope.viewName = viewName;

                    $scope.assignNavClasses = function() {
                        return { 
                            prev: ! $scope.isNextView, 
                            next: $scope.isNextView,
                            animate: $scope.isAnimating
                        };
                    };

                    $scope.nextView = function() {
                        ViewContentService.nextView( $scope );
                    };

                    $scope.prevView = function() {
                        ViewContentService.prevView( $scope );
                    };

                    $scope.viewAtIndex = function( index ) {
                        ViewContentService.viewAtIndex( $scope, index );
                    };

                    $scope.$on( 'viewChanged', function($event, payload) {

                        // handle sub view logic here
                        $scope.activeSubView = payload.subViewId;
                        currentSubView = payload.subViewId;

                        if( payload.viewName === viewName ) {
                            setTimeout( function() {

                                // Must lookup the containing element by id since the genned
                                // element property does not have any content in it
                                angular.element( 
                                        document.getElementById( generatedId )
                                    )[0].querySelectorAll('[tabindex]')[0].focus();
                            },100);
                        }

                    });
                };
            }
        };
    }] )

    .controller( 'ModalViewController', [ '$scope', 'SharedProperties', 'VIEW_CONTENT_IDS', 'ViewsetService', 'ViewContentService', function( $scope, SharedProperties, VIEW_CONTENT_IDS, ViewsetService, ViewContentService) {

        var viewName = $scope.viewName;
        var currentSubView = 0;
        var views = [];

//        $scope.activeNamedModal = '';

        // Used to instantiate the views in case it is removed due to an 'ng-if'
        if( ViewsetService.getViews().length > 0 ) {

            views = ViewsetService.getViews();

            $scope.modals = views;

            ViewsetService.setPropertiesUpdated( false );

        }

        $scope.$watch( function() {

            return ViewsetService.isPropertiesUpdated();

        }, function(propertiesUpdated ) {

            if( propertiesUpdated && ViewsetService.getViews().length > 0 ) {

                views = ViewsetService.getViews();

                var targetName = $scope.targetName;
                if ( angular.isDefined( targetName ) ) {
                    $scope.modals = views;
                }

                ViewsetService.setPropertiesUpdated( false );

            }
        });

        $scope.$on( 'viewChanged', function($event, payload) {

            // handle sub view logic here
            $scope.activeSubView = payload.subViewId;

            if( payload.modalName === '' ) {
                // This is used so that when the sub view is closing
                // it will wait to hide the sub modals
                setTimeout(function() {
                    $scope.activeNamedModal = payload.modalName;
                    $scope.$apply();
                },400);
            } else {
                $scope.activeNamedModal = payload.modalName;
            }
            currentSubView = payload.subViewId;

            if( payload.viewName === viewName ) {
                setTimeout( function() {
                    // Must lookup the containing element by id since the genned
                    // element property does not have any content in it
                    angular.element( 
                            document.getElementById( $scope.generatedId )
                        )[0].querySelectorAll('[tabindex]')[0].focus();
                },100);
            }

        });

        $scope.assignNavClasses = function() {
            return { 
                prev: ! $scope.isNextView, 
                next: $scope.isNextView,
                animate: $scope.isAnimating
            };
        };

        $scope.nextView = function() {
            ViewContentService.nextView( $scope );
        };

        $scope.prevView = function() {
            ViewContentService.prevView( $scope );
        };

        $scope.viewAtIndex = function( index ) {
            ViewContentService.viewAtIndex( $scope, index );
        };

    }])

    .directive( 'ppdModalViewContent', [ 'ViewsetService', function( ViewsetService ) {

        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            controller: 'ModalViewController',
            templateUrl: 'site/templates/modal-views/modalset.html',
            link: function(scope, element, attrs) {
                scope.viewName = attrs.viewName;
                scope.generatedId = ViewsetService.generateIdForViewName(scope.viewName, element);
                scope.targetName = attrs.targetName;
            }
        };
    }])

    .directive('modalContentTransclude', function() {
        return {
            restrict: 'A',
            link: function(scope, elm, attrs) {
                var modal = scope.$eval(attrs.modalContentTransclude);

                //Now our modal is ready to be transcluded: both the modal heading area
                //and the modal content area are loaded.  Transclude 'em both.
                modal.transcludeFn(scope.$parent, function(contents) {
                    angular.forEach(contents, function(node) {
                        elm.append(node);
                    });
                });
            }
        };
    });
;
// Source: src/main/js/app/app.js
var configFunctionInjector = ['$httpProvider', '$locationProvider',
    function( $httpProvider, $locationProvider ) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];

        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix('!');
    }];

var runFunctionInjector = [ '$rootScope',
    function($rootScope) {
        $rootScope.authValidating = false;
        FastClick.attach(document.body);
    }];

angular.module('baseApp', [
    'ngTouch',
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'viewHelper',
    'viewDirectives',
    'httpInterceptor',
    'duScroll',
    'scrollable',
    'loading',
    'ui.keypress'
]);

angular.module('loginApp', [
    'baseApp',
    'login',
    'forgot'
])
.config(configFunctionInjector)
.run(runFunctionInjector);

angular.module('userApp', [
    'baseApp',
    'products',
    'productSearch',
    'home',
    'form',
    'logout',
    'viewManagement',
    'cart',
    'slots',
    'pickup',
    'userPreferences',
    'accordion',
    'ProductView'
])
.config(configFunctionInjector)
.run(runFunctionInjector);
