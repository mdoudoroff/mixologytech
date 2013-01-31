

// @codekit-prepend "polymaps/lib/nns/nns.js";
// @codekit-prepend "polymaps/polymaps.js";
// @codekit-prepend "polymaps/geoff.js";
// @codekit-prepend "tsv.js";

var searchPrompt = 'Search by ingredient name...';

var used = [];

jQuery(document).ready(function() {

	// == search form crap

	$("#searchField").val(searchPrompt).addClass("empty");
	
	// When you click on #search
	$("#searchField").focus(function(){
		
		// If the value is equal to "Search..."
		if($(this).val() === searchPrompt) {
			// remove all the text and the class of .empty
			$(this).val("").removeClass("empty");
		}
		
	});
	
	// When the focus on #search is lost
	$("#searchField").blur(function(){
		
		// If the input field is empty
		if($(this).val() === "") {
			// Add the text "Search..." and a class of .empty
			$(this).val(searchPrompt).addClass("empty");
		}
		
	});

	// dynamic search binding (keyup-based)
	// note: returns all results, not just "top" results, so maybe a variant is needed for "drop down"-type results presentation
	$('#searchField').keyup(function() {
		
		var searchStr = $('#searchField').val();
		var searchStrLeadTerm = searchStr.toLowerCase().split(' ')[0];
		var searchResults = $('#searchResults');
		var counter = 0;
		if (searchStr.length > 0) {
			$('#resetsearch').css('opacity','1.0');
		} else {
			$('#resetsearch').css('opacity','0.5');
		}
		if (searchStr.length > 1) {
			$.getJSON('/search/ing/'+searchStr,function(msg){

				searchResults.empty();

				if (msg.length>0) {

					// first, show matches that begin with the first search term
					for (var i = 0; i < msg.length; i++) {
						if (msg[i].name.toLowerCase().indexOf(searchStrLeadTerm)===0) {
							counter += 1;
							searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
						}
					}

					// divider, if necessary
					if (counter > 0 && counter < 10) {
						searchResults.append($('<li class="divider"></li>'));
					}

					// then list the rest, space allowing
					for (i = 0; i < msg.length; i++) {
						if (counter > 10) {
							break;
						}
						searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
						counter += 1;
					}
					if (msg.length > 10) {
						searchResults.append($('<li class="divider"></li><li><a tabindex="-1" href="/tree/index.html?q='+encodeURIComponent(searchStr)+'"><em>... and '+(msg.length-10)+' more</em></a></li>'));
					}

					searchResults.show();
				}
				else if (searchStr.length > 0) {
					searchResults.append($('<li><a href=""><em>No matches. Try searching on the first few letters of a product or category.</em></a></li>'));
					searchResults.show();
				} else {
					searchResults.hide();
				}
			});
		}
		else {
			searchResults.hide();
		}
	});

	// impose clickaway functionality
	$('body').click(function(e) {
		if (!$(e.target).is('#searchResults')) {
			$('#searchResults').hide();
		}
	});

	// reset switch
	$('#resetsearch').click( function() {
		$('#searchResults').hide();
		$('#searchField').val('');
		$('#resetsearch').css('opacity','0.5');
	});

});


