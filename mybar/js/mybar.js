
jQuery(document).ready(function() {

	// fill in some stuff
	$.getJSON('/aggregates.json', function(data) {

		$('.AgTotalEntries').text(data.totalEntries);

		$('.AgAvgNewEntries').text(data.averageNewEntries);

		$('.AgTotalBarcodes').text(data.grandTotalUPCs);

		$('.AgAvgNewBarcodes').text(data.averageNewBarcodes);

		$('.AgTotalProprietary').text(data.grandTotalProprietaryEntries);

		$('.AgTotalPropWithBarcodes').text(data.totalProprietaryEntriesWithUPCs);

	});




});