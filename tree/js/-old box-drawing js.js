

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

function createSubTreeBox(container,e1,dest) {
	// container is the div enclosing the left hand tree
	// e1 is the selected item therein

	var e1pos = e1.position();
	var e1height = e1.outerHeight(false);
	
	var w;
	var h;
	var x;
	var y;
		
	// bottom part of zee

	w = container.width() - e1.width() - 50;
	h = (e1pos.top+e1height/2 - 23)/2;
	x = e1pos.left + e1.width() + 8;
	y = e1pos.top+e1height/2-h;
		
	container.prepend(createBox('zeeBottom',w,h,x,y));

	
	x = x + w; // based on positioning of bottom
	y = 27;
	var w2 = dest.position().left - x - 18;
	container.prepend(createBox('zeeTop',w2,h,x,y));
		
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
	
	var section = $('#root')[0];
	var source = $('#selectedSubTree')[0];
	var dest = $('#treeContainer');
	createSubTreeBox( $(section), $(source), $(dest) );
	
}