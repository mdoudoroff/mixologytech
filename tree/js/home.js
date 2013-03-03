
// modified from http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = decodeURIComponent(hash[1]);
    }
    return vars;
}

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
		var searchStrLeadTerm = searchStr.toLowerCase().split(' ')[0];
		var searchResults = $('#searchResultsFull');
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

					searchResults.append('<p class="text-success">' + msg.length+' unique matches for “'+searchStr+'”</p>');

					searchResults.append('<p>Matches that start with “' + searchStr +'”</p>');

					searchResults.append($('<ul class="unstyled">'));

					// first, show matches that begin with the first search term
					for (var i = 0; i < msg.length; i++) {
						if (msg[i].name.toLowerCase().indexOf(searchStrLeadTerm)===0) {
							counter += 1;
							searchResults.append($('<li><a href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+'</a> <span class="context">'+msg[i].context+'</span></li>'));
						}
					}

					// divider, if necessary
					if (counter > 0) {
						searchResults.append($('</ul><br /><ul class="unstyled">'));
					}

					searchResults.append('<p>Matches that contain with “' + searchStr +'”</p>');

					// then list the rest, space allowing
					for (i = 0; i < msg.length; i++) {
						if (msg[i].name.toLowerCase().indexOf(searchStrLeadTerm)!==0) {
							searchResults.append($('<li><a href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+'</a> <span class="context">'+msg[i].context+'</span></li>'));
						}
					}
					searchResults.append($('</ul>'));
					searchResults.show();
				}
				else {
					searchResults.append($('<p class="text-error"><em>No matches. Try searching on the first few letters of a product or category.</em></p>'));
					searchResults.show();
				}
			});
		}
		else {
			searchResults.empty();
			searchResults.hide();
		}
	});


	// reset switch
	$('#resetsearch').click( function() {
		$('#searchResultsFull').empty().hide();
		$('#searchField').val('');
		$('#resetsearch').css('opacity','0.5');
	});

	// lastly, check the query string for an incoming GET
	if (getUrlVars().q) {
		$('#searchField').val(getUrlVars().q.replace('+',' '));
		$('#searchField').keyup();
	}

});


