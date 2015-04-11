var amqp, clc, moment, beginFetchOfPageNums, config,
		connection, bindingRoutingKey, publishRoutingKey,
		queue, queueName, queueConnected,
		exchange, exchangeName, exchangeConnected;

amqp = require('amqp');
clc = require('cli-color');
moment = require('moment');
config = require('houz-config');

exchangeName = config.exchangeName;
queueName = config.queueName.cities;
bindingRoutingKey = config.routingKey.cities;
publishRoutingKey = config.routingKey.pages;

var beginSetup = function(beginFetch) {
	beginFetchOfPageNums = beginFetch;
	connection = amqp.createConnection();
	connection.on('ready', connectToQueueAndExchange);
};

var connectToQueueAndExchange = function() {
	console.log(clc.blue('The connection is ready'));
	connectToQueue();
	connectToExchange();
};

var connectToExchange = function() {
	exchange = connection.exchange(exchangeName, {autoDelete: false}); //connect to exchange
	exchange.on('open', function() { queueOrExchangeReady('exchange'); });
}

var connectToQueue = function() {
	queue = connection.queue(queueName); //connect to queue
	queue.on('open', bindQueueToExchange);
};

var bindQueueToExchange = function() {
	console.log(clc.blue('The queue "' + queue.name + '" is ready'));
	queue.bind(exchangeName, bindingRoutingKey); //bind to exchange w/ bindingRoutingKey (most likely already done; this is just incase)
	queue.on('queueBindOk', function() { queueOrExchangeReady('queue'); });
};

var queueOrExchangeReady = function(type) {
	if (type === 'exchange') {
		console.log(clc.bgBlueBright('The exchange "' +exchange.name+ '" is ready'));
		exchangeConnected = true;
	} else if (type === 'queue') {
		console.log(clc.blue('The queue "' +queue.name+ '" is bound to the exchange "' +exchangeName+ '" with the routing key "' +bindingRoutingKey+ '"'));
		queueConnected = true;
	}
	if (exchangeConnected && queueConnected) { subscribeToQueue(); }
};

var subscribeToQueue = function() {
	queue.subscribe({ack: true}); //subscribe to queue
	queue.on('message', messageReceiver);
};

var messageReceiver = function(message, headers, deliveryInfo, messageObject) {
	console.log(clc.yellow('Message received: City ' + message.city + ' at ' + moment().format('MMMM Do YYYY, h:mm:ss a')));
	beginFetchOfPageNums(message, headers, deliveryInfo, messageObject);
};

var handlePageNums = function(pagenums, city) {
	//publish all N pageNums to the exchange to route to the queue
	for (var i = 1; i <= pagenums; i++) {
		exchange.publish(publishRoutingKey, { pagenum: i, city: city }); //routingKey, message
	}
	nextItem();
};

var nextItem = function() {
	queue.shift();
};

module.exports.beginSetup = beginSetup;
module.exports.handlePageNums = handlePageNums;
