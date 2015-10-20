var express = require('express');
var app = express();

var request = require('request');

var fs = require('fs');
var mkdirp = require('mkdirp').mkdirp;

var buslines;
fs.readFile('data/buslines.json', 'utf8', function (err, data) {
  if (err) throw err;
  buslines = JSON.parse(data);
});

var stops;
fs.readFile('data/stops.json', 'utf8', function (err, data) {
  if (err) throw err;
  stops = JSON.parse(data);
});

app.get('/route', function(req, res) {
	if (buslines == undefined) {
		res.status(500).send('Buslines not loaded.');
	} else if (stops == undefined) {
		res.status(500).send('Stops not loaded.');
	} else {
		var allBuses = {};

		buslines.forEach(function (busRoute, i) {
			getRouteData(busRoute, function (r) {
				if (r.error || r.response.matches[0] == undefined) {
					allBuses[busRoute] = false;
				} else {
					allBuses[busRoute] = r.response;
					var rte_dirs = r.response.matches[0].directions;
					[0, 1].forEach(function (rd, i) {
						if (rte_dirs[i] !== undefined) {
							var rd = rte_dirs[i],
									props = {},
									keys = Object.keys(rd);

							keys.forEach(function (key, i) {
								if (key !== 'shape' && key !== 'polylines')
									props[key] = rd[key];
							});

							var s = getRteStops(busRoute)[i];
							if (s == undefined || s == null) {
								console.log("Failed stops data join for route id: " + busRoute);

							}

							var dirObj = { 
								"type": "FeatureCollection",
							  "features": [],
							  "properties": {
							  	"stops": s
							  }
							};

							rte_dirs[i].shape.forEach(function (ea, i) {
								var f = updateWithStops(ea, s);

						    var feat = {
						    	"type": "Feature",
						      "geometry": ea,
						      "properties": props,
						    }
						    dirObj.features.push(feat);
							});

							var rte_path = 'geojsons/' + busRoute;
							mkdirp(rte_path, function (err) {
							  if (err) { 
							  	console.error('Failed to make file path. Error: ' + err);
							  } else {
							  	rte_path = rte_path + '/' + busRoute + '_dir' + i + '.geojson';
							  	var dostr = JSON.stringify(dirObj);
							  	fs.writeFile(rte_path, dostr, function (err) {
							  		if (err) {
							  			console.error('Failed to write file. Error: ' + err);
							  		}
							  	});
							  }
							});
						} else {
							console.log('Route direction ' + rd + ' was undefined.');
						}
					});
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
var getRteStops = function (busRoute) {
	var stopnames = Object.keys(stops);
	var f = busRoute.split(/[^A-Za-z0-9]/)[0];
	if (stopnames.indexOf(f) > -1) {
		return stops[f];
	} else {
		var sel = null;
		stopnames.forEach(function (s) {
			if (s.indexOf(f) > -1) {
				sel = s;
			}
		});
		return stops[sel];
	}
};


var updateWithStops = function (shape, stops) {
	if (shape == undefined) {
		console.log("Shape is undefined.");
	} else if (stops == undefined) {
		console.log("Stops are undefined.");
	} else {
		console.log('shape: ', shape);
		console.log('stops: ', stops);
		Object.keys(stops).forEach(function(e) {
			var stop = stops[e];
			
		});
	}
};


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

    array.push([lng * 1e-5, lat * 1e-5]);
  }

  return { "type": "LineString", "coordinates": array };
}
