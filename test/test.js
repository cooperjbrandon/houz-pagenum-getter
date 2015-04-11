//Libraries
var expect = require('chai').expect;
var sinon = require('sinon');
var nock = require('nock');
var amqp = require('amqp');

//Files
var Connection = require('amqp/lib/connection');
var Exchange = require('amqp/lib/exchange');
var Queue = require('amqp/lib/queue');
var config = require('houz-config');

//Stub Response
var html1 = require('./html-stub/html1').html;

//stubs
var stubconn, stubexch, stubqueue, spy, sandbox;

describe('Page Numbers', function() {
	before('stub out request & amqp and begin connection', function() {
		//create sinon sandbox
		sandbox = sinon.sandbox.create();

		nock('http://www.zillow.com').get('/san-jose-ca/1_p/').times(2).reply(200, html1);

		//create a stub connection to return when connecting to amqp
		stubconn = new Connection();
		
		//stub out _sendMethod - this is used when creating an exchange
		sandbox.stub(stubconn, '_sendMethod');

		//create a stub exchange and queue to return when connecting to an exchange & queue
		stubexch = new Exchange(stubconn, null, config.exchangeName);
		stubqueue = new Queue(stubconn, null, config.queueName.cities);

		// don't actually connect to server (see node_modules/amqp/ampq.js)
		// just return new Connection object.
		sandbox.stub(amqp, 'createConnection').returns(stubconn);
		
		// don't actually connect to exchange, just return new Exchange object
		sandbox.stub(stubconn, 'exchange').returns(stubexch);

		// don't actually connect to exchange, just return new Exchange object
		sandbox.stub(stubconn, 'queue').returns(stubqueue);

		//stub out queue.bind and queue.subscribe
		sandbox.stub(stubqueue, 'bind');
		sandbox.stub(stubqueue, 'subscribe');
		
		//this invokes beginSetup
		require('../pagenum-fetcher');
		
		stubconn.emit('ready');
		stubexch.emit('open');
		stubqueue.emit('open');
		stubqueue.emit('queueBindOk');
	});

	beforeEach(function(done) {
		//spy on exchange.publish
		spy = sandbox.spy(stubexch, 'publish');

		stubqueue.emit('message', { city: 'san-jose-ca' });
		setTimeout(function() {
			// wait for nock to return
			done();
		},15)
	});

	afterEach(function() {
		spy.restore();
	});

	after('restore all', function() {
		sandbox.restore();
		nock.restore();
		nock.cleanAll();
	});
	
	it('should publish to the exchange for each page number', function(){
		expect(spy.callCount).to.equal(20);
	});

	it('should do it again', function(){
		expect(spy.callCount).to.equal(20);
	});

	// it('should publish to the exchange with the correct routingKey and message', function(){
	// 	var expectedRoutingKey = config.routingKey.cities;
	// 	var expectedMessageStructure = config.messageExpectations.cities;

	// 	for (var i = 0; i < citynames.length; i++) {
	// 		var args = spy.args[i];
			
	// 		expect(args[0]).to.equal(expectedRoutingKey);
	// 		correctStructureOfMessage(args[1], expectedMessageStructure, citynames[i]);
	// 	};
	// });
});

var correctStructureOfMessage = function(message, expectedMessage, city) {
	var messageKeys = Object.keys(message)
	var expectedMessageKeys = Object.keys(expectedMessage);
	
	//verify that the number of properties are the same
	expect(messageKeys).to.have.length(expectedMessageKeys.length);

	//verify that the message has the expected properties
	for (var i = 0; i < expectedMessageKeys.length; i++) {
		expect(message).to.have.property(expectedMessageKeys[i], city);
	}
};
