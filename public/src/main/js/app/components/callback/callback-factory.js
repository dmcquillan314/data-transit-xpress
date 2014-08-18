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
}]);