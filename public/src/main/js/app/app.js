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

angular.module('ziptripApp', [
    'ngTouch',
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'root',
    'duScroll',
    'scrollable',
    'loading',
    'ui.keypress',
    'accordion'
])

.config(configFunctionInjector)
.run(runFunctionInjector);

