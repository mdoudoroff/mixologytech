/*global d3 */
/*global topojson */
/*jshint devel:true */

// @codekit-prepend "topojson.v0.js";

function buildMap(map_ids) {

	var mapWidth = 460,
		mapHeight = 300;

	var projection = d3.geo.mercator()
		.scale(1000)
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
		console.log(lonBounds,latBounds);
		var absLonMin = projection([-169,0]);
		var absLonMax = projection([180,0]);
		var lonMin = (d3.min(lonBounds)>absLonMin[0]) ? d3.min(lonBounds) : absLonMin[0];
		var lonMax = (d3.max(lonBounds)<absLonMax[0]) ? d3.max(lonBounds) : absLonMax[0];
		//console.log('absLonMin, absLonMax', absLonMin, absLonMax);
		var absLatMin = projection([0,66]);	// ceiling and floor latitudes (may not work out in the long run)
		var absLatMax = projection([0,-34]);
		var latMin = (d3.min(latBounds)>absLatMin[1]) ? d3.min(latBounds) : absLatMin[1];
		var latMax = (d3.max(latBounds)<absLatMax[1]) ? d3.max(latBounds) : absLatMax[1];
		var b = [[lonMin,latMin],[lonMax,latMax]];
		//console.log('b',b);
		var newScale = 0.80 / Math.max((b[1][0] - b[0][0]) / mapWidth, (b[1][1] - b[0][1]) / mapHeight);
		g.attr(
			"transform",
			"translate(" + projection.translate() + ")" +
			"scale(" + newScale + ")" +
			"translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")"
			);



		// country labels (we're rendering these after the zoom/crop and applying a reverse scale on the text to get the label up to size)
		var countryLabels = g.selectAll('.country-label')
			.data(countries)
			.enter()
			.append("text")
			.attr("class", 'country-label')
			.text(function(d){return d.properties.name;})
			.attr("transform", function(d) { return "translate(" + path.centroid(d) + ") scale("+1/newScale+") translate(" + this.getBBox().width/2 * -1 + ",0)"; });

		countryLabels.filter(function(d){ return map_ids.indexOf(d.id)<0; })
			.attr("visibility","hidden");
		

	});

}

