//Libraries
var expect = require('chai').expect;
var sinon = require('sinon');

//helpers
var helpers = require('./helpers/setup-helper');

//files
var config = require('houz-config');

var spy;

describe('Page Numbers', function() {
	before('stub out request & amqp and begin connection', function() {
		helpers.before();
	});

	beforeEach(function(done) {
		spy = helpers.beforeEach(done);
	});

	afterEach(function() {
		helpers.afterEach();
	});

	after('restore all', function() {
		helpers.after();
	});
	
	it('publishes to the exchange for each page number', function() {
		expect(spy.callCount).to.equal(20);
	});

	it('should publish to the exchange with the correct routingKey and message', function(){
		var expectedRoutingKey = config.routingKey.pages;
		var expectedMessageStructure = config.messageExpectations.pages;

		for (var i = 0; i < spy.callCount; i++) {
			var args = spy.args[i];
			
			expect(args[0]).to.equal(expectedRoutingKey);
			correctStructureOfMessage(args[1], expectedMessageStructure, i + 1);
		};
	});
});

var correctStructureOfMessage = function(message, expectedMessage, pagenum) {
	var messageKeys = Object.keys(message)
	var expectedMessageKeys = Object.keys(expectedMessage);
	
	//verify that the number of properties are the same
	expect(messageKeys).to.have.length(expectedMessageKeys.length);

	//verify that the message has the expected properties
	for (var i = 0; i < expectedMessageKeys.length; i++) {
		var key = expectedMessageKeys[i];
		if (key === 'pagenum') {
			expect(message).to.have.property(key, pagenum);
		} else if (key === 'city') {
			expect(message).to.have.property(key, 'san-jose-ca');			
		} else {
			//should be only those two key names. if not throw error
			throw new Error('there should not be another key name other than "city" and "pagenum"');
		}
	}
};
