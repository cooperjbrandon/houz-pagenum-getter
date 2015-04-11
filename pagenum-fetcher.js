var http, clc, rabbit, beginSetup, handlePageNums;

request = require('request');
clc = require('cli-color');
rabbit = require('./rabbit-management');

beginSetup = rabbit.beginSetup;
handlePageNums = rabbit.handlePageNums;

var beginFetchOfPageNums = function(message, headers, deliveryInfo, messageObject) {
	fetchPropertyPageNums(message.city)
}

var fetchPropertyPageNums = function(city) {
	// city ex: san-jose-ca
	var url = 'http://www.zillow.com/'+city+'/1_p/';
	request.get(url, function(error, response, body) {
		if (error) {
			console.log("Got error: " + error.message);
		} else {
			var totalPages = parsePageNums(body)
			handlePageNums(totalPages, city);
		}
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