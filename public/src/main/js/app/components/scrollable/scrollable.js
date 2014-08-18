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
