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
	log(e1,elementArray);
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
		h = e2pos.top - e1pos.top - e1height * 1.5 + e2height;
		x = e1pos.left + 9;
		y = e1pos.top + e1height * 1.5;
		container.append(createBox('el',w,h,x,y));
	});
}

function rebuildHierarchyBoxes() {
	var section;
	var source;
	var sourceUL;
	var destinations;

	$('section').each( function() {

		$('.el').remove();

		section = $(this);
		
		// handle the root special case
		source = $(this).find('h1')[0];
		sourceUL = $(source).next();
		if (sourceUL !== undefined) {
			destinations = $(sourceUL).children('.abstract, .generic, .weakcat, .adhoc');
			createBoxesForElements( section, $(source), destinations );
		}
		
		
		$(this).find('.abstract, .generic, .weakcat, .adhoc').each( function() {
			source = $(this);
			sourceUL = source.next();
			log( sourceUL);
			if (sourceUL !== undefined) {
				destinations = $(sourceUL).children('.abstract, .generic, .weakcat, .adhoc');
				createBoxesForElements( $(this), $(source), destinations );
			}
		});
		
		
	});
	
}

jQuery(document).ready(function() {

	var filters = $("nav");
	var button;

	// == add a "show all" un-filter option
	/*
	button = $('<div class="toggle">Show All</div>');
	button.click( function() {
		$('#treeContainer').find().show(500);
	});
	filters.append(button);
	*/
	
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

	// == build some section filters
	/*
	var headings;
	var heading;
	var sid;
	$('#treeContainer').children("section").each( function() {

		sid = $(this).attr('id');
		
		button = $('<div class="toggle"></div>');
		button.data("sectionID",sid);
		
		headings = $(this).find('h1');
		headings.each( function() {
			heading = $(this)[0];
			button.text( $(heading).text() );
		});

		// bind
		button.click( function() {
			$('#treeContainer').find('section').hide();
			$('#'+$(this).data('sectionID')).show();
		});
		
		filters.append(button);
	});
	*/

	//$('#treeContainer').append( createBox('el',150,150,50,50) );

	rebuildHierarchyBoxes();

});


