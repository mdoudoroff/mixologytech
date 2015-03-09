// @codekit-prepend "smoothslides.js";

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

/*
    $("#kenburns_slideshow").Kenburns({
        images:["/pdt/slides/drink.pdt.ambrosio-cup.jpg",
"/pdt/slides/drink.pdt.bentons-old-fashioned.jpg",
"/pdt/slides/drink.pdt.betula.jpg",
"/pdt/slides/drink.pdt.boite-bloody-mary.jpg",
"/pdt/slides/drink.pdt.brandy-crusta2.jpg",
"/pdt/slides/drink.pdt.brazilian-tea-punch.jpg",
"/pdt/slides/drink.pdt.caprice.jpg",
"/pdt/slides/drink.pdt.cereal-milk.jpg",
"/pdt/slides/drink.pdt.cherry-pop.jpg",
"/pdt/slides/drink.pdt.corn-n-oil.jpg",
"/pdt/slides/drink.pdt.Deep-Purple.jpg",
"/pdt/slides/drink.pdt.dry-prefecture.jpg",
"/pdt/slides/drink.pdt.Green-Thumb.jpg",
"/pdt/slides/drink.pdt.Idle-Hands.jpg",
"/pdt/slides/drink.pdt.jimmy-roosevelt.jpg",
"/pdt/slides/drink.pdt.kina-miele2.jpg",
"/pdt/slides/drink.pdt.lawn-dart.jpg",
"/pdt/slides/drink.pdt.les-globetrotter.jpg",
"/pdt/slides/drink.pdt.lions-tooth.jpg",
"/pdt/slides/drink.pdt.little-squirt-2.jpg",
"/pdt/slides/drink.pdt.Lucky-Peach.jpg",
"/pdt/slides/drink.pdt.Old-Friend-3.jpg",
"/pdt/slides/drink.pdt.Parliament.jpg",
"/pdt/slides/drink.pdt.Pearacea-new.jpg",
"/pdt/slides/drink.pdt.precious-pluot.jpg",
"/pdt/slides/drink.pdt.scanda-panda-2.jpg",
"/pdt/slides/drink.pdt.zombie.jpg"],
        scale:1,
        duration:6000,
        fadeSpeed:800,
        ease3d:'ease-out',
        onSlideComplete: function(){
            console.log('slide ' + this.getSlideIndex());
        },
        onLoadingComplete: function(){
            console.log('image loading complete');
        }
    }); */

});

/* wait for images to load */
jQuery(window).load(function() {
    $(window).smoothSlides({
    duration: 5000,
    order: "random",
    captions: "false",
    navigation: "false",
    pagination: "false"
    });
});