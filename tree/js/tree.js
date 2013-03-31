
// @codekit-prepend "d3.layout.cloud.js";
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
							searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' <span class="context">'+msg[i].context+'</span></a></li>'));
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
						searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' <span class="context">'+msg[i].context+'</span></a></li>'));
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

	// if no pictures, hide the pictures area
	if (photoList) {
		if (photoList.length < 1) {
			$('#topphotos').hide();
		}
	} else {
		$('#topphotos').hide();
	}

});


jQuery(window).load(function() {

	// ================= map! =================

	if (! jQuery.isEmptyObject(originAggregate) || ! jQuery.isEmptyObject(activeMapRegions)) {

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
			//.add(po.interact())
			;

		//map.add(po.image()
		//	.url("http://s3.amazonaws.com/com.modestmaps.bluemarble/{Z}-r{Y}-c{X}.jpg"));

		// load the primary map elements (countries)
		map.add(po.geoJson()
			.url("countries.json")
			.tile(false)
			//.zoom(3)
			.on("load", load)
			);

		// load the secondary map elements (regions)
		map.add(po.geoJson()
			.url("other-regions.json")
			.tile(false)
			//.zoom(3)
			.on("load", loadregions)
			);

		//map.add(po.geoJson()
		//	.features(geoJSONFeatures['features'])
		//	.tile(false)
		//	.zoom(3)
		//	.on("load", load));


		//map.add(po.compass()
		//	.pan("none"));

		map.container().setAttribute("class", "Oranges");

		

		// set attributes on primary map elements (countries)
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
				.attr('style', 'opacity:0.5;')
				//.attr("onclick", 'window.location="http://apple.com";')
			  .add("svg:title")
				//.text(n + (isNaN(v) ? "" : ":  " + percent(v)));
				.text(n + (isNaN(v) ? "" : ":  " + v));
		  }
		}

		// set attributes on primary map elements (countries)
		function loadregions(e) {
		  for (var i = 0; i < e.features.length; i++) {
			var feature = e.features[i];
			var n = feature.data.properties.name;

			if (activeMapRegions.indexOf(n) > -1) {
				console.log('SHOWN:',n);
				//n$(feature.element).attr("style", 'fill:rgb(0,255,0); opacity:0.5;');
				n$(feature.element).attr("style", 'stroke:rgb(255,255,0); stroke-width:2; fill:none;');
				n$(feature.element).add("svg:title").text(n);
			} else {
				n$(feature.element).attr("style", 'display:none;');
				console.log('hidden:',n);
			}

			/*
			var v = originAggregate[n];
			if (v !== undefined) {
				used.push(n);
			}
			if (v === 1.0) {
				v = 0.99;
			}
			n$(feature.element)
				//.attr("class", isNaN(v) ? null : "q" + ~~(v * 9) + "-" + 9)
				//.attr("onclick", 'window.location="http://apple.com";')
				.attr("style", 'fill:rgb(0,255,0); opacity:0.5;')
			  .add("svg:title")
				//.text(n + (isNaN(v) ? "" : ":  " + percent(v)));
				.text(n + (isNaN(v) ? "" : " (region):  " + v));

			*/
		  }
		}
		
		console.log('initial',map.extent());
		console.log(boundsSW,boundsNE);

		//map.resize();

		//map.extent([{lon:-170,lat:-20},{lon:153,lat:71}]);

		map.extent([{lon:boundsSW.x,lat:boundsSW.y},{lon:boundsNE.x,lat:boundsNE.y}]);
		console.log('after',map.extent());

		//map.extent([map.pointLocation({y:boundsSW.y,x:boundsSW.x}), map.pointLocation({y:boundsNE.y,x:boundsNE.x})]);


		// correct zoom (go no closer than zoom level 6)
		map.zoom(Math.floor(map.zoom())-1);
		//if (map.zoom()>6.0) {
		//	map.zoom(6);
		//} else {
		//	map.zoom(Math.floor(map.zoom()));
		//}

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
	}






	// ================= photos! =================

	if (photoList.length > 1) {
		var j = photoList.length;
	    var i = 0;
	    var img;
	    function loadImage() {
	    	if (i > 6) {
	    		$("#topphotos").append('<span>More...</span>');
	    		return;
	    	}
	    	if (i >= j) return;
	    	console.log(photoList[i])

	    	img = $('<img src="http://ingr-photos.s3.amazonaws.com/'+photoList[i]+'" height="180" class="img-polaroid">');

	    	img.error(function() {
	    			i++;
					loadImage();
	  			})
	    	.load(function() {
				$(this).hide();      
	            $('#topphotos').append(this);
	            $(this).fadeIn();

	            i++;
				loadImage();  
	    	});	  	
	    }
	    loadImage();
	}
    

    // ============= AFFINITIES! ================

    // blue    orange  green   red     purple  brown   pink    gray    lt green  lt blue
	// #1f77b4 #ff7f0e #2ca02c #d62728 #9467bd #8c564b #e377c2 #7f7f7f #bcbd22   #17becf
	var ordinalColorMapping = {
		0:'#7f7f7f',     // garnishes, whatevah (default)
		1:'#d62728',    // bitters
		2:'#2ca02c',    // mixers/non-alcoholic modifiers/bottled cocktails
		3:'#1f77b4',   // liqueurs
		4:'#17becf',     // white spirits
		5:'#8c564b'     // brown spirits
	};

	var flavorOrdinalColorMapping = {
		0:'#7f7f7f',     // (default)
		1:'#2ca02c',	// vegetal/herbal
		2:'#ff7f0e',    // spice
		3:'#e377c2',    // floral
		4:'#8c564b',    // nutty
		5:'#d62728',    // fruity
	};

	var divwidth = $('#affinities').width();

	//var fill = d3.scale.category20();
	var ingFill = function(i) {return ordinalColorMapping[i]};
	var flavFill = function(i) {return flavorOrdinalColorMapping[i]};

    if (ingredientAffinities) {

    	var terms = Object.keys(ingredientAffinities);

		function drawIA(words) {
			d3.select("#affinities").append("svg")
				.attr("width", divwidth)
				.attr("height", 600)
				
				.append("g")
				.attr("transform", "translate("+divwidth/2+","+300+")")
				
				.selectAll("text")
				.data(words)

				.enter().append("text")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("font-family", "Helvetica")
				.style("font-weight", "bold")
				.style("cursor", 'pointer')
				.style("fill", function(d, i) { return ingFill(d.groupIdx); })
				.attr("text-anchor", "middle")
				.on("click", function(d) {
					window.location = "ing-"+d.iid+".html";
				})
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.text(function(d) { return d.text; });
			}

    	

		d3.layout.cloud().size([divwidth, 600])
			.words(terms.map(function(d) {
				return {text: d, size: 10 + ingredientAffinities[d][0] * 90, iid:ingredientAffinities[d][1], groupIdx:ingredientAffinities[d][2]};
			}))
			//.words(terms.map(function(d) {
			//        return {text: d, size: 10 + Math.random() * 90};
			//      }))
			.rotate(function() { return ~~(Math.random() * 2) * 0; })
			.font("Helvetica")
			.fontWeight('bold')
			.fontSize(function(d) { return d.size; })
			.on("end", drawIA)
			.start();



    }

    
    if (flavorAffinities) {

    	var terms = Object.keys(flavorAffinities);

		function drawFA(words) {
			d3.select("#affinities").append("svg")
				.attr("width", divwidth)
				.attr("height", 600)
				
				.append("g")
				.attr("transform", "translate("+divwidth/2+","+300+")")
				
				.selectAll("text")
				.data(words)

				.enter().append("text")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("font-family", "Helvetica")
				.style("font-weight", "bold")
				.style("cursor", 'pointer')
				.style("fill", function(d, i) { return flavFill(d.groupIdx); })
				.attr("text-anchor", "middle")
				.on("click", function(d) {
					window.location = "ing-"+d.iid+".html";
				})
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.text(function(d) { return d.text; });
			}

    	

		d3.layout.cloud().size([divwidth, 600])
			.words(terms.map(function(d) {
				return {text: d, size: 10 + flavorAffinities[d][0] * 90, iid:flavorAffinities[d][1], groupIdx:flavorAffinities[d][2]};
			}))
			//.words(terms.map(function(d) {
			//        return {text: d, size: 10 + Math.random() * 90};
			//      }))
			.rotate(function() { return ~~(Math.random() * 2) * 0; })
			.font("Helvetica")
			.fontWeight('bold')
			.fontSize(function(d) { return d.size; })
			.on("end", drawFA)
			.start();



    }

});


function report() {
	for (var key in originAggregate) {
		if (used.indexOf(key)===-1) {
			console.log('MISMATCH: ',key);
		}
	}
}