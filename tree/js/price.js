

window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};

var searchPrompt = 'Search by ingredient name...';

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
		var searchResults = $('#searchResults');
		if (searchStr.length > 0) {
			$('#resetsearch').css('opacity','1.0');
		} else {
			$('#resetsearch').css('opacity','0.5');
		}
		if (searchStr.length > 1) {
			$.getJSON('/search/ing/'+searchStr,function(msg){

				searchResults.empty();

				if (msg.length>0) {

					
					searchResults.append($('<ul>'));

					for (var i = 0; i < 10; i++) {
						if (i < msg.length) {
							searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
						}

					}
					if (msg.length > 10) {
						searchResults.append($('<li class="divider"></li><li><a tabindex="-1" href="/tree/index.html?q='+encodeURIComponent(searchStr)+'"><em>... and '+(msg.length-10)+' more</em></a></li>'));
					}
					searchResults.append($('</ul>'));
					searchResults.show();
				}
				else if (searchStr.length > 0) {
					searchResults.append($('<li><em>No matches. Try searching on the first few letters of a product or category.</em></li>'));
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


	// == PRICE FORM STUFF ==

	$("#pIngredient").val(searchPrompt).addClass("empty");
	
	// When you click on #search
	$("#pIngredient").focus(function(){
		
		// If the value is equal to "Search..."
		if($(this).val() === searchPrompt) {
			// remove all the text and the class of .empty
			$(this).val("").removeClass("empty");
		}
		
	});

	// When the focus on #search is lost
	$("#pIngredient").blur(function(){
		
		// If the input field is empty
		if($(this).val() === "") {
			// Add the text "Search..." and a class of .empty
			$(this).val(searchPrompt).addClass("empty");
		}
		
	});

	// dynamic search binding (keyup-based)
	// note: returns all results, not just "top" results, so maybe a variant is needed for "drop down"-type results presentation
	$('#pIngredient').keyup(function() {
		
		var searchStr = $('#pIngredient').val();
		var searchResults = $('#pIngredientMatches');
		var link;
		if (searchStr.length > 1) {
			$.getJSON('/search/product/'+searchStr,function(msg){

				searchResults.empty();

				if (msg.length>0) {

					
					searchResults.append($('<ul>'));

					for (var i = 0; i < msg.length; i++) {
						link = $('<li><a href="#" tabindex="-1" data-name="'+msg[i].name+'" data-iid="'+msg[i].iid+'">'+msg[i].name+' ('+msg[i].context+')</a></li>');
						searchResults.append(link);
					}

					searchResults.append($('</ul>'));
					searchResults.show();

					$("#pIngredientMatches li a").click(function(){
						$('#pIngredientIID').val($(this).data('iid'));
						$('#pIngredient').val('');
						$('#pIngredientDisplay').val($(this).data('name'));
						searchResults.empty().hide();
					});

				}
				else {
					searchResults.append($('<p><em>No matches. Try searching on the first few letters of a product or category.</em></p>'));
					searchResults.show();
				}
			});
		} else {
			searchResults.empty().hide();
		}
	});

	$('#pRegionSearch').keyup(function() {
			
			var searchStr = $('#pRegionSearch').val();
			var searchResults = $('#pRegionMatches');
			var link;
			if (searchStr.length > 1) {
				$.getJSON('/search/region/'+searchStr,function(msg){

					searchResults.empty();

					if (msg.length>0) {

						searchResults.append($('<ul>'));

						for (var i = 0; i < msg.length; i++) {
							if (msg[i][1].length > 0) {
								link = $('<li><a href="#" tab-index="-1" data-region="'+msg[i][0]+'" data-iso="'+msg[i][2]+'" data-currency="'+msg[i][3]+'">'+msg[i][0]+' ('+msg[i][1]+')</a></li>');
							} else {
								link = $('<li><a href="#" tab-index="-1" data-region="'+msg[i][0]+'" data-iso="'+msg[i][2]+'" data-currency="'+msg[i][3]+'">'+msg[i][0]+'</a></li>');
							}
							searchResults.append(link);
						}

						searchResults.append($('</ul>'));
						searchResults.show();

						$("#pRegionMatches li a").click(function(){
							$('#pRegion').val($(this).data('region'));
							$('#pCurrencyDisplay').val($(this).data('currency')+' ('+$(this).data('iso')+')');
							$('#pCurrency').val($(this).data('iso'));
							$('#pRegionSearch').val('');
							searchResults.empty().hide();
						});

					}
					else {
						searchResults.append($('<p><em>No matches. Try searching on the first few letters of a country or state.</em></p>'));
						searchResults.show();
					}
				});
			} else {
				searchResults.empty().hide();
			}
		});

	$('#pSubmit').click(function() {
		var vals = {
			'iid':$('#pIngredientIID').val(),
			'type':$('input:radio[name=ptype]:checked').val(),
			'price':$('#pPrice').val(),
			'currency':$('#pCurrency').val(),
			'volume':$('#pVol').val(),
			'units':$('#pUnits').val(),
			'region':$('#pRegion').val(),
			'timestamp':new Date().getTime() / 1000
		};
		var jdata = JSON.stringify({'prices':[vals]});
		window.log(jdata);
		jQuery.ajax({
			type:'POST',
            url: '/search/submitprice', // the pyramid server
            data: jdata,
            contentType: 'application/json; charset=utf-8'
        });
        $('#pIngredientIID').val('');
        $('#pPrice').val('');
        $('#pIngredientDisplay').val('');
	});


});


