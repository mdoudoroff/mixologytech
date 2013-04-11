/*global d3 */
/*global topojson */
/*jshint devel:true */

// @codekit-prepend "topojson.v0.js";

function buildMap(map_ids) {

	var mapWidth = 460,
		mapHeight = 300;

	var projection = d3.geo.mercator()
		.scale(100)
		.translate([mapWidth / 2, mapHeight / 2]);

	var path = d3.geo.path()
		.projection(projection);

	var svg = d3.select("#map").append("svg")
		.attr("width", mapWidth)
		.attr("height", mapHeight);

	svg.append("rect")
		.attr("width", mapWidth)
		.attr("height", mapHeight);

	var g = svg.append("g");

	d3.json("test3.json", function(error, mapData) {

		var countries = topojson.object(mapData, mapData.objects.subunits3).geometries;

		g.selectAll("path")
			.data(countries)
		.enter().append("path")
			.attr("d", path)
			.attr("class", function(d) { 
				if (map_ids.indexOf(d.id)>-1) {
					return "feature glow " + d.id;
				} else {
					return "feature " + d.id; 	
				}
			});

		g.append("path")
			.datum(topojson.mesh(mapData, mapData.objects.subunits3, function(a, b) { return a !== b; }))
			.attr("class", "mesh")
			.attr("d", path);


		// Zoom in on some arbitrary countries
		var ids = map_ids;
		var lonBounds = [];
		var latBounds = [];
		g.selectAll("path").each(function(d){
		if (ids.indexOf(d.id)>-1) {
			lonBounds.push(path.bounds(d)[0][0]);
			lonBounds.push(path.bounds(d)[1][0]);
			latBounds.push(path.bounds(d)[0][1]);
			latBounds.push(path.bounds(d)[1][1]);
		}
		});
		var lonMin = d3.min(lonBounds);
		var lonMax = d3.max(lonBounds);
		var latMin = d3.min(latBounds);
		var latMax = d3.max(latBounds);
		var b = [[lonMin,latMin],[lonMax,latMax]];
		g.transition().duration(750).attr("transform",
			"translate(" + projection.translate() + ")" +
			"scale(" + 0.95 / Math.max((b[1][0] - b[0][0]) / mapWidth, (b[1][1] - b[0][1]) / mapHeight) + ")" +
			"translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");

	});

}

