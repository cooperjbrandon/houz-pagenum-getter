//Libraries
var sinon = require('sinon');
var nock = require('nock');
var amqp = require('amqp');
var RSVP = require('rsvp');

//Files
var Connection = require('amqp/lib/connection');
var Exchange = require('amqp/lib/exchange');
var Queue = require('amqp/lib/queue');
var config = require('houz-config');

//Stub Response
var html1 = require('../html-stub/html1').html;
var html2 = require('../html-stub/html2').html;

//stubs
var stubconn, stubexch, stubqueue, spy, sandbox;

var before = function() {
	//create sinon sandbox
	sandbox = sinon.sandbox.create();

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
	require('../../pagenum-fetcher');
	
	stubconn.emit('ready');
	stubexch.emit('open');
	stubqueue.emit('open');
	stubqueue.emit('queueBindOk');

	return stubqueue;
};

var beforeEach = function() {
	//mock the request
	nock('http://www.zillow.com').get('/san-jose-ca/1_p/').reply(200, html1);
	nock('http://www.zillow.com').get('/san-mateo-ca/1_p/').reply(200, html2);

	//spy on exchange.publish
	spy = sandbox.spy(stubexch, 'publish');

	return spy;
};

var after = function() {
	sandbox.restore();
	nock.restore();
	nock.cleanAll();
};

var afterEach = function() {
	spy.restore();
};

var wait = function() {
	//the purpose of 'wait' is to wait for the nock to return
	//'nock', is stubbed, but is async so it throws the run loop in a mess
	var promise = new RSVP.Promise(function(resolve, reject) {
		setTimeout(resolve, 15);
	});
	return promise;
};

module.exports.before = before;
module.exports.beforeEach = beforeEach;
module.exports.after = after;
module.exports.afterEach = afterEach;
module.exports.wait = wait;
