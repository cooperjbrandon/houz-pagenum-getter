//Libraries
var expect = require('chai').expect;
var sinon = require('sinon');

//helpers
var helpers = require('./helpers/setup-helper');

//files
var config = require('houz-config');

var spy, stubqueue;

var messageFromRabbit = { city: 'city' };

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

	it('recieves the correct message structure', function() {
		expect(messageFromRabbit).to.have.all.keys(config.messageExpectations.cities);
	});
	
	it('publishes to the exchange for each page number for each city', function (done) {
		messageFromRabbit.city = 'san-jose-ca';
		stubqueue.emit('message', messageFromRabbit);
		helpers.wait(function() {
			expect(spy.callCount).to.equal(20);

			messageFromRabbit.city = 'san-mateo-ca';
			stubqueue.emit('message', messageFromRabbit);
			helpers.wait(function() {
				expect(spy.callCount).to.equal(26);
				done();
			});
		});
	});

	it('should publish to the exchange with the correct routingKey and message for each city', function (done) {
		messageFromRabbit.city = 'san-jose-ca';
		stubqueue.emit('message', messageFromRabbit);
		helpers.wait(function() {
			testRoutingKeyandMessage(messageFromRabbit.city, 0);
			messageFromRabbit.city = 'san-mateo-ca'; //now emit with new city
			stubqueue.emit('message', messageFromRabbit);
			helpers.wait(function() {
				testRoutingKeyandMessage(messageFromRabbit.city, 20);
				done();
			});
		});
	});

});

var testRoutingKeyandMessage = function(city, startingPoint) {
	var expectedRoutingKey = config.routingKey.pages;
	var expectedMessageStructure = config.messageExpectations.pages;

	for (var i = startingPoint; i < spy.callCount; i++) {
		var args = spy.args[i];
		var page = i + 1 - startingPoint;
		
		expect(args[0]).to.equal(expectedRoutingKey);
		correctStructureOfMessage(args[1], expectedMessageStructure, {pagenum: page, city: city});
	};
};

var correctStructureOfMessage = function(message, expectedMessageStructure, expectedMessage) {
	//expected message structure comes from config, which is used in other repos as well
	//expected message is what we actually expect

	//the target object must both contain all of the passed-in keys AND the number of keys
	//in the target object must match the number of keys passed in (in other words, a target
	//object must have all and only all of the passed-in keys)
	expect(message).to.have.all.keys(expectedMessageStructure);

	//verify that the message has the expected properties
	for (var key in message) {
		expect(message).to.have.property(key, expectedMessage[key]);
	}
};
