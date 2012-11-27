// @codekit-prepend "DGLY-jquery-1.7.2.js";
// @codekit-prepend "DGLY-h5bp.js";

function createBox(boxType,width,height,left,top) {
	var box = $('<div class="'+boxType+'"></div>');
	box.css('width',width);
	box.css('height',height);
	box.css('left',left);
	box.css('top',top);
	return box;
}

function createBoxesForElements(container,e1,elementArray) {
	//log(e1,elementArray);
	var e1pos = e1.position();
	var e1height = e1.outerHeight(false);
	
	var e2pos;
	var e2height;
	
	var w;
	var h;
	var x;
	var y;
	elementArray.each( function() {
		e2pos = $(this).position();
		e2height = $(this).outerHeight(false);
		
		w = e2pos.left - e1pos.left - 18;
		h = e2pos.top - e1pos.top - e1height * 1.5 + e2height - 2;
		x = e1pos.left + 9;
		y = e1pos.top + e1height * 1.5;
		container.append(createBox('el',w,h,x,y));
	});
}

function createSubTreeBox(container,e1,elementArray) {
	var e1pos = e1.position();
	var e1height = e1.outerHeight(false);
	
	var e2pos;
	var e2height;
	
	var w;
	var h;
	var x;
	var y;
		
	w = container.width() - e1.width() - 50;
	h = (e1pos.top+e1height/2 - 23)/2;
		
	x = e1.width() + 8;
	y = e1pos.top+e1height/2-h;
		
	container.append(createBox('zeeBottom',w,h,x,y));

	w = 70;
	x = (container.width()-w)+28;
	y = 27;
		
	container.append(createBox('zeeTop',w,h,x,y));
		
}


function rebuildHierarchyBoxes() {

	var section;
	var source;
	var sourceUL;
	var destinations;

	$('section').each( function() {

		// strip out all the "lines"
		$('.el').remove();

		
		
		section = $(this);
		
		// handle the special case connecting the h1 to the first children
		// @@ THIS CODE (the while loop in particular) IS HORSESHIT----REWORK
		source = $(this).find('h1')[0];
		sourceUL = $(source).next();
		var i = 0;
		while (!sourceUL.is('ul')) {
			sourceUL = $(sourceUL).next();
			if (sourceUL === undefined) {
				break;
			}
			i = i + 1;
			if (i > 1000) {
				break;
			}
		}
		if (sourceUL !== undefined) {
			destinations = $(sourceUL).children('li');
			createBoxesForElements( section, $(source), destinations );
		}
		
		// add the lines for the regular parent/child relationships
		var parent;
		$(this).find('.nonproduct').each( function() {

			parent = $(this);
			$(section).find('ul[data-par=' + parent.attr('id') + ']').children('li').each( function() {
				createBoxesForElements( section, $(parent), $(this) );
			});

		});

		
		
	});
	
}

function rebuildSubTreeBox() {
	
	$('.zee').remove();
	
	var section = $('nav')[0];
	var source = $('#selectedSubTree')[0];
	var destinations = $('#sectionHeading');
		
	createSubTreeBox( $(section), $(source), destinations );
	
}

jQuery(document).ready(function() {

	var filters = $("nav");
	var button;

	// == spacer
	filters.append('<br>');
	
	// == add a toggle for proprietary/stub
	button = $('<div class="toggle">Hide products</div>');
	button.click( function() {
		$('.product').hide();
		rebuildHierarchyBoxes();
	});
	filters.append(button);
	button = $('<div class="toggle">Show products</div>');
	button.click( function() {
		$('.product').show();
		rebuildHierarchyBoxes();
	});
	filters.append(button);

	// == spacer
	filters.append('<br>');


	// == hack in the "lines"
	
	rebuildHierarchyBoxes();

	var selected = $('#selectedSubTree');
	if (selected.length) {
		rebuildSubTreeBox();
	}


	// == search form crap

	$("#searchField").val("Search...").addClass("empty");
	
	// When you click on #search
	$("#searchField").focus(function(){
		
		// If the value is equal to "Search..."
		if($(this).val() === "Search...") {
			// remove all the text and the class of .empty
			$(this).val("").removeClass("empty");
		}
		
	});
	
	// When the focus on #search is lost
	$("#searchField").blur(function(){
		
		// If the input field is empty
		if($(this).val() === "") {
			// Add the text "Search..." and a class of .empty
			$(this).val("Search...").addClass("empty");
		}
		
	});

	// dynamic search binding (keyup-based)
	// note: returns all results, not just "top" results, so maybe a variant is needed for "drop down"-type results presentation
	$('#searchField').keyup(function() {
		
		var searchStr = $('#searchField').val();
		var searchResults = $('#searchResults');
		if (searchStr.length > 1) {
			$.getJSON('/search/'+searchStr,function(msg){

				searchResults.empty();

				if (msg.length>0) {

					
					searchResults.append($('<ul>'));

					for (var i = 0; i < 10; i++) {
						if (i < msg.length) {
							searchResults.append($('<li><a href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+'</a> ('+msg[i].context+')</li>'));
						}

					}
					if (msg.length > 10) {
						searchResults.append($('<li><em><a href="/tree/index.html?q='+encodeURIComponent(searchStr)+'">... and '+(msg.length-10)+' more</a></li>'));
					}
					searchResults.append($('</ul>'));
					searchResults.show();
				}
				else if (searchStr.length > 0) {
					searchResults.append($('<p><em>No matches. Try searching on the first few letters of a product or category.</em></p>'));
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

});


