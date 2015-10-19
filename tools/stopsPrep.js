var express = require('express');
var app = express();

var request = require('request');

var fs = require('fs');
var mkdirp = require('mkdirp').mkdirp;

var stops;
fs.readFile('data/stops.json', 'utf8', function (err, data) {
  if (err) throw err;
  stops = JSON.parse(data);
});


if (stops == undefined) {
	res.status(500).send('Stops not loaded.');
} else {
	var allStop = {};

	stops.forEach(function (stop) {
		if (allStop[stop.route_id] == undefined) {
			allStop[stop.route_id] = {};
		}
		if (allStop[stop.route_id][stop.direction_id] == undefined) {
			allStop[stop.route_id][stop.direction_id] = {};
		}
		allStop[stop.route_id][stop.direction_id][stop.stop_id] = {
			stop_sequence: stop.stop_sequence,
			stop_name: stop.stop_name,
			location: [stop.stop_lat, stop.stop_lon]
		}
	});

	var rte_path = 'geojsons/';
	mkdirp(rte_path, function (err) {
	  if (err) { 
	  	console.error('Failed to make file path. Error: ' + err);
	  } else {
	  	rte_path = rte_path + '/stops2.json';
	  	var dostr = JSON.stringify(allStop);
	  	fs.writeFile(rte_path, dostr, function (err) {
	  		if (err) {
	  			console.error('Failed to write file. Error: ' + err);
	  		} else {
	  			console.log('FINISHED')
	  		}
	  	});
	  }
	});
}


