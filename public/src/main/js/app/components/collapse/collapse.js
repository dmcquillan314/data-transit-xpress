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
    }]);