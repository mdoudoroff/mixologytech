
var appsToggleState = 'closed';

jQuery(document).ready(function() {

    $('#syncgridtop').hide();
    setInterval(function() { 
        $('#syncgridtop').fadeToggle(1000);
    }, 3000);


	// global nav stuff

	$('#menuToggle').click(function(event) {
		if (appsToggleState === 'closed') {
			appsToggleState = 'open';
			$('#navApp').css('display','flex');
			$("#menuToggle").html('<a href="#">Apps ▾</a>');		
		} else {
			appsToggleState = 'closed';
			$('#navApp').css('display','none');
			$("#menuToggle").html('<a href="#">Apps ▸</a>');
		}
		event.preventDefault();

	});


});