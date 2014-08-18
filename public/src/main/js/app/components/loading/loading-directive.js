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

    }]);