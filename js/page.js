
var appsToggleState = 'closed';

jQuery(document).ready(function() {

    $('#syncgridtop').hide();
    setInterval(function() { 
        $('#syncgridtop').fadeToggle(1000);
    }, 3000);


	// global nav stuff

	$('#menuToggle').click(function(event) {
		$('#navApp').slideToggle();
		if (appsToggleState === 'closed') {
			appsToggleState = 'open';
			$("#menuToggle").html('<a href="#">Apps ▾</a>');		
		} else {
			appsToggleState = 'closed';
			$("#menuToggle").html('<a href="#">Apps ▸</a>');
		}
		event.preventDefault();

	});


});