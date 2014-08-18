describe("Shared Property Tests", function() {

    var service;

    beforeEach(function () {
        angular.mock.module('Properties');
    });

    beforeEach(angular.mock.inject(function($injector) {
        service = $injector.get('SharedProperties');
    }));

    it('should place a value in the shared properties.', function() {
        var propertyValue = "test";
        var propertyKey = "test";

        service.setProperty(propertyKey, propertyValue);
        expect(service.getProperty(propertyKey)).toBe(propertyValue);
    });

    it('should find null if value is not present', function() {
        expect(service.getProperty("test")).toBe(null);
    });

    it('should work with multiple properties', function() {

        var propertyValue = "test";
        var propertyKey = "test";
        var propertyValue2 = "testTwo";
        var propertyKey2 = "testTwo";

        service.setProperty(propertyKey, propertyValue);
        service.setProperty(propertyKey2, propertyValue2);

        expect(service.getProperty(propertyKey)).toBe(propertyValue);
        expect(service.getProperty(propertyKey2)).toBe(propertyValue2);
    });

    it( 'should retrieve all properties when requested', function() {
        var propertyValue = "test";
        var propertyKey = "test";
        var propertyValue2 = "testTwo";
        var propertyKey2 = "testTwo";

        var complexObject = {
            test: "test",
            testTwo: "testTwo"
        };

        service.setProperty(propertyKey, propertyValue);
        service.setProperty(propertyKey2, propertyValue2);

        expect( service.getSharedProperties() ).toEqual(complexObject);
    })

});