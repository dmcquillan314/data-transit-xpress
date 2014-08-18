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
}]);