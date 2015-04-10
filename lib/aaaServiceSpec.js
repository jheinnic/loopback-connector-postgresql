/**
 * @module test.wins.boo
 * @name aaaService
 * @description
 * Tests for aaaService under wins.boo
 * _Enter the test description._
 * */


describe('Service: wins.boo.aaaService', function () {

    // load the service's module
    beforeEach(module('wins.boo'));

    // instantiate service
    var service;

    //update the injection
    beforeEach(inject(function (aaaService) {
        service = aaaService;
    }));

    /**
     * @description
     * Sample test case to check if the service is injected properly
     * */
    it('should be injected and defined', function () {
        expect(service).toBeDefined();
    });
});