jQuery(window).load(function() {
	// map!
	var po = org.polymaps;

	/* Country name -> population (July 2010 Est.). */
	//var population = tsv("population.tsv")
	//	.key(function(l) { return l[1]; })
	//	.value(function(l) { return l[2].replace(/,/g, ""); })
	//	.map();

	/* Country name -> internet users (2008). */
	//var internet = tsv("internet.tsv")
	//	.key(function(l) { return l[1]; })
	//	.value(function(l) { return l[2].replace(/,/g, ""); })
	//	.map();

	var map = po.map()
		.container(document.getElementById("map").appendChild(po.svg("svg")))
		.center({lat: 40, lon: 0})
		.zoomRange([1, 7])
		.zoom(2)
		.add(po.interact())
		;

	//map.add(po.image()
	//	.url("http://s3.amazonaws.com/com.modestmaps.bluemarble/{Z}-r{Y}-c{X}.jpg"));

	//map.add(po.geoJson()
	//	.url("world.json")
	//	.tile(false)
	//	.zoom(3)
	//	);
	//	//.on("load", load));

	map.add(po.geoJson()
		.url("world-large-filtered.json")
		.tile(false)
		.zoom(3)
		.on("load", load)
		);


	//map.add(po.geoJson()
	//	.features(geoJSONFeatures['features'])
	//	.tile(false)
	//	.zoom(3)
	//	.on("load", load));


	//map.add(po.compass()
	//	.pan("none"));

	map.container().setAttribute("class", "Oranges");

	

	/** Set feature class and add tooltip on tile load. */
	function load(e) {
	  for (var i = 0; i < e.features.length; i++) {
		var feature = e.features[i];
		var n = feature.data.properties.name;
		var v = originAggregate[n];
		if (v !== undefined) {
			used.push(n);
		}
		if (v === 1.0) {
			v = 0.99;
		}
		n$(feature.element)
			.attr("class", isNaN(v) ? null : "q" + ~~(v * 9) + "-" + 9)
			//.attr("onclick", 'window.location="http://apple.com";')
		  .add("svg:title")
			//.text(n + (isNaN(v) ? "" : ":  " + percent(v)));
			.text(n + (isNaN(v) ? "" : ":  " + v));
	  }
	}


	
	//console.log('initial',map.extent());
	//console.log(boundsSW,boundsNE);
	map.resize();
	//map.extent([{lon:-170,lat:-20},{lon:153,lat:71}]);
	map.extent([{lon:boundsSW.x,lat:boundsSW.y},{lon:boundsNE.x,lat:boundsNE.y}]);
	//console.log('after',map.extent());
	//map.extent([map.pointLocation({y:boundsSW.y,x:boundsSW.x}), map.pointLocation({y:boundsNE.y,x:boundsNE.x})]);

	//console.log(map.extent());

	//map.zoom(Math.floor(map.zoom()));

	/** Formats a given number as a percentage, e.g., 10% or 0.02%. */
	//function percent(v) {
	//  return (v * 100).toPrecision(Math.min(2, 2 - Math.log(v) / Math.LN2)) + "%";
	//}


	// zoom to the feature's extent
	//var neighborhood = $.getJSON('world.json', function(data) {
	//	return data;
	//});
	//console.log(neighborhood.type);
	//var neighborhood = {"type":"Feature","properties":{"OBJECTID":20.000000,"NEIGHBORHO":"Mission"},"geometry":{"type":"Polygon","coordinates":[[[-122.424756,37.747849],[-122.424949,37.749725],[-122.425578,37.756617],[-122.426761,37.769577],[-122.426329,37.769601],[-122.423302,37.772048],[-122.423269,37.772074],[-122.422690,37.770624],[-122.421172,37.770221],[-122.419768,37.770073],[-122.415771,37.769625],[-122.412755,37.769588],[-122.408760,37.769225],[-122.407029,37.768911],[-122.405280,37.767914],[-122.405032,37.766635],[-122.405014,37.765952],[-122.404982,37.764670],[-122.405465,37.762525],[-122.406285,37.760887],[-122.406249,37.759519],[-122.405147,37.758511],[-122.403943,37.757761],[-122.403271,37.756746],[-122.402891,37.754529],[-122.403019,37.751107],[-122.403576,37.749388],[-122.404159,37.749379],[-122.405767,37.749097],[-122.407579,37.748383],[-122.411344,37.748237],[-122.415005,37.748263],[-122.418126,37.748212],[-122.420171,37.748179],[-122.421568,37.748070],[-122.423181,37.747959],[-122.424756,37.747849]]]}};
	//var extent = geoff.extent().encloseGeometry(geoJSONFeatures);
	//map.extent(extent.toArray());
	//map.zoom(Math.floor(map.zoom()));

});


function report() {
	for (var key in originAggregate) {
		if (used.indexOf(key)===-1) {
			console.log('MISMATCH: ',key);
		}
	}
}