/* Author: 

*/


$(document).ready(function() {
    // do stuff when DOM is ready
    $.jqplot.config.enablePlugins = true;
    $.jsDate.config.defaultCentury = 2000;

    //var totalentries = [['08-31-2011',2284],['09-04-2011',2406],['09-05-2011',2462],['09-06-2011',2503],['09-10-2011',2572],['09-12-2011',2576],['09-15-2011',2624],['09-17-2011',2656],['09-21-2011',2670],['09-22-2011',2694],['09-24-2011',2713],['09-26-2011',2739],['09-28-2011',2753],['09-30-2011',2777],['10-05-2011',2797],['10-07-2011',2807],['10-14-2011',2853],['10-16-2011',2920],['10-17-2011',2980],['10-18-2011',3009],['10-19-2011',3036],['10-20-2011',3046],['10-23-2011',3058],['10-26-2011',3085],['10-30-2011',3093],['11-03-2011',3110],['11-08-2011',3151],['11-09-2011',3151],['11-15-2011',3187],['11-26-2011',3195],['11-28-2011',3248],['11-29-2011',3296],['11-30-2011',3297],['12-06-2011',3331],['12-09-2011',3338],['12-10-2011',3338],['12-11-2011',3340],['12-14-2011',3343],['12-19-2011',3344],['12-21-2011',3350],['12-29-2011',3367],['12-30-2011',3398],['01-03-2012',3437],['01-06-2012',3462],['01-09-2012',3524],['01-11-2012',3579],['01-17-2012',3593],['01-18-2012',3606],['01-19-2012',3608],['01-21-2012',3629]]
    //var totalbarcodes = [['08-31-2011',3626],['09-04-2011',3733],['09-05-2011',3759],['09-06-2011',3782],['09-10-2011',3832],['09-12-2011',3837],['09-15-2011',3837],['09-17-2011',3886],['09-21-2011',3901],['09-22-2011',3911],['09-24-2011',3927],['09-26-2011',3932],['09-28-2011',3932],['09-30-2011',3933],['10-05-2011',3933],['10-07-2011',3935],['10-14-2011',4021],['10-16-2011',4148],['10-17-2011',4243],['10-18-2011',4312],['10-19-2011',4388],['10-20-2011',4406],['10-23-2011',4418],['10-26-2011',4427],['10-30-2011',4432],['11-03-2011',4328],['11-08-2011',4450],['11-09-2011',4456],['11-15-2011',4457],['11-26-2011',4465],['11-28-2011',4469],['11-29-2011',4469],['11-30-2011',4469],['12-06-2011',4521],['12-09-2011',4534],['12-10-2011',4534],['12-11-2011',4536],['12-14-2011',4538],['12-19-2011',4544],['12-21-2011',4548],['12-29-2011',4570],['12-30-2011',4589],['01-03-2012',4624],['01-06-2012',4668],['01-09-2012',4730],['01-11-2012',4794],['01-17-2012',4806],['01-18-2012',4842],['01-19-2012',4844],['01-21-2012',4860]]

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
                        angle: -30,
                        formatString: '%m/%d/%Y'
                    },

                    tickInterval: '1 month'

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

/*    var plot1 = $.jqplot('chart1', [totalentries, totalbarcodes], {
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
                    angle: -30,
                    formatString: '%m/%d/%Y'
                },

                tickInterval: '1 month'

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


    );*/



});


