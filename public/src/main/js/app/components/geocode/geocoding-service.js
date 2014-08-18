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
