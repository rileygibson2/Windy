//Global
var nS = "http://www.w3.org/2000/svg";
var activeSection; //Which side bar section we are on
var alertMessageShown = false; //Whether a high wind speed alert message has been shown

var animatingOut;
var animatingIn;

var page;

function load() {
	insertLoading(screen.width/2, screen.height/2, true);
	setTimeout(switchSections, 0, 0);
}

function switchSections(i) {
	if (animatingOut||activeSection==i) {
		if (animatingOut) alert('transitioning');
		if (activeSection==i) alert('same section');
		return;
	}
	activeSection = i;

	switch (activeSection) {
		case 0: page = new Dashboard("dashboard");
		case 1: page = new Dashboard("dashboard");
		case 2: page = new Dashboard("dashboard");
		case 3: page = new Dashboard("dashboard");
	}	

	animateExit(0).then(function() {
		$('#effCont').empty(); //Empty container
		//insertLoading(screen.width/2, screen.height/2, true);
			
		//Make request for content
		var req = new XMLHttpRequest();
		req.open('GET', page.contentName+'.html', true);
		req.onreadystatechange = function() {
			if (req.readyState!=4&&req.status!=4) return;
			$('#effCont').html(req.responseText); //Load new elements into container
			page.updatePageData().then(result => page.animateEntrance(0));
		}

		req.send();
	});
}

//Sidebar actions

function hoverSB(i) {
	$('.sbN').eq(i).css('opacity', '1');
	//if (i!=activeSection) $('#sbS').css('opacity', '0.2');
	for (z=0; z<4; z++) {
		if (i!=z) {
			$('.sbN').eq(z).css('opacity', '0.4');
		}
	}
}

function unhoverSB() {
	//$('#sbS').css('opacity', '1');
	for (z=0; z<4; z++) {
		$('.sbN').eq(z).css('opacity', '1');
	}
}

function selectSB(obj, i) {
	unhoverSB();
	//Move the tab indicator
	var a = document.getElementById("sbCont").getBoundingClientRect().top;
	$('#sbS').css("top", obj.getBoundingClientRect().top-a);
	switchSections(i);
}

//Generic functions

function fadeIn(obj) {obj.css("animation", "fadeIn 1s ease-out forwards");}

function fadeOut(obj) {obj.css("animation", "fadeOut 0.5s ease-out forwards");}

function refreshParent(p) {$(p).html($(p).html());}

function animateExit(start) {
	//Animate elements out - nested for loop used because first element is a container for visible modules
	animatingOut = true;
	redAlarmAniKill = true;
	var c1 = $('#effCont').children();
	for (i=0; i<c1.length; i++) {
		var c2 = c1.eq(i).children();
		for (z=c2.length; z>=0; z--) {
			setTimeout(fadeOut, start, c2.eq(z));
			start += 40;
		}
	}

	let promise = new Promise(function (resolve, reject) {
		setTimeout(resolve, start+500);
		animatingOut = false;
	});
	return promise;
}









