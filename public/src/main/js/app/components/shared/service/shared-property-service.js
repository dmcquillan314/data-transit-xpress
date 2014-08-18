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
    });