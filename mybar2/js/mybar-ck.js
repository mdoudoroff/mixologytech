jQuery(document).ready(function(){$.getJSON("/aggregates.json",function(e){$(".AgTotalEntries").text(e.totalEntries);$(".AgAvgNewEntries").text(e.averageNewEntries);$(".AgTotalBarcodes").text(e.grandTotalUPCs);$(".AgAvgNewBarcodes").text(e.averageNewBarcodes);$(".AgTotalProprietary").text(e.grandTotalProprietaryEntries);$(".AgTotalPropWithBarcodes").text(e.totalProprietaryEntriesWithUPCs)})});