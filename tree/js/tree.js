/*jshint devel:true */
/*global leafPhotos */
/*global examplePhotos */
/*global ingredientAffinities */
/*global flavorAffinities */
/*global originAggregate */
/*global map_ids */

// @codekit-prepend "d3.layout.cloud.js";
// @codekit-prepend "tsv.js";
// @codekit-prepend "map.js";

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

	// pictures
	var availablePictures = [];
	var picsToLoad;

	// if leaf photos, normalize
	if (leafPhotos.length>0) {
		for (var i=0;i<leafPhotos.length;i++) {
			availablePictures.push({fn:leafPhotos[i],id:'',name:''});			
		}
	} else if (examplePhotos.length>0) {
		availablePictures = examplePhotos;
	}

	if (availablePictures.length<1) {
		$('#topphotos').hide();
	} else {


		var loadmorepics = $('<div id="morepics">Load more<br/><span id="availpics">'+(availablePictures.length)+'</span> available</div>');
		$('#topphotos').append(loadmorepics);

		function loadPics() {
			picsToLoad = 5;
			while (picsToLoad > 0 && availablePictures.length > 0) {
				var d = availablePictures.shift();
				if (d.name.length>0) {
					var img = $('<div class="polaroid"><a href="ing-'+d.id+'.html"><img src="http://ingr-photos.s3.amazonaws.com/'+d.fn+'" height="180" /><p>'+d.name+'</p></a></div>');
				} else {
					var img = $('<div class="polaroid"><a href="http://ingr-photos.s3.amazonaws.com/'+d.fn+'"><img src="http://ingr-photos.s3.amazonaws.com/'+d.fn+'" height="180" /></a></div>');
				}
				
				$('#morepics').before(img);
				picsToLoad -= 1;				
			}
			if (availablePictures.length >= 1) {
				$('#availpics').text(availablePictures.length);
			}
			else {
				$('#morepics').hide();
			}

		}	

		loadmorepics.click(loadPics);
		loadPics();

	}

	console.log(typeof map_ids);
	if (typeof map_ids === 'object' && map_ids.length>0) {
		buildMap(map_ids);
	}
});


jQuery(window).load(function() {

	// ================= map! =================

	//if (! jQuery.isEmptyObject(originAggregate) || ! jQuery.isEmptyObject(activeMapRegions)) {
	//}

    

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
					window.location = "flavor-"+d.iid+".html";
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