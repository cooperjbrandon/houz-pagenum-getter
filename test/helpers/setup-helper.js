//Libraries
var sinon = require('sinon');
var nock = require('nock');
var amqp = require('amqp');

//Files
var Connection = require('amqp/lib/connection');
var Exchange = require('amqp/lib/exchange');
var Queue = require('amqp/lib/queue');
var config = require('houz-config');

//Stub Response
var html1 = require('../html-stub/html1').html;

//stubs
var stubconn, stubexch, stubqueue, spy, sandbox;
var spy;
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
};

var beforeEach = function(done) {
	//mock the request
	nock('http://www.zillow.com').get('/san-jose-ca/1_p/').reply(200, html1);

	//spy on exchange.publish
	spy = sandbox.spy(stubexch, 'publish');
	// spy = sandbox.spy(stubexch, 'publish');

	stubqueue.emit('message', { city: 'san-jose-ca' });
	setTimeout(function() {
		// wait for nock to return
		done();
	},15);
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

module.exports.before = before;
module.exports.beforeEach = beforeEach;
module.exports.after = after;
module.exports.afterEach = afterEach;
