var http, clc, rabbit, beginSetup, handlePageNums;

http = require('http');
clc = require('cli-color');
rabbit = require('./rabbit-management');

beginSetup = rabbit.beginSetup;
handlePageNums = rabbit.handlePageNums;

var beginFetchOfPageNums = function(message, headers, deliveryInfo, messageObject) {
	fetchPropertyPageNums(message.city)
}

var fetchPropertyPageNums = function(city) {
	// san-jose-ca
	var url = 'http://www.zillow.com/'+city+'/1_p/';
	http.get(url, function(result) {
		var html = '';
		console.log('STATUS: ' + result.statusCode);
		result.on('data', function(chunk) {
			html += new Buffer(chunk).toString('utf8');
		});
		result.on('end', function() {
			var totalPages = parsePageNums(html)
			handlePageNums(totalPages, city);
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});
};

var parsePageNums = function(html) {
	var stringToSearchFor = '</a></li><li class="zsg-pagination-next">';
	var endingIndex = html.indexOf(stringToSearchFor);
	var currentIndex = endingIndex - 1;
	while (!isNaN(parseInt(html[currentIndex]))) {
		 //keeping going until hitting a non-number
		currentIndex--;
	}
	return parseInt(html.substring(currentIndex + 1, endingIndex));
};

beginSetup(beginFetchOfPageNums);