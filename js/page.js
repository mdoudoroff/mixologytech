
var appsToggleState = 'closed';

jQuery(document).ready(function() {

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

    // database update graph

    $.jqplot.config.enablePlugins = true;
    $.jsDate.config.defaultCentury = 2000;

    var ajaxDataRenderer = function(url, plot, options) {
      var ret = null;
      $.ajax({
        // have to use synchronous here, else the function 
        // will return before the data is fetched
        async: false,
        url: url,
        dataType:"json",
        success: function(data) {
          ret = [data['entries'],data['upcs']];
        }
      });
      return ret;
    };


    // The url for our json data
    var jsonurl = "/ingr-stats.json";

    var plot1 = $.jqplot('chart1', jsonurl, {
            dataRenderer: ajaxDataRenderer,
            dataRendererOptions: {unusedOptionalUrl: jsonurl},
            seriesDefaults: {
                pointLabels: {
                    show: false,
                }
            },
            seriesColors: [ '#ff0000', '#00ff00'],
            axes: {

                xaxis: {
                    renderer: $.jqplot.DateAxisRenderer,
                    tickRenderer: $.jqplot.CanvasAxisTickRenderer,
                    tickOptions: {
                        angle: -35,
                        formatString: '%m-%d-%Y'
                    },

                    tickInterval: '4 month'

                },
                yaxis: {
                    autoscale: true,
                    tickOptions: {
                        formatString: '%d',
                    }
                }
            },
            highlighter: {
                show: true,
                sizeAdjust: 7.5
            },
            cursor: {
                show: false
            }
        }


        );


});