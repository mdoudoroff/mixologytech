// @codekit-prepend "DGLY-jquery-1.7.2.js";
// @codekit-prepend "DGLY-h5bp.js";

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

jQuery(document).ready(function() {

	// == search form crap

	$("#searchFieldFull").val("Search...").addClass("empty");
	
	// When you click on #search
	$("#searchFieldFull").focus(function(){
		
		// If the value is equal to "Search..."
		if($(this).val() === "Search...") {
			// remove all the text and the class of .empty
			$(this).val("").removeClass("empty");
		}
		
	});
	
	// When the focus on #search is lost
	$("#searchFieldFull").blur(function(){
		
		// If the input field is empty
		if($(this).val() === "") {
			// Add the text "Search..." and a class of .empty
			$(this).val("Search...").addClass("empty");
		}
		
	});

	// dynamic search binding (keyup-based)
	// note: returns all results, not just "top" results, so maybe a variant is needed for "drop down"-type results presentation
	$('#searchFieldFull').keyup(function() {
		
		var searchStr = $('#searchFieldFull').val();
		if (searchStr.length > 1) {
			$.getJSON('/search/'+searchStr,function(msg){

				$('#searchResultsFull').empty();

				if (msg.length>0) {

					
					$('#searchResultsFull').append($('<ul>'));

					for (var i = 0; i < msg.length; i++) {
						$('#searchResultsFull').append($('<li><a href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+'</a> ('+msg[i].context+')</li>'));
					}

					$('#searchResultsFull').append($('</ul>'));
				}
				else {
					$('#searchResultsFull').append($('<p><em>No matches. Try searching on the first few letters of a product or category.</em></p>'));
				}
			});
		} else {
			$('#searchResultsFull').empty();
		}
	});





	// lastly, check the query string for an incoming GET
	if (getUrlVars().q) {
		$('#searchFieldFull').val(getUrlVars().q);
		$('#searchFieldFull').keyup();
	}

});


