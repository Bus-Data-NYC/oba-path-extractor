var express = require('express');
var app = express();

var fs = require('fs');
var request = require('request');

var buslines;
fs.readFile('data/buslines.json', 'utf8', function (err, data) {
  if (err) throw err;
  buslines = JSON.parse(data);
});

app.get('/route', function(req, res) {
	if (buslines == undefined) {
		res.status(500).send('Buslines not loaded.');
	} else {
		var allBuses = {};

		buslines.forEach(function (busRoute, i) {
			getRouteData(busRoute, function (r) {
				if (r.error) {
					allBuses[busRoute] = false;
				} else {
					allBuses[busRoute] = r.response;
					var rte = JSON.stringify(r.response.matches[0]),
							rte_name = 'geojsons/' + busRoute + '.geojson';
					fs.writeFile(rte_name, rte, function (err) {});
				}

				if (i == buslines.length - 1) {
					res.status(200).send(allBuses);
				}
			});
		});
	}
});

app.get('/route/:route', function(req, res) {
	var busRoute = req.params.route;

	if (busRoute == undefined)
		res.status(400).send(Error('No bus route included.'));

	getRouteData(busRoute, function (r) {
		if (r.error) {
			res.status(500).send(r.response);
		} else {
			res.status(200).send(r.response);
		}
	});
})

app.listen('8080')
console.log('Up and running on port 8080...');

exports = module.exports = app;



// utilities
var getRouteData = function (busRoute, cb) {
	var url = 'http://bustime.mta.info/api/search?q=' + busRoute;

	request(url, function(error, response, data){
		if(error){
			cb({error: true, response: response});
		} else {
			var data = JSON.parse(data).searchResults;

			if (data.empty) {
				cb({error: true, response: response});
			} else {
				var route = data.matches[0];

				if (route !== undefined) {
					if (route.directions[0] !== undefined) {
						route.directions[0].shape = [];
						route.directions[0].polylines.forEach(function (pl, i) {
							route.directions[0].shape.push(decodePolyline(pl));
						});
					}

					if (route.directions[1] !== undefined) {
						route.directions[1].shape = [];
						route.directions[1].polylines.forEach(function (pl, i) {
							route.directions[1].shape.push(decodePolyline(pl));
						});
					}

				}

				cb({error: false, response: data});
			}
		}
	});
}


var decodePolyline = function(encoded) {
  var len = encoded.length,
  		index = 0,
  		array = [],
  		lat = 0,
  		lng = 0;

  while (index < len) {
    var b,
    		shift = 0,
    		result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    array.push([lat * 1e-5, lng * 1e-5]);
  }

  var ls = { "type": "LineString", "coordinates": array }
  return ls;
}
