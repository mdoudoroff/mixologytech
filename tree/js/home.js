
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
		var searchResults = $('#searchResultsFull');
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

					for (var i = 0; i < msg.length; i++) {
						if (i < msg.length) {
							searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
						}

					}
					searchResults.append($('</ul>'));
				}
				else if (searchStr.length > 0) {
					searchResults.append($('<li><em>No matches. Try searching on the first few letters of a product or category.</em></li>'));
				} else {
					searchResults.empty();
				}
			});
		}
		else {
			searchResults.empty();
		}
	});


	// reset switch
	$('#resetsearch').click( function() {
		$('#searchResultsFull').empty();
		$('#searchField').val('');
		$('#resetsearch').css('opacity','0.5');
	});

	// lastly, check the query string for an incoming GET
	if (getUrlVars().q) {
		$('#searchField').val(getUrlVars().q);
		$('#searchField').keyup();
	}

});


