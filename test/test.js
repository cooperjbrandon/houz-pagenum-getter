//Libraries
var expect = require('chai').expect;
var sinon = require('sinon');

//helpers
var helpers = require('./helpers/setup-helper');

//files
var config = require('houz-config');

var spy, stubqueue;

describe('Page Numbers', function() {
	
	before('stub out request & amqp and begin connection', function() {
		stubqueue = helpers.before();
	});

	beforeEach(function() {
		spy = helpers.beforeEach();
	});

	afterEach(function() {
		helpers.afterEach();
	});

	after('restore all', function() {
		helpers.after();
	});
	
	it('publishes to the exchange for each page number for each city', function (done) {
		stubqueue.emit('message', { city: 'san-jose-ca' });
		helpers.wait().then(function() {
			expect(spy.callCount).to.equal(20);
			stubqueue.emit('message', {city: 'san-francisco-ca'});
			helpers.wait().then(function() {
				expect(spy.callCount).to.equal(40);
				done();
			});
		});
	});

	it('should publish to the exchange with the correct routingKey and message for each city', function (done) {
		var city = 'san-jose-ca';
		stubqueue.emit('message', { city: city });
		helpers.wait().then(function() {
			secondTest(city, 0);

			city = 'san-francisco-ca'; //now emit with new city
			stubqueue.emit('message', { city: city });
			helpers.wait().then(function() {
				secondTest(city, 20);
				done();
			});
		});
	});

});

var secondTest = function(city, startingPoint) {
	var expectedRoutingKey = config.routingKey.pages;
	var expectedMessageStructure = config.messageExpectations.pages;

	for (var i = startingPoint; i < spy.callCount; i++) {
		var args = spy.args[i];
		var page = startingPoint === 0 ? i + 1: i + 1 - startingPoint;
		
		expect(args[0]).to.equal(expectedRoutingKey);
		correctStructureOfMessage(args[1], expectedMessageStructure, page, city);
	};
};

var correctStructureOfMessage = function(message, expectedMessage, pagenum, cityName) {
	var messageKeys = Object.keys(message);
	var expectedMessageKeys = Object.keys(expectedMessage);
	
	//verify that the number of properties are the same
	expect(messageKeys).to.have.length(expectedMessageKeys.length);

	//verify that the message has the expected properties
	for (var i = 0; i < expectedMessageKeys.length; i++) {
		var key = expectedMessageKeys[i];
		if (key === 'pagenum') {
			expect(message).to.have.property(key, pagenum);
		} else if (key === 'city') {
			expect(message).to.have.property(key, cityName);			
		} else {
			//should be only those two key names. if not throw error
			throw new Error('there should not be another key name other than "city" and "pagenum"');
		}
	}
};
