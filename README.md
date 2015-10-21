# oba-path-extractor

Tool for extracting shapefiles from MTA Bustime app and repository of latest MTA bus shapefiles.


#### I just want the shapefiles

Go straight ahead to the `geojsons/` folder. Inside, each bus route is a folder, within which the inbound and outbound directions are placed as `featureCollection` geojsons.


#### DIY

Clone this repo onto your computer and `cd` to the folder. In the root directory for the git repo, just run `node server.js` and wait until you are alerted that the app is up and running. Open a browser and use the following endpoints to run specific queries:

- If you just want one bus route:
`http://localhost:8080/route/***` where `***` is the route id.

- If you want all the bus routes:
`http://localhost:8080/route` will return the complete results.

The shapefiles will automatically be saved to the folder structure on the latter method. The browser will receive a data blob that includes those shapefiles, as well as a bunch of other meta data that might be useful.

Feel free to update the tool as you see fit - it's intended to be super rudimentary.


#### Notes on stops
Stop data has been added to each GeoJSON and exists in the routes. Each shapefile now has a list of the related stops for each section and plotting those will allow you to plot the locations of all stops for that direction and route (per section). Also included is the adjusted location that includes the lat/lng on the shapefile path that is the point of intersection when drawing a perpendiculr line from the stop to a shapefile. This is useful for calcuting - with specificity - the distance along the route that the stop is within adding in the variation off route from the shape to the stop point.