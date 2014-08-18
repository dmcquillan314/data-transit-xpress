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




